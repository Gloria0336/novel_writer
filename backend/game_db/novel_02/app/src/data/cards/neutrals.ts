import type { Card } from "../../core/types/card";

/**
 * 中立傳說卡 T_l_01-S_l_04（每張限 1 份；任何種族可用）。
 */
export const NEUTRAL_LEGENDS: Card[] = [
  {
    id: "T_l_01", type: "troop", name: "大陸浮游鯨", cost: 8, rarity: "legendary",
    hp: 35, atk: 12, def: 8, keywords: ["guard"],
    onPlay: [
      { kind: "heal", target: { kind: "all", filter: { side: "self", entity: "troop" } }, amount: { kind: "const", value: 999 } },
    ],
    passive: [{ kind: "scripted", tag: "UNTARGETABLE_BY_SPELL" }],
  },
  {
    id: "S_l_01", type: "spell", name: "命運之輪", cost: 5, rarity: "legendary",
    effects: [
      { kind: "scripted", tag: "DESTROY_HIGHEST_ATK_BOTH" },
      { kind: "draw", count: 2 },
      { kind: "scripted", tag: "ENEMY_DRAW", payload: { count: 2 } },
    ],
  },
  {
    id: "S_l_02", type: "spell", name: "虛空行者的遺書", cost: 4, rarity: "legendary",
    effects: [
      { kind: "scripted", tag: "GRANT_IGNORE_GUARD_THIS_TURN" },
      { kind: "draw", count: 1 },
    ],
  },
  {
    id: "E_l_01", type: "equipment", name: "雙月遺物", cost: 5, rarity: "legendary",
    slot: "trinket", modifiers: {},
    passive: [{ kind: "scripted", tag: "MOON_RELIC" }],
  },
  {
    id: "S_l_03", type: "spell", name: "次元壁碎片", cost: 3, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "DIMENSION_SHARD" }],
  },
  {
    id: "S_l_04", type: "spell", name: "末日倒數", cost: 6, rarity: "legendary",
    effects: [
      { kind: "scripted", tag: "DOOMSDAY_START", payload: { turns: 3, damage: 50 } },
      { kind: "summon", cardId: "T_s_33", count: 1, side: "self" },
    ],
  },
];
