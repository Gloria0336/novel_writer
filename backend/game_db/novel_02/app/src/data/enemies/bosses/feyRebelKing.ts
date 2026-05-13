import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { BossDefinition } from "./types";

/**
 * 妖族叛王 — §E.1 鏡像模式
 * HP 100 / ATK 13 / DEF 6 / CMD 5
 * 種族 fey / 職業 illusionist
 * 完整妖族雙形態（flags.feyForm + scripted FEY_FORM_SWITCH）。
 */
export const BOSS_FEY_REBEL_KING_ID = "boss_fey_rebel_king";

const HERO_DEF: HeroDefinition = {
  id: BOSS_FEY_REBEL_KING_ID,
  name: "妖族叛王",
  raceId: "fey",
  classId: "illusionist",
  rarity: "SSR",
  statTuning: {},
  gauge: {
    description: "靈蘊：每回合自動 +10；幻影被摧毀 +10；妖形每回合 -15。",
    onTroopEnter: 0,
    onTurnStart: 10,
    onTroopDestroyedSelf: 10,
  },
  passives: [
    {
      id: "psv_dual_form",
      name: "雙形之裔",
      description: "妖形：ATK +6 / DEF +4。人形：法術效果 +30%。每回合可切換一次形態。",
      cost: {},
      passive: true,
      effects: [],
    },
  ],
  actives: [
    {
      id: "act_form_switch",
      name: "形態轉換",
      description: "切換人形 / 妖形。（消耗 10 鬥志）",
      cost: { morale: 10 },
      effects: [{ kind: "scripted", tag: "FEY_FORM_SWITCH" }],
    },
    {
      id: "act_phantom_strike",
      name: "幻影一擊",
      description: "對 1 目標造成 ATK ×1.5 傷害。妖形下：×2。（消耗 25 鬥志）",
      cost: { morale: 25 },
      effects: [{ kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk", mult: 1.5 } }],
    },
    {
      id: "act_mirror_swarm",
      name: "鏡像風暴",
      description: "召喚 2 個幻影。（消耗 40 鬥志）",
      cost: { morale: 40 },
      effects: [{ kind: "summon", cardId: "I_PHANTOM", count: 2, side: "self" }],
    },
  ],
  ultimate: {
    id: "ult_ancestor_descent",
    name: "祖靈降臨",
    description: "3 回合內同享人形與妖形所有加成；對敵方英雄造 (ATK ×2) 傷害。",
    cost: { morale: 100 },
    effects: [
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "atk", mult: 2 } },
      { kind: "scripted", tag: "FEY_ANCESTOR_FORM", payload: { turns: 3 } },
    ],
  },
  flavor: "他既是妖族的領袖，也是叛離舊神的先驅。",
};

function createInstance(): HeroInstance {
  return {
    defId: BOSS_FEY_REBEL_KING_ID,
    hp: 100, maxHp: 100,
    atk: 13, def: 6, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false, feyForm: "fey", lastSummonTurn: 0 },
  };
}

export const BOSS_FEY_REBEL_KING: BossDefinition = {
  id: BOSS_FEY_REBEL_KING_ID,
  name: "妖族叛王",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "boss_fey_rebel_king",
  description: "HP 100 / ATK 13 / DEF 6 / CMD 5。幻術型 Boss，完整妖族雙形態切換。",
};
