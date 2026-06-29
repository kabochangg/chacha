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
    this.add.rectangle(width / 2, height - 120, width * 0.9, 220, 0x2d2218, 0.45);

    this.add.text(width / 2, 112, "勇者のあとしまつ", {
      fontFamily: "sans-serif",
      fontSize: "34px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.add.text(width / 2, 158, "ダンジョン清掃員の生活", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#e0c28d"
    }).setOrigin(0.5);

    this.add.text(width / 2, 265, "勇者が去ったあと、\nダンジョンにはまだ仕事が残っている。", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#f3efe8",
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5);

    const startButton = this.add.rectangle(width / 2, height - 255, 232, 62, 0xd8913d, 1)
      .setStrokeStyle(3, 0xffd08a)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 255, "はじめる", {
      fontFamily: "sans-serif",
      fontSize: "22px",
      color: "#25170e",
      fontStyle: "700"
    }).setOrigin(0.5);

    const continueButton = this.add.rectangle(width / 2, height - 175, 232, 56, 0x3f5060, 1)
      .setStrokeStyle(2, 0xa7d2e7)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 175, `続きから (${save.progress.runs}回)`, {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#eef8ff",
      fontStyle: "700"
    }).setOrigin(0.5);

    startButton.on("pointerup", () => {
      resetSave();
      this.scene.start("BaseScene");
    });
    continueButton.on("pointerup", () => this.scene.start("BaseScene"));
  }
}
