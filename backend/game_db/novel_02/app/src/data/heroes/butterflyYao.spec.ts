import { beforeAll, describe, expect, it } from "vitest";
import { createBattle, createBattleContext, ensureScriptedRegistered } from "../../game/seed";
import { applyAction } from "../../core/turn/reducer";
import { startTurnFor } from "../../core/turn/phases";
import { createTroopInstance } from "../../core/turn/factories";
import { getCard } from "../cards";
import { BUTTERFLY_YAO_DECK_IDS } from "../decks/starter";
import type { TroopCard } from "../../core/types/card";

beforeAll(() => ensureScriptedRegistered());

describe("曇 — 留白控場英雄 runtime", () => {
  it("開局固定人形，回合開始累積靈蘊並由幻術師關鍵字召喚幻影", () => {
    const s = createBattle({ seed: 7, playerHeroId: "butterfly-yao", playerDeckIds: BUTTERFLY_YAO_DECK_IDS });

    expect(s.player.hero.flags.feyForm).toBe("human");
    expect(s.player.hero.gaugeValue).toBe(10); // 回合開始 +4，幻影進場 +6
    expect(s.player.troopSlots.filter((troop) => troop?.cardId === "T_s_31")).toHaveLength(1);
    expect(s.log.some((entry) => entry.kind === "ILLUSIONIST_TURN_PHANTOM")).toBe(true);
  });

  it("鱗粉記憶每回合只觸發一次，第二次形態切換不重複 debuff", () => {
    const s = createBattle({ seed: 8, playerHeroId: "butterfly-yao", playerDeckIds: BUTTERFLY_YAO_DECK_IDS });
    const ctx = createBattleContext();
    const enemyCard = getCard("T_c_02");
    if (enemyCard.type !== "troop") throw new Error("T_c_02 should be a troop");

    const enemyTroop = createTroopInstance(s, enemyCard as TroopCard);
    s.enemy.troopSlots[0] = enemyTroop;
    s.player.hero.morale = 40;

    expect(applyAction(s, { type: "USE_SKILL", skillId: "act_moonlit_fold" }, ctx)).toMatchObject({ ok: true });
    expect(s.player.hero.armor).toBe(14); // 被動 +6，技能 +8
    expect(enemyTroop.atk).toBe(3);
    expect(s.player.hero.flags.tanFormMemoryTurn).toBe(s.turn);

    expect(applyAction(s, { type: "USE_SKILL", skillId: "act_moonlit_fold" }, ctx)).toMatchObject({ ok: true });
    expect(s.player.hero.armor).toBe(22); // 第二次只有技能 +8
    expect(enemyTroop.atk).toBe(3);
  });

  it("終極技凍結敵方下回合魔力回復與兵力牌，但不阻止既有魔力施放法術", () => {
    const s = createBattle({ seed: 9, playerHeroId: "butterfly-yao", playerDeckIds: BUTTERFLY_YAO_DECK_IDS });
    const ctx = createBattleContext();

    s.player.hero.morale = 100;
    s.player.hero.hp = 50;
    s.player.deck.push({ instanceId: "draw_after_ult", cardId: "S_c_01" });

    expect(applyAction(s, { type: "USE_ULTIMATE" }, ctx)).toMatchObject({ ok: true });
    expect(s.enemy.hero.flags.heroAbilityFreeze).toMatchObject({ manaRegen: 1, troop: 1 });
    expect(s.player.hero.hp).toBe(68);
    expect(s.player.troopSlots.filter((troop) => troop?.cardId === "T_s_31")).toHaveLength(3);

    s.enemy.manaCap = 2;
    s.enemy.manaCurrent = 1;
    s.enemy.tempMana = 3;
    s.enemy.hand = [
      { instanceId: "enemy_troop", cardId: "T_c_01" },
      { instanceId: "enemy_spell", cardId: "S_c_01" },
    ];
    s.turn = 2;
    startTurnFor(s, "enemy", ctx);

    expect(s.enemy.manaCap).toBe(2);
    expect(s.enemy.manaCurrent).toBe(1);
    expect(s.enemy.tempMana).toBe(0);
    expect(applyAction(s, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 0 }, ctx)).toMatchObject({ ok: false, reason: "troop cards frozen" });
    expect(applyAction(s, { type: "PLAY_SPELL", handIndex: 1 }, ctx)).toMatchObject({ ok: true });
  });
});
