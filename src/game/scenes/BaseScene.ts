import Phaser from "phaser";
import { getInventoryCount } from "../data/items";
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
    this.add.rectangle(width / 2, 168, width - 34, 206, 0x3c2d23, 1)
      .setStrokeStyle(2, 0x7a5735);

    this.add.text(width / 2, 62, "清掃員の部屋", {
      fontFamily: "sans-serif",
      fontSize: "26px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, 150, "", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#f3efe8",
      align: "center",
      lineSpacing: 10
    }).setOrigin(0.5);

    this.messageText = this.add.text(width / 2, 290, "掃除して素材を売り、道具を強化しよう。", {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#d7b77e",
      align: "center"
    }).setOrigin(0.5);

    const broomCost = getBroomUpgradeCost(this.save.player.broomLevel);
    const bagCost = getBagUpgradeCost(this.save.player.bagLevel);
    const canUpgradeBroom = this.save.player.money >= broomCost;
    const canUpgradeBag = this.save.player.money >= bagCost;

    this.createButton(width / 2, height - 260, 270, 60, "はじまりの地下道へ", 0xd8913d, () => {
      this.scene.start("DungeonScene");
    });
    this.createButton(
      width / 2,
      height - 188,
      270,
      54,
      `ほうきを強化 ${broomCost}G`,
      canUpgradeBroom ? 0x7fa04a : 0x43513a,
      () => this.upgradeBroom()
    );
    this.createButton(
      width / 2,
      height - 124,
      270,
      54,
      `バッグを強化 ${bagCost}G`,
      canUpgradeBag ? 0x5f86a0 : 0x3e4d5a,
      () => this.upgradeBag()
    );
    this.createButton(width / 2, height - 60, 270, 48, "タイトルへ", 0x2a2d38, () => this.scene.start("TitleScene"));

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
      fontSize: "19px",
      color: "#fff4df",
      fontStyle: "700"
    }).setOrigin(0.5);
    button.on("pointerup", onClick);
  }

  private upgradeBroom(): void {
    const cost = getBroomUpgradeCost(this.save.player.broomLevel);
    if (this.save.player.money < cost) {
      this.messageText.setText(`ほうき強化には ${cost}G 必要です。`);
      return;
    }
    this.save.player.money -= cost;
    this.save.player.broomLevel += 1;
    saveGame(this.save);
    this.messageText.setText("ほうきの清掃力が上がった。");
    this.refreshStatus();
    this.time.delayedCall(420, () => this.scene.restart());
  }

  private upgradeBag(): void {
    const cost = getBagUpgradeCost(this.save.player.bagLevel);
    if (this.save.player.money < cost) {
      this.messageText.setText(`バッグ強化には ${cost}G 必要です。`);
      return;
    }
    this.save.player.money -= cost;
    this.save.player.bagLevel += 1;
    saveGame(this.save);
    this.messageText.setText("バッグの容量が増えた。");
    this.refreshStatus();
    this.time.delayedCall(420, () => this.scene.restart());
  }

  private refreshStatus(): void {
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const inventoryCount = getInventoryCount(this.save.inventory);
    const broomCost = getBroomUpgradeCost(this.save.player.broomLevel);
    const bagCost = getBagUpgradeCost(this.save.player.bagLevel);
    const broomShortage = Math.max(0, broomCost - this.save.player.money);
    const bagShortage = Math.max(0, bagCost - this.save.player.money);
    this.statusText.setText(
      `ほうき Lv.${this.save.player.broomLevel}   バッグ Lv.${this.save.player.bagLevel}\n` +
      `所持金 ${this.save.player.money}G   バッグ容量 ${inventoryCount} / ${capacity}\n` +
      `次: ほうき ${broomShortage === 0 ? "強化可能" : `あと${broomShortage}G`} / ` +
      `バッグ ${bagShortage === 0 ? "強化可能" : `あと${bagShortage}G`}`
    );
  }
}
