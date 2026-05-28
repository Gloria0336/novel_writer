import type { BattleState, TroopInstance, LogEntry } from "../types/battle";
import type { Side } from "../types/effect";
import type { BattleContext } from "../types/context";
import { aliveTroops, findTroopBySide, getSide, hasGuardTroop, heroHasStatus, otherSide, sideHasStatusTarget, troopHasStatus } from "../selectors/battle";
import { getGaugeScalingHeroDamageTakenMultiplier, getGaugeScalingTroopDamageMultiplier } from "../resource/gaugeScalingBuff";
import { getTurnFlags } from "../turn/turnFlags";
import { applyHeroDamageWithPassives, applyTroopDamageWithPassives } from "../effects/battlePassives";
import { applyLifesteal } from "./damage";

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
export function troopVsTroop(state: BattleState, ctx: BattleContext, attacker: TroopInstance, attackerSide: Side, defender: TroopInstance, defenderSide: Side): TroopAttackResult {
  const log: Pick<LogEntry, "kind" | "text" | "payload">[] = [];

  // 互相造傷（穿透由 keyword 決定）
  const aPierce = attacker.keywords.has("pierce");
  const dPierce = defender.keywords.has("pierce");

  const attackerDamage = Math.round(attacker.atk * consumeFirstAttackMultiplier(state, attacker) * getGaugeScalingTroopDamageMultiplier(state, ctx, attackerSide));
  const defenderCountered = consumeTroopCounterattack(state, defender);
  const defenderDamage = defenderCountered ? Math.round(defender.atk * getGaugeScalingTroopDamageMultiplier(state, ctx, defenderSide)) : 0;
  const dmgToDefender = applyTroopDamageWithPassives(state, ctx, defenderSide, defender, attackerDamage, { ignoreDef: aPierce, sourceKind: "troop" });
  const dmgToAttacker = defenderCountered
    ? applyTroopDamageWithPassives(state, ctx, attackerSide, attacker, defenderDamage, { ignoreDef: dPierce, sourceKind: "troop" })
    : { finalAmount: 0, killed: false };

  const aLethal = attacker.keywords.has("lethal");
  const dLethal = defender.keywords.has("lethal");

  const defenderKilled = dmgToDefender.killed || (aLethal && dmgToDefender.finalAmount > 0);
  const attackerKilled = dmgToAttacker.killed || (dLethal && dmgToAttacker.finalAmount > 0);
  if (attacker.keywords.has("lifesteal")) applyLifesteal(state, attackerSide, dmgToDefender.finalAmount, 100);
  if (defenderCountered && defender.keywords.has("lifesteal")) applyLifesteal(state, defenderSide, dmgToAttacker.finalAmount, 100);
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
      defenderCountered,
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
export function troopVsHero(state: BattleState, ctx: BattleContext, attacker: TroopInstance, attackingSide: Side): TroopAttackResult {
  const log: Pick<LogEntry, "kind" | "text" | "payload">[] = [];
  const defendingSide = otherSide(attackingSide);
  const amount = Math.round(attacker.atk * consumeFirstAttackMultiplier(state, attacker) * getGaugeScalingTroopDamageMultiplier(state, ctx, attackingSide));
  const dmg = applyHeroDamageWithPassives(state, ctx, attackingSide, defendingSide, amount, {
    ignoreDef: attacker.keywords.has("pierce"),
    finalMultiplier: getGaugeScalingHeroDamageTakenMultiplier(state, ctx, defendingSide),
    sourceKind: "troop",
  });
  if (attacker.keywords.has("lifesteal")) applyLifesteal(state, attackingSide, dmg.finalAmount, 100);

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

function consumeFirstAttackMultiplier(state: BattleState, attacker: TroopInstance): number {
  const flags = getTurnFlags(state);
  if (!flags.firstAttackDoubleInstanceIds.has(attacker.instanceId)) return 1;
  flags.firstAttackDoubleInstanceIds.delete(attacker.instanceId);
  return 2;
}

export function hasTroopCounteredThisTurn(state: BattleState, troop: TroopInstance): boolean {
  return getTurnFlags(state).troopCounteredThisTurnInstanceIds.has(troop.instanceId);
}

function consumeTroopCounterattack(state: BattleState, defender: TroopInstance): boolean {
  const flags = getTurnFlags(state);
  if (flags.troopCounteredThisTurnInstanceIds.has(defender.instanceId)) return false;
  flags.troopCounteredThisTurnInstanceIds.add(defender.instanceId);
  return true;
}

/**
 * 雙軌規則 — 兵力攻擊合法性檢查。
 * 兵力優先：有敵方兵力時，兵力只能攻擊兵力。
 * 暈眩：當回合部署的兵力不能攻擊（除非有突進/疾走）。
 * 凍結：不能攻擊。
 */
export function canTroopAttack(state: BattleState, attackerSide: Side, attacker: TroopInstance, target: TroopInstance | "hero"): { ok: true } | { ok: false; reason: string } {
  if (attacker.hp <= 0) return { ok: false, reason: "attacker destroyed" };
  if (attacker.isPhantom) return { ok: false, reason: "phantom cannot attack" };
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
  const targetSide = target === "hero" ? otherSide(attackerSide) : findTroopBySide(state, target.instanceId)?.side ?? otherSide(attackerSide);

  if (targetSide !== attackerSide && targetHasStatus(state, targetSide, target, "untargetable")) {
    return { ok: false, reason: "untargetable: cannot be selected" };
  }

  if (targetSide !== attackerSide && sideHasStatusTarget(getSide(state, targetSide), "taunt") && !targetHasStatus(state, targetSide, target, "taunt")) {
    return { ok: false, reason: "taunt priority: must hit taunt target" };
  }

  const tauntTarget = targetSide !== attackerSide && targetHasStatus(state, targetSide, target, "taunt");
  const markedTarget = targetSide !== attackerSide && targetHasStatus(state, targetSide, target, "marked");
  const priorityTarget = tauntTarget || markedTarget;

  // 兵力優先：有敵方兵力時不能打臉（攻城關鍵字無視此限制）
  if (!priorityTarget && target === "hero" && enemyTroops.length > 0 && !attacker.keywords.has("siege")) {
    return { ok: false, reason: "troop priority: enemy troops alive" };
  }

  // 威壓：不可被敵方兵力選為目標
  if (!priorityTarget && target !== "hero" && target.keywords.has("menace")) {
    return { ok: false, reason: "menace: cannot be targeted by troops" };
  }

  return { ok: true };
}

/**
 * 雙軌規則 — 英雄行動卡/技能攻擊合法性檢查。
 * 守護優先：有守護兵力時，行動卡只能打守護。
 */
export function canActionTarget(state: BattleState, attackerSide: Side, target: TroopInstance | "hero", ignoreGuard = false): { ok: true } | { ok: false; reason: string } {
  const targetSide = target === "hero" ? otherSide(attackerSide) : findTroopBySide(state, target.instanceId)?.side ?? otherSide(attackerSide);
  if (targetSide === attackerSide) return { ok: true };

  const enemySide = getSide(state, targetSide);
  if (targetHasStatus(state, targetSide, target, "untargetable")) {
    return { ok: false, reason: "untargetable: cannot be selected" };
  }
  if (sideHasStatusTarget(enemySide, "taunt") && !targetHasStatus(state, targetSide, target, "taunt")) {
    return { ok: false, reason: "taunt priority: must hit taunt target" };
  }
  if (targetHasStatus(state, targetSide, target, "taunt")) {
    return { ok: true };
  }
  if (targetHasStatus(state, targetSide, target, "marked")) {
    return { ok: true };
  }
  if (!ignoreGuard && hasGuardTroop(enemySide)) {
    if (target === "hero") return { ok: false, reason: "guard priority: must hit guard troop" };
    if (!target.keywords.has("guard")) return { ok: false, reason: "guard priority: must hit guard troop" };
  }
  return { ok: true };
}

function targetHasStatus(state: BattleState, targetSide: Side, target: TroopInstance | "hero", status: "taunt" | "marked" | "untargetable"): boolean {
  if (target === "hero") return heroHasStatus(getSide(state, targetSide).hero, status);
  return troopHasStatus(target, status);
}
