import type { SpellCard } from "../../core/types/card";

export const SPELLS: SpellCard[] = [
  {
    id: "S01", type: "spell", name: "偵查術", cost: 0, rarity: "common",
    effects: [
      { kind: "draw", count: 1 },
    ],
  },
  {
    id: "S02", type: "spell", name: "魔力激湧", cost: 1, rarity: "common",
    effects: [{ kind: "mana", delta: 3, temporary: true }],
  },
  {
    id: "S03", type: "spell", name: "治癒之風", cost: 2, rarity: "common",
    effects: [{ kind: "heal", target: { kind: "single", filter: {} }, amount: { kind: "const", value: 10 } }],
  },
  {
    id: "S04", type: "spell", name: "急救術", cost: 1, rarity: "common",
    effects: [{ kind: "heal", target: { kind: "single", filter: { entity: "troop" } }, amount: { kind: "const", value: 6 } }],
  },
  {
    id: "S05", type: "spell", name: "弱化咒", cost: 2, rarity: "uncommon",
    effects: [{ kind: "buff", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, mod: { atk: -3 }, duration: { kind: "turns", count: 2 } }],
  },
  {
    id: "S06", type: "spell", name: "冰封術", cost: 3, rarity: "uncommon",
    effects: [{ kind: "freeze", target: { kind: "single", filter: { entity: "troop", side: "enemy" } }, turns: 2 }],
  },
  {
    id: "S07", type: "spell", name: "烈焰風暴", cost: 4, rarity: "uncommon",
    effects: [{ kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 10 } }],
  },
  {
    id: "S08", type: "spell", name: "次元修補", cost: 3, rarity: "uncommon",
    effects: [{ kind: "stability", delta: 15 }],
  },
  {
    id: "S09", type: "spell", name: "強化術", cost: 2, rarity: "uncommon",
    effects: [{ kind: "buff", target: { kind: "single", filter: { side: "self", entity: "troop" } }, mod: { atk: 3, hp: 3 }, duration: { kind: "permanent" } }],
  },
  {
    id: "S10", type: "spell", name: "戰場掃描", cost: 2, rarity: "uncommon",
    effects: [
      { kind: "draw", count: 1 },
      { kind: "armor", amount: 8 },
    ],
  },
  {
    id: "S11", type: "spell", name: "時間裂隙", cost: 5, rarity: "rare",
    effects: [{ kind: "scripted", tag: "EXTRA_ACTIONS", payload: { count: 2 } }],
  },
  {
    id: "S12", type: "spell", name: "毀滅射線", cost: 6, rarity: "rare",
    effects: [{ kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "const", value: 30 }, ignoreDef: true }],
  },
  {
    id: "S13", type: "spell", name: "大地裂變", cost: 5, rarity: "rare",
    effects: [
      { kind: "damage", target: { kind: "all", filter: { side: "all", entity: "troop" } }, amount: { kind: "const", value: 15 } },
      { kind: "destroyField" },
    ],
  },
  {
    id: "S14", type: "spell", name: "盟約之誓", cost: 7, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "OATH_CHOICE" }],
  },
];
