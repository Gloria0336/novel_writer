import { describe, expect, it } from "vitest";
import { BASE_STATS, composeHeroStats, manaCapFor } from "./compose";
import { HERO_ARCHMAGE, HERO_BLOOD_CHIEF, HERO_COMMANDER } from "../../data/heroes";
import { CLASSES, getClass } from "../../data/classes";
import { RACES, getRace } from "../../data/races";
import type { HeroDefinition } from "../types/hero";

describe("composeHeroStats — 三位 Demo 英雄符合設計文件 §C.5", () => {
  it("軍團統帥 (人類·指揮官·SR, 個體 0/0/0/0) → HP 80 / ATK 6 / DEF 5 / CMD 9", () => {
    const stats = composeHeroStats(HERO_COMMANDER, getRace("human"), getClass("commander"));
    expect(stats).toEqual({ hp: 80, atk: 6, def: 5, cmd: 9 });
  });

  it("大賢者 (精靈·法師·SR, 個體 0/0/0/0) → HP 60 / ATK 7 / DEF 3 / CMD 4", () => {
    const stats = composeHeroStats(HERO_ARCHMAGE, getRace("elf"), getClass("mage"));
    expect(stats).toEqual({ hp: 60, atk: 7, def: 3, cmd: 4 });
  });

  it("蠻血酋長 (獸族·狂戰士·SR, 個體 0/0/0/0) → HP 110 / ATK 19 / DEF 1 / CMD 5", () => {
    const stats = composeHeroStats(HERO_BLOOD_CHIEF, getRace("beast"), getClass("berserker"));
    expect(stats).toEqual({ hp: 110, atk: 19, def: 1, cmd: 5 });
  });
});

describe("composeHeroStats — 數值合成基礎規則", () => {
  it("所有計算都從 BASE_STATS = 80/10/5/5 起算", () => {
    expect(BASE_STATS).toEqual({ hp: 80, atk: 10, def: 5, cmd: 5 });
  });

  it("DEF 不會低於 1（受最低界限保護）", () => {
    const synthetic = {
      ...HERO_BLOOD_CHIEF,
      statTuning: { def: -10 },
    };
    const stats = composeHeroStats(synthetic, getRace("beast"), getClass("berserker"));
    expect(stats.def).toBeGreaterThanOrEqual(1);
  });

  it("種族與英雄不匹配時應拋錯", () => {
    expect(() => composeHeroStats(HERO_COMMANDER, getRace("elf"), getClass("commander"))).toThrow();
  });

  it("職業與英雄不匹配時應拋錯", () => {
    expect(() => composeHeroStats(HERO_COMMANDER, getRace("human"), getClass("mage"))).toThrow();
  });

  it("個體微調可加可減", () => {
    const synthetic = { ...HERO_COMMANDER, statTuning: { hp: 5, atk: -1, def: 2, cmd: -1 } };
    const stats = composeHeroStats(synthetic, getRace("human"), getClass("commander"));
    expect(stats.hp).toBe(85);
    expect(stats.atk).toBe(5);
    expect(stats.def).toBe(7);
    expect(stats.cmd).toBe(8);
  });
});

describe("composeHeroStats — §G.2 種族×職業速查表抽樣驗證", () => {
  it("矮人·鍛造師基礎值 → HP 110 / ATK 10 / DEF 10 / CMD 5", () => {
    const dummyHero: HeroDefinition = {
      id: "x", name: "x", raceId: "dwarf", classId: "smith", rarity: "R",
      statTuning: {}, gauge: { description: "" }, passives: [], actives: [],
      ultimate: { id: "x", name: "x", description: "", cost: {}, effects: [] },
    };
    const stats = composeHeroStats(dummyHero, getRace("dwarf"), getClass("smith"));
    expect(stats).toEqual({ hp: 110, atk: 10, def: 10, cmd: 5 });
  });

  it("半神族·神官基礎值 → HP 125 / ATK 16 / DEF 9 / CMD 2", () => {
    const dummyHero: HeroDefinition = {
      id: "x", name: "x", raceId: "demigod", classId: "priest", rarity: "R",
      statTuning: {}, gauge: { description: "" }, passives: [], actives: [],
      ultimate: { id: "x", name: "x", description: "", cost: {}, effects: [] },
    };
    const stats = composeHeroStats(dummyHero, getRace("demigod"), getClass("priest"));
    expect(stats).toEqual({ hp: 125, atk: 16, def: 9, cmd: 2 });
  });

  it("妖族·幻術師基礎值 → HP 85 / ATK 12 / DEF 5 / CMD 5", () => {
    const dummyHero: HeroDefinition = {
      id: "x", name: "x", raceId: "fey", classId: "illusionist", rarity: "R",
      statTuning: {}, gauge: { description: "" }, passives: [], actives: [],
      ultimate: { id: "x", name: "x", description: "", cost: {}, effects: [] },
    };
    const stats = composeHeroStats(dummyHero, getRace("fey"), getClass("illusionist"));
    expect(stats).toEqual({ hp: 85, atk: 12, def: 5, cmd: 5 });
  });
});

describe("manaCapFor — 魔力上限規則", () => {
  it("第 1 回合上限為 1（一般種族）", () => {
    expect(manaCapFor(getRace("human"), 1)).toBe(1);
  });

  it("第 10 回合一般種族封頂於 10", () => {
    expect(manaCapFor(getRace("human"), 10)).toBe(10);
  });

  it("第 11 回合一般種族仍為 10", () => {
    expect(manaCapFor(getRace("human"), 11)).toBe(10);
  });

  it("精靈第 13 回合可達 13", () => {
    expect(manaCapFor(getRace("elf"), 13)).toBe(13);
  });

  it("精靈第 14 回合仍封頂於 13", () => {
    expect(manaCapFor(getRace("elf"), 14)).toBe(13);
  });
});

describe("資料完整性", () => {
  it("6 個種族框架都已定義", () => {
    expect(Object.keys(RACES)).toHaveLength(6);
  });
  it("6 個職業框架都已定義", () => {
    expect(Object.keys(CLASSES)).toHaveLength(6);
  });
});
