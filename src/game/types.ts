import type { ItemId } from "./data/items";

export type RunResult = {
  cleared: boolean;
  retreated: boolean;
  cleaned: number;
  totalDebris: number;
  damageTaken: number;
  durationMs: number;
  inventory: Record<ItemId, number>;
  earnedMoney: number;
  rank: "S" | "A" | "B" | "C" | "D";
};
