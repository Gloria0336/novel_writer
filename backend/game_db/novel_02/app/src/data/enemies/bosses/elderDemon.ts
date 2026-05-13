import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { TroopCard } from "../../../core/types/card";
import type { BossDefinition } from "./types";
import { HERO_ARCHMAGE } from "../../heroes/archmage";

/**
 * 古魔 — §E.1 鏡像模式
 * HP 180 / ATK 16 / DEF 5 / CMD 6
 * 借用「大賢者」技能但種族改 demon、職業 mage。
 * 古魔兵力 passive：攻擊命中時 stability -1（ELDER_TOUCH）。
 * v1 不實作意圖模糊 UI；保留 flag 但無讀取點。
 */
export const BOSS_ELDER_DEMON_ID = "boss_elder_demon";

const HERO_DEF: HeroDefinition = {
  ...HERO_ARCHMAGE,
  id: BOSS_ELDER_DEMON_ID,
  name: "古魔",
  raceId: "demon",
  rarity: "SSR",
  gauge: {
    description: "黑暗蝕：每施放法術 +5；達 50 觸發詠唱完成。",
    onSpellCast: 5,
  },
  flavor: "超越次元的存在，其意念連腐化也為之傾倒。",
};

function createInstance(): HeroInstance {
  return {
    defId: BOSS_ELDER_DEMON_ID,
    hp: 180, maxHp: 180,
    atk: 16, def: 5, cmd: 6,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false, lastSummonTurn: 0, intentObscured: true },
  };
}

const ELDER_TROOPS: TroopCard[] = [
  {
    id: "I_ELDER_SPAWN", type: "troop", name: "古魔孳生體",
    cost: 0, rarity: "common",
    hp: 8, atk: 4, def: 1,
    keywords: [],
    passive: [{ kind: "scripted", tag: "ELDER_TOUCH" }],
    flavor: "其觸碰滲透次元壁。",
  },
  {
    id: "I_ELDER_HORROR", type: "troop", name: "古魔恐怖",
    cost: 0, rarity: "uncommon",
    hp: 14, atk: 7, def: 2,
    keywords: ["pierce"],
    passive: [{ kind: "scripted", tag: "ELDER_TOUCH" }],
    flavor: "近視即瘋狂的形象。",
  },
];

export const BOSS_ELDER_DEMON: BossDefinition = {
  id: BOSS_ELDER_DEMON_ID,
  name: "古魔",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "boss_elder_demon",
  internalTroops: ELDER_TROOPS,
  description: "HP 180 / ATK 16 / DEF 5 / CMD 6。法師型 Boss，兵力攻擊命中即穩定度 -1。",
};
