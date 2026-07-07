import Phaser from "phaser";

type Vector = Phaser.Math.Vector2;
export type ControlLayout = "leftStickRightButtons" | "rightStickLeftButtons";

export class VirtualPad {
  private readonly base: Phaser.GameObjects.Arc;
  private readonly knob: Phaser.GameObjects.Arc;
  private readonly center = new Phaser.Math.Vector2();
  private readonly direction = new Phaser.Math.Vector2();
  private activePointerId: number | null = null;
  private readonly radius = 54;
  private readonly handlePointerMove: (pointer: Phaser.Input.Pointer) => void;
  private readonly handlePointerEnd: (pointer: Phaser.Input.Pointer) => void;
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene, layout: ControlLayout = "leftStickRightButtons") {
    const { width, height } = scene.scale;
    const bottomInset = readSafeAreaInset("bottom");
    const sideInset = width < 430 ? 94 : 104;
    const x = layout === "rightStickLeftButtons" ? width - sideInset : sideInset;
    this.center.set(x, height - Math.max(86, bottomInset + 76));

    this.base = scene.add.circle(this.center.x, this.center.y, this.radius, 0x1e2430, 0.76)
      .setStrokeStyle(4, 0xe2b56f, 0.88)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive(new Phaser.Geom.Circle(this.radius, this.radius, this.radius + 18), Phaser.Geom.Circle.Contains);

    this.knob = scene.add.circle(this.center.x, this.center.y, 24, 0xf2d49b, 0.96)
      .setStrokeStyle(3, 0x5b3a1f, 0.92)
      .setScrollFactor(0)
      .setDepth(101);

    this.base.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId !== null) return;
      this.activePointerId = pointer.id;
      this.updateFromPointer(pointer);
    });

    this.handlePointerMove = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) this.updateFromPointer(pointer);
    };

    this.handlePointerEnd = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) this.reset();
    };

    scene.input.on("pointermove", this.handlePointerMove);
    scene.input.on("pointerup", this.handlePointerEnd);
    scene.input.on("pointerupoutside", this.handlePointerEnd);
    scene.input.on("pointercancel", this.handlePointerEnd);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.reset, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
  }

  getDirection(): Vector {
    return this.direction;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.input.off("pointermove", this.handlePointerMove);
    this.scene.input.off("pointerup", this.handlePointerEnd);
    this.scene.input.off("pointerupoutside", this.handlePointerEnd);
    this.scene.input.off("pointercancel", this.handlePointerEnd);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.reset, this);
    this.reset();
  }

  private updateFromPointer(pointer: Phaser.Input.Pointer): void {
    const local = new Phaser.Math.Vector2(pointer.x - this.center.x, pointer.y - this.center.y);
    const distance = Math.min(local.length(), this.radius);
    const angle = local.angle();

    if (local.length() < 8) {
      this.direction.set(0, 0);
      this.knob.setPosition(this.center.x, this.center.y);
      return;
    }

    this.direction.set(Math.cos(angle), Math.sin(angle)).scale(distance / this.radius);
    this.knob.setPosition(this.center.x + Math.cos(angle) * distance, this.center.y + Math.sin(angle) * distance);
  }

  private reset(): void {
    this.activePointerId = null;
    this.direction.set(0, 0);
    this.knob.setPosition(this.center.x, this.center.y);
  }
}

function readSafeAreaInset(side: "top" | "bottom"): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--safe-area-${side}`)
    .trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
