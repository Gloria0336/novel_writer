import type { HeroDefinition } from "../../core/types/hero";

export const HERO_LULU: HeroDefinition = {
  id: "lulu",
  name: "露露",
  raceId: "human",
  classId: "commander",
  rarity: "SR",
  statTuning: { hp: 0, atk: 2, def: 1, cmd: -1 },
  gauge: {
    description: "部署兵力 +10；場上每存活 1 兵力每回合 +4。露露以最低損傷指令維持軍令。",
    onTroopEnter: 10,
    onTroopSurvivePerTurn: 4,
  },
  passives: [
    {
      id: "psv_minimum_casualty_order",
      name: "最低損傷命令",
      description: "所有我方兵力 +1 DEF、+3 HP。",
      cost: {},
      passive: true,
      effects: [{ kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 1, hp: 3 }, duration: { kind: "permanent" } }],
    },
  ],
  actives: [
    {
      id: "act_sacred_blade_thrust",
      name: "聖劍突刺",
      description: "對敵方單體造成 ATK +6 傷害，無視守護。（消耗 25 鬥志）",
      cost: { morale: 25 },
      effects: [{ kind: "damage", target: { kind: "single", filter: { side: "enemy" } }, amount: { kind: "atk", bonus: 6 }, ignoreGuard: true }],
    },
    {
      id: "act_lowest_loss_command",
      name: "最低損傷指揮",
      description: "抽 1 張牌，獲得 8 護甲，軍令 +10。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [
        { kind: "draw", count: 1 },
        { kind: "armor", amount: 8 },
        { kind: "gauge", delta: 10, side: "self" },
      ],
    },
    {
      id: "act_first_legion_line",
      name: "第一軍團防線",
      description: "所有我方兵力本回合 DEF +4 並獲得守護。（消耗 40 鬥志）",
      cost: { morale: 40 },
      effects: [
        { kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 4 }, duration: { kind: "thisTurn" } },
        { kind: "addKeyword", target: { kind: "all", filter: { side: "self", entity: "troop" } }, keyword: "guard", duration: { kind: "thisTurn" } },
      ],
    },
  ],
  ultimate: {
    id: "ult_sword_resonance_command",
    name: "聖劍共鳴令",
    description: "對敵方所有兵力造成 18 傷害，無視守護；我方所有兵力 ATK +3、DEF +3，持續 2 回合。",
    cost: { morale: 100 },
    effects: [
      { kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 18 }, ignoreGuard: true },
      { kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { atk: 3, def: 3 }, duration: { kind: "turns", count: 2 } },
    ],
  },
  flavor: "「命令已下。傷亡降到最低，敵線由我切開。」",
};
