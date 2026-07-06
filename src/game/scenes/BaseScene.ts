import Phaser from "phaser";
import {
  BASE_TABS,
  CODEX_SECTIONS,
  HOME_MEMO,
  MAP_INFO,
  REQUESTS,
  SHOP_ENTRIES,
  getActiveRequest,
  type BaseTab,
  type CraftKind,
  type RequestDefinition,
  type ShopEntry,
  type UpgradeKind
} from "../data/baseContent";
import { ASSET_KEYS } from "../data/assets";
import { ITEMS, type ItemId, getInventoryCount, getInventoryValue } from "../data/items";
import { getBagCapacity } from "../data/upgrades";
import { loadSave, saveGame, type SaveData } from "../systems/SaveSystem";
import { createAssetIcon } from "../ui/PlaceholderIcon";

type PanelTextOptions = {
  fontSize?: number;
  color?: string;
  align?: "left" | "center";
  originX?: number;
  originY?: number;
  width?: number;
  bold?: boolean;
};

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
    this.panelBottom = height - 112;
    this.cameras.main.setBackgroundColor("#1d1a22");
    this.add.rectangle(width / 2, height / 2, width, height, 0x1d1a22);

    this.createHeader();
    this.panel = this.add.container(0, 0);
    this.messageText = this.add.text(width / 2, this.compact ? height - 86 : height - 104, "", {
      fontFamily: "sans-serif",
      fontSize: this.compact ? "13px" : "15px",
      color: "#ffe0a3",
      align: "center",
      lineSpacing: 3,
      wordWrap: { width: width - 44, useAdvancedWrap: true }
    }).setOrigin(0.5);

    this.createTabBar();
    this.showTab("home");
    this.refreshStatus();
  }

  private createHeader(): void {
    const { width } = this.scale;
    this.add.rectangle(width / 2, 58, width - 24, 82, 0x171722, 0.86)
      .setStrokeStyle(2, 0xe2b56f, 0.36);

    this.add.text(width / 2, 24, "勇者のあとしまつ", {
      fontFamily: "sans-serif",
      fontSize: this.compact ? "21px" : "26px",
      color: "#f8e7c7",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, this.compact ? 66 : 64, "", {
      fontFamily: "sans-serif",
      fontSize: this.compact ? "12px" : "15px",
      color: "#f3efe8",
      align: "center",
      lineSpacing: this.compact ? 4 : 6
    }).setOrigin(0.5);
  }

  private createTabBar(): void {
    const { width, height } = this.scale;
    const tabWidth = Math.floor((width - 20) / BASE_TABS.length);
    BASE_TABS.forEach((tab, index) => {
      this.createButton(
        10 + tabWidth * index + tabWidth / 2,
        height - 38,
        tabWidth - 4,
        48,
        tab.label,
        0x2a2d38,
        () => this.showTab(tab.id),
        this.compact ? 12 : 14,
        false
      );
    });
  }

  private showTab(tab: BaseTab): void {
    this.panel.removeAll(true);
    this.save = loadSave();
    const { width } = this.scale;
    const panelHeight = this.panelBottom - this.panelTop;
    const panelBg = this.add.rectangle(width / 2, this.panelTop + panelHeight / 2, width - 34, panelHeight, 0x30281f, 0.96)
      .setStrokeStyle(2, 0x8b6338, 0.9);
    this.panel.add(panelBg);

    if (tab === "home") this.showHome();
    if (tab === "inventory") this.showInventory();
    if (tab === "map") this.showMap();
    if (tab === "requests") this.showRequests();
    if (tab === "shop") this.showShop();
    if (tab === "codex") this.showCodex();
    this.refreshStatus();
  }

  private showHome(): void {
    const { width, height } = this.scale;
    const buttonWidth = this.getButtonWidth();
    this.addPanelTitle(HOME_MEMO.title);
    this.addInfoRow(this.panelTop + 76, ASSET_KEYS.dungeon.exit, "短期清掃", HOME_MEMO.body.join("\n"));
    const request = getActiveRequest(this.save);
    this.addInfoRow(this.panelTop + 174, request.iconKey, `次の依頼: ${request.title}`, `${request.target}\n${request.rewardHint}`);

    this.createButton(width / 2, height - 286, buttonWidth, 58, "はじまりの地下道へ", 0xd8913d, () => {
      this.scene.start("DungeonScene", { floor: 1 });
    }, this.compact ? 17 : 18);
    this.createButton(width / 2, height - 222, buttonWidth, 48, "図鑑を見る", 0x5b567d, () => this.showTab("codex"), this.compact ? 16 : 17);
    this.createButton(width / 2, height - 168, buttonWidth, 44, "操作UIを左右反転", 0x4e6b7d, () => this.toggleControls(), this.compact ? 15 : 16);
    this.createButton(width / 2, height - 118, buttonWidth, 40, "タイトルへ", 0x2a2d38, () => this.scene.start("TitleScene"), this.compact ? 15 : 16);
    this.setMessage(HOME_MEMO.message);
  }

  private showInventory(): void {
    const capacity = getBagCapacity(this.save.player.bagLevel);
    const count = getInventoryCount(this.save.inventory);
    const value = getInventoryValue(this.save.inventory);
    this.addPanelTitle("持ち物 / 倉庫");
    this.addPanelText(this.scale.width / 2, this.panelTop + 58, `拠点倉庫 ${count}個 / バッグ容量 ${capacity} / 売却 ${value}G`, {
      fontSize: this.compact ? 15 : 16,
      color: "#ffe0a3",
      bold: true
    });

    Object.values(ITEMS).forEach((item, index) => {
      const amount = this.save.inventory[item.id];
      const y = this.panelTop + 100 + index * (this.compact ? 54 : 58);
      this.addInfoRow(
        y,
        item.iconKey,
        `${item.name} x${amount} / 売値 ${item.sellPrice}G`,
        `${item.description}\n用途: ${item.useText}`,
        this.compact ? 34 : 38
      );
    });
    this.createButton(
      this.scale.width / 2,
      this.panelBottom - 38,
      this.getButtonWidth(),
      42,
      value > 0 ? `倉庫素材を売る +${value}G` : "倉庫は空です",
      value > 0 ? 0xd8913d : 0x2a2d38,
      () => this.sellStoredMaterials(),
      this.compact ? 15 : 16
    );
    this.setMessage("素材は保管して生産に使うか、倉庫から売って強化費用にできます。");
  }

  private showMap(): void {
    this.addPanelTitle("マップ");
    this.addInfoRow(this.panelTop + 78, MAP_INFO.iconKey, MAP_INFO.title, MAP_INFO.note, 44);
    MAP_INFO.rows.forEach((row, index) => {
      this.addPanelText(46, this.panelTop + 142 + index * 34, row, {
        fontSize: this.compact ? 13 : 15,
        align: "left",
        originX: 0,
        width: this.scale.width - 92
      });
    });
    this.setMessage("v1ではこの地下道を短く気持ちよく磨き込みます。");
  }

  private showRequests(): void {
    const active = getActiveRequest(this.save);
    this.addPanelTitle("依頼");
    this.addInfoRow(this.panelTop + 78, active.iconKey, active.title, `${active.target}\n${active.rewardHint}`, 44);

    this.addPanelText(this.scale.width / 2, this.panelTop + 158, "依頼リスト", {
      fontSize: this.compact ? 15 : 17,
      color: "#ffe0a3",
      bold: true
    });
    const visibleRequests = [active, ...this.getUpcomingRequests(active.title)].slice(0, 4);
    visibleRequests.forEach((request, index) => {
      const marker = request.title === active.title ? "進行中" : "次候補";
      this.addPanelText(46, this.panelTop + 194 + index * 52, `${marker}: ${request.title}\n${request.target}`, {
        fontSize: this.compact ? 13 : 14,
        align: "left",
        originX: 0,
        width: this.scale.width - 92
      });
    });

    this.createButton(this.scale.width / 2, this.panelBottom - 38, this.getButtonWidth(), 42, "図鑑を見る", 0x5b567d, () => this.showTab("codex"), this.compact ? 15 : 16);
    this.setMessage("依頼は次の一回で狙うことだけを示します。");
  }

  private showCodex(): void {
    this.addPanelTitle("図鑑");
    this.addPanelText(this.scale.width / 2, this.panelTop + 58, "モンスター、素材、宝、成長の記録を確認できます。", {
      fontSize: this.compact ? 13 : 14,
      color: "#ffe0a3"
    });

    CODEX_SECTIONS.forEach((section, index) => {
      const y = this.panelTop + 98 + index * (this.compact ? 84 : 90);
      const visibleEntries = section.entries.map((entry) => entry.reveal(this.save) ? `${entry.name}: ${entry.text}` : "未収集: 地下道で記録を増やそう");
      this.addInfoRow(y, section.iconKey, section.title, visibleEntries.slice(0, 2).join("\n"), this.compact ? 34 : 38);
    });
    this.setMessage("未収集の項目は、次の清掃で記録を増やす理由になります。");
  }

  private showShop(): void {
    this.addPanelTitle("ショップ", this.panelTop + 24);
    SHOP_ENTRIES.forEach((entry, index) => {
      this.createShopEntry(entry, this.panelTop + 66 + index * (this.compact ? 70 : 70));
    });
    this.setMessage("強化は清掃速度、容量、危険物対処、行動継続に直結します。");
  }

  private getUpcomingRequests(activeTitle: string): RequestDefinition[] {
    return REQUESTS.filter((request) => request.title !== activeTitle);
  }

  private createShopEntry(entry: ShopEntry, y: number): void {
    const { width } = this.scale;
    const buttonWidth = this.getButtonWidth();
    const icon = createAssetIcon(this, width / 2 - buttonWidth / 2 + 22, y, this.compact ? 24 : 28, entry.iconKey);
    const label = entry.type === "upgrade"
      ? `${entry.title} Lv.${entry.getLevel(this.save)}  ${entry.getCost(this.save)}G`
      : `${entry.title}  ${entry.isCrafted(this.save) ? "生産済" : this.formatNeeds(entry.needs)}`;
    const button = this.createButton(width / 2, y, buttonWidth, this.compact ? 56 : 58, label, entry.color, () => {
      if (entry.type === "upgrade") this.spendGold(entry.kind);
      if (entry.type === "craft") this.craft(entry.kind);
    }, this.compact ? 13 : 14, true, -11);
    const description = this.add.text(width / 2 - buttonWidth / 2 + 46, y + (this.compact ? 13 : 14), entry.description, {
      fontFamily: "sans-serif",
      fontSize: this.compact ? "9px" : "11px",
      color: "#f3efe8",
      align: "left",
      lineSpacing: 2,
      wordWrap: { width: buttonWidth - 56, useAdvancedWrap: true }
    }).setOrigin(0, 0);
    this.panel.add([icon, description]);
    button.setDepth(button.depth - 1);
  }

  private spendGold(kind: UpgradeKind): void {
    const entry = SHOP_ENTRIES.find((candidate) => candidate.type === "upgrade" && candidate.kind === kind);
    if (!entry || entry.type !== "upgrade") return;

    const cost = entry.getCost(this.save);
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
    this.setMessage(`${entry.title}を行いました。次の清掃が少し楽になります。`);
    this.showTab("shop");
  }

  private craft(kind: CraftKind): void {
    const entry = SHOP_ENTRIES.find((candidate) => candidate.type === "craft" && candidate.kind === kind);
    if (!entry || entry.type !== "craft") return;

    if (entry.isCrafted(this.save)) {
      this.setMessage("もう生産済みです。");
      return;
    }
    const missing = Object.entries(entry.needs).find(([id, count]) => this.save.inventory[id as ItemId] < (count ?? 0));
    if (missing) {
      this.setMessage(`${ITEMS[missing[0] as ItemId].name}が足りません。`);
      return;
    }
    Object.entries(entry.needs).forEach(([id, count]) => {
      this.save.inventory[id as ItemId] -= count ?? 0;
    });
    if (kind === "broom") this.save.player.craftedBroom = true;
    if (kind === "weapon") this.save.player.craftedWeapon = true;
    saveGame(this.save);
    this.setMessage(`${entry.title}が完了しました。`);
    this.showTab("shop");
  }

  private sellStoredMaterials(): void {
    const value = getInventoryValue(this.save.inventory);
    if (value <= 0) {
      this.setMessage("売れる素材がまだありません。地下道で素材を持ち帰りましょう。");
      return;
    }

    Object.keys(this.save.inventory).forEach((id) => {
      this.save.inventory[id as ItemId] = 0;
    });
    this.save.player.money += value;
    saveGame(this.save);
    this.setMessage(`倉庫素材を売って ${value}G を受け取りました。`);
    this.showTab("inventory");
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
    fontSize = 18,
    addToPanel = true,
    labelOffsetY = 0
  ): Phaser.GameObjects.Rectangle {
    const button = this.add.rectangle(x, y, width, height, color, 1)
      .setStrokeStyle(2, 0xffd08a, 0.72)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y + labelOffsetY, label, {
      fontFamily: "sans-serif",
      fontSize: `${fontSize}px`,
      color: "#fff4df",
      fontStyle: "700",
      align: "center",
      wordWrap: { width: width - 18, useAdvancedWrap: true }
    }).setOrigin(0.5);
    if (addToPanel) this.panel.add([button, text]);
    button.on("pointerdown", () => button.setScale(0.98));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerup", () => {
      button.setScale(1);
      onClick();
    });
    return button;
  }

  private addInfoRow(y: number, iconKey: string, title: string, body: string, iconSize = 40): void {
    const x = 42;
    const icon = createAssetIcon(this, x + iconSize / 2, y, iconSize, iconKey);
    const textX = x + iconSize + 14;
    this.addPanelText(textX, y - iconSize / 2 + 2, title, {
      fontSize: this.compact ? 14 : 16,
      color: "#ffe0a3",
      align: "left",
      originX: 0,
      originY: 0,
      width: this.scale.width - textX - 32,
      bold: true
    });
    this.addPanelText(textX, y - iconSize / 2 + (this.compact ? 21 : 24), body, {
      fontSize: this.compact ? 11 : 13,
      align: "left",
      originX: 0,
      originY: 0,
      width: this.scale.width - textX - 32
    });
    this.panel.add(icon);
  }

  private addPanelTitle(text: string, y = this.panelTop + 32): void {
    this.addPanelText(this.scale.width / 2, y, text, {
      fontSize: this.compact ? 21 : 23,
      color: "#f8e7c7",
      bold: true
    });
  }

  private addPanelText(x: number, y: number, text: string, options: PanelTextOptions = {}): Phaser.GameObjects.Text {
    const fontSize = options.fontSize ?? (this.compact ? 15 : 17);
    const label = this.add.text(x, y, text, {
      fontFamily: "sans-serif",
      fontSize: `${fontSize}px`,
      color: options.color ?? "#f3efe8",
      align: options.align ?? "center",
      fontStyle: options.bold ? "700" : "400",
      lineSpacing: this.compact ? 6 : 7,
      wordWrap: { width: options.width ?? this.scale.width - 58, useAdvancedWrap: true }
    }).setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
    this.panel.add(label);
    return label;
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

  private formatNeeds(needs: Partial<Record<ItemId, number>>): string {
    return Object.entries(needs)
      .map(([id, count]) => `${ITEMS[id as ItemId].name}${count}`)
      .join(" ");
  }

  private getButtonWidth(): number {
    return Math.min(316, this.scale.width - 56);
  }

  private setMessage(text: string): void {
    this.messageText.setText(text);
    this.messageText.setFontSize(this.compact ? 12 : 15);
  }
}
