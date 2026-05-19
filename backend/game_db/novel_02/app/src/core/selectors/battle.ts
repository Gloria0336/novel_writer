import type { BattleState, FieldState, SideState, TroopInstance } from "../types/battle";
import type { Side } from "../types/effect";
import type { HeroInstance } from "../types/hero";
import type { UnitStatus } from "../types/status";

export function otherSide(side: Side): Side {
  return side === "player" ? "enemy" : "player";
}

export function getSide(state: BattleState, side: Side): SideState {
  return side === "player" ? state.player : state.enemy;
}

/** 取出指定 side 槽位上的場地（null 表示該方無場地）。 */
export function getFieldOf(state: BattleState, side: Side): FieldState | null {
  return state.field[side];
}

/** 若任一方槽位上有指定 cardId 的場地，回傳該方；否則 null。 */
export function findFieldSideByCardId(state: BattleState, cardId: string): Side | null {
  if (state.field.player?.cardId === cardId) return "player";
  if (state.field.enemy?.cardId === cardId) return "enemy";
  return null;
}

export function aliveTroops(side: SideState): TroopInstance[] {
  const troops = side.troopSlots.filter((s): s is TroopInstance => s !== null);
  if (side.frontlineSlot) troops.push(side.frontlineSlot);
  return troops;
}

export function hasGuardTroop(side: SideState): boolean {
  return aliveTroops(side).some((t) => t.keywords.has("guard"));
}

export function troopHasStatus(troop: TroopInstance, status: UnitStatus): boolean {
  return troop.statusBuffs?.some((buff) => buff.status === status && buff.remainingTurns > 0) ?? false;
}

export function heroHasStatus(hero: HeroInstance, status: UnitStatus): boolean {
  return hero.statusBuffs?.some((buff) => buff.status === status && buff.remainingTurns > 0) ?? false;
}

export function sideHasStatusTarget(side: SideState, status: UnitStatus): boolean {
  return heroHasStatus(side.hero, status) || aliveTroops(side).some((t) => troopHasStatus(t, status));
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
    const frontline = getSide(state, side).frontlineSlot;
    if (frontline && frontline.instanceId === instanceId) {
      return { side, troop: frontline, slotIndex: -1 };
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
