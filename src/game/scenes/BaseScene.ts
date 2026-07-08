import Phaser from "phaser";
import { ASSET_KEYS } from "../data/assets";
import { ITEMS, type ItemId, getInventoryCount, getInventoryValue } from "../data/items";
import {
  getAttackUpgradeCost,
  getBagCapacity,
  getBagUpgradeCost,
  getBroomUpgradeCost,
  getStaminaUpgradeCost
} from "../data/upgrades";
import { loadSave, saveGame, type SaveData } from "../systems/SaveSystem";

type BaseTab = "home" | "inventory" | "map" | "requests" | "shop";
type UpgradeKind = "broom" | "bag" | "attack" | "stamina";

const ITEM_IDS: ItemId[] = ["stone", "wood", "slime", "ash", "metal"];

export class BaseScene extends Phaser.Scene {
  private save!: SaveData;
  private panel!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private currentTab: BaseTab = "home";
  private tabButtons = new Map<BaseTab, Phaser.GameObjects.Rectangle>();
  private tabLabels = new Map<BaseTab, Phaser.GameObjects.Text>();

  constructor() {
    super("BaseScene");
  }

  create(): void {
    this.save = loadSave();
    saveGame(this.save);

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#171722");
    this.drawBaseBackdrop();

    this.addPanel(width / 2, 58, width - 24, 92, 0x171722, 0.9, 0xe2b56f, 0.38);
    this.addReadableText(width / 2, 20, "清掃員の拠点", 20, "#f8e7c7", {
      fontStyle: "600",
      origin: [0.5, 0],
      strokeThickness: 1
    });

    this.statusText = this.addReadableText(width / 2, 66, "", 12, "#fff4df", {
      align: "center",
      lineSpacing: 6,
      origin: [0.5, 0.5],
      wordWrapWidth: width - 42,
      strokeThickness: 1
    });

    this.panel = this.add.container(0, 0);
    this.messageText = this.addReadableText(width / 2, height - 98, "", 13, "#ffe0a3", {
      align: "center",
      origin: [0.5, 0.5],
      wordWrapWidth: width - 54,
      strokeThickness: 1
    });

    this.createTabBar();
    this.showTab("home");
    this.refreshStatus();
  }

  private drawBaseBackdrop(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x171722);
    this.add.rectangle(width / 2, height / 2, width, height, 0x211918, 0.58);
    for (let y = 122; y < height - 118; y += 56) {
      this.add.rectangle(width / 2, y, width - 26, 1, 0x8b6338, 0.14);
    }
    this.add.ellipse(width * 0.2, 118, 170, 120, 0xf2c36b, 0.08);
    this.add.ellipse(width * 0.82, height - 156, 180, 120, 0x6aa2cf, 0.06);
    this.add.image(42, 132, ASSET_KEYS.player.broom)
      .setDisplaySize(28, 76)
      .setAngle(-28)
      .setAlpha(0.52);
    this.add.image(width - 46, 128, ASSET_KEYS.player.bag)
      .setDisplaySize(54, 54)
      .setAlpha(0.6);
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
      const x = 10 + tabWidth * index + tabWidth / 2;
      const y = height - 38;
      const button = this.add.rectangle(x, y, tabWidth - 4, 50, 0x202331, 0.96)
        .setStrokeStyle(1, 0x8b6338, 0.78)
        .setInteractive({ useHandCursor: true });
      const text = this.addReadableText(x, y, label, width < 390 ? 11 : 12, "#f8e7c7", {
        fontStyle: "600",
        origin: [0.5, 0.5],
        strokeThickness: 1
      });
      button.on("pointerdown", () => button.setScale(0.98));
      button.on("pointerout", () => button.setScale(1));
      button.on("pointerup", () => {
        button.setScale(1);
        this.showTab(tab);
      });
      this.tabButtons.set(tab, button);
      this.tabLabels.set(tab, text);
    });
  }

  private showTab(tab: BaseTab): void {
    this.currentTab = tab;
    this.panel.removeAll(true);
    this.save = loadSave();
    const { width, height } = this.scale;

    const panelTop = 116;
    const panelHeight = height - 242;
    const bg = this.addPanel(width / 2, panelTop + panelHeight / 2, width - 28, panelHeight, 0x2b241d, 0.96, 0x8b6338, 0.72);
    this.panel.add(bg);

    if (tab === "home") this.showHome();
    if (tab === "inventory") this.showInventory();
    if (tab === "map") this.showMap();
    if (tab === "requests") this.showRequests();
    if (tab === "shop") this.showShop();
    this.refreshStatus();
    this.refreshTabs();
  }

  private showHome(): void {
    const { width, height } = this.scale;
    this.addToPanel(this.addReadableText(width / 2, 138, "今日の清掃メモ", 19, "#f8e7c7", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));
    this.addToPanel(this.addReadableText(width / 2, 190,
      "はじまりの地下道 B1F〜B5F\n清掃率80%以上で出口が開きます。\n素材を持ち帰って道具を整えましょう。",
      14,
      "#fff4df",
      { align: "center", lineSpacing: 7, origin: [0.5, 0.5], wordWrapWidth: width - 62, strokeThickness: 1 }
    ));

    this.addToPanel(this.add.image(width / 2 - 94, 278, ASSET_KEYS.player.cleaner).setDisplaySize(46, 62));
    this.addToPanel(this.add.image(width / 2, 278, ASSET_KEYS.debris.brokenChest).setDisplaySize(58, 42));
    this.addToPanel(this.add.image(width / 2 + 96, 278, ASSET_KEYS.dungeon.exitOpen).setDisplaySize(50, 62));

    this.createButton(width / 2, height - 282, 292, 56, "はじまりの地下道へ", 0xd8913d, () => {
      this.scene.start("DungeonScene", { floor: 1 });
    }, 17);
    this.createButton(width / 2, height - 218, 292, 46, "操作UIを左右反転", 0x496575, () => this.toggleControls(), 15);
    this.createButton(width / 2, height - 162, 292, 44, "タイトルへ", 0x252936, () => this.scene.start("TitleScene"), 15);
    this.messageText.setText("素材を持ち帰り、ショップで強化。");
  }

  private showInventory(): void {
    const { width, height } = this.scale;
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const count = getInventoryCount(this.save.inventory);
    const value = getInventoryValue(this.save.inventory);
    this.addToPanel(this.addReadableText(width / 2, 132, `持ち物・倉庫 ${count}/${capacity}`, 18, "#f8e7c7", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));

    ITEM_IDS.forEach((itemId, index) => {
      const item = ITEMS[itemId];
      const y = 174 + index * 54;
      const row = this.addPanel(width / 2, y, width - 54, 46, 0x171722, 0.72, 0x8b6338, 0.36);
      this.addToPanel(row);
      this.addToPanel(this.add.image(44, y, item.iconKey).setDisplaySize(24, 24));
      this.addToPanel(this.addReadableText(66, y - 12, `${item.name} x${this.save.inventory[itemId]}`, 14, "#fff4df", {
        fontStyle: "600",
        origin: [0, 0.5],
        strokeThickness: 1
      }));
      this.addToPanel(this.addReadableText(66, y + 10, `売値${item.sellPrice}G / ${item.useText}`, 12, "#ffe0a3", {
        origin: [0, 0.5],
        wordWrapWidth: width - 150,
        strokeThickness: 1
      }));
    });

    this.createButton(width / 2, height - 166, 292, 48, value > 0 ? `倉庫素材を売る +${value}G` : "倉庫は空です", value > 0 ? 0x496575 : 0x252936, () => {
      this.sellInventory(value);
    }, 15);
    this.messageText.setText("素材は売却のほか、ほうきや作業道具の生産にも使います。");
  }

  private showMap(): void {
    const { width } = this.scale;
    this.addToPanel(this.addReadableText(width / 2, 136, "マップ", 18, "#f8e7c7", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));
    const steps = ["B1F", "B2F", "B3F", "B4F", "B5F"];
    steps.forEach((label, index) => {
      const x = 54 + index * ((width - 108) / 4);
      this.addToPanel(this.add.circle(x, 210, 22, index === 4 ? 0x4d8f6a : 0x30281f, 0.96).setStrokeStyle(2, 0xe2b56f, 0.88));
      this.addToPanel(this.addReadableText(x, 210, label, 12, "#fff4df", {
        fontStyle: "600",
        origin: [0.5, 0.5],
        strokeThickness: 1
      }));
      if (index < steps.length - 1) {
        this.addToPanel(this.add.rectangle(x + ((width - 108) / 8), 210, (width - 108) / 4 - 48, 3, 0x8b6338, 0.88));
      }
    });
    this.addToPanel(this.addReadableText(width / 2, 292,
      "出撃ごとに開始位置、残骸、危険物、\n出口候補が変わります。\nB5Fが最奥地。途中で拠点へ戻れます。",
      14,
      "#fff4df",
      { align: "center", lineSpacing: 7, origin: [0.5, 0.5], wordWrapWidth: width - 60, strokeThickness: 1 }
    ));
    this.messageText.setText("地下道は出撃ごとに少し変化します。");
  }

  private showRequests(): void {
    const { width } = this.scale;
    const inventoryCount = getInventoryCount(this.save.inventory);
    const request =
      this.save.progress.runs < 1
        ? "初回清掃: 素材を3個持ち帰る"
        : inventoryCount < 6
          ? "倉庫整理: 素材を合計6個保管する"
          : "最奥挑戦: B5Fまで進んで帰還する";
    this.addToPanel(this.addReadableText(width / 2, 136, "依頼", 18, "#f8e7c7", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));
    this.addToPanel(this.addPanel(width / 2, 218, width - 58, 126, 0x171722, 0.76, 0xe2b56f, 0.42));
    this.addToPanel(this.addReadableText(width / 2, 190, "今の目標", 16, "#ffe0a3", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));
    this.addToPanel(this.addReadableText(width / 2, 232, request, 15, "#fff4df", {
      fontStyle: "500",
      align: "center",
      origin: [0.5, 0.5],
      wordWrapWidth: width - 86,
      strokeThickness: 1
    }));
    this.addToPanel(this.addReadableText(width / 2, 324,
      "図鑑メモ:\n素材、危険物、宝、清掃員の成長を\nここから確認できるようにします。",
      13,
      "#f3efe8",
      { align: "center", lineSpacing: 6, origin: [0.5, 0.5], wordWrapWidth: width - 64, strokeThickness: 1 }
    ));
    this.messageText.setText("依頼は次の一回で狙うことだけを示します。");
  }

  private showShop(): void {
    const { width, height } = this.scale;
    this.addToPanel(this.addReadableText(width / 2, 126, "ショップ・強化", 18, "#f8e7c7", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));
    this.createButton(width / 2, 172, 304, 42, `ほうき強化 ${getBroomUpgradeCost(this.save.player.broomLevel)}G`, 0x638846, () => this.spendGold("broom"), 14);
    this.createButton(width / 2, 222, 304, 42, `バッグ強化 ${getBagUpgradeCost(this.save.player.bagLevel)}G`, 0x496f83, () => this.spendGold("bag"), 14);
    this.createButton(width / 2, 272, 304, 42, `追い払い強化 ${getAttackUpgradeCost(this.save.player.attackLevel)}G`, 0x88414c, () => this.spendGold("attack"), 14);
    this.createButton(width / 2, 322, 304, 42, `スタミナ強化 ${getStaminaUpgradeCost(this.save.player.staminaLevel)}G`, 0x557d53, () => this.spendGold("stamina"), 14);
    this.createButton(width / 2, height - 206, 304, 42, this.save.player.craftedBroom ? "強化ほうき 生産済み" : "強化ほうき生産 石材2 木片2", 0x8b6338, () => this.craft("broom"), 14);
    this.createButton(width / 2, height - 156, 304, 42, this.save.player.craftedWeapon ? "作業道具 生産済み" : "作業道具生産 金属片1 木片2", 0x8b6338, () => this.craft("weapon"), 14);
    this.messageText.setText("強化は清掃力、容量、対処力、行動継続に直結します。");
  }

  private spendGold(kind: UpgradeKind): void {
    const costs: Record<UpgradeKind, number> = {
      broom: getBroomUpgradeCost(this.save.player.broomLevel),
      bag: getBagUpgradeCost(this.save.player.bagLevel),
      attack: getAttackUpgradeCost(this.save.player.attackLevel),
      stamina: getStaminaUpgradeCost(this.save.player.staminaLevel)
    };
    const cost = costs[kind];
    if (this.save.player.money < cost) {
      this.messageText.setText(`あと ${cost - this.save.player.money}G 必要です。`);
      return;
    }
    this.save.player.money -= cost;
    if (kind === "broom") this.save.player.broomLevel += 1;
    if (kind === "bag") this.save.player.bagLevel += 1;
    if (kind === "attack") this.save.player.attackLevel += 1;
    if (kind === "stamina") this.save.player.staminaLevel += 1;
    saveGame(this.save);
    this.showTab("shop");
    this.messageText.setText("道具を整えました。次の清掃が少し楽になります。");
  }

  private craft(kind: "broom" | "weapon"): void {
    const needs: Partial<Record<ItemId, number>> = kind === "broom" ? { stone: 2, wood: 2 } : { metal: 1, wood: 2 };
    const already = kind === "broom" ? this.save.player.craftedBroom : this.save.player.craftedWeapon;
    if (already) {
      this.messageText.setText("もう生産済みです。");
      return;
    }
    const missing = Object.entries(needs).find(([id, count]) => this.save.inventory[id as ItemId] < (count ?? 0));
    if (missing) {
      this.messageText.setText(`${ITEMS[missing[0] as ItemId].name}が足りません。`);
      return;
    }
    Object.entries(needs).forEach(([id, count]) => {
      this.save.inventory[id as ItemId] -= count ?? 0;
    });
    if (kind === "broom") this.save.player.craftedBroom = true;
    if (kind === "weapon") this.save.player.craftedWeapon = true;
    saveGame(this.save);
    this.showTab("shop");
    this.messageText.setText(kind === "broom" ? "強化ほうきを生産しました。" : "作業道具を生産しました。");
  }

  private sellInventory(value: number): void {
    if (value <= 0) {
      this.messageText.setText("売れる素材がありません。");
      return;
    }
    ITEM_IDS.forEach((id) => {
      this.save.inventory[id] = 0;
    });
    this.save.player.money += value;
    saveGame(this.save);
    this.showTab("inventory");
    this.messageText.setText(`倉庫素材を売って ${value}G を得ました。`);
  }

  private toggleControls(): void {
    this.save.settings.controlLayout =
      this.save.settings.controlLayout === "leftStickRightButtons" ? "rightStickLeftButtons" : "leftStickRightButtons";
    saveGame(this.save);
    this.messageText.setText(
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
    fontSize = 17
  ): void {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(1, 0xffd08a, 0.72)
      .setInteractive({ useHandCursor: true });
    const text = this.addReadableText(x, y, label, fontSize, "#fff4df", {
      fontStyle: "500",
      align: "center",
      origin: [0.5, 0.5],
      wordWrapWidth: width - 18,
      strokeThickness: 1
    });
    this.panel.add([button, text]);
    button.on("pointerdown", () => {
      button.setScale(0.98);
      text.setScale(0.98);
    });
    button.on("pointerout", () => {
      button.setScale(1);
      text.setScale(1);
    });
    button.on("pointerup", () => {
      button.setScale(1);
      text.setScale(1);
      onClick();
    });
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

  private refreshTabs(): void {
    for (const [tab, button] of this.tabButtons) {
      const active = tab === this.currentTab;
      button.setFillStyle(active ? 0xc68134 : 0x202331, active ? 1 : 0.96);
      button.setStrokeStyle(1, active ? 0xffe0a3 : 0x8b6338, active ? 0.9 : 0.72);
      const label = this.tabLabels.get(tab);
      label?.setColor(active ? "#25170e" : "#f8e7c7");
      label?.setStroke(active ? "#f7c574" : "#120b0c", active ? 1 : 1);
    }
  }

  private addPanel(x: number, y: number, width: number, height: number, color: number, alpha: number, stroke: number, strokeAlpha: number): Phaser.GameObjects.Rectangle {
    return this.add.rectangle(x, y, width, height, color, alpha)
      .setStrokeStyle(1, stroke, strokeAlpha);
  }

  private addReadableText(
    x: number,
    y: number,
    text: string,
    fontSize: number,
    color: string,
    options: {
      fontStyle?: string;
      align?: "left" | "center" | "right";
      lineSpacing?: number;
      origin?: [number, number];
      wordWrapWidth?: number;
      strokeThickness?: number;
    } = {}
  ): Phaser.GameObjects.Text {
    const strokeThickness = Math.max(0, (options.strokeThickness ?? 0) - 1);
    const label = this.add.text(x, y, text, {
      fontFamily: "sans-serif",
      fontSize: `${fontSize}px`,
      color,
      fontStyle: options.fontStyle ?? "400",
      align: options.align ?? "center",
      lineSpacing: options.lineSpacing ?? 5,
      stroke: "#120b0c",
      strokeThickness,
      wordWrap: options.wordWrapWidth ? { width: options.wordWrapWidth, useAdvancedWrap: true } : undefined
    });
    label.setOrigin(...(options.origin ?? [0.5, 0.5]));
    return label;
  }

  private addToPanel<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.panel.add(object);
    return object;
  }
}
