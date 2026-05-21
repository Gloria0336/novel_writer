import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { BossGaugeSpec } from "../../../core/types/bossGauge";
import type { BossDefinition } from "./types";
import { HERO_COMMANDER } from "../../heroes/commander";
import { BOSS_DEMON_COMMANDER_DECK_IDS } from "../../decks/bosses";

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

const BOSS_GAUGE: BossGaugeSpec = {
  id: "shadow_pressure",
  name: "暗影壓陣",
  description: "每召喚兵力 +8；每自方兵力存活回合開始 +5/個；每次攻擊命中 +3。滿值釋放暗影崩陣。",
  max: 100,
  triggers: [
    { kind: "onSummon", amount: 8 },
    { kind: "onTroopSurvivePerTurn", perUnit: 5 },
    { kind: "onAttackHit", amount: 3 },
  ],
  burstLabel: "暗影崩陣！",
  burstEffects: [
    {
      kind: "buff",
      target: { kind: "all", filter: { side: "self", entity: "troop" } },
      mod: { atk: 1, def: 1 },
      duration: { kind: "turns", count: 2 },
    },
    {
      kind: "damage",
      target: { kind: "all", filter: { side: "enemy", entity: "troop" } },
      amount: { kind: "const", value: 3 },
    },
    { kind: "stability", delta: -3 },
  ],
};

export const BOSS_DEMON_COMMANDER: BossDefinition = {
  id: BOSS_DEMON_COMMANDER_ID,
  name: "惡魔將領",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "boss_demon_commander",
  deckIds: BOSS_DEMON_COMMANDER_DECK_IDS,
  bossGauge: BOSS_GAUGE,
  description: "HP 130 / ATK 14 / DEF 7 / CMD 5。指揮型 Boss，召喚暗影兵衝擊穩定度。",
};
