"""Tower canonical schema.

This module is the single source of truth for the Tower data shape.  M1 moves
the strategy map from a point graph to one continuous axial hex tile map.
Rules and balancing still live in ``design/*.md`` and ``data/*.yaml``; code that
loads or generates state should validate through these Pydantic v2 models.
"""

from __future__ import annotations

import hashlib
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, NonNegativeFloat, NonNegativeInt, model_validator


class StrEnum(str, Enum):
    """Small Python 3.10-compatible StrEnum shim.

    The target runtime is Python 3.14, but the local validation environment may
    use an older interpreter.
    """

    def __str__(self) -> str:
        return self.value


def derive_seed(master_seed: str, *parts: str | int) -> str:
    """Derive a deterministic child seed from a master seed and stable labels."""
    raw = "::".join([master_seed, *[str(part) for part in parts]])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


class Side(StrEnum):
    HUMAN = "human"
    MONSTER = "monster"


class TerrainType(StrEnum):
    PLAIN = "plain"
    FOREST = "forest"
    SWAMP = "swamp"
    DESERT = "desert"
    MOUNTAIN = "mountain"
    WATER = "water"


class TileFeature(StrEnum):
    ROAD = "road"
    BRIDGE = "bridge"
    SECRET_PATH = "secret_path"
    WALL = "wall"
    MOAT = "moat"
    MINE = "mine"
    RUIN = "ruin"
    FORD = "ford"


class StructureType(StrEnum):
    CAPITAL = "capital"
    CITY = "city"
    MAIN_NEST = "main_nest"
    SUB_NEST = "sub_nest"
    TRIBE = "tribe"
    TOWER = "tower"
    BARRACKS = "barracks"
    OUTPOST = "outpost"
    FORT = "fort"


class TurnPhase(StrEnum):
    DOMESTIC = "domestic"
    INTELLIGENCE = "intelligence"
    MILITARY = "military"
    COMBAT = "combat"


class ResourceKind(StrEnum):
    COMBAT_RESOURCE = "combat_resource"
    RESEARCH_POINT = "research_point"
    SLAVE = "slave"
    MONSTER_SOURCE = "monster_source"


class BonusType(StrEnum):
    RESOURCE_YIELD = "resource_yield"
    RECRUIT_RATE = "recruit_rate"
    RESEARCH_RATE = "research_rate"
    VISION = "vision"
    TERRAIN_DEFENSE = "terrain_defense"
    MOVEMENT = "movement"


class DomesticActionType(StrEnum):
    ALLOCATE = "allocate"
    RESEARCH = "research"
    RECRUIT = "recruit"
    BUILD = "build"
    BUILD_ROAD = "build_road"
    BUILD_BRIDGE = "build_bridge"
    FORTIFY = "fortify"
    TERRAFORM = "terraform"


class RaceGroup(StrEnum):
    GREENSKINS = "greenskins"
    FLESHES = "fleshes"
    FURES = "fures"
    UNDEADS = "undeads"
    DEMONS = "demons"


class TechCategory(StrEnum):
    GENE = "gene"
    WEAPON = "weapon"
    FORTIFICATION = "fortification"
    RECON = "recon"
    EVOLUTION = "evolution"
    MONSTER_RESEARCH = "monster_research"
    LOGISTICS = "logistics"
    ENGINEERING = "engineering"


class DeployIntent(StrEnum):
    ATTACK = "attack"
    REINFORCE = "reinforce"
    DEFEND = "defend"
    HOLD = "hold"


class CombatOutcome(StrEnum):
    CAPTURED = "captured"
    REPELLED = "repelled"
    ATTRITION = "attrition"
    STALEMATE = "stalemate"


class RandomEventType(StrEnum):
    REINFORCEMENT = "reinforcement"
    PLAGUE = "plague"
    BETRAYAL = "betrayal"
    RESOURCE_FIND = "resource_find"
    TERRAIN_SHIFT = "terrain_shift"
    MUTATION = "mutation"


class ConstructionStatus(StrEnum):
    QUEUED = "queued"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETE = "complete"
    CANCELLED = "cancelled"


class HexCoord(BaseModel):
    """Axial hex coordinate.  All strategic map positions use ``q,r``."""

    model_config = ConfigDict(frozen=True)

    q: int
    r: int

    def key(self) -> str:
        return f"{self.q},{self.r}"


class Position(BaseModel):
    """Pixel position for frontend layout only."""

    x: float
    y: float


class NodeBonus(BaseModel):
    """Reusable bonus payload applied to a tile, a structure, or both."""

    type: BonusType
    magnitude: float = Field(description="Multiplier deltas use 1.0=no change; yields are absolute values.")
    resource: ResourceKind | None = Field(default=None)
    scope: Literal["tile", "structure", "both"] = "structure"
    description: str = ""


class Tile(BaseModel):
    coord: HexCoord
    terrain_type: TerrainType
    elevation: int = Field(default=0, ge=0, le=5)
    features: list[TileFeature] = Field(default_factory=list)
    passable: bool = True
    movement_cost: NonNegativeFloat = 0.0
    owner: Side | None = None
    structure_id: str | None = None
    bonuses: list[NodeBonus] = Field(default_factory=list)

    @model_validator(mode="after")
    def _normalize_costs(self) -> Tile:
        feature_set = set(self.features)
        base_cost = {
            TerrainType.PLAIN: 1.0,
            TerrainType.FOREST: 1.5,
            TerrainType.SWAMP: 2.2,
            TerrainType.DESERT: 1.8,
            TerrainType.MOUNTAIN: 2.6,
            TerrainType.WATER: 5.0,
        }[self.terrain_type]
        base_cost += self.elevation * 0.15
        if TileFeature.ROAD in feature_set:
            base_cost *= 0.65
        if TileFeature.SECRET_PATH in feature_set:
            base_cost *= 0.75
        if self.terrain_type == TerrainType.WATER:
            self.passable = TileFeature.BRIDGE in feature_set or TileFeature.FORD in feature_set
            base_cost = 1.15 if TileFeature.BRIDGE in feature_set else 2.0 if TileFeature.FORD in feature_set else base_cost
        self.movement_cost = round(max(0.1, base_cost), 3)
        return self


class TileMap(BaseModel):
    width: int = Field(ge=1)
    height: int = Field(ge=1)
    tiles: list[Tile]
    master_seed: str

    @model_validator(mode="after")
    def _validate_tile_bounds(self) -> TileMap:
        seen: set[tuple[int, int]] = set()
        for tile in self.tiles:
            key = (tile.coord.q, tile.coord.r)
            if key in seen:
                raise ValueError(f"duplicate tile coord: {tile.coord.key()}")
            seen.add(key)
            if not (0 <= tile.coord.q < self.width and 0 <= tile.coord.r < self.height):
                raise ValueError(f"tile outside bounds: {tile.coord.key()}")
        return self

    def tile_at(self, coord: HexCoord | tuple[int, int]) -> Tile | None:
        q, r = (coord.q, coord.r) if isinstance(coord, HexCoord) else coord
        return next((tile for tile in self.tiles if tile.coord.q == q and tile.coord.r == r), None)

    def neighbors(self, coord: HexCoord | tuple[int, int]) -> list[Tile]:
        from .hexgeo import hex_neighbors

        base = coord if isinstance(coord, HexCoord) else HexCoord(q=coord[0], r=coord[1])
        return [tile for neighbor in hex_neighbors(base) if (tile := self.tile_at(neighbor)) is not None]


class MonsterSpecies(BaseModel):
    id: str
    name: str
    race_group: RaceGroup
    base_attack: NonNegativeFloat
    base_defense: NonNegativeFloat
    base_hp: NonNegativeFloat
    upkeep: NonNegativeFloat = 0
    slave_cost: NonNegativeInt = 0
    monster_source_cost: NonNegativeFloat = 0
    evolves_to: list[str] = Field(default_factory=list)
    traits: list[str] = Field(default_factory=list)
    description: str = ""


class UnitTemplate(BaseModel):
    id: str
    name: str
    side: Side
    attack: NonNegativeFloat
    defense: NonNegativeFloat
    hp: NonNegativeFloat
    range: NonNegativeFloat = 1.0
    move_speed: NonNegativeFloat = 1.0
    upkeep: NonNegativeFloat = 0
    cost: dict[ResourceKind, float] = Field(default_factory=dict)
    species_id: str | None = None
    abilities: list[str] = Field(default_factory=list)


class EliteTemplate(BaseModel):
    id: str
    name: str
    side: Side
    attack: NonNegativeFloat
    defense: NonNegativeFloat
    hp: NonNegativeFloat
    upkeep: NonNegativeFloat = 0
    aura: dict[str, float] = Field(default_factory=dict)
    abilities: list[str] = Field(default_factory=list)
    growth: dict[str, float] = Field(default_factory=dict)
    xp_per_level: NonNegativeFloat = 10
    max_level: int = Field(default=5, ge=1)
    description: str = ""


class TechNode(BaseModel):
    id: str
    name: str
    category: TechCategory
    side: Side
    cost: dict[ResourceKind, float] = Field(default_factory=dict)
    prerequisites: list[str] = Field(default_factory=list)
    excludes: list[str] = Field(default_factory=list)
    effects: dict[str, float] = Field(default_factory=dict)
    description: str = ""


class Catalog(BaseModel):
    monsters: dict[str, MonsterSpecies] = Field(default_factory=dict)
    units: dict[str, UnitTemplate] = Field(default_factory=dict)
    elites: dict[str, EliteTemplate] = Field(default_factory=dict)
    techs: dict[str, TechNode] = Field(default_factory=dict)
    node_bonus_templates: dict[str, list[NodeBonus]] = Field(
        default_factory=dict,
        description="Template key may be a terrain, feature, or structure type.",
    )


class UnitStack(BaseModel):
    template_id: str
    count: NonNegativeInt
    attack: NonNegativeFloat | None = None
    defense: NonNegativeFloat | None = None
    hp: NonNegativeFloat | None = None


class EliteInstance(BaseModel):
    instance_id: str
    template_id: str
    level: int = Field(default=1, ge=1)
    xp: NonNegativeFloat = 0
    hp: NonNegativeFloat | None = None
    alive: bool = True


class Structure(BaseModel):
    id: str
    name: str
    structure_type: StructureType
    owner: Side | None = None
    footprint: list[HexCoord]
    control_radius: NonNegativeInt = 1
    fortification: NonNegativeFloat = 1.0
    garrison: list[UnitStack] = Field(default_factory=list)
    elites: list[EliteInstance] = Field(default_factory=list)
    bonuses: list[NodeBonus] = Field(default_factory=list)
    parent_nest_id: str | None = None
    tags: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _has_footprint(self) -> Structure:
        if not self.footprint:
            raise ValueError("structure footprint may not be empty")
        return self


def controlled_tiles(structure: Structure) -> list[HexCoord]:
    """Return all coords in the structure footprint plus its control radius."""
    from .hexgeo import hex_range

    coords: dict[str, HexCoord] = {}
    for coord in structure.footprint:
        for candidate in hex_range(coord, int(structure.control_radius)):
            coords[candidate.key()] = candidate
    return sorted(coords.values(), key=lambda item: (item.q, item.r))


class Army(BaseModel):
    """Movable strategic army on the continuous hex map."""

    id: str
    owner: Side
    position: HexCoord
    movement_points: NonNegativeFloat = 0
    base_movement_points: NonNegativeFloat = 0
    units: list[UnitStack] = Field(default_factory=list)
    elite_ids: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _has_units_or_elites(self) -> Army:
        if not self.units and not self.elite_ids:
            raise ValueError("army must contain at least one unit stack or elite")
        return self

    @model_validator(mode="after")
    def _seed_base_movement_points(self) -> Army:
        # Auto-seed the per-month movement budget from the initial allowance so
        # reset_movement_points() (P2.1) has a stable baseline without callers
        # passing it explicitly.
        if self.base_movement_points == 0 and self.movement_points > 0:
            self.base_movement_points = self.movement_points
        return self


class ArmyMove(BaseModel):
    """MILITARY phase order for moving one army along validated hexes."""

    army_id: str
    path: list[HexCoord]
    intent: DeployIntent = DeployIntent.HOLD
    elite_ids: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _path_is_present(self) -> ArmyMove:
        if not self.path:
            raise ValueError("ArmyMove.path may not be empty")
        if self.intent in (DeployIntent.DEFEND, DeployIntent.HOLD) and len(self.path) > 1:
            raise ValueError("DEFEND/HOLD army moves may not change position")
        return self

    @property
    def destination(self) -> HexCoord:
        return self.path[-1]


class Engagement(BaseModel):
    """Strategic combat trigger discovered after M2 army movement."""

    id: str
    location: HexCoord
    month: int
    attackers: list[str] = Field(default_factory=list)
    defenders: list[str] = Field(default_factory=list)
    attacker_side: Side | None = None
    defender_side: Side | None = None
    structure_id: str | None = None
    reason: Literal["army_collision", "structure_assault", "control_contest", "attack_order"] = "army_collision"


class MapGenConfig(BaseModel):
    seed: str
    width: int = Field(default=36, ge=8)
    height: int = Field(default=24, ge=8)
    human_cities: int = Field(default=3, ge=0)
    sub_nests: tuple[int, int] = Field(default=(1, 3))
    tribes: tuple[int, int] = Field(default=(2, 4))
    neutral_sites: int = Field(default=4, ge=0)
    elite_roster_size: tuple[int, int] = Field(default=(5, 8))


class DomesticAction(BaseModel):
    type: DomesticActionType
    target_id: str | None = Field(default=None)
    structure_id: str | None = Field(default=None)
    quantity: float = 1
    payload: dict[str, Any] = Field(default_factory=dict)


class DomesticOrder(BaseModel):
    side: Side
    month: int
    actions: list[DomesticAction] = Field(default_factory=list)


class Building(BaseModel):
    id: str
    name: str
    structure_id: str
    level: int = 1
    bonuses: list[NodeBonus] = Field(default_factory=list)


class TroopMovement(BaseModel):
    """TODO(P2.2): replace ref-based deployment with ArmyMove path validation."""

    from_ref: str
    to_ref: str
    intent: DeployIntent
    units: list[UnitStack] = Field(default_factory=list)
    elite_ids: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _stationary_intents_stay_put(self) -> TroopMovement:
        if self.intent in (DeployIntent.DEFEND, DeployIntent.HOLD) and self.from_ref != self.to_ref:
            raise ValueError("DEFEND/HOLD movements must stay on the same reference until P2.2")
        return self


class Deployment(BaseModel):
    side: Side
    month: int
    movements: list[ArmyMove] = Field(default_factory=list)
    legacy_movements: list[TroopMovement] = Field(default_factory=list)


class ConstructionProject(BaseModel):
    """M1 shell for the M3 construction queue."""

    id: str
    owner: Side
    kind: DomesticActionType
    target_tiles: list[HexCoord] = Field(default_factory=list)
    cost: dict[ResourceKind, float] = Field(default_factory=dict)
    turns_remaining: NonNegativeInt = 1
    status: ConstructionStatus = ConstructionStatus.QUEUED
    payload: dict[str, Any] = Field(default_factory=dict)


class IntelReport(BaseModel):
    observer: Side
    target_id: str
    target_kind: Literal["tile", "structure", "army"] = "structure"
    month: int
    clarity: float = Field(ge=0, le=1)
    is_accurate: bool = True
    observed_owner: Side | None = None
    observed_garrison_range: tuple[int, int] = (0, 0)
    observed_intents: list[DeployIntent] = Field(default_factory=list)
    seed: str = ""
    notes: str = ""


class CombatRound(BaseModel):
    index: int
    attacker_power: float
    defender_power: float
    roll_modifier: float = 0
    attacker_losses: float = 0
    defender_losses: float = 0
    note: str = ""


class CombatReport(BaseModel):
    structure_id: str | None = None
    location: HexCoord
    month: int
    attacker: Side
    defender: Side | None
    attacker_power: float
    defender_power: float
    fortification: float = 1.0
    terrain_defense: float = 1.0
    rounds: list[CombatRound] = Field(default_factory=list)
    outcome: CombatOutcome
    attacker_casualties: int = 0
    defender_casualties: int = 0
    new_owner: Side | None = None
    seed: str = ""


class RandomEvent(BaseModel):
    id: str
    type: RandomEventType
    month: int
    affected_targets: list[str] = Field(default_factory=list)
    affected_side: Side | None = None
    effects: dict[str, float] = Field(default_factory=dict)
    description: str = ""
    seed: str = ""


class ResourcePool(BaseModel):
    amounts: dict[ResourceKind, float] = Field(default_factory=dict)

    def get(self, kind: ResourceKind) -> float:
        return self.amounts.get(kind, 0.0)


class Faction(BaseModel):
    side: Side
    name: str
    resources: ResourcePool = Field(default_factory=ResourcePool)
    researched_techs: list[str] = Field(default_factory=list)
    unlocked_species: list[str] = Field(default_factory=list)
    elite_roster: list[str] = Field(default_factory=list)
    intel_clarity_bonus: float = 0.0
    is_ai: bool = False


class TurnState(BaseModel):
    month: int = Field(default=1, ge=1)
    phase: TurnPhase = TurnPhase.DOMESTIC
    domestic_orders: dict[Side, DomesticOrder] = Field(default_factory=dict)
    deployments: dict[Side, Deployment] = Field(default_factory=dict)
    intel_reports: list[IntelReport] = Field(default_factory=list)

    def all_submitted(self, what: dict[Side, object]) -> bool:
        return Side.HUMAN in what and Side.MONSTER in what


class GameState(BaseModel):
    master_seed: str
    turn: TurnState = Field(default_factory=TurnState)
    factions: dict[Side, Faction] = Field(default_factory=dict)
    tile_map: TileMap
    structures: dict[str, Structure] = Field(default_factory=dict)
    armies: dict[str, Army] = Field(default_factory=dict)
    construction: list[ConstructionProject] = Field(default_factory=list)
    buildings: dict[str, Building] = Field(default_factory=dict)
    map_config: MapGenConfig | None = None
    combat_log: list[CombatReport] = Field(default_factory=list)
    engagements: list[Engagement] = Field(default_factory=list)
    event_log: list[RandomEvent] = Field(default_factory=list)
    winner: Side | None = None

    def tile_at(self, coord: HexCoord | tuple[int, int]) -> Tile | None:
        return self.tile_map.tile_at(coord)

    def hex_neighbors(self, coord: HexCoord | tuple[int, int]) -> list[Tile]:
        return self.tile_map.neighbors(coord)
