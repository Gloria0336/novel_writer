/**
 * 8 個 consideration 純函式。每個函式輸入 (state, prediction)，輸出 0~1。
 * 公式對齊 plan §3.1。
 */
import type { BattleState } from "../types/battle";
import type { BattleContext } from "../types/context";
import { aliveTroops, getSide } from "../selectors/battle";
import type { Prediction } from "./predict";
import type { CandidateAction, ConsiderationId, Weights } from "./types";
import { troopValue } from "./predict";

const NORM_BOARD_VALUE = 10;
const NORM_STABILITY = 10;
const MORALE_MAX = 100;

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function totalPlayerHp(state: BattleState): number {
  const heroHp = Math.max(1, state.player.hero.hp);
  const troopsHp = aliveTroops(state.player).reduce((acc, t) => acc + t.hp, 0);
  return heroHp + troopsHp;
}

function mySideTotalValue(state: BattleState): number {
  const heroHp = Math.max(1, state.enemy.hero.hp);
  const troopsVal = aliveTroops(state.enemy).reduce((acc, t) => acc + t.hp + troopValue(t), 0);
  return heroHp + troopsVal + 1;
}

function killedPlayerTroopsValue(p: Prediction): number {
  return p.killedPlayerTroops.reduce((acc, k) => acc + k.value, 0);
}

export function scoreDamageDealt(state: BattleState, p: Prediction): number {
  const dmg = p.damageToPlayerHero + p.damageToPlayerTroopsNonLethal + killedPlayerTroopsValue(p);
  return clamp01(dmg / totalPlayerHp(state));
}

export function scoreLethal(_state: BattleState, p: Prediction): number {
  return p.killsPlayerHero || p.killedPlayerTroops.length > 0 ? 1 : 0;
}

export function scoreBoardControl(_state: BattleState, p: Prediction): number {
  return clamp01(killedPlayerTroopsValue(p) / NORM_BOARD_VALUE);
}

export function scoreHeroPressure(state: BattleState, p: Prediction): number {
  const heroHp = Math.max(1, state.player.hero.hp);
  return clamp01(
    0.6 * (p.damageToPlayerHero / heroHp) +
    0.0 + // morale drain 目前沒有預測來源（v1 留 0）
    0.4 * (p.stabilityDrain / NORM_STABILITY),
  );
}

export function scoreSelfSurvival(state: BattleState, p: Prediction): number {
  const loss = p.damageToSelfHero + p.ownTroopLossValue + p.damageToOwnTroopsNonLethal;
  const lossRatio = loss / mySideTotalValue(state);
  const remainingHp = state.enemy.hero.hp - p.damageToSelfHero;
  const heroDanger = remainingHp < state.enemy.hero.maxHp * 0.3 ? 0.4 : 0;
  return clamp01(1 - lossRatio - heroDanger);
}

export function scoreResourceEfficiency(_state: BattleState, p: Prediction, action: CandidateAction): number {
  const cost = p.manaCost + p.moraleCost + p.gaugeCost;
  if (action.kind === "endTurn") return 0;
  if (action.kind === "attack" || action.kind === "deployFromPool") return 0.6; // 無耗：中性偏正
  const value =
    p.damageToPlayerHero +
    p.damageToPlayerTroopsNonLethal +
    killedPlayerTroopsValue(p) * 2 +
    (p.killsPlayerHero ? 20 : 0);
  if (cost <= 0) return 0.5;
  return clamp01(value / (value + cost * 2));
}

export function scoreGaugeBuildup(state: BattleState, ctx: BattleContext, p: Prediction): number {
  const heroDef = ctx.getHero(state.enemy.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  return clamp01(p.gaugeDelta / Math.max(1, race.gauge.max));
}

export function scoreStabilityPressure(_state: BattleState, p: Prediction): number {
  return clamp01(p.stabilityDrain / NORM_STABILITY);
}

/** 結束回合的固定 baseline（resilience 高的人格更傾向結束）。 */
export function scoreEndTurn(resilience: number): number {
  return 0.25 + 0.1 * resilience;
}

/** 統一介面：跑完 8 個 scorer。 */
export function scoreAllConsiderations(
  state: BattleState,
  ctx: BattleContext,
  action: CandidateAction,
  p: Prediction,
): Record<ConsiderationId, number> {
  return {
    damageDealt:        scoreDamageDealt(state, p),
    lethalThisAction:   scoreLethal(state, p),
    boardControl:       scoreBoardControl(state, p),
    heroPressure:       scoreHeroPressure(state, p),
    selfSurvival:       scoreSelfSurvival(state, p),
    resourceEfficiency: scoreResourceEfficiency(state, p, action),
    gaugeBuildup:       scoreGaugeBuildup(state, ctx, p),
    stabilityPressure:  scoreStabilityPressure(state, p),
  };
}

/** Σ(consider × weight)。 */
export function weightedSum(considerations: Record<ConsiderationId, number>, weights: Weights): number {
  let sum = 0;
  for (const k of Object.keys(considerations) as ConsiderationId[]) {
    sum += considerations[k] * weights[k];
  }
  return sum;
}

void getSide;
void MORALE_MAX;
