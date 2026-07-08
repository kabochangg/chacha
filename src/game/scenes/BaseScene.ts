import Phaser from "phaser";
import { ASSET_KEYS } from "../data/assets";
import { DUNGEONS, DUNGEON_ORDER, type DungeonId } from "../data/dungeons";
import { ITEMS, type ItemId, getInventoryCount, getInventoryValue } from "../data/items";
import {
  getBagCapacity,
} from "../data/upgrades";
import { CRAFT_RECIPES, SHOP_UPGRADES, type CraftItemId, type UpgradeKind } from "../data/shop";
import { loadSave, saveGame, type SaveData } from "../systems/SaveSystem";

type BaseTab = "home" | "inventory" | "map" | "requests" | "shop";

const ITEM_IDS: ItemId[] = ["stone", "wood", "slime", "ash", "metal"];
const RECIPES_PER_PAGE = 3;

export class BaseScene extends Phaser.Scene {
  private save!: SaveData;
  private panel!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private currentTab: BaseTab = "home";
  private craftPage = 0;
  private tabButtons = new Map<BaseTab, Phaser.GameObjects.Rectangle>();
  private tabLabels = new Map<BaseTab, Phaser.GameObjects.Text>();

  constructor() {
    super("BaseScene");
  }

  create(): void {
    this.save = loadSave();
    saveGame(this.save);

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#050b0f");
    this.drawBaseBackdrop();

    this.addPanel(width / 2, 58, width - 24, 92, 0x07161a, 0.92, 0x25f6d4, 0.34);
    this.addEdgeFrame(width / 2, 58, width - 24, 92, 0x25f6d4, 0.34);
    this.add.rectangle(28, 58, 4, 68, 0x25f6d4, 0.62);
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
    this.add.rectangle(width / 2, height / 2, width, height, 0x050b0f);
    this.add.rectangle(width / 2, height / 2, width, height, 0x07161a, 0.72);
    this.add.polygon(width * 0.12, height * 0.34, [0, 0, width * 0.72, -60, width * 0.66, -8, -28, 48], 0x12343a, 0.28);
    this.add.polygon(width * 0.72, height * 0.78, [0, 0, width * 0.42, -40, width * 0.5, 10, 18, 66], 0x0a2f35, 0.3);
    for (let y = 122; y < height - 118; y += 56) {
      this.add.rectangle(width / 2, y, width - 32, 1, 0x25f6d4, 0.07);
    }
    this.add.ellipse(width * 0.24, 118, 170, 120, 0x25f6d4, 0.075);
    this.add.ellipse(width * 0.82, height - 156, 190, 126, 0x0bb49f, 0.06);
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
      const button = this.add.rectangle(x, y, tabWidth - 4, 50, 0x071219, 0.96)
        .setStrokeStyle(1, 0x587578, 0.48)
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
    const bg = this.addPanel(width / 2, panelTop + panelHeight / 2, width - 28, panelHeight, 0x07161a, 0.94, 0x25f6d4, 0.22);
    this.panel.add(bg);
    this.panel.add(this.createEdgeFrame(width / 2, panelTop + panelHeight / 2, width - 28, panelHeight, 0x25f6d4, 0.34));
    this.panel.add(this.add.rectangle(28, panelTop + 38, 4, 54, 0x25f6d4, 0.58));

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
    this.addToPanel(this.addReadableText(width / 2, 136, "今日の清掃メモ", 18, "#f8e7c7", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));
    this.addToPanel(this.add.rectangle(width / 2, 156, width - 118, 1, 0x67b7a8, 0.32));
    this.addToPanel(this.addReadableText(width / 2, 180,
      "清掃率80%以上で出口が開きます。\nB5Fを片付けると次の現場が解放されます。",
      14,
      "#fff4df",
      { align: "center", lineSpacing: 7, origin: [0.5, 0.5], wordWrapWidth: width - 62, strokeThickness: 1 }
    ));

    DUNGEON_ORDER.forEach((dungeonId, index) => {
      const dungeon = DUNGEONS[dungeonId];
      const unlocked = this.isDungeonUnlocked(dungeonId);
      const y = 242 + index * 62;
      const label = unlocked ? `${dungeon.name}へ` : `${dungeon.name} 未解放`;
      this.createButton(width / 2, y, 304, 52, label, unlocked ? dungeon.theme.wallTint : 0x252b35, () => {
        if (!unlocked) {
          this.messageText.setText(dungeon.unlockText);
          return;
        }
        this.scene.start("DungeonScene", { floor: 1, dungeonId });
      }, 15);
    });
    this.createButton(width / 2, height - 218, 292, 46, "操作UIを左右反転", 0x365b64, () => this.toggleControls(), 15);
    this.createButton(width / 2, height - 162, 292, 44, "タイトルへ", 0x1c2230, () => this.scene.start("TitleScene"), 15);
    this.messageText.setText("B5Fクリアで次の清掃現場が開きます。");
  }

  private showInventory(): void {
    const { width, height } = this.scale;
    const capacity = getBagCapacity(this.save.player.bagLevel, this.save.player.craftedItems);
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
      const row = this.addPanel(width / 2, y, width - 54, 46, 0x071219, 0.82, 0x25f6d4, 0.2);
      this.addToPanel(row);
      this.addToPanel(this.add.rectangle(40, y, 2, 28, 0x25f6d4, 0.38));
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

    this.createButton(width / 2, height - 166, 292, 48, value > 0 ? `倉庫素材を売る +${value}G` : "倉庫は空です", value > 0 ? 0x365b64 : 0x1c2230, () => {
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
    DUNGEON_ORDER.forEach((dungeonId, index) => {
      const dungeon = DUNGEONS[dungeonId];
      const unlocked = this.isDungeonUnlocked(dungeonId);
      const y = 186 + index * 74;
      this.addToPanel(this.addPanel(width / 2, y, width - 58, 58, unlocked ? 0x071219 : 0x091015, 0.82, dungeon.theme.accent, unlocked ? 0.34 : 0.12));
      this.addToPanel(this.add.rectangle(54, y, 3, 38, unlocked ? dungeon.theme.ambient : 0x4f6470, 0.62));
      this.addToPanel(this.addReadableText(68, y - 13, `${index + 1}. ${dungeon.name}`, 14, unlocked ? "#fff4df" : "#8c8274", {
        fontStyle: "600",
        origin: [0, 0.5],
        strokeThickness: 1
      }));
      this.addToPanel(this.addReadableText(68, y + 11, unlocked ? dungeon.description : dungeon.unlockText, 12, unlocked ? "#ffe0a3" : "#8c8274", {
        origin: [0, 0.5],
        wordWrapWidth: width - 112,
        strokeThickness: 1
      }));
    });
    this.addToPanel(this.addReadableText(width / 2, 426,
      "各現場はB1F〜B5F構成。\n最奥B5Fを清掃して帰還すると次の現場が開きます。",
      14,
      "#fff4df",
      { align: "center", lineSpacing: 7, origin: [0.5, 0.5], wordWrapWidth: width - 60, strokeThickness: 1 }
    ));
    this.messageText.setText("現場ごとに残骸、危険物、床の雰囲気が変わります。");
  }

  private showRequests(): void {
    const { width } = this.scale;
    const inventoryCount = getInventoryCount(this.save.inventory);
    const nextLocked = DUNGEON_ORDER.find((id) => !this.isDungeonUnlocked(id));
    const request =
      nextLocked
        ? `${DUNGEONS[this.getPreviousDungeon(nextLocked)].name} B5Fを清掃して\n${DUNGEONS[nextLocked].name}を解放する`
        : inventoryCount < 10
          ? "倉庫整理: 素材を合計10個保管する"
          : "道具生産: ショップで新しい清掃道具を作る";
    this.addToPanel(this.addReadableText(width / 2, 136, "依頼", 18, "#f8e7c7", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));
    this.addToPanel(this.addPanel(width / 2, 218, width - 58, 126, 0x071219, 0.82, 0x25f6d4, 0.28));
    this.addToPanel(this.add.rectangle(54, 218, 3, 96, 0x25f6d4, 0.5));
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
    this.addToPanel(this.addReadableText(width / 2, 154, "強化", 14, "#ffe0a3", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));
    SHOP_UPGRADES.forEach((upgrade, index) => {
      const level = upgrade.getLevel(this.save.player);
      this.createButton(width / 2, 188 + index * 46, 304, 40, `${upgrade.name} Lv.${level} ${upgrade.getCost(level)}G`, upgrade.color, () => this.spendGold(upgrade.id), 13);
    });

    this.addToPanel(this.addReadableText(width / 2, 378, `生産 ${this.craftPage + 1}/${this.getCraftPageCount()}`, 14, "#ffe0a3", {
      fontStyle: "600",
      origin: [0.5, 0.5],
      strokeThickness: 1
    }));
    const start = this.craftPage * RECIPES_PER_PAGE;
    CRAFT_RECIPES.slice(start, start + RECIPES_PER_PAGE).forEach((recipe, index) => {
      const crafted = this.save.player.craftedItems.includes(recipe.id);
      const label = crafted
        ? `${recipe.name} 生産済み / ${recipe.description}`
        : `${recipe.name} ${this.formatNeeds(recipe.needs)}`;
      this.createButton(width / 2, 416 + index * 46, 304, 40, label, crafted ? 0x2f3f35 : recipe.color, () => this.craft(recipe.id), 12);
    });
    this.createButton(width / 2 - 82, height - 156, 132, 40, "前の生産", 0x1c2230, () => this.changeCraftPage(-1), 13);
    this.createButton(width / 2 + 82, height - 156, 132, 40, "次の生産", 0x1c2230, () => this.changeCraftPage(1), 13);
    this.messageText.setText("強化はお金、生産は素材で常時効果が増えます。");
  }

  private spendGold(kind: UpgradeKind): void {
    const upgrade = SHOP_UPGRADES.find((entry) => entry.id === kind);
    if (!upgrade) return;
    const cost = upgrade.getCost(upgrade.getLevel(this.save.player));
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

  private craft(recipeId: CraftItemId): void {
    const recipe = CRAFT_RECIPES.find((entry) => entry.id === recipeId);
    if (!recipe) return;
    if (this.save.player.craftedItems.includes(recipe.id)) {
      this.messageText.setText("もう生産済みです。");
      return;
    }
    const missing = Object.entries(recipe.needs).find(([id, count]) => this.save.inventory[id as ItemId] < (count ?? 0));
    if (missing) {
      this.messageText.setText(`${ITEMS[missing[0] as ItemId].name}が足りません。`);
      return;
    }
    Object.entries(recipe.needs).forEach(([id, count]) => {
      this.save.inventory[id as ItemId] -= count ?? 0;
    });
    this.save.player.craftedItems.push(recipe.id);
    if (recipe.id === "reinforced_broom") this.save.player.craftedBroom = true;
    if (recipe.id === "work_tool") this.save.player.craftedWeapon = true;
    saveGame(this.save);
    this.showTab("shop");
    this.messageText.setText(`${recipe.name}を生産しました。${recipe.description}`);
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
    const button = this.add.rectangle(x, y, width, height, color, 0.92)
      .setStrokeStyle(1, 0x25f6d4, 0.5)
      .setInteractive({ useHandCursor: true });
    const rail = this.add.rectangle(x - width / 2 + 5, y, 4, height - 10, 0x25f6d4, 0.62);
    const shine = this.add.rectangle(x, y + height / 2 - 3, width - 22, 1, 0xffffff, 0.12);
    const text = this.addReadableText(x, y, label, fontSize, "#fff4df", {
      fontStyle: "500",
      align: "center",
      origin: [0.5, 0.5],
      wordWrapWidth: width - 18,
      strokeThickness: 1
    });
    this.panel.add([button, rail, shine, text]);
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
    const capacity = getBagCapacity(this.save.player.bagLevel, this.save.player.craftedItems);
    const count = getInventoryCount(this.save.inventory);
    this.statusText.setText(
      `所持金 ${this.save.player.money}G / 素材 ${count}/${capacity} / 出動 ${this.save.progress.runs}回\n` +
      `ほうきLv.${this.save.player.broomLevel} バッグLv.${this.save.player.bagLevel} ` +
      `払うLv.${this.save.player.attackLevel} スタミナLv.${this.save.player.staminaLevel}`
    );
  }

  private isDungeonUnlocked(dungeonId: DungeonId): boolean {
    return this.save.progress.unlockedDungeons.includes(dungeonId);
  }

  private getPreviousDungeon(dungeonId: DungeonId): DungeonId {
    const index = Math.max(0, DUNGEON_ORDER.indexOf(dungeonId) - 1);
    return DUNGEON_ORDER[index];
  }

  private getCraftPageCount(): number {
    return Math.ceil(CRAFT_RECIPES.length / RECIPES_PER_PAGE);
  }

  private changeCraftPage(delta: number): void {
    const pageCount = this.getCraftPageCount();
    this.craftPage = (this.craftPage + delta + pageCount) % pageCount;
    this.showTab("shop");
  }

  private formatNeeds(needs: Partial<Record<ItemId, number>>): string {
    return Object.entries(needs)
      .map(([id, count]) => `${ITEMS[id as ItemId].name}${count}`)
      .join(" ");
  }

  private refreshTabs(): void {
    for (const [tab, button] of this.tabButtons) {
      const active = tab === this.currentTab;
      button.setFillStyle(active ? 0x073c39 : 0x071219, active ? 0.98 : 0.96);
      button.setStrokeStyle(1, active ? 0x25f6d4 : 0x587578, active ? 0.86 : 0.48);
      const label = this.tabLabels.get(tab);
      label?.setColor(active ? "#25f6d4" : "#c9d8d4");
      label?.setStroke("#061113", 1);
    }
  }

  private addEdgeFrame(x: number, y: number, width: number, height: number, color: number, alpha: number): void {
    this.createEdgeFrame(x, y, width, height, color, alpha);
  }

  private createEdgeFrame(x: number, y: number, width: number, height: number, color: number, alpha: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const left = x - width / 2;
    const right = x + width / 2;
    const top = y - height / 2;
    const bottom = y + height / 2;
    const corner = 18;
    g.lineStyle(1, color, alpha);
    g.beginPath();
    g.moveTo(left, top + corner);
    g.lineTo(left, top);
    g.lineTo(left + corner, top);
    g.moveTo(right - corner, top);
    g.lineTo(right, top);
    g.lineTo(right, top + corner);
    g.moveTo(left, bottom - corner);
    g.lineTo(left, bottom);
    g.lineTo(left + corner, bottom);
    g.moveTo(right - corner, bottom);
    g.lineTo(right, bottom);
    g.lineTo(right, bottom - corner);
    g.strokePath();
    return g;
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
