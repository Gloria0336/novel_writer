import type { TroopCard } from "../../core/types/card";

export const TROOPS: TroopCard[] = [
  { id: "T01", type: "troop", name: "民兵", cost: 1, rarity: "common", hp: 8, atk: 3, def: 1, keywords: [] },
  { id: "T02", type: "troop", name: "傭兵", cost: 2, rarity: "common", hp: 12, atk: 5, def: 2, keywords: [] },
  { id: "T03", type: "troop", name: "持盾衛兵", cost: 2, rarity: "common", hp: 10, atk: 2, def: 5, keywords: ["guard"] },
  {
    id: "T04", type: "troop", name: "偵察兵", cost: 1, rarity: "common", hp: 6, atk: 4, def: 0, keywords: ["rush"],
    onPlay: [{ kind: "draw", count: 1 }],
  },
  {
    id: "T05", type: "troop", name: "野戰醫護兵", cost: 2, rarity: "common", hp: 6, atk: 1, def: 2, keywords: [],
    onTurnEnd: [{ kind: "scripted", tag: "HEAL_ADJACENT", payload: { amount: 3 } }],
  },
  {
    id: "T06", type: "troop", name: "傳令兵", cost: 1, rarity: "common", hp: 4, atk: 2, def: 1, keywords: [],
    onPlay: [{ kind: "draw", count: 1 }],
  },
  { id: "T07", type: "troop", name: "攻城弩手", cost: 3, rarity: "uncommon", hp: 10, atk: 6, def: 1, keywords: ["pierce"] },
  {
    id: "T08", type: "troop", name: "戰場醫師", cost: 3, rarity: "uncommon", hp: 8, atk: 2, def: 3, keywords: [],
    onTurnEnd: [{ kind: "heal", target: { kind: "all", filter: { side: "self", entity: "troop" } }, amount: { kind: "const", value: 3 } }],
  },
  {
    id: "T09", type: "troop", name: "重裝騎兵", cost: 4, rarity: "uncommon", hp: 18, atk: 7, def: 4, keywords: ["haste"],
    onPlay: [{ kind: "scripted", tag: "FIRST_ATTACK_DOUBLE" }],
  },
  { id: "T10", type: "troop", name: "暗殺者", cost: 3, rarity: "uncommon", hp: 8, atk: 5, def: 0, keywords: ["rush", "lethal"] },
  {
    id: "T11", type: "troop", name: "戰地牧師", cost: 4, rarity: "uncommon", hp: 12, atk: 3, def: 4, keywords: ["guard"],
    onPlay: [{ kind: "heal", target: { kind: "self" }, amount: { kind: "const", value: 8 } }],
  },
  {
    id: "T12", type: "troop", name: "老練傭兵隊長", cost: 4, rarity: "rare", hp: 16, atk: 6, def: 4, keywords: [],
    onPlay: [{ kind: "scripted", tag: "GIVE_ANOTHER_RUSH" }],
  },
  {
    id: "T13", type: "troop", name: "精英禁衛", cost: 5, rarity: "rare", hp: 22, atk: 8, def: 5, keywords: ["guard"],
    passive: [{ kind: "scripted", tag: "ABSORB_HALF_HERO_ACTION_DAMAGE" }],
  },
  {
    id: "T14", type: "troop", name: "傳奇傭兵團", cost: 7, rarity: "legendary", hp: 30, atk: 10, def: 6, keywords: [],
    onPlay: [{ kind: "summon", cardId: "T02", count: 2, side: "self" }],
  },
];
