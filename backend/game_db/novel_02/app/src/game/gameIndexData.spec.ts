import { describe, expect, it } from "vitest";
import { ALL_CARDS, ENEMY_INTERNAL_CARDS } from "../data/cards";
import { buildGameIndexData } from "./gameIndexData";

describe("gameIndexData", () => {
  it("涵蓋所有玩家可用卡與敵方/內部卡", () => {
    const data = buildGameIndexData();
    const indexedPlayableIds = new Set(data.playableCards.map((entry) => entry.card.id));
    const indexedEnemyIds = new Set(data.enemyInternalCards.map((entry) => entry.card.id));

    expect(data.playableCards).toHaveLength(ALL_CARDS.length);
    expect(data.enemyInternalCards).toHaveLength(ENEMY_INTERNAL_CARDS.length);
    expect(data.stats.playableCards).toBe(ALL_CARDS.length);
    expect(data.stats.enemyInternalCards).toBe(ENEMY_INTERNAL_CARDS.length);
    expect(data.stats.totalCards).toBe(ALL_CARDS.length + ENEMY_INTERNAL_CARDS.length);

    for (const card of ALL_CARDS) expect(indexedPlayableIds.has(card.id)).toBe(true);
    for (const card of ENEMY_INTERNAL_CARDS) expect(indexedEnemyIds.has(card.id)).toBe(true);
  });

  it("卡牌 ID 不重複，統計總數等於索引總數", () => {
    const data = buildGameIndexData();
    const ids = data.cards.map((entry) => entry.card.id);
    const typeTotal = Object.values(data.stats.byType).reduce((sum, count) => sum + count, 0);
    const rarityTotal = Object.values(data.stats.byRarity).reduce((sum, count) => sum + count, 0);
    const costTotal = Object.values(data.stats.byCost).reduce((sum, count) => sum + count, 0);

    expect(new Set(ids).size).toBe(ids.length);
    expect(typeTotal).toBe(data.cards.length);
    expect(rarityTotal).toBe(data.cards.length);
    expect(costTotal).toBe(data.cards.length);
  });

  it("每張卡都能產生非空展示摘要", () => {
    const data = buildGameIndexData();

    for (const entry of data.cards) {
      expect(entry.effectSummary.length).toBeGreaterThan(0);
      expect(entry.effectSummary.every((line) => line.trim().length > 0)).toBe(true);
      expect(entry.searchableText).toContain(entry.card.name.toLowerCase());
    }
  });

  it("規則索引包含目前實裝的核心面向", () => {
    const data = buildGameIndexData();
    const ids = new Set(data.ruleSections.map((section) => section.id));

    expect(ids).toEqual(new Set(["turn", "combat", "resources", "corruption", "ai", "victory"]));
    for (const section of data.ruleSections) {
      expect(section.title.trim().length).toBeGreaterThan(0);
      expect(section.items.length).toBeGreaterThan(0);
    }
  });
});
