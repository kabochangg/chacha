import type { ItemId } from "./items";

export type DungeonId = "beginner_cave" | "moss_waterway" | "ash_forge";

export type DungeonTheme = {
  background: number;
  floorA: number;
  floorB: number;
  floorTint: number;
  floorAlpha: number;
  wallTint: number;
  wallStroke: number;
  ambient: number;
  accent: number;
  exitGlow: number;
};

export type DungeonData = {
  id: DungeonId;
  name: string;
  shortName: string;
  description: string;
  unlockText: string;
  nextDungeonId?: DungeonId;
  debrisWeights: ItemId[];
  enemyDrops: ItemId[];
  enemyHpBonus: number;
  trapDamageMultiplier: number;
  theme: DungeonTheme;
};

export const DUNGEON_ORDER: DungeonId[] = ["beginner_cave", "moss_waterway", "ash_forge"];

export const DUNGEONS: Record<DungeonId, DungeonData> = {
  beginner_cave: {
    id: "beginner_cave",
    name: "はじまりの地下道",
    shortName: "地下道",
    description: "石畳と木箱が残る、最初の清掃現場。",
    unlockText: "最初から解放",
    nextDungeonId: "moss_waterway",
    debrisWeights: ["stone", "wood", "slime", "stone", "wood", "ash", "metal"],
    enemyDrops: ["slime", "ash", "metal"],
    enemyHpBonus: 0,
    trapDamageMultiplier: 1,
    theme: {
      background: 0x11141a,
      floorA: 0x24252c,
      floorB: 0x2a2a31,
      floorTint: 0xd8c5a3,
      floorAlpha: 0.24,
      wallTint: 0x8b6338,
      wallStroke: 0x69513a,
      ambient: 0xe2b56f,
      accent: 0x67b7a8,
      exitGlow: 0x7ce59a
    }
  },
  moss_waterway: {
    id: "moss_waterway",
    name: "苔むした貯水路",
    shortName: "貯水路",
    description: "湿った床に粘液と苔が広がる水路跡。",
    unlockText: "はじまりの地下道 B5F清掃で解放",
    nextDungeonId: "ash_forge",
    debrisWeights: ["slime", "slime", "wood", "wood", "stone", "ash", "metal"],
    enemyDrops: ["slime", "slime", "wood", "ash"],
    enemyHpBonus: 1,
    trapDamageMultiplier: 1.1,
    theme: {
      background: 0x0d1d22,
      floorA: 0x183038,
      floorB: 0x1c3a3f,
      floorTint: 0x9ad7c2,
      floorAlpha: 0.3,
      wallTint: 0x3d6f65,
      wallStroke: 0x78b59b,
      ambient: 0x67b7a8,
      accent: 0xa4d56b,
      exitGlow: 0x88ffd6
    }
  },
  ash_forge: {
    id: "ash_forge",
    name: "灰かぶりの炉跡",
    shortName: "炉跡",
    description: "熱の名残と金属片が眠る、黒ずんだ工房跡。",
    unlockText: "苔むした貯水路 B5F清掃で解放",
    debrisWeights: ["ash", "ash", "metal", "metal", "stone", "wood", "slime"],
    enemyDrops: ["ash", "metal", "metal", "slime"],
    enemyHpBonus: 2,
    trapDamageMultiplier: 1.2,
    theme: {
      background: 0x1b1111,
      floorA: 0x2c2220,
      floorB: 0x372622,
      floorTint: 0xf0a064,
      floorAlpha: 0.28,
      wallTint: 0x9b4b35,
      wallStroke: 0xd08a54,
      ambient: 0xf2a65a,
      accent: 0xc65d4a,
      exitGlow: 0xffbd76
    }
  }
};

export function isDungeonId(value: unknown): value is DungeonId {
  return typeof value === "string" && value in DUNGEONS;
}

export function getDungeon(id: unknown): DungeonData {
  return isDungeonId(id) ? DUNGEONS[id] : DUNGEONS.beginner_cave;
}

export function normalizeUnlockedDungeons(source?: string[]): DungeonId[] {
  const unlocked = new Set<DungeonId>(["beginner_cave"]);
  for (const id of source ?? []) {
    if (isDungeonId(id)) unlocked.add(id);
  }
  return DUNGEON_ORDER.filter((id) => unlocked.has(id));
}
