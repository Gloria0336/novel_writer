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
  { id: "E09", type: "equipment", name: "魔導銃劍", cost: 3, rarity: "uncommon", slot: "weapon", modifiers: { atk: 4, cmd: 1 } },
  {
    id: "E10", type: "equipment", name: "星核導杖", cost: 3, rarity: "uncommon", slot: "weapon", modifiers: { atk: 2, cmd: 2 },
    onPlay: [{ kind: "draw", count: 1 }],
  },
  {
    id: "E11", type: "equipment", name: "乙太演算環", cost: 2, rarity: "common", slot: "trinket", modifiers: { cmd: 2 },
    onPlay: [{ kind: "gauge", delta: 5, side: "self" }],
  },
  { id: "E12", type: "equipment", name: "魔導合金外套", cost: 3, rarity: "uncommon", slot: "armor", modifiers: { def: 3, cmd: 1 } },
  {
    id: "E13", type: "equipment", name: "星環反應甲", cost: 4, rarity: "rare", slot: "armor", modifiers: { def: 5 },
    onPlay: [{ kind: "armor", amount: 4 }],
  },
  { id: "E14", type: "equipment", name: "虛數屏障鎧", cost: 5, rarity: "rare", slot: "armor", modifiers: { hp: 8, def: 3 } },
  {
    id: "E15", type: "equipment", name: "天穹演算杖", cost: 5, rarity: "rare", slot: "weapon", modifiers: { atk: 3, cmd: 3 },
    onPlay: [{ kind: "search", predicate: { type: "spell" }, toHand: true }],
  },
  {
    id: "E16", type: "equipment", name: "永動爐心甲", cost: 6, rarity: "legendary", slot: "armor", modifiers: { def: 6, cmd: 2 },
    onPlay: [{ kind: "mana", delta: 2, temporary: true }],
  },
  {
    id: "E17", type: "equipment", name: "月紋法杖", cost: 2, rarity: "common", slot: "weapon", modifiers: { atk: 2 },
    onPlay: [{ kind: "draw", count: 1 }],
  },
  {
    id: "E18", type: "equipment", name: "霜星護符", cost: 2, rarity: "common", slot: "trinket", modifiers: { def: 1, cmd: 1 },
    onPlay: [{ kind: "armor", amount: 2 }],
  },
  {
    id: "E19", type: "equipment", name: "晨曦祈戒", cost: 3, rarity: "uncommon", slot: "trinket", modifiers: { cmd: 2 },
    onPlay: [{ kind: "heal", target: { kind: "self" }, amount: { kind: "const", value: 6 } }],
  },
  {
    id: "E20", type: "equipment", name: "雷光短杖", cost: 3, rarity: "uncommon", slot: "weapon", modifiers: { atk: 4 },
    onPlay: [{ kind: "gauge", delta: 6, side: "self" }],
  },
  { id: "E21", type: "equipment", name: "秘法長袍", cost: 3, rarity: "uncommon", slot: "armor", modifiers: { def: 2, hp: 5 } },
  {
    id: "E22", type: "equipment", name: "靈泉水晶", cost: 4, rarity: "rare", slot: "trinket", modifiers: { cmd: 3 },
    onPlay: [{ kind: "mana", delta: 1 }],
  },
  {
    id: "E23", type: "equipment", name: "星界斗篷", cost: 5, rarity: "rare", slot: "armor", modifiers: { def: 4, cmd: 2 },
    onPlay: [{ kind: "armor", amount: 5 }],
  },
  {
    id: "E24", type: "equipment", name: "禁咒魔典", cost: 6, rarity: "legendary", slot: "trinket", modifiers: { atk: 2, cmd: 4 },
    onPlay: [{ kind: "search", predicate: { type: "spell" }, toHand: true }],
  },
  { id: "E25", type: "equipment", name: "黑鐵戰斧", cost: 2, rarity: "common", slot: "weapon", modifiers: { atk: 4 } },
  { id: "E26", type: "equipment", name: "鋼骨圓盾", cost: 2, rarity: "common", slot: "armor", modifiers: { def: 3 } },
  {
    id: "E27", type: "equipment", name: "血誓腕甲", cost: 3, rarity: "uncommon", slot: "trinket", modifiers: { atk: 2, def: 1 },
    onPlay: [{ kind: "morale", delta: 8 }],
  },
  { id: "E28", type: "equipment", name: "破陣長槍", cost: 4, rarity: "uncommon", slot: "weapon", modifiers: { atk: 5, cmd: 1 } },
  {
    id: "E29", type: "equipment", name: "百戰胸甲", cost: 4, rarity: "uncommon", slot: "armor", modifiers: { hp: 8, def: 3 },
    onPlay: [{ kind: "armor", amount: 3 }],
  },
  {
    id: "E30", type: "equipment", name: "軍團號角", cost: 4, rarity: "rare", slot: "trinket", modifiers: { cmd: 4 },
    onPlay: [{ kind: "morale", delta: 10 }],
  },
  {
    id: "E31", type: "equipment", name: "王衛巨盾", cost: 5, rarity: "rare", slot: "armor", modifiers: { def: 6 },
    onPlay: [{ kind: "armor", amount: 6 }],
  },
  {
    id: "E32", type: "equipment", name: "斬王巨刃", cost: 6, rarity: "legendary", slot: "weapon", modifiers: { atk: 8 },
    onPlay: [{ kind: "morale", delta: 12 }],
  },
  {
    id: "E33", type: "equipment", name: "天馬銀矛", cost: 3, rarity: "uncommon", slot: "weapon", modifiers: { atk: 4, cmd: 1 },
    onPlay: [{ kind: "gauge", delta: 5, side: "self" }],
  },
  {
    id: "E34", type: "equipment", name: "女武神羽冠", cost: 3, rarity: "uncommon", slot: "trinket", modifiers: { atk: 1, cmd: 3 },
    onPlay: [{ kind: "morale", delta: 6 }],
  },
  { id: "E35", type: "equipment", name: "巨神腰帶", cost: 4, rarity: "rare", slot: "trinket", modifiers: { hp: 12, atk: 2 } },
  {
    id: "E36", type: "equipment", name: "海皇鱗甲", cost: 4, rarity: "rare", slot: "armor", modifiers: { def: 5, hp: 6 },
    onPlay: [{ kind: "armor", amount: 4 }],
  },
  {
    id: "E37", type: "equipment", name: "日輪聖劍", cost: 5, rarity: "rare", slot: "weapon", modifiers: { atk: 6, cmd: 1 },
    onPlay: [{ kind: "heal", target: { kind: "self" }, amount: { kind: "const", value: 8 } }],
  },
  {
    id: "E38", type: "equipment", name: "冥河護符", cost: 5, rarity: "rare", slot: "trinket", modifiers: { def: 2, cmd: 3 },
    onPlay: [{ kind: "draw", count: 1 }],
  },
  {
    id: "E39", type: "equipment", name: "奧丁戰甲", cost: 6, rarity: "legendary", slot: "armor", modifiers: { hp: 10, def: 6 },
    onPlay: [{ kind: "gauge", delta: 10, side: "self" }],
  },
  {
    id: "E40", type: "equipment", name: "雷神之鎚", cost: 7, rarity: "legendary", slot: "weapon", modifiers: { atk: 9 },
    onPlay: [{ kind: "armor", amount: 5 }],
  },
  {
    id: "E41", type: "equipment", name: "獄火彎刀", cost: 2, rarity: "common", slot: "weapon", modifiers: { atk: 3 },
    onPlay: [{ kind: "gauge", delta: 4, side: "self" }],
  },
  { id: "E42", type: "equipment", name: "腐蝕骨甲", cost: 2, rarity: "common", slot: "armor", modifiers: { def: 2, hp: 4 } },
  {
    id: "E43", type: "equipment", name: "夢魘指環", cost: 3, rarity: "uncommon", slot: "trinket", modifiers: { atk: 2, cmd: 1 },
    onPlay: [{ kind: "draw", count: 1 }],
  },
  {
    id: "E44", type: "equipment", name: "血晶戰冠", cost: 4, rarity: "uncommon", slot: "trinket", modifiers: { atk: 2, cmd: 3 },
    onPlay: [{ kind: "morale", delta: 8 }],
  },
  { id: "E45", type: "equipment", name: "深淵重鎧", cost: 4, rarity: "rare", slot: "armor", modifiers: { def: 5, hp: 8 } },
  {
    id: "E46", type: "equipment", name: "咒刃斬魂", cost: 5, rarity: "rare", slot: "weapon", modifiers: { atk: 6 },
    onPlay: [{ kind: "gauge", delta: 8, side: "self" }],
  },
  {
    id: "E47", type: "equipment", name: "黑暗能量核", cost: 5, rarity: "rare", slot: "trinket", modifiers: { atk: 3, cmd: 3 },
    onPlay: [{ kind: "mana", delta: 1 }],
  },
  {
    id: "E48", type: "equipment", name: "魔王遺骸鎧", cost: 7, rarity: "legendary", slot: "armor", modifiers: { hp: 14, def: 7 },
    onPlay: [{ kind: "morale", delta: 12 }],
  },
];
