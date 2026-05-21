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

describe("Boss 鏡像化：牌庫/手牌/魔力上限", () => {
  for (const boss of BOSS_LIST) {
    it(`${boss.id} 開戰時 enemy.deck 非空、有起手手牌、manaCap 使用種族上限`, () => {
      const state = createBattle({
        seed: 42,
        playerHeroId: "lulu",
        playerDeckIds: LULU_DECK_IDS,
        enemyId: boss.id,
        initialHand: 3,
      });
      // Boss 牌組起手 3 張已抽；玩家先手 startTurnFor 不影響敵方
      expect(state.enemy.deck.length).toBe(boss.deckIds.length - 3);
      expect(state.enemy.hand.length).toBe(3);
      // 魔力上限取種族 manaCap（demon/fey/beast 皆 10），玩家若為人類也是 10
      expect(state.enemy.manaCapAbsolute).toBe(10);
    });
  }
});
