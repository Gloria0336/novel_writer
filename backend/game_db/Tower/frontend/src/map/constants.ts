import type { BonusType, DensityPreset, GenerationPreset, OwnerSide, StructureType, TerrainType, TileFeature } from "../types";

export const TERRAIN_LABELS: Record<TerrainType, string> = {
  plain: "平原",
  forest: "森林",
  swamp: "沼澤",
  desert: "沙漠",
  mountain: "山地",
  water: "水域"
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  plain: "#96ac66",
  forest: "#496f3f",
  swamp: "#6e7651",
  desert: "#d3bd73",
  mountain: "#9b948b",
  water: "#659cc5"
};

export const TERRAIN_COST: Record<TerrainType, number> = {
  plain: 1,
  forest: 1.5,
  swamp: 2.2,
  desert: 1.8,
  mountain: 2.6,
  water: 5
};

export const FEATURE_LABELS: Record<TileFeature, string> = {
  road: "道路",
  bridge: "橋",
  secret_path: "密道",
  wall: "牆",
  moat: "壕",
  mine: "礦脈",
  ruin: "遺跡",
  ford: "淺灘"
};

export const OWNER_LABELS: Record<OwnerSide, string> = {
  human: "人類",
  monster: "魔物"
};

export const OWNER_COLORS: Record<OwnerSide, string> = {
  human: "#2d5c9a",
  monster: "#a7374e"
};

export const STRUCTURE_TYPE_LABELS: Record<StructureType, string> = {
  capital: "王城",
  city: "城市",
  main_nest: "主巢",
  sub_nest: "副巢",
  tribe: "部落",
  tower: "塔",
  barracks: "兵營",
  outpost: "哨站",
  fort: "堡壘"
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
  compact: { width: 30, height: 20 },
  standard: { width: 36, height: 24 },
  wide: { width: 46, height: 24 }
};

export const DENSITY_VALUES: Record<DensityPreset, { humanCities: number; neutralSites: number }> = {
  low: { humanCities: 2, neutralSites: 3 },
  standard: { humanCities: 3, neutralSites: 4 },
  high: { humanCities: 5, neutralSites: 7 }
};

export const DEFAULT_SEED = "20250529";
