from schema.models import (
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
    controlled_tiles,
)


def test_tile_map_model_validate_and_neighbors():
    tile_map = TileMap.model_validate(
        {
            "width": 2,
            "height": 2,
            "master_seed": "unit",
            "tiles": [
                {"coord": {"q": 0, "r": 0}, "terrain_type": "plain"},
                {"coord": {"q": 1, "r": 0}, "terrain_type": "forest"},
                {"coord": {"q": 0, "r": 1}, "terrain_type": "water", "features": ["bridge"]},
                {"coord": {"q": 1, "r": 1}, "terrain_type": "mountain"},
            ],
        }
    )
    assert tile_map.tile_at(HexCoord(q=0, r=1)).passable is True
    assert [tile.coord for tile in tile_map.neighbors(HexCoord(q=0, r=0))] == [HexCoord(q=1, r=0), HexCoord(q=0, r=1)]


def test_structure_controlled_tiles_radius_one():
    structure = Structure(
        id="capital-1",
        name="王城",
        structure_type=StructureType.CAPITAL,
        owner=Side.HUMAN,
        footprint=[HexCoord(q=3, r=3)],
        control_radius=1,
        garrison=[UnitStack(template_id="militia", count=10)],
    )
    coords = controlled_tiles(structure)
    assert len(coords) == 7
    assert HexCoord(q=3, r=3) in coords


def test_game_state_minimal_hex_board_validates():
    tile_map = TileMap(
        width=1,
        height=1,
        master_seed="minimal",
        tiles=[Tile(coord=HexCoord(q=0, r=0), terrain_type=TerrainType.PLAIN, features=[TileFeature.ROAD])],
    )
    state = GameState(
        master_seed="minimal",
        map_config=MapGenConfig(seed="minimal", width=8, height=8),
        tile_map=tile_map,
        structures={},
    )
    assert state.tile_at((0, 0)) is not None
