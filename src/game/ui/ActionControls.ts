import Phaser from "phaser";

export class ActionControls {
  private cleanHeld = false;
  private cleanPressed = false;
  private dodgePressed = false;
  private cleanPointerId: number | null = null;
  private dodgePointerId: number | null = null;
  private readonly cleanButton: Phaser.GameObjects.Arc;
  private readonly dodgeButton: Phaser.GameObjects.Arc;
  private readonly handlePointerEnd: (pointer: Phaser.Input.Pointer) => void;
  private readonly handleReleaseAll: () => void;
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene) {
    const { width, height } = scene.scale;
    const topInset = readSafeAreaInset("top");
    const bottomInset = readSafeAreaInset("bottom");
    const cleanX = width - 82;
    const cleanY = height - Math.max(108, bottomInset + 88);
    const dodgeX = width - 146;
    const dodgeY = cleanY - 62;
    const pauseX = width - 38;
    const pauseY = Math.max(38, topInset + 32);

    this.cleanButton = scene.add.circle(cleanX, cleanY, 42, 0xd8913d, 0.88)
      .setStrokeStyle(3, 0xffd08a, 0.9)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive(new Phaser.Geom.Circle(0, 0, 54), Phaser.Geom.Circle.Contains);

    scene.add.text(cleanX, cleanY, "掃除", {
      fontFamily: "sans-serif",
      fontSize: "17px",
      color: "#25170e",
      fontStyle: "700"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.dodgeButton = scene.add.circle(dodgeX, dodgeY, 29, 0x4e6b7d, 0.84)
      .setStrokeStyle(2, 0xa7d2e7, 0.8)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive(new Phaser.Geom.Circle(0, 0, 36), Phaser.Geom.Circle.Contains);

    scene.add.text(dodgeX, dodgeY, "回避", {
      fontFamily: "sans-serif",
      fontSize: "14px",
      color: "#eef8ff",
      fontStyle: "700"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const pause = scene.add.rectangle(pauseX, pauseY, 52, 52, 0x1e2430, 0.62)
      .setStrokeStyle(2, 0xe2b56f, 0.72)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });

    scene.add.text(pauseX, pauseY, "II", {
      fontFamily: "sans-serif",
      fontSize: "22px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.cleanButton.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.cleanPointerId !== null) return;
      this.cleanPointerId = pointer.id;
      this.cleanHeld = true;
      this.cleanPressed = true;
      this.cleanButton.setScale(0.94);
    });

    this.dodgeButton.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.dodgePointerId !== null) return;
      this.dodgePointerId = pointer.id;
      this.dodgePressed = true;
      this.dodgeButton.setScale(0.92);
    });

    this.handlePointerEnd = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.cleanPointerId) {
        this.cleanPointerId = null;
        this.cleanHeld = false;
        this.cleanButton.setScale(1);
      }

      if (pointer.id === this.dodgePointerId) {
        this.dodgePointerId = null;
        this.dodgeButton.setScale(1);
      }
    };

    this.handleReleaseAll = () => {
      this.cleanPointerId = null;
      this.dodgePointerId = null;
      this.cleanHeld = false;
      this.cleanPressed = false;
      this.cleanButton.setScale(1);
      this.dodgeButton.setScale(1);
    };

    scene.input.on("pointerup", this.handlePointerEnd);
    scene.input.on("pointerupoutside", this.handlePointerEnd);
    scene.input.on("pointercancel", this.handlePointerEnd);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.handleReleaseAll);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });

    pause.on("pointerup", () => {
      this.handleReleaseAll();
      scene.scene.start("BaseScene");
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

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.input.off("pointerup", this.handlePointerEnd);
    this.scene.input.off("pointerupoutside", this.handlePointerEnd);
    this.scene.input.off("pointercancel", this.handlePointerEnd);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.handleReleaseAll);
    this.handleReleaseAll();
  }
}

function readSafeAreaInset(side: "top" | "bottom"): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--safe-area-${side}`)
    .trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
