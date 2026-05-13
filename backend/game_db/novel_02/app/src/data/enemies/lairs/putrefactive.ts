import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 腐植巢穴 (Putrefactive Lair) — 設計文件 §E.2
 * HP 80 / DEF 0 / 每回合產 1 兵力 / 兵力謝幕曲：穩定度 -2
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

const LAIR_PUTREFACTIVE_TROOP_BASE = {
  type: "troop" as const,
  rarity: "common" as const,
  cost: 0,
  keywords: [],
  onDestroy: [{ kind: "stability" as const, delta: -2 }],
};

export const LAIR_PUTREFACTIVE_TROOPS: TroopCard[] = [
  {
    ...LAIR_PUTREFACTIVE_TROOP_BASE,
    id: "L01", name: "腐植芽",
    hp: 5, atk: 2, def: 0,
    flavor: "從巢穴中破土而出的孢子體。",
  },
  {
    ...LAIR_PUTREFACTIVE_TROOP_BASE,
    id: "L02", name: "腐植觸手",
    hp: 8, atk: 3, def: 1,
    flavor: "黏液裹覆的偽足，在地面爬行。",
  },
  {
    ...LAIR_PUTREFACTIVE_TROOP_BASE,
    id: "L03", name: "腐植膿瘤",
    hp: 12, atk: 4, def: 0,
    flavor: "巨大的腫瘤，破裂時噴出腐液。",
  },
];

export const LAIR_PUTREFACTIVE: LairDefinition = {
  id: LAIR_PUTREFACTIVE_ID,
  name: "腐植巢穴",
  heroDef: LAIR_PUTREFACTIVE_HERO_DEF,
  createInstance,
  profileId: "lair_putrefactive",
  internalTroops: LAIR_PUTREFACTIVE_TROOPS,
  description: "HP 80 / DEF 0；每回合召喚 1 隻腐眷屬。所有腐植兵力被摧毀時穩定度 -2。",
};
