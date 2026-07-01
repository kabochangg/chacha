import Phaser from "phaser";
import { type ItemId, getInventoryCount, getInventoryValue } from "../data/items";
import { getBagCapacity, getCleaningPower } from "../data/upgrades";
import { loadSave, type SaveData } from "../systems/SaveSystem";
import type { RunResult } from "../types";
import { ActionControls } from "../ui/ActionControls";
import { VirtualPad } from "../ui/VirtualPad";

const TILE = 48;
const MAP_WIDTH = 18;
const MAP_HEIGHT = 20;
const PLAYER_SPEED = 170;
const DODGE_SPEED = 430;
const DODGE_TIME_MS = 130;
const EXIT_CLEAN_RATE = 0.8;

type DebrisKind = {
  name: string;
  hp: number;
  item: ItemId;
  color: number;
};

type DebrisObject = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
  debrisHp: number;
  maxDebrisHp: number;
  itemId: ItemId;
  baseAngle: number;
};

type MaterialObject = Phaser.GameObjects.Star & {
  body: Phaser.Physics.Arcade.Body;
  itemId: ItemId;
};

type EnemyObject = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
  originX: number;
  originY: number;
  patrolAxis: "x" | "y";
  visual: Phaser.GameObjects.Container;
  warning: Phaser.GameObjects.Text;
  core: Phaser.GameObjects.Ellipse;
  shadow: Phaser.GameObjects.Ellipse;
};

type PlayerVisual = {
  root: Phaser.GameObjects.Container;
  hat: Phaser.GameObjects.Ellipse;
  bag: Phaser.GameObjects.Ellipse;
  broom: Phaser.GameObjects.Container;
  parts: Phaser.GameObjects.GameObject[];
};

type TrapObject = {
  body: Phaser.GameObjects.Rectangle;
  mark: Phaser.GameObjects.Text;
};

type HudBar = {
  fill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  width: number;
};

const DEBRIS_KINDS: DebrisKind[] = [
  { name: "小さな瓦礫", hp: 1, item: "stone", color: 0x8a7a61 },
  { name: "壊れた木箱", hp: 2, item: "wood", color: 0x7d5430 },
  { name: "魔物の粘液", hp: 2, item: "slime", color: 0x5fae79 },
  { name: "焦げた床", hp: 3, item: "ash", color: 0x4c4a4d },
  { name: "壊れた宝箱", hp: 3, item: "metal", color: 0xa67536 }
];

export class DungeonScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private playerVisual!: PlayerVisual;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"up" | "left" | "down" | "right", Phaser.Input.Keyboard.Key>;
  private space!: Phaser.Input.Keyboard.Key;
  private shift!: Phaser.Input.Keyboard.Key;
  private eKey!: Phaser.Input.Keyboard.Key;
  private escape!: Phaser.Input.Keyboard.Key;
  private virtualPad!: VirtualPad;
  private controls!: ActionControls;
  private infoText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private hpBar!: HudBar;
  private staminaBar!: HudBar;
  private bagBar!: HudBar;
  private cleanBar!: HudBar;
  private cleaningRing!: Phaser.GameObjects.Graphics;
  private exitZone!: Phaser.GameObjects.Rectangle;
  private exitGlow!: Phaser.GameObjects.Ellipse;
  private exitLabel!: Phaser.GameObjects.Text;
  private exitArrow!: Phaser.GameObjects.Triangle;
  private debris: DebrisObject[] = [];
  private materials!: Phaser.Physics.Arcade.Group;
  private enemies: EnemyObject[] = [];
  private traps: TrapObject[] = [];
  private lastFacing = new Phaser.Math.Vector2(0, 1);
  private dodgingUntil = 0;
  private hp = 100;
  private stamina = 100;
  private damageTaken = 0;
  private cleaned = 0;
  private totalDebris = 0;
  private runInventory: Record<ItemId, number> = { stone: 0, wood: 0, slime: 0, ash: 0, metal: 0 };
  private runStartedAt = 0;
  private lastDamageAt = 0;
  private infoLockedUntil = 0;
  private exitAvailable = false;
  private finished = false;
  private cleaningParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private audioContext?: AudioContext;
  private save!: SaveData;

  constructor() {
    super("DungeonScene");
  }

  create(): void {
    this.resetRunState();
    this.save = loadSave();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.virtualPad?.destroy();
      this.controls?.destroy();
    });

    this.cameras.main.setBackgroundColor("#11141a");
    this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE, MAP_HEIGHT * TILE);
    this.runStartedAt = this.time.now;

    const walls = this.physics.add.staticGroup();
    this.materials = this.physics.add.group();
    this.createDungeon(walls);
    this.createPlayer();
    this.createDustTexture();

    this.physics.add.collider(this.player, walls);
    this.physics.add.overlap(this.player, this.materials, (_, material) => {
      this.collectMaterial(material as MaterialObject);
    });
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE, MAP_HEIGHT * TILE);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as Record<"up" | "left" | "down" | "right", Phaser.Input.Keyboard.Key>;
    this.space = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.escape = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.virtualPad = new VirtualPad(this);
    this.controls = new ActionControls(this);
    this.createHud();
  }

  private resetRunState(): void {
    this.debris = [];
    this.enemies = [];
    this.traps = [];
    this.lastFacing.set(0, 1);
    this.dodgingUntil = 0;
    this.hp = 100;
    this.stamina = 100;
    this.damageTaken = 0;
    this.cleaned = 0;
    this.totalDebris = 0;
    this.runInventory = { stone: 0, wood: 0, slime: 0, ash: 0, metal: 0 };
    this.runStartedAt = 0;
    this.lastDamageAt = 0;
    this.infoLockedUntil = 0;
    this.exitAvailable = false;
    this.finished = false;
    this.cleaningParticles = undefined;
  }

  update(time: number, delta: number): void {
    if (this.finished) return;

    const input = this.getMoveInput();
    const dodgeRequested = Phaser.Input.Keyboard.JustDown(this.shift) || this.controls.consumeDodge();

    if (dodgeRequested && input.lengthSq() > 0 && this.stamina >= 10) {
      this.stamina -= 10;
      this.dodgingUntil = time + DODGE_TIME_MS;
      this.playTone(170, 0.045, "triangle", 0.04);
    }

    const speed = time < this.dodgingUntil ? DODGE_SPEED : PLAYER_SPEED;
    this.player.body.setVelocity(input.x * speed, input.y * speed);

    if (input.lengthSq() > 0.001) this.lastFacing.copy(input);
    this.updatePlayerVisual(time, input);

    this.updateEnemies(time);
    this.checkHazards(time);

    const nearExit = this.exitAvailable && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitZone.x, this.exitZone.y) < 54;
    this.controls.setPrimaryActionMode(nearExit ? "exit" : "clean");
    const cleanPressedThisFrame = this.controls.consumePrimaryPress();
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.eKey) || cleanPressedThisFrame;
    const cleaningHeld = this.space.isDown || this.controls.isCleaning();
    if (nearExit && interactPressed) {
      this.playTone(520, 0.08, "sine", 0.05);
      this.finishRun(true);
      return;
    }

    if (cleaningHeld && !nearExit && this.stamina > 0) {
      this.handleCleaning(delta);
    } else {
      this.cleaningRing.clear();
      if (cleaningHeld && this.stamina <= 0) this.showInfo("スタミナ切れ。少し待とう。", 500);
      this.stamina = Math.min(100, this.stamina + delta * 0.018);
    }

    if (Phaser.Input.Keyboard.JustDown(this.escape)) {
      this.finishRun(false, true);
      return;
    }

    if (this.hp <= 0) {
      this.finishRun(false, true);
      return;
    }

    this.revealExitIfReady();
    this.refreshHud(nearExit);
  }

  private createDungeon(walls: Phaser.Physics.Arcade.StaticGroup): void {
    const floorColors = [0x24252c, 0x2a2a31];

    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const color = floorColors[(x + y) % floorColors.length];
        this.add.rectangle(x * TILE + TILE / 2, y * TILE + TILE / 2, TILE - 2, TILE - 2, color);
      }
    }

    for (let x = 0; x < MAP_WIDTH; x += 1) {
      this.addWall(walls, x, 0);
      this.addWall(walls, x, MAP_HEIGHT - 1);
    }
    for (let y = 1; y < MAP_HEIGHT - 1; y += 1) {
      this.addWall(walls, 0, y);
      this.addWall(walls, MAP_WIDTH - 1, y);
    }

    [
      [4, 4], [5, 4], [6, 4], [10, 4], [11, 4],
      [4, 5], [11, 5], [4, 6], [8, 7], [9, 7],
      [10, 7], [14, 8], [14, 9], [3, 11], [4, 11],
      [5, 11], [9, 12], [10, 12], [11, 12]
    ].forEach(([x, y]) => this.addWall(walls, x, y));

    const debrisTiles = [
      [3, 3], [7, 3], [12, 3], [15, 4], [2, 6],
      [6, 7], [12, 7], [15, 8], [2, 10], [7, 10],
      [13, 11], [6, 13], [14, 14], [3, 15], [10, 15],
      [15, 15], [8, 5], [12, 13], [5, 15], [2, 13]
    ];
    debrisTiles.forEach(([x, y], index) => this.addDebris(x, y, DEBRIS_KINDS[index % DEBRIS_KINDS.length]));
    this.totalDebris = debrisTiles.length;

    this.addTrap(7, 8);
    this.addTrap(13, 5);
    this.addEnemy(6, 9, "x");
    this.addEnemy(13, 10, "y");

    this.exitZone = this.add.rectangle((MAP_WIDTH - 2) * TILE + TILE / 2, (MAP_HEIGHT - 3) * TILE + TILE / 2, 38, 48, 0x4d8f6a)
      .setStrokeStyle(3, 0xa7e8b3, 0.85);
    this.exitGlow = this.add.ellipse(this.exitZone.x, this.exitZone.y + 2, 58, 66, 0x7ce59a, 0.18)
      .setStrokeStyle(2, 0xc6ffd0, 0.45);
    this.exitArrow = this.add.triangle(this.exitZone.x, this.exitZone.y - 48, 0, 0, 34, 0, 17, 24, 0xfff0a8, 0.95)
      .setStrokeStyle(2, 0x4c3819, 0.8);
    this.exitLabel = this.add.text(this.exitZone.x, this.exitZone.y - 72, "出口", {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#f9ffd8",
      fontStyle: "700",
      backgroundColor: "#1c3b26",
      padding: { x: 7, y: 3 }
    }).setOrigin(0.5);
    this.tweens.add({
      targets: [this.exitArrow, this.exitLabel],
      y: "-=5",
      duration: 560,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.setExitVisible(false);
  }

  private addWall(walls: Phaser.Physics.Arcade.StaticGroup, tileX: number, tileY: number): void {
    const wall = this.add.rectangle(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2, TILE, TILE, 0x413427)
      .setStrokeStyle(2, 0x69513a, 0.8);
    walls.add(wall);
    const body = wall.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(TILE, TILE);
    body.updateFromGameObject();
  }

  private addDebris(tileX: number, tileY: number, kind: DebrisKind): void {
    const object = this.add.rectangle(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2, 28, 22, kind.color, 1)
      .setStrokeStyle(2, 0xd3aa72, 0.72)
      .setAngle(Phaser.Math.Between(-12, 12)) as DebrisObject;
    this.physics.add.existing(object);
    object.body.setImmovable(true);
    object.body.setSize(30, 24);
    object.debrisHp = kind.hp;
    object.maxDebrisHp = kind.hp;
    object.itemId = kind.item;
    object.baseAngle = object.angle;
    object.setData("name", kind.name);
    this.debris.push(object);
  }

  private addTrap(tileX: number, tileY: number): void {
    const x = tileX * TILE + TILE / 2;
    const y = tileY * TILE + TILE / 2;
    const trap = this.add.rectangle(x, y, 38, 38, 0xb94035, 0.86)
      .setStrokeStyle(3, 0xffe0a8, 0.8);
    const mark = this.add.text(x, y - 1, "!", {
      fontFamily: "sans-serif",
      fontSize: "24px",
      color: "#fff2c2",
      fontStyle: "900"
    }).setOrigin(0.5);
    this.tweens.add({
      targets: [trap, mark],
      alpha: 0.48,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.traps.push({ body: trap, mark });
  }

  private addEnemy(tileX: number, tileY: number, patrolAxis: "x" | "y"): void {
    const x = tileX * TILE + TILE / 2;
    const y = tileY * TILE + TILE / 2;
    const shadow = this.add.ellipse(0, 14, 42, 16, 0x190b0c, 0.38);
    const glow = this.add.ellipse(0, 1, 39, 31, 0xff7b74, 0.24)
      .setStrokeStyle(2, 0xffe0a8, 0.65);
    const core = this.add.ellipse(0, 0, 33, 27, 0x9b335f, 0.96)
      .setStrokeStyle(3, 0xdc5c52, 0.92);
    const cap = this.add.ellipse(-4, -5, 19, 10, 0xc65172, 0.78);
    const bubbleA = this.add.ellipse(8, 3, 8, 7, 0xff8a92, 0.56);
    const bubbleB = this.add.ellipse(-10, 5, 6, 5, 0x6f2449, 0.55);
    const eyeA = this.add.ellipse(-6, -3, 4, 5, 0xfff2c2, 0.95);
    const eyeB = this.add.ellipse(6, -3, 4, 5, 0xfff2c2, 0.95);
    const warning = this.add.text(0, -21, "!", {
      fontFamily: "sans-serif",
      fontSize: "20px",
      color: "#fff2c2",
      fontStyle: "900",
      stroke: "#5d171d",
      strokeThickness: 3
    }).setOrigin(0.5);
    const visual = this.add.container(x, y, [shadow, glow, core, cap, bubbleA, bubbleB, eyeA, eyeB, warning])
      .setDepth(24);

    const enemy = this.add.rectangle(x, y, 32, 28, 0xdc5c52, 0) as EnemyObject;
    this.physics.add.existing(enemy);
    enemy.body.setImmovable(true);
    enemy.body.setSize(32, 28);
    enemy.originX = enemy.x;
    enemy.originY = enemy.y;
    enemy.patrolAxis = patrolAxis;
    enemy.visual = visual;
    enemy.warning = warning;
    enemy.core = core;
    enemy.shadow = shadow;
    this.enemies.push(enemy);
  }

  private createPlayer(): void {
    const x = TILE * 2.5;
    const y = TILE * 2.5;
    const body = this.add.rectangle(x, y, 28, 34, 0xe8c070, 0);
    this.physics.add.existing(body);
    this.player = body as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    this.player.body.setSize(24, 28);
    this.player.body.setCollideWorldBounds(true);
    this.playerVisual = this.createCleanerVisual(x, y);

    this.cleaningRing = this.add.graphics().setDepth(40);
  }

  private createCleanerVisual(x: number, y: number): PlayerVisual {
    const shadow = this.add.ellipse(0, 17, 25, 9, 0x190b0c, 0.38);
    const bag = this.add.ellipse(-9, 2, 16, 24, 0x7c6548, 1)
      .setStrokeStyle(2, 0x3b2717, 0.92);
    const body = this.add.rectangle(0, 5, 17, 21, 0x607789, 1)
      .setStrokeStyle(2, 0x26313b, 1);
    const apron = this.add.triangle(0, 9, 0, 0, 14, 0, 7, 15, 0x8b5f35, 1)
      .setStrokeStyle(1, 0x3b2717, 0.9);
    const face = this.add.ellipse(0, -6, 15, 13, 0xd8b891, 1)
      .setStrokeStyle(1, 0x3b2717, 0.85);
    const mask = this.add.rectangle(0, -4, 13, 6, 0xe6ddd2, 1)
      .setStrokeStyle(1, 0x6d6257, 0.8);
    const eyeA = this.add.ellipse(-4, -9, 2.5, 3.5, 0x171722, 1);
    const eyeB = this.add.ellipse(4, -9, 2.5, 3.5, 0x171722, 1);
    const hat = this.add.ellipse(0, -15, 24, 12, 0xd6a34d, 1)
      .setStrokeStyle(2, 0x6e4921, 1);
    const hatTop = this.add.ellipse(0, -20, 16, 10, 0xc88d3b, 1)
      .setStrokeStyle(1, 0x6e4921, 0.85);
    const broom = this.createBroomVisual();

    const root = this.add.container(x, y, [
      shadow,
      bag,
      broom,
      body,
      apron,
      face,
      mask,
      eyeA,
      eyeB,
      hat,
      hatTop
    ]).setDepth(28);

    return {
      root,
      hat,
      bag,
      broom,
      parts: [bag, broom, body, apron, face, mask, eyeA, eyeB, hat, hatTop]
    };
  }

  private createBroomVisual(): Phaser.GameObjects.Container {
    const handle = this.add.rectangle(0, 4, 4, 31, 0x8a5a2f, 1)
      .setStrokeStyle(1, 0x3b2717, 0.85)
      .setOrigin(0.5, 0.2);
    const band = this.add.rectangle(0, 22, 9, 4, 0x6aa2cf, 1)
      .setStrokeStyle(1, 0x26313b, 0.85);
    const bristles = this.add.triangle(0, 33, 0, 0, 18, 0, 9, 17, 0xc99b5d, 1)
      .setStrokeStyle(1, 0x5a3d22, 0.9)
      .setOrigin(0.5, 0.3);
    return this.add.container(9, 4, [handle, band, bristles]);
  }

  private createHud(): void {
    const { width } = this.scale;
    const panelX = width / 2;
    this.add.rectangle(panelX, 42, width - 26, 78, 0x171722, 0.82)
      .setStrokeStyle(2, 0xe2b56f, 0.36)
      .setScrollFactor(0)
      .setDepth(90);

    this.hudText = this.add.text(panelX, 12, "", {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#f8e7c7",
      fontStyle: "700",
      align: "center"
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(91);

    this.hpBar = this.createHudBar(23, 39, 154, "HP", 0xd95a4e);
    this.staminaBar = this.createHudBar(23, 61, 154, "STM", 0x68b36f);
    this.bagBar = this.createHudBar(208, 39, 154, "素材", 0xd8a54a);
    this.cleanBar = this.createHudBar(208, 61, 154, "清掃", 0x6aa2cf);

    this.infoText = this.add.text(panelX, 86, "", {
      fontFamily: "sans-serif",
      fontSize: "14px",
      color: "#ffe0a3",
      align: "center",
      fontStyle: "700",
      backgroundColor: "#171722cc",
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(91);
  }

  private getCleanRate(): number {
    return this.totalDebris > 0 ? this.cleaned / this.totalDebris : 0;
  }

  private setExitVisible(visible: boolean): void {
    this.exitZone.setVisible(visible);
    this.exitGlow.setVisible(visible);
    this.exitArrow.setVisible(visible);
    this.exitLabel.setVisible(visible);
  }

  private revealExitIfReady(): void {
    if (this.exitAvailable || this.getCleanRate() < EXIT_CLEAN_RATE) return;

    this.exitAvailable = true;
    this.setExitVisible(true);
    this.exitZone.setScale(0.4);
    this.exitGlow.setScale(0.4);
    this.exitArrow.setScale(0.4);
    this.exitLabel.setScale(0.4);
    this.tweens.add({
      targets: [this.exitZone, this.exitGlow, this.exitArrow, this.exitLabel],
      scale: 1,
      duration: 240,
      ease: "Back.easeOut"
    });
    this.showInfo("清掃率80%達成。出口が開いた。", 1200);
    this.playTone(700, 0.12, "sine", 0.06);
  }

  private handleCleaning(delta: number): void {
    const target = this.findTargetDebris();
    this.stamina = Math.max(0, this.stamina - delta * 0.024);

    if (!target) {
      this.drawCleaningRing(this.player.x + this.lastFacing.x * 34, this.player.y + this.lastFacing.y * 34, 0);
      this.showInfo("近くの残骸に向いて長押し", 250);
      return;
    }

    const previousHp = target.debrisHp;
    target.debrisHp -= (delta / 320) * getCleaningPower(this.save.player.broomLevel);
    const progress = Phaser.Math.Clamp(1 - target.debrisHp / target.maxDebrisHp, 0, 1);
    this.drawCleaningRing(target.x, target.y, progress);
    this.animateDebrisCleaning(target, progress);
    this.emitDust(target.x, target.y, progress);
    this.showInfo(`${target.getData("name")} 清掃中`, 220);

    if (Math.floor(previousHp * 2) !== Math.floor(target.debrisHp * 2)) {
      this.playTone(240 + progress * 120, 0.035, "sawtooth", 0.025);
    }

    if (target.debrisHp <= 0) {
      this.cleaned += 1;
      const x = target.x;
      const y = target.y;
      this.spawnMaterial(target.x, target.y, target.itemId);
      Phaser.Utils.Array.Remove(this.debris, target);
      target.body.enable = false;
      this.emitDust(x, y, 1, 12);
      this.playTone(620, 0.07, "sine", 0.06);
      this.tweens.add({
        targets: target,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        angle: target.baseAngle + 35,
        duration: 160,
        ease: "Back.easeIn",
        onComplete: () => target.destroy()
      });
      this.showInfo(`${target.getData("name")} 完了。素材が出た。`, 700);
    }
  }

  private findTargetDebris(): DebrisObject | undefined {
    let best: DebrisObject | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const object of this.debris) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, object.x, object.y);
      if (distance > 68) continue;

      const toObject = new Phaser.Math.Vector2(object.x - this.player.x, object.y - this.player.y).normalize();
      const dot = toObject.dot(this.lastFacing);
      if (distance > 44 && dot < 0.12) continue;

      const nearBonus = distance <= 44 ? 32 : 0;
      const facingBonus = Math.max(0, dot) * 34;
      const score = distance - nearBonus - facingBonus;
      if (score < bestScore) {
        bestScore = score;
        best = object;
      }
    }

    return best;
  }

  private createHudBar(x: number, y: number, width: number, label: string, color: number): HudBar {
    this.add.rectangle(x, y, width, 10, 0x0f1118, 0.92)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0xf6d39b, 0.25)
      .setScrollFactor(0)
      .setDepth(91);

    const fill = this.add.rectangle(x + 1, y, width - 2, 8, color, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(92);

    const text = this.add.text(x + 5, y - 7, label, {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#fff4df",
      fontStyle: "700"
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(93);

    return { fill, label: text, width: width - 2 };
  }

  private updateHudBar(bar: HudBar, ratio: number, label: string): void {
    bar.fill.displayWidth = Phaser.Math.Clamp(ratio, 0, 1) * bar.width;
    bar.label.setText(label);
  }

  private drawCleaningRing(x: number, y: number, progress: number): void {
    const end = Phaser.Math.DegToRad(-90 + 360 * Phaser.Math.Clamp(progress, 0, 1));
    this.cleaningRing.clear();
    this.cleaningRing.fillStyle(0xffd58f, 0.12);
    this.cleaningRing.fillCircle(x, y, 25);
    this.cleaningRing.lineStyle(5, 0x2a2730, 0.82);
    this.cleaningRing.strokeCircle(x, y, 25);
    this.cleaningRing.lineStyle(5, progress > 0 ? 0xffd58f : 0xb08a5a, progress > 0 ? 0.95 : 0.5);
    this.cleaningRing.beginPath();
    this.cleaningRing.arc(x, y, 25, Phaser.Math.DegToRad(-90), end, false);
    this.cleaningRing.strokePath();
  }

  private animateDebrisCleaning(target: DebrisObject, progress: number): void {
    const pulse = Math.sin(this.time.now / 45) * 0.035;
    const shrink = 1 - progress * 0.18;
    target.setScale(shrink + pulse);
    target.setAngle(target.baseAngle + Math.sin(this.time.now / 38) * (2 + progress * 4));
    target.setAlpha(1 - progress * 0.18);
  }

  private createDustTexture(): void {
    if (!this.textures.exists("dust-speck")) {
      const dust = this.add.graphics();
      dust.fillStyle(0xf1d7aa, 1);
      dust.fillCircle(4, 4, 4);
      dust.generateTexture("dust-speck", 8, 8);
      dust.destroy();
    }

    this.cleaningParticles = this.add.particles(0, 0, "dust-speck", {
      lifespan: 240,
      speed: { min: 18, max: 58 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.55, end: 0 },
      quantity: 1,
      emitting: false
    }).setDepth(35);
  }

  private emitDust(x: number, y: number, progress: number, count = 2): void {
    if (!this.cleaningParticles) return;
    const amount = Math.max(1, Math.round(count + progress * 3));
    this.cleaningParticles.explode(amount, x, y);
  }

  private showInfo(text: string, durationMs: number): void {
    this.infoText.setText(text);
    this.infoLockedUntil = Math.max(this.infoLockedUntil, this.time.now + durationMs);
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, volume: number): void {
    try {
      this.audioContext ??= new AudioContext();
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch {
      // Sound feedback is best-effort; input and visuals are the primary experience.
    }
  }

  private spawnMaterial(x: number, y: number, itemId: ItemId): void {
    const material = this.add.star(x, y, 5, 6, 12, 0xf2d49b, 1)
      .setStrokeStyle(1, 0x3b2717, 0.7) as MaterialObject;
    this.physics.add.existing(material);
    material.itemId = itemId;
    this.materials.add(material);
    material.setScale(0.25);
    this.tweens.add({
      targets: material,
      scale: 1,
      duration: 120,
      ease: "Back.easeOut"
    });
    this.tweens.add({
      targets: material,
      y: y - 10,
      duration: 140,
      ease: "Back.easeOut",
      yoyo: true,
      hold: 30,
      onComplete: () => {
        if (material.active) material.setY(y);
      }
    });
  }

  private collectMaterial(material: MaterialObject): void {
    const capacity = getBagCapacity(this.save.player.bagLevel);
    if (getInventoryCount(this.runInventory) >= capacity) {
      this.showInfo("バッグがいっぱいです。出口へ戻ろう。", 900);
      this.playTone(120, 0.08, "square", 0.035);
      return;
    }

    this.runInventory[material.itemId] += 1;
    this.playTone(760, 0.055, "triangle", 0.045);
    this.showInfo("素材を回収", 420);
    material.destroy();
  }

  private updateEnemies(time: number): void {
    this.enemies = this.enemies.filter((enemy) => enemy.active && enemy.body);

    for (const enemy of this.enemies) {
      const offset = Math.sin(time / 850) * 72;
      if (enemy.patrolAxis === "x") enemy.setX(enemy.originX + offset);
      else enemy.setY(enemy.originY + offset);
      enemy.visual.setPosition(enemy.x, enemy.y);
      const wobble = Math.sin(time / 150);
      enemy.core.setScale(1 + wobble * 0.055, 1 - wobble * 0.045);
      enemy.warning.setScale(1 + Math.max(0, wobble) * 0.12);
      enemy.visual.setAngle(enemy.patrolAxis === "x" ? wobble * 2 : -wobble * 2);
      enemy.body.updateFromGameObject();
    }
  }

  private updatePlayerVisual(time: number, input: Phaser.Math.Vector2): void {
    if (!this.playerVisual) return;

    const moving = input.lengthSq() > 0.001;
    const bob = moving ? Math.sin(time / 115) * 1.6 : Math.sin(time / 420) * 0.45;
    const sway = moving ? Math.sin(time / 130) : 0;
    const facing = this.lastFacing;

    this.playerVisual.root.setPosition(this.player.x, this.player.y + bob);
    this.playerVisual.hat.setY(-15 + sway * 0.9);
    this.playerVisual.bag.setPosition(-9 - facing.x * 2.2, 2 - facing.y * 1.4 - sway * 0.7);
    this.playerVisual.broom.setPosition(facing.x * 10, 4 + facing.y * 6);
    this.playerVisual.broom.setRotation(facing.angle() - Math.PI / 2 + sway * 0.035);
  }

  private checkHazards(time: number): void {
    if (time - this.lastDamageAt < 650 || time < this.dodgingUntil) return;

    const enemyHit = this.enemies.some((enemy) => Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      enemy.getBounds()
    ));
    const trapHit = this.traps.some((trap) => Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      trap.body.getBounds()
    ));

    if (!enemyHit && !trapHit) return;

    const damage = enemyHit ? 12 : 8;
    this.hp = Math.max(0, this.hp - damage);
    this.damageTaken += damage;
    this.lastDamageAt = time;
    this.cameras.main.shake(110, 0.008);
    this.flashPlayerVisual();
    this.showInfo(enemyHit ? `危険な魔物に接触: ${damage}ダメージ` : `危険床を踏んだ: ${damage}ダメージ`, 820);
    this.playTone(95, 0.09, "sawtooth", 0.045);
  }

  private flashPlayerVisual(): void {
    if (!this.playerVisual) return;

    this.tweens.add({
      targets: this.playerVisual.parts,
      alpha: 0.36,
      duration: 55,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        for (const part of this.playerVisual.parts) {
          if ("setAlpha" in part && typeof part.setAlpha === "function") part.setAlpha(1);
        }
      }
    });
  }

  private refreshHud(nearExit: boolean): void {
    const inventoryCount = getInventoryCount(this.runInventory);
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const cleanRate = Math.floor(this.getCleanRate() * 100);
    this.hudText.setText("はじまりの地下道");
    this.updateHudBar(this.hpBar, this.hp / 100, `HP ${Math.ceil(this.hp)}`);
    this.updateHudBar(this.staminaBar, this.stamina / 100, `STM ${Math.ceil(this.stamina)}`);
    this.updateHudBar(this.bagBar, inventoryCount / capacity, `素材 ${inventoryCount}/${capacity}`);
    this.updateHudBar(this.cleanBar, cleanRate / 100, `清掃 ${cleanRate}%`);

    if (nearExit) {
      this.infoText.setText("出口ボタンで帰還");
    } else if (this.exitAvailable && this.time.now >= this.infoLockedUntil) {
      this.infoText.setText("出口が開いた。緑の光へ向かおう");
    } else if (this.time.now >= this.infoLockedUntil) {
      this.infoText.setText(`左スティックで移動 / 清掃80%で出口 (${cleanRate}%)`);
    }
  }

  private finishRun(cleared: boolean, retreated = false): void {
    this.finished = true;
    const cleanRate = this.cleaned / this.totalDebris;
    const earnedMoney = getInventoryValue(this.runInventory);
    const rank = this.getRank(cleared, retreated, cleanRate);
    const result: RunResult = {
      cleared,
      retreated,
      cleaned: this.cleaned,
      totalDebris: this.totalDebris,
      damageTaken: this.damageTaken,
      durationMs: Math.floor(this.time.now - this.runStartedAt),
      inventory: this.runInventory,
      earnedMoney,
      rank
    };

    this.scene.start("ResultScene", result);
  }

  private getRank(cleared: boolean, retreated: boolean, cleanRate: number): RunResult["rank"] {
    if (retreated || !cleared) return cleanRate >= 0.5 ? "C" : "D";
    if (cleanRate >= 0.9 && this.damageTaken <= 15) return "S";
    if (cleanRate >= 0.7) return "A";
    if (cleanRate >= 0.5) return "B";
    return "C";
  }

  private getMoveInput(): Phaser.Math.Vector2 {
    const input = new Phaser.Math.Vector2();
    const pad = this.virtualPad.getDirection();

    input.x += pad.x;
    input.y += pad.y;

    if (this.cursors.left.isDown || this.wasd.left.isDown) input.x -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) input.x += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) input.y -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) input.y += 1;

    if (input.lengthSq() > 1) input.normalize();
    return input;
  }
}
