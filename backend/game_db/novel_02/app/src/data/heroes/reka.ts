import type { HeroDefinition } from "../../core/types/hero";

export const HERO_REKA: HeroDefinition = {
  id: "reka",
  name: "芮卡",
  raceId: "beast",
  classId: "berserker",
  rarity: "SR",
  statTuning: { hp: -5, atk: 1, def: 1, cmd: -1 },
  gauge: {
    description: "每損失 10% HP +1 血怒；我方兵力被消滅時 +2 血怒。芮卡越接近肉搏，壓制力越強。",
    onTroopDestroyedSelf: 2,
    onHeroDamaged: { perPct: 10, perValue: 1 },
  },
  passives: [
    {
      id: "psv_desert_endurance",
      name: "沙漠耐戰",
      description: "芮卡自身 HP +5、ATK +1。",
      cost: {},
      passive: true,
      effects: [{ kind: "buff", target: { kind: "self" }, mod: { hp: 5, atk: 1 }, duration: { kind: "permanent" } }],
    },
  ],
  actives: [
    {
      id: "act_greatsword_pressure",
      name: "雙手大劍壓制",
      description: "對敵方單體造成 ATK ×1.5 傷害。（消耗 25 鬥志）",
      cost: { morale: 25 },
      effects: [{ kind: "damage", target: { kind: "single", filter: { side: "enemy" } }, amount: { kind: "atk", mult: 1.5 } }],
    },
    {
      id: "act_heel_breaker",
      name: "破防腿擊",
      description: "對敵方 1 個兵力造成 ATK +4 傷害，無視 DEF，並凍結 1 回合。（消耗 35 鬥志）",
      cost: { morale: 35 },
      effects: [
        { kind: "damage", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "atk", bonus: 4 }, ignoreDef: true },
        { kind: "freeze", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, turns: 1 },
      ],
    },
    {
      id: "act_second_wind",
      name: "熱砂續戰",
      description: "恢復自身 10 HP，獲得 6 護甲，血怒 +2。（消耗 40 鬥志）",
      cost: { morale: 40 },
      effects: [
        { kind: "heal", target: { kind: "self" }, amount: { kind: "const", value: 10 } },
        { kind: "armor", amount: 6 },
        { kind: "gauge", delta: 2, side: "self" },
      ],
    },
  ],
  ultimate: {
    id: "ult_wolfblood_overrun",
    name: "狼血碾進",
    description: "自身本回合 ATK +5；對敵方英雄造成（血怒 ×6 +20）傷害，無視守護。",
    cost: { morale: 100 },
    effects: [
      { kind: "buff", target: { kind: "self" }, mod: { atk: 5 }, duration: { kind: "thisTurn" } },
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "rage", mult: 6, bonus: 20 }, ignoreGuard: true },
    ],
  },
  flavor: "她不擅長談判；大劍落下前，任務通常已經談完。",
};
