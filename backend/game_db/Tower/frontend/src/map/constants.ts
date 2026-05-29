import type { BonusType, DensityPreset, GenerationPreset, NodeType, OwnerSide, PathType, TerrainType } from "../types";

export const TERRAIN_LABELS: Record<TerrainType, string> = {
  plain: "平原",
  forest: "森林",
  swamp: "沼澤",
  desert: "沙漠",
  mountain: "山地",
  water: "水域"
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  plain: "#97ad66",
  forest: "#426c3d",
  swamp: "#68714f",
  desert: "#d2b968",
  mountain: "#9a9288",
  water: "#5d99c4"
};

export const TERRAIN_COST: Record<TerrainType, number> = {
  plain: 1,
  forest: 1.5,
  swamp: 2.2,
  desert: 1.8,
  mountain: 2,
  water: 3
};

export const PATH_LABELS: Record<PathType, string> = {
  road: "大道",
  trail: "小徑",
  secret: "密道"
};

export const PATH_COST: Record<PathType, number> = {
  road: 0.72,
  trail: 1,
  secret: 0.88
};

export const OWNER_LABELS: Record<OwnerSide, string> = {
  human: "人類",
  monster: "魔物",
  neutral: "中立"
};

export const OWNER_COLORS: Record<OwnerSide, string> = {
  human: "#2d5c9a",
  monster: "#a7374e",
  neutral: "#4b4b42"
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  capital: "王城",
  city: "城市",
  main_nest: "主巢",
  sub_nest: "副巢",
  tribe: "部落",
  neutral: "中立據點"
};

export const BONUS_LABELS: Record<BonusType, string> = {
  resource_yield: "資源產出",
  recruit_rate: "招募加速",
  research_rate: "研究加速",
  vision: "情報視野",
  terrain_defense: "地形防禦",
  movement: "行軍加成"
};

export const BONUS_BADGES: Record<BonusType, { label: string; color: string }> = {
  resource_yield: { label: "資", color: "#b76b24" },
  recruit_rate: { label: "募", color: "#397a3a" },
  research_rate: { label: "研", color: "#674aa5" },
  vision: { label: "視", color: "#2e6f9f" },
  terrain_defense: { label: "防", color: "#555f61" },
  movement: { label: "行", color: "#8b6a22" }
};

export const PRESET_DIMENSIONS: Record<GenerationPreset, { width: number; height: number }> = {
  compact: { width: 58, height: 38 },
  standard: { width: 72, height: 48 },
  wide: { width: 88, height: 48 }
};

export const DENSITY_VALUES: Record<DensityPreset, { humanCities: number; neutralNodes: number; extraEdgeRatio: number }> = {
  low: { humanCities: 2, neutralNodes: 4, extraEdgeRatio: 0.18 },
  standard: { humanCities: 3, neutralNodes: 5, extraEdgeRatio: 0.28 },
  high: { humanCities: 4, neutralNodes: 7, extraEdgeRatio: 0.42 }
};

export const DEFAULT_SEED = "20250529";
