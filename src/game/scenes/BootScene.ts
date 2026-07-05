import Phaser from "phaser";
import { GAME_IMAGE_ASSETS } from "../data/assets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    for (const asset of GAME_IMAGE_ASSETS) {
      this.load.image(asset.key, asset.path);
    }
  }

  create(): void {
    this.scale.lockOrientation("portrait");
    this.input.addPointer(3);
    this.scene.start("TitleScene");
  }
}
