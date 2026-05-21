import { describe, expect, it } from "vitest";
import { HEROES, HERO_LIST } from "./index";
import { getRace } from "../races";
import { getCard } from "../cards";
import { getStarterDeckIds } from "../decks";
import { AELLA_FLAIR_DECK_IDS, BUTTERFLY_YAO_DECK_IDS, ELDR_THORIN_DECK_IDS, ELNO_HONORARY_MAGE_DECK_IDS, FULDRA_DECK_IDS, LULU_DECK_IDS, MOUNTAIN_HUNTER_DECK_IDS, REKA_DECK_IDS } from "../decks/starter";
import { addGauge, gaugeOnHeroDamaged } from "../../core/resource/gauge";
import { applyBerserkMultiplier, applyCommandMultiplier, applyResonanceMultiplier } from "../../core/effects/amount";
import { createBattle } from "../../game/seed";

describe("英雄資料完整性", () => {
  it("8 位小說角色英雄已登記", () => {
    expect(HERO_LIST).toHaveLength(8);
    expect(Object.keys(HEROES)).toEqual(expect.arrayContaining(["lulu", "mountain-hunter", "reka", "elno-honorary-mage", "butterfly-yao", "eldr-thorin", "aella-flair", "fuldra"]));
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
    // device 與 troop 共用 troopSlots，計入相同限額。
    const boardUnitCount = (byType.troop ?? 0) + (byType.device ?? 0);
    expect(boardUnitCount).toBeGreaterThanOrEqual(race.deckLimits.troop[0]);
    expect(boardUnitCount).toBeLessThanOrEqual(race.deckLimits.troop[1]);
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
  it("曇牌組合法", () => check("butterfly-yao", BUTTERFLY_YAO_DECK_IDS));
  it("艾德圖林牌組合法", () => check("eldr-thorin", ELDR_THORIN_DECK_IDS));
  it("艾拉牌組合法", () => check("aella-flair", AELLA_FLAIR_DECK_IDS));
  it("芙爾卓牌組合法", () => check("fuldra", FULDRA_DECK_IDS));

  it("all selectable heroes have a starter deck that can create a battle", () => {
    for (const hero of HERO_LIST) {
      const deckIds = getStarterDeckIds(hero.id);
      expect(() => createBattle({ seed: 1, playerHeroId: hero.id, playerDeckIds: deckIds })).not.toThrow();
    }
  });

  it("M 章場地管理卡已放入對應英雄牌組", () => {
    const expectIncludes = (deck: string[], cards: string[]) => {
      expect(deck).toEqual(expect.arrayContaining(cards));
    };

    expectIncludes(BUTTERFLY_YAO_DECK_IDS, ["A_f_07", "A_f_08", "A_f_09", "A_f_10", "A_f_11"]);
    expectIncludes(LULU_DECK_IDS, ["A_h_05", "A_h_06", "A_o_04", "A_o_05", "A_o_06"]);
    expectIncludes(MOUNTAIN_HUNTER_DECK_IDS, ["A_h_05", "A_h_06"]);
    expectIncludes(AELLA_FLAIR_DECK_IDS, ["A_h_05", "A_h_06"]);
    expectIncludes(REKA_DECK_IDS, ["A_b_03"]);
    expectIncludes(FULDRA_DECK_IDS, ["A_b_03", "A_o_04", "A_o_05", "A_o_06"]);
    expectIncludes(ELDR_THORIN_DECK_IDS, ["A_o_01", "A_o_02", "A_o_03"]);
  });
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

  it("艾德圖林每打出 1 張裝備牌 +20 爐火，每回合開始 +5，封頂 100", () => {
    const hero = { defId: "eldr-thorin", hp: 90, maxHp: 90, atk: 10, def: 10, cmd: 0, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    const def = HEROES["eldr-thorin"]!;
    const max = getRace("dwarf").gauge.max;
    addGauge(hero, max, def.gauge.onEquipmentPlay ?? 0);
    expect(hero.gaugeValue).toBe(20);
    addGauge(hero, max, def.gauge.onTurnStart ?? 0);
    expect(hero.gaugeValue).toBe(25);
    addGauge(hero, max, 90);
    expect(hero.gaugeValue).toBe(100);
  });

  it("芙爾卓受傷跨 5 個 10% 階段（HP 50% 流失）血怒 +5，並於友軍/敵兵死亡分別 +1，封頂 10", () => {
    const hero = { defId: "fuldra", hp: 60, maxHp: 120, atk: 14, def: 9, cmd: 8, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    gaugeOnHeroDamaged(hero, 10, { perPct: 10, perValue: 1 }, 120, 60);
    expect(hero.gaugeValue).toBe(5);
    const def = HEROES.fuldra!;
    const max = getRace("beast").gauge.max;
    // 友軍兵力被摧毀 1 次
    addGauge(hero, max, def.gauge.onTroopDestroyedAlly ?? 0);
    expect(hero.gaugeValue).toBe(6);
    // 自家擊殺敵兵 1 次
    addGauge(hero, max, def.gauge.onTroopDestroyedSelf ?? 0);
    expect(hero.gaugeValue).toBe(7);
    // 封頂 10
    addGauge(hero, max, 99);
    expect(hero.gaugeValue).toBe(10);
  });

  it("曇每回合開始、施法、兵力進場累積靈蘊，且封頂 100", () => {
    const hero = { defId: "butterfly-yao", hp: 80, maxHp: 80, atk: 10, def: 5, cmd: 6, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false, feyForm: "human" as const } };
    const def = HEROES["butterfly-yao"]!;
    const max = getRace("fey").gauge.max;
    addGauge(hero, max, def.gauge.onTurnStart ?? 0);
    addGauge(hero, max, def.gauge.onSpellCast ?? 0);
    addGauge(hero, max, def.gauge.onTroopEnter ?? 0);
    expect(hero.gaugeValue).toBe(18);
    addGauge(hero, max, 90);
    expect(hero.gaugeValue).toBe(100);
  });
});

describe("英雄技能 — 主動效果定義", () => {
  it("露露 act_sacred_blade_thrust：聖劍突刺無視守護", () => {
    const skill = HEROES.lulu!.actives.find((s) => s.id === "act_sacred_blade_thrust")!;
    expect(skill.cost.morale).toBe(25);
    expect(skill.effects[0]).toMatchObject({ kind: "damage", ignoreGuard: true });
  });

  it("lulu act_lowest_loss_command costs 10 gauge and no longer grants gauge", () => {
    const skill = HEROES.lulu!.actives.find((s) => s.id === "act_lowest_loss_command")!;
    expect(skill.cost).toMatchObject({ morale: 30, gauge: 10 });
    expect(skill.effects).toEqual([
      { kind: "draw", count: 1 },
      { kind: "armor", amount: 8 },
    ]);
  });

  it("lulu act_first_legion_line costs 25 gauge and lasts 2 turns", () => {
    const skill = HEROES.lulu!.actives.find((s) => s.id === "act_first_legion_line")!;
    expect(skill.cost).toMatchObject({ morale: 40, gauge: 25 });
    expect(skill.effects[0]).toMatchObject({ kind: "buff", duration: { kind: "turns", count: 2 } });
    expect(skill.effects[1]).toMatchObject({ kind: "addKeyword", keyword: "guard", duration: { kind: "turns", count: 2 } });
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

  it("曇 act_moonlit_fold 切換形態並觸發鱗粉記憶", () => {
    const skill = HEROES["butterfly-yao"]!.actives.find((s) => s.id === "act_moonlit_fold")!;
    expect(skill.cost.morale).toBe(20);
    expect(skill.effects).toEqual(expect.arrayContaining([
      { kind: "scripted", tag: "Y_FORM_TOGGLE" },
      { kind: "scripted", tag: "TAN_FORM_MEMORY" },
      { kind: "gauge", delta: 10, side: "self" },
    ]));
  });

  it("曇 act_guest_of_night_mirror 消耗 30 靈蘊並召喚形態單位", () => {
    const skill = HEROES["butterfly-yao"]!.actives.find((s) => s.id === "act_guest_of_night_mirror")!;
    expect(skill.cost).toMatchObject({ morale: 35, gauge: 30 });
    expect(skill.effects[0]).toEqual({ kind: "scripted", tag: "Y_HUNDRED_GHOSTS" });
  });

  it("芙爾卓 act_spatial_lock：戰線壓制造成 ATK 傷害並標記目標", () => {
    const skill = HEROES.fuldra!.actives.find((s) => s.id === "act_spatial_lock")!;
    expect(skill.cost.morale).toBe(30);
    expect(skill.effects[0]).toMatchObject({ kind: "damage", amount: { kind: "atk", bonus: 4 } });
    expect(skill.effects[1]).toMatchObject({ kind: "addStatus", status: "marked", duration: { kind: "turns", count: 1 } });
  });

  it("芙爾卓 act_dragonbreath_sweep：龍息掃蕩消耗 3 血怒並對全敵兵 ATK 傷害無視 DEF", () => {
    const skill = HEROES.fuldra!.actives.find((s) => s.id === "act_dragonbreath_sweep")!;
    expect(skill.cost).toMatchObject({ morale: 40, gauge: 3 });
    expect(skill.effects[0]).toMatchObject({ kind: "damage", ignoreDef: true, amount: { kind: "atk" } });
  });

  it("芙爾卓 act_northern_fortress_array：消耗 3 血怒並給我方兵力 2T DEF+3 守護", () => {
    const skill = HEROES.fuldra!.actives.find((s) => s.id === "act_northern_fortress_array")!;
    expect(skill.cost).toMatchObject({ morale: 40, gauge: 3 });
    expect(skill.effects[0]).toMatchObject({ kind: "buff", duration: { kind: "turns", count: 2 } });
    expect(skill.effects[1]).toMatchObject({ kind: "addKeyword", keyword: "guard", duration: { kind: "turns", count: 2 } });
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
    expect(ult.effects[1]).toEqual({ kind: "destroyField", side: "enemy" });
  });

  it("曇「破繭前的空白」會凍結敵方下回合魔力回復與兵力牌", () => {
    const ult = HEROES["butterfly-yao"]!.ultimate;
    expect(ult.cost.morale).toBe(100);
    expect(ult.effects[0]).toEqual({ kind: "scripted", tag: "TAN_BLANK_BEFORE_PUPATION" });
    expect(ult.effects).toEqual(expect.arrayContaining([
      { kind: "summon", cardId: "T_s_31", count: 2, side: "self" },
      { kind: "heal", target: { kind: "self" }, amount: { kind: "const", value: 18 } },
      { kind: "draw", count: 1 },
    ]));
  });

  it("芙爾卓「黑龍真身」對英雄造成 ATK×1.5 + 血怒×2，AoE 15 無視 DEF，並回 20 HP", () => {
    const ult = HEROES.fuldra!.ultimate;
    expect(ult.cost.morale).toBe(100);
    expect(ult.effects).toEqual(expect.arrayContaining([
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "atk", mult: 1.5 }, ignoreGuard: true },
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "rage", mult: 2 }, ignoreGuard: true },
      { kind: "heal", target: { kind: "self" }, amount: { kind: "const", value: 20 } },
    ]));
    const aoe = ult.effects.find((e) => e.kind === "damage" && e.target.kind === "all");
    expect(aoe).toMatchObject({ kind: "damage", ignoreDef: true, amount: { kind: "const", value: 15 } });
  });
});
