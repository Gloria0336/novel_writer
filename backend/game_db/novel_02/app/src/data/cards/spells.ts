import type { SpellCard } from "../../core/types/card";

export const SPELLS: SpellCard[] = [
  {
    id: "S_c_01", type: "spell", name: "偵查術", cost: 0, rarity: "common",
    effects: [
      { kind: "draw", count: 1 },
    ],
  },
  {
    id: "S_c_02", type: "spell", name: "魔力激湧", cost: 1, rarity: "common",
    effects: [{ kind: "mana", delta: 3, temporary: true }],
  },
  {
    id: "S_c_03", type: "spell", name: "治癒之風", cost: 2, rarity: "common",
    effects: [{ kind: "heal", target: { kind: "all", filter: { side: "self", entity: "troop" } }, amount: { kind: "const", value: 5 } }],
  },
  {
    id: "S_c_04", type: "spell", name: "急救術", cost: 1, rarity: "common",
    effects: [{ kind: "heal", target: { kind: "single", filter: { entity: "troop" } }, amount: { kind: "const", value: 6 } }],
  },
  {
    id: "S_c_05", type: "spell", name: "弱化咒", cost: 2, rarity: "uncommon",
    effects: [{ kind: "buff", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, mod: { atk: -3 }, duration: { kind: "turns", count: 2 } }],
  },
  {
    id: "S_c_06", type: "spell", name: "冰封術", cost: 3, rarity: "uncommon",
    effects: [{ kind: "freeze", target: { kind: "single", filter: { entity: "troop", side: "enemy" } }, turns: 2, displayName: "冰凍" }],
  },
  {
    id: "S_c_07", type: "spell", name: "烈焰風暴", cost: 4, rarity: "uncommon",
    effects: [{ kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 10 } }],
  },
  {
    id: "S_c_08", type: "spell", name: "次元修補", cost: 3, rarity: "uncommon",
    effects: [{ kind: "stability", delta: 15 }],
  },
  {
    id: "S_c_09", type: "spell", name: "強化術", cost: 2, rarity: "uncommon",
    effects: [{ kind: "buff", target: { kind: "single", filter: { side: "self", entity: "troop" } }, mod: { atk: 3, hp: 3 }, duration: { kind: "permanent" } }],
  },
  {
    id: "S_c_10", type: "spell", name: "戰場掃描", cost: 2, rarity: "uncommon",
    effects: [
      { kind: "draw", count: 1 },
      { kind: "armor", amount: 8 },
    ],
  },
  {
    id: "S_c_11", type: "spell", name: "時間裂隙", cost: 5, rarity: "rare",
    effects: [{ kind: "scripted", tag: "EXTRA_ACTIONS", payload: { count: 2 } }],
  },
  {
    id: "S_c_12", type: "spell", name: "毀滅射線", cost: 6, rarity: "rare",
    effects: [{ kind: "damage", target: { kind: "single", filter: { side: "enemy", entity: "any" } }, amount: { kind: "const", value: 30 }, ignoreDef: true }],
  },
  {
    id: "S_c_13", type: "spell", name: "大地裂變", cost: 5, rarity: "rare",
    effects: [
      { kind: "damage", target: { kind: "all", filter: { side: "all", entity: "troop" } }, amount: { kind: "const", value: 15 } },
      { kind: "destroyField", side: "all" },
    ],
  },
  {
    id: "S_c_14", type: "spell", name: "盟約之誓", cost: 7, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "OATH_CHOICE" }],
  },
  // v3.3 次元滲透裂縫相關
  {
    id: "S_c_15", type: "spell", name: "裂痕召喚", cost: 5, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "RIFT_CALL" }],
    flavor: "她把手按在裂縫邊緣，那聲音不是召喚——是讓裂縫想起它本就屬於誰。",
  },
  {
    id: "S_c_16", type: "spell", name: "裂縫共鳴", cost: 3, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "RIFT_RESONANCE" }],
    flavor: "次元壁的破洞並非全然惡意——它也共振著某些更古老的東西。",
  },
  // v3.4 通用：原 D03 合金回收下放為跨種族法術
  {
    id: "S_c_17", type: "spell", name: "拆解術", cost: 2, rarity: "common",
    effects: [{ kind: "scripted", tag: "SALVAGE" }],
    flavor: "把已穿在身上的東西拆回零件——只有真正信任工匠的英雄敢這麼做。",
  },
  {
    id: "S_c_18", type: "spell", name: "雷霆長槍", cost: 4, rarity: "rare",
    effects: [{ kind: "damage", target: { kind: "single", filter: { side: "enemy", entity: "any" } }, amount: { kind: "const", value: 18 }, ignoreDef: true }],
    flavor: "壓縮成槍形的雷光只閃一下，盔甲、鱗片與護符都來不及反應。",
  },
  {
    id: "S_c_19", type: "spell", name: "劇毒之霧", cost: 3, rarity: "uncommon",
    effects: [
      { kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 4 }, ignoreDef: true },
      { kind: "buff", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, mod: { atk: -2, def: -2 }, duration: { kind: "turns", count: 2 } },
    ],
    flavor: "綠黑色霧氣沿著地面貼行，鑽進關節、肺葉與每一道沒封好的甲縫。",
  },
  {
    id: "S_c_20", type: "spell", name: "秘術聚焦", cost: 1, rarity: "common",
    effects: [
      { kind: "draw", count: 1 },
      { kind: "mana", delta: 1, temporary: true },
    ],
    flavor: "把發散的魔力收成一條細線，下一個咒式便會順著線自己找到出口。",
  },
  {
    id: "S_c_21", type: "spell", name: "戰場急救", cost: 2, rarity: "common",
    effects: [
      { kind: "heal", target: { kind: "self" }, amount: { kind: "const", value: 8 } },
      { kind: "armor", amount: 4 },
    ],
    flavor: "繃帶、止血粉與臨時護盾一起落下，粗糙得要命，但有效。",
  },
  {
    id: "S_c_22", type: "spell", name: "破甲符文", cost: 2, rarity: "uncommon",
    effects: [
      { kind: "buff", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, mod: { def: -4 }, duration: { kind: "turns", count: 2 } },
      { kind: "addStatus", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, status: "marked", duration: { kind: "turns", count: 1 } },
    ],
    flavor: "符文像燒紅的釘子釘進護甲紋路，下一擊會知道該往哪裡裂開。",
  },
];
