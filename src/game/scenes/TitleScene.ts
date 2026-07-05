import Phaser from "phaser";
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
    this.add.rectangle(width / 2, height - 118, width * 0.92, 214, 0x2d2218, 0.58)
      .setStrokeStyle(2, 0x7b5635, 0.72);

    this.add.text(width / 2, 82, "勇者のあとしまつ", {
      fontFamily: "sans-serif",
      fontSize: "34px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.add.text(width / 2, 124, "ダンジョン清掃員の生活", {
      fontFamily: "sans-serif",
      fontSize: "20px",
      color: "#e2b56f",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.add.text(width / 2, 222, "勇者が帰ったあと、\n地下道にはまだ仕事が残っている。", {
      fontFamily: "sans-serif",
      fontSize: "19px",
      color: "#f3efe8",
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, 302, "残骸を掃除して素材を集め、\nほうきとバッグを強化しよう。", {
      fontFamily: "sans-serif",
      fontSize: "17px",
      color: "#d7b77e",
      align: "center",
      lineSpacing: 7
    }).setOrigin(0.5);

    this.createButton(width / 2, height - 252, 236, 62, "はじめから", 0xd8913d, "#25170e", () => {
      resetSave();
      this.scene.start("BaseScene");
    });

    this.createButton(width / 2, height - 174, 236, 56, `つづきから (${save.progress.runs}回)`, 0x3f6472, "#eef8ff", () => {
      this.scene.start("BaseScene");
    });

    this.add.text(width / 2, height - 82, "スマホ縦画面推奨 / PCはWASD・Space対応", {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#a99778",
      align: "center"
    }).setOrigin(0.5);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    labelColor: string,
    onClick: () => void
  ): void {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(3, 0xffd08a, 0.82)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: "22px",
      color: labelColor,
      fontStyle: "700"
    }).setOrigin(0.5);

    button.on("pointerdown", () => button.setScale(0.98));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerup", () => {
      button.setScale(1);
      onClick();
    });
  }
}
