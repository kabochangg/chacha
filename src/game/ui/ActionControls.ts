import Phaser from "phaser";
import type { ControlLayout } from "./VirtualPad";
import { UI_FONT } from "./theme";

type PrimaryActionMode = "clean" | "exit";

export class ActionControls {
  private cleanPressed = false;
  private dodgePressed = false;
  private attackPressed = false;
  private pausePressed = false;
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

  constructor(private readonly scene: Phaser.Scene, layout: ControlLayout = "leftStickRightButtons") {
    const { width, height } = scene.scale;
    const topInset = readSafeAreaInset("top");
    const bottomInset = readSafeAreaInset("bottom");
    const sideInset = width < 430 ? 82 : 88;
    const secondaryInset = width < 430 ? 158 : 168;
    const actionSideX = layout === "rightStickLeftButtons" ? sideInset : width - sideInset;
    const secondaryX = layout === "rightStickLeftButtons" ? secondaryInset : width - secondaryInset;
    const cleanX = actionSideX;
    const cleanY = height - Math.max(86, bottomInset + 76);
    const attackX = cleanX;
    const attackY = cleanY - 104;
    const dodgeX = secondaryX;
    const dodgeY = cleanY - 52;
    const pauseX = width - 40;
    const pauseY = Math.max(42, topInset + 34);

    const cleanControl = this.createCircleButton({
      x: cleanX,
      y: cleanY,
      radius: 42,
      hitRadius: 56,
      label: "掃除",
      fillColor: 0x073c39,
      strokeColor: 0x25f6d4,
      labelColor: "#d9fff6",
      fontSize: 19
    });
    this.cleanButton = cleanControl.button;
    this.cleanLabel = cleanControl.label;

    this.dodgeButton = this.createCircleButton({
      x: dodgeX,
      y: dodgeY,
      radius: 29,
      hitRadius: 42,
      label: "走る",
      fillColor: 0x0b2530,
      strokeColor: 0x82d8ff,
      labelColor: "#eef8ff",
      fontSize: 15
    }).button;

    this.attackButton = this.createCircleButton({
      x: attackX,
      y: attackY,
      radius: 31,
      hitRadius: 44,
      label: "払う",
      fillColor: 0x3b1f2a,
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
      fillColor: 0x071219,
      strokeColor: 0x25f6d4,
      labelColor: "#d9fff6",
      fontSize: 24
    });

    this.cleanButton.on("pointerdown", () => {
      this.cleanPressed = true;
      this.cleanButton.setScale(0.94);
      this.cleanButton.setAlpha(1);
      scene.time.delayedCall(110, () => {
        if (this.destroyed) return;
        this.cleanButton.setScale(1);
        this.cleanButton.setAlpha(this.primaryMode === "exit" ? 0.94 : 0.9);
      });
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
      this.dodgePointerId = null;
      this.attackPointerId = null;
      this.cleanPressed = false;
      this.cleanButton.setScale(1);
      this.cleanButton.setAlpha(0.9);
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
    return false;
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
      this.cleanButton.setFillStyle(0x0b4c37, 0.94);
      this.cleanButton.setStrokeStyle(3, 0x8fffe5, 0.95);
      this.cleanLabel.setText("帰還");
      this.cleanLabel.setColor("#f8fff0");
      return;
    }

    this.cleanButton.setFillStyle(0x073c39, 0.9);
    this.cleanButton.setStrokeStyle(3, 0x25f6d4, 0.9);
    this.cleanLabel.setText("掃除");
    this.cleanLabel.setColor("#d9fff6");
  }

  setCleaningActive(active: boolean): void {
    if (this.primaryMode !== "clean") return;
    if (active) {
      this.cleanButton.setFillStyle(0x0f6b5d, 0.98);
      this.cleanButton.setStrokeStyle(4, 0xbffff2, 0.98);
      this.cleanLabel.setText("中断");
      this.cleanLabel.setColor("#ffffff");
      return;
    }

    this.cleanButton.setFillStyle(0x073c39, 0.9);
    this.cleanButton.setStrokeStyle(3, 0x25f6d4, 0.9);
    this.cleanLabel.setText("掃除");
    this.cleanLabel.setColor("#d9fff6");
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
    const button = this.scene.add.circle(config.x, config.y, config.radius, config.fillColor, 0.9)
      .setStrokeStyle(3, config.strokeColor, 0.94)
      .setScrollFactor(0)
      .setDepth(100);

    button.setInteractive(
      new Phaser.Geom.Circle(config.radius, config.radius, config.hitRadius),
      Phaser.Geom.Circle.Contains
    );

    const label = this.scene.add.text(config.x, config.y, config.label, {
      fontFamily: UI_FONT,
      fontSize: `${config.fontSize}px`,
      color: config.labelColor,
      fontStyle: "700",
      stroke: "#061113",
      strokeThickness: 2
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
      0.82
    )
      .setStrokeStyle(2, config.strokeColor, 0.88)
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
      fontFamily: UI_FONT,
      fontSize: `${config.fontSize}px`,
      color: config.labelColor,
      fontStyle: "700",
      stroke: "#061113",
      strokeThickness: 2
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
