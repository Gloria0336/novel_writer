export type OmenId =
  | "twin_moons"        // 雙月同圓
  | "minor_eclipse"     // 副月凌主月
  | "shard_rain"        // 碎片雨
  | "solar_eclipse"     // 日蝕
  | "meteor"            // 流星墜
  | "spirit_surge";     // 靈潮湧動

export interface OmenInstance {
  id: OmenId;
  remainingTurns: number;
}
