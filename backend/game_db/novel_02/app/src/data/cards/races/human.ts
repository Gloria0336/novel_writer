import type { Card } from "../../../core/types/card";

/**
 * 人類種族卡 H01-H10
 * 設計主軸：大量兵力、群體增益、軍團協同。與軍令量表互動。
 */
export const HUMAN_CARDS: Card[] = [
  {
    id: "H01", type: "troop", name: "帝國民兵隊", cost: 1, rarity: "common",
    hp: 6, atk: 2, def: 2, keywords: [],
    onPlay: [{ kind: "gauge", delta: 5, side: "self" }],
  },
  {
    id: "H02", type: "troop", name: "帝國步兵連", cost: 3, rarity: "common",
    hp: 15, atk: 5, def: 3, keywords: [],
    onPlay: [{ kind: "summon", cardId: "T01", count: 1, side: "self" }],
  },
  {
    id: "H03", type: "troop", name: "帝國弩砲", cost: 4, rarity: "uncommon",
    hp: 12, atk: 9, def: 2, keywords: ["pierce", "siege"],
  },
  {
    id: "H04", type: "troop", name: "聖殿騎士", cost: 5, rarity: "uncommon",
    hp: 20, atk: 7, def: 6, keywords: ["guard"],
    passive: [{ kind: "scripted", tag: "ATK_PER_ALLY" }],
  },
  {
    id: "H05", type: "spell", name: "民兵徵召", cost: 2, rarity: "common",
    effects: [
      { kind: "summon", cardId: "T01", count: 2, side: "self" },
      { kind: "gauge", delta: 10, side: "self" },
    ],
  },
  {
    id: "H06", type: "spell", name: "堅守陣型", cost: 2, rarity: "uncommon",
    effects: [
      { kind: "addKeyword", target: { kind: "all", filter: { side: "self", entity: "troop" } }, keyword: "guard", duration: { kind: "thisTurn" } },
      { kind: "gauge", delta: 10, side: "self" },
    ],
  },
  {
    id: "H07", type: "spell", name: "軍團集結", cost: 3, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "LEGION_RALLY" }],
  },
  {
    id: "H08", type: "spell", name: "帝國動員令", cost: 5, rarity: "rare",
    effects: [
      { kind: "scripted", tag: "DRAW_TROOPS", payload: { count: 3 } },
      { kind: "scripted", tag: "DEPLOY_DISCOUNT_THIS_TURN", payload: { amount: 2 } },
      { kind: "gauge", delta: 20, side: "self" },
    ],
  },
  {
    id: "H09", type: "troop", name: "皇家禁衛軍團", cost: 6, rarity: "rare",
    hp: 25, atk: 8, def: 7, keywords: ["guard"],
    onPlay: [
      { kind: "heal", target: { kind: "all", filter: { side: "self", entity: "troop" } }, amount: { kind: "const", value: 5 } },
      { kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 2 }, duration: { kind: "permanent" } },
      { kind: "gauge", delta: 15, side: "self" },
    ],
  },
  {
    id: "H10", type: "equipment", name: "盟約之劍", cost: 7, rarity: "legendary",
    slot: "weapon", modifiers: { atk: 8 },
    passive: [{ kind: "scripted", tag: "OATH_BLADE" }],
  },
];
