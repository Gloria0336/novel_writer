import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 魔獸洞穴 — §E.2
 * HP 120 / DEF 3 / 每 2 回合 1 / 巢穴半血時友方兵力 ATK ×2
 * 機制：受傷越狂、群體加成、積累憤怒
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

export const LAIR_BEAST_TROOPS: TroopCard[] = [
  {
    id: "I_FERAL_BEAST", name: "野性魔獸",
    type: "troop", rarity: "common", cost: 0,
    hp: 12, atk: 5, def: 1,
    keywords: [],
    // 每回合積累憤怒：ATK +1，最多疊加3層（scripted追蹤）
    onTurnEnd: [{ kind: "scripted", tag: "BEAST_RAGE_TICK" }],
    flavor: "尚未理智的幼獸，在戰場上越戰越狂。",
  },
  {
    id: "I_DIRE_HOUND", name: "嗜血獵犬",
    type: "troop", rarity: "common", cost: 0,
    hp: 14, atk: 6, def: 1,
    keywords: ["rush", "lifesteal"],
    flavor: "獵犬群之首，突進後吸取敵血回復巢穴。",
  },
  {
    id: "I_ALPHA_BEAST", name: "獸群之王",
    type: "troop", rarity: "rare", cost: 0,
    hp: 24, atk: 8, def: 2,
    keywords: ["guard"],
    // ALPHA_AURA：在場時所有友方獸族兵力 ATK +2（由auraTags ALPHA_AURA驅動）
    passive: [{ kind: "scripted", tag: "ALPHA_AURA" }],
    flavor: "洞穴最深處的領導者，其存在令群獸戰意暴漲。",
  },
  {
    id: "I_ENRAGED_BOAR", name: "憤怒野豬",
    type: "troop", rarity: "uncommon", cost: 0,
    hp: 16, atk: 9, def: 0,
    keywords: ["rush", "pierce"],
    flavor: "無視一切阻礙的衝鋒者，防禦對牠毫無意義。",
  },
];

export const LAIR_BEAST_CAVE: LairDefinition = {
  id: LAIR_BEAST_CAVE_ID,
  name: "魔獸洞穴",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_beast_cave",
  internalTroops: LAIR_BEAST_TROOPS,
  auraTags: {
    onStart: ["BEAST_HALFHP_DOUBLE_ATK", "ALPHA_AURA"],
    onEnd: ["BEAST_HOWL"],
  },
  description: "HP 120 / DEF 3；每 2 回合召喚 1 隻。巢穴 HP ≤ 50% 時所有獸族兵力 ATK ×2。野性魔獸每回合 ATK +1（最多+3）。嗜血獵犬具突進與吸血。獸群之王在場時所有獸族 ATK +2。憤怒野豬突進穿透。",
};
