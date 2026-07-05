import type { ItemId } from "./items";
import { ASSET_KEYS } from "./assets";
import {
  getAttackUpgradeCost,
  getBagUpgradeCost,
  getBroomUpgradeCost,
  getStaminaUpgradeCost
} from "./upgrades";
import type { SaveData } from "../systems/SaveSystem";

export type BaseTab = "home" | "inventory" | "map" | "requests" | "shop" | "codex";

export type BaseTabDefinition = {
  id: Exclude<BaseTab, "codex">;
  label: string;
  iconKey: string;
};

export const BASE_TABS: BaseTabDefinition[] = [
  { id: "home", label: "ホーム", iconKey: ASSET_KEYS.ui.broom },
  { id: "inventory", label: "持ち物", iconKey: ASSET_KEYS.ui.bag },
  { id: "map", label: "マップ", iconKey: ASSET_KEYS.ui.map },
  { id: "requests", label: "依頼", iconKey: ASSET_KEYS.ui.request },
  { id: "shop", label: "ショップ", iconKey: ASSET_KEYS.ui.shop }
];

export const HOME_MEMO = {
  title: "今日の清掃メモ",
  body: [
    "はじまりの地下道 B1F-B5F",
    "清掃率80%以上で出口が開きます。",
    "素材を持ち帰り、道具を整えて再出動しましょう。"
  ],
  message: "短く潜って素材を持ち帰り、ショップで道具を整えましょう。"
};

export const MAP_INFO = {
  title: "はじまりの地下道",
  iconKey: ASSET_KEYS.dungeon.exit,
  rows: [
    "B1F: 小さな残骸と粘液跡の練習階",
    "B2F: 危険物の巡回が増えます",
    "B3F: 素材が増え、バッグ管理が大事",
    "B4F: 追跡される前に掃除を切り上げる階",
    "B5F: 最奥地。帰還できれば一仕事完了"
  ],
  note: "出撃ごとに開始位置、残骸、危険物の配置が変わります。"
};

export type CodexSection = {
  title: string;
  iconKey: string;
  entries: Array<{
    name: string;
    text: string;
    reveal: (save: SaveData) => boolean;
  }>;
};

export const CODEX_SECTIONS: CodexSection[] = [
  {
    title: "モンスター",
    iconKey: ASSET_KEYS.enemy.caveWatcher,
    entries: [
      { name: "粘液だまり", text: "視線に入ると ! を出して追いかけてきます。払うと素材が残ります。", reveal: (save) => save.progress.runs > 0 },
      { name: "灰まじりの気配", text: "深い階ほど動きが速くなります。掃除中の接触に注意。", reveal: (save) => save.progress.runs > 1 }
    ]
  },
  {
    title: "素材",
    iconKey: ASSET_KEYS.item.treasure,
    entries: [
      { name: "石材・木片", text: "ほうき生産の基本素材。まずは2個ずつ集めたい。", reveal: () => true },
      { name: "粘液素材・灰・金属片", text: "売却価値が高め。金属片は作業道具生産に使います。", reveal: (save) => save.progress.runs > 0 }
    ]
  },
  {
    title: "宝",
    iconKey: ASSET_KEYS.item.treasure,
    entries: [
      { name: "壊れた宝箱", text: "宝そのものではなく、清掃後に金属片が残ることがあります。", reveal: (save) => save.inventory.metal > 0 }
    ]
  },
  {
    title: "成長",
    iconKey: ASSET_KEYS.player.cleaner,
    entries: [
      { name: "ほうき", text: "掃除の速さに影響します。一度押して始める掃除が短く済みます。", reveal: () => true },
      { name: "バッグ", text: "持ち帰れる素材数が増えます。長めに潜る理由になります。", reveal: () => true },
      { name: "追い払い・スタミナ", text: "危険物の片付け速度と、掃除/走るの継続力を伸ばします。", reveal: () => true }
    ]
  }
];

export type RequestDefinition = {
  title: string;
  target: string;
  rewardHint: string;
  iconKey: string;
  isActive: (save: SaveData) => boolean;
};

export const REQUESTS: RequestDefinition[] = [
  {
    title: "初回清掃",
    target: "素材を3個持ち帰る",
    rewardHint: "売上で最初の強化に近づきます。",
    iconKey: ASSET_KEYS.ui.request,
    isActive: (save) => save.progress.runs < 1
  },
  {
    title: "道具づくり",
    target: "石材2個と木片2個を集める",
    rewardHint: "強化ほうきの生産を狙えます。",
    iconKey: ASSET_KEYS.ui.broom,
    isActive: (save) => !save.player.craftedBroom
  },
  {
    title: "危険物対処",
    target: "金属片1個と木片2個を集める",
    rewardHint: "作業道具を生産すると追い払いが楽になります。",
    iconKey: ASSET_KEYS.ui.attack,
    isActive: (save) => !save.player.craftedWeapon
  },
  {
    title: "最奥地確認",
    target: "B5Fまで進み、出口から帰還する",
    rewardHint: "v1の短期探索ループの仕上げです。",
    iconKey: ASSET_KEYS.dungeon.exit,
    isActive: () => true
  }
];

export type UpgradeKind = "broom" | "bag" | "attack" | "stamina";
export type CraftKind = "broom" | "weapon";

export type ShopEntry =
  | {
      type: "upgrade";
      kind: UpgradeKind;
      title: string;
      description: string;
      iconKey: string;
      color: number;
      getCost: (save: SaveData) => number;
      getLevel: (save: SaveData) => number;
    }
  | {
      type: "craft";
      kind: CraftKind;
      title: string;
      description: string;
      iconKey: string;
      color: number;
      needs: Partial<Record<ItemId, number>>;
      isCrafted: (save: SaveData) => boolean;
    };

export const SHOP_ENTRIES: ShopEntry[] = [
  {
    type: "upgrade",
    kind: "broom",
    title: "ほうき強化",
    description: "掃除速度が上がり、硬い残骸を短く片付けられます。",
    iconKey: ASSET_KEYS.ui.broom,
    color: 0x6f9345,
    getCost: (save) => getBroomUpgradeCost(save.player.broomLevel),
    getLevel: (save) => save.player.broomLevel
  },
  {
    type: "upgrade",
    kind: "bag",
    title: "バッグ強化",
    description: "持ち帰れる素材数が増え、深い階まで粘れます。",
    iconKey: ASSET_KEYS.ui.bag,
    color: 0x4f7f96,
    getCost: (save) => getBagUpgradeCost(save.player.bagLevel),
    getLevel: (save) => save.player.bagLevel
  },
  {
    type: "upgrade",
    kind: "attack",
    title: "追い払い強化",
    description: "危険物を払う速度が上がり、作業を続けやすくなります。",
    iconKey: ASSET_KEYS.ui.attack,
    color: 0x9b4350,
    getCost: (save) => getAttackUpgradeCost(save.player.attackLevel),
    getLevel: (save) => save.player.attackLevel
  },
  {
    type: "upgrade",
    kind: "stamina",
    title: "スタミナ強化",
    description: "掃除、走る、追い払いの継続力が上がります。",
    iconKey: ASSET_KEYS.ui.stamina,
    color: 0x5e8f58,
    getCost: (save) => getStaminaUpgradeCost(save.player.staminaLevel),
    getLevel: (save) => save.player.staminaLevel
  },
  {
    type: "craft",
    kind: "broom",
    title: "強化ほうき生産",
    description: "清掃員の主道具。生産後は掃除効率が底上げされます。",
    iconKey: ASSET_KEYS.player.broom,
    color: 0x8b6338,
    needs: { stone: 2, wood: 2 },
    isCrafted: (save) => save.player.craftedBroom
  },
  {
    type: "craft",
    kind: "weapon",
    title: "作業道具生産",
    description: "危険物を討伐ではなく、素早く片付けるための道具です。",
    iconKey: ASSET_KEYS.ui.attack,
    color: 0x8b6338,
    needs: { metal: 1, wood: 2 },
    isCrafted: (save) => save.player.craftedWeapon
  }
];

export function getActiveRequest(save: SaveData): RequestDefinition {
  return REQUESTS.find((request) => request.isActive(save)) ?? REQUESTS[REQUESTS.length - 1];
}
