import Phaser from "phaser";
import { type ItemId, getInventoryCount, getInventoryValue } from "../data/items";
import { getBagCapacity, getCleaningPower } from "../data/upgrades";
import { loadSave, type SaveData } from "../systems/SaveSystem";
import type { RunResult } from "../types";
import { ActionControls } from "../ui/ActionControls";
import { VirtualPad } from "../ui/VirtualPad";

const TILE = 48;
const MAP_WIDTH = 18;
const MAP_HEIGHT = 18;
const PLAYER_SPEED = 170;
const DODGE_SPEED = 430;
const DODGE_TIME_MS = 130;

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
  private cleaningRing!: Phaser.GameObjects.Arc;
  private exitZone!: Phaser.GameObjects.Rectangle;
  private debris: DebrisObject[] = [];
  private materials!: Phaser.Physics.Arcade.Group;
  private enemies: EnemyObject[] = [];
  private traps: Phaser.GameObjects.Rectangle[] = [];
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
  private finished = false;
  private cleaningParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
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
    }

    const speed = time < this.dodgingUntil ? DODGE_SPEED : PLAYER_SPEED;
    this.player.body.setVelocity(input.x * speed, input.y * speed);

    if (input.lengthSq() > 0.001) this.lastFacing.copy(input);

    this.updateEnemies(time);
    this.checkHazards(time);

    const nearExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitZone.x, this.exitZone.y) < 54;
    const cleanPressedThisFrame = this.controls.consumePrimaryPress();
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.eKey) || cleanPressedThisFrame;
    const cleaningHeld = this.space.isDown || this.controls.isCleaning();
    if (nearExit && interactPressed) {
      this.finishRun(this.cleaned / this.totalDebris >= 0.8);
      return;
    }

    if (cleaningHeld && !nearExit && this.stamina > 0) {
      this.handleCleaning(delta);
    } else {
      this.cleaningRing.setVisible(false);
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

    this.addTrap(7, 8, 0xb24a4a);
    this.addTrap(13, 5, 0x775fb0);
    this.addEnemy(6, 9, "x");
    this.addEnemy(13, 10, "y");

    this.exitZone = this.add.rectangle((MAP_WIDTH - 2) * TILE + TILE / 2, (MAP_HEIGHT - 3) * TILE + TILE / 2, 38, 48, 0x4d8f6a)
      .setStrokeStyle(3, 0xa7e8b3, 0.85);
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
    object.setData("name", kind.name);
    this.debris.push(object);
  }

  private addTrap(tileX: number, tileY: number, color: number): void {
    const trap = this.add.rectangle(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2, 34, 34, color, 0.82)
      .setStrokeStyle(2, 0xffd8d8, 0.35);
    this.traps.push(trap);
  }

  private addEnemy(tileX: number, tileY: number, patrolAxis: "x" | "y"): void {
    const enemy = this.add.rectangle(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2, 30, 26, 0x82a1df, 1)
      .setStrokeStyle(2, 0xe7f0ff, 0.74) as EnemyObject;
    this.physics.add.existing(enemy);
    enemy.body.setImmovable(true);
    enemy.originX = enemy.x;
    enemy.originY = enemy.y;
    enemy.patrolAxis = patrolAxis;
    this.enemies.push(enemy);
  }

  private createPlayer(): void {
    const body = this.add.rectangle(TILE * 2.5, TILE * 2.5, 28, 34, 0xe8c070, 1)
      .setStrokeStyle(2, 0x3b2717, 1);
    this.physics.add.existing(body);
    this.player = body as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    this.player.body.setSize(24, 28);
    this.player.body.setCollideWorldBounds(true);

    this.cleaningRing = this.add.circle(this.player.x, this.player.y, 24, 0xffd58f, 0.18)
      .setStrokeStyle(4, 0xffd58f, 0.8)
      .setVisible(false);
  }

  private createHud(): void {
    this.add.rectangle(195, 34, 344, 58, 0x171722, 0.68)
      .setStrokeStyle(2, 0xe2b56f, 0.36)
      .setScrollFactor(0)
      .setDepth(90);

    this.hudText = this.add.text(195, 25, "", {
      fontFamily: "sans-serif",
      fontSize: "13px",
      color: "#f8e7c7",
      align: "center"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(91);

    this.infoText = this.add.text(195, 50, "", {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#d7b77e",
      align: "center"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(91);
  }

  private handleCleaning(delta: number): void {
    const target = this.findTargetDebris();
    this.stamina = Math.max(0, this.stamina - delta * 0.024);

    if (!target) {
      this.cleaningRing.setVisible(true);
      this.cleaningRing.setPosition(this.player.x + this.lastFacing.x * 34, this.player.y + this.lastFacing.y * 34);
      this.infoText.setText("近くの残骸に向いて長押し");
      return;
    }

    this.cleaningRing.setVisible(true);
    this.cleaningRing.setPosition(target.x, target.y);
    target.debrisHp -= (delta / 320) * getCleaningPower(this.save.player.broomLevel);
    target.setScale(1 + Math.sin(this.time.now / 45) * 0.035);
    this.infoText.setText(`${target.getData("name")} 清掃中`);

    if (target.debrisHp <= 0) {
      this.cleaned += 1;
      this.spawnMaterial(target.x, target.y, target.itemId);
      Phaser.Utils.Array.Remove(this.debris, target);
      target.destroy();
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
      if (dot < 0.05 && distance > 42) continue;

      const score = distance - dot * 18;
      if (score < bestScore) {
        bestScore = score;
        best = object;
      }
    }

    return best;
  }

  private spawnMaterial(x: number, y: number, itemId: ItemId): void {
    const material = this.add.star(x, y, 5, 6, 12, 0xf2d49b, 1)
      .setStrokeStyle(1, 0x3b2717, 0.7) as MaterialObject;
    this.physics.add.existing(material);
    material.itemId = itemId;
    this.materials.add(material);
  }

  private collectMaterial(material: MaterialObject): void {
    const capacity = getBagCapacity(this.save.player.bagLevel);
    if (getInventoryCount(this.runInventory) >= capacity) {
      this.infoText.setText("バッグがいっぱいです。出口へ戻ろう。");
      return;
    }

    this.runInventory[material.itemId] += 1;
    material.destroy();
  }

  private updateEnemies(time: number): void {
    this.enemies = this.enemies.filter((enemy) => enemy.active && enemy.body);

    for (const enemy of this.enemies) {
      const offset = Math.sin(time / 850) * 72;
      if (enemy.patrolAxis === "x") enemy.setX(enemy.originX + offset);
      else enemy.setY(enemy.originY + offset);
      enemy.body.updateFromGameObject();
    }
  }

  private checkHazards(time: number): void {
    if (time - this.lastDamageAt < 650 || time < this.dodgingUntil) return;

    const enemyHit = this.enemies.some((enemy) => Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      enemy.getBounds()
    ));
    const trapHit = this.traps.some((trap) => Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      trap.getBounds()
    ));

    if (!enemyHit && !trapHit) return;

    const damage = enemyHit ? 12 : 8;
    this.hp = Math.max(0, this.hp - damage);
    this.damageTaken += damage;
    this.lastDamageAt = time;
    this.cameras.main.shake(90, 0.006);
  }

  private refreshHud(nearExit: boolean): void {
    const inventoryCount = getInventoryCount(this.runInventory);
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const cleanRate = Math.floor((this.cleaned / this.totalDebris) * 100);
    this.hudText.setText(`HP ${Math.ceil(this.hp)} / スタミナ ${Math.ceil(this.stamina)} / 素材 ${inventoryCount}/${capacity} / 清掃 ${cleanRate}%`);

    if (nearExit) {
      this.infoText.setText(cleanRate >= 80 ? "出口: 掃除ボタンで帰還" : "出口: 途中撤退できます");
    } else if (!this.infoText.text) {
      this.infoText.setText("移動: 左スティック / WASD   掃除: 長押し / Space");
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
