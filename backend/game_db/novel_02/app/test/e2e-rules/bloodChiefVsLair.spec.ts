import { beforeAll, describe, expect, it } from "vitest";
import { applyPlayerAction, createBattle, createBattleContext, ensureScriptedRegistered } from "../../src/game/seed";
import { REKA_DECK_IDS } from "../../src/data/decks/starter";
import { gaugeOnHeroDamaged } from "../../src/core/resource/gauge";
import { HEROES } from "../../src/data/heroes";
import { createTroopInstance } from "../../src/core/turn/factories";
import type { TroopCard } from "../../src/core/types/card";

beforeAll(() => ensureScriptedRegistered());

/**
 * 芮卡 vs 腐植巢穴 — 端到端規則戰鬥
 *
 * 驗證項：
 * 1. 血怒量表：每損失 10% HP +1 層
 * 2. 熱砂續戰：恢復、護甲、血怒 +2
 * 3. 狂暴職業：行動傷害隨已損失 HP 增加
 * 4. 終極技「狼血碾進」對敵方英雄造高傷害
 */
describe("E2E：芮卡 vs 腐植巢穴", () => {
  it("血怒量表：英雄損失 30% HP → 量表 +3", () => {
    const s = createBattle({ seed: 5, playerHeroId: "reka", playerDeckIds: REKA_DECK_IDS });
    const def = HEROES.reka!;
    const prev = s.player.hero.hp;
    s.player.hero.hp = Math.floor(prev * 0.7); // 損 30%
    if (def.gauge.onHeroDamaged) {
      gaugeOnHeroDamaged(s.player.hero, 10, def.gauge.onHeroDamaged, prev, s.player.hero.hp);
    }
    expect(s.player.hero.gaugeValue).toBe(3);
  });

  it("熱砂續戰：消耗 40 鬥志，恢復 10 HP、護甲 +6、血怒 +2", () => {
    const s = createBattle({ seed: 5, playerHeroId: "reka", playerDeckIds: REKA_DECK_IDS });
    const ctx = createBattleContext();
    s.player.hero.morale = 60;
    s.player.hero.hp = s.player.hero.maxHp - 20;
    const hpBefore = s.player.hero.hp;
    const gaugeBefore = s.player.hero.gaugeValue;
    const r = applyPlayerAction(s, { type: "USE_SKILL", skillId: "act_second_wind" }, ctx);
    expect(r.ok).toBe(true);
    expect(s.player.hero.morale).toBe(20);
    expect(s.player.hero.hp).toBe(Math.min(s.player.hero.maxHp, hpBefore + 10));
    expect(s.player.hero.armor).toBe(6);
    expect(s.player.hero.gaugeValue).toBe(gaugeBefore + 2);
  });

  it("狼血碾進：對敵方英雄造（血怒 ×6 +20）傷害", () => {
    const s = createBattle({ seed: 5, playerHeroId: "reka", playerDeckIds: REKA_DECK_IDS });
    const ctx = createBattleContext();
    s.player.hero.morale = 100;
    s.player.hero.gaugeValue = 5;
    const expectedDamage = 5 * 6 + 20;
    const enemyHpBefore = s.enemy.hero.hp;

    const r = applyPlayerAction(s, { type: "USE_ULTIMATE" }, ctx);
    expect(r.ok).toBe(true);
    expect(s.enemy.hero.hp).toBe(Math.max(0, enemyHpBefore - expectedDamage));
    expect(s.player.hero.gaugeValue).toBe(5);
    expect(s.result).toBe("ongoing");
  });

  it("狂暴職業：行動傷害隨已損失 HP 提升", () => {
    const s = createBattle({ seed: 5, playerHeroId: "reka", playerDeckIds: REKA_DECK_IDS });
    const ctx = createBattleContext();
    s.player.manaCurrent = 10;
    // 把 HP 降到 50%（loss 50%, +5 stacks * 8% = +40%）
    s.player.hero.hp = Math.floor(s.player.hero.maxHp * 0.5);

    // 設一個高 HP 敵兵供傷害測量
    const dummy: TroopCard = { type: "troop", id: "X", name: "X", cost: 0, rarity: "common", hp: 200, atk: 0, def: 0, keywords: [] };
    const t = createTroopInstance(s, dummy, { suppressSummonSickness: true });
    s.enemy.troopSlots[0] = t;

    // 給玩家 A03 猛攻（20 + 6 = 26 傷害基礎）
    s.player.hand = [{ instanceId: "a", cardId: "A03" }];
    const hpBefore = t.hp;
    applyPlayerAction(s, { type: "PLAY_ACTION", handIndex: 0, targetInstanceId: t.instanceId }, ctx);
    // 26 * (1 + 5*0.08) = 36.4
    const damage = hpBefore - t.hp;
    expect(damage).toBeGreaterThan(26); // 確認狂暴有起作用
    expect(damage).toBeLessThanOrEqual(40);
  });

  it("狼血碾進滿血怒可一擊定勝負", () => {
    const s = createBattle({ seed: 5, playerHeroId: "reka", playerDeckIds: REKA_DECK_IDS });
    const ctx = createBattleContext();
    s.player.hero.morale = 100;
    s.player.hero.gaugeValue = 10; // 滿層血怒
    applyPlayerAction(s, { type: "USE_ULTIMATE" }, ctx);
    expect(s.result).toBe("playerWin");
    expect(s.enemy.hero.hp).toBe(0);
  });
});
