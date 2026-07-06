export function getCleaningPower(broomLevel: number): number {
  return Math.max(1, broomLevel);
}

export function getAttackPower(attackLevel: number, craftedWeapon: boolean): number {
  return Math.max(1, attackLevel) + (craftedWeapon ? 1 : 0);
}

export function getMaxStamina(staminaLevel: number): number {
  return 100 + Math.max(0, staminaLevel - 1) * 18;
}

export function getBagCapacity(bagLevel: number): number {
  return 40 + Math.max(0, bagLevel - 1) * 10;
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
