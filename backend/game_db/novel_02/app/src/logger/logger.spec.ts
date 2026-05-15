import { beforeAll, describe, expect, it } from "vitest";
import { readFile, readdir, rm } from "node:fs/promises";
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

describe("GameLogger summarizeGame", () => {
  it("uses schemaVersion 1", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.schemaVersion).toBe(1);
  });

  it("includes seed, profileId, and playerHeroId in meta", () => {
    const doc = summarizeGame(runGame(42), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.meta.seed).toBe(42);
    expect(doc.meta.profileId).toBe("lair_putrefactive");
    expect(doc.meta.playerHeroId).toBe("lulu");
  });

  it("defaults recording metadata to ongoing", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.recording.status).toBe("ongoing");
    expect(doc.recording.startedAt).toEqual(expect.any(String));
    expect(doc.recording.lastSavedAt).toEqual(expect.any(String));
    expect(doc.recording.endedAt).toBeUndefined();
  });

  it("can mark an unfinished battle as abandoned without changing summary.result", () => {
    const state = createBattle({ seed: 77, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    const doc = summarizeGame(state, PUTREFACTIVE_LAIR_PROFILE, {
      recordingStatus: "abandoned",
      endedAt: "2026-01-01T00:00:00.000Z",
      endReason: "battle view unmounted",
    });

    expect(doc.summary.result).toBe("ongoing");
    expect(doc.recording.status).toBe("abandoned");
    expect(doc.recording.endReason).toBe("battle view unmounted");
  });

  it("sets summary.totalTurns from state.turn", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.summary.totalTurns).toBe(s.turn);
  });

  it("sets final HP from state", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.summary.finalPlayerHp).toBe(s.player.hero.hp);
    expect(doc.summary.finalEnemyHp).toBe(s.enemy.hero.hp);
  });

  it("sets stability and corruption stage from state", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.summary.finalStability).toBe(s.stability);
    expect(doc.summary.finalCorruptionStage).toBe(s.corruptionStage);
  });

  it("builds per-turn summary entries", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.perTurnSummary.length).toBeGreaterThan(0);
  });

  it("sorts per-turn summary by turn", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    const turns = doc.perTurnSummary.map((t) => t.turn);
    for (let i = 1; i < turns.length; i++) {
      expect(turns[i]).toBeGreaterThanOrEqual(turns[i - 1]!);
    }
  });

  it("counts AI decisions", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.aiAnalytics.totalDecisions).toBeGreaterThan(0);
  });

  it("includes deployFromPool in actionTypeDistribution", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect((doc.aiAnalytics.actionTypeDistribution["deployFromPool"] ?? 0)).toBeGreaterThan(0);
  });

  it("avgChosenScore is greater than 0", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.aiAnalytics.avgChosenScore).toBeGreaterThan(0);
  });

  it("has no AI action failures in the baseline game", () => {
    const doc = summarizeGame(runGame(), PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.bugIndicators.aiActionFailCount).toBe(0);
  });

  it("keeps rawLog as the same state.log reference", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.rawLog).toBe(s.log);
  });

  it("computes stabilityLostTotal from final stability", () => {
    const s = runGame();
    const doc = summarizeGame(s, PUTREFACTIVE_LAIR_PROFILE);
    expect(doc.balanceMetrics.stabilityLostTotal).toBe(100 - s.stability);
  });

  it("recordGame writes a JSON file in Node.js", async () => {
    const tmpDir = "logs_test_tmp";
    const s = runGame();

    await recordGame(s, PUTREFACTIVE_LAIR_PROFILE, { logDir: tmpDir });
    const files = await readdir(tmpDir);
    const raw = await readFile(`${tmpDir}/${files[0]}`, "utf-8");
    const parsed = JSON.parse(raw) as ReturnType<typeof summarizeGame>;

    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/\.json$/);
    expect(parsed.recording.status).toBe("ongoing");

    await rm(tmpDir, { recursive: true });
  });
});
