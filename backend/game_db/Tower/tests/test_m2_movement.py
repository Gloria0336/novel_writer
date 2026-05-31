import pytest

from engine.engagement import find_engagements
from engine.mapgen import generate_game_state
from engine.movement import apply_army_move, path_cost, reachable, shortest_path, tile_cost, validate_army_move
from schema.models import (
    Army,
    ArmyMove,
    DeployIntent,
    GameState,
    HexCoord,
    MapGenConfig,
    Side,
    Structure,
    StructureType,
    TerrainType,
    Tile,
    TileFeature,
    TileMap,
    UnitStack,
)


def _state() -> GameState:
    tiles = []
    for r in range(3):
        for q in range(4):
            terrain = TerrainType.PLAIN
            features: list[TileFeature] = []
            if (q, r) == (1, 0):
                terrain = TerrainType.WATER
            if (q, r) == (2, 1):
                terrain = TerrainType.WATER
                features = [TileFeature.BRIDGE]
            if (q, r) == (1, 1):
                features = [TileFeature.ROAD]
            tiles.append(
                Tile(
                    coord=HexCoord(q=q, r=r),
                    terrain_type=terrain,
                    features=features,
                    owner=Side.HUMAN if (q, r) == (0, 1) else None,
                    structure_id="city" if (q, r) == (0, 1) else None,
                )
            )
    tile_map = TileMap(width=4, height=3, master_seed="m2", tiles=tiles)
    return GameState(
        master_seed="m2",
        map_config=MapGenConfig(seed="m2", width=8, height=8),
        tile_map=tile_map,
        armies={
            "h1": Army(
                id="h1",
                owner=Side.HUMAN,
                position=HexCoord(q=0, r=1),
                movement_points=2.5,
                units=[UnitStack(template_id="militia", count=10)],
            ),
            "m1": Army(
                id="m1",
                owner=Side.MONSTER,
                position=HexCoord(q=3, r=1),
                movement_points=3,
                units=[UnitStack(template_id="goblin", count=10)],
            ),
        },
        structures={
            "city": Structure(
                id="city",
                name="City",
                structure_type=StructureType.CITY,
                owner=Side.HUMAN,
                footprint=[HexCoord(q=0, r=1)],
                control_radius=1,
                garrison=[UnitStack(template_id="militia", count=20)],
            )
        },
    )


def test_tile_cost_respects_roads_bridges_and_blocked_water():
    state = _state()
    road = state.tile_at((1, 1))
    blocked_water = state.tile_at((1, 0))
    bridge = state.tile_at((2, 1))
    assert road is not None and tile_cost(road, Side.HUMAN) < 1
    assert blocked_water is not None and tile_cost(blocked_water, Side.HUMAN) == float("inf")
    assert bridge is not None and tile_cost(bridge, Side.HUMAN) == 1.15


def test_secret_path_helps_monsters_and_walls_moats_slow_invaders():
    base = Tile(coord=HexCoord(q=0, r=0), terrain_type=TerrainType.PLAIN)
    plain_cost = tile_cost(base, Side.MONSTER)

    secret = Tile(coord=HexCoord(q=0, r=0), terrain_type=TerrainType.PLAIN, features=[TileFeature.SECRET_PATH])
    # A secret path is a geographic shortcut for everyone, but monsters get an
    # extra faction discount on top, so they move cheaper than humans there.
    assert tile_cost(secret, Side.MONSTER) < tile_cost(secret, Side.HUMAN) < plain_cost

    walled = Tile(
        coord=HexCoord(q=0, r=0),
        terrain_type=TerrainType.PLAIN,
        features=[TileFeature.WALL],
        owner=Side.HUMAN,
    )
    assert tile_cost(walled, Side.MONSTER) > plain_cost  # enemy pays a wall surcharge
    assert tile_cost(walled, Side.HUMAN) == plain_cost  # owner does not

    moated = Tile(
        coord=HexCoord(q=0, r=0),
        terrain_type=TerrainType.PLAIN,
        features=[TileFeature.MOAT],
        owner=Side.HUMAN,
    )
    assert tile_cost(moated, Side.MONSTER) > plain_cost
    assert tile_cost(moated, Side.HUMAN) == plain_cost


def test_reachable_and_shortest_path_use_movement_budget():
    state = _state()
    army = state.armies["h1"]
    costs = reachable(state, army)
    assert "1,0" not in costs
    assert costs["2,1"] <= army.movement_points
    assert shortest_path(state, army, HexCoord(q=3, r=1)) is None

    army.movement_points = 4
    path = shortest_path(state, army, HexCoord(q=3, r=1))
    assert path is not None
    assert [coord.key() for coord in path] == ["0,1", "1,1", "2,1", "3,1"]


def test_army_move_validates_path_and_spends_points():
    state = _state()
    move = ArmyMove(
        army_id="h1",
        path=[HexCoord(q=0, r=1), HexCoord(q=1, r=1), HexCoord(q=2, r=1)],
        intent=DeployIntent.REINFORCE,
    )
    assert validate_army_move(state, move) == path_cost(state, move.path, Side.HUMAN)
    army = apply_army_move(state, move)
    assert army.position == HexCoord(q=2, r=1)
    assert army.movement_points == 0.7

    blocked_state = _state()
    with pytest.raises(ValueError, match="impassable"):
        validate_army_move(
            blocked_state,
            ArmyMove(army_id="h1", path=[HexCoord(q=0, r=1), HexCoord(q=1, r=0)], intent=DeployIntent.ATTACK),
        )


def test_find_engagements_detects_army_collision_and_structure_assault():
    state = _state()
    state.armies["h1"].position = HexCoord(q=3, r=1)
    collisions = find_engagements(state)
    assert collisions[0].reason == "army_collision"
    assert collisions[0].attackers and collisions[0].defenders

    state = _state()
    state.armies["m1"].position = HexCoord(q=0, r=1)
    assaults = find_engagements(state)
    assert any(item.reason == "structure_assault" and item.structure_id == "city" for item in assaults)


def test_generated_game_state_has_m2_armies_on_passable_tiles():
    state = generate_game_state(MapGenConfig(seed="m2-generated", width=24, height=16))
    assert {"human-army-1", "monster-army-1"}.issubset(state.armies)
    for army in state.armies.values():
        tile = state.tile_at(army.position)
        assert tile is not None and tile.passable
        assert army.units
