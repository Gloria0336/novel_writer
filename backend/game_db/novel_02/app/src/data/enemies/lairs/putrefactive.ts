import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 腐植巢穴 (Putrefactive Lair) — 設計文件 §E.2
 * HP 80 / DEF 0 / 每回合產 1 兵力
 * 機制：腐蝕蔓延、積累崩潰
 */
export const LAIR_PUTREFACTIVE_ID = "putrefactive_lair";

const LAIR_PUTREFACTIVE_HERO_DEF: HeroDefinition = {
  id: LAIR_PUTREFACTIVE_ID,
  name: "腐植巢穴",
  raceId: "human",
  classId: "commander",
  rarity: "R",
  statTuning: {},
  gauge: { description: "巢穴不使用量表" },
  passives: [],
  actives: [],
  ultimate: { id: "noop", name: "—", description: "巢穴沒有終極技", cost: { morale: 9999 }, effects: [] },
  flavor: "從次元裂縫滲出的有機腐質凝聚而成的造物，不斷孵育新的腐眷屬。",
};

function createInstance(): HeroInstance {
  return {
    defId: LAIR_PUTREFACTIVE_ID,
    hp: 80, maxHp: 80,
    atk: 0, def: 0, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: true, immortalUsed: false },
  };
}

export const LAIR_PUTREFACTIVE_TROOPS: TroopCard[] = [
  {
    id: "L01", name: "腐植芽",
    type: "troop", rarity: "common", cost: 0,
    hp: 5, atk: 2, def: 0,
    keywords: [],
    onDestroy: [{ kind: "stability", delta: -2 }],
    flavor: "從巢穴中破土而出的孢子體。",
  },
  {
    id: "L02", name: "腐植觸手",
    type: "troop", rarity: "uncommon", cost: 0,
    hp: 8, atk: 3, def: 1,
    keywords: [],
    // PUTREFACTIVE_DRAIN_3：每回合對玩家英雄造成1傷害，最多持續3回合（scripted.ts追蹤計時）
    onTurnEnd: [{ kind: "scripted", tag: "PUTREFACTIVE_DRAIN_3" }],
    onDestroy: [{ kind: "stability", delta: -2 }],
    flavor: "黏液裹覆的偽足，每回合持續侵蝕3回合後枯萎。",
  },
  {
    id: "L03", name: "腐植膿瘤",
    type: "troop", rarity: "uncommon", cost: 0,
    hp: 14, atk: 5, def: 0,
    keywords: [],
    onDestroy: [
      { kind: "stability", delta: -2 },
      { kind: "scripted", tag: "PUSS_BURST" },
    ],
    flavor: "巨大的腫瘤，破裂時噴出腐液傷及所有敵方兵力。",
  },
  {
    id: "L04", name: "腐植寄生獸",
    type: "troop", rarity: "rare", cost: 0,
    hp: 18, atk: 4, def: 0,
    keywords: ["pierce"],
    onDestroy: [
      { kind: "stability", delta: -3 },
      { kind: "summon", cardId: "L01", count: 2, side: "self" },
    ],
    flavor: "死去後仍留下種子，兩株腐植芽從屍體中破體而出。",
  },
  {
    id: "L05", name: "腐植之壁",
    type: "troop", rarity: "uncommon", cost: 0,
    hp: 15, atk: 0, def: 5,
    keywords: ["guard"],
    onDestroy: [{ kind: "stability", delta: -2 }],
    flavor: "腐質凝固成的厚實屏障，沒有思想，只有阻礙。",
  },
];

export const LAIR_PUTREFACTIVE: LairDefinition = {
  id: LAIR_PUTREFACTIVE_ID,
  name: "腐植巢穴",
  heroDef: LAIR_PUTREFACTIVE_HERO_DEF,
  createInstance,
  profileId: "lair_putrefactive",
  internalTroops: LAIR_PUTREFACTIVE_TROOPS,
  auraTags: { onEnd: ["PUTREFACTIVE_SPREAD"] },
  description: "HP 80 / DEF 0；每回合召喚 1 隻腐眷屬。腐植兵力被摧毀時穩定度 -2。腐植觸手每回合對玩家英雄造成 1 傷害（持續 3 回合）。腐植膿瘤死亡時對所有玩家兵力爆發腐液。腐植寄生獸死亡後召喚 2 隻腐植芽。",
};
