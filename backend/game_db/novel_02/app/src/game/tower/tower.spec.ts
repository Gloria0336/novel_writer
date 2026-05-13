import { describe, expect, it } from "vitest";
import { FLOOR_TABLE, getFloorEntry, OMEN_LIST } from "./towerData";
import { scaleForFloor, pickOmen } from "./towerScaling";
import { generateRewards, applyReward } from "./towerRewards";
import type { HeroInstance } from "../../core/types/hero";

describe("§F.1 試煉塔資料表", () => {
  it("FLOOR_TABLE 含 30 層", () => {
    expect(FLOOR_TABLE).toHaveLength(30);
  });

  it("第 5/10/15/20/25/30 層為 Boss", () => {
    for (const f of [5, 10, 15, 20, 25, 30]) {
      expect(getFloorEntry(f).kind).toBe("boss");
    }
  });

  it("非 5 倍數層為巢穴", () => {
    for (let f = 1; f <= 30; f++) {
      if (f % 5 === 0) continue;
      expect(getFloorEntry(f).kind).toBe("lair");
    }
  });

  it("6 個天象事件已定義", () => {
    expect(OMEN_LIST).toHaveLength(6);
  });
});

describe("§F.1 難度縮放", () => {
  it("第 1 層巢穴：HP 與 ATK 都是 1.0×", () => {
    const s = scaleForFloor({ floor: 1, kind: "lair", enemyId: "x" });
    expect(s.hpMult).toBeCloseTo(1.0);
    expect(s.atkMult).toBeCloseTo(1.0);
  });

  it("第 10 層 Boss：HP 多 10%（× 1.1）", () => {
    const s = scaleForFloor({ floor: 10, kind: "boss", enemyId: "x" });
    // base hp = 1 + 0.04 * 9 = 1.36；boss × 1.1 = 1.496
    expect(s.hpMult).toBeCloseTo(1.496);
  });

  it("第 30 層 Boss：HP/ATK 均放大", () => {
    const s = scaleForFloor({ floor: 30, kind: "boss", enemyId: "x" });
    expect(s.hpMult).toBeGreaterThan(2);
    expect(s.atkMult).toBeGreaterThan(1.7);
  });
});

describe("§F.1 天象抽取", () => {
  it("Boss 層 100% 觸發天象", () => {
    const { omen } = pickOmen(42, { floor: 5, kind: "boss", enemyId: "x" });
    expect(omen).not.toBeNull();
  });

  it("Boss 層連續多種子皆觸發", () => {
    for (let seed = 1; seed < 20; seed++) {
      const r = pickOmen(seed, { floor: 5, kind: "boss", enemyId: "x" });
      expect(r.omen).not.toBeNull();
    }
  });
});

describe("§F.1 獎勵生成與套用", () => {
  it("generateRewards 一定產生 3 個選項，且含保底治療", () => {
    const { rewards } = generateRewards(123, 5);
    expect(rewards).toHaveLength(3);
    expect(rewards[0]!.kind).toBe("heal");
  });

  it("applyReward heal：HP 增加但不超過 maxHp", () => {
    const hero = makeHero({ hp: 50, maxHp: 80 });
    const r = applyReward({ kind: "heal", amount: 100 }, hero, []);
    expect(r.hero.hp).toBe(80);
  });

  it("applyReward buffMaxHp：maxHp 與 HP 同時增加", () => {
    const hero = makeHero({ hp: 50, maxHp: 80 });
    const r = applyReward({ kind: "buffMaxHp", amount: 10 }, hero, []);
    expect(r.hero.maxHp).toBe(90);
    expect(r.hero.hp).toBe(60);
  });

  it("applyReward addCard：deckIds 新增", () => {
    const hero = makeHero({ hp: 50, maxHp: 80 });
    const r = applyReward({ kind: "addCard", cardId: "T01" }, hero, ["T01"]);
    expect(r.deckIds).toHaveLength(2);
    expect(r.deckIds).toEqual(["T01", "T01"]);
  });
});

function makeHero(over: Partial<HeroInstance>): HeroInstance {
  return {
    defId: "x",
    hp: 80, maxHp: 80,
    atk: 10, def: 5, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false },
    ...over,
  };
}
