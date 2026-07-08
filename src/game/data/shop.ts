import type { ItemId } from "./items";

export type UpgradeKind = "broom" | "bag" | "attack" | "stamina";

export type CraftItemId =
  | "reinforced_broom"
  | "moss_brush"
  | "ash_brush"
  | "stone_scraper"
  | "light_bag"
  | "reinforced_bag"
  | "material_pouch"
  | "work_tool"
  | "metal_spatula"
  | "ash_gloves"
  | "grip_boots"
  | "small_lantern";

export type ShopUpgrade = {
  id: UpgradeKind;
  name: string;
  description: string;
  color: number;
  getLevel: (player: { broomLevel: number; bagLevel: number; attackLevel: number; staminaLevel: number }) => number;
  getCost: (level: number) => number;
};

export type CraftRecipe = {
  id: CraftItemId;
  name: string;
  description: string;
  needs: Partial<Record<ItemId, number>>;
  color: number;
};

export const SHOP_UPGRADES: ShopUpgrade[] = [
  {
    id: "broom",
    name: "ほうき強化",
    description: "清掃速度を上げる",
    color: 0x526f43,
    getLevel: (player) => player.broomLevel,
    getCost: (level) => level * 50
  },
  {
    id: "bag",
    name: "バッグ強化",
    description: "素材容量を増やす",
    color: 0x365b64,
    getLevel: (player) => player.bagLevel,
    getCost: (level) => level * 70
  },
  {
    id: "attack",
    name: "追い払い強化",
    description: "危険物を払う速さを上げる",
    color: 0x74404a,
    getLevel: (player) => player.attackLevel,
    getCost: (level) => level * 60
  },
  {
    id: "stamina",
    name: "スタミナ強化",
    description: "掃除と移動の継続力を上げる",
    color: 0x4a6a4a,
    getLevel: (player) => player.staminaLevel,
    getCost: (level) => level * 55
  }
];

export const CRAFT_RECIPES: CraftRecipe[] = [
  { id: "reinforced_broom", name: "強化ほうき", description: "清掃力+1", needs: { stone: 2, wood: 2 }, color: 0x745732 },
  { id: "moss_brush", name: "苔取りブラシ", description: "粘液系残骸の清掃が少し速い", needs: { slime: 3, wood: 2 }, color: 0x4f7d58 },
  { id: "ash_brush", name: "灰払いブラシ", description: "灰系残骸の清掃が少し速い", needs: { ash: 3, wood: 2 }, color: 0x6b6670 },
  { id: "stone_scraper", name: "石割りスクレーパー", description: "石/瓦礫系残骸の清掃が少し速い", needs: { stone: 4, metal: 1 }, color: 0x71685e },
  { id: "light_bag", name: "軽量バッグ", description: "バッグ容量+8", needs: { wood: 3, slime: 2 }, color: 0x4e6b7d },
  { id: "reinforced_bag", name: "補強バッグ", description: "バッグ容量+12", needs: { wood: 3, metal: 2 }, color: 0x5d7656 },
  { id: "material_pouch", name: "素材ポーチ", description: "素材容量+6", needs: { slime: 2, ash: 2, wood: 1 }, color: 0x6a5b85 },
  { id: "work_tool", name: "作業道具", description: "追い払い力+1", needs: { metal: 1, wood: 2 }, color: 0x745732 },
  { id: "metal_spatula", name: "金属ヘラ", description: "追い払い力+1", needs: { metal: 3, stone: 2 }, color: 0x7d7f86 },
  { id: "ash_gloves", name: "灰よけ手袋", description: "炉跡と灰のダメージを軽減", needs: { ash: 4, slime: 1 }, color: 0x8a5142 },
  { id: "grip_boots", name: "滑り止め長靴", description: "貯水路の危険床ダメージを軽減", needs: { slime: 4, metal: 1 }, color: 0x386d68 },
  { id: "small_lantern", name: "小さなランタン", description: "出口出現後の光を強くする", needs: { metal: 2, ash: 2, stone: 2 }, color: 0xb9772c }
];

export function isCraftItemId(value: unknown): value is CraftItemId {
  return typeof value === "string" && CRAFT_RECIPES.some((recipe) => recipe.id === value);
}

export function hasCrafted(craftedItems: string[], id: CraftItemId): boolean {
  return craftedItems.includes(id);
}

export function getCraftedBonus(craftedItems: string[]) {
  return {
    cleaningPower: (hasCrafted(craftedItems, "reinforced_broom") ? 1 : 0),
    attackPower:
      (hasCrafted(craftedItems, "work_tool") ? 1 : 0) +
      (hasCrafted(craftedItems, "metal_spatula") ? 1 : 0),
    bagCapacity:
      (hasCrafted(craftedItems, "light_bag") ? 8 : 0) +
      (hasCrafted(craftedItems, "reinforced_bag") ? 12 : 0) +
      (hasCrafted(craftedItems, "material_pouch") ? 6 : 0)
  };
}
