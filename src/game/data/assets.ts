export type AssetCategory = "ui" | "item" | "enemy" | "debris" | "player" | "dungeon";

export type PlaceholderShape = "circle" | "square" | "diamond" | "star" | "badge";

export type AssetPlaceholder = {
  key: string;
  category: AssetCategory;
  label: string;
  color: number;
  accent: number;
  shape: PlaceholderShape;
};

export const ASSET_KEYS = {
  ui: {
    coin: "ui.coin",
    bag: "ui.bag",
    broom: "ui.broom",
    map: "ui.map",
    request: "ui.request",
    shop: "ui.shop",
    codex: "ui.codex",
    stamina: "ui.stamina",
    attack: "ui.attack"
  },
  item: {
    stone: "item.stone",
    wood: "item.wood",
    slime: "item.slime",
    ash: "item.ash",
    metal: "item.metal",
    treasure: "item.treasure"
  },
  enemy: {
    slimeHazard: "enemy.slime_hazard",
    ashWisp: "enemy.ash_wisp",
    caveWatcher: "enemy.cave_watcher"
  },
  debris: {
    smallStone: "debris.small_stone",
    slimeTrail: "debris.slime_trail",
    brokenCrate: "debris.broken_crate",
    burntAsh: "debris.burnt_ash",
    brokenChest: "debris.broken_chest"
  },
  player: {
    cleaner: "player.cleaner",
    broom: "player.broom",
    bag: "player.bag"
  },
  dungeon: {
    exit: "dungeon.exit",
    floorStone: "dungeon.floor_stone",
    wallStone: "dungeon.wall_stone"
  }
} as const;

export const PLACEHOLDER_ASSETS: Record<string, AssetPlaceholder> = {
  [ASSET_KEYS.ui.coin]: { key: ASSET_KEYS.ui.coin, category: "ui", label: "G", color: 0xdca84a, accent: 0xffe0a3, shape: "circle" },
  [ASSET_KEYS.ui.bag]: { key: ASSET_KEYS.ui.bag, category: "ui", label: "袋", color: 0x5d7656, accent: 0xbde7a5, shape: "badge" },
  [ASSET_KEYS.ui.broom]: { key: ASSET_KEYS.ui.broom, category: "ui", label: "箒", color: 0x8b6338, accent: 0xf2c36b, shape: "badge" },
  [ASSET_KEYS.ui.map]: { key: ASSET_KEYS.ui.map, category: "ui", label: "図", color: 0x4f6f8a, accent: 0xbfd8ff, shape: "square" },
  [ASSET_KEYS.ui.request]: { key: ASSET_KEYS.ui.request, category: "ui", label: "依", color: 0x7a5d3a, accent: 0xf4d29a, shape: "square" },
  [ASSET_KEYS.ui.shop]: { key: ASSET_KEYS.ui.shop, category: "ui", label: "店", color: 0x7e4e42, accent: 0xffc2a3, shape: "badge" },
  [ASSET_KEYS.ui.codex]: { key: ASSET_KEYS.ui.codex, category: "ui", label: "録", color: 0x5b567d, accent: 0xd7d0ff, shape: "badge" },
  [ASSET_KEYS.ui.stamina]: { key: ASSET_KEYS.ui.stamina, category: "ui", label: "気", color: 0x50785c, accent: 0xb9efc8, shape: "circle" },
  [ASSET_KEYS.ui.attack]: { key: ASSET_KEYS.ui.attack, category: "ui", label: "払", color: 0x8e4e55, accent: 0xffb0ba, shape: "diamond" },
  [ASSET_KEYS.item.stone]: { key: ASSET_KEYS.item.stone, category: "item", label: "石", color: 0x8a7a61, accent: 0xd8c5a3, shape: "diamond" },
  [ASSET_KEYS.item.wood]: { key: ASSET_KEYS.item.wood, category: "item", label: "木", color: 0x7d5430, accent: 0xe1ad6a, shape: "square" },
  [ASSET_KEYS.item.slime]: { key: ASSET_KEYS.item.slime, category: "item", label: "粘", color: 0x5fae79, accent: 0xb8ffd0, shape: "circle" },
  [ASSET_KEYS.item.ash]: { key: ASSET_KEYS.item.ash, category: "item", label: "灰", color: 0x5c5a62, accent: 0xd8d6df, shape: "circle" },
  [ASSET_KEYS.item.metal]: { key: ASSET_KEYS.item.metal, category: "item", label: "鉄", color: 0x8d929a, accent: 0xf1f5ff, shape: "diamond" },
  [ASSET_KEYS.item.treasure]: { key: ASSET_KEYS.item.treasure, category: "item", label: "宝", color: 0xa67536, accent: 0xffda7b, shape: "badge" },
  [ASSET_KEYS.enemy.slimeHazard]: { key: ASSET_KEYS.enemy.slimeHazard, category: "enemy", label: "危", color: 0x5fae79, accent: 0xe7ffe9, shape: "circle" },
  [ASSET_KEYS.enemy.ashWisp]: { key: ASSET_KEYS.enemy.ashWisp, category: "enemy", label: "煙", color: 0x6b6171, accent: 0xffd1a5, shape: "star" },
  [ASSET_KEYS.enemy.caveWatcher]: { key: ASSET_KEYS.enemy.caveWatcher, category: "enemy", label: "!", color: 0x9b4350, accent: 0xfff0a8, shape: "badge" },
  [ASSET_KEYS.debris.smallStone]: { key: ASSET_KEYS.debris.smallStone, category: "debris", label: "石", color: 0x8a7a61, accent: 0xd8c5a3, shape: "diamond" },
  [ASSET_KEYS.debris.slimeTrail]: { key: ASSET_KEYS.debris.slimeTrail, category: "debris", label: "跡", color: 0x5fae79, accent: 0xb8ffd0, shape: "circle" },
  [ASSET_KEYS.debris.brokenCrate]: { key: ASSET_KEYS.debris.brokenCrate, category: "debris", label: "箱", color: 0x7d5430, accent: 0xe1ad6a, shape: "square" },
  [ASSET_KEYS.debris.burntAsh]: { key: ASSET_KEYS.debris.burntAsh, category: "debris", label: "灰", color: 0x4c4a4d, accent: 0xc9c7d0, shape: "circle" },
  [ASSET_KEYS.debris.brokenChest]: { key: ASSET_KEYS.debris.brokenChest, category: "debris", label: "宝", color: 0xa67536, accent: 0xffda7b, shape: "badge" },
  [ASSET_KEYS.player.cleaner]: { key: ASSET_KEYS.player.cleaner, category: "player", label: "人", color: 0x6e87b0, accent: 0xf8e7c7, shape: "badge" },
  [ASSET_KEYS.player.broom]: { key: ASSET_KEYS.player.broom, category: "player", label: "箒", color: 0x8b6338, accent: 0xf2c36b, shape: "badge" },
  [ASSET_KEYS.player.bag]: { key: ASSET_KEYS.player.bag, category: "player", label: "袋", color: 0x5d7656, accent: 0xbde7a5, shape: "badge" },
  [ASSET_KEYS.dungeon.exit]: { key: ASSET_KEYS.dungeon.exit, category: "dungeon", label: "出", color: 0x4d8f6a, accent: 0xc6ffd0, shape: "badge" },
  [ASSET_KEYS.dungeon.floorStone]: { key: ASSET_KEYS.dungeon.floorStone, category: "dungeon", label: "床", color: 0x32313a, accent: 0x706b77, shape: "square" },
  [ASSET_KEYS.dungeon.wallStone]: { key: ASSET_KEYS.dungeon.wallStone, category: "dungeon", label: "壁", color: 0x25242d, accent: 0x5a5663, shape: "square" }
};

export function getPlaceholderAsset(key: string): AssetPlaceholder {
  return PLACEHOLDER_ASSETS[key] ?? {
    key,
    category: "ui",
    label: "?",
    color: 0x4b4654,
    accent: 0xf8e7c7,
    shape: "badge"
  };
}
