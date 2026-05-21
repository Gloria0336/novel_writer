import { describe, expect, it } from "vitest";
import {
  ALL_CARDS, DEMON_CARDS, ENEMY_INTERNAL_CARDS, GENERIC_CARDS, NEUTRAL_LEGENDS,
  HUMAN_CARDS, ELF_CARDS, DWARF_CARDS, FEY_CARDS, BEAST_CARDS, DEMIGOD_CARDS,
} from "../index";
import { ensureScriptedRegistered } from "../../../game/seed";

const CARD_ID_PATTERN = /^(A|F|T|S|E)_(c|h|e|dw|f|b|de|g|m|l|s|o)_\d{2}$/;

describe("種族卡與中立傳說擴展", () => {
  it("M 章升級後種族卡數量正確", () => {
    expect(HUMAN_CARDS).toHaveLength(12);
    expect(ELF_CARDS).toHaveLength(14);
    expect(DWARF_CARDS).toHaveLength(10);
    expect(FEY_CARDS).toHaveLength(15);
    expect(BEAST_CARDS).toHaveLength(11);
    expect(DEMIGOD_CARDS).toHaveLength(10);
  });

  it("中立傳說卡 = 6 張", () => {
    expect(NEUTRAL_LEGENDS).toHaveLength(6);
  });

  it("總卡池 = 通用 104 + 種族 68 + 職業 6 + 中立 6 = 184 張（v3.4 M）", () => {
    expect(GENERIC_CARDS).toHaveLength(109);
    expect(ALL_CARDS).toHaveLength(193);
  });

  it("所有卡 id 唯一且符合命名規則", () => {
    const ids = [...ALL_CARDS, ...ENEMY_INTERNAL_CARDS, ...DEMON_CARDS].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => CARD_ID_PATTERN.test(id))).toBe(true);
  });

  it("中立傳說 T_l_01-S_l_04 全部為 legendary 稀有度", () => {
    expect(NEUTRAL_LEGENDS.every((c) => c.rarity === "legendary")).toBe(true);
  });

  it("人類卡分類：5 兵力 + 2 行動 + 4 法術 + 1 裝備", () => {
    const byType = HUMAN_CARDS.reduce<Record<string, number>>((a, c) => { a[c.type] = (a[c.type] ?? 0) + 1; return a; }, {});
    expect(byType.troop).toBe(5);
    expect(byType.action).toBe(2);
    expect(byType.spell).toBe(4);
    expect(byType.equipment).toBe(1);
  });

  it("ensureScriptedRegistered 不丟錯", () => {
    expect(() => ensureScriptedRegistered()).not.toThrow();
  });
});
