import type { BattleState, SideState, TroopInstance } from "../types/battle";
import type { Side } from "../types/effect";

export function otherSide(side: Side): Side {
  return side === "player" ? "enemy" : "player";
}

export function getSide(state: BattleState, side: Side): SideState {
  return side === "player" ? state.player : state.enemy;
}

export function aliveTroops(side: SideState): TroopInstance[] {
  return side.troopSlots.filter((s): s is TroopInstance => s !== null);
}

export function hasGuardTroop(side: SideState): boolean {
  return aliveTroops(side).some((t) => t.keywords.has("guard"));
}

export function findTroopBySide(state: BattleState, instanceId: string): { side: Side; troop: TroopInstance; slotIndex: number } | null {
  for (const side of ["player", "enemy"] as const) {
    const slots = getSide(state, side).troopSlots;
    for (let i = 0; i < slots.length; i++) {
      const t = slots[i];
      if (t && t.instanceId === instanceId) {
        return { side, troop: t, slotIndex: i };
      }
    }
  }
  return null;
}

export function freeSlotIndex(side: SideState): number {
  return side.troopSlots.findIndex((s) => s === null);
}

export function activeManaCap(side: SideState): number {
  return Math.min(side.manaCap, side.manaCapAbsolute);
}

export function isOver(state: BattleState): boolean {
  return state.result !== "ongoing";
}
