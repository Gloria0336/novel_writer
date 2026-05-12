import { describe, expect, it } from "vitest";
import { HEROES, HERO_LIST } from "./index";
import { getRace } from "../races";
import { getCard } from "../cards";
import { ELNO_HONORARY_MAGE_DECK_IDS, LULU_DECK_IDS, MOUNTAIN_HUNTER_DECK_IDS, REKA_DECK_IDS } from "../decks/starter";
import { addGauge, gaugeOnHeroDamaged } from "../../core/resource/gauge";
import { applyBerserkMultiplier, applyCommandMultiplier, applyResonanceMultiplier } from "../../core/effects/amount";

describe("英雄資料完整性", () => {
  it("4 位小說角色英雄已登記", () => {
    expect(HERO_LIST).toHaveLength(4);
    expect(Object.keys(HEROES)).toEqual(expect.arrayContaining(["lulu", "mountain-hunter", "reka", "elno-honorary-mage"]));
    expect(Object.keys(HEROES)).not.toContain("commander_legion");
    expect(Object.keys(HEROES)).not.toContain("archmage_grand");
  });

  it("每位英雄都有 1+ 個被動、3 個主動、1 個終極", () => {
    for (const h of HERO_LIST) {
      expect(h.passives.length).toBeGreaterThanOrEqual(1);
      expect(h.actives.length).toBe(3);
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

  it("露露牌組合法", () => check("lulu", LULU_DECK_IDS));
  it("山獵人牌組合法", () => check("mountain-hunter", MOUNTAIN_HUNTER_DECK_IDS));
  it("芮卡牌組合法", () => check("reka", REKA_DECK_IDS));
  it("艾爾諾老師牌組合法", () => check("elno-honorary-mage", ELNO_HONORARY_MAGE_DECK_IDS));
});

describe("英雄量表規則", () => {
  it("露露部署兵力 +10 軍令", () => {
    const hero = { defId: "lulu", hp: 80, maxHp: 80, atk: 8, def: 6, cmd: 8, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    const def = HEROES.lulu!;
    addGauge(hero, getRace("human").gauge.max, def.gauge.onTroopEnter ?? 0);
    expect(hero.gaugeValue).toBe(10);
    expect(applyCommandMultiplier(10, 4)).toBe(12);
  });

  it("芮卡受傷跨 3 個 10% 階段，血怒 +3", () => {
    const hero = { defId: "reka", hp: 70, maxHp: 100, atk: 20, def: 2, cmd: 4, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    gaugeOnHeroDamaged(hero, 10, { perPct: 10, perValue: 1 }, 100, 70);
    expect(hero.gaugeValue).toBe(3);
    expect(applyBerserkMultiplier(10, 30)).toBe(12);
  });

  it("艾爾諾施放法術 +1 共鳴", () => {
    const hero = { defId: "elno-honorary-mage", hp: 65, maxHp: 65, atk: 8, def: 3, cmd: 7, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    const def = HEROES["elno-honorary-mage"]!;
    addGauge(hero, getRace("elf").gauge.max, def.gauge.onSpellCast ?? 0);
    expect(hero.gaugeValue).toBe(1);
    expect(applyResonanceMultiplier(10, 3)).toBe(16);
  });
});

describe("英雄技能 — 主動效果定義", () => {
  it("露露 act_sacred_blade_thrust：聖劍突刺無視守護", () => {
    const skill = HEROES.lulu!.actives.find((s) => s.id === "act_sacred_blade_thrust")!;
    expect(skill.cost.morale).toBe(25);
    expect(skill.effects[0]).toMatchObject({ kind: "damage", ignoreGuard: true });
  });

  it("山獵人 act_bone_arrow_blind：骨箭無視 DEF 與守護並凍結", () => {
    const skill = HEROES["mountain-hunter"]!.actives.find((s) => s.id === "act_bone_arrow_blind")!;
    expect(skill.cost.morale).toBe(30);
    expect(skill.effects[0]).toMatchObject({ kind: "damage", ignoreDef: true, ignoreGuard: true });
    expect(skill.effects[1]).toMatchObject({ kind: "freeze", turns: 1 });
  });

  it("芮卡 act_heel_breaker：破防腿擊無視 DEF 並凍結", () => {
    const skill = HEROES.reka!.actives.find((s) => s.id === "act_heel_breaker")!;
    expect(skill.cost.morale).toBe(35);
    expect(skill.effects[0]).toMatchObject({ kind: "damage", ignoreDef: true });
    expect(skill.effects[1]).toMatchObject({ kind: "freeze", turns: 1 });
  });

  it("艾爾諾 act_star_erasure：星光抹除掃敵方兵力", () => {
    const skill = HEROES["elno-honorary-mage"]!.actives.find((s) => s.id === "act_star_erasure")!;
    expect(skill.cost.morale).toBe(45);
    expect(skill.effects[0]).toMatchObject({ kind: "damage", ignoreDef: true, ignoreGuard: true });
  });
});

describe("終極技施放規則", () => {
  it("所有英雄終極技消耗 100 鬥志", () => {
    for (const h of HERO_LIST) {
      expect(h.ultimate.cost.morale).toBe(100);
    }
  });

  it("艾爾諾「星光迴路淨除」傷害 = 已施放法術數 ×4，並摧毀場地", () => {
    const ult = HEROES["elno-honorary-mage"]!.ultimate;
    const damage = ult.effects[0];
    if (!damage) throw new Error("expected damage effect");
    expect(damage).toMatchObject({ kind: "damage", ignoreGuard: true });
    if (damage.kind === "damage" && damage.amount.kind === "spellsCastThisGame") {
      expect(damage.amount.mult).toBe(4);
    }
    expect(ult.effects[1]).toEqual({ kind: "destroyField" });
  });
});
