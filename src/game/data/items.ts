export type ItemId = "stone" | "wood" | "slime" | "ash" | "metal";

export type ItemData = {
  id: ItemId;
  name: string;
  sellPrice: number;
};

export const ITEMS: Record<ItemId, ItemData> = {
  stone: { id: "stone", name: "石材", sellPrice: 2 },
  wood: { id: "wood", name: "木片", sellPrice: 3 },
  slime: { id: "slime", name: "粘液素材", sellPrice: 5 },
  ash: { id: "ash", name: "灰", sellPrice: 4 },
  metal: { id: "metal", name: "金属片", sellPrice: 8 }
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
