import { describe, expect, it } from "vitest";
import {
  ALL_CARDS, GENERIC_CARDS, NEUTRAL_LEGENDS,
  HUMAN_CARDS, ELF_CARDS, DWARF_CARDS, FEY_CARDS, BEAST_CARDS, DEMIGOD_CARDS,
} from "../index";
import { ensureScriptedRegistered } from "../../../game/seed";

describe("種族卡與中立傳說擴展", () => {
  it("每族種族卡 = 10 張", () => {
    expect(HUMAN_CARDS).toHaveLength(10);
    expect(ELF_CARDS).toHaveLength(10);
    expect(DWARF_CARDS).toHaveLength(10);
    expect(FEY_CARDS).toHaveLength(10);
    expect(BEAST_CARDS).toHaveLength(10);
    expect(DEMIGOD_CARDS).toHaveLength(10);
  });

  it("中立傳說卡 = 6 張", () => {
    expect(NEUTRAL_LEGENDS).toHaveLength(6);
  });

  it("總卡池 = 通用 94 + 種族 60 + 中立 6 = 160 張", () => {
    expect(GENERIC_CARDS).toHaveLength(94);
    expect(ALL_CARDS).toHaveLength(160);
  });

  it("所有卡 id 唯一", () => {
    const ids = ALL_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("中立傳說 N01-N06 全部為 legendary 稀有度", () => {
    expect(NEUTRAL_LEGENDS.every((c) => c.rarity === "legendary")).toBe(true);
  });

  it("人類卡分類：5 兵力 + 4 法術 + 1 裝備", () => {
    const byType = HUMAN_CARDS.reduce<Record<string, number>>((a, c) => { a[c.type] = (a[c.type] ?? 0) + 1; return a; }, {});
    expect(byType.troop).toBe(5);
    expect(byType.spell).toBe(4);
    expect(byType.equipment).toBe(1);
  });

  it("ensureScriptedRegistered 不丟錯", () => {
    expect(() => ensureScriptedRegistered()).not.toThrow();
  });
});
