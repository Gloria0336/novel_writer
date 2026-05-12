import { beforeAll, describe, expect, it } from "vitest";
import { applyPlayerAction, createBattle, createBattleContext, ensureScriptedRegistered } from "../../src/game/seed";
import { LULU_DECK_IDS } from "../../src/data/decks/starter";
import { aliveTroops, freeSlotIndex } from "../../src/core/selectors/battle";
import { getCard } from "../../src/data/cards";
import { checkVictory } from "../../src/core/turn/phases";
import { createTroopInstance } from "../../src/core/turn/factories";
import { executeEffects } from "../../src/core/effects/registry";

beforeAll(() => ensureScriptedRegistered());

/**
 * 露露 vs 腐植巢穴 — 端到端規則戰鬥
 *
 * 驗證項：
 * 1. 戰鬥能正確初始化
 * 2. 玩家能部署兵力、結束回合、AI 接續
 * 3. 軍令量表能因部署兵力而累積
 * 4. 勝負系統能在巢穴 HP 0 時觸發 playerWin
 */
describe("E2E：露露 vs 腐植巢穴", () => {
  it("能完成多回合戰鬥（部署兵力 → AI 接續 → 軍令量表累積）", () => {
    const s = createBattle({ seed: 42, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    const ctx = createBattleContext();

    expect(s.player.hero.defId).toBe("lulu");
    expect(s.enemy.hero.defId).toBe("putrefactive_lair");
    expect(s.player.hand.length).toBeGreaterThan(0);

    // 嘗試部署任何手牌中的兵力（無視費用，先驗證流程）
    let deployed = 0;
    for (let turn = 0; turn < 8 && s.result === "ongoing"; turn++) {
      let acted = true;
      while (acted) {
        acted = false;
        for (let i = 0; i < s.player.hand.length; i++) {
          const inst = s.player.hand[i];
          if (!inst) continue;
          const card = getCard(inst.cardId);
          if (card.type === "troop" && s.player.manaCurrent >= card.cost) {
            const slotIdx = freeSlotIndex(s.player);
            if (slotIdx >= 0) {
              const r = applyPlayerAction(s, { type: "PLAY_TROOP", handIndex: i, slotIndex: slotIdx }, ctx);
              if (r.ok) { deployed++; acted = true; break; }
            }
          }
        }
      }
      // 結束回合（包含 AI）
      applyPlayerAction(s, { type: "END_TURN" }, ctx);
    }

    expect(deployed).toBeGreaterThan(0);
    // 軍令量表應因部署觸發而累積（每兵 +10）
    expect(s.player.hero.gaugeValue).toBeGreaterThan(0);
  });

  it("巢穴 HP 0 時 playerWin（強制設定後驗證 checkVictory）", () => {
    const s = createBattle({ seed: 1, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    s.enemy.hero.hp = 5;
    s.player.hero.atk = 100;
    // 直接造傷
    s.enemy.hero.hp = 0;
    checkVictory(s);
    expect(s.result).toBe("playerWin");
  });

  it("號令加成：場上 4 兵力時行動傷害 ×1.2", () => {
    const s = createBattle({ seed: 99, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    // 直接放置 4 隻兵力到場上
    const t01 = getCard("T01");
    if (t01.type !== "troop") throw new Error("T01 not troop");
    for (let i = 0; i < 4; i++) {
      s.player.troopSlots[i] = createTroopInstance(s, t01, { suppressSummonSickness: true });
    }
    // 設定敵兵
    const enemyT = createTroopInstance(s, t01, { suppressSummonSickness: true });
    enemyT.hp = 100; enemyT.def = 0;
    s.enemy.troopSlots[0] = enemyT;

    // 模擬行動造傷
    executeEffects(
      [{ kind: "damage", target: { kind: "single", filter: {}, pickedInstanceId: enemyT.instanceId }, amount: { kind: "const", value: 10 } }],
      { state: s, ctx: createBattleContext(), sourceSide: "player", sourceKind: "action", sourceCardId: "test" },
    );
    // 10 * (1 + 4*0.05) = 12 → DEF 0 → -12 HP
    expect(enemyT.hp).toBe(88);
  });
});
