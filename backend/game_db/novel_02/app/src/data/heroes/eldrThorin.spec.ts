import { beforeAll, describe, expect, it } from "vitest";
import { createBattle, createBattleContext, ensureScriptedRegistered } from "../../game/seed";
import { applyAction } from "../../core/turn/reducer";
import { createTroopInstance } from "../../core/turn/factories";
import { getCard } from "../cards";
import { ELDR_THORIN_DECK_IDS } from "../decks/starter";
import type { TroopCard } from "../../core/types/card";

beforeAll(() => ensureScriptedRegistered());

describe("艾德 · 圖林 — 矮人鍛造師 runtime", () => {
  it("開局回合開始 +5 爐火，被動 buff 套用後 HP/DEF/ATK 都提升", () => {
    const s = createBattle({ seed: 11, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });

    expect(s.player.hero.gaugeValue).toBe(5);
    // 種族 dwarf +20HP/+3DEF；職業 smith +10HP/+2DEF；statTuning hp -5/def -1；
    // 被動「爐火印記」 hp +5/def +2/atk +1（永久套用）。
    expect(s.player.hero.def).toBeGreaterThanOrEqual(6);
    expect(s.player.hero.maxHp).toBeGreaterThan(60);
  });

  it("淬鋼護甲：消耗 30 鬥志，獲得 8 護甲與 +15 爐火", () => {
    const s = createBattle({ seed: 12, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();

    s.player.hero.morale = 30;
    const armorBefore = s.player.hero.armor;
    const gaugeBefore = s.player.hero.gaugeValue;

    expect(applyAction(s, { type: "USE_SKILL", skillId: "act_tempered_plate" }, ctx)).toMatchObject({ ok: true });
    expect(s.player.hero.armor).toBe(armorBefore + 8);
    expect(s.player.hero.gaugeValue).toBe(gaugeBefore + 15);
    expect(s.player.hero.morale).toBe(0);
  });

  it("重錘鍛擊：對敵方兵力造成 ATK +3 傷害", () => {
    const s = createBattle({ seed: 13, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();
    const enemyCard = getCard("T_c_02");
    if (enemyCard.type !== "troop") throw new Error("T_c_02 should be a troop");

    const enemyTroop = createTroopInstance(s, enemyCard as TroopCard);
    s.enemy.troopSlots[0] = enemyTroop;
    s.player.hero.morale = 25;
    s.player.hero.atk = 12;
    const hpBefore = enemyTroop.hp;

    expect(applyAction(s, { type: "USE_SKILL", skillId: "act_heavy_hammer_strike", targetInstanceId: enemyTroop.instanceId }, ctx)).toMatchObject({ ok: true });
    // damage = (atk + 3) - def，hp 不會低於 0
    expect(enemyTroop.hp).toBeLessThan(hpBefore);
  });

  it("鍛造節奏：消耗 20 爐火，只抽 E.x.xx 或 x.m.xx 系列牌", () => {
    const s = createBattle({ seed: 15, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();

    s.player.hero.morale = 0;
    s.player.hero.gaugeValue = 20;
    s.player.hand = [];
    s.player.deck = [
      { instanceId: "deck_spell", cardId: "S_c_01" },
      { instanceId: "deck_action", cardId: "A_dw_01" },
      { instanceId: "deck_equipment", cardId: "E_c_01" },
      { instanceId: "deck_device", cardId: "T_m_02" },
    ];

    expect(applyAction(s, { type: "USE_SKILL", skillId: "act_forging_rhythm" }, ctx)).toMatchObject({ ok: true });
    expect(s.player.hero.gaugeValue).toBe(0);
    expect(s.player.hero.morale).toBe(0);
    expect(s.player.hand.map((card) => card.cardId)).toEqual(["E_c_01"]);
    expect(s.player.deck.map((card) => card.cardId)).toEqual(["S_c_01", "A_dw_01", "T_m_02"]);
  });

  it("氏族戰錘高舉：終極技對敵方英雄造成傷害並永久 +3 ATK", () => {
    const s = createBattle({ seed: 14, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();

    s.player.hero.morale = 100;
    const atkBefore = s.player.hero.atk;
    const enemyHpBefore = s.enemy.hero.hp;

    expect(applyAction(s, { type: "USE_ULTIMATE" }, ctx)).toMatchObject({ ok: true });
    expect(s.enemy.hero.hp).toBeLessThan(enemyHpBefore);
    expect(s.player.hero.atk).toBe(atkBefore + 3);
    expect(s.player.hero.flags.ultimateUsed).toBe(true);
  });
});
