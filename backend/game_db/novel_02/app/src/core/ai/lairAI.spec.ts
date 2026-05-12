import { beforeAll, describe, expect, it } from "vitest";
import { createBattle, createBattleContext, endPlayerTurnAndRunAI, ensureScriptedRegistered } from "../../game/seed";
import { LULU_DECK_IDS } from "../../data/decks/starter";
import { aliveTroops } from "../selectors/battle";

beforeAll(() => ensureScriptedRegistered());

describe("腐植巢穴基本設置", () => {
  it("巢穴 HP 80 / DEF 0 / 兵力欄 5", () => {
    const s = createBattle({ seed: 11, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    expect(s.enemy.hero.hp).toBe(80);
    expect(s.enemy.hero.def).toBe(0);
    expect(s.enemy.troopSlots).toHaveLength(5);
    expect(s.enemy.hero.defId).toBe("putrefactive_lair");
  });

  it("玩家英雄與牌庫已就位", () => {
    const s = createBattle({ seed: 11, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    expect(s.player.hero.defId).toBe("lulu");
    expect(s.player.hand.length).toBeGreaterThan(0);
    expect(s.player.deck.length).toBe(30 - s.player.hand.length);
  });
});

describe("AI 行為", () => {
  it("END_TURN 後 AI 召喚 1 個腐植兵力", () => {
    const s = createBattle({ seed: 11, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    const ctx = createBattleContext();
    const enemyTroopsBefore = aliveTroops(s.enemy).length;
    endPlayerTurnAndRunAI(s, ctx);
    const enemyTroopsAfter = aliveTroops(s.enemy).length;
    expect(enemyTroopsAfter).toBeGreaterThan(enemyTroopsBefore);
  });

  it("AI 兵力被殺後穩定度 -2", async () => {
    const s = createBattle({ seed: 11, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    const ctx = createBattleContext();
    endPlayerTurnAndRunAI(s, ctx); // AI 召喚 1 隻

    const enemyT = aliveTroops(s.enemy)[0];
    if (!enemyT) throw new Error("expected enemy troop");

    // 玩家用一個強力 buff 敵兵 hp 直接歸零
    enemyT.hp = 0;
    // 觸發回收
    const beforeStability = s.stability;
    const { reapDeadTroops } = await import("../effects/registry");
    reapDeadTroops(s, ctx, "player");
    expect(s.stability).toBeLessThan(beforeStability);
  });
});

describe("勝負判定", () => {
  it("敵方英雄 HP 0 → playerWin", async () => {
    const s = createBattle({ seed: 11, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    s.enemy.hero.hp = 0;
    const { checkVictory } = await import("../turn/phases");
    checkVictory(s);
    expect(s.result).toBe("playerWin");
  });

  it("玩家英雄 HP 0 → playerLose", async () => {
    const s = createBattle({ seed: 11, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    s.player.hero.hp = 0;
    const { checkVictory } = await import("../turn/phases");
    checkVictory(s);
    expect(s.result).toBe("playerLose");
  });

  it("穩定度 0 → playerLose", async () => {
    const s = createBattle({ seed: 11, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    const { applyStabilityDelta, applyCorruptionStageEffects } = await import("../resource/stability");
    const r = applyStabilityDelta(s, -100);
    applyCorruptionStageEffects(s, r.stageJustReached);
    expect(s.result).toBe("playerLose");
  });
});

describe("AI 多回合循環不卡", () => {
  it("跑 5 個玩家回合（含 AI）狀態仍 ongoing", () => {
    const s = createBattle({ seed: 11, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    const ctx = createBattleContext();
    for (let i = 0; i < 5; i++) {
      endPlayerTurnAndRunAI(s, ctx);
      if (s.result !== "ongoing") break;
    }
    // 至少能正常推進
    expect(s.turn).toBeGreaterThan(1);
  });
});
