export type TerrainType = "plain" | "forest" | "swamp" | "desert" | "mountain" | "water";

export type PathType = "road" | "trail" | "secret";

export type OwnerSide = "human" | "monster" | "neutral";

export type NodeType = "capital" | "city" | "main_nest" | "sub_nest" | "tribe" | "neutral";

export type BonusType =
  | "resource_yield"
  | "recruit_rate"
  | "research_rate"
  | "vision"
  | "terrain_defense"
  | "movement";

export type ViewMode = "omniscient" | "human" | "monster";

export type Position = {
  x: number;
  y: number;
};

export type GridCell = {
  c: number;
  r: number;
};

export type ContourLine = {
  level: number;
  kind: "minor" | "major";
  points: Position[];
};

export type TerrainRegion = {
  id: string;
  terrainType: TerrainType;
  bounds: [number, number, number, number];
  tags: string[];
  cells: GridCell[];
  outlines: Position[][];
};

export type NodeBonus = {
  type: BonusType;
  magnitude: number;
  resource?: "combat_resource" | "research_point" | "slave" | "monster_source";
  description: string;
  source: string;
};

export type GarrisonStack = {
  templateId: string;
  name: string;
  count: number;
  power: number;
};

export type GarrisonSummary = {
  strength: number;
  stacks: GarrisonStack[];
};

export type TowerMapNode = {
  id: string;
  name: string;
  nodeType: NodeType;
  owner: OwnerSide;
  position: Position;
  grid: { c: number; r: number };
  terrainId: string;
  terrainType: TerrainType;
  fortification: number;
  garrisonSummary: GarrisonSummary;
  bonuses: NodeBonus[];
  parentNestId: string | null;
  tags: string[];
};

export type TowerMapEdge = {
  id: string;
  a: string;
  b: string;
  pathType: PathType;
  length: number;
  terrainMix: Partial<Record<TerrainType, number>>;
  dominantTerrain: TerrainType;
  travelCost: number;
  revealedTo: OwnerSide[];
  polyline?: Position[];
};

export type GenerationPreset = "compact" | "standard" | "wide";

export type DensityPreset = "low" | "standard" | "high";

export type MapGenConfig = {
  seed: string;
  width: number;
  height: number;
  cellSize: number;
  humanCities: number;
  neutralNodes: number;
  extraEdgeRatio: number;
  preset: GenerationPreset;
  density: DensityPreset;
};

export type TowerMap = {
  schemaVersion: 1;
  generatedAt: string;
  seed: string;
  pixelWidth: number;
  pixelHeight: number;
  config: MapGenConfig;
  terrainGrid: TerrainType[][];
  terrainRegions: TerrainRegion[];
  elevationGrid: number[][];
  contourLines: ContourLine[];
  nodes: TowerMapNode[];
  edges: TowerMapEdge[];
  counts: {
    humanNodes: number;
    monsterNodes: number;
    neutralNodes: number;
    roads: number;
    trails: number;
    secrets: number;
  };
};

export type MapLayers = {
  terrain: boolean;
  factionZones: boolean;
  roads: boolean;
  trails: boolean;
  secrets: boolean;
  bonuses: boolean;
  garrison: boolean;
};

export type RoutePlan = {
  nodeIds: string[];
  edgeIds: string[];
  totalCost: number;
};
