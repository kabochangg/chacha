import Phaser from "phaser";
import { ASSET_KEYS } from "../data/assets";
import { loadSave, resetSave } from "../systems/SaveSystem";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    const { width, height } = this.scale;
    const save = loadSave();
    const compact = height < 740;
    const titleY = compact ? 118 : 154;
    const subtitleY = titleY + (compact ? 42 : 50);
    const sceneY = compact ? 284 : 348;
    const firstButtonY = height - (compact ? 188 : 226);
    const secondButtonY = height - (compact ? 124 : 154);

    this.cameras.main.setBackgroundColor("#050b0f");
    this.add.rectangle(width / 2, height / 2, width, height, 0x050b0f);
    this.add.rectangle(width / 2, height / 2, width - 18, height - 18, 0x07161a, 0.92)
      .setStrokeStyle(1, 0x1dfff0, 0.22);
    this.add.ellipse(width / 2, sceneY - 96, width * 0.58, compact ? 230 : 270, 0x12f5d2, 0.14);
    this.add.ellipse(width / 2, sceneY + 42, width * 0.82, compact ? 210 : 250, 0x0bb49f, 0.08);

    const tileTop = compact ? 246 : 302;
    for (let y = tileTop; y < Math.min(height - 282, tileTop + 230); y += 38) {
      for (let x = 34; x < width - 34; x += 42) {
        const tint = (Math.floor(x / 42) + Math.floor(y / 38)) % 2 === 0 ? 0x18262a : 0x101d22;
        this.add.rectangle(x, y, 40, 36, tint, 0.86)
          .setStrokeStyle(1, 0x2d5556, 0.18);
      }
    }

    this.add.image(width / 2, sceneY - (compact ? 82 : 104), ASSET_KEYS.dungeon.exitOpen)
      .setDisplaySize(compact ? 94 : 116, compact ? 124 : 150)
      .setAlpha(0.96);
    this.add.rectangle(width / 2, sceneY - (compact ? 104 : 132), compact ? 42 : 52, compact ? 88 : 106, 0x19f4d3, 0.14);
    this.add.image(width / 2, sceneY + (compact ? 28 : 36), ASSET_KEYS.player.cleaner)
      .setDisplaySize(compact ? 64 : 76, compact ? 86 : 102);
    this.add.image(width / 2 - 112, sceneY + 10, ASSET_KEYS.debris.brokenChest).setDisplaySize(58, 43).setAlpha(0.78);
    this.add.image(width / 2 + 112, sceneY + 14, ASSET_KEYS.debris.slimeTrail).setDisplaySize(50, 34).setAlpha(0.86);
    this.add.image(width / 2 - 70, sceneY + 78, ASSET_KEYS.item.stone).setDisplaySize(26, 26).setAlpha(0.9);
    this.add.image(width / 2 + 72, sceneY + 76, ASSET_KEYS.item.slime).setDisplaySize(28, 28).setAlpha(0.9);

    this.add.text(width / 2, titleY - (compact ? 42 : 56), "AFTER HEROES / CLEANUP LOG", {
      fontFamily: "sans-serif",
      fontSize: "10px",
      color: "#20f4d0",
      fontStyle: "500"
    }).setOrigin(0.5).setAlpha(0.9);
    this.add.text(width / 2, titleY, "勇者のあとしまつ", {
      fontFamily: "sans-serif",
      fontSize: width < 430 ? (compact ? "25px" : "27px") : "31px",
      color: "#fff6df",
      fontStyle: "700",
      stroke: "#061113",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(width / 2, subtitleY, "ダンジョン清掃員の生活", {
      fontFamily: "sans-serif",
      fontSize: compact ? "16px" : "18px",
      color: "#26f6d4",
      fontStyle: "600",
      stroke: "#061113",
      strokeThickness: 3
    }).setOrigin(0.5);

    this.createButton(width / 2, firstButtonY, width - 108, compact ? 56 : 62, "はじめから", 0x073c39, "#28ffd9", () => {
      resetSave();
      this.scene.start("BaseScene");
    });
    this.createButton(width / 2, secondButtonY, width - 108, compact ? 52 : 56, `つづきから (${save.progress.runs}回)`, 0x0b1118, "#f1f7f4", () => {
      this.scene.start("BaseScene");
    });
    this.add.text(width / 2, height - 22, "v0.1.0", {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#96aeb0"
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, color: number, labelColor: string, onClick: () => void): void {
    const button = this.add.rectangle(x, y, width, height, color, 0.9)
      .setStrokeStyle(1, 0x25f6d4, 0.76)
      .setInteractive({ useHandCursor: true });
    this.add.rectangle(x - width / 2 + 4, y, 4, height - 12, 0x25f6d4, 0.72);
    this.add.rectangle(x, y + height / 2 - 3, width - 20, 1, 0xffffff, 0.12);
    this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: "19px",
      color: labelColor,
      fontStyle: "700",
      stroke: "#061113",
      strokeThickness: 2
    }).setOrigin(0.5);
    button.on("pointerdown", () => button.setScale(0.98));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerup", () => {
      button.setScale(1);
      onClick();
    });
  }
}
