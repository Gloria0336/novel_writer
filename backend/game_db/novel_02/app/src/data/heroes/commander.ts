import type { HeroDefinition } from "../../core/types/hero";

export const HERO_COMMANDER: HeroDefinition = {
  id: "commander_legion",
  name: "軍團統帥",
  raceId: "human",
  classId: "commander",
  rarity: "SR",
  statTuning: { hp: 0, atk: 0, def: 0, cmd: 0 },
  gauge: {
    description: "部署兵力 +10；場上每存活 1 兵力每回合 +5。",
    onTroopEnter: 10,
    onTroopSurvivePerTurn: 5,
  },
  passives: [
    {
      id: "psv_legion_banner",
      name: "軍團旗幟",
      description: "所有我方兵力 +2 DEF、+5 HP。",
      cost: {},
      passive: true,
      effects: [{ kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 2, hp: 5 }, duration: { kind: "permanent" } }],
    },
  ],
  actives: [
    {
      id: "act_conscript",
      name: "徵召令",
      description: "從牌庫搜尋 1 張兵力卡加入手牌（消耗 30 鬥志）。",
      cost: { morale: 30 },
      effects: [{ kind: "search", predicate: { type: "troop" }, toHand: true }],
    },
    {
      id: "act_hold_line",
      name: "堅守陣線",
      description: "所有兵力本回合 DEF ×2（+5 DEF 近似）。（消耗 40 鬥志）",
      cost: { morale: 40 },
      effects: [{ kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 5 }, duration: { kind: "thisTurn" } }],
    },
    {
      id: "act_battle_command",
      name: "戰場調度",
      description: "所有兵力本回合 ATK +3。（消耗 20 鬥志）",
      cost: { morale: 20 },
      effects: [{ kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { atk: 3 }, duration: { kind: "thisTurn" } }],
    },
  ],
  ultimate: {
    id: "ult_total_mobilization",
    name: "帝國總動員",
    description: "立即部署手牌中所有兵力卡（不消耗魔力，無暈眩）。本回合所有兵力 ATK + 場上兵力數 ×2。",
    cost: { morale: 100 },
    effects: [{ kind: "scripted", tag: "TOTAL_MOBILIZATION" }],
  },
  flavor: "「列陣！前進！我以軍團之名，命你寸步不退！」",
};
