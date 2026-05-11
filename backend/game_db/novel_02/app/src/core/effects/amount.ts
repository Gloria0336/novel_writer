import type { AmountExpr } from "../types/effect";
import type { BattleState, SideState } from "../types/battle";
import { aliveTroops } from "../selectors/battle";

export function evalAmount(expr: AmountExpr, sourceSide: SideState, state: BattleState): number {
  switch (expr.kind) {
    case "const":
      return expr.value;
    case "atk":
      return sourceSide.hero.atk * (expr.mult ?? 1) + (expr.bonus ?? 0);
    case "spellsCastThisGame":
      return sourceSide.spellsCastThisGame * expr.mult;
    case "spellsCastThisTurn":
      return sourceSide.spellsCastThisTurn * expr.mult;
    case "alliesOnBoard":
      return aliveTroops(sourceSide).length * expr.mult + (expr.bonus ?? 0);
    case "rage":
      return sourceSide.hero.gaugeValue * expr.mult + (expr.bonus ?? 0);
    case "command":
      return sourceSide.hero.gaugeValue * expr.mult + (expr.bonus ?? 0);
  }
}

/**
 * 套用法師「共鳴」加成（每層 +20% 法術傷害）。
 * 由呼叫者在「來自法術卡」時帶入；此函式不知道效果來源，呼叫方需自行控制。
 */
export function applyResonanceMultiplier(amount: number, resonanceStacks: number): number {
  return Math.round(amount * (1 + resonanceStacks * 0.2));
}

/**
 * 套用狂戰士「狂暴」加成（每損失 10% HP +8% 行動卡傷害）。
 */
export function applyBerserkMultiplier(amount: number, hpPctLost: number): number {
  const stacks = Math.floor(hpPctLost / 10);
  return Math.round(amount * (1 + stacks * 0.08));
}

/**
 * 套用指揮官「號令」加成（場上每 1 兵力 +5% 行動卡傷害）。
 */
export function applyCommandMultiplier(amount: number, troopsOnBoard: number): number {
  return Math.round(amount * (1 + troopsOnBoard * 0.05));
}
