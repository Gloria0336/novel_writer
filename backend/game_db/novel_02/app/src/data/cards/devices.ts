import type { TroopCard } from "../../core/types/card";

/**
 * 通用器具卡（魔導系列）K01–K04
 * 任何種族可組入牌庫。矮人仍是這些卡的最佳使用者（爐火 cost-1 / device DEF +2），
 * 但「構裝體 / 哨兵 / 魔導砲台 / 攻城弩砲」本身屬於跨種族的奧術工程產物。
 */
export const DEVICES: TroopCard[] = [
  {
    id: "K01", type: "troop", name: "修復構裝體", cost: 2, rarity: "common",
    hp: 6, atk: 0, def: 2, keywords: [],
    onTurnEnd: [{ kind: "heal", target: { kind: "all", filter: { side: "self", entity: "troop" } }, amount: { kind: "const", value: 3 } }],
    flavor: "奧術工匠協會的標準維護型號。沒有靈魂，但極其忠誠。",
  },
  {
    id: "K02", type: "troop", name: "構裝哨兵", cost: 3, rarity: "uncommon",
    hp: 15, atk: 4, def: 8, keywords: ["guard"],
    passive: [{ kind: "scripted", tag: "HERO_DEF_PLUS_2_WHILE_ALIVE" }],
    flavor: "城牆會睡，它不會。",
  },
  {
    id: "K03", type: "troop", name: "魔導砲台", cost: 4, rarity: "uncommon",
    hp: 20, atk: 8, def: 6, keywords: [],
    onTurnEnd: [{ kind: "scripted", tag: "AUTO_TURRET_FIRE" }],
    passive: [{ kind: "scripted", tag: "IMMUNE_SPELL_DAMAGE" }],
    flavor: "把法陣壓進金屬，把咒語化作彈道。",
  },
  {
    id: "K04", type: "troop", name: "攻城弩砲", cost: 5, rarity: "rare",
    hp: 25, atk: 12, def: 8, keywords: ["siege"],
    flavor: "不為斬將，只為破門。",
  },
];
