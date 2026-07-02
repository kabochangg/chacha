import Phaser from "phaser";
import { getBagCapacity, getBagUpgradeCost, getBroomUpgradeCost } from "../data/upgrades";
import { loadSave, saveGame, type SaveData } from "../systems/SaveSystem";

export class BaseScene extends Phaser.Scene {
  private save!: SaveData;
  private statusText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super("BaseScene");
  }

  create(): void {
    this.save = loadSave();
    saveGame(this.save);

    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#1d1a22");
    this.add.rectangle(width / 2, height / 2, width, height, 0x1d1a22);
    this.add.rectangle(width / 2, 168, width - 34, 216, 0x3c2d23, 1)
      .setStrokeStyle(2, 0x7a5735);
    this.add.rectangle(width / 2, 330, width - 42, 92, 0x171722, 0.72)
      .setStrokeStyle(2, 0xe2b56f, 0.35);

    this.add.text(width / 2, 58, "清掃員の拠点", {
      fontFamily: "sans-serif",
      fontSize: "27px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.add.text(width / 2, 96, "次の仕事に備えよう", {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#d7b77e"
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, 168, "", {
      fontFamily: "sans-serif",
      fontSize: "17px",
      color: "#f3efe8",
      align: "center",
      lineSpacing: 10
    }).setOrigin(0.5);

    this.messageText = this.add.text(width / 2, 330, "掃除で素材を集め、売上で道具を強化します。", {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#ffe0a3",
      align: "center",
      wordWrap: { width: width - 76 }
    }).setOrigin(0.5);

    const broomCost = getBroomUpgradeCost(this.save.player.broomLevel);
    const bagCost = getBagUpgradeCost(this.save.player.bagLevel);
    const canUpgradeBroom = this.save.player.money >= broomCost;
    const canUpgradeBag = this.save.player.money >= bagCost;

    this.createButton(width / 2, height - 278, 282, 62, "はじまりの地下道へ", 0xd8913d, () => {
      this.scene.start("DungeonScene");
    });
    this.createButton(
      width / 2,
      height - 202,
      282,
      54,
      `ほうき強化 ${broomCost}G`,
      canUpgradeBroom ? 0x6f9345 : 0x43513a,
      () => this.upgradeBroom()
    );
    this.createButton(
      width / 2,
      height - 136,
      282,
      54,
      `バッグ強化 ${bagCost}G`,
      canUpgradeBag ? 0x4f7f96 : 0x3e4d5a,
      () => this.upgradeBag()
    );
    this.createButton(width / 2, height - 70, 282, 48, "タイトルへ", 0x2a2d38, () => this.scene.start("TitleScene"));

    this.refreshStatus();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    onClick: () => void
  ): void {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(2, 0xffd08a, 0.72)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: height >= 58 ? "20px" : "18px",
      color: "#fff4df",
      fontStyle: "700"
    }).setOrigin(0.5);
    button.on("pointerdown", () => button.setScale(0.98));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerup", () => {
      button.setScale(1);
      onClick();
    });
  }

  private upgradeBroom(): void {
    const cost = getBroomUpgradeCost(this.save.player.broomLevel);
    if (this.save.player.money < cost) {
      this.messageText.setText(`ほうき強化にはあと ${cost - this.save.player.money}G 必要です。`);
      return;
    }
    this.save.player.money -= cost;
    this.save.player.broomLevel += 1;
    saveGame(this.save);
    this.messageText.setText("ほうきの清掃力が上がりました。");
    this.refreshStatus();
    this.time.delayedCall(360, () => this.scene.restart());
  }

  private upgradeBag(): void {
    const cost = getBagUpgradeCost(this.save.player.bagLevel);
    if (this.save.player.money < cost) {
      this.messageText.setText(`バッグ強化にはあと ${cost - this.save.player.money}G 必要です。`);
      return;
    }
    this.save.player.money -= cost;
    this.save.player.bagLevel += 1;
    saveGame(this.save);
    this.messageText.setText("バッグの容量が増えました。");
    this.refreshStatus();
    this.time.delayedCall(360, () => this.scene.restart());
  }

  private refreshStatus(): void {
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const broomCost = getBroomUpgradeCost(this.save.player.broomLevel);
    const bagCost = getBagUpgradeCost(this.save.player.bagLevel);
    const broomShortage = Math.max(0, broomCost - this.save.player.money);
    const bagShortage = Math.max(0, bagCost - this.save.player.money);
    this.statusText.setText(
      `所持金 ${this.save.player.money}G   出動 ${this.save.progress.runs}回\n` +
      `ほうき Lv.${this.save.player.broomLevel}   バッグ Lv.${this.save.player.bagLevel} (${capacity}個)\n` +
      `次の強化: ほうき ${broomShortage === 0 ? "可能" : `あと${broomShortage}G`} / ` +
      `バッグ ${bagShortage === 0 ? "可能" : `あと${bagShortage}G`}`
    );
  }
}
