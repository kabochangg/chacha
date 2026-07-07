import Phaser from "phaser";
import { ASSET_KEYS } from "../data/assets";
import { ITEMS, type ItemId, getInventoryCount, getInventoryValue } from "../data/items";
import { getAttackPower, getBagCapacity, getCleaningPower, getMaxStamina } from "../data/upgrades";
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
const ATTACK_COOLDOWN_MS = 360;
const MAX_RUN_MATERIAL_DROPS = 160;

type DebrisKind = {
  name: string;
  hp: number;
  item: ItemId;
  color: number;
  width: number;
  height: number;
  cleanValue: number;
};

type DebrisObject = Phaser.GameObjects.Image & {
  body: Phaser.Physics.Arcade.Body;
  debrisHp: number;
  maxDebrisHp: number;
  itemId: ItemId;
  baseAngle: number;
  baseScale: number;
  cleanValue: number;
  fullTexture: string;
  halfTexture: string;
};

type MaterialObject = Phaser.GameObjects.Image & {
  body: Phaser.Physics.Arcade.Body;
  itemId: ItemId;
  collected: boolean;
  baseScale: number;
  shadow: Phaser.GameObjects.Ellipse;
};

type EnemyObject = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
  originX: number;
  originY: number;
  phase: number;
  pattern: "loop" | "wave";
  hp: number;
  maxHp: number;
  dropItem: ItemId;
  visual: Phaser.GameObjects.Container;
  warning: Phaser.GameObjects.Image;
  core: Phaser.GameObjects.Image;
  idleTexture: string;
  alertTexture: string;
  visualBaseScale: number;
  warningBaseScale: number;
  alerted: boolean;
  facingX: number;
  facingY: number;
};

type PlayerVisual = {
  root: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  bag: Phaser.GameObjects.Image;
  broom: Phaser.GameObjects.Image;
  parts: Phaser.GameObjects.GameObject[];
};

type FacingDirection = "down" | "left" | "right" | "up";

type TrapObject = {
  body: Phaser.GameObjects.Rectangle;
  mark: Phaser.GameObjects.Image;
};

type HudBar = {
  fill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  width: number;
};

type DungeonRunState = {
  floor?: number;
  runInventory?: Record<ItemId, number>;
  materialDropsSpawned?: number;
  runStartedAt?: number;
  damageTaken?: number;
  cleaned?: number;
  totalDebris?: number;
};

const DEBRIS_KINDS: DebrisKind[] = [
  { name: "小石の山", hp: 1, item: "stone", color: 0x8a7a61, width: 30, height: 20, cleanValue: 5 },
  { name: "粘液の跡", hp: 2, item: "slime", color: 0x5fae79, width: 36, height: 22, cleanValue: 10 },
  { name: "壊れた木箱", hp: 2, item: "wood", color: 0x7d5430, width: 38, height: 27, cleanValue: 10 },
  { name: "焦げた灰", hp: 3, item: "ash", color: 0x4c4a4d, width: 40, height: 24, cleanValue: 15 },
  { name: "壊れた宝箱", hp: 3, item: "metal", color: 0xa67536, width: 44, height: 31, cleanValue: 15 }
];

const DEBRIS_TEXTURES: Record<ItemId, { full: string; half: string }> = {
  stone: { full: ASSET_KEYS.debris.smallStone, half: ASSET_KEYS.debris.smallStoneHalf },
  slime: { full: ASSET_KEYS.debris.slimeTrail, half: ASSET_KEYS.debris.slimeTrailHalf },
  wood: { full: ASSET_KEYS.debris.brokenCrate, half: ASSET_KEYS.debris.brokenCrateHalf },
  ash: { full: ASSET_KEYS.debris.burntAsh, half: ASSET_KEYS.debris.burntAshHalf },
  metal: { full: ASSET_KEYS.debris.brokenChest, half: ASSET_KEYS.debris.brokenChestHalf }
};

const ITEM_TEXTURES: Record<ItemId, string> = {
  stone: ASSET_KEYS.item.stone,
  wood: ASSET_KEYS.item.wood,
  slime: ASSET_KEYS.item.slime,
  ash: ASSET_KEYS.item.ash,
  metal: ASSET_KEYS.item.metal
};

const ENEMY_TEXTURES: Record<ItemId, { idle: string; alert: string }> = {
  stone: { idle: ASSET_KEYS.enemy.caveWatcher, alert: ASSET_KEYS.enemy.caveWatcherAlert },
  wood: { idle: ASSET_KEYS.enemy.caveWatcher, alert: ASSET_KEYS.enemy.caveWatcherAlert },
  slime: { idle: ASSET_KEYS.enemy.slimeHazard, alert: ASSET_KEYS.enemy.slimeHazardAlert },
  ash: { idle: ASSET_KEYS.enemy.ashWisp, alert: ASSET_KEYS.enemy.ashWispAlert },
  metal: { idle: ASSET_KEYS.enemy.caveWatcher, alert: ASSET_KEYS.enemy.caveWatcherAlert }
};

const ITEM_IDS: ItemId[] = ["stone", "wood", "slime", "ash", "metal"];

export class DungeonScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private playerVisual!: PlayerVisual;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"up" | "left" | "down" | "right", Phaser.Input.Keyboard.Key>;
  private space!: Phaser.Input.Keyboard.Key;
  private shift!: Phaser.Input.Keyboard.Key;
  private eKey!: Phaser.Input.Keyboard.Key;
  private jKey!: Phaser.Input.Keyboard.Key;
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
  private exitVisual!: Phaser.GameObjects.Image;
  private exitGlow!: Phaser.GameObjects.Ellipse;
  private exitLabel!: Phaser.GameObjects.Text;
  private exitArrow!: Phaser.GameObjects.Triangle;
  private pauseLayer?: Phaser.GameObjects.Container;
  private blockedTiles = new Set<string>();
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
  private cleanScore = 0;
  private runInventory: Record<ItemId, number> = { stone: 0, wood: 0, slime: 0, ash: 0, metal: 0 };
  private materialDropsSpawned = 0;
  private runStartedAt = 0;
  private lastDamageAt = 0;
  private lastAttackAt = 0;
  private infoLockedUntil = 0;
  private exitAvailable = false;
  private finished = false;
  private paused = false;
  private cleaningActive = false;
  private cleaningTarget?: DebrisObject;
  private cleaningParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private discardAmounts: Record<ItemId, number> = { stone: 1, wood: 1, slime: 1, ash: 1, metal: 1 };
  private audioContext?: AudioContext;
  private save!: SaveData;
  private floor = 1;
  private maxFloor = 5;
  private startTile = { x: 2.5, y: 2.5 };
  private maxStamina = 100;

  constructor() {
    super("DungeonScene");
  }

  init(data?: DungeonRunState): void {
    this.floor = Phaser.Math.Clamp(Number(data?.floor ?? 1), 1, this.maxFloor);
    this.runInventory = this.cloneInventory(data?.runInventory);
    this.materialDropsSpawned = Number(data?.materialDropsSpawned ?? 0);
    this.runStartedAt = Number(data?.runStartedAt ?? 0);
    this.damageTaken = Number(data?.damageTaken ?? 0);
    this.cleaned = Number(data?.cleaned ?? 0);
    this.totalDebris = Number(data?.totalDebris ?? 0);
  }

  private cloneInventory(source?: Partial<Record<ItemId, number>>): Record<ItemId, number> {
    return {
      stone: Number(source?.stone ?? 0),
      wood: Number(source?.wood ?? 0),
      slime: Number(source?.slime ?? 0),
      ash: Number(source?.ash ?? 0),
      metal: Number(source?.metal ?? 0)
    };
  }

  create(): void {
    this.resetRunState();
    this.save = loadSave();
    this.maxStamina = getMaxStamina(this.save.player.staminaLevel);
    this.stamina = this.maxStamina;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.virtualPad?.destroy();
      this.controls?.destroy();
    });

    this.cameras.main.setBackgroundColor("#11141a");
    this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE, MAP_HEIGHT * TILE);
    if (this.runStartedAt <= 0) this.runStartedAt = this.time.now;

    const walls = this.physics.add.staticGroup();
    this.materials = this.physics.add.group();
    this.createDungeon(walls);
    this.createPlayer();
    this.createDustTexture();

    this.physics.add.collider(this.player, walls);
    this.physics.add.collider(this.player, this.debris);
    this.physics.add.overlap(this.player, this.materials, (_, material) => {
      this.collectMaterial(material as MaterialObject);
    });
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    this.cameras.main.removeBounds();

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
    this.jKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.escape = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.virtualPad = new VirtualPad(this, this.save.settings.controlLayout);
    this.controls = new ActionControls(this, this.save.settings.controlLayout);
    this.createHud();
  }

  update(time: number, delta: number): void {
    if (this.finished) return;

    if (this.paused) {
      this.player.body.setVelocity(0, 0);
      if (Phaser.Input.Keyboard.JustDown(this.escape) || this.controls.consumePause()) this.closePauseMenu();
      return;
    }

    if (this.controls.consumePause() || Phaser.Input.Keyboard.JustDown(this.escape)) {
      this.openPauseMenu();
      return;
    }

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

    const nearExit = this.exitAvailable && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitZone.x, this.exitZone.y) < 58;
    this.controls.setPrimaryActionMode(nearExit ? "exit" : "clean");
    this.controls.setCleaningActive(!nearExit && this.cleaningActive);
    const primaryPressed = this.controls.consumePrimaryPress();
    const cleanPressed = Phaser.Input.Keyboard.JustDown(this.space) || primaryPressed;
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.eKey) || primaryPressed;
    const attackRequested = Phaser.Input.Keyboard.JustDown(this.jKey) || this.controls.consumeAttack();

    if (attackRequested) this.handleAttack(time);

    if (nearExit && interactPressed) {
      this.playTone(520, 0.08, "sine", 0.05);
      this.finishRun(true);
      return;
    }

    if (nearExit && this.cleaningActive) this.stopCleaning();
    if (!nearExit && cleanPressed) this.toggleCleaning();

    if (this.cleaningActive && !nearExit) {
      if (this.stamina > 0) {
        this.handleCleaning(delta);
      } else {
        this.stopCleaning("スタミナ切れ。少し待とう。", 500);
      }
    } else {
      this.decayDebrisProgress(delta);
      this.cleaningRing.clear();
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 0.018);
    }

    if (this.hp <= 0) {
      this.finishRun(false, true);
      return;
    }

    this.revealExitIfReady();
    this.refreshHud(nearExit);
  }

  private resetRunState(): void {
    this.debris = [];
    this.enemies = [];
    this.traps = [];
    this.lastFacing.set(0, 1);
    this.dodgingUntil = 0;
    this.hp = 100;
    this.stamina = 100;
    this.cleanScore = 0;
    this.lastDamageAt = 0;
    this.lastAttackAt = 0;
    this.infoLockedUntil = 0;
    this.exitAvailable = false;
    this.finished = false;
    this.paused = false;
    this.cleaningActive = false;
    this.cleaningTarget = undefined;
    this.pauseLayer = undefined;
    this.blockedTiles.clear();
    this.cleaningParticles = undefined;
    this.discardAmounts = { stone: 1, wood: 1, slime: 1, ash: 1, metal: 1 };
  }

  private createDungeon(walls: Phaser.Physics.Arcade.StaticGroup): void {
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const color = (x + y) % 2 === 0 ? 0x24252c : 0x2a2a31;
        this.add.rectangle(x * TILE + TILE / 2, y * TILE + TILE / 2, TILE - 2, TILE - 2, color);
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, ASSET_KEYS.dungeon.floorStone)
          .setDisplaySize(TILE, TILE)
          .setAlpha(0.24)
          .setDepth(0);
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

    this.getFloorWallTiles().forEach(([x, y]) => this.addWall(walls, x, y));

    const startCandidates = [
      [2.5, 2.5], [3.5, 8.5], [6.5, 2.5], [2.5, 14.5], [8.5, 15.5]
    ];
    const start = Phaser.Utils.Array.GetRandom(startCandidates);
    this.startTile = { x: start[0], y: start[1] };

    const debrisTiles = Phaser.Utils.Array.Shuffle([
      [3, 3], [7, 3], [12, 3], [15, 4], [2, 6],
      [6, 7], [12, 7], [15, 8], [2, 10], [7, 10],
      [13, 11], [6, 13], [14, 14], [3, 15], [10, 15],
      [15, 15], [8, 5], [12, 13], [5, 15], [2, 13], [16, 12],
      [8, 17], [13, 16], [6, 16], [16, 6]
    ]).slice(0, 16 + this.floor);
    debrisTiles.forEach(([x, y], index) => {
      const kindIndex = (index + this.floor + Phaser.Math.Between(0, DEBRIS_KINDS.length - 1)) % DEBRIS_KINDS.length;
      this.addDebris(x, y, DEBRIS_KINDS[kindIndex]);
    });
    this.totalDebris += debrisTiles.length;

    this.addTrap(7, 8);
    this.addTrap(13, 5);
    const enemyTiles = Phaser.Utils.Array.Shuffle([
      [6, 9], [13, 10], [15, 6], [4, 14], [11, 15], [3, 7], [15, 14]
    ]);
    const enemyCount = this.getEnemyCountForFloor();
    const enemyDrops: ItemId[] = ["slime", "ash", "metal"];
    enemyTiles.slice(0, enemyCount).forEach(([x, y], index) => {
      this.addEnemy(x, y, index % 2 === 0 ? "loop" : "wave", enemyDrops[index % enemyDrops.length]);
    });
    this.createExit();
  }

  private getFloorWallTiles(): Array<[number, number]> {
    const wallsByFloor: Record<number, Array<[number, number]>> = {
      1: [
        [5, 4], [10, 4], [4, 6],
        [4, 11], [10, 12], [11, 12]
      ],
      2: [
        [4, 4], [5, 4], [6, 4], [10, 4],
        [11, 5], [4, 6], [9, 7],
        [14, 8], [3, 11], [4, 11], [10, 12], [11, 12]
      ],
      3: [
        [4, 4], [5, 4], [10, 4], [11, 4],
        [4, 5], [4, 6], [8, 7], [9, 7], [10, 7],
        [14, 8], [3, 11], [4, 11], [5, 11],
        [9, 12], [10, 12]
      ],
      4: [
        [4, 4], [5, 4], [6, 4], [10, 4], [11, 4],
        [4, 5], [11, 5], [4, 6], [8, 7], [9, 7], [10, 7],
        [14, 8], [14, 9], [3, 11], [4, 11], [5, 11],
        [9, 12], [10, 12], [11, 12], [12, 14]
      ],
      5: [
        [4, 4], [5, 4], [6, 4], [10, 4], [11, 4],
        [4, 5], [11, 5], [4, 6], [8, 7], [9, 7], [10, 7],
        [14, 8], [14, 9], [3, 11], [4, 11], [5, 11],
        [9, 12], [10, 12], [11, 12], [12, 14],
        [7, 14], [12, 15], [15, 10]
      ]
    };

    return wallsByFloor[this.floor] ?? wallsByFloor[1];
  }

  private getEnemyCountForFloor(): number {
    if (this.floor <= 2) return Phaser.Math.Between(2, 3);
    if (this.floor === 3) return Phaser.Math.Between(2, 4);
    if (this.floor === 4) return Phaser.Math.Between(3, 5);
    return Phaser.Math.Between(4, 5);
  }

  private addWall(walls: Phaser.Physics.Arcade.StaticGroup, tileX: number, tileY: number): void {
    const wall = this.add.rectangle(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2, TILE, TILE, 0x413427)
      .setStrokeStyle(2, 0x69513a, 0.8)
      .setAlpha(0.12);
    this.add.image(wall.x, wall.y, ASSET_KEYS.dungeon.wallStone)
      .setDisplaySize(TILE + 3, TILE + 3)
      .setAlpha(0.9)
      .setDepth(5);
    walls.add(wall);
    this.blockedTiles.add(`${tileX},${tileY}`);
    const body = wall.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(TILE, TILE);
    body.updateFromGameObject();
  }

  private addDebris(tileX: number, tileY: number, kind: DebrisKind): void {
    const textures = DEBRIS_TEXTURES[kind.item];
    const x = tileX * TILE + TILE / 2;
    const y = tileY * TILE + TILE / 2;
    this.add.ellipse(x, y + 13, kind.width + 16, 12, 0x190b0c, 0.34)
      .setDepth(15);
    this.add.ellipse(x, y, kind.width + 18, kind.height + 16, kind.color, 0.1)
      .setStrokeStyle(1, 0xf2d49b, 0.16)
      .setDepth(15);
    const object = this.add.image(x, y, textures.full)
      .setAngle(Phaser.Math.Between(-12, 12))
      .setDepth(16) as DebrisObject;
    const baseScale = Math.min((kind.width + 20) / object.width, (kind.height + 18) / object.height);
    object.setScale(baseScale);
    this.physics.add.existing(object);
    object.body.setImmovable(true);
    object.body.setSize(kind.width + 4, kind.height + 4);
    object.debrisHp = kind.hp;
    object.maxDebrisHp = kind.hp;
    object.itemId = kind.item;
    object.baseAngle = object.angle;
    object.baseScale = baseScale;
    object.cleanValue = kind.cleanValue;
    object.fullTexture = textures.full;
    object.halfTexture = textures.half;
    object.setData("name", kind.name);
    this.debris.push(object);
  }

  private addTrap(tileX: number, tileY: number): void {
    const x = tileX * TILE + TILE / 2;
    const y = tileY * TILE + TILE / 2;
    const trap = this.add.rectangle(x, y, 38, 38, 0xb94035, 0.86)
      .setStrokeStyle(3, 0xffe0a8, 0.8);
    const mark = this.add.image(x, y - 2, ASSET_KEYS.effect.alertMark)
      .setDisplaySize(16, 36)
      .setDepth(23);
    this.tweens.add({ targets: [trap, mark], alpha: 0.48, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.traps.push({ body: trap, mark });
  }

  private addEnemy(tileX: number, tileY: number, pattern: EnemyObject["pattern"], dropItem: ItemId): void {
    const x = tileX * TILE + TILE / 2;
    const y = tileY * TILE + TILE / 2;
    const textures = ENEMY_TEXTURES[dropItem];
    const shadow = this.add.ellipse(0, 14, 42, 16, 0x190b0c, 0.38);
    const glow = this.add.ellipse(0, 1, 46, 37, 0xff7b74, 0.24).setStrokeStyle(2, 0xffe0a8, 0.58);
    const core = this.add.image(0, 0, textures.idle);
    const visualBaseScale = Math.min(44 / core.width, 42 / core.height);
    core.setScale(visualBaseScale);
    const warning = this.add.image(0, -32, ASSET_KEYS.effect.alertMark)
      .setVisible(false);
    const warningBaseScale = Math.min(17 / warning.width, 34 / warning.height);
    warning.setScale(warningBaseScale);
    const visual = this.add.container(x, y, [shadow, glow, core, warning]).setDepth(24);
    const enemy = this.add.rectangle(x, y, 32, 28, 0xdc5c52, 0) as EnemyObject;
    this.physics.add.existing(enemy);
    enemy.body.setImmovable(true);
    enemy.body.setSize(34, 30);
    enemy.originX = enemy.x;
    enemy.originY = enemy.y;
    enemy.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    enemy.pattern = pattern;
    enemy.hp = 2 + Math.floor(this.floor / 3);
    enemy.maxHp = enemy.hp;
    enemy.dropItem = dropItem;
    enemy.visual = visual;
    enemy.warning = warning;
    enemy.core = core;
    enemy.idleTexture = textures.idle;
    enemy.alertTexture = textures.alert;
    enemy.visualBaseScale = visualBaseScale;
    enemy.warningBaseScale = warningBaseScale;
    enemy.alerted = false;
    enemy.facingX = 1;
    enemy.facingY = 0;
    this.enemies.push(enemy);
  }

  private createExit(): void {
    const exitTile = this.getRandomExitTile();
    const exitX = exitTile.x * TILE + TILE / 2;
    const exitY = exitTile.y * TILE + TILE / 2;
    this.exitZone = this.add.rectangle(exitX, exitY, 40, 50, 0x4d8f6a)
      .setStrokeStyle(3, 0xa7e8b3, 0.85)
      .setAlpha(0.08);
    this.exitVisual = this.add.image(this.exitZone.x, this.exitZone.y, ASSET_KEYS.dungeon.exit)
      .setDisplaySize(42, 58)
      .setDepth(14);
    this.exitGlow = this.add.ellipse(this.exitZone.x, this.exitZone.y + 2, 62, 70, 0x7ce59a, 0.2)
      .setStrokeStyle(2, 0xc6ffd0, 0.45);
    this.exitArrow = this.add.triangle(this.exitZone.x, this.exitZone.y - 48, 0, 0, 34, 0, 17, 24, 0xfff0a8, 0.95)
      .setStrokeStyle(2, 0x4c3819, 0.8);
    this.exitLabel = this.add.text(this.exitZone.x, this.exitZone.y - 72, "出口", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#f9ffd8",
      fontStyle: "700",
      backgroundColor: "#1c3b26",
      padding: { x: 7, y: 3 }
    }).setOrigin(0.5);
    this.tweens.add({ targets: [this.exitVisual, this.exitArrow, this.exitLabel], y: "-=5", duration: 560, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.setExitVisible(false);
  }

  private getRandomExitTile(): { x: number; y: number } {
    const candidates = Phaser.Utils.Array.Shuffle([
      [16, 15], [15, 3], [3, 16], [10, 16], [16, 6],
      [2, 12], [12, 3], [14, 13], [8, 14], [5, 7]
    ]);
    const startX = Math.floor(this.startTile.x);
    const startY = Math.floor(this.startTile.y);
    const debrisTiles = new Set(this.debris.map((debris) => `${Math.floor(debris.x / TILE)},${Math.floor(debris.y / TILE)}`));
    const valid = candidates.find(([x, y]) => {
      const key = `${x},${y}`;
      const distanceFromStart = Math.abs(x - startX) + Math.abs(y - startY);
      return distanceFromStart >= 7 && !this.blockedTiles.has(key) && !debrisTiles.has(key);
    });

    const [x, y] = valid ?? [MAP_WIDTH - 2, MAP_HEIGHT - 3];
    return { x, y };
  }

  private createPlayer(): void {
    const x = TILE * this.startTile.x;
    const y = TILE * this.startTile.y;
    const body = this.add.rectangle(x, y, 28, 34, 0xe8c070, 0);
    this.physics.add.existing(body);
    this.player = body as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    this.player.body.setSize(24, 28);
    this.player.body.setCollideWorldBounds(true);
    this.playerVisual = this.createCleanerVisual(x, y);
    this.cleaningRing = this.add.graphics().setDepth(40);
  }

  private createCleanerVisual(x: number, y: number): PlayerVisual {
    const broomLevel = this.save?.player.broomLevel ?? 1;
    const bagLevel = this.save?.player.bagLevel ?? 1;
    const shadow = this.add.ellipse(0, 17, 25, 9, 0x190b0c, 0.38);
    const bag = this.add.image(-12, 5, ASSET_KEYS.player.bag)
      .setScale(Math.min((17 + bagLevel * 2) / 227, (22 + bagLevel * 2) / 224))
      .setAlpha(0.94);
    const broom = this.add.image(11, 6, ASSET_KEYS.player.broom)
      .setScale(Math.min((13 + broomLevel * 2) / 234, (35 + broomLevel * 3) / 296))
      .setOrigin(0.5, 0.2);
    const sprite = this.add.image(0, 0, ASSET_KEYS.player.cleaner)
      .setScale(Math.min(33 / 283, 43 / 394));
    const root = this.add.container(x, y, [shadow, bag, broom, sprite]).setDepth(28);
    return { root, sprite, bag, broom, parts: [bag, broom, sprite] };
  }

  private createBroomVisual(level: number): Phaser.GameObjects.Container {
    const handle = this.add.rectangle(0, 4, 4, 31 + level * 2, level >= 3 ? 0xa36d35 : 0x8a5a2f, 1)
      .setStrokeStyle(1, 0x3b2717, 0.85)
      .setOrigin(0.5, 0.2);
    const band = this.add.rectangle(0, 22, 9 + level, 4, 0x6aa2cf, 1).setStrokeStyle(1, 0x26313b, 0.85);
    const bristles = this.add.triangle(0, 33, 0, 0, 18 + level * 2, 0, 9 + level, 17, 0xc99b5d, 1)
      .setStrokeStyle(1, 0x5a3d22, 0.9)
      .setOrigin(0.5, 0.3);
    return this.add.container(9, 4, [handle, band, bristles]);
  }

  private createHud(): void {
    const { width } = this.scale;
    const compact = width < 430;
    const panelX = width / 2;
    const panelHeight = compact ? 84 : 78;
    const leftBarWidth = compact ? 148 : 154;
    const rightBarWidth = compact ? 108 : 154;
    const rightBarX = compact ? width - 176 : Math.max(188, width - 178);

    this.add.rectangle(panelX, 42, width - 26, panelHeight, 0x171722, 0.84)
      .setStrokeStyle(2, 0xe2b56f, 0.36)
      .setScrollFactor(0)
      .setDepth(90);
    this.hudText = this.add.text(panelX, 12, "", {
      fontFamily: "sans-serif",
      fontSize: compact ? "16px" : "17px",
      color: "#f8e7c7",
      fontStyle: "700",
      align: "center"
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(91);

    this.hpBar = this.createHudBar(23, 39, leftBarWidth, "HP", 0xd95a4e);
    this.staminaBar = this.createHudBar(23, 61, leftBarWidth, "STM", 0x68b36f);
    this.bagBar = this.createHudBar(rightBarX, 39, rightBarWidth, "素材", 0xd8a54a);
    this.cleanBar = this.createHudBar(rightBarX, 61, rightBarWidth, "清掃", 0x6aa2cf);

    this.infoText = this.add.text(panelX, compact ? 91 : 86, "", {
      fontFamily: "sans-serif",
      fontSize: compact ? "15px" : "16px",
      color: "#ffe0a3",
      align: "center",
      fontStyle: "700",
      backgroundColor: "#171722cc",
      padding: { x: 8, y: 3 },
      wordWrap: { width: width - 70 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(91);
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
      fontSize: width < 130 ? "13px" : "14px",
      color: "#fff4df",
      fontStyle: "700",
      stroke: "#171722",
      strokeThickness: 2
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(93);
    return { fill, label: text, width: width - 2 };
  }

  private handleCleaning(delta: number): void {
    const target = this.getActiveCleaningTarget();
    this.stamina = Math.max(0, this.stamina - delta * 0.024);
    if (!target) {
      this.stopCleaning("掃除できる距離を離れた", 450);
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
      this.completeDebris(target);
      this.cleaningTarget = undefined;
      const nextTarget = this.findTargetDebris();
      if (nextTarget) {
        this.cleaningTarget = nextTarget;
        this.showInfo(`${nextTarget.getData("name")} 掃除開始`, 360);
      } else {
        this.stopCleaning();
      }
    }
  }

  private toggleCleaning(): void {
    if (this.cleaningActive) {
      this.stopCleaning("掃除を中断", 360);
      return;
    }

    const target = this.findTargetDebris();
    if (!target) {
      this.drawCleaningRing(this.player.x + this.lastFacing.x * 34, this.player.y + this.lastFacing.y * 34, 0);
      this.showInfo("残骸に近づいて掃除ボタン", 520);
      return;
    }

    this.cleaningActive = true;
    this.cleaningTarget = target;
    this.controls.setCleaningActive(true);
    this.showInfo(`${target.getData("name")} 掃除開始`, 360);
  }

  private stopCleaning(message?: string, duration = 300): void {
    const wasCleaning = this.cleaningActive;
    this.cleaningActive = false;
    this.cleaningTarget = undefined;
    this.controls?.setCleaningActive(false);
    this.cleaningRing?.clear();
    if (message && wasCleaning) this.showInfo(message, duration);
  }

  private getActiveCleaningTarget(): DebrisObject | undefined {
    const target = this.cleaningTarget;
    if (target?.active && target.body?.enable && this.isDebrisInCleaningRange(target)) return target;
    return undefined;
  }

  private isDebrisInCleaningRange(target: DebrisObject): boolean {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y) <= 72;
  }

  private completeDebris(target: DebrisObject): void {
    this.cleaned += 1;
    this.cleanScore = Math.min(100, this.cleanScore + target.cleanValue);
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
      scaleX: target.baseScale * 0.2,
      scaleY: target.baseScale * 0.2,
      angle: target.baseAngle + 35,
      duration: 160,
      ease: "Back.easeIn",
      onComplete: () => target.destroy()
    });
    this.showInfo(`${target.getData("name")} 完了 +${target.cleanValue}%`, 700);
  }

  private decayDebrisProgress(delta: number): void {
    for (const object of this.debris) {
      if (object.debrisHp >= object.maxDebrisHp) continue;
      object.debrisHp = Math.min(object.maxDebrisHp, object.debrisHp + object.maxDebrisHp * (delta / 2400));
      const progress = Phaser.Math.Clamp(1 - object.debrisHp / object.maxDebrisHp, 0, 1);
      object.setTexture(progress >= 0.5 ? object.halfTexture : object.fullTexture);
      object.setScale(object.baseScale * (1 - progress * 0.18));
      object.setAlpha(1 - progress * 0.18);
      object.setAngle(object.baseAngle);
    }
  }

  private handleAttack(time: number): void {
    if (time - this.lastAttackAt < ATTACK_COOLDOWN_MS || this.stamina < 6) return;
    this.lastAttackAt = time;
    this.stamina -= 6;
    this.drawAttackArc();

    const hit = this.findAttackTarget();
    if (!hit) {
      this.showInfo("空振り", 260);
      this.playTone(180, 0.04, "triangle", 0.035);
      return;
    }

    hit.hp -= getAttackPower(this.save.player.attackLevel, this.save.player.craftedWeapon);
    this.cameras.main.shake(70, 0.004);
    hit.visual.setScale(1.16);
    this.tweens.add({ targets: hit.visual, scale: 1, duration: 110, ease: "Back.easeOut" });
    this.showInfo(`危険物を払う ${Math.max(0, hit.hp)}/${hit.maxHp}`, 500);
    this.playTone(430, 0.05, "square", 0.045);

    if (hit.hp <= 0) this.defeatEnemy(hit);
  }

  private findAttackTarget(): EnemyObject | undefined {
    const attackPoint = new Phaser.Math.Vector2(
      this.player.x + this.lastFacing.x * 46,
      this.player.y + this.lastFacing.y * 46
    );
    let best: EnemyObject | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const enemy of this.enemies) {
      const distance = Phaser.Math.Distance.Between(attackPoint.x, attackPoint.y, enemy.x, enemy.y);
      const toEnemy = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y).normalize();
      const facingScore = toEnemy.dot(this.lastFacing);
      if (distance > 58 || facingScore < -0.1) continue;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = enemy;
      }
    }
    return best;
  }

  private defeatEnemy(enemy: EnemyObject): void {
    Phaser.Utils.Array.Remove(this.enemies, enemy);
    enemy.body.enable = false;
    this.spawnMaterial(enemy.x, enemy.y, enemy.dropItem);
    this.emitDust(enemy.x, enemy.y, 1, 10);
    this.showInfo("危険物を片付けた。素材が残った!", 800);
    this.playTone(720, 0.08, "sine", 0.06);
    this.tweens.add({
      targets: enemy.visual,
      alpha: 0,
      scale: 0.25,
      angle: 35,
      duration: 170,
      ease: "Back.easeIn",
      onComplete: () => {
        enemy.visual.destroy();
      }
    });
    enemy.destroy();
  }

  private drawAttackArc(): void {
    const baseAngle = this.lastFacing.angle();
    const x = this.player.x + this.lastFacing.x * 22;
    const y = this.player.y + this.lastFacing.y * 22;
    const arc = this.add.graphics({ x, y }).setDepth(42);
    const start = baseAngle - 0.98;
    const end = baseAngle + 0.82;
    const radius = 42;

    arc.lineStyle(13, 0x18202a, 0.42);
    arc.beginPath();
    arc.arc(0, 0, radius + 3, start - 0.06, end + 0.04, false);
    arc.strokePath();

    arc.lineStyle(8, 0x6f8791, 0.46);
    arc.beginPath();
    arc.arc(0, 0, radius, start, end, false);
    arc.strokePath();

    arc.lineStyle(4, 0xd8b26f, 0.86);
    arc.beginPath();
    arc.arc(0, 0, radius - 3, start + 0.08, end - 0.08, false);
    arc.strokePath();

    arc.lineStyle(2, 0xfff1c7, 0.92);
    arc.beginPath();
    arc.arc(0, 0, radius - 7, baseAngle - 0.66, baseAngle + 0.48, false);
    arc.strokePath();

    const tipX = x + Math.cos(end) * (radius - 5);
    const tipY = y + Math.sin(end) * (radius - 5);
    const glint = this.add.ellipse(tipX, tipY, 12, 4, 0xfff1c7, 0.78)
      .setAngle(Phaser.Math.RadToDeg(end))
      .setDepth(43);

    this.emitDust(
      this.player.x + this.lastFacing.x * 48,
      this.player.y + this.lastFacing.y * 48,
      0.55,
      3
    );
    this.tweens.add({
      targets: [arc, glint],
      alpha: 0,
      angle: "+=8",
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 190,
      ease: "Sine.easeOut",
      onComplete: () => {
        arc.destroy();
        glint.destroy();
      }
    });
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

  private drawCleaningRing(x: number, y: number, progress: number): void {
    const end = Phaser.Math.DegToRad(-90 + 360 * Phaser.Math.Clamp(progress, 0, 1));
    const radius = 27 + Math.sin(this.time.now / 70) * 1.2;
    this.cleaningRing.clear();
    this.cleaningRing.fillStyle(0x6aa2cf, 0.1);
    this.cleaningRing.fillCircle(x, y, radius + 3);
    this.cleaningRing.lineStyle(6, 0x171722, 0.84);
    this.cleaningRing.strokeCircle(x, y, radius);
    this.cleaningRing.lineStyle(6, progress > 0 ? 0xffd58f : 0xb08a5a, progress > 0 ? 0.98 : 0.55);
    this.cleaningRing.beginPath();
    this.cleaningRing.arc(x, y, radius, Phaser.Math.DegToRad(-90), end, false);
    this.cleaningRing.strokePath();
    if (progress > 0.98) {
      this.cleaningRing.lineStyle(2, 0xf8e7c7, 0.8);
      this.cleaningRing.strokeCircle(x, y, radius + 7);
    }
  }

  private animateDebrisCleaning(target: DebrisObject, progress: number): void {
    const pulse = Math.sin(this.time.now / 45) * 0.035;
    const shrink = 1 - progress * 0.18;
    target.setTexture(progress >= 0.5 ? target.halfTexture : target.fullTexture);
    target.setScale(target.baseScale * (shrink + pulse));
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
      lifespan: 300,
      speed: { min: 24, max: 74 },
      scale: { start: 0.78, end: 0 },
      alpha: { start: 0.68, end: 0 },
      quantity: 1,
      emitting: false
    }).setDepth(35);
  }

  private emitDust(x: number, y: number, progress: number, count = 2): void {
    if (!this.cleaningParticles) return;
    this.cleaningParticles.explode(Math.max(1, Math.round(count + progress * 3)), x, y);
  }

  private spawnMaterial(x: number, y: number, itemId: ItemId): void {
    if (this.materialDropsSpawned >= MAX_RUN_MATERIAL_DROPS) {
      this.showInfo("持ち帰れる物資は十分。出口を探そう。", 700);
      return;
    }
    this.materialDropsSpawned += 1;

    const shadow = this.add.ellipse(x, y + 10, 22, 8, 0x190b0c, 0.34)
      .setDepth(17);
    const material = this.add.image(x, y, ITEM_TEXTURES[itemId])
      .setDepth(18) as MaterialObject;
    this.physics.add.existing(material);
    material.itemId = itemId;
    material.collected = false;
    material.shadow = shadow;
    material.baseScale = Math.min(24 / material.width, 24 / material.height);
    material.body.setSize(26, 26);
    this.materials.add(material);
    material.setScale(material.baseScale * 0.25);
    shadow.setScale(0.5);
    this.tweens.add({ targets: material, scale: material.baseScale * 1.08, duration: 130, ease: "Back.easeOut" });
    this.tweens.add({ targets: shadow, scaleX: 1, scaleY: 1, duration: 130, ease: "Back.easeOut" });
    this.tweens.add({
      targets: [material, shadow],
      y: y - 10,
      duration: 140,
      ease: "Back.easeOut",
      yoyo: true,
      hold: 30,
      onComplete: () => {
        if (material.active) material.setY(y);
        if (shadow.active) shadow.setY(y + 10);
      }
    });
  }

  private collectMaterial(material: MaterialObject): void {
    if (material.collected) return;
    const capacity = getBagCapacity(this.save.player.bagLevel);
    if (getInventoryCount(this.runInventory) >= capacity) {
      this.showInfo("バッグがいっぱい。出口へ戻ろう。", 900);
      this.playTone(120, 0.08, "square", 0.035);
      return;
    }

    material.collected = true;
    material.body.enable = false;
    this.runInventory[material.itemId] += 1;
    this.playTone(760, 0.055, "triangle", 0.045);
    this.showInfo(`${ITEMS[material.itemId].name}を回収`, 420);
    this.tweens.add({
      targets: [material, material.shadow],
      x: this.player.x,
      y: this.player.y,
      scale: 0,
      duration: 120,
      ease: "Sine.easeIn",
      onComplete: () => {
        material.shadow.destroy();
        material.destroy();
      }
    });
  }

  private updateEnemies(time: number): void {
    this.enemies = this.enemies.filter((enemy) => enemy.active && enemy.body);
    for (const enemy of this.enemies) {
      const t = time / 1000;
      const phase = enemy.phase;
      const wasX = enemy.x;
      const wasY = enemy.y;
      const xOffset = enemy.pattern === "loop"
        ? Math.sin(t * 1.1 + phase) * 62
        : Math.sin(t * 0.9 + phase) * 84;
      const yOffset = enemy.pattern === "loop"
        ? Math.cos(t * 1.35 + phase) * 44
        : Math.sin(t * 1.8 + phase * 0.7) * 52;
      const distanceToPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      const toPlayer = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y);
      const facing = new Phaser.Math.Vector2(enemy.facingX, enemy.facingY).normalize();
      const playerInSight = distanceToPlayer < 160 + this.floor * 10 && toPlayer.clone().normalize().dot(facing) > 0.45;
      if (playerInSight) enemy.alerted = true;

      let nextX: number;
      let nextY: number;
      if (enemy.alerted && distanceToPlayer < 280) {
        toPlayer.normalize();
        nextX = enemy.x + toPlayer.x * (0.78 + this.floor * 0.06);
        nextY = enemy.y + toPlayer.y * (0.78 + this.floor * 0.06);
      } else {
        enemy.alerted = false;
        nextX = enemy.originX + xOffset;
        nextY = enemy.originY + yOffset;
      }
      this.moveEnemyWithinWalls(enemy, nextX, nextY);
      const dx = enemy.x - wasX;
      const dy = enemy.y - wasY;
      if (Math.abs(dx) + Math.abs(dy) > 0.01) {
        enemy.facingX = dx;
        enemy.facingY = dy;
      }
      enemy.visual.setPosition(enemy.x, enemy.y);
      const wobble = Math.sin(time / 150 + phase);
      enemy.core.setTexture(enemy.alerted ? enemy.alertTexture : enemy.idleTexture);
      enemy.core.setScale(enemy.visualBaseScale * (1 + wobble * 0.055), enemy.visualBaseScale * (1 - wobble * 0.045));
      enemy.warning.setVisible(enemy.alerted);
      enemy.warning.setScale(enemy.warningBaseScale * (1 + Math.max(0, wobble) * 0.18));
      enemy.visual.setAngle(wobble * 2);
      enemy.body.updateFromGameObject();
    }
  }

  private moveEnemyWithinWalls(enemy: EnemyObject, nextX: number, nextY: number): void {
    const currentX = enemy.x;
    const currentY = enemy.y;
    let resolvedX = currentX;
    let resolvedY = currentY;

    if (this.isEnemyPositionWalkable(nextX, currentY)) resolvedX = nextX;
    if (this.isEnemyPositionWalkable(resolvedX, nextY)) resolvedY = nextY;

    enemy.setPosition(resolvedX, resolvedY);
  }

  private isEnemyPositionWalkable(x: number, y: number): boolean {
    const margin = 17;
    const points = [
      [x - margin, y - margin],
      [x + margin, y - margin],
      [x - margin, y + margin],
      [x + margin, y + margin]
    ];

    return points.every(([pointX, pointY]) => {
      const tileX = Math.floor(pointX / TILE);
      const tileY = Math.floor(pointY / TILE);
      if (tileX < 0 || tileY < 0 || tileX >= MAP_WIDTH || tileY >= MAP_HEIGHT) return false;
      return !this.blockedTiles.has(`${tileX},${tileY}`);
    });
  }

  private updatePlayerVisual(time: number, input: Phaser.Math.Vector2): void {
    const moving = input.lengthSq() > 0.001;
    const bob = moving ? Math.sin(time / 115) * 1.6 : Math.sin(time / 420) * 0.45;
    const sway = moving ? Math.sin(time / 130) : 0;
    const facing = this.lastFacing;
    const direction = this.getFacingDirection();
    const cleaning = this.cleaningActive;
    const damaged = time - this.lastDamageAt < 180;
    this.playerVisual.root.setPosition(this.player.x, this.player.y + bob);
    this.playerVisual.sprite.setTexture(damaged ? ASSET_KEYS.player.cleanerDamage : cleaning ? ASSET_KEYS.player.cleanerClean : moving ? ASSET_KEYS.player.cleanerWalk : ASSET_KEYS.player.cleaner);
    this.playerVisual.sprite.setFlipX(direction === "left");
    this.playerVisual.sprite.setRotation(sway * 0.025);
    this.playerVisual.bag.setPosition(-12 - facing.x * 2.2, 5 - facing.y * 1.4 - sway * 0.7);
    if (direction === "up") this.playerVisual.bag.setPosition(0, 8 - sway * 0.7);
    this.playerVisual.broom.setPosition(facing.x * 10, 4 + facing.y * 6);
    this.playerVisual.broom.setRotation(facing.angle() - Math.PI / 2 + sway * 0.035);
  }

  private getFacingDirection(): FacingDirection {
    if (Math.abs(this.lastFacing.x) > Math.abs(this.lastFacing.y)) {
      return this.lastFacing.x < 0 ? "left" : "right";
    }
    return this.lastFacing.y < 0 ? "up" : "down";
  }

  private checkHazards(time: number): void {
    if (time - this.lastDamageAt < 650 || time < this.dodgingUntil) return;
    const enemyHit = this.enemies.some((enemy) => Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < 34);
    const trapHit = this.traps.some((trap) => Phaser.Math.Distance.Between(this.player.x, this.player.y, trap.body.x, trap.body.y) < 34);
    if (!enemyHit && !trapHit) return;
    const damage = enemyHit ? 12 : 8;
    this.hp = Math.max(0, this.hp - damage);
    this.damageTaken += damage;
    this.lastDamageAt = time;
    this.cameras.main.shake(110, 0.008);
    this.flashPlayerVisual();
    this.showInfo(enemyHit ? `モンスターに接触: ${damage}ダメージ` : `危険な床: ${damage}ダメージ`, 820);
    this.playTone(95, 0.09, "sawtooth", 0.045);
  }

  private flashPlayerVisual(): void {
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

  private openPauseMenu(): void {
    const { width, height } = this.scale;
    this.paused = true;
    this.player.body.setVelocity(0, 0);
    const inventoryText = this.formatInventory(this.runInventory);
    const cleanRate = Math.floor(this.getCleanRate() * 100);
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const materialCount = getInventoryCount(this.runInventory);
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(160);
    const centerX = width / 2;
    const centerY = height / 2;
    const bg = this.add.rectangle(centerX, centerY, width - 44, 442, 0x171722, 0.94)
      .setStrokeStyle(2, 0xe2b56f, 0.8)
      .setScrollFactor(0);
    const title = this.add.text(centerX, centerY - 186, "一時停止", {
      fontFamily: "sans-serif",
      fontSize: "25px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5).setScrollFactor(0);
    const text = this.add.text(centerX, centerY - 128,
      `HP ${Math.ceil(this.hp)} / 清掃 ${cleanRate}%\n` +
      `素材 ${materialCount}/${capacity}\n` +
      `${inventoryText}\n` +
      `所持金 ${this.save.player.money}G`,
      {
        fontFamily: "sans-serif",
        fontSize: "17px",
        color: "#f3efe8",
        align: "center",
        lineSpacing: 9,
        wordWrap: { width: width - 86 }
      }
    ).setOrigin(0.5, 0).setScrollFactor(0);
    const organize = this.createMenuButton(centerX, centerY + 62, "バッグ整理", 0x5b567d, () => this.openBagOrganizeMenu());
    const resume = this.createMenuButton(centerX, centerY + 124, "再開", 0xd8913d, () => this.closePauseMenu());
    const retreat = this.createMenuButton(centerX, centerY + 186, "拠点へ戻る", 0x4e6b7d, () => {
      this.closePauseMenu();
      this.finished = true;
      this.scene.start("BaseScene");
    });
    panel.add([bg, title, text, organize, resume, retreat]);
    this.pauseLayer = panel;
  }

  private createMenuButton(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const button = this.add.rectangle(x, y, 220, 48, color, 1)
      .setStrokeStyle(2, 0xffd08a, 0.75)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: "20px",
      color: "#fff4df",
      fontStyle: "700"
    }).setOrigin(0.5).setScrollFactor(0);
    const container = this.add.container(0, 0, [button, text])
      .setSize(this.scale.width, this.scale.height)
      .setScrollFactor(0);
    button.on("pointerdown", () => {
      button.setScale(0.98);
      text.setScale(0.98);
    });
    button.on("pointerout", () => {
      button.setScale(1);
      text.setScale(1);
    });
    button.on("pointerup", () => {
      button.setScale(1);
      text.setScale(1);
      onClick();
    });
    return container;
  }

  private openBagOrganizeMenu(): void {
    const { width, height } = this.scale;
    this.paused = true;
    this.player.body.setVelocity(0, 0);
    this.pauseLayer?.destroy();

    const capacity = getBagCapacity(this.save.player.bagLevel);
    const materialCount = getInventoryCount(this.runInventory);
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(160);
    const centerX = width / 2;
    const top = Math.max(86, height / 2 - 270);
    const bg = this.add.rectangle(centerX, height / 2, width - 28, Math.min(height - 54, 560), 0x171722, 0.96)
      .setStrokeStyle(2, 0xe2b56f, 0.8)
      .setScrollFactor(0);
    const title = this.add.text(centerX, top, `バッグ整理 ${materialCount}/${capacity}`, {
      fontFamily: "sans-serif",
      fontSize: "23px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5).setScrollFactor(0);
    const note = this.add.text(centerX, top + 32, "捨てる個数を指定して、拾える空きを作れます。", {
      fontFamily: "sans-serif",
      fontSize: "13px",
      color: "#ffe0a3",
      align: "center",
      wordWrap: { width: width - 54 }
    }).setOrigin(0.5).setScrollFactor(0);

    panel.add([bg, title, note]);
    ITEM_IDS.forEach((itemId, index) => {
      const item = ITEMS[itemId];
      const count = this.runInventory[itemId];
      const amount = this.getDiscardAmount(itemId);
      const rowY = top + 76 + index * 72;
      const rowBg = this.add.rectangle(centerX, rowY, width - 54, 62, 0x30281f, 0.96)
        .setStrokeStyle(1, 0x8b6338, 0.72)
        .setScrollFactor(0);
      const label = this.add.text(34, rowY - 21, `${item.name} x${count}`, {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#f3efe8",
        fontStyle: "700"
      }).setOrigin(0, 0.5).setScrollFactor(0);
      const amountText = this.add.text(centerX, rowY - 20, `捨てる: ${amount}`, {
        fontFamily: "sans-serif",
        fontSize: "13px",
        color: count > 0 ? "#ffe0a3" : "#8c8274",
        fontStyle: "700"
      }).setOrigin(0.5).setScrollFactor(0);

      const buttons = [
        this.createOverlayButton(44, rowY + 14, 38, 28, "-10", 0x2a2d38, () => this.changeDiscardAmount(itemId, -10)),
        this.createOverlayButton(88, rowY + 14, 34, 28, "-1", 0x2a2d38, () => this.changeDiscardAmount(itemId, -1)),
        this.createOverlayButton(132, rowY + 14, 34, 28, "+1", 0x4e6b7d, () => this.changeDiscardAmount(itemId, 1)),
        this.createOverlayButton(178, rowY + 14, 38, 28, "+10", 0x4e6b7d, () => this.changeDiscardAmount(itemId, 10)),
        this.createOverlayButton(232, rowY + 14, 48, 28, "最大", 0x5b567d, () => this.setDiscardAmount(itemId, count)),
        this.createOverlayButton(width - 72, rowY + 14, 76, 28, "捨てる", count > 0 ? 0x9b4350 : 0x2a2d38, () => this.discardRunItem(itemId))
      ];
      panel.add([rowBg, label, amountText, ...buttons]);
    });

    const back = this.createOverlayButton(centerX - 76, height - 58, 112, 44, "戻る", 0x4e6b7d, () => this.openPauseMenu());
    const resume = this.createOverlayButton(centerX + 76, height - 58, 112, 44, "再開", 0xd8913d, () => this.closePauseMenu());
    panel.add([back, resume]);
    this.pauseLayer = panel;
  }

  private createOverlayButton(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(1, 0xffd08a, 0.66)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#fff4df",
      fontStyle: "700"
    }).setOrigin(0.5).setScrollFactor(0);
    const container = this.add.container(0, 0, [button, text]).setScrollFactor(0);
    button.on("pointerdown", () => {
      button.setScale(0.96);
      text.setScale(0.96);
    });
    button.on("pointerout", () => {
      button.setScale(1);
      text.setScale(1);
    });
    button.on("pointerup", () => {
      button.setScale(1);
      text.setScale(1);
      onClick();
    });
    return container;
  }

  private getDiscardAmount(itemId: ItemId): number {
    const count = this.runInventory[itemId];
    if (count <= 0) return 0;
    return Phaser.Math.Clamp(this.discardAmounts[itemId] || 1, 1, count);
  }

  private setDiscardAmount(itemId: ItemId, amount: number): void {
    const count = this.runInventory[itemId];
    this.discardAmounts[itemId] = count <= 0 ? 0 : Phaser.Math.Clamp(amount, 1, count);
    this.openBagOrganizeMenu();
  }

  private changeDiscardAmount(itemId: ItemId, delta: number): void {
    this.setDiscardAmount(itemId, this.getDiscardAmount(itemId) + delta);
  }

  private discardRunItem(itemId: ItemId): void {
    const count = this.runInventory[itemId];
    if (count <= 0) return;
    const amount = Math.min(this.getDiscardAmount(itemId), count);
    this.runInventory[itemId] = Math.max(0, count - amount);
    this.discardAmounts[itemId] = this.runInventory[itemId] > 0 ? Math.min(amount, this.runInventory[itemId]) : 0;
    this.showInfo(`${ITEMS[itemId].name}を${amount}個捨てた`, 700);
    this.openBagOrganizeMenu();
  }

  private closePauseMenu(): void {
    this.paused = false;
    this.pauseLayer?.destroy();
    this.pauseLayer = undefined;
  }

  private revealExitIfReady(): void {
    if (this.exitAvailable || this.getCleanRate() < EXIT_CLEAN_RATE) return;
    this.exitAvailable = true;
    this.setExitVisible(true);
    this.exitZone.setScale(0.4);
    this.exitGlow.setScale(0.4);
    this.exitArrow.setScale(0.4);
    this.exitLabel.setScale(0.4);
    this.tweens.add({ targets: [this.exitZone, this.exitGlow, this.exitArrow, this.exitLabel], scale: 1, duration: 240, ease: "Back.easeOut" });
    this.showInfo("清掃率80%達成。出口が開きました。", 1200);
    this.playTone(700, 0.12, "sine", 0.06);
  }

  private refreshHud(nearExit: boolean): void {
    const inventoryCount = getInventoryCount(this.runInventory);
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const cleanRate = Math.floor(this.getCleanRate() * 100);
    this.hudText.setText(`はじまりの地下道 B${this.floor}F${this.floor === this.maxFloor ? " 最奥地" : ""}`);
    this.updateHudBar(this.hpBar, this.hp / 100, `HP ${Math.ceil(this.hp)}`);
    this.updateHudBar(this.staminaBar, this.stamina / this.maxStamina, `STM ${Math.ceil(this.stamina)}`);
    this.updateHudBar(this.bagBar, inventoryCount / capacity, `素材 ${inventoryCount}/${capacity}`);
    this.updateHudBar(this.cleanBar, cleanRate / 100, `清掃 ${cleanRate}%`);

    if (nearExit) {
      this.infoText.setText("掃除ボタンで帰還");
    } else if (this.exitAvailable && this.time.now >= this.infoLockedUntil) {
      this.infoText.setText("出口が開いた。緑の光へ向かおう。");
    } else if (this.time.now >= this.infoLockedUntil) {
      this.infoText.setText(`払う:J / メニュー:右上 / 清掃80%で出口 (${cleanRate}%)`);
    }
  }

  private updateHudBar(bar: HudBar, ratio: number, label: string): void {
    bar.fill.displayWidth = Phaser.Math.Clamp(ratio, 0, 1) * bar.width;
    bar.label.setText(label);
  }

  private finishRun(cleared: boolean, retreated = false): void {
    this.finished = true;
    const cleanRate = this.getCleanRate();
    const earnedMoney = getInventoryValue(this.runInventory);
    if (cleared && this.floor < this.maxFloor) {
      this.scene.restart({
        floor: this.floor + 1,
        runInventory: this.cloneInventory(this.runInventory),
        materialDropsSpawned: this.materialDropsSpawned,
        runStartedAt: this.runStartedAt,
        damageTaken: this.damageTaken,
        cleaned: this.cleaned,
        totalDebris: this.totalDebris
      });
      return;
    }

    const totalCleanScore = this.totalDebris > 0 ? (this.cleaned / this.totalDebris) * 100 : this.cleanScore;
    const totalCleanRate = Phaser.Math.Clamp(totalCleanScore / 100, 0, 1);
    const result: RunResult = {
      cleared,
      retreated,
      cleaned: this.cleaned,
      totalDebris: this.totalDebris,
      cleanScore: totalCleanScore,
      damageTaken: this.damageTaken,
      durationMs: Math.floor(this.time.now - this.runStartedAt),
      inventory: this.cloneInventory(this.runInventory),
      earnedMoney,
      rank: this.getRank(cleared, retreated, totalCleanRate)
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

  private getCleanRate(): number {
    return Phaser.Math.Clamp(this.cleanScore / 100, 0, 1);
  }

  private setExitVisible(visible: boolean): void {
    this.exitZone.setVisible(visible);
    this.exitVisual.setVisible(visible);
    if (visible) this.exitVisual.setTexture(ASSET_KEYS.dungeon.exitOpen);
    this.exitGlow.setVisible(visible);
    this.exitArrow.setVisible(visible);
    this.exitLabel.setVisible(visible);
  }

  private showInfo(text: string, durationMs: number): void {
    this.infoText.setText(text);
    this.infoLockedUntil = Math.max(this.infoLockedUntil, this.time.now + durationMs);
  }

  private formatInventory(inventory: Record<ItemId, number>): string {
    const lines = Object.entries(inventory)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => `${ITEMS[id as ItemId].name}x${count}`);
    return lines.length > 0 ? lines.join(" / ") : "素材なし";
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
