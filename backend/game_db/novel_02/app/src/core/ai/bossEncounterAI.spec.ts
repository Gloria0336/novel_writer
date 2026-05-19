import { beforeAll, describe, expect, it } from "vitest";
import { BOSS_LIST } from "../../data/enemies/bosses";
import { LULU_DECK_IDS } from "../../data/decks/starter";
import { createBattle, createBattleContext, endPlayerTurnAndRunAI, ensureScriptedRegistered } from "../../game/seed";

const ACTIVE_AI_LOG_KINDS = new Set([
  "AI_DEPLOY",
  "PLAY_TROOP",
  "PLAY_DEVICE",
  "PLAY_SPELL",
  "USE_SKILL",
  "USE_ULTIMATE",
  "ATTACK_HERO",
  "ATTACK_TROOP",
]);

beforeAll(() => ensureScriptedRegistered());

describe("Boss encounter AI", () => {
  for (const boss of BOSS_LIST) {
    it(`${boss.id} takes an active AI action after player end turn`, () => {
      const state = createBattle({
        seed: 11,
        playerHeroId: "lulu",
        playerDeckIds: LULU_DECK_IDS,
        enemyId: boss.id,
      });
      const ctx = createBattleContext();

      const logStart = state.log.length;
      endPlayerTurnAndRunAI(state, ctx);
      const newLogs = state.log.slice(logStart);

      expect(newLogs.some((log) => log.kind === "AI_DECISION")).toBe(true);
      expect(newLogs.some((log) => ACTIVE_AI_LOG_KINDS.has(log.kind))).toBe(true);
      expect(state.enemy.manaCap).toBeGreaterThan(0);
      expect(state.activeSide).toBe("player");
    });
  }
});
