import type { SideState } from "../types/battle";

export function spendMana(side: SideState, cost: number): boolean {
  if (cost <= 0) return true;
  // 先用臨時魔力
  let remaining = cost;
  if (side.tempMana > 0) {
    const used = Math.min(side.tempMana, remaining);
    side.tempMana -= used;
    remaining -= used;
  }
  if (side.manaCurrent < remaining) return false;
  side.manaCurrent -= remaining;
  return true;
}

export function totalAvailableMana(side: SideState): number {
  return side.manaCurrent + side.tempMana;
}

export function canAffordMana(side: SideState, cost: number): boolean {
  return totalAvailableMana(side) >= cost;
}

export function refillMana(side: SideState, capAbsolute: number, turn: number): void {
  side.manaCap = Math.min(turn, capAbsolute);
  side.manaCurrent = side.manaCap;
  side.tempMana = 0;
}

export function addTempMana(side: SideState, amount: number): void {
  side.tempMana = Math.max(0, side.tempMana + amount);
}
