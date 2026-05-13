import type { FloorEntry, OmenId } from "./types";

/**
 * 30 層樓層表：
 * - 第 5/10/15/20/25/30 為 Boss
 * - 其餘 24 層為巢穴，依照固定循環分布六巢穴
 */
const LAIR_CYCLE = [
  "putrefactive_lair",
  "insect_hive",
  "beast_cave",
  "shadow_gate",
  "crystal_vein",
  "corrupted_temple",
];

const BOSS_PER_TIER = [
  "boss_demon_commander",   // floor 5
  "boss_nightmare_lord",    // floor 10
  "boss_elder_demon",       // floor 15
  "boss_fey_rebel_king",    // floor 20
  "boss_infernal_demon",    // floor 25
  "boss_beast_king",        // floor 30
];

export const FLOOR_TABLE: FloorEntry[] = buildFloorTable();

function buildFloorTable(): FloorEntry[] {
  const out: FloorEntry[] = [];
  let lairIdx = 0;
  let bossIdx = 0;
  for (let floor = 1; floor <= 30; floor++) {
    if (floor % 5 === 0) {
      out.push({ floor, kind: "boss", enemyId: BOSS_PER_TIER[bossIdx++]! });
    } else {
      out.push({ floor, kind: "lair", enemyId: LAIR_CYCLE[lairIdx % LAIR_CYCLE.length]! });
      lairIdx++;
    }
  }
  return out;
}

export function getFloorEntry(floor: number): FloorEntry {
  const e = FLOOR_TABLE[floor - 1];
  if (!e) throw new Error(`Unknown tower floor: ${floor}`);
  return e;
}

export interface OmenDef {
  id: OmenId;
  name: string;
  description: string;
  defaultTurns: number;
}

export const OMEN_DEFS: Record<OmenId, OmenDef> = {
  twin_moons:    { id: "twin_moons",    name: "雙月同圓",   description: "5 回合內每回合 +1 額外魔力。", defaultTurns: 5 },
  minor_eclipse: { id: "minor_eclipse", name: "副月凌主月", description: "7 回合內每回合穩定度 -1。", defaultTurns: 7 },
  shard_rain:    { id: "shard_rain",    name: "碎片雨",     description: "每回合結束隨機 1 兵力受 2 傷。", defaultTurns: 6 },
  solar_eclipse: { id: "solar_eclipse", name: "日蝕",       description: "10 回合內法術 +1 cost。", defaultTurns: 10 },
  meteor:        { id: "meteor",        name: "流星墜",     description: "每回合開始隨機 1 兵力 +3 ATK。", defaultTurns: 8 },
  spirit_surge:  { id: "spirit_surge",  name: "靈潮湧動",   description: "4 回合內所有量表累積 ×1.5。", defaultTurns: 4 },
};

export const OMEN_LIST: OmenId[] = Object.keys(OMEN_DEFS) as OmenId[];
