import Phaser from "phaser";
import { ITEMS, type ItemId, getInventoryCount } from "../data/items";
import {
  getAttackUpgradeCost,
  getBagCapacity,
  getBagUpgradeCost,
  getBroomUpgradeCost,
  getStaminaUpgradeCost
} from "../data/upgrades";
import { loadSave, saveGame, type SaveData } from "../systems/SaveSystem";

type BaseTab = "home" | "inventory" | "map" | "requests" | "shop";

export class BaseScene extends Phaser.Scene {
  private save!: SaveData;
  private panel!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private compact = false;
  private panelTop = 110;
  private panelBottom = 0;

  constructor() {
    super("BaseScene");
  }

  create(): void {
    this.save = loadSave();
    saveGame(this.save);

    const { width, height } = this.scale;
    this.compact = width < 430;
    this.cameras.main.setBackgroundColor("#1d1a22");
    this.add.rectangle(width / 2, height / 2, width, height, 0x1d1a22);
    this.panelBottom = height - 112;

    this.add.rectangle(width / 2, 58, width - 24, 82, 0x171722, 0.86)
      .setStrokeStyle(2, 0xe2b56f, 0.36);

    this.add.text(width / 2, 24, "清掃員の拠点", {
      fontFamily: "sans-serif",
      fontSize: this.compact ? "20px" : "25px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, this.compact ? 66 : 64, "", {
      fontFamily: "sans-serif",
      fontSize: this.compact ? "11px" : "14px",
      color: "#f3efe8",
      align: "center",
      lineSpacing: this.compact ? 2 : 5
    }).setOrigin(0.5);

    this.panel = this.add.container(0, 0);
    this.messageText = this.add.text(width / 2, this.compact ? height - 86 : height - 104, "", {
      fontFamily: "sans-serif",
      fontSize: this.compact ? "12px" : "14px",
      color: "#ffe0a3",
      align: "center",
      lineSpacing: 3,
      wordWrap: { width: width - 44, useAdvancedWrap: true }
    }).setOrigin(0.5);

    this.createTabBar();
    this.showTab("home");
    this.refreshStatus();
  }

  private createTabBar(): void {
    const { width, height } = this.scale;
    const tabs: Array<[BaseTab, string]> = [
      ["home", "ホーム"],
      ["inventory", "持ち物"],
      ["map", "マップ"],
      ["requests", "依頼"],
      ["shop", "ショップ"]
    ];
    const tabWidth = Math.floor((width - 20) / tabs.length);
    tabs.forEach(([tab, label], index) => {
      this.createButton(10 + tabWidth * index + tabWidth / 2, height - 38, tabWidth - 4, 48, label, 0x2a2d38, () => {
        this.showTab(tab);
      }, this.compact ? 11 : 13, false);
    });
  }

  private showTab(tab: BaseTab): void {
    this.panel.removeAll(true);
    this.save = loadSave();
    const { width, height } = this.scale;
    const panelHeight = this.panelBottom - this.panelTop;
    const panelBg = this.add.rectangle(width / 2, this.panelTop + panelHeight / 2, width - 34, panelHeight, 0x30281f, 0.96)
      .setStrokeStyle(2, 0x8b6338, 0.9);
    this.panel.add(panelBg);

    if (tab === "home") this.showHome();
    if (tab === "inventory") this.showInventory();
    if (tab === "map") this.showMap();
    if (tab === "requests") this.showRequests();
    if (tab === "shop") this.showShop();
    this.refreshStatus();
  }

  private showHome(): void {
    const { width, height } = this.scale;
    const buttonWidth = this.getButtonWidth();
    this.addPanelTitle("今日の清掃メモ");
    this.addPanelBody("はじまりの地下道 B1F〜B5F\n清掃率80%以上で次の階へ。\nB5Fが最奥地です。", this.panelTop + 66);
    this.createButton(width / 2, height - 280, buttonWidth, 62, "はじまりの地下道へ", 0xd8913d, () => {
      this.scene.start("DungeonScene", { floor: 1 });
    }, this.compact ? 16 : 17);
    this.createButton(width / 2, height - 208, buttonWidth, 52, "操作UIを左右反転", 0x4e6b7d, () => this.toggleControls(), this.compact ? 15 : 17);
    this.createButton(width / 2, height - 146, buttonWidth, 48, "タイトルへ", 0x2a2d38, () => this.scene.start("TitleScene"), this.compact ? 15 : 17);
    this.setMessage("短く潜って素材を持ち帰り、\nショップで道具を整えましょう。");
  }

  private showInventory(): void {
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const count = getInventoryCount(this.save.inventory);
    const lines = Object.entries(ITEMS)
      .map(([id, item]) => `${item.name}: ${this.save.inventory[id as ItemId]}個 / 売値${item.sellPrice}G`)
      .join("\n");
    this.addPanelTitle("持ち物");
    this.addPanelBody(`バッグ ${count}/${capacity}\n\n${lines}`, this.panelTop + 62);
    this.setMessage("素材は売上や、\n道具の生産に使います。");
  }

  private showMap(): void {
    this.addPanelTitle("マップ");
    this.addPanelBody(
      "はじまりの地下道\n\nB1F → B2F → B3F → B4F → B5F\n最奥地\n\n出撃ごとに、開始位置・残骸・\n危険物の配置が変わります。",
      this.panelTop + 62
    );
    this.setMessage("v1ではこの地下道を、\n短く気持ちよく磨きます。");
  }

  private showRequests(): void {
    const next = this.save.progress.runs < 1 ? "初回の清掃で素材を3個持ち帰る" : "B5Fまで進み、危険物を1体片付ける";
    this.addPanelTitle("依頼");
    this.addPanelBody(`今の目標\n${next}\n\n図鑑メモ\nモンスター、素材、宝、\nプレイヤー成長を確認します。`, this.panelTop + 62);
    this.setMessage("依頼は次の一回で\n狙うことだけを示します。");
  }

  private showShop(): void {
    const { width, height } = this.scale;
    const buttonWidth = this.getButtonWidth();
    const fontSize = this.compact ? 13 : 15;
    this.addPanelTitle("ショップ", this.panelTop + 22);
    this.createButton(width / 2, this.panelTop + 76, buttonWidth, 44, `ほうき強化 ${getBroomUpgradeCost(this.save.player.broomLevel)}G`, 0x6f9345, () => this.spendGold("broom"), fontSize);
    this.createButton(width / 2, this.panelTop + 128, buttonWidth, 44, `バッグ強化 ${getBagUpgradeCost(this.save.player.bagLevel)}G`, 0x4f7f96, () => this.spendGold("bag"), fontSize);
    this.createButton(width / 2, this.panelTop + 180, buttonWidth, 44, `追い払い強化 ${getAttackUpgradeCost(this.save.player.attackLevel)}G`, 0x9b4350, () => this.spendGold("attack"), fontSize);
    this.createButton(width / 2, this.panelTop + 232, buttonWidth, 44, `スタミナ強化 ${getStaminaUpgradeCost(this.save.player.staminaLevel)}G`, 0x5e8f58, () => this.spendGold("stamina"), fontSize);
    this.createButton(width / 2, height - 214, buttonWidth, 44, "強化ほうき生産 石材2 木片2", 0x8b6338, () => this.craft("broom"), fontSize);
    this.createButton(width / 2, height - 160, buttonWidth, 44, "作業道具生産 金属片1 木片2", 0x8b6338, () => this.craft("weapon"), fontSize);
    this.setMessage("強化は清掃速度、容量、\n危険物対処、行動継続に直結します。");
  }

  private spendGold(kind: "broom" | "bag" | "attack" | "stamina"): void {
    const costs = {
      broom: getBroomUpgradeCost(this.save.player.broomLevel),
      bag: getBagUpgradeCost(this.save.player.bagLevel),
      attack: getAttackUpgradeCost(this.save.player.attackLevel),
      stamina: getStaminaUpgradeCost(this.save.player.staminaLevel)
    };
    const cost = costs[kind];
    if (this.save.player.money < cost) {
      this.setMessage(`あと ${cost - this.save.player.money}G 必要です。`);
      return;
    }
    this.save.player.money -= cost;
    if (kind === "broom") this.save.player.broomLevel += 1;
    if (kind === "bag") this.save.player.bagLevel += 1;
    if (kind === "attack") this.save.player.attackLevel += 1;
    if (kind === "stamina") this.save.player.staminaLevel += 1;
    saveGame(this.save);
    this.setMessage("道具を整えました。\n次の清掃が少し楽になります。");
    this.showTab("shop");
  }

  private craft(kind: "broom" | "weapon"): void {
    const needs: Partial<Record<ItemId, number>> = kind === "broom" ? { stone: 2, wood: 2 } : { metal: 1, wood: 2 };
    const already = kind === "broom" ? this.save.player.craftedBroom : this.save.player.craftedWeapon;
    if (already) {
      this.setMessage("もう生産済みです。");
      return;
    }
    const missing = Object.entries(needs).find(([id, count]) => this.save.inventory[id as ItemId] < (count ?? 0));
    if (missing) {
      this.setMessage(`${ITEMS[missing[0] as ItemId].name}が足りません。`);
      return;
    }
    Object.entries(needs).forEach(([id, count]) => {
      this.save.inventory[id as ItemId] -= count ?? 0;
    });
    if (kind === "broom") this.save.player.craftedBroom = true;
    if (kind === "weapon") this.save.player.craftedWeapon = true;
    saveGame(this.save);
    this.setMessage(kind === "broom" ? "強化ほうきを生産しました。" : "作業道具を生産しました。");
    this.showTab("shop");
  }

  private toggleControls(): void {
    this.save.settings.controlLayout =
      this.save.settings.controlLayout === "leftStickRightButtons" ? "rightStickLeftButtons" : "leftStickRightButtons";
    saveGame(this.save);
    this.setMessage(
      this.save.settings.controlLayout === "leftStickRightButtons"
        ? "左スティック/右ボタンにしました。"
        : "右スティック/左ボタンにしました。"
    );
    this.refreshStatus();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    onClick: () => void,
    fontSize = 17,
    addToPanel = true
  ): void {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(2, 0xffd08a, 0.72)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: "sans-serif",
      fontSize: `${fontSize}px`,
      color: "#fff4df",
      fontStyle: "700",
      align: "center",
      wordWrap: { width: width - 14 }
    }).setOrigin(0.5);
    if (addToPanel) this.panel.add([button, text]);
    button.on("pointerdown", () => button.setScale(0.98));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerup", () => {
      button.setScale(1);
      onClick();
    });
  }

  private addPanelTitle(text: string, y = this.panelTop + 32): void {
    this.addPanelText(this.scale.width / 2, y, text, this.compact ? 20 : 22, "#f8e7c7");
  }

  private addPanelBody(text: string, y: number): void {
    this.addPanelText(this.scale.width / 2, y, text, this.compact ? 14 : 16, "#f3efe8", 0);
  }

  private addPanelText(x: number, y: number, text: string, fontSize: number, color: string, originY = 0.5): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "sans-serif",
      fontSize: `${fontSize}px`,
      color,
      align: "center",
      fontStyle: fontSize >= 20 ? "700" : "400",
      lineSpacing: this.compact ? 7 : 8,
      wordWrap: { width: this.scale.width - 58, useAdvancedWrap: true }
    }).setOrigin(0.5, originY);
    this.panel.add(label);
  }

  private refreshStatus(): void {
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const count = getInventoryCount(this.save.inventory);
    this.statusText.setText(
      `所持金 ${this.save.player.money}G / 素材 ${count}/${capacity} / 出動 ${this.save.progress.runs}回\n` +
      `ほうきLv.${this.save.player.broomLevel} バッグLv.${this.save.player.bagLevel} ` +
      `払うLv.${this.save.player.attackLevel} スタミナLv.${this.save.player.staminaLevel}`
    );
  }

  private getButtonWidth(): number {
    return Math.min(292, this.scale.width - 56);
  }

  private setMessage(text: string): void {
    this.messageText.setText(text);
    this.messageText.setFontSize(this.compact ? 11 : 14);
  }
}
