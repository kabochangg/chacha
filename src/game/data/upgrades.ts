import { getCraftedBonus } from "./shop";

export function getCleaningPower(broomLevel: number, craftedItems: string[] = [], itemId?: string): number {
  const bonus = getCraftedBonus(craftedItems);
  const itemBonus =
    (itemId === "slime" && craftedItems.includes("moss_brush")) ||
    (itemId === "ash" && craftedItems.includes("ash_brush")) ||
    (itemId === "stone" && craftedItems.includes("stone_scraper"))
      ? 0.7
      : 0;
  return Math.max(1, broomLevel) + bonus.cleaningPower + itemBonus;
}

export function getAttackPower(attackLevel: number, craftedWeapon: boolean, craftedItems: string[] = []): number {
  return Math.max(1, attackLevel) + (craftedWeapon ? 1 : 0) + getCraftedBonus(craftedItems).attackPower;
}

export function getMaxStamina(staminaLevel: number): number {
  return 100 + Math.max(0, staminaLevel - 1) * 18;
}

export function getBagCapacity(bagLevel: number, craftedItems: string[] = []): number {
  return 40 + Math.max(0, bagLevel - 1) * 10 + getCraftedBonus(craftedItems).bagCapacity;
}

export function getBroomUpgradeCost(level: number): number {
  return level * 50;
}

export function getBagUpgradeCost(level: number): number {
  return level * 70;
}

export function getAttackUpgradeCost(level: number): number {
  return level * 60;
}

export function getStaminaUpgradeCost(level: number): number {
  return level * 55;
}
