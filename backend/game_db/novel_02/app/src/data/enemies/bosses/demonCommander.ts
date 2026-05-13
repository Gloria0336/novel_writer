import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { BossDefinition } from "./types";
import { HERO_COMMANDER } from "../../heroes/commander";

/**
 * 惡魔將領 — §E.1 鏡像模式
 * HP 130 / ATK 14 / DEF 7 / CMD 5
 * 借用「軍團統帥」技能；種族改為 demon；
 * 召喚池含暗影兵變體（謝幕曲穩定度 -5）。
 */
export const BOSS_DEMON_COMMANDER_ID = "boss_demon_commander";

const HERO_DEF: HeroDefinition = {
  ...HERO_COMMANDER,
  id: BOSS_DEMON_COMMANDER_ID,
  name: "惡魔將領",
  raceId: "demon",
  rarity: "SSR",
  flavor: "次元裂縫之軍的將領，手中令旗讓暗影兵不畏死亡。",
};

function createInstance(): HeroInstance {
  return {
    defId: BOSS_DEMON_COMMANDER_ID,
    hp: 130, maxHp: 130,
    atk: 14, def: 7, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false, lastSummonTurn: 0 },
  };
}

export const BOSS_DEMON_COMMANDER: BossDefinition = {
  id: BOSS_DEMON_COMMANDER_ID,
  name: "惡魔將領",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "boss_demon_commander",
  description: "HP 130 / ATK 14 / DEF 7 / CMD 5。指揮型 Boss，召喚暗影兵衝擊穩定度。",
};
