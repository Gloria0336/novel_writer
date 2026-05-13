import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 腐化神殿 — §E.2
 * HP 200 / DEF 3 / 每 2 回合 1 / 祭司存活時巢穴 +5 HP/回合。
 */
export const LAIR_CORRUPTED_TEMPLE_ID = "corrupted_temple";

const HERO_DEF: HeroDefinition = {
  id: LAIR_CORRUPTED_TEMPLE_ID,
  name: "腐化神殿",
  raceId: "demon",
  classId: "priest",
  rarity: "R",
  statTuning: {},
  gauge: { description: "巢穴不使用量表" },
  passives: [],
  actives: [],
  ultimate: { id: "noop", name: "—", description: "巢穴沒有終極技", cost: { morale: 9999 }, effects: [] },
  flavor: "古老的祭壇被腐化儀式不斷餵養，越破壞越茁壯。",
};

function createInstance(): HeroInstance {
  return {
    defId: LAIR_CORRUPTED_TEMPLE_ID,
    hp: 200, maxHp: 200,
    atk: 0, def: 3, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: true, immortalUsed: false, lastSummonTurn: 0 },
  };
}

export const LAIR_CORRUPTED_TROOPS: TroopCard[] = [
  {
    id: "I_TEMPLE_PRIEST", type: "troop", name: "腐化祭司",
    cost: 0, rarity: "uncommon",
    hp: 12, atk: 2, def: 2,
    keywords: ["guard"],
    flavor: "誦經之聲不絕，神殿每回合 +5 HP。",
  },
  {
    id: "I_TEMPLE_FOLLOWER", type: "troop", name: "腐化信徒",
    cost: 0, rarity: "common",
    hp: 8, atk: 4, def: 1,
    keywords: [],
    flavor: "犧牲自我以滋養神殿。",
  },
  {
    id: "I_CORRUPT_RELIC", type: "troop", name: "腐爛聖物",
    cost: 0, rarity: "rare",
    hp: 18, atk: 5, def: 3,
    keywords: [],
    onDestroy: [{ kind: "stability", delta: -4 }],
    flavor: "曾經神聖，如今滴落腐液。",
  },
];

export const LAIR_CORRUPTED_TEMPLE: LairDefinition = {
  id: LAIR_CORRUPTED_TEMPLE_ID,
  name: "腐化神殿",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_corrupted_temple",
  internalTroops: LAIR_CORRUPTED_TROOPS,
  auraTags: { onEnd: ["TEMPLE_PRIEST_HEAL"] },
  description: "HP 200 / DEF 3；每 2 回合召喚 1 隻。場上有腐化祭司時，巢穴每回合回復 5 HP。",
};
