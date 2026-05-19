import type { Card } from "../../../core/types/card";

/**
 * 精靈種族卡 S_e_01-S_e_07
 * 設計主軸：法術連鎖、手牌操作、共鳴疊加。與共鳴量表互動。
 */
export const ELF_CARDS: Card[] = [
  {
    id: "S_e_01", type: "spell", name: "星辰低語", cost: 1, rarity: "common",
    effects: [
      { kind: "gauge", delta: 2, side: "self" },
      { kind: "search", predicate: { type: "spell" }, toHand: true },
    ],
  },
  {
    id: "S_e_02", type: "spell", name: "月光矢", cost: 1, rarity: "common",
    effects: [{ kind: "scripted", tag: "MOONLIGHT_ARROW" }],
  },
  {
    id: "T_e_01", type: "troop", name: "精靈弓手", cost: 3, rarity: "uncommon",
    hp: 10, atk: 6, def: 1, keywords: [],
    passive: [{ kind: "scripted", tag: "ATK_PER_SPELL_CAST" }],
  },
  {
    id: "S_e_03", type: "spell", name: "古語銘刻", cost: 2, rarity: "uncommon",
    effects: [
      { kind: "scripted", tag: "DOUBLE_NEXT_SPELL" },
      { kind: "gauge", delta: 1, side: "self" },
    ],
  },
  {
    id: "S_e_04", type: "spell", name: "大圖書館", cost: 4, rarity: "uncommon",
    effects: [
      { kind: "search", predicate: { type: "spell" }, toHand: true },
      { kind: "search", predicate: { type: "spell" }, toHand: true },
    ],
  },
  {
    id: "F_e_01", type: "field", name: "精靈結界", cost: 4, rarity: "uncommon",
    placement: "self",
    effects: [{ kind: "scripted", tag: "FIELD_ELVEN_WARD" }],
  },
  {
    id: "T_e_02", type: "troop", name: "星辰守衛", cost: 4, rarity: "uncommon",
    hp: 14, atk: 4, def: 4, keywords: ["guard"],
    passive: [{ kind: "scripted", tag: "HP_PER_SPELL_CAST" }],
  },
  {
    id: "S_e_05", type: "spell", name: "萬年詠唱", cost: 5, rarity: "rare",
    effects: [
      { kind: "scripted", tag: "RESONANCE_NO_RESET" },
      { kind: "draw", count: 1 },
    ],
  },
  {
    id: "S_e_06", type: "spell", name: "精靈輓歌", cost: 5, rarity: "rare",
    effects: [
      { kind: "damage", target: { kind: "all", filter: { side: "enemy" } }, amount: { kind: "spellsCastThisGame", mult: 3 } },
    ],
  },
  {
    id: "S_e_07", type: "spell", name: "艾爾諾禁咒", cost: 8, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "AENO_FORBIDDEN" }],
  },
];
