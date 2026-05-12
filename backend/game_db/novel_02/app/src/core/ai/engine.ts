/**
 * Utility AI 引擎入口：runEnemyAITurn(state, ctx, profile)
 * 取代舊 runLairAITurn — 透過不同 profile 支援 Boss / 巢穴 / 種族內戰。
 */
import type { BattleState } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { CandidateAction, ConsiderationId, DifficultyTuning, EnemyProfile, ScoredAction } from "./types";
import { enumerateActions } from "./enumerate";
import { applyAIAction } from "./applyAction";
import { predictAction } from "./predict";
import { scoreAllConsiderations, scoreEndTurn, weightedSum } from "./considerations";
import { applyRaceBias, computeWeights } from "./weights";
import { pickAction } from "./selector";
import { nextRng } from "../deck/prng";

const SAFETY_LIMIT = 30;

export interface RunOpts {
  difficulty?: DifficultyTuning;
}

export function runEnemyAITurn(state: BattleState, ctx: BattleContext, profile: EnemyProfile, opts?: RunOpts): void {
  if (state.result !== "ongoing") return;

  const weights = applyRaceBias(computeWeights(profile.personality), profile.raceBias);
  const difficulty = opts?.difficulty;

  for (let step = 0; step < SAFETY_LIMIT; step++) {
    if (state.result !== "ongoing") return;
    const candidates = enumerateActions(state, ctx, profile);
    if (candidates.length === 0) return;

    const scored: ScoredAction[] = candidates.map((a) => evaluate(state, ctx, profile, weights, a, difficulty, () => {
      const r = nextRng(state.rngState);
      state.rngState = r.state;
      return r.value;
    }));

    const sel = pickAction(scored, {
      rngState: state.rngState,
      recklessness: profile.personality.recklessness,
      tempOffset: difficulty?.tempOffset,
      noiseScale: difficulty?.noiseScale,
    });
    state.rngState = sel.rngState;

    logDecision(state, profile, sel.chosen, scored);

    if (sel.chosen.action.kind === "endTurn") return;
    const result = applyAIAction(state, ctx, sel.chosen.action);
    if (!result.ok) {
      state.log.push({ turn: state.turn, side: "enemy", kind: "AI_ACTION_FAIL", text: `AI 動作失敗：${result.reason ?? "unknown"}`, payload: { action: sel.chosen.action } });
      return;
    }
  }
}

function evaluate(
  state: BattleState,
  ctx: BattleContext,
  profile: EnemyProfile,
  weights: Record<ConsiderationId, number>,
  action: CandidateAction,
  difficulty: DifficultyTuning | undefined,
  drawRandom: () => number,
): ScoredAction {
  if (action.kind === "endTurn") {
    return {
      action,
      score: scoreEndTurn(profile.personality.resilience),
      considerations: {},
      jitter: 0,
    };
  }

  const prediction = predictAction(state, ctx, action);
  let considerations = scoreAllConsiderations(state, ctx, action, prediction);

  // easy 模式：隨機抹零一個 consideration
  if (difficulty && difficulty.considerationDropProb > 0) {
    if (drawRandom() < difficulty.considerationDropProb) {
      const ids = Object.keys(considerations) as ConsiderationId[];
      const idx = Math.floor(drawRandom() * ids.length);
      const dropId = ids[Math.min(idx, ids.length - 1)]!;
      considerations = { ...considerations, [dropId]: 0 };
    }
  }

  let score = weightedSum(considerations, weights);
  score *= gaugeGate(state, ctx, profile, action, prediction);

  return { action, score, considerations, jitter: 0 };
}

/**
 * 量表政策 gate（plan §3.2）：根據 gaugePolicy 對技能/終極技 score 乘 multiplier。
 */
function gaugeGate(
  state: BattleState,
  ctx: BattleContext,
  profile: EnemyProfile,
  action: CandidateAction,
  prediction: { killsPlayerHero: boolean; damageToPlayerHero: number },
): number {
  if (action.kind !== "skill" && action.kind !== "ultimate") return 1;

  const heroDef = ctx.getHero(state.enemy.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  const max = Math.max(1, race.gauge.max);
  const ratio = state.enemy.hero.gaugeValue / max;
  const policy = profile.gaugePolicy;

  if (action.kind === "ultimate") {
    if (prediction.killsPlayerHero) return 2.0; // 直接斬殺：強制優先
    if (!policy?.spendOnUltimateAt || ratio >= policy.spendOnUltimateAt) {
      const overHalf = state.player.hero.hp > state.player.hero.maxHp * 0.5;
      return overHalf ? 0.7 : 1.5;
    }
    return 0.3;
  }

  // skill with gauge cost
  const heroSkill = heroDef.actives.find((s) => s.id === action.skillId);
  if (heroSkill?.cost.gauge && policy?.saveUntilThreshold !== undefined && ratio < policy.saveUntilThreshold) {
    return 0.5;
  }
  return 1;
}

function logDecision(state: BattleState, profile: EnemyProfile, chosen: ScoredAction, all: ScoredAction[]): void {
  const top3 = [...all].sort((a, b) => b.score - a.score).slice(0, 3);
  state.log.push({
    turn: state.turn,
    side: "enemy",
    kind: "AI_DECISION",
    text: `${profile.id} → ${describeAction(chosen.action)}`,
    payload: {
      profileId: profile.id,
      chosen: chosen.action,
      chosenScore: chosen.score,
      top3: top3.map((s) => ({ action: s.action, score: s.score, considerations: s.considerations })),
    },
  });
}

function describeAction(a: CandidateAction): string {
  switch (a.kind) {
    case "endTurn": return "結束回合";
    case "attack": return `兵力攻擊（${a.attackerInstanceId} → ${a.target}）`;
    case "deployFromHand": return `部署手牌 ${a.cardInstanceId}`;
    case "deployFromPool": return `召喚 ${a.cardId}`;
    case "spell": return `施法 ${a.cardInstanceId}`;
    case "skill": return `主動技 ${a.skillId}`;
    case "ultimate": return `終極技 ${a.skillId}`;
  }
}
