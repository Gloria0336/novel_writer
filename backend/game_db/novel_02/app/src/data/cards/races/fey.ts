import type { Card } from "../../../core/types/card";

/**
 * 妖族種族卡 Y01-Y10
 * 設計主軸：形態互動、靈蘊管理、幻影/欺騙。與靈蘊量表互動。
 * 形態切換存於 hero.flags.feyForm（"human" | "fey"）。
 */
export const FEY_CARDS: Card[] = [
  {
    id: "Y01", type: "spell", name: "靈蘊吐息", cost: 1, rarity: "common",
    effects: [{ kind: "gauge", delta: 30, side: "self" }],
  },
  {
    id: "Y02", type: "troop", name: "妖狐斥候", cost: 2, rarity: "common",
    hp: 10, atk: 5, def: 2, keywords: ["rush"],
    onDestroy: [{ kind: "gauge", delta: 20, side: "self" }],
  },
  {
    id: "Y03", type: "spell", name: "狐火", cost: 2, rarity: "common",
    effects: [{ kind: "scripted", tag: "Y_FOXFIRE" }],
  },
  {
    id: "Y04", type: "troop", name: "蛇妖衛士", cost: 4, rarity: "uncommon",
    hp: 18, atk: 6, def: 5, keywords: [],
    passive: [{ kind: "scripted", tag: "Y_SERPENT_GUARD" }],
  },
  {
    id: "Y05", type: "equipment", name: "千年妖核", cost: 3, rarity: "uncommon",
    slot: "trinket", modifiers: {},
    passive: [{ kind: "scripted", tag: "Y_ESSENCE_CORE" }],
  },
  {
    id: "Y06", type: "spell", name: "形態殘影", cost: 2, rarity: "uncommon",
    effects: [
      { kind: "scripted", tag: "Y_FORM_TOGGLE" },
      { kind: "gauge", delta: 10, side: "self" },
      { kind: "scripted", tag: "Y_DAMAGE_REDUCE_THIS_TURN", payload: { pct: 50 } },
    ],
  },
  {
    id: "Y07", type: "spell", name: "百鬼夜行", cost: 4, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "Y_HUNDRED_GHOSTS" }],
  },
  {
    id: "Y08", type: "spell", name: "幻境迷陣", cost: 4, rarity: "rare",
    effects: [{ kind: "scripted", tag: "Y_ILLUSION_MAZE" }],
  },
  {
    id: "Y09", type: "troop", name: "九尾妖狐", cost: 6, rarity: "rare",
    hp: 22, atk: 8, def: 4, keywords: [],
    onPlay: [
      { kind: "gauge", delta: 30, side: "self" },
      { kind: "scripted", tag: "Y_NINETAILS_KEYWORDS" },
    ],
  },
  {
    id: "Y10", type: "spell", name: "始祖之血", cost: 7, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "Y_PRIMORDIAL_BLOOD" }],
  },
];
