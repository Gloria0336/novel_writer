import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { BossDefinition } from "./types";
import { HERO_BLOOD_CHIEF } from "../../heroes/bloodChief";

/**
 * 獸王 — §E.1 鏡像模式
 * HP 140 / ATK 20 / DEF 4 / CMD 4
 * 完整借用「蠻血酋長」技能（保留 beast / berserker），稀有度升 SSR。
 */
export const BOSS_BEAST_KING_ID = "boss_beast_king";

const HERO_DEF: HeroDefinition = {
  ...HERO_BLOOD_CHIEF,
  id: BOSS_BEAST_KING_ID,
  name: "獸王",
  rarity: "SSR",
  flavor: "血脈中流著祖獸的暴烈，已凌駕於部族之上。",
};

function createInstance(): HeroInstance {
  return {
    defId: BOSS_BEAST_KING_ID,
    hp: 140, maxHp: 140,
    atk: 20, def: 4, cmd: 4,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false, lastSummonTurn: 0 },
  };
}

export const BOSS_BEAST_KING: BossDefinition = {
  id: BOSS_BEAST_KING_ID,
  name: "獸王",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "boss_beast_king",
  description: "HP 140 / ATK 20 / DEF 4 / CMD 4。狂戰士型 Boss，完整血怒體系。",
};
