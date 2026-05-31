export type TerrainType = "plain" | "forest" | "swamp" | "desert" | "mountain" | "water";

export type TileFeature = "road" | "bridge" | "secret_path" | "wall" | "moat" | "mine" | "ruin" | "ford";

export type OwnerSide = "human" | "monster";

export type StructureType = "capital" | "city" | "main_nest" | "sub_nest" | "tribe" | "tower" | "barracks" | "outpost" | "fort";

export type BonusType = "resource_yield" | "recruit_rate" | "research_rate" | "vision" | "terrain_defense" | "movement";

export type ViewMode = "omniscient" | "human" | "monster";

export type DeployIntent = "attack" | "reinforce" | "defend" | "hold";

export type Position = {
  x: number;
  y: number;
};

export type HexCoord = {
  q: number;
  r: number;
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
  scope: "tile" | "structure" | "both";
  description: string;
  source: string;
};

export type UnitStackSummary = {
  templateId: string;
  count: number;
};

export type GarrisonSummary = {
  strength: number;
  stacks: UnitStackSummary[];
};

export type Army = {
  id: string;
  owner: OwnerSide;
  position: HexCoord;
  movementPoints: number;
  units: UnitStackSummary[];
  eliteIds: string[];
  strength: number;
};

export type ArmyMove = {
  armyId: string;
  path: HexCoord[];
  intent: DeployIntent;
  eliteIds: string[];
};

export type Engagement = {
  id: string;
  location: HexCoord;
  month: number;
  attackers: string[];
  defenders: string[];
  attackerSide: OwnerSide | null;
  defenderSide: OwnerSide | null;
  structureId: string | null;
  reason: "army_collision" | "structure_assault" | "control_contest" | "attack_order";
};

export type HexTile = {
  coord: HexCoord;
  terrainType: TerrainType;
  elevation: number;
  features: TileFeature[];
  passable: boolean;
  movementCost: number;
  owner: OwnerSide | null;
  structureId: string | null;
  bonuses: NodeBonus[];
  position: Position;
};

export type Structure = {
  id: string;
  name: string;
  structureType: StructureType;
  owner: OwnerSide | null;
  footprint: HexCoord[];
  controlRadius: number;
  fortification: number;
  garrisonSummary: GarrisonSummary;
  bonuses: NodeBonus[];
  parentNestId: string | null;
  tags: string[];
  position: Position;
};

export type GenerationPreset = "compact" | "standard" | "wide";

export type DensityPreset = "low" | "standard" | "high";

export type MapGenConfig = {
  seed: string;
  width: number;
  height: number;
  hexSize: number;
  cellSize: number;
  humanCities: number;
  neutralSites: number;
  preset: GenerationPreset;
  density: DensityPreset;
};

export type TileMapPayload = {
  width: number;
  height: number;
  masterSeed: string;
  tiles: HexTile[];
};

export type TowerMap = {
  schemaVersion: 2;
  generatedAt: string;
  seed: string;
  pixelWidth: number;
  pixelHeight: number;
  config: MapGenConfig;
  tileMap: TileMapPayload;
  terrainGrid: TerrainType[][];
  terrainRegions: TerrainRegion[];
  elevationGrid: number[][];
  contourLines: ContourLine[];
  structures: Structure[];
  armies: Army[];
  engagements: Engagement[];
  counts: {
    tiles: number;
    structures: number;
    armies: number;
    humanStructures: number;
    monsterStructures: number;
    roads: number;
    bridges: number;
    secrets: number;
    neutralFeatures: number;
  };
};

export type MapLayers = {
  terrain: boolean;
  control: boolean;
  roads: boolean;
  bridges: boolean;
  secretPaths: boolean;
  features: boolean;
  structures: boolean;
  armies: boolean;
  movement: boolean;
  plannedPath: boolean;
  garrison: boolean;
};
