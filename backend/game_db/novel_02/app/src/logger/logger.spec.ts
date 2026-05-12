import { beforeAll, describe, expect, it } from "vitest";
import { createBattle, createBattleContext, endPlayerTurnAndRunAI, ensureScriptedRegistered } from "../game/seed";
import { LULU_DECK_IDS } from "../data/decks/starter";
import { PUTREFACTIVE_LAIR_PROFILE } from "../core/ai/profiles";
import { summarizeGame, recordGame } from "./index";
import type { BattleState } from "../core/types/battle";

beforeAll(() => ensureScriptedRegistered());

function runGame(seed = 42, turns = 6): BattleState {
  const s = createBattle({ seed, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
  const ctx = createBattleContext();
  for (let i = 0; i < turns; i++) {
    endPlayerTurnAndRunAI(s, ctx);
    if (s.result !== "ongoing") break;
  }
  return s;
}

describe("GameLogger — summarizeGame", () => {
  it("schemaVersion 為 1", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.schemaVersion).toBe(1);
  });

  it("meta 包含正確的 seed 與 profileId", () => {
    const doc = summarizeGame(runGame(42), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.meta.seed).toBe(42);
    expect(doc.meta.profileId).toBe("lair_putrefactive");
    expect(doc.meta.playerHeroId).toBe("lulu");
  });

  it("summary.totalTurns 符合 state.turn", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.summary.totalTurns).toBe(s.turn);
  });

  it("summary 最終 HP 符合 state", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.summary.finalPlayerHp).toBe(s.player.hero.hp);
    expect(doc.summary.finalEnemyHp).toBe(s.enemy.hero.hp);
  });

  it("summary 穩定度與腐化階段符合 state", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.summary.finalStability).toBe(s.stability);
    expect(doc.summary.finalCorruptionStage).toBe(s.corruptionStage);
  });

  it("perTurnSummary 有至少一筆 entry", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.perTurnSummary.length).toBeGreaterThan(0);
  });

  it("perTurnSummary 依 turn 遞增排序", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    const turns = doc.perTurnSummary.map((t) => t.turn);
    for (let i = 1; i < turns.length; i++) {
      expect(turns[i]).toBeGreaterThanOrEqual(turns[i - 1]!);
    }
  });

  it("AI 行動後 totalDecisions > 0", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.aiAnalytics.totalDecisions).toBeGreaterThan(0);
  });

  it("巢穴 profile 的 actionTypeDistribution 包含 deployFromPool", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect((doc.aiAnalytics.actionTypeDistribution["deployFromPool"] ?? 0)).toBeGreaterThan(0);
  });

  it("avgChosenScore 為正數", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.aiAnalytics.avgChosenScore).toBeGreaterThan(0);
  });

  it("正常執行下 aiActionFailCount 為 0", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.bugIndicators.aiActionFailCount).toBe(0);
  });

  it("rawLog 與 state.log 為同一個參考（不複製）", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.rawLog).toBe(s.log);
  });

  it("balanceMetrics.stabilityLostTotal = 100 - finalStability", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.balanceMetrics.stabilityLostTotal).toBe(100 - s.stability);
  });

  it("recordGame 在 Node.js 環境下寫入 JSON 檔案", async () => {
    const { readdir, rm } = await import("node:fs/promises");
    const tmpDir = "logs_test_tmp";
    const s = runGame();
    await recordGame(s, PUTREFACTIVE_LAIR_PROFILE, { logDir: tmpDir });
    const files = await readdir(tmpDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/\.json$/);
    await rm(tmpDir, { recursive: true });
  });
});
