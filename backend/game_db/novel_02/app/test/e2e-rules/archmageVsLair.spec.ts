import { beforeAll, describe, expect, it } from "vitest";
import { applyPlayerAction, createBattle, createBattleContext, ensureScriptedRegistered } from "../../src/game/seed";
import { ARCHMAGE_DECK_IDS } from "../../src/data/decks/starter";
import { getCard } from "../../src/data/cards";
import { createTroopInstance } from "../../src/core/turn/factories";
import type { TroopCard } from "../../src/core/types/card";

beforeAll(() => ensureScriptedRegistered());

/**
 * 大賢者 vs 腐植巢穴 — 端到端規則戰鬥
 *
 * 驗證項：
 * 1. 共鳴量表：每施放 1 張法術 +1
 * 2. 共鳴 ≥ 4 時下一張法術 0 費（詠唱完成）
 * 3. 法術連鎖（超載職業關鍵字）
 * 4. 終極技傷害 = 已施放法術數 ×3
 */
describe("E2E：大賢者 vs 腐植巢穴", () => {
  it("施放 1 張法術後共鳴 +1", () => {
    const s = createBattle({ seed: 7, playerHeroId: "archmage_grand", playerDeckIds: ARCHMAGE_DECK_IDS });
    const ctx = createBattleContext();

    // 找一張低費法術（S01 偵查術 0 費）
    const idx = s.player.hand.findIndex((inst) => getCard(inst.cardId).id === "S01");
    if (idx < 0) {
      // 強制注入
      s.player.hand.unshift({ instanceId: "x", cardId: "S01" });
      const r = applyPlayerAction(s, { type: "PLAY_SPELL", handIndex: 0 }, ctx);
      expect(r.ok).toBe(true);
    } else {
      const r = applyPlayerAction(s, { type: "PLAY_SPELL", handIndex: idx }, ctx);
      expect(r.ok).toBe(true);
    }
    expect(s.player.spellsCastThisTurn).toBeGreaterThanOrEqual(1);
    expect(s.player.hero.gaugeValue).toBeGreaterThanOrEqual(1);
  });

  it("共鳴 4 時下張法術 0 費（詠唱完成）", () => {
    const s = createBattle({ seed: 7, playerHeroId: "archmage_grand", playerDeckIds: ARCHMAGE_DECK_IDS });
    const ctx = createBattleContext();
    s.player.hero.gaugeValue = 4;
    const manaBefore = s.player.manaCurrent;
    s.player.hand = [{ instanceId: "x", cardId: "S07" }]; // S07 4 費
    const r = applyPlayerAction(s, { type: "PLAY_SPELL", handIndex: 0 }, ctx);
    expect(r.ok).toBe(true);
    expect(s.player.manaCurrent).toBe(manaBefore); // 0 費，魔力沒消耗
    expect(s.player.hero.gaugeValue).toBeLessThan(4); // 共鳴被消耗
  });

  it("超載：第 3 張起每張法術 +1 臨時魔力", () => {
    const s = createBattle({ seed: 7, playerHeroId: "archmage_grand", playerDeckIds: ARCHMAGE_DECK_IDS });
    const ctx = createBattleContext();
    s.player.manaCurrent = 20; // 充足魔力
    s.player.hand = [
      { instanceId: "x1", cardId: "S01" },
      { instanceId: "x2", cardId: "S01" },
      { instanceId: "x3", cardId: "S01" },
      { instanceId: "x4", cardId: "S01" },
    ];
    const tempBefore = s.player.tempMana;
    applyPlayerAction(s, { type: "PLAY_SPELL", handIndex: 0 }, ctx);
    applyPlayerAction(s, { type: "PLAY_SPELL", handIndex: 0 }, ctx);
    applyPlayerAction(s, { type: "PLAY_SPELL", handIndex: 0 }, ctx); // 第 3 張，超載觸發
    expect(s.player.tempMana - tempBefore).toBeGreaterThanOrEqual(1);
  });

  it("古語終章：傷害 = 已施放法術數 ×3，敵方英雄受傷", () => {
    const s = createBattle({ seed: 9, playerHeroId: "archmage_grand", playerDeckIds: ARCHMAGE_DECK_IDS });
    const ctx = createBattleContext();
    s.player.hero.morale = 100;
    s.player.spellsCastThisGame = 7; // 假設已施放 7 張
    const enemyHpBefore = s.enemy.hero.hp;
    const r = applyPlayerAction(s, { type: "USE_ULTIMATE" }, ctx);
    expect(r.ok).toBe(true);
    expect(s.player.hero.flags.ultimateUsed).toBe(true);
    // 7 ×3 = 21；敵方英雄 DEF 0；應 -21（無視守護）
    expect(s.enemy.hero.hp).toBe(Math.max(0, enemyHpBefore - 21));
  });

  it("共鳴 3 層時 S07 烈焰風暴傷害 ×1.6（含本次施放 onSpellCast +1）", () => {
    const s = createBattle({ seed: 11, playerHeroId: "archmage_grand", playerDeckIds: ARCHMAGE_DECK_IDS });
    const ctx = createBattleContext();
    // 起始 gauge = 2，本次施放 +1 → 結算時為 3 層
    s.player.hero.gaugeValue = 2;
    s.player.manaCurrent = 10;
    const dummy: TroopCard = { type: "troop", id: "X", name: "X", cost: 0, rarity: "common", hp: 100, atk: 0, def: 0, keywords: [] };
    const t = createTroopInstance(s, dummy, { suppressSummonSickness: true });
    s.enemy.troopSlots[0] = t;

    s.player.hand = [{ instanceId: "z", cardId: "S07" }];
    applyPlayerAction(s, { type: "PLAY_SPELL", handIndex: 0 }, ctx);

    // S07 基礎 10，共鳴 3 層（本次施放使其達 3）→ ×1.6 = 16，DEF 0
    expect(t.hp).toBe(84);
  });
});
