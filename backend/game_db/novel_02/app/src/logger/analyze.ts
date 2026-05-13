import type { BattleState, LogEntry } from "../core/types/battle";
import type { EnemyProfile, ConsiderationId } from "../core/ai/types";
import type {
  SessionMeta, GameSummary, TurnSummary, AIAnalytics,
  BugIndicators, BalanceMetrics, GameLogDocument, RecordOpts,
} from "./types";

const GAME_VERSION = "0.1.0";

const PLAY_KINDS = new Set(["PLAY_TROOP", "PLAY_SPELL", "PLAY_ACTION", "PLAY_EQUIPMENT", "PLAY_FIELD"]);
const SUMMON_KINDS = new Set(["PLAY_TROOP", "AI_DEPLOY", "SUMMON"]);

// ── 元資料 ───────────────────────────────────────────────────

function buildSessionMeta(
  state: BattleState,
  profile: EnemyProfile,
  opts: RecordOpts & { durationMs?: number } = {},
): SessionMeta {
  const sessionId = opts.sessionId ?? crypto.randomUUID();
  return {
    sessionId,
    seed: state.seed,
    profileId: profile.id,
    playerHeroId: state.player.hero.defId,
    timestamp: new Date().toISOString(),
    durationMs: opts.durationMs ?? 0,
    gameVersion: GAME_VERSION,
  };
}

// ── 對戰摘要 ─────────────────────────────────────────────────

function buildGameSummary(state: BattleState): GameSummary {
  return {
    result: state.result,
    endgameReason: state.endgameReason,
    totalTurns: state.turn,
    finalPlayerHp: state.player.hero.hp,
    finalPlayerMaxHp: state.player.hero.maxHp,
    finalEnemyHp: state.enemy.hero.hp,
    finalEnemyMaxHp: state.enemy.hero.maxHp,
    finalStability: state.stability,
    finalCorruptionStage: state.corruptionStage,
  };
}

// ── 每回合摘要 ───────────────────────────────────────────────

function buildPerTurnSummary(log: LogEntry[]): TurnSummary[] {
  type Key = `${number}:${"player" | "enemy"}`;
  const map = new Map<Key, TurnSummary>();

  const getOrCreate = (turn: number, side: "player" | "enemy"): TurnSummary => {
    const k = `${turn}:${side}` as Key;
    if (!map.has(k)) {
      map.set(k, { turn, side, cardsPlayed: 0, troopsSummoned: 0, spellsCast: 0, actionCardsCast: 0, damageDealt: 0, troopsDestroyed: 0 });
    }
    return map.get(k)!;
  };

  for (const e of log) {
    const s = getOrCreate(e.turn, e.side as "player" | "enemy");

    if (PLAY_KINDS.has(e.kind)) s.cardsPlayed++;
    if (SUMMON_KINDS.has(e.kind)) s.troopsSummoned++;
    if (e.kind === "PLAY_SPELL") s.spellsCast++;
    if (e.kind === "PLAY_ACTION") s.actionCardsCast++;
    if (e.kind === "TROOP_DESTROYED") s.troopsDestroyed++;

    // 實際傷害量來自 payload.amount
    if (e.kind === "DAMAGE_HERO" || e.kind === "DAMAGE_TROOP") {
      const amount = (e.payload?.amount as number | undefined) ?? 0;
      s.damageDealt += amount;
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.turn !== b.turn ? a.turn - b.turn : (a.side === "player" ? -1 : 1),
  );
}

// ── AI 分析 ──────────────────────────────────────────────────

interface AIDecisionPayload {
  profileId: string;
  chosen: { kind: string };
  chosenScore: number;
  top3: Array<{
    action: { kind: string };
    score: number;
    considerations: Partial<Record<ConsiderationId, number>>;
  }>;
}

function buildAIAnalytics(log: LogEntry[]): AIAnalytics {
  const decisions = log.filter((e) => e.kind === "AI_DECISION");

  if (decisions.length === 0) {
    return {
      totalDecisions: 0,
      avgChosenScore: 0,
      actionTypeDistribution: {},
      avgConsiderationWeights: {},
      topConsideration: "",
    };
  }

  const dist: Record<string, number> = {};
  let scoreSum = 0;
  const considSum: Partial<Record<ConsiderationId, number>> = {};
  const considCount: Partial<Record<ConsiderationId, number>> = {};

  for (const e of decisions) {
    const p = e.payload as unknown as AIDecisionPayload;
    scoreSum += p.chosenScore;
    dist[p.chosen.kind] = (dist[p.chosen.kind] ?? 0) + 1;

    const chosen = p.top3[0];
    if (chosen) {
      for (const [k, v] of Object.entries(chosen.considerations) as [ConsiderationId, number][]) {
        considSum[k] = (considSum[k] ?? 0) + v;
        considCount[k] = (considCount[k] ?? 0) + 1;
      }
    }
  }

  const avgWeights: Partial<Record<ConsiderationId, number>> = {};
  let topKey = "";
  let topVal = -Infinity;
  for (const [k, sum] of Object.entries(considSum) as [ConsiderationId, number][]) {
    const avg = sum / (considCount[k] ?? 1);
    avgWeights[k] = avg;
    if (avg > topVal) { topVal = avg; topKey = k; }
  }

  return {
    totalDecisions: decisions.length,
    avgChosenScore: scoreSum / decisions.length,
    actionTypeDistribution: dist,
    avgConsiderationWeights: avgWeights,
    topConsideration: topKey,
  };
}

// ── Bug 指標 ─────────────────────────────────────────────────

function buildBugIndicators(log: LogEntry[]): BugIndicators {
  let aiActionFailCount = 0;
  let illegalActionAttempts = 0;
  let scriptedMissingCount = 0;

  for (const e of log) {
    if (e.kind === "AI_ACTION_FAIL") aiActionFailCount++;
    if (e.kind.endsWith("_FAIL")) illegalActionAttempts++;
    if (e.kind === "SCRIPTED_MISSING") scriptedMissingCount++;
  }

  return { aiActionFailCount, illegalActionAttempts, scriptedMissingCount };
}

// ── 平衡指標 ─────────────────────────────────────────────────

function buildBalanceMetrics(summary: GameSummary, perTurn: TurnSummary[]): BalanceMetrics {
  const totalCards = perTurn.reduce((s, t) => s + t.cardsPlayed, 0);
  const totalDamage = perTurn.reduce((s, t) => s + t.damageDealt, 0);
  const totalTurns = Math.max(1, summary.totalTurns);

  const playerTurns = perTurn.filter((t) => t.side === "player").length;
  const enemyTurns = perTurn.filter((t) => t.side === "enemy").length;

  return {
    avgCardsPlayedPerTurn: totalCards / totalTurns,
    avgDamagePerTurn: totalDamage / totalTurns,
    playerSurvivalTurns: playerTurns,
    enemySurvivalTurns: enemyTurns,
    stabilityLostTotal: 100 - summary.finalStability,
  };
}

// ── 主入口 ───────────────────────────────────────────────────

export function summarizeGame(
  state: BattleState,
  profile: EnemyProfile,
  opts: RecordOpts & { durationMs?: number } = {},
): GameLogDocument {
  const meta = buildSessionMeta(state, profile, opts);
  const summary = buildGameSummary(state);
  const perTurnSummary = buildPerTurnSummary(state.log);
  const aiAnalytics = buildAIAnalytics(state.log);
  const bugIndicators = buildBugIndicators(state.log);
  const balanceMetrics = buildBalanceMetrics(summary, perTurnSummary);

  return {
    schemaVersion: 1,
    meta,
    summary,
    perTurnSummary,
    aiAnalytics,
    bugIndicators,
    balanceMetrics,
    rawLog: state.log,
  };
}
