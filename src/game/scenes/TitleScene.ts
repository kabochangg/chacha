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
    const titleY = compact ? 56 : 72;
    const subtitleY = compact ? 94 : 116;
    const sceneY = compact ? 230 : 278;
    const itemY = sceneY + (compact ? 58 : 72);
    const firstButtonY = height - (compact ? 204 : 250);
    const secondButtonY = height - (compact ? 136 : 174);
    const footerY = height - (compact ? 58 : 84);
    const descY = Math.min(compact ? 350 : 410, firstButtonY - 94);

    this.cameras.main.setBackgroundColor("#171722");
    this.add.rectangle(width / 2, height / 2, width, height, 0x171722);
    this.add.rectangle(width / 2, height / 2, width, height, 0x211918, 0.72);
    this.add.ellipse(width / 2, compact ? 108 : 128, width * 0.86, compact ? 150 : 190, 0xf2c36b, 0.07);
    this.add.ellipse(width / 2, height - 156, width * 0.9, compact ? 132 : 180, 0x6aa2cf, 0.045);
    for (let y = compact ? 140 : 170; y < height - 112; y += 52) {
      this.add.rectangle(width / 2, y, width - 34, 1, 0x8b6338, 0.14);
    }

    this.add.image(width / 2 - 96, sceneY - 28, ASSET_KEYS.debris.brokenCrate).setDisplaySize(compact ? 62 : 72, compact ? 42 : 48).setAlpha(0.84);
    this.add.image(width / 2 + 98, sceneY - 32, ASSET_KEYS.dungeon.exitOpen).setDisplaySize(compact ? 58 : 68, compact ? 74 : 88).setAlpha(0.92);
    this.add.image(width / 2, sceneY, ASSET_KEYS.player.cleaner).setDisplaySize(compact ? 58 : 70, compact ? 76 : 92);
    this.add.image(width / 2 - 36, itemY, ASSET_KEYS.item.wood).setDisplaySize(compact ? 24 : 30, compact ? 24 : 30);
    this.add.image(width / 2 + 8, itemY, ASSET_KEYS.item.stone).setDisplaySize(compact ? 24 : 30, compact ? 24 : 30);
    this.add.image(width / 2 + 50, itemY, ASSET_KEYS.item.slime).setDisplaySize(compact ? 24 : 30, compact ? 24 : 30);

    this.add.text(width / 2, titleY, "勇者のあとしまつ", {
      fontFamily: "sans-serif",
      fontSize: width < 430 ? (compact ? "25px" : "27px") : "31px",
      color: "#f8e7c7",
      fontStyle: "600",
      stroke: "#120b0c",
      strokeThickness: 1
    }).setOrigin(0.5);
    this.add.text(width / 2, subtitleY, "ダンジョン清掃員の生活", {
      fontFamily: "sans-serif",
      fontSize: compact ? "16px" : "18px",
      color: "#e2b56f",
      fontStyle: "500",
      stroke: "#120b0c",
      strokeThickness: 0
    }).setOrigin(0.5);
    this.add.rectangle(width / 2, descY, width - 52, compact ? 64 : 72, 0x171722, 0.72)
      .setStrokeStyle(1, 0xe2b56f, 0.42);
    this.add.text(width / 2, descY, "残骸を掃除して素材を集め、\n拠点で道具を整えましょう。", {
      fontFamily: "sans-serif",
      fontSize: compact ? "14px" : "15px",
      color: "#fff4df",
      align: "center",
      lineSpacing: 6,
      wordWrap: { width: width - 70, useAdvancedWrap: true },
      stroke: "#120b0c",
      strokeThickness: 0
    }).setOrigin(0.5);

    this.createButton(width / 2, firstButtonY, 236, compact ? 56 : 62, "はじめから", 0xd8913d, "#25170e", () => {
      resetSave();
      this.scene.start("BaseScene");
    });
    this.createButton(width / 2, secondButtonY, 236, compact ? 52 : 56, `つづきから (${save.progress.runs}回)`, 0x3f6472, "#eef8ff", () => {
      this.scene.start("BaseScene");
    });
    this.add.text(width / 2, footerY, "スマホ縦画面推奨 / PCはWASD・Space対応", {
      fontFamily: "sans-serif",
      fontSize: compact ? "12px" : "13px",
      color: "#ffe0a3",
      stroke: "#120b0c",
      strokeThickness: 0
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, color: number, labelColor: string, onClick: () => void): void {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(2, 0xffd08a, 0.74)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: "19px",
      color: labelColor,
      fontStyle: "500",
      stroke: labelColor === "#25170e" ? "#f7c574" : "#120b0c",
      strokeThickness: 0
    }).setOrigin(0.5);
    button.on("pointerdown", () => button.setScale(0.98));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerup", () => {
      button.setScale(1);
      onClick();
    });
  }
}
