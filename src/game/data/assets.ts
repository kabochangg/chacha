export type AssetCategory = "ui" | "item" | "enemy" | "debris" | "player" | "dungeon" | "effect";

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
    slimeHazardAlert: "enemy.slime_hazard_alert",
    ashWisp: "enemy.ash_wisp",
    ashWispAlert: "enemy.ash_wisp_alert",
    caveWatcher: "enemy.cave_watcher",
    caveWatcherAlert: "enemy.cave_watcher_alert"
  },
  debris: {
    smallStone: "debris.small_stone",
    smallStoneHalf: "debris.small_stone_half",
    slimeTrail: "debris.slime_trail",
    slimeTrailHalf: "debris.slime_trail_half",
    brokenCrate: "debris.broken_crate",
    brokenCrateHalf: "debris.broken_crate_half",
    burntAsh: "debris.burnt_ash",
    burntAshHalf: "debris.burnt_ash_half",
    brokenChest: "debris.broken_chest",
    brokenChestHalf: "debris.broken_chest_half"
  },
  player: {
    cleaner: "player.cleaner",
    cleanerWalk: "player.cleaner_walk",
    cleanerClean: "player.cleaner_clean",
    cleanerDamage: "player.cleaner_damage",
    broom: "player.broom",
    bag: "player.bag"
  },
  dungeon: {
    exit: "dungeon.exit",
    exitOpen: "dungeon.exit_open",
    floorStone: "dungeon.floor_stone",
    wallStone: "dungeon.wall_stone"
  },
  effect: {
    alertMark: "effect.alert_mark",
    dustSmall: "effect.dust_small",
    dustMedium: "effect.dust_medium"
  }
} as const;

export type ImageAsset = {
  key: string;
  path: string;
};

export const GAME_IMAGE_ASSETS: ImageAsset[] = [
  { key: ASSET_KEYS.player.cleaner, path: "assets/game/player/cleaner_idle.png" },
  { key: ASSET_KEYS.player.cleanerWalk, path: "assets/game/player/cleaner_walk.png" },
  { key: ASSET_KEYS.player.cleanerClean, path: "assets/game/player/cleaner_clean.png" },
  { key: ASSET_KEYS.player.cleanerDamage, path: "assets/game/player/cleaner_damage.png" },
  { key: ASSET_KEYS.player.broom, path: "assets/game/player/broom_normal.png" },
  { key: ASSET_KEYS.player.bag, path: "assets/game/player/bag_small.png" },
  { key: ASSET_KEYS.debris.smallStone, path: "assets/game/debris/small_stone_full.png" },
  { key: ASSET_KEYS.debris.smallStoneHalf, path: "assets/game/debris/small_stone_half.png" },
  { key: ASSET_KEYS.debris.slimeTrail, path: "assets/game/debris/slime_trail_full.png" },
  { key: ASSET_KEYS.debris.slimeTrailHalf, path: "assets/game/debris/slime_trail_half.png" },
  { key: ASSET_KEYS.debris.brokenCrate, path: "assets/game/debris/broken_crate_full.png" },
  { key: ASSET_KEYS.debris.brokenCrateHalf, path: "assets/game/debris/broken_crate_half.png" },
  { key: ASSET_KEYS.debris.burntAsh, path: "assets/game/debris/burnt_ash_full.png" },
  { key: ASSET_KEYS.debris.burntAshHalf, path: "assets/game/debris/burnt_ash_half.png" },
  { key: ASSET_KEYS.debris.brokenChest, path: "assets/game/debris/broken_chest_full.png" },
  { key: ASSET_KEYS.debris.brokenChestHalf, path: "assets/game/debris/broken_chest_half.png" },
  { key: ASSET_KEYS.item.stone, path: "assets/game/item/stone.png" },
  { key: ASSET_KEYS.item.wood, path: "assets/game/item/wood.png" },
  { key: ASSET_KEYS.item.slime, path: "assets/game/item/slime.png" },
  { key: ASSET_KEYS.item.ash, path: "assets/game/item/ash.png" },
  { key: ASSET_KEYS.item.metal, path: "assets/game/item/metal.png" },
  { key: ASSET_KEYS.enemy.slimeHazard, path: "assets/game/enemy/slime_hazard_idle.png" },
  { key: ASSET_KEYS.enemy.slimeHazardAlert, path: "assets/game/enemy/slime_hazard_alert.png" },
  { key: ASSET_KEYS.enemy.ashWisp, path: "assets/game/enemy/ash_wisp_idle.png" },
  { key: ASSET_KEYS.enemy.ashWispAlert, path: "assets/game/enemy/ash_wisp_alert.png" },
  { key: ASSET_KEYS.enemy.caveWatcher, path: "assets/game/enemy/cave_watcher_idle.png" },
  { key: ASSET_KEYS.enemy.caveWatcherAlert, path: "assets/game/enemy/cave_watcher_alert.png" },
  { key: ASSET_KEYS.dungeon.exit, path: "assets/game/dungeon/exit_closed.png" },
  { key: ASSET_KEYS.dungeon.exitOpen, path: "assets/game/dungeon/exit_open.png" },
  { key: ASSET_KEYS.dungeon.floorStone, path: "assets/game/dungeon/floor_stone.png" },
  { key: ASSET_KEYS.dungeon.wallStone, path: "assets/game/dungeon/wall_stone.png" },
  { key: ASSET_KEYS.effect.alertMark, path: "assets/game/effect/alert_mark.png" },
  { key: ASSET_KEYS.effect.dustSmall, path: "assets/game/effect/dust_small.png" },
  { key: ASSET_KEYS.effect.dustMedium, path: "assets/game/effect/dust_medium.png" }
];

export const PLACEHOLDER_ASSETS: Record<string, AssetPlaceholder> = {
  [ASSET_KEYS.ui.coin]: { key: ASSET_KEYS.ui.coin, category: "ui", label: "G", color: 0xdca84a, accent: 0xffe0a3, shape: "circle" },
  [ASSET_KEYS.ui.bag]: { key: ASSET_KEYS.ui.bag, category: "ui", label: "袋", color: 0x5d7656, accent: 0xbde7a5, shape: "badge" },
  [ASSET_KEYS.ui.broom]: { key: ASSET_KEYS.ui.broom, category: "ui", label: "箒", color: 0x8b6338, accent: 0xf2c36b, shape: "badge" },
  [ASSET_KEYS.ui.map]: { key: ASSET_KEYS.ui.map, category: "ui", label: "図", color: 0x4f6f8a, accent: 0xbfd8ff, shape: "square" },
  [ASSET_KEYS.ui.request]: { key: ASSET_KEYS.ui.request, category: "ui", label: "依", color: 0x7a5d3a, accent: 0xf4d29a, shape: "square" },
  [ASSET_KEYS.ui.shop]: { key: ASSET_KEYS.ui.shop, category: "ui", label: "店", color: 0x7e4e42, accent: 0xffc2a3, shape: "badge" },
  [ASSET_KEYS.ui.codex]: { key: ASSET_KEYS.ui.codex, category: "ui", label: "鑑", color: 0x5b567d, accent: 0xd7d0ff, shape: "badge" },
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
