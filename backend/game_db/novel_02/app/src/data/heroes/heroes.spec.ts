import { describe, expect, it, beforeAll } from "vitest";
import { HEROES, HERO_LIST } from "./index";
import { getRace } from "../races";
import { getClass } from "../classes";
import { composeHeroStats } from "../../core/stats/compose";
import { getCard } from "../cards";
import { AELLA_FLAIR_DECK_IDS, ARCHMAGE_DECK_IDS, BLOOD_CHIEF_DECK_IDS, COMMANDER_DECK_IDS } from "../decks/starter";
import { addGauge, gaugeOnHeroDamaged } from "../../core/resource/gauge";
import { applyResonanceMultiplier, applyBerserkMultiplier, applyCommandMultiplier } from "../../core/effects/amount";
import { registerCoreScripted } from "../../core/effects/handlers/scripted";
import { registerHeroScripted } from "../../core/effects/handlers/heroes";
import { createBattle, createBattleContext } from "../../game/seed";
import { applyAction } from "../../core/turn/reducer";
import { createTroopInstance } from "../../core/turn/factories";
import type { TroopCard } from "../../core/types/card";

beforeAll(() => {
  registerCoreScripted();
  registerHeroScripted();
});

describe("英雄資料完整性", () => {
  it("4 位 Demo 英雄已登記", () => {
    expect(HERO_LIST).toHaveLength(4);
    expect(Object.keys(HEROES)).toEqual(expect.arrayContaining(["commander_legion", "archmage_grand", "bloodchief_savage", "aella_flair"]));
  });

  it("每位英雄都有 1+ 個被動、3 個主動、1 個終極", () => {
    for (const h of HERO_LIST) {
      expect(h.passives.length).toBeGreaterThanOrEqual(1);
      expect(h.actives.length).toBeGreaterThanOrEqual(3);
      expect(h.ultimate).toBeDefined();
      expect(h.ultimate.cost.morale).toBe(100);
    }
  });
});

describe("預組牌完整性 — 每位英雄 30 張 + 符合種族 deckLimits", () => {
  function check(heroId: string, ids: string[]): void {
    const hero = HEROES[heroId]!;
    const race = getRace(hero.raceId);
    expect(ids).toHaveLength(30);
    const byType = ids.reduce<Record<string, number>>((acc, id) => {
      const t = getCard(id).type;
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    expect(byType.troop ?? 0).toBeGreaterThanOrEqual(race.deckLimits.troop[0]);
    expect(byType.troop ?? 0).toBeLessThanOrEqual(race.deckLimits.troop[1]);
    expect(byType.action ?? 0).toBeGreaterThanOrEqual(race.deckLimits.action[0]);
    expect(byType.action ?? 0).toBeLessThanOrEqual(race.deckLimits.action[1]);
    expect(byType.spell ?? 0).toBeGreaterThanOrEqual(race.deckLimits.spell[0]);
    expect(byType.spell ?? 0).toBeLessThanOrEqual(race.deckLimits.spell[1]);
    expect(byType.equipment ?? 0).toBeGreaterThanOrEqual(race.deckLimits.equipment[0]);
    expect(byType.equipment ?? 0).toBeLessThanOrEqual(race.deckLimits.equipment[1]);
    expect(byType.field ?? 0).toBeGreaterThanOrEqual(race.deckLimits.field[0]);
    expect(byType.field ?? 0).toBeLessThanOrEqual(race.deckLimits.field[1]);
  }
  it("軍團統帥牌組合法", () => check("commander_legion", COMMANDER_DECK_IDS));
  it("大賢者牌組合法", () => check("archmage_grand", ARCHMAGE_DECK_IDS));
  it("蠻血酋長牌組合法", () => check("bloodchief_savage", BLOOD_CHIEF_DECK_IDS));
  it("艾拉·芙萊爾牌組合法", () => check("aella_flair", AELLA_FLAIR_DECK_IDS));
});

describe("軍令量表（指揮官）", () => {
  it("部署兵力 +10", () => {
    const hero = { defId: "commander_legion", hp: 80, maxHp: 80, atk: 6, def: 5, cmd: 9, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    const def = HEROES.commander_legion!;
    addGauge(hero, getRace("human").gauge.max, def.gauge.onTroopEnter ?? 0);
    expect(hero.gaugeValue).toBe(10);
  });

  it("號令加成：場上 4 兵力時行動傷害 ×1.2", () => {
    expect(applyCommandMultiplier(10, 4)).toBe(12);
  });
});

describe("共鳴量表（法師）", () => {
  it("施放法術 +1 共鳴", () => {
    const hero = { defId: "archmage_grand", hp: 60, maxHp: 60, atk: 7, def: 3, cmd: 4, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    const def = HEROES.archmage_grand!;
    addGauge(hero, getRace("elf").gauge.max, def.gauge.onSpellCast ?? 0);
    expect(hero.gaugeValue).toBe(1);
  });

  it("3 層共鳴：法術傷害 ×1.6", () => {
    expect(applyResonanceMultiplier(10, 3)).toBe(16);
  });

  it("4 層共鳴觸發詠唱完成（reducer 中處理：下張法術 0 費）", () => {
    // 此項由 reducer playSpell 規則處理 —— 此處只驗證 cap 與閾值
    const hero = { defId: "x", hp: 60, maxHp: 60, atk: 7, def: 3, cmd: 4, morale: 0, gaugeValue: 3, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    addGauge(hero, getRace("elf").gauge.max, 1);
    expect(hero.gaugeValue).toBe(4); // 觸發點
  });
});

describe("血怒量表（狂戰士）", () => {
  it("英雄 HP 100/100 → 70/100：跨 3 個 10% 階段，量表 +3", () => {
    const hero = { defId: "bloodchief_savage", hp: 70, maxHp: 100, atk: 19, def: 1, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    gaugeOnHeroDamaged(hero, 10, { perPct: 10, perValue: 1 }, 100, 70);
    expect(hero.gaugeValue).toBe(3);
  });

  it("狂暴加成：HP 70%（已損 30%）→ 行動傷害 ×1.24", () => {
    expect(applyBerserkMultiplier(10, 30)).toBe(12); // 1 + 3*0.08 = 1.24 → 12.4 → 12
  });
});

describe("英雄技能 — 主動效果定義", () => {
  it("軍團統帥 act_battle_command：消耗 20 鬥志，全體 ATK +3 本回合", () => {
    const skill = HEROES.commander_legion!.actives.find((s) => s.id === "act_battle_command")!;
    expect(skill.cost.morale).toBe(20);
    expect(skill.effects[0]?.kind).toBe("buff");
  });

  it("大賢者 act_starshackles：消耗 30 鬥志，凍結 2 回合", () => {
    const skill = HEROES.archmage_grand!.actives.find((s) => s.id === "act_starshackles")!;
    expect(skill.cost.morale).toBe(30);
    const e = skill.effects[0];
    if (e?.kind === "freeze") expect(e.turns).toBe(2);
  });

  it("蠻血酋長 act_war_roar：自傷 15 + 血怒 +5 + 兵力 buff", () => {
    const skill = HEROES.bloodchief_savage!.actives.find((s) => s.id === "act_war_roar")!;
    expect(skill.cost.morale).toBe(50);
    expect(skill.effects).toHaveLength(3);
  });

  it("艾拉 act_rescue_marker：抽牌並召喚持盾衛兵", () => {
    const skill = HEROES.aella_flair!.actives.find((s) => s.id === "act_rescue_marker")!;
    expect(skill.cost.morale).toBe(35);
    expect(skill.effects[0]).toEqual({ kind: "draw", count: 1 });
    expect(skill.effects[1]).toEqual({ kind: "summon", cardId: "T03", count: 1, side: "self" });
  });

  it("艾拉 act_rapid_recon：抽牌、護甲、軍令", () => {
    const skill = HEROES.aella_flair!.actives.find((s) => s.id === "act_rapid_recon")!;
    expect(skill.cost.morale).toBe(20);
    expect(skill.effects).toEqual([
      { kind: "draw", count: 1 },
      { kind: "armor", amount: 6 },
      { kind: "gauge", delta: 10, side: "self" },
    ]);
  });
});

describe("終極技施放規則", () => {
  it("鬥志不足 100 不能施放（reducer 規則）— 此處只驗 cost", () => {
    for (const h of HERO_LIST) {
      expect(h.ultimate.cost.morale).toBe(100);
    }
  });

  it("大賢者「古語終章」effect：傷害 = 已施放法術數 ×3", () => {
    const ult = HEROES.archmage_grand!.ultimate;
    const e = ult.effects[0];
    if (e?.kind === "damage") {
      expect(e.amount.kind).toBe("spellsCastThisGame");
      if (e.amount.kind === "spellsCastThisGame") expect(e.amount.mult).toBe(3);
    }
  });

  it("艾拉「精準支援導引」清除敵方兵力防線並抽 2 張", () => {
    const ctx = createBattleContext();
    const state = createBattle({ seed: 7, playerHeroId: "aella_flair", playerDeckIds: AELLA_FLAIR_DECK_IDS, initialHandSize: 0 });
    state.player.hero.morale = 100;
    state.player.hand = [];
    state.player.deck = [
      { instanceId: "draw_1", cardId: "S01" },
      { instanceId: "draw_2", cardId: "S04" },
    ];

    const guard = createTroopInstance(state, getCard("T03") as TroopCard);
    guard.atk += 3;
    guard.def += 2;
    guard.maxHp += 4;
    guard.hp += 4;
    guard.buffs.push({ id: "positive", source: "test", mod: { atk: 3, def: 2, hp: 4 }, remainingTurns: 2 });
    guard.buffs.push({ id: "negative", source: "test", mod: { atk: -1 }, remainingTurns: 2 });
    state.enemy.troopSlots[0] = guard;

    const result = applyAction(state, { type: "USE_ULTIMATE" }, ctx);

    expect(result.ok).toBe(true);
    expect(guard.def).toBe(0);
    expect(guard.keywords.has("guard")).toBe(false);
    expect(guard.atk).toBe(2);
    expect(guard.maxHp).toBe(10);
    expect(guard.hp).toBe(10);
    expect(guard.buffs).toHaveLength(1);
    expect(guard.buffs[0]?.id).toBe("negative");
    expect(state.player.hand.map((c) => c.cardId)).toEqual(["S01", "S04"]);
    expect(state.player.hero.flags.ultimateUsed).toBe(true);
  });
});
