import type { BattleState, TroopInstance, LogEntry } from "../types/battle";
import type { Side } from "../types/effect";
import { aliveTroops, getSide, hasGuardTroop, otherSide } from "../selectors/battle";
import { applyHeroDamage, applyTroopDamage } from "./damage";

export interface TroopAttackResult {
  attackerKilled: boolean;
  defenderKilled: boolean;
  attackerDamage: number;
  defenderDamage: number;
  log: Pick<LogEntry, "kind" | "text" | "payload">[];
}

/**
 * 兵力攻擊兵力（雙方互相造傷）。
 * 兵力優先制：呼叫者必須先檢查合法性。
 */
export function troopVsTroop(attacker: TroopInstance, defender: TroopInstance): TroopAttackResult {
  const log: Pick<LogEntry, "kind" | "text" | "payload">[] = [];

  // 互相造傷（穿透由 keyword 決定）
  const aPierce = attacker.keywords.has("pierce");
  const dPierce = defender.keywords.has("pierce");

  const dmgToDefender = applyTroopDamage(defender, attacker.atk, { ignoreDef: aPierce });
  const dmgToAttacker = applyTroopDamage(attacker, defender.atk, { ignoreDef: dPierce });

  const aLethal = attacker.keywords.has("lethal");
  const dLethal = defender.keywords.has("lethal");

  const defenderKilled = dmgToDefender.killed || (aLethal && dmgToDefender.finalAmount > 0);
  const attackerKilled = dmgToAttacker.killed || (dLethal && dmgToAttacker.finalAmount > 0);
  if (defenderKilled) defender.hp = 0;
  if (attackerKilled) attacker.hp = 0;

  log.push({
    kind: "TROOP_VS_TROOP",
    text: `${attacker.cardId} 攻擊 ${defender.cardId}`,
    payload: {
      attackerInstanceId: attacker.instanceId,
      defenderInstanceId: defender.instanceId,
      damageToDefender: dmgToDefender.finalAmount,
      damageToAttacker: dmgToAttacker.finalAmount,
      defenderKilled,
      attackerKilled,
    },
  });

  attacker.hasAttackedThisTurn = true;

  return {
    attackerKilled,
    defenderKilled,
    attackerDamage: dmgToAttacker.finalAmount,
    defenderDamage: dmgToDefender.finalAmount,
    log,
  };
}

/**
 * 兵力攻擊敵方英雄（必須無敵方兵力時或對方有特定情況）。
 * 注意：穿透通常代表「無視兵力優先制」（此規則由卡牌效果聲明，不在這層處理）。
 */
export function troopVsHero(state: BattleState, attacker: TroopInstance, attackingSide: Side): TroopAttackResult {
  const log: Pick<LogEntry, "kind" | "text" | "payload">[] = [];
  const enemyHero = getSide(state, otherSide(attackingSide)).hero;
  const dmg = applyHeroDamage(enemyHero, attacker.atk, { ignoreDef: attacker.keywords.has("pierce") });

  log.push({
    kind: "TROOP_VS_HERO",
    text: `${attacker.cardId} 攻擊敵方英雄`,
    payload: {
      attackerInstanceId: attacker.instanceId,
      damage: dmg.finalAmount,
      heroKilled: dmg.killed,
    },
  });

  attacker.hasAttackedThisTurn = true;
  return { attackerKilled: false, defenderKilled: dmg.killed, attackerDamage: 0, defenderDamage: dmg.finalAmount, log };
}

/**
 * 雙軌規則 — 兵力攻擊合法性檢查。
 * 兵力優先：有敵方兵力時，兵力只能攻擊兵力。
 * 暈眩：當回合部署的兵力不能攻擊（除非有突進/疾走）。
 * 凍結：不能攻擊。
 */
export function canTroopAttack(state: BattleState, attackerSide: Side, attacker: TroopInstance, target: TroopInstance | "hero"): { ok: true } | { ok: false; reason: string } {
  if (attacker.hp <= 0) return { ok: false, reason: "attacker destroyed" };
  if (attacker.frozenTurns > 0) return { ok: false, reason: "frozen" };
  if (attacker.hasAttackedThisTurn) return { ok: false, reason: "already attacked" };

  // 暈眩規則
  if (attacker.summonedThisTurn) {
    const hasRush = attacker.keywords.has("rush");
    const hasHaste = attacker.keywords.has("haste");
    if (target === "hero" && !hasHaste) return { ok: false, reason: "summoning sickness (hero)" };
    if (target !== "hero" && !hasRush && !hasHaste) return { ok: false, reason: "summoning sickness (troop)" };
  }

  const enemySide = getSide(state, otherSide(attackerSide));
  const enemyTroops = aliveTroops(enemySide);

  // 兵力優先：有敵方兵力時不能打臉（攻城關鍵字無視此限制）
  if (target === "hero" && enemyTroops.length > 0 && !attacker.keywords.has("siege")) {
    return { ok: false, reason: "troop priority: enemy troops alive" };
  }

  // 威壓：不可被敵方兵力選為目標
  if (target !== "hero" && target.keywords.has("menace")) {
    return { ok: false, reason: "menace: cannot be targeted by troops" };
  }

  return { ok: true };
}

/**
 * 雙軌規則 — 英雄行動卡/技能攻擊合法性檢查。
 * 守護優先：有守護兵力時，行動卡只能打守護。
 */
export function canActionTarget(state: BattleState, attackerSide: Side, target: TroopInstance | "hero", ignoreGuard = false): { ok: true } | { ok: false; reason: string } {
  const enemySide = getSide(state, otherSide(attackerSide));
  if (!ignoreGuard && hasGuardTroop(enemySide)) {
    if (target === "hero") return { ok: false, reason: "guard priority: must hit guard troop" };
    if (!target.keywords.has("guard")) return { ok: false, reason: "guard priority: must hit guard troop" };
  }
  return { ok: true };
}
