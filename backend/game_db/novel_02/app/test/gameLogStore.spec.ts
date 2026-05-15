import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { createGameLogStore } from "../electron/main/gameLogStore";
import { createBattle, ensureScriptedRegistered } from "../src/game/seed";
import { LULU_DECK_IDS } from "../src/data/decks/starter";
import { PUTREFACTIVE_LAIR_PROFILE } from "../src/core/ai/profiles";
import { summarizeGame } from "../src/logger";
import type { GameLogDocument } from "../src/logger/types";

const logDir = join(process.cwd(), "logs_store_test_tmp");

function makeDoc(sessionId: string, logText = "initial"): GameLogDocument {
  ensureScriptedRegistered();
  const state = createBattle({ seed: 123, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
  state.log.push({ turn: state.turn, side: "player", kind: "TEST", text: logText });
  return summarizeGame(state, PUTREFACTIVE_LAIR_PROFILE, {
    sessionId,
    startedAt: "2026-01-01T00:00:00.000Z",
  });
}

async function readOnlyLog(): Promise<GameLogDocument> {
  const files = await readdir(logDir);
  expect(files).toHaveLength(1);
  const raw = await readFile(join(logDir, files[0]!), "utf-8");
  return JSON.parse(raw) as GameLogDocument;
}

describe("gameLogStore", () => {
  beforeEach(async () => {
    await rm(logDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    await rm(logDir, { recursive: true, force: true });
  });

  it("overwrites the same file for updates to the same session", async () => {
    const store = createGameLogStore(logDir);

    const first = store.start(makeDoc("same-session", "first"));
    const second = store.update(makeDoc("same-session", "second"));
    const saved = await readOnlyLog();

    expect(second.filePath).toBe(first.filePath);
    expect(saved.rawLog.at(-1)?.text).toBe("second");
  });

  it("finishes an active session as abandoned without changing summary.result", async () => {
    const store = createGameLogStore(logDir);
    store.start(makeDoc("abandoned-session"));

    const result = store.finish("abandoned-session", "abandoned", "window closed");
    const saved = await readOnlyLog();

    expect(result).not.toBeNull();
    expect(store.activeCount()).toBe(0);
    expect(saved.recording.status).toBe("abandoned");
    expect(saved.recording.endReason).toBe("window closed");
    expect(saved.summary.result).toBe("ongoing");
  });

  it("abandons all active sessions during shutdown", async () => {
    const store = createGameLogStore(logDir);
    store.start(makeDoc("shutdown-session"));

    const results = store.abandonAll("app before-quit");
    const saved = await readOnlyLog();

    expect(results).toHaveLength(1);
    expect(store.activeCount()).toBe(0);
    expect(saved.recording.status).toBe("abandoned");
    expect(saved.recording.endReason).toBe("app before-quit");
  });
});
