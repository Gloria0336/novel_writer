import { describe, expect, it } from "vitest";
import type { TroopInstance } from "../core/types/battle";
import type { HeroInstance } from "../core/types/hero";
import { buildHeroStatusIndicators, buildTroopStatusIndicators } from "./statusIndicators";

function hero(overrides: Partial<HeroInstance> = {}): HeroInstance {
  return {
    defId: "hero",
    hp: 80,
    maxHp: 80,
    atk: 5,
    def: 3,
    cmd: 4,
    morale: 0,
    gaugeValue: 0,
    armor: 0,
    buffs: [],
    equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false },
    ...overrides,
  };
}

function troop(overrides: Partial<TroopInstance> = {}): TroopInstance {
  return {
    instanceId: "t1",
    cardId: "T01",
    hp: 10,
    maxHp: 10,
    atk: 3,
    def: 1,
    keywords: new Set(),
    hasAttackedThisTurn: false,
    summonedThisTurn: false,
    frozenTurns: 0,
    buffs: [],
    keywordBuffs: [],
    ...overrides,
  };
}

describe("status indicator builders", () => {
  it("turns hero stat buffs into readable indicators", () => {
    const indicators = buildHeroStatusIndicators(hero({
      buffs: [{ id: "b1", source: "S14", mod: { atk: 5 }, remainingTurns: 3 }],
    }), (source) => source === "S14" ? "盟約之誓" : undefined);

    expect(indicators[0]).toMatchObject({
      owner: "hero",
      tone: "buff",
      label: "ATK+5",
      title: "ATK提升",
      details: ["來源：盟約之誓", "效果：ATK +5", "剩餘：3 回合"],
    });
  });

  it("turns hero ability freezes into control indicators", () => {
    const indicators = buildHeroStatusIndicators(hero({
      flags: {
        ultimateUsed: false,
        immortalUsed: false,
        heroAbilityFreeze: { action: 2 },
      },
    }));

    expect(indicators[0]).toMatchObject({
      owner: "hero",
      tone: "control",
      label: "行動",
      title: "凍結-封鎖",
      remainingTurns: 2,
    });
    expect(indicators[0]?.details.at(-1)).toBe("剩餘：2 回合");
  });

  it("distinguishes troop buff, debuff, and mixed stat modifiers", () => {
    const indicators = buildTroopStatusIndicators(troop({
      buffs: [
        { id: "b1", source: "A", mod: { atk: 2 }, remainingTurns: 2 },
        { id: "b2", source: "B", mod: { atk: -2 }, remainingTurns: 2 },
        { id: "b3", source: "C", mod: { atk: 4, def: -1 }, remainingTurns: 2 },
      ],
    }));

    expect(indicators.map((indicator) => indicator.tone)).toEqual(["buff", "debuff", "mixed"]);
    expect(indicators.map((indicator) => indicator.label)).toEqual(["ATK+2", "ATK-2", "ATK+4 DEF-1"]);
  });

  it("turns temporary troop keywords into keyword indicators", () => {
    const indicators = buildTroopStatusIndicators(troop({
      keywordBuffs: [{ id: "k1", source: "H05", keyword: "guard", remainingTurns: 1 }],
    }), (source) => source === "H05" ? "軍團盾陣" : undefined);

    expect(indicators[0]).toMatchObject({
      owner: "troop",
      tone: "keyword",
      title: expect.stringContaining("暫時關鍵字"),
      details: expect.arrayContaining(["來源：軍團盾陣", "剩餘：本回合"]),
    });
  });

  it("turns frozenTurns into a troop control indicator", () => {
    const indicators = buildTroopStatusIndicators(troop({ frozenTurns: 2 }));

    expect(indicators[0]).toMatchObject({
      owner: "troop",
      tone: "control",
      label: "凍結",
      title: "凍結",
      details: ["來源：控制效果", "效果：凍結，無法攻擊", "剩餘：2 回合"],
    });
  });

  it("uses freeze display names as subcategories without changing the core status", () => {
    const indicators = buildTroopStatusIndicators(troop({ frozenTurns: 2, frozenDisplayName: "定身" }));

    expect(indicators[0]).toMatchObject({
      owner: "troop",
      tone: "control",
      label: "定身",
      title: "凍結-定身",
      details: ["來源：控制效果", "效果：凍結-定身，無法攻擊", "剩餘：2 回合"],
    });
  });

  it("formats long-running durations as ongoing", () => {
    const indicators = buildTroopStatusIndicators(troop({
      buffs: [
        { id: "b1", source: "RIFT_BUFF", mod: { atk: 2 }, remainingTurns: 9999 },
        { id: "b2", source: "FULL_GAUGE_BUFF:x", mod: { def: 2 }, remainingTurns: Number.MAX_SAFE_INTEGER },
      ],
    }));

    expect(indicators[0]?.details.at(-1)).toBe("剩餘：持續");
    expect(indicators[1]?.details.at(-1)).toBe("剩餘：持續");
  });
});
