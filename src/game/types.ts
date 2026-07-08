import type { ItemId } from "./data/items";
import type { DungeonId } from "./data/dungeons";

export type RunResult = {
  dungeonId: DungeonId;
  floorReached: number;
  completedDungeon: boolean;
  cleared: boolean;
  retreated: boolean;
  cleaned: number;
  totalDebris: number;
  cleanScore: number;
  damageTaken: number;
  durationMs: number;
  inventory: Record<ItemId, number>;
  earnedMoney: number;
  rank: "S" | "A" | "B" | "C" | "D";
};
