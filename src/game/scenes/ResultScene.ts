import Phaser from "phaser";
import { ASSET_KEYS } from "../data/assets";
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
    const rankColor = this.getRankColor(this.result.rank);

    this.cameras.main.setBackgroundColor("#181820");
    this.add.rectangle(width / 2, height / 2, width, height, 0x171722);
    this.add.rectangle(width / 2, height / 2, width, height, 0x241a19, 0.62);
    this.add.ellipse(width / 2, 126, width * 0.82, 156, 0xf2c36b, 0.08);
    this.add.rectangle(width / 2, height / 2 - 40, width - 34, 356, 0x30281f, 0.98)
      .setStrokeStyle(2, 0xe2b56f, 0.82);
    this.add.text(width / 2, 58, "作業報告", {
      fontFamily: "sans-serif",
      fontSize: "32px",
      color: "#f8e7c7",
      fontStyle: "700",
      stroke: "#120b0c",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.circle(width / 2, 126, 42, rankColor, 0.94)
      .setStrokeStyle(3, 0xffe0a3, 0.92);
    this.add.text(width / 2, 126, this.result.rank, {
      fontFamily: "sans-serif",
      fontSize: "42px",
      color: "#fff4df",
      fontStyle: "700",
      stroke: "#120b0c",
      strokeThickness: 6
    }).setOrigin(0.5);
    this.add.text(width / 2, 185,
      `清掃率 ${cleanRate}% (${this.result.cleaned}/${this.result.totalDebris})\n` +
      `売却見込み ${this.result.earnedMoney}G / 被ダメ ${this.result.damageTaken}`,
      {
        fontFamily: "sans-serif",
        fontSize: "17px",
        color: "#fff4df",
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: width - 58 },
        stroke: "#120b0c",
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    this.add.rectangle(width / 2, 270, width - 70, 88, 0x171722, 0.78)
      .setStrokeStyle(2, 0x8b6338, 0.6);
    this.add.image(width / 2 - 116, 270, ASSET_KEYS.player.bag).setDisplaySize(42, 42);
    this.add.text(width / 2 - 82, 270, `回収素材\n${inventoryText}`, {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#ffe0a3",
      align: "left",
      lineSpacing: 5,
      wordWrap: { width: width - 156 },
      stroke: "#120b0c",
      strokeThickness: 3
    }).setOrigin(0, 0.5);

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
      wordWrap: { width: width - 18 },
      stroke: "#120b0c",
      strokeThickness: 4
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

  private getRankColor(rank: RunResult["rank"]): number {
    if (rank === "S") return 0xdca84a;
    if (rank === "A") return 0x4d8f6a;
    if (rank === "B") return 0x4e6b7d;
    if (rank === "C") return 0x8b6338;
    return 0x5c5a62;
  }
}
