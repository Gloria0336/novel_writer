import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { BossGaugeSpec } from "../../../core/types/bossGauge";
import type { BossDefinition } from "./types";
import { HERO_BLOOD_CHIEF } from "../../heroes/bloodChief";
import { BOSS_BEAST_KING_DECK_IDS } from "../../decks/bosses";

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

const BOSS_GAUGE: BossGaugeSpec = {
  id: "blood_rite_fury",
  name: "血祭暴怒",
  description: "自身每受 1 點傷 +1；每擊殺玩家兵力 +18；自方狂戰士兵力存活回合 +7/個。滿值釋放血月狂嚎。",
  max: 100,
  triggers: [
    { kind: "onHeroDamaged", per1Hp: 1 },
    { kind: "onPlayerTroopKilled", amount: 18 },
    { kind: "onTroopSurvivePerTurn", perUnit: 7, troopTag: "berserker" },
  ],
  burstLabel: "血月狂嚎！",
  burstEffects: [
    {
      kind: "buff",
      target: { kind: "self" },
      mod: { atk: 3 },
      duration: { kind: "turns", count: 2 },
    },
    { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "atk", mult: 0.4 } },
    { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "atk", mult: 0.4 } },
    {
      kind: "buff",
      target: { kind: "all", filter: { side: "self", entity: "troop" } },
      mod: { atk: 1, def: 1 },
      duration: { kind: "turns", count: 2 },
    },
  ],
};

export const BOSS_BEAST_KING: BossDefinition = {
  id: BOSS_BEAST_KING_ID,
  name: "獸王",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "boss_beast_king",
  deckIds: BOSS_BEAST_KING_DECK_IDS,
  bossGauge: BOSS_GAUGE,
  description: "HP 140 / ATK 20 / DEF 4 / CMD 4。狂戰士型 Boss，完整血怒體系。",
};
