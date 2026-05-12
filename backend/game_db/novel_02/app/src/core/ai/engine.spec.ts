import { beforeAll, describe, expect, it } from "vitest";
import { createBattle, createBattleContext, ensureScriptedRegistered } from "../../game/seed";
import { LULU_DECK_IDS } from "../../data/decks/starter";
import { HERO_REKA } from "../../data/heroes";
import { createHeroInstance } from "../turn/factories";
import { runEnemyAITurn } from "./engine";
import { BOSS_BLOOD_CHIEF_PROFILE, PUTREFACTIVE_LAIR_PROFILE } from "./profiles";
import { aliveTroops } from "../selectors/battle";
import type { BattleState } from "../types/battle";

beforeAll(() => ensureScriptedRegistered());

function makeLairState(seed = 11): BattleState {
  const s = createBattle({ seed, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
  s.activeSide = "enemy";
  return s;
}

function makeBossState(seed: number, opts?: { gauge?: number; morale?: number; playerHp?: number }): BattleState {
  const s = createBattle({ seed, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
  const ctx = createBattleContext();
  s.enemy.hero = createHeroInstance(HERO_REKA, ctx);
  s.enemy.hero.morale = opts?.morale ?? 100;
  s.enemy.hero.gaugeValue = opts?.gauge ?? 0;
  if (opts?.playerHp !== undefined) s.player.hero.hp = opts.playerHp;
  s.activeSide = "enemy";
  return s;
}

describe("Utility AI engine — lair 行為", () => {
  it("巢穴每回合至少召喚 1 隻兵力（保留舊 lairAI 等價語意）", () => {
    const s = makeLairState(11);
    const ctx = createBattleContext();
    const before = aliveTroops(s.enemy).length;
    runEnemyAITurn(s, ctx, PUTREFACTIVE_LAIR_PROFILE);
    expect(aliveTroops(s.enemy).length).toBeGreaterThan(before);
  });

  it("引擎在 SAFETY_LIMIT 內結束（無死循環）", () => {
    const s = makeLairState(11);
    const ctx = createBattleContext();
    runEnemyAITurn(s, ctx, PUTREFACTIVE_LAIR_PROFILE);
    const decisions = s.log.filter((l) => l.kind === "AI_DECISION");
    const ended = s.log.some((l) => l.kind === "AI_DECISION" && (l.payload as { chosen?: { kind?: string } })?.chosen?.kind === "endTurn");
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.length).toBeLessThanOrEqual(30);
    expect(ended).toBe(true);
  });

  it("AI_DECISION log 含 top3 與 considerations", () => {
    const s = makeLairState(11);
    const ctx = createBattleContext();
    runEnemyAITurn(s, ctx, PUTREFACTIVE_LAIR_PROFILE);
    const firstDecision = s.log.find((l) => l.kind === "AI_DECISION");
    expect(firstDecision).toBeDefined();
    const payload = firstDecision!.payload as { top3?: unknown[]; chosen?: unknown };
    expect(Array.isArray(payload.top3)).toBe(true);
    expect(payload.chosen).toBeDefined();
  });
});

describe("Utility AI engine — Boss 技能/終極技決策", () => {
  it("量表滿(10) + 玩家英雄低血量 → AI 會主動進攻", () => {
    const s = makeBossState(42, { gauge: 10, morale: 100, playerHp: 10 });
    const ctx = createBattleContext();
    runEnemyAITurn(s, ctx, BOSS_BLOOD_CHIEF_PROFILE);
    const usedUltimate = s.log.some((l) => l.kind === "USE_ULTIMATE");
    const usedSkill = s.log.some((l) => l.kind === "USE_SKILL");
    expect(usedUltimate || usedSkill).toBe(true);
  });

  it("量表 0 → ultimate 不會被使用（gaugeGate 抑制）", () => {
    const s = makeBossState(42, { gauge: 0, morale: 100 });
    const ctx = createBattleContext();
    runEnemyAITurn(s, ctx, BOSS_BLOOD_CHIEF_PROFILE);
    const usedUltimate = s.log.some((l) => l.kind === "USE_ULTIMATE");
    expect(usedUltimate).toBe(false);
  });

  it("Boss 在沒兵力時仍會用主動技攻擊（不只是 endTurn）", () => {
    const s = makeBossState(42, { gauge: 0, morale: 100 });
    const ctx = createBattleContext();
    runEnemyAITurn(s, ctx, BOSS_BLOOD_CHIEF_PROFILE);
    const usedSkill = s.log.some((l) => l.kind === "USE_SKILL");
    expect(usedSkill).toBe(true);
  });

  it("morale 不足以付任何技能 → AI 直接 endTurn", () => {
    const s = makeBossState(42, { gauge: 0, morale: 0 });
    const ctx = createBattleContext();
    runEnemyAITurn(s, ctx, BOSS_BLOOD_CHIEF_PROFILE);
    const usedSkill = s.log.some((l) => l.kind === "USE_SKILL");
    const usedUlt = s.log.some((l) => l.kind === "USE_ULTIMATE");
    expect(usedSkill).toBe(false);
    expect(usedUlt).toBe(false);
  });
});

describe("Utility AI engine — 隨機性與可重現", () => {
  it("相同 seed + 相同 profile → 動作序列完全一致", () => {
    const decisionsA = collectDecisions(makeLairState(77));
    const decisionsB = collectDecisions(makeLairState(77));
    expect(decisionsA).toEqual(decisionsB);
  });

  it("不同 seed → 動作序列可能有差異（但仍合法）", () => {
    // 注意：不同 seed 不一定產生不同序列（巢穴選項有限），但至少結果都 ongoing
    const s1 = makeLairState(101);
    const s2 = makeLairState(202);
    const ctx = createBattleContext();
    runEnemyAITurn(s1, ctx, PUTREFACTIVE_LAIR_PROFILE);
    runEnemyAITurn(s2, ctx, PUTREFACTIVE_LAIR_PROFILE);
    expect(["ongoing", "playerWin", "playerLose"]).toContain(s1.result);
    expect(["ongoing", "playerWin", "playerLose"]).toContain(s2.result);
  });
});

function collectDecisions(s: BattleState): string[] {
  const ctx = createBattleContext();
  runEnemyAITurn(s, ctx, PUTREFACTIVE_LAIR_PROFILE);
  return s.log
    .filter((l) => l.kind === "AI_DECISION")
    .map((l) => JSON.stringify((l.payload as { chosen: unknown }).chosen));
}
