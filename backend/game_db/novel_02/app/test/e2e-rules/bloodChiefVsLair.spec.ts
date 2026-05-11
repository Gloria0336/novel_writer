import { beforeAll, describe, expect, it } from "vitest";
import { applyPlayerAction, createBattle, createBattleContext, ensureScriptedRegistered } from "../../src/game/seed";
import { BLOOD_CHIEF_DECK_IDS } from "../../src/data/decks/starter";
import { gaugeOnHeroDamaged } from "../../src/core/resource/gauge";
import { HEROES } from "../../src/data/heroes";
import { createTroopInstance } from "../../src/core/turn/factories";
import type { TroopCard } from "../../src/core/types/card";

beforeAll(() => ensureScriptedRegistered());

/**
 * 蠻血酋長 vs 腐植巢穴 — 端到端規則戰鬥
 *
 * 驗證項：
 * 1. 血怒量表：每損失 10% HP +1 層
 * 2. 戰嚎技能：自傷 15 + 血怒 +5 + 兵力 buff
 * 3. 狂暴職業：行動傷害隨已損失 HP 增加
 * 4. 終極技「祖獸覺醒」對敵方英雄造高傷害
 */
describe("E2E：蠻血酋長 vs 腐植巢穴", () => {
  it("血怒量表：英雄損失 30% HP → 量表 +3", () => {
    const s = createBattle({ seed: 5, playerHeroId: "bloodchief_savage", playerDeckIds: BLOOD_CHIEF_DECK_IDS });
    const def = HEROES.bloodchief_savage!;
    const prev = s.player.hero.hp;
    s.player.hero.hp = Math.floor(prev * 0.7); // 損 30%
    if (def.gauge.onHeroDamaged) {
      gaugeOnHeroDamaged(s.player.hero, 10, def.gauge.onHeroDamaged, prev, s.player.hero.hp);
    }
    expect(s.player.hero.gaugeValue).toBe(3);
  });

  it("戰嚎技能：消耗 50 鬥志，英雄自傷 15、血怒 +5", () => {
    const s = createBattle({ seed: 5, playerHeroId: "bloodchief_savage", playerDeckIds: BLOOD_CHIEF_DECK_IDS });
    const ctx = createBattleContext();
    s.player.hero.morale = 60;
    const hpBefore = s.player.hero.hp;
    const gaugeBefore = s.player.hero.gaugeValue;
    const r = applyPlayerAction(s, { type: "USE_SKILL", skillId: "act_war_roar" }, ctx);
    expect(r.ok).toBe(true);
    expect(s.player.hero.morale).toBe(10); // 60 - 50
    // 自傷 15（fixed）— 也可能因 HP loss 觸發血怒（受傷 15/110 ≈ 13.6% → 1 層）
    expect(s.player.hero.hp).toBeLessThanOrEqual(hpBefore - 15);
    expect(s.player.hero.gaugeValue).toBeGreaterThanOrEqual(gaugeBefore + 5);
  });

  it("祖獸覺醒：對敵方英雄造 (ATK + 血怒×5) ×2 傷害", () => {
    const s = createBattle({ seed: 5, playerHeroId: "bloodchief_savage", playerDeckIds: BLOOD_CHIEF_DECK_IDS });
    const ctx = createBattleContext();
    s.player.hero.morale = 100;
    s.player.hero.gaugeValue = 5;
    const expectedDamage = (s.player.hero.atk + 5 * 5) * 2; // (19 + 25) * 2 = 88
    const enemyHpBefore = s.enemy.hero.hp;

    const r = applyPlayerAction(s, { type: "USE_ULTIMATE" }, ctx);
    expect(r.ok).toBe(true);
    expect(s.enemy.hero.hp).toBe(Math.max(0, enemyHpBefore - expectedDamage));
    expect(s.player.hero.gaugeValue).toBe(0); // 血怒清零
    expect(s.result).toBe("playerWin"); // 88 > 80 → 巢穴 HP 0
  });

  it("狂暴職業：行動傷害隨已損失 HP 提升", () => {
    const s = createBattle({ seed: 5, playerHeroId: "bloodchief_savage", playerDeckIds: BLOOD_CHIEF_DECK_IDS });
    const ctx = createBattleContext();
    s.player.manaCurrent = 10;
    // 把 HP 降到 50%（loss 50%, +5 stacks * 8% = +40%）
    s.player.hero.hp = Math.floor(s.player.hero.maxHp * 0.5);

    // 設一個高 HP 敵兵供傷害測量
    const dummy: TroopCard = { type: "troop", id: "X", name: "X", cost: 0, rarity: "common", hp: 200, atk: 0, def: 0, keywords: [] };
    const t = createTroopInstance(s, dummy, { suppressSummonSickness: true });
    s.enemy.troopSlots[0] = t;

    // 給玩家 A03 猛攻（19 + 6 = 25 傷害基礎）
    s.player.hand = [{ instanceId: "a", cardId: "A03" }];
    const hpBefore = t.hp;
    applyPlayerAction(s, { type: "PLAY_ACTION", handIndex: 0, targetInstanceId: t.instanceId }, ctx);
    // 25 * (1 + 5*0.08) = 35
    const damage = hpBefore - t.hp;
    expect(damage).toBeGreaterThan(25); // 確認狂暴有起作用
    expect(damage).toBeLessThanOrEqual(40);
  });

  it("祖獸覺醒對殘血巢穴可一擊定勝負", () => {
    const s = createBattle({ seed: 5, playerHeroId: "bloodchief_savage", playerDeckIds: BLOOD_CHIEF_DECK_IDS });
    const ctx = createBattleContext();
    s.player.hero.morale = 100;
    s.player.hero.gaugeValue = 10; // 滿層血怒
    applyPlayerAction(s, { type: "USE_ULTIMATE" }, ctx);
    expect(s.result).toBe("playerWin");
    expect(s.enemy.hero.hp).toBe(0);
  });
});
