import Phaser from "phaser";
import { ITEMS, type ItemId } from "../data/items";
import { loadSave, saveGame } from "../systems/SaveSystem";
import type { RunResult } from "../types";

export class ResultScene extends Phaser.Scene {
  private result!: RunResult;
  private rewardApplied = false;

  constructor() {
    super("ResultScene");
  }

  init(data: RunResult): void {
    this.result = data;
  }

  create(): void {
    const { width, height } = this.scale;
    const cleanRate = Math.floor(Math.min(100, this.result.cleanScore));
    const inventoryText = this.formatInventory(this.result.inventory);

    this.cameras.main.setBackgroundColor("#181820");
    this.add.rectangle(width / 2, height / 2, width, height, 0x181820);
    this.add.rectangle(width / 2, height / 2 - 48, width - 34, 330, 0x30281f, 1)
      .setStrokeStyle(2, 0x8b6338, 0.9);
    this.add.text(width / 2, 58, "作業報告", {
      fontFamily: "sans-serif",
      fontSize: "32px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5);
    this.add.text(width / 2, 178,
      `ランク ${this.result.rank}\n` +
      `清掃率 ${cleanRate}% (${this.result.cleaned}/${this.result.totalDebris})\n` +
      `素材 ${inventoryText}\n` +
      `売却見込み ${this.result.earnedMoney}G\n` +
      `被ダメ ${this.result.damageTaken}`,
      {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#f3efe8",
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: width - 58 }
      }
    ).setOrigin(0.5);

    this.createButton(width / 2, height - 222, 286, 60, "換金してもう一回", 0xd8913d, () => {
      this.applyRunReward("sell");
      this.scene.start("DungeonScene", { floor: 1 });
    });
    this.createButton(width / 2, height - 150, 286, 56, "倉庫へ収納して拠点へ", 0x4e6b7d, () => {
      this.applyRunReward("store");
      this.scene.start("BaseScene");
    });
    this.createButton(width / 2, height - 80, 286, 48, "保管してタイトルへ", 0x2a2d38, () => {
      this.applyRunReward("store");
      this.scene.start("TitleScene");
    });
  }

  private applyRunReward(mode: "sell" | "store"): void {
    if (this.rewardApplied) return;
    this.rewardApplied = true;
    const save = loadSave();

    if (mode === "sell") {
      save.player.money += this.result.earnedMoney;
    } else {
      for (const [id, count] of Object.entries(this.result.inventory)) {
        save.inventory[id as ItemId] += count;
      }
    }

    save.progress.runs += 1;
    saveGame(save);
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void): void {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(2, 0xffd08a, 0.72)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: height >= 58 ? "21px" : "19px",
      color: "#fff4df",
      fontStyle: "700",
      align: "center",
      wordWrap: { width: width - 18 }
    }).setOrigin(0.5);
    button.on("pointerdown", () => button.setScale(0.98));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerup", () => {
      button.setScale(1);
      onClick();
    });
  }

  private formatInventory(inventory: Record<ItemId, number>): string {
    const rows = Object.entries(inventory)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => `${ITEMS[id as ItemId].name}x${count}`);
    return rows.length > 0 ? rows.join(" / ") : "なし";
  }
}
