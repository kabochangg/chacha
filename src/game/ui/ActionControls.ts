import Phaser from "phaser";

type PrimaryActionMode = "clean" | "exit";

export class ActionControls {
  private cleanHeld = false;
  private cleanPressed = false;
  private dodgePressed = false;
  private attackPressed = false;
  private pausePressed = false;
  private cleanPointerId: number | null = null;
  private dodgePointerId: number | null = null;
  private attackPointerId: number | null = null;
  private readonly cleanButton: Phaser.GameObjects.Arc;
  private readonly cleanLabel: Phaser.GameObjects.Text;
  private readonly dodgeButton: Phaser.GameObjects.Arc;
  private readonly attackButton: Phaser.GameObjects.Arc;
  private readonly pauseButton: Phaser.GameObjects.Rectangle;
  private readonly handlePointerEnd: (pointer: Phaser.Input.Pointer) => void;
  private readonly handleReleaseAll: () => void;
  private primaryMode: PrimaryActionMode = "clean";
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene) {
    const { width, height } = scene.scale;
    const topInset = readSafeAreaInset("top");
    const bottomInset = readSafeAreaInset("bottom");
    const cleanX = width - 76;
    const cleanY = height - Math.max(112, bottomInset + 92);
    const attackX = cleanX;
    const attackY = cleanY - 104;
    const dodgeX = width - 156;
    const dodgeY = cleanY - 52;
    const pauseX = width - 40;
    const pauseY = Math.max(42, topInset + 34);

    const cleanControl = this.createCircleButton({
      x: cleanX,
      y: cleanY,
      radius: 42,
      hitRadius: 52,
      label: "掃除",
      fillColor: 0xd8913d,
      strokeColor: 0xffd08a,
      labelColor: "#25170e",
      fontSize: 19
    });
    this.cleanButton = cleanControl.button;
    this.cleanLabel = cleanControl.label;

    this.dodgeButton = this.createCircleButton({
      x: dodgeX,
      y: dodgeY,
      radius: 29,
      hitRadius: 38,
      label: "回避",
      fillColor: 0x4e6b7d,
      strokeColor: 0xa7d2e7,
      labelColor: "#eef8ff",
      fontSize: 15
    }).button;

    this.attackButton = this.createCircleButton({
      x: attackX,
      y: attackY,
      radius: 31,
      hitRadius: 40,
      label: "攻撃",
      fillColor: 0x9b4350,
      strokeColor: 0xffb4a6,
      labelColor: "#fff2e8",
      fontSize: 15
    }).button;

    this.pauseButton = this.createRectButton({
      x: pauseX,
      y: pauseY,
      width: 52,
      height: 52,
      hitWidth: 58,
      hitHeight: 58,
      label: "II",
      fillColor: 0x1e2430,
      strokeColor: 0xe2b56f,
      labelColor: "#f8e7c7",
      fontSize: 22
    });

    this.cleanButton.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.cleanPointerId !== null) return;
      this.cleanPointerId = pointer.id;
      this.cleanHeld = true;
      this.cleanPressed = true;
      this.cleanButton.setScale(0.94);
      this.cleanButton.setAlpha(1);
    });

    this.dodgeButton.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.dodgePointerId !== null) return;
      this.dodgePointerId = pointer.id;
      this.dodgePressed = true;
      this.dodgeButton.setScale(0.92);
    });

    this.attackButton.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.attackPointerId !== null) return;
      this.attackPointerId = pointer.id;
      this.attackPressed = true;
      this.attackButton.setScale(0.92);
    });

    this.pauseButton.on("pointerup", () => {
      this.handleReleaseAll();
      this.pausePressed = true;
    });

    this.handlePointerEnd = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.cleanPointerId) {
        this.cleanPointerId = null;
        this.cleanHeld = false;
        this.cleanButton.setScale(1);
        this.cleanButton.setAlpha(0.88);
      }

      if (pointer.id === this.dodgePointerId) {
        this.dodgePointerId = null;
        this.dodgeButton.setScale(1);
      }

      if (pointer.id === this.attackPointerId) {
        this.attackPointerId = null;
        this.attackButton.setScale(1);
      }
    };

    this.handleReleaseAll = () => {
      this.cleanPointerId = null;
      this.dodgePointerId = null;
      this.attackPointerId = null;
      this.cleanHeld = false;
      this.cleanPressed = false;
      this.cleanButton.setScale(1);
      this.cleanButton.setAlpha(0.88);
      this.dodgeButton.setScale(1);
      this.attackButton.setScale(1);
    };

    scene.input.on("pointerup", this.handlePointerEnd);
    scene.input.on("pointerupoutside", this.handlePointerEnd);
    scene.input.on("pointercancel", this.handlePointerEnd);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.handleReleaseAll);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
  }

  isCleaning(): boolean {
    return this.cleanHeld;
  }

  consumePrimaryPress(): boolean {
    if (!this.cleanPressed) return false;
    this.cleanPressed = false;
    return true;
  }

  consumeDodge(): boolean {
    if (!this.dodgePressed) return false;
    this.dodgePressed = false;
    return true;
  }

  consumeAttack(): boolean {
    if (!this.attackPressed) return false;
    this.attackPressed = false;
    return true;
  }

  consumePause(): boolean {
    if (!this.pausePressed) return false;
    this.pausePressed = false;
    return true;
  }

  setPrimaryActionMode(mode: PrimaryActionMode): void {
    if (this.primaryMode === mode) return;
    this.primaryMode = mode;

    if (mode === "exit") {
      this.cleanButton.setFillStyle(0x4d8f6a, 0.92);
      this.cleanButton.setStrokeStyle(3, 0xc6ffd0, 0.95);
      this.cleanLabel.setText("帰る");
      this.cleanLabel.setColor("#f8fff0");
      return;
    }

    this.cleanButton.setFillStyle(0xd8913d, 0.88);
    this.cleanButton.setStrokeStyle(3, 0xffd08a, 0.9);
    this.cleanLabel.setText("掃除");
    this.cleanLabel.setColor("#25170e");
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.input.off("pointerup", this.handlePointerEnd);
    this.scene.input.off("pointerupoutside", this.handlePointerEnd);
    this.scene.input.off("pointercancel", this.handlePointerEnd);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.handleReleaseAll);
    this.handleReleaseAll();
  }

  private createCircleButton(config: {
    x: number;
    y: number;
    radius: number;
    hitRadius: number;
    label: string;
    fillColor: number;
    strokeColor: number;
    labelColor: string;
    fontSize: number;
  }): { button: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text } {
    const button = this.scene.add.circle(config.x, config.y, config.radius, config.fillColor, 0.88)
      .setStrokeStyle(3, config.strokeColor, 0.9)
      .setScrollFactor(0)
      .setDepth(100);

    button.setInteractive(
      new Phaser.Geom.Circle(config.radius, config.radius, config.hitRadius),
      Phaser.Geom.Circle.Contains
    );

    const label = this.scene.add.text(config.x, config.y, config.label, {
      fontFamily: "sans-serif",
      fontSize: `${config.fontSize}px`,
      color: config.labelColor,
      fontStyle: "700"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    return { button, label };
  }

  private createRectButton(config: {
    x: number;
    y: number;
    width: number;
    height: number;
    hitWidth: number;
    hitHeight: number;
    label: string;
    fillColor: number;
    strokeColor: number;
    labelColor: string;
    fontSize: number;
  }): Phaser.GameObjects.Rectangle {
    const button = this.scene.add.rectangle(
      config.x,
      config.y,
      config.width,
      config.height,
      config.fillColor,
      0.62
    )
      .setStrokeStyle(2, config.strokeColor, 0.72)
      .setScrollFactor(0)
      .setDepth(100);

    button.setInteractive(
      new Phaser.Geom.Rectangle(
        config.width / 2 - config.hitWidth / 2,
        config.height / 2 - config.hitHeight / 2,
        config.hitWidth,
        config.hitHeight
      ),
      Phaser.Geom.Rectangle.Contains
    );

    this.scene.add.text(config.x, config.y, config.label, {
      fontFamily: "sans-serif",
      fontSize: `${config.fontSize}px`,
      color: config.labelColor,
      fontStyle: "700"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    return button;
  }
}

function readSafeAreaInset(side: "top" | "bottom"): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--safe-area-${side}`)
    .trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
