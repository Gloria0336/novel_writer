import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { Effect } from "../../../core/types/effect";
import type { BossDefinition } from "./types";
import { HERO_BLOOD_CHIEF } from "../../heroes/bloodChief";

/**
 * 炎魔 — §E.1 鏡像模式
 * HP 160 / ATK 18 / DEF 6 / CMD 3
 * 借用「蠻血酋長」狂戰士技能；種族改 demon。
 * 戰鬥開始時自動掛獄火場地（F_BURN_INFERNO，雙方兵力每回合結束受 2 傷）。
 */
export const BOSS_INFERNAL_DEMON_ID = "boss_infernal_demon";

const HERO_DEF: HeroDefinition = {
  ...HERO_BLOOD_CHIEF,
  id: BOSS_INFERNAL_DEMON_ID,
  name: "炎魔",
  raceId: "demon",
  rarity: "SSR",
  gauge: {
    description: "黑暗蝕：每受傷 10% +5；兵力被殺 +10。",
    onTroopDestroyedSelf: 10,
    onHeroDamaged: { perPct: 10, perValue: 5 },
  },
  flavor: "次元裂縫深處的活火山，怒火即實體。",
};

function createInstance(): HeroInstance {
  return {
    defId: BOSS_INFERNAL_DEMON_ID,
    hp: 160, maxHp: 160,
    atk: 18, def: 6, cmd: 3,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false, lastSummonTurn: 0 },
  };
}

const ON_BATTLE_START: Effect[] = [
  { kind: "scripted", tag: "FIELD_BURN_APPLY" },
];

export const BOSS_INFERNAL_DEMON: BossDefinition = {
  id: BOSS_INFERNAL_DEMON_ID,
  name: "炎魔",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "boss_infernal_demon",
  onBattleStart: ON_BATTLE_START,
  description: "HP 160 / ATK 18 / DEF 6 / CMD 3。狂戰士型 Boss，開局自動掛獄火場地。",
};
