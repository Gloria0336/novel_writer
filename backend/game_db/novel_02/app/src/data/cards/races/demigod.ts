import type { Card } from "../../../core/types/card";

/**
 * 半神族種族卡 G01-G10
 * 設計主軸：英雄個體戰力極致、神力殘響管理、敵我不分的代價。
 * 透支機制存於 hero.flags.overdraft（number）。
 */
export const DEMIGOD_CARDS: Card[] = [
  {
    id: "G01", type: "spell", name: "神力碎片", cost: 0, rarity: "common",
    effects: [{ kind: "gauge", delta: 15, side: "self" }],
  },
  {
    id: "G02", type: "spell", name: "殘響共振", cost: 2, rarity: "common",
    effects: [{ kind: "scripted", tag: "G_ECHO_RESONANCE" }],
  },
  {
    id: "G03", type: "troop", name: "信徒", cost: 2, rarity: "common",
    hp: 10, atk: 3, def: 2, keywords: ["guard"],
    passive: [{ kind: "scripted", tag: "G_FOLLOWER_PROXY" }],
  },
  {
    id: "G04", type: "spell", name: "神域結界", cost: 2, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "G_DIVINE_BARRIER", payload: { turns: 2, pct: 30 } }],
  },
  {
    id: "G05", type: "action", name: "超越極限", cost: 3, rarity: "uncommon",
    effects: [
      { kind: "scripted", tag: "G_TRANSCEND" },
      { kind: "morale", delta: 40 },
      { kind: "gauge", delta: 10, side: "self" },
    ],
  },
  {
    id: "G06", type: "action", name: "虛空漫步", cost: 3, rarity: "uncommon",
    effects: [
      { kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk" }, ignoreGuard: true, ignoreDef: true },
      { kind: "scripted", tag: "G_OVERDRAFT_ADD", payload: { amount: 1 } },
    ],
  },
  {
    id: "G07", type: "spell", name: "神隱", cost: 1, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "G_DIVINE_HIDE" }],
  },
  {
    id: "G08", type: "action", name: "神言：崩壞", cost: 4, rarity: "rare",
    effects: [{ kind: "scripted", tag: "G_DIVINE_WORD_COLLAPSE" }],
  },
  {
    id: "G09", type: "troop", name: "不朽神使", cost: 5, rarity: "rare",
    hp: 18, atk: 6, def: 6, keywords: ["guard"],
    onDestroy: [
      { kind: "gauge", delta: 25, side: "self" },
      { kind: "scripted", tag: "G_OVERDRAFT_REMOVE", payload: { amount: 1 } },
    ],
  },
  {
    id: "G10", type: "action", name: "創世殘章", cost: 8, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "G_GENESIS_FRAGMENT" }],
  },
];
