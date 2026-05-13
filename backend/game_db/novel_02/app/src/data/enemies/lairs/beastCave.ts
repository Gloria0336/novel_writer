import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 魔獸洞穴 — §E.2
 * HP 120 / DEF 3 / 每 2 回合 1 / 巢穴半血時友方兵力 ATK ×2。
 */
export const LAIR_BEAST_CAVE_ID = "beast_cave";

const HERO_DEF: HeroDefinition = {
  id: LAIR_BEAST_CAVE_ID,
  name: "魔獸洞穴",
  raceId: "beast",
  classId: "berserker",
  rarity: "R",
  statTuning: {},
  gauge: { description: "巢穴不使用量表" },
  passives: [],
  actives: [],
  ultimate: { id: "noop", name: "—", description: "巢穴沒有終極技", cost: { morale: 9999 }, effects: [] },
  flavor: "陰暗潮濕的獸窩，野性在受傷時更加暴怒。",
};

function createInstance(): HeroInstance {
  return {
    defId: LAIR_BEAST_CAVE_ID,
    hp: 120, maxHp: 120,
    atk: 0, def: 3, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: true, immortalUsed: false, lastSummonTurn: 0 },
  };
}

const BASE = {
  type: "troop" as const,
  rarity: "common" as const,
  cost: 0,
  keywords: [],
};

export const LAIR_BEAST_TROOPS: TroopCard[] = [
  {
    ...BASE,
    id: "I_FERAL_BEAST", name: "野性魔獸",
    hp: 12, atk: 5, def: 1,
    flavor: "尚未理智的幼獸。",
  },
  {
    ...BASE,
    id: "I_DIRE_HOUND", name: "嗜血獵犬",
    hp: 14, atk: 6, def: 1,
    keywords: ["rush"],
    flavor: "獵犬群之首，撲咬不止。",
  },
  {
    ...BASE,
    id: "I_ALPHA_BEAST", name: "獸群之王",
    hp: 24, atk: 8, def: 2,
    keywords: ["guard"],
    flavor: "洞穴最深處的領導者。",
  },
];

export const LAIR_BEAST_CAVE: LairDefinition = {
  id: LAIR_BEAST_CAVE_ID,
  name: "魔獸洞穴",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_beast_cave",
  internalTroops: LAIR_BEAST_TROOPS,
  auraTags: { onStart: ["BEAST_HALFHP_DOUBLE_ATK"] },
  description: "HP 120 / DEF 3；每 2 回合召喚 1 隻。巢穴 HP ≤ 50% 時所有獸族兵力 ATK ×2。",
};
