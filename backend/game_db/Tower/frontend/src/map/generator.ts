import type {
  Army,
  DensityPreset,
  GenerationPreset,
  GarrisonSummary,
  HexCoord,
  HexTile,
  MapGenConfig,
  NodeBonus,
  OwnerSide,
  Position,
  Structure,
  StructureType,
  TerrainType,
  TileFeature,
  TowerMap
} from "../types";
import { DEFAULT_SEED, DENSITY_VALUES, PRESET_DIMENSIONS, TERRAIN_COST } from "./constants";
import { detectEngagements } from "./engagement";
import { randomInt, randomRange, rngFromSeed, stableNoise, type RandomSource, weightedPick } from "./rng";

type Zone = "human" | "monster" | "contested";

type PlacementOptions = {
  centerQ: number;
  centerR: number;
  radius: number;
  zone: Zone;
  minDistance: number;
  index: number;
  parentNestId?: string | null;
};

const TERRAIN_WEIGHTS: Array<[TerrainType, number]> = [
  ["plain", 30],
  ["forest", 20],
  ["mountain", 16],
  ["swamp", 12],
  ["water", 12],
  ["desert", 10]
];

const STRUCTURE_FORTIFICATION: Record<StructureType, [number, number]> = {
  capital: [2.2, 3],
  city: [1.4, 1.8],
  main_nest: [1.3, 1.6],
  sub_nest: [1.1, 1.3],
  tribe: [1, 1.1],
  tower: [1.2, 1.5],
  barracks: [1, 1.2],
  outpost: [1.1, 1.4],
  fort: [1.5, 2]
};

export const DEFAULT_CONFIG: MapGenConfig = {
  seed: DEFAULT_SEED,
  width: PRESET_DIMENSIONS.standard.width,
  height: PRESET_DIMENSIONS.standard.height,
  hexSize: 12,
  cellSize: 12,
  humanCities: DENSITY_VALUES.standard.humanCities,
  neutralSites: DENSITY_VALUES.standard.neutralSites,
  preset: "standard",
  density: "standard"
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 3): number {
  const pow = 10 ** digits;
  return Math.round(value * pow) / pow;
}

function coordKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

function hexSize(config: MapGenConfig): number {
  return config.hexSize;
}

export function axialToPixel(coord: HexCoord, config: MapGenConfig): Position {
  const size = hexSize(config);
  const margin = size * 2.2;
  return {
    x: margin + size * Math.sqrt(3) * (coord.q + coord.r / 2),
    y: margin + size * 1.5 * coord.r
  };
}

function hexDistance(a: HexCoord, b: HexCoord): number {
  const as = -a.q - a.r;
  const bs = -b.q - b.r;
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(as - bs)) / 2;
}

function cubeRound(q: number, r: number, s: number): HexCoord {
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
  else if (rDiff > sDiff) rr = -rq - rs;
  return { q: rq, r: rr };
}

function hexLine(a: HexCoord, b: HexCoord): HexCoord[] {
  const distance = hexDistance(a, b);
  if (distance === 0) return [a];
  const out: HexCoord[] = [];
  const as = -a.q - a.r;
  const bs = -b.q - b.r;
  for (let step = 0; step <= distance; step += 1) {
    const t = step / distance;
    out.push(cubeRound(a.q + (b.q - a.q) * t, a.r + (b.r - a.r) * t, as + (bs - as) * t));
  }
  return out;
}

function hexRange(center: HexCoord, radius: number): HexCoord[] {
  const out: HexCoord[] = [];
  for (let dq = -radius; dq <= radius; dq += 1) {
    for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr += 1) {
      out.push({ q: center.q + dq, r: center.r + dr });
    }
  }
  return out;
}

export function configForPresets(seed: string, preset: GenerationPreset, density: DensityPreset): MapGenConfig {
  const dimensions = PRESET_DIMENSIONS[preset];
  const densityValues = DENSITY_VALUES[density];
  return {
    ...DEFAULT_CONFIG,
    ...dimensions,
    ...densityValues,
    seed,
    preset,
    density
  };
}

export function normalizeConfig(input: Partial<MapGenConfig> = {}): MapGenConfig {
  const seed = input.seed?.trim() || DEFAULT_CONFIG.seed;
  const preset = input.preset ?? DEFAULT_CONFIG.preset;
  const density = input.density ?? DEFAULT_CONFIG.density;
  return {
    ...configForPresets(seed, preset, density),
    ...input,
    seed,
    preset,
    density,
    cellSize: input.hexSize ?? input.cellSize ?? DEFAULT_CONFIG.hexSize
  };
}

function bonus(source: string, type: NodeBonus["type"], magnitude: number, description: string, resource?: NodeBonus["resource"]): NodeBonus {
  return { source, type, magnitude, description, resource, scope: "both" };
}

function terrainBonuses(tile: HexTile): NodeBonus[] {
  const out: NodeBonus[] = [];
  if (tile.terrainType === "mountain") {
    out.push(bonus("mountain", "terrain_defense", 1.5, "山地易守"));
    out.push(bonus("mountain", "vision", 0.25, "高地視野"));
  }
  if (tile.terrainType === "swamp") {
    out.push(bonus("marsh", "terrain_defense", 1.3, "沼澤遲滯"));
    out.push(bonus("marsh", "movement", -0.25, "沼澤拖慢行軍"));
  }
  if (tile.features.includes("mine")) out.push(bonus("mine", "resource_yield", 5, "礦脈", "combat_resource"));
  if (tile.features.includes("ruin")) out.push(bonus("ruin", "research_rate", 0.15, "古代遺跡"));
  if (tile.features.includes("ford")) out.push(bonus("ford", "movement", 0.2, "淺灘渡口"));
  return out;
}

function structureBonuses(type: StructureType, terrain: TerrainType): NodeBonus[] {
  const out: NodeBonus[] = [];
  if (type === "capital") {
    out.push(bonus("capital", "resource_yield", 8, "王城產出戰鬥資源", "combat_resource"));
    out.push(bonus("capital", "research_rate", 0.3, "王城學院"));
    out.push(bonus("capital", "terrain_defense", 1.4, "王城天險"));
  }
  if (type === "city") {
    out.push(bonus("city", "resource_yield", 4, "城市產出", "combat_resource"));
    out.push(bonus("city", "recruit_rate", 0.2, "城市兵營"));
  }
  if (type === "main_nest") {
    out.push(bonus("main_nest", "resource_yield", 6, "主巢魔物源", "monster_source"));
    out.push(bonus("main_nest", "recruit_rate", 0.3, "主巢孵化池"));
  }
  if (type === "sub_nest") {
    out.push(bonus("sub_nest", "resource_yield", 3, "副巢魔物源", "monster_source"));
    out.push(bonus("sub_nest", "recruit_rate", 0.15, "副巢孵化"));
  }
  if (type === "tribe") out.push(bonus("tribe", "recruit_rate", 0.1, "部落補員"));
  if (terrain === "mountain") out.push(bonus("mountain", "terrain_defense", 1.5, "山地易守"));
  if (terrain === "swamp") out.push(bonus("marsh", "terrain_defense", 1.3, "沼澤遲滯"));
  return out;
}

function garrisonFor(type: StructureType, owner: OwnerSide): GarrisonSummary {
  if (owner === "human") {
    const strength = type === "capital" ? 920 : 330;
    return {
      strength,
      stacks: [
        { templateId: "militia", count: type === "capital" ? 55 : 24 },
        { templateId: "knight", count: type === "capital" ? 18 : 6 }
      ]
    };
  }
  const strength = type === "main_nest" ? 760 : type === "sub_nest" ? 320 : 130;
  return {
    strength,
    stacks: [
      { templateId: "goblin", count: type === "tribe" ? 30 : 72 },
      ...(type === "main_nest" ? [{ templateId: "orc", count: 18 }] : [])
    ]
  };
}

function stackStrength(stack: { templateId: string; count: number }): number {
  const base: Record<string, number> = {
    militia: 8,
    knight: 18,
    goblin: 5,
    orc: 14,
    slime: 7
  };
  return stack.count * (base[stack.templateId] ?? 6);
}

function armyStrength(units: Army["units"]): number {
  return units.reduce((total, stack) => total + stackStrength(stack), 0);
}

function movementCost(tile: Pick<HexTile, "terrainType" | "features" | "elevation">): number {
  let cost = TERRAIN_COST[tile.terrainType] + tile.elevation * 0.15;
  if (tile.features.includes("road")) cost *= 0.65;
  if (tile.features.includes("secret_path")) cost *= 0.75;
  if (tile.terrainType === "water") {
    if (tile.features.includes("bridge")) cost = 1.15;
    else if (tile.features.includes("ford")) cost = 2;
  }
  return round(Math.max(0.1, cost));
}

function normalizeTile(tile: HexTile): HexTile {
  const passable = tile.terrainType !== "water" || tile.features.includes("bridge") || tile.features.includes("ford");
  const movementCostValue = movementCost(tile);
  const normalized = { ...tile, passable, movementCost: movementCostValue };
  return { ...normalized, bonuses: terrainBonuses(normalized) };
}

function structureName(type: StructureType, index: number): string {
  if (type === "capital") return "星冠王城";
  if (type === "main_nest") return "黑喉主巢";
  if (type === "city") return `邊境城市 ${index}`;
  if (type === "sub_nest") return `裂牙副巢 ${index}`;
  if (type === "tribe") return `血角部落 ${index}`;
  return `${type} ${index}`;
}

function tileGrid(map: Map<string, HexTile>, coord: HexCoord): HexTile | undefined {
  return map.get(coordKey(coord));
}

export function generateTowerMap(input: Partial<MapGenConfig> = {}): TowerMap {
  const config = normalizeConfig(input);
  const rng = rngFromSeed(config.seed);
  const warpQ = stableNoise(rng);
  const warpR = stableNoise(rng);
  const terrainSeedCount = Math.max(12, Math.round((config.width * config.height) / 42));
  const terrainSeeds = Array.from({ length: terrainSeedCount }, () => ({
    q: rng() * config.width,
    r: rng() * config.height,
    terrain: weightedPick(rng, TERRAIN_WEIGHTS)
  }));

  const tilesByKey = new Map<string, HexTile>();
  const terrainGrid: TerrainType[][] = [];
  const elevationGrid: number[][] = [];
  for (let r = 0; r < config.height; r += 1) {
    const terrainRow: TerrainType[] = [];
    const elevationRow: number[] = [];
    for (let q = 0; q < config.width; q += 1) {
      const warpedQ = q + (warpQ(q * 0.11, r * 0.11) - 0.5) * 5.5;
      const warpedR = r + (warpR(q * 0.11, r * 0.11) - 0.5) * 5.5;
      const seed = terrainSeeds.reduce((best, candidate) => {
        const bestDistance = (warpedQ - best.q) ** 2 + (warpedR - best.r) ** 2;
        const candidateDistance = (warpedQ - candidate.q) ** 2 + (warpedR - candidate.r) ** 2;
        return candidateDistance < bestDistance ? candidate : best;
      }, terrainSeeds[0]);
      const elevationBase: Record<TerrainType, number> = { plain: 1, forest: 2, swamp: 0, desert: 1, mountain: 4, water: 0 };
      const elevation = clamp(elevationBase[seed.terrain] + Math.floor(rng() * 2), 0, 5);
      const coord = { q, r };
      const tile = normalizeTile({
        coord,
        terrainType: seed.terrain,
        elevation,
        features: [],
        passable: true,
        movementCost: 0,
        owner: null,
        structureId: null,
        bonuses: [],
        position: axialToPixel(coord, config)
      });
      tilesByKey.set(coordKey(coord), tile);
      terrainRow.push(tile.terrainType);
      elevationRow.push(elevation / 5);
    }
    terrainGrid.push(terrainRow);
    elevationGrid.push(elevationRow);
  }

  const structures: Structure[] = [];
  const occupied = new Set<string>();
  const zoneOf = (coord: HexCoord): Zone => {
    const left = Math.round(config.width * 0.42);
    const right = Math.round(config.width * 0.58);
    if (coord.q < left) return "human";
    if (coord.q > right) return "monster";
    return "contested";
  };
  const validPlacement = (coord: HexCoord, zone: Zone, minDistance: number) => {
    const tile = tileGrid(tilesByKey, coord);
    if (!tile || tile.terrainType === "water" || occupied.has(coordKey(coord)) || zoneOf(coord) !== zone) return false;
    return structures.every((item) => hexDistance(item.footprint[0], coord) >= minDistance);
  };

  const place = (type: StructureType, owner: OwnerSide, options: PlacementOptions): Structure => {
    let coord: HexCoord | null = null;
    for (let attempt = 0; attempt < 520; attempt += 1) {
      const candidate = {
        q: clamp(Math.round(options.centerQ + randomRange(rng, -options.radius, options.radius)), 1, config.width - 2),
        r: clamp(Math.round(options.centerR + randomRange(rng, -options.radius, options.radius)), 1, config.height - 2)
      };
      if (validPlacement(candidate, options.zone, options.minDistance)) {
        coord = candidate;
        break;
      }
    }
    if (!coord) {
      const fallback = [...tilesByKey.values()].find((tile) => validPlacement(tile.coord, options.zone, Math.max(1, options.minDistance - 2)));
      if (!fallback) throw new Error(`cannot place structure: ${type}`);
      coord = fallback.coord;
    }
    occupied.add(coordKey(coord));
    const tile = tileGrid(tilesByKey, coord)!;
    const [fortMin, fortMax] = STRUCTURE_FORTIFICATION[type];
    const structure: Structure = {
      id: `${type}-${options.index}`,
      name: structureName(type, options.index),
      structureType: type,
      owner,
      footprint: [coord],
      controlRadius: type === "capital" || type === "main_nest" ? 2 : 1,
      fortification: round(randomRange(rng, fortMin, fortMax), 2),
      garrisonSummary: garrisonFor(type, owner),
      bonuses: structureBonuses(type, tile.terrainType),
      parentNestId: options.parentNestId ?? null,
      tags: [tile.terrainType],
      position: tile.position
    };
    structures.push(structure);
    return structure;
  };

  const capital = place("capital", "human", {
    centerQ: config.width * 0.14,
    centerR: config.height * 0.5,
    radius: Math.max(3, config.width / 10),
    zone: "human",
    minDistance: 0,
    index: 1
  });
  const mainNest = place("main_nest", "monster", {
    centerQ: config.width * 0.86,
    centerR: config.height * 0.5,
    radius: Math.max(3, config.width / 10),
    zone: "monster",
    minDistance: 0,
    index: 1
  });
  for (let index = 1; index <= config.humanCities; index += 1) {
    place("city", "human", {
      centerQ: config.width * randomRange(rng, 0.22, 0.4),
      centerR: config.height * randomRange(rng, 0.15, 0.85),
      radius: Math.max(3, config.width / 12),
      zone: "human",
      minDistance: 4,
      index
    });
  }
  const subNestCount = randomInt(rng, 1, 3);
  const tribeCount = randomInt(rng, 2, 4);
  for (let index = 1; index <= subNestCount; index += 1) {
    place("sub_nest", "monster", {
      centerQ: mainNest.footprint[0].q,
      centerR: mainNest.footprint[0].r,
      radius: Math.max(4, config.width / 6),
      zone: "monster",
      minDistance: 3,
      index,
      parentNestId: mainNest.id
    });
  }
  for (let index = 1; index <= tribeCount; index += 1) {
    place("tribe", "monster", {
      centerQ: mainNest.footprint[0].q,
      centerR: mainNest.footprint[0].r,
      radius: Math.max(5, config.width / 4),
      zone: "monster",
      minDistance: 2,
      index,
      parentNestId: mainNest.id
    });
  }

  const contested = [...tilesByKey.values()].filter((tile) => zoneOf(tile.coord) === "contested" && tile.terrainType !== "water");
  const features: TileFeature[] = ["mine", "ruin", "ford"];
  for (let index = 0; index < Math.min(config.neutralSites, contested.length); index += 1) {
    const chosen = contested.splice(randomInt(rng, 0, contested.length - 1), 1)[0];
    chosen.features = [...new Set([...chosen.features, features[index % features.length]])].sort();
  }

  const applyPath = (path: HexCoord[], secret = false) => {
    for (const coord of path) {
      const tile = tileGrid(tilesByKey, coord);
      if (!tile) continue;
      const next = new Set(tile.features);
      if (secret) {
        next.add("secret_path");
        if (tile.terrainType === "water") next.add("bridge");
      } else if (tile.terrainType === "water") {
        next.add("bridge");
      } else {
        next.add("road");
      }
      tile.features = [...next].sort();
    }
  };
  for (const structure of structures) {
    if (structure.owner === "human" && structure.id !== capital.id) applyPath(hexLine(capital.footprint[0], structure.footprint[0]));
    if (structure.owner === "monster" && structure.structureType === "sub_nest") applyPath(hexLine(mainNest.footprint[0], structure.footprint[0]));
    if (structure.owner === "monster" && structure.structureType === "tribe") applyPath(hexLine(mainNest.footprint[0], structure.footprint[0]), true);
  }

  for (const structure of structures) {
    for (const coord of hexRange(structure.footprint[0], structure.controlRadius)) {
      const tile = tileGrid(tilesByKey, coord);
      if (tile && !tile.owner) tile.owner = structure.owner;
    }
    const footprintTile = tileGrid(tilesByKey, structure.footprint[0]);
    if (footprintTile) {
      footprintTile.owner = structure.owner;
      footprintTile.structureId = structure.id;
    }
  }

  const tiles = [...tilesByKey.values()].map(normalizeTile).sort((a, b) => a.coord.r - b.coord.r || a.coord.q - b.coord.q);
  const byCoord = new Map(tiles.map((tile) => [coordKey(tile.coord), tile]));
  const finalStructures = structures.map((structure) => ({
    ...structure,
    position: byCoord.get(coordKey(structure.footprint[0]))?.position ?? structure.position
  }));
  const humanAnchor = finalStructures.find((item) => item.structureType === "capital") ?? finalStructures.find((item) => item.owner === "human");
  const humanCity = finalStructures.find((item) => item.structureType === "city") ?? humanAnchor;
  const monsterAnchor = finalStructures.find((item) => item.structureType === "main_nest") ?? finalStructures.find((item) => item.owner === "monster");
  const monsterTribe = finalStructures.find((item) => item.structureType === "tribe") ?? monsterAnchor;
  const armyDrafts: Array<Omit<Army, "strength">> = [
    {
      id: "human-army-1",
      owner: "human",
      position: humanAnchor?.footprint[0] ?? { q: 0, r: 0 },
      movementPoints: 6,
      units: [
        { templateId: "militia", count: 22 },
        { templateId: "knight", count: 5 }
      ],
      eliteIds: []
    },
    {
      id: "human-army-2",
      owner: "human",
      position: humanCity?.footprint[0] ?? humanAnchor?.footprint[0] ?? { q: 0, r: 0 },
      movementPoints: 5,
      units: [{ templateId: "militia", count: 16 }],
      eliteIds: []
    },
    {
      id: "monster-army-1",
      owner: "monster",
      position: monsterAnchor?.footprint[0] ?? { q: config.width - 1, r: config.height - 1 },
      movementPoints: 6,
      units: [
        { templateId: "goblin", count: 64 },
        { templateId: "orc", count: 10 }
      ],
      eliteIds: []
    },
    {
      id: "monster-army-2",
      owner: "monster",
      position: monsterTribe?.footprint[0] ?? monsterAnchor?.footprint[0] ?? { q: config.width - 1, r: config.height - 1 },
      movementPoints: 5,
      units: [{ templateId: "goblin", count: 36 }],
      eliteIds: []
    }
  ];
  const armies = armyDrafts.map((army) => ({ ...army, strength: armyStrength(army.units) }));

  const margin = config.hexSize * 2.2;
  const pixelWidth = Math.ceil(margin * 2 + config.hexSize * Math.sqrt(3) * (config.width + config.height / 2));
  const pixelHeight = Math.ceil(margin * 2 + config.hexSize * (1.5 * (config.height - 1) + 2));
  const roadTiles = tiles.filter((tile) => tile.features.includes("road")).length;
  const bridgeTiles = tiles.filter((tile) => tile.features.includes("bridge")).length;
  const secretTiles = tiles.filter((tile) => tile.features.includes("secret_path")).length;

  return {
    schemaVersion: 2,
    generatedAt: "1970-01-01T00:00:00.000Z",
    seed: config.seed,
    pixelWidth,
    pixelHeight,
    config,
    tileMap: {
      width: config.width,
      height: config.height,
      masterSeed: config.seed,
      tiles
    },
    terrainGrid,
    terrainRegions: [],
    elevationGrid,
    contourLines: [],
    structures: finalStructures,
    armies,
    engagements: detectEngagements(
      {
        structures: finalStructures,
        armies,
        tileMap: { tiles }
      } as unknown as TowerMap,
      1
    ),
    counts: {
      tiles: tiles.length,
      structures: finalStructures.length,
      armies: armies.length,
      humanStructures: finalStructures.filter((item) => item.owner === "human").length,
      monsterStructures: finalStructures.filter((item) => item.owner === "monster").length,
      roads: roadTiles,
      bridges: bridgeTiles,
      secrets: secretTiles,
      neutralFeatures: tiles.filter((tile) => tile.features.some((feature) => feature === "mine" || feature === "ruin" || feature === "ford")).length
    }
  };
}
