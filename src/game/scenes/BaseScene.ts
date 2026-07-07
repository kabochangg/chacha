import Phaser from "phaser";
import { ITEMS, type ItemId, getInventoryCount, getInventoryValue } from "../data/items";
import { getBagCapacity } from "../data/upgrades";
import { loadSave, saveGame, type SaveData } from "../systems/SaveSystem";

export class BaseScene extends Phaser.Scene {
  private save!: SaveData;

  constructor() {
    super("BaseScene");
  }

  create(): void {
    this.save = loadSave();
    saveGame(this.save);

    const { width, height } = this.scale;
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const count = getInventoryCount(this.save.inventory);
    const value = getInventoryValue(this.save.inventory);
    const inventoryText = this.formatInventory(this.save.inventory);

    this.cameras.main.setBackgroundColor("#1d1a22");
    this.add.rectangle(width / 2, height / 2, width, height, 0x1d1a22);
    this.add.rectangle(width / 2, height / 2, width - 34, height - 164, 0x30281f, 0.96)
      .setStrokeStyle(2, 0x8b6338, 0.9);
    this.add.text(width / 2, 42, "拠点", {
      fontFamily: "sans-serif",
      fontSize: "30px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5);
    this.add.text(width / 2, 92,
      `所持金 ${this.save.player.money}G / 倉庫 ${count}/${capacity} / 出動 ${this.save.progress.runs}回\n` +
      `ほうきLv.${this.save.player.broomLevel} バッグLv.${this.save.player.bagLevel} ` +
      `払うLv.${this.save.player.attackLevel} スタミナLv.${this.save.player.staminaLevel}`,
      {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#f3efe8",
        align: "center",
        lineSpacing: 5,
        wordWrap: { width: width - 48 }
      }
    ).setOrigin(0.5);
    this.add.text(width / 2, 178, `倉庫素材\n${inventoryText}`, {
      fontFamily: "sans-serif",
      fontSize: "17px",
      color: "#ffe0a3",
      align: "center",
      lineSpacing: 8,
      wordWrap: { width: width - 58 }
    }).setOrigin(0.5);
    this.add.text(width / 2, 278, "B1FからB5Fまで短く潜り、素材を持ち帰ります。", {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#d7b77e",
      align: "center",
      wordWrap: { width: width - 58 }
    }).setOrigin(0.5);

    this.createButton(width / 2, height - 254, 270, 58, "はじまりの地下道へ", 0xd8913d, () => {
      this.scene.start("DungeonScene", { floor: 1 });
    });
    this.createButton(width / 2, height - 184, 270, 48, value > 0 ? `倉庫素材を売る +${value}G` : "倉庫は空です", value > 0 ? 0x4e6b7d : 0x2a2d38, () => {
      if (value <= 0) return;
      Object.keys(this.save.inventory).forEach((id) => {
        this.save.inventory[id as ItemId] = 0;
      });
      this.save.player.money += value;
      saveGame(this.save);
      this.scene.restart();
    });
    this.createButton(width / 2, height - 122, 270, 44, "タイトルへ", 0x2a2d38, () => this.scene.start("TitleScene"));
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void): void {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(2, 0xffd08a, 0.72)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#fff4df",
      fontStyle: "700",
      align: "center",
      wordWrap: { width: width - 16 }
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
      .map(([id, count]) => `${ITEMS[id as ItemId].name} x${count}`);
    return rows.length > 0 ? rows.join(" / ") : "なし";
  }
}
