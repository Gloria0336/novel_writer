"""Deterministic M1 hex map generation."""

from __future__ import annotations

import hashlib
from collections import deque
from random import Random

from schema.hexgeo import hex_distance, hex_line, hex_range
from schema.models import (
    Army,
    Catalog,
    Faction,
    GameState,
    HexCoord,
    MapGenConfig,
    NodeBonus,
    ResourceKind,
    ResourcePool,
    Side,
    Structure,
    StructureType,
    TerrainType,
    Tile,
    TileFeature,
    TileMap,
    UnitStack,
    controlled_tiles,
    derive_seed,
)


TERRAIN_WEIGHTS: tuple[tuple[TerrainType, int], ...] = (
    (TerrainType.PLAIN, 30),
    (TerrainType.FOREST, 20),
    (TerrainType.MOUNTAIN, 16),
    (TerrainType.SWAMP, 12),
    (TerrainType.WATER, 12),
    (TerrainType.DESERT, 10),
)

STRUCTURE_FORTIFICATION: dict[StructureType, tuple[float, float]] = {
    StructureType.CAPITAL: (2.2, 3.0),
    StructureType.CITY: (1.4, 1.8),
    StructureType.MAIN_NEST: (1.3, 1.6),
    StructureType.SUB_NEST: (1.1, 1.3),
    StructureType.TRIBE: (1.0, 1.1),
    StructureType.TOWER: (1.2, 1.5),
    StructureType.BARRACKS: (1.0, 1.2),
    StructureType.OUTPOST: (1.1, 1.4),
    StructureType.FORT: (1.5, 2.0),
}


def _rng(seed: str) -> Random:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return Random(int(digest[:16], 16))


def _weighted_terrain(rng: Random) -> TerrainType:
    total = sum(weight for _, weight in TERRAIN_WEIGHTS)
    cursor = rng.uniform(0, total)
    for terrain, weight in TERRAIN_WEIGHTS:
        if cursor <= weight:
            return terrain
        cursor -= weight
    return TerrainType.PLAIN


def _tile_noise(seed: str, q: int, r: int, salt: str) -> float:
    digest = hashlib.sha256(f"{seed}:{q}:{r}:{salt}".encode("utf-8")).hexdigest()
    return int(digest[:10], 16) / float(0xFFFFFFFFFF)


def _initial_tiles(config: MapGenConfig, seed: str) -> dict[str, Tile]:
    rng = _rng(derive_seed(seed, "terrain"))
    region_count = max(12, (config.width * config.height) // 42)
    terrain_seeds = [
        (
            rng.randrange(config.width),
            rng.randrange(config.height),
            _weighted_terrain(rng),
        )
        for _ in range(region_count)
    ]

    tiles: dict[str, Tile] = {}
    for r in range(config.height):
        for q in range(config.width):
            warped_q = q + (_tile_noise(seed, q, r, "warp-q") - 0.5) * 5.5
            warped_r = r + (_tile_noise(seed, q, r, "warp-r") - 0.5) * 5.5
            _, _, terrain = min(
                terrain_seeds,
                key=lambda item: (warped_q - item[0]) ** 2 + (warped_r - item[1]) ** 2,
            )
            elevation_base = {
                TerrainType.PLAIN: 1,
                TerrainType.FOREST: 2,
                TerrainType.SWAMP: 0,
                TerrainType.DESERT: 1,
                TerrainType.MOUNTAIN: 4,
                TerrainType.WATER: 0,
            }[terrain]
            elevation = min(5, max(0, elevation_base + int(_tile_noise(seed, q, r, "elev") * 2)))
            coord = HexCoord(q=q, r=r)
            tiles[coord.key()] = Tile(coord=coord, terrain_type=terrain, elevation=elevation)
    return tiles


def _bonus_templates(catalog: Catalog | None, *keys: str) -> list[NodeBonus]:
    if catalog is None:
        return []
    bonuses: list[NodeBonus] = []
    for key in keys:
        bonuses.extend(catalog.node_bonus_templates.get(key, []))
    return bonuses


def _structure_name(structure_type: StructureType, index: int) -> str:
    names = {
        StructureType.CAPITAL: "星冠王城",
        StructureType.CITY: f"邊境城市 {index}",
        StructureType.MAIN_NEST: "黑喉主巢",
        StructureType.SUB_NEST: f"裂牙副巢 {index}",
        StructureType.TRIBE: f"血角部落 {index}",
    }
    return names.get(structure_type, f"{structure_type.value} {index}")


def _garrison(structure_type: StructureType, owner: Side | None) -> list[UnitStack]:
    if owner == Side.HUMAN:
        if structure_type == StructureType.CAPITAL:
            return [UnitStack(template_id="militia", count=55), UnitStack(template_id="knight", count=18)]
        return [UnitStack(template_id="militia", count=24), UnitStack(template_id="knight", count=6)]
    if owner == Side.MONSTER:
        if structure_type == StructureType.MAIN_NEST:
            return [UnitStack(template_id="goblin", count=95), UnitStack(template_id="orc", count=18)]
        if structure_type == StructureType.SUB_NEST:
            return [UnitStack(template_id="goblin", count=52), UnitStack(template_id="slime", count=15)]
        return [UnitStack(template_id="goblin", count=30)]
    return []


def _build_world(config: MapGenConfig, catalog: Catalog | None, seed: str) -> tuple[TileMap, dict[str, Structure]]:
    rng = _rng(derive_seed(seed, "placements"))
    tiles = _initial_tiles(config, seed)
    structures: dict[str, Structure] = {}
    occupied: set[str] = set()

    def zone(coord: HexCoord) -> str:
        left = int(config.width * 0.42)
        right = int(config.width * 0.58)
        if coord.q < left:
            return "human"
        if coord.q > right:
            return "monster"
        return "contested"

    def valid(coord: HexCoord, expected_zone: str | None, min_distance: int) -> bool:
        tile = tiles.get(coord.key())
        if tile is None or tile.terrain_type == TerrainType.WATER or coord.key() in occupied:
            return False
        if expected_zone is not None and zone(coord) != expected_zone:
            return False
        return all(hex_distance(coord, item.footprint[0]) >= min_distance for item in structures.values())

    def place(
        structure_type: StructureType,
        owner: Side,
        center: tuple[float, float],
        expected_zone: str,
        min_distance: int,
        index: int,
        parent_nest_id: str | None = None,
        radius: int = 5,
    ) -> Structure:
        for _ in range(480):
            q = max(1, min(config.width - 2, round(center[0] + rng.uniform(-radius, radius))))
            r = max(1, min(config.height - 2, round(center[1] + rng.uniform(-radius, radius))))
            coord = HexCoord(q=q, r=r)
            if valid(coord, expected_zone, min_distance):
                break
        else:
            candidates = [
                tile.coord
                for tile in tiles.values()
                if valid(tile.coord, expected_zone, max(1, min_distance // 2))
            ]
            if not candidates:
                raise RuntimeError(f"could not place {structure_type.value}")
            coord = min(candidates, key=lambda item: hex_distance(item, HexCoord(q=round(center[0]), r=round(center[1]))))

        occupied.add(coord.key())
        low, high = STRUCTURE_FORTIFICATION[structure_type]
        terrain = tiles[coord.key()].terrain_type.value
        structure = Structure(
            id=f"{structure_type.value}-{index}",
            name=_structure_name(structure_type, index),
            structure_type=structure_type,
            owner=owner,
            footprint=[coord],
            control_radius=2 if structure_type in (StructureType.CAPITAL, StructureType.MAIN_NEST) else 1,
            fortification=round(rng.uniform(low, high), 2),
            garrison=_garrison(structure_type, owner),
            bonuses=_bonus_templates(catalog, structure_type.value, terrain),
            parent_nest_id=parent_nest_id,
            tags=[terrain],
        )
        structures[structure.id] = structure
        return structure

    capital = place(
        StructureType.CAPITAL,
        Side.HUMAN,
        (config.width * 0.14, config.height * 0.5),
        "human",
        0,
        1,
        radius=max(3, config.width // 10),
    )
    main_nest = place(
        StructureType.MAIN_NEST,
        Side.MONSTER,
        (config.width * 0.86, config.height * 0.5),
        "monster",
        0,
        1,
        radius=max(3, config.width // 10),
    )

    for index in range(1, config.human_cities + 1):
        place(
            StructureType.CITY,
            Side.HUMAN,
            (config.width * rng.uniform(0.22, 0.4), config.height * rng.uniform(0.15, 0.85)),
            "human",
            4,
            index,
            radius=max(3, config.width // 12),
        )

    sub_count = rng.randint(config.sub_nests[0], config.sub_nests[1])
    tribe_count = rng.randint(config.tribes[0], config.tribes[1])
    for index in range(1, sub_count + 1):
        place(
            StructureType.SUB_NEST,
            Side.MONSTER,
            (main_nest.footprint[0].q, main_nest.footprint[0].r),
            "monster",
            3,
            index,
            parent_nest_id=main_nest.id,
            radius=max(4, config.width // 6),
        )
    for index in range(1, tribe_count + 1):
        place(
            StructureType.TRIBE,
            Side.MONSTER,
            (main_nest.footprint[0].q, main_nest.footprint[0].r),
            "monster",
            2,
            index,
            parent_nest_id=main_nest.id,
            radius=max(5, config.width // 4),
        )

    # Neutral strategic sites are represented as tile features in M1.
    contested = [tile for tile in tiles.values() if zone(tile.coord) == "contested" and tile.terrain_type != TerrainType.WATER]
    for index, tile in enumerate(rng.sample(contested, k=min(config.neutral_sites, len(contested))), start=1):
        feature = [TileFeature.MINE, TileFeature.RUIN, TileFeature.FORD][index % 3]
        tile.features = sorted(set([*tile.features, feature]), key=lambda item: item.value)
        tile.bonuses = _bonus_templates(catalog, feature.value, tile.terrain_type.value)

    def apply_path(path: list[HexCoord], secret: bool = False) -> None:
        for coord in path:
            tile = tiles.get(coord.key())
            if tile is None:
                continue
            features = set(tile.features)
            if secret:
                features.add(TileFeature.SECRET_PATH)
                if tile.terrain_type == TerrainType.WATER:
                    features.add(TileFeature.BRIDGE)
            elif tile.terrain_type == TerrainType.WATER:
                features.add(TileFeature.BRIDGE)
            else:
                features.add(TileFeature.ROAD)
            tile.features = sorted(features, key=lambda item: item.value)

    for structure in structures.values():
        if structure.owner == Side.HUMAN and structure.id != capital.id:
            apply_path(hex_line(capital.footprint[0], structure.footprint[0]))
        if structure.owner == Side.MONSTER and structure.structure_type == StructureType.SUB_NEST:
            apply_path(hex_line(main_nest.footprint[0], structure.footprint[0]))
        if structure.owner == Side.MONSTER and structure.structure_type == StructureType.TRIBE:
            apply_path(hex_line(main_nest.footprint[0], structure.footprint[0]), secret=True)

    for structure in structures.values():
        for coord in controlled_tiles(structure):
            tile = tiles.get(coord.key())
            if tile is not None and (tile.owner is None or coord in structure.footprint):
                tile.owner = structure.owner
        for coord in structure.footprint:
            tile = tiles[coord.key()]
            tile.owner = structure.owner
            tile.structure_id = structure.id

    refreshed = [Tile.model_validate(tile.model_dump()) for tile in tiles.values()]
    tile_map = TileMap(width=config.width, height=config.height, tiles=refreshed, master_seed=config.seed)
    return tile_map, structures


def _reachable_from(tile_map: TileMap, start: HexCoord) -> set[str]:
    """BFS over passable tiles from ``start`` (a finite-cost flood fill)."""
    visited: set[str] = {start.key()}
    queue: deque[HexCoord] = deque([start])
    while queue:
        current = queue.popleft()
        for neighbor in tile_map.neighbors(current):
            if neighbor.passable and neighbor.coord.key() not in visited:
                visited.add(neighbor.coord.key())
                queue.append(neighbor.coord)
    return visited


def friendly_structures_connected(tile_map: TileMap, structures: dict[str, Structure]) -> bool:
    """True when every pair of same-side structures has a finite-cost path.

    Verifies the P1.4 acceptance criterion: any two friendly structures are
    mutually reachable across passable tiles (water needs bridge/ford).
    """
    by_side: dict[Side, list[HexCoord]] = {}
    for structure in structures.values():
        if structure.owner is None:
            continue
        by_side.setdefault(structure.owner, []).append(structure.footprint[0])
    for coords in by_side.values():
        if len(coords) <= 1:
            continue
        reachable = _reachable_from(tile_map, coords[0])
        if any(coord.key() not in reachable for coord in coords[1:]):
            return False
    return True


def _generate_world(
    config: MapGenConfig, catalog: Catalog | None = None, max_attempts: int = 8
) -> tuple[TileMap, dict[str, Structure]]:
    """Build a world, resampling deterministically until it is connected.

    Attempt 0 uses ``config.seed`` verbatim (so a given seed stays byte-stable);
    later attempts derive a fresh sub-seed.  Friendly structures are linked by
    roads/bridges during build, so resampling is a guard rail rather than the
    common path.
    """
    for attempt in range(max_attempts):
        seed = config.seed if attempt == 0 else derive_seed(config.seed, "resample", attempt)
        tile_map, structures = _build_world(config, catalog, seed)
        if friendly_structures_connected(tile_map, structures):
            return tile_map, structures
    raise RuntimeError(
        f"map generation could not produce a connected layout after {max_attempts} attempts (seed={config.seed!r})"
    )


def generate_map(config: MapGenConfig, catalog: Catalog | None = None) -> TileMap:
    tile_map, _ = _generate_world(config, catalog)
    return tile_map


def generate_game_state(config: MapGenConfig, catalog: Catalog | None = None) -> GameState:
    tile_map, structures = _generate_world(config, catalog)
    human_anchor = next(item for item in structures.values() if item.structure_type == StructureType.CAPITAL)
    monster_anchor = next(item for item in structures.values() if item.structure_type == StructureType.MAIN_NEST)
    human_city = next((item for item in structures.values() if item.structure_type == StructureType.CITY), human_anchor)
    monster_tribe = next((item for item in structures.values() if item.structure_type == StructureType.TRIBE), monster_anchor)
    armies = {
        "human-army-1": Army(
            id="human-army-1",
            owner=Side.HUMAN,
            position=human_anchor.footprint[0],
            movement_points=6,
            units=[UnitStack(template_id="militia", count=22), UnitStack(template_id="knight", count=5)],
        ),
        "human-army-2": Army(
            id="human-army-2",
            owner=Side.HUMAN,
            position=human_city.footprint[0],
            movement_points=5,
            units=[UnitStack(template_id="militia", count=16)],
        ),
        "monster-army-1": Army(
            id="monster-army-1",
            owner=Side.MONSTER,
            position=monster_anchor.footprint[0],
            movement_points=6,
            units=[UnitStack(template_id="goblin", count=64), UnitStack(template_id="orc", count=10)],
        ),
        "monster-army-2": Army(
            id="monster-army-2",
            owner=Side.MONSTER,
            position=monster_tribe.footprint[0],
            movement_points=5,
            units=[UnitStack(template_id="goblin", count=36)],
        ),
    }
    state = GameState(
        master_seed=config.seed,
        map_config=config,
        tile_map=tile_map,
        structures=structures,
        armies=armies,
        factions={
            Side.HUMAN: Faction(
                side=Side.HUMAN,
                name="人類方",
                resources=ResourcePool(amounts={ResourceKind.COMBAT_RESOURCE: 30, ResourceKind.RESEARCH_POINT: 8}),
            ),
            Side.MONSTER: Faction(
                side=Side.MONSTER,
                name="魔物方",
                resources=ResourcePool(amounts={ResourceKind.SLAVE: 20, ResourceKind.MONSTER_SOURCE: 25}),
                is_ai=True,
            ),
        },
    )
    return state
