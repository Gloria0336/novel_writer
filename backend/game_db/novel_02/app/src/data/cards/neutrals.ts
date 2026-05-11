import type { Card } from "../../core/types/card";

/**
 * 中立傳說卡 N01-N06（每張限 1 份；任何種族可用）。
 */
export const NEUTRAL_LEGENDS: Card[] = [
  {
    id: "N01", type: "troop", name: "大陸浮游鯨", cost: 8, rarity: "legendary",
    hp: 35, atk: 12, def: 8, keywords: ["guard"],
    onPlay: [
      { kind: "heal", target: { kind: "all", filter: { side: "self", entity: "troop" } }, amount: { kind: "const", value: 999 } },
    ],
    passive: [{ kind: "scripted", tag: "UNTARGETABLE_BY_SPELL" }],
  },
  {
    id: "N02", type: "spell", name: "命運之輪", cost: 5, rarity: "legendary",
    effects: [
      { kind: "scripted", tag: "DESTROY_HIGHEST_ATK_BOTH" },
      { kind: "draw", count: 2 },
      { kind: "scripted", tag: "ENEMY_DRAW", payload: { count: 2 } },
    ],
  },
  {
    id: "N03", type: "spell", name: "虛空行者的遺書", cost: 4, rarity: "legendary",
    effects: [
      { kind: "scripted", tag: "GRANT_IGNORE_GUARD_THIS_TURN" },
      { kind: "draw", count: 1 },
    ],
  },
  {
    id: "N04", type: "equipment", name: "雙月遺物", cost: 5, rarity: "legendary",
    slot: "trinket", modifiers: {},
    passive: [{ kind: "scripted", tag: "MOON_RELIC" }],
  },
  {
    id: "N05", type: "spell", name: "次元壁碎片", cost: 3, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "DIMENSION_SHARD" }],
  },
  {
    id: "N06", type: "spell", name: "末日倒數", cost: 6, rarity: "legendary",
    effects: [
      { kind: "scripted", tag: "DOOMSDAY_START", payload: { turns: 3, damage: 50 } },
      { kind: "summon", cardId: "I_DOOM_MARK", count: 1, side: "self" },
    ],
  },
];
