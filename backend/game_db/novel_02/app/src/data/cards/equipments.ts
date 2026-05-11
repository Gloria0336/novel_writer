import type { EquipmentCard } from "../../core/types/card";

export const EQUIPMENTS: EquipmentCard[] = [
  { id: "E01", type: "equipment", name: "鐵劍", cost: 2, rarity: "common", slot: "weapon", modifiers: { atk: 3 } },
  { id: "E02", type: "equipment", name: "皮甲", cost: 2, rarity: "common", slot: "armor", modifiers: { def: 2 } },
  {
    id: "E03", type: "equipment", name: "幸運墜飾", cost: 2, rarity: "common", slot: "trinket", modifiers: {},
    passive: [{ kind: "scripted", tag: "LUCKY_DRAW_CHANCE", payload: { pct: 30 } }],
  },
  {
    id: "E04", type: "equipment", name: "符文長劍", cost: 4, rarity: "uncommon", slot: "weapon", modifiers: { atk: 5 },
    passive: [{ kind: "scripted", tag: "MANA_ON_KILL" }],
  },
  {
    id: "E05", type: "equipment", name: "矮人鍛甲", cost: 4, rarity: "uncommon", slot: "armor", modifiers: { def: 4 },
    passive: [{ kind: "scripted", tag: "DEF_THRESHOLD_IMMUNE" }],
  },
  {
    id: "E06", type: "equipment", name: "指揮官戰冠", cost: 4, rarity: "uncommon", slot: "trinket", modifiers: { cmd: 2 },
    passive: [{ kind: "scripted", tag: "MORALE_ON_DEPLOY", payload: { amount: 5 } }],
  },
  {
    id: "E07", type: "equipment", name: "噬魂戰刃", cost: 5, rarity: "rare", slot: "weapon", modifiers: { atk: 6 },
    passive: [{ kind: "scripted", tag: "HERO_LIFESTEAL", payload: { pct: 20 } }],
  },
  {
    id: "E08", type: "equipment", name: "龍鱗胸甲", cost: 6, rarity: "legendary", slot: "armor", modifiers: { def: 6 },
    passive: [{ kind: "scripted", tag: "DRAGONSCALE" }],
  },
];
