import Phaser from "phaser";
import { ITEMS, type ItemId } from "../data/items";
import { getBagUpgradeCost, getBroomUpgradeCost } from "../data/upgrades";
import { loadSave, saveGame } from "../systems/SaveSystem";
import type { RunResult } from "../types";

export class ResultScene extends Phaser.Scene {
  private result!: RunResult;

  constructor() {
    super("ResultScene");
  }

  init(data: RunResult): void {
    this.result = data;
  }

  create(): void {
    const { width, height } = this.scale;
    const save = loadSave();

    save.player.money += this.result.earnedMoney;
    save.progress.runs += 1;
    saveGame(save);

    this.cameras.main.setBackgroundColor("#181820");
    this.add.rectangle(width / 2, height / 2, width, height, 0x181820);
    this.add.rectangle(width / 2, 194, width - 34, 284, 0x30281f, 1)
      .setStrokeStyle(2, 0x8b6338, 0.9);

    this.add.text(width / 2, 58, "作業報告", {
      fontFamily: "sans-serif",
      fontSize: "30px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5);

    const cleanRate = Math.floor(Math.min(100, this.result.cleanScore));
    const seconds = Math.max(1, Math.floor(this.result.durationMs / 1000));
    const minutes = Math.floor(seconds / 60);
    const rest = String(seconds % 60).padStart(2, "0");
    const inventoryText = this.formatInventory(this.result.inventory);
    const broomCost = getBroomUpgradeCost(save.player.broomLevel);
    const bagCost = getBagUpgradeCost(save.player.bagLevel);
    const nearestUpgrade = Math.min(
      Math.max(0, broomCost - save.player.money),
      Math.max(0, bagCost - save.player.money)
    );
    const nextUpgradeText = nearestUpgrade === 0 ? "強化できます" : `次の強化まで あと${nearestUpgrade}G`;

    this.add.text(width / 2, 190,
      `ランク ${this.result.rank}\n` +
      `清掃率 ${cleanRate}% (${this.result.cleaned}/${this.result.totalDebris})\n` +
      `回収素材 ${inventoryText}\n` +
      `今回の売上 ${this.result.earnedMoney}G / 所持金 ${save.player.money}G\n` +
      `${nextUpgradeText}\n` +
      `被ダメージ ${this.result.damageTaken} / 作業時間 ${minutes}:${rest}`,
      {
        fontFamily: "sans-serif",
        fontSize: "17px",
        color: "#f3efe8",
        align: "center",
        lineSpacing: 8
      }
    ).setOrigin(0.5);

    this.add.text(width / 2, 358, this.result.cleared ? "無事に帰還しました。今日も床が少しきれいです。" : "途中撤退。持ち帰れた分だけ売上になります。", {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#d7b77e",
      align: "center",
      wordWrap: { width: width - 70 }
    }).setOrigin(0.5);

    this.createButton(width / 2, height - 222, 268, 60, "もう一回行く", 0xd8913d, () => {
      this.scene.start("DungeonScene");
    });
    this.createButton(width / 2, height - 150, 268, 56, "拠点へ戻る", 0x4e6b7d, () => {
      this.scene.start("BaseScene");
    });
    this.createButton(width / 2, height - 80, 268, 48, "タイトルへ", 0x2a2d38, () => {
      this.scene.start("TitleScene");
    });
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

  private formatInventory(inventory: Record<ItemId, number>): string {
    const lines = Object.entries(inventory)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => `${ITEMS[id as ItemId].name}x${count}`);

    return lines.length > 0 ? lines.join(" / ") : "なし";
  }
}
