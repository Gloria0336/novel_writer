import type { Card } from "../../../core/types/card";

/**
 * 獸族種族卡 B01-B10
 * 設計主軸：血祭爆發、高攻兵力、以傷換攻。與血怒量表互動。
 */
export const BEAST_CARDS: Card[] = [
  {
    id: "B01", type: "spell", name: "鮮血祭祀", cost: 1, rarity: "common",
    effects: [{ kind: "scripted", tag: "B_BLOOD_RITE" }],
  },
  {
    id: "B02", type: "troop", name: "蠻牙戰士", cost: 2, rarity: "common",
    hp: 14, atk: 6, def: 1, keywords: [],
    passive: [{ kind: "scripted", tag: "B_SAVAGEFANG_BLOODRITE_X3" }],
  },
  {
    id: "B03", type: "spell", name: "捕食者直覺", cost: 2, rarity: "common",
    effects: [
      { kind: "buff", target: { kind: "self" }, mod: { atk: 5 }, duration: { kind: "thisTurn" } },
      { kind: "gauge", delta: 1, side: "self" },
    ],
  },
  {
    id: "B04", type: "troop", name: "巨角衝鋒獸", cost: 4, rarity: "uncommon",
    hp: 20, atk: 8, def: 3, keywords: ["haste"],
    onPlay: [{ kind: "scripted", tag: "FIRST_ATTACK_DOUBLE" }],
    onDestroy: [{ kind: "scripted", tag: "B_THORNS_TO_KILLER", payload: { amount: 5 } }],
  },
  {
    id: "B05", type: "action", name: "狼群戰術", cost: 3, rarity: "uncommon",
    effects: [
      { kind: "scripted", tag: "EXTRA_ACTIONS", payload: { count: 1 } },
      { kind: "scripted", tag: "B_PACK_TACTICS_MARK" },
    ],
  },
  {
    id: "B06", type: "action", name: "蠻力突進", cost: 2, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "B_BRUTE_CHARGE" }],
  },
  {
    id: "B07", type: "equipment", name: "戰痕勳章", cost: 3, rarity: "uncommon",
    slot: "trinket", modifiers: {},
    passive: [{ kind: "scripted", tag: "B_BATTLE_SCAR_MEDAL" }],
  },
  {
    id: "B08", type: "spell", name: "原始狂嚎", cost: 3, rarity: "rare",
    effects: [{ kind: "scripted", tag: "B_PRIMAL_HOWL" }],
  },
  {
    id: "B09", type: "troop", name: "戰爭猛瑪象", cost: 6, rarity: "rare",
    hp: 28, atk: 10, def: 4, keywords: [],
    onPlay: [{ kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 5 } }],
    onDestroy: [{ kind: "gauge", delta: 3, side: "self" }],
  },
  {
    id: "B10", type: "spell", name: "始祖獸魂", cost: 6, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "B_PRIMORDIAL_BEAST_SOUL" }],
  },
];
