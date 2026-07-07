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

    this.cameras.main.setBackgroundColor("#171722");
    this.add.rectangle(width / 2, height / 2, width, height, 0x171722);
    this.add.rectangle(width / 2, height / 2, width, height, 0x241a19, 0.68);
    this.add.ellipse(width / 2, 128, width * 0.86, 190, 0xf2c36b, 0.08);
    this.add.ellipse(width / 2, height - 170, width * 0.9, 180, 0x6aa2cf, 0.05);
    for (let y = 170; y < height - 120; y += 52) {
      this.add.rectangle(width / 2, y, width - 34, 2, 0x8b6338, 0.13);
    }

    this.add.image(width / 2 - 96, 250, ASSET_KEYS.debris.brokenCrate).setDisplaySize(72, 48).setAlpha(0.84);
    this.add.image(width / 2 + 98, 246, ASSET_KEYS.dungeon.exitOpen).setDisplaySize(68, 88).setAlpha(0.92);
    this.add.image(width / 2, 278, ASSET_KEYS.player.cleaner).setDisplaySize(70, 92);
    this.add.image(width / 2 - 36, 350, ASSET_KEYS.item.wood).setDisplaySize(30, 30);
    this.add.image(width / 2 + 8, 350, ASSET_KEYS.item.stone).setDisplaySize(30, 30);
    this.add.image(width / 2 + 50, 350, ASSET_KEYS.item.slime).setDisplaySize(30, 30);

    this.add.text(width / 2, 72, "勇者のあとしまつ", {
      fontFamily: "sans-serif",
      fontSize: width < 430 ? "29px" : "34px",
      color: "#f8e7c7",
      fontStyle: "700",
      stroke: "#120b0c",
      strokeThickness: 6
    }).setOrigin(0.5);
    this.add.text(width / 2, 116, "ダンジョン清掃員の生活", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#e2b56f",
      fontStyle: "700",
      stroke: "#120b0c",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.add.rectangle(width / 2, 410, width - 48, 76, 0x171722, 0.78)
      .setStrokeStyle(2, 0xe2b56f, 0.45);
    this.add.text(width / 2, 410, "残骸を掃除して素材を集め、\n拠点で道具を整えましょう。", {
      fontFamily: "sans-serif",
      fontSize: "17px",
      color: "#fff4df",
      align: "center",
      lineSpacing: 8,
      wordWrap: { width: width - 64 },
      stroke: "#120b0c",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.createButton(width / 2, height - 250, 236, 62, "はじめから", 0xd8913d, "#25170e", () => {
      resetSave();
      this.scene.start("BaseScene");
    });
    this.createButton(width / 2, height - 174, 236, 56, `つづきから (${save.progress.runs}回)`, 0x3f6472, "#eef8ff", () => {
      this.scene.start("BaseScene");
    });
    this.add.text(width / 2, height - 84, "スマホ縦画面推奨 / PCはWASD・Space対応", {
      fontFamily: "sans-serif",
      fontSize: "14px",
      color: "#ffe0a3",
      stroke: "#120b0c",
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, color: number, labelColor: string, onClick: () => void): void {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(3, 0xffd08a, 0.82)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: "22px",
      color: labelColor,
      fontStyle: "700",
      stroke: labelColor === "#25170e" ? "#f7c574" : "#120b0c",
      strokeThickness: 3
    }).setOrigin(0.5);
    button.on("pointerdown", () => button.setScale(0.98));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerup", () => {
      button.setScale(1);
      onClick();
    });
  }
}
