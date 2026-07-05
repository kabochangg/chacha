import { ASSET_KEYS } from "./assets";

export type ItemId = "stone" | "wood" | "slime" | "ash" | "metal";

export type ItemData = {
  id: ItemId;
  name: string;
  sellPrice: number;
  description: string;
  useText: string;
  iconKey: string;
};

export const ITEMS: Record<ItemId, ItemData> = {
  stone: {
    id: "stone",
    name: "石材",
    sellPrice: 2,
    description: "崩れた床や壁から出る小さな石材。",
    useText: "ほうき生産、床まわりの補修メモ",
    iconKey: ASSET_KEYS.item.stone
  },
  wood: {
    id: "wood",
    name: "木片",
    sellPrice: 3,
    description: "壊れた木箱や古い支柱から拾える乾いた木片。",
    useText: "ほうき生産、作業道具生産",
    iconKey: ASSET_KEYS.item.wood
  },
  slime: {
    id: "slime",
    name: "粘液素材",
    sellPrice: 5,
    description: "床に残ったぬめりを固めた素材。意外とよく売れる。",
    useText: "売却、図鑑記録、依頼達成",
    iconKey: ASSET_KEYS.item.slime
  },
  ash: {
    id: "ash",
    name: "灰",
    sellPrice: 4,
    description: "焦げ跡から掃き集めた灰。危険な床の記録にも使う。",
    useText: "売却、危険物メモ",
    iconKey: ASSET_KEYS.item.ash
  },
  metal: {
    id: "metal",
    name: "金属片",
    sellPrice: 8,
    description: "壊れた宝箱や古い罠から外れた金属片。",
    useText: "作業道具生産、売却",
    iconKey: ASSET_KEYS.item.metal
  }
};

export function getInventoryCount(inventory: Partial<Record<ItemId, number>>): number {
  return Object.values(inventory).reduce((total, count) => total + (count ?? 0), 0);
}

export function getInventoryValue(inventory: Partial<Record<ItemId, number>>): number {
  return Object.entries(inventory).reduce((total, [id, count]) => {
    const item = ITEMS[id as ItemId];
    return total + (item.sellPrice * (count ?? 0));
  }, 0);
}
