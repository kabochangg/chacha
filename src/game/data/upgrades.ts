export function getCleaningPower(broomLevel: number): number {
  return Math.max(1, broomLevel);
}

export function getBagCapacity(bagLevel: number): number {
  return 10 + Math.max(0, bagLevel - 1) * 5;
}

export function getBroomUpgradeCost(level: number): number {
  return level * 50;
}

export function getBagUpgradeCost(level: number): number {
  return level * 70;
}
