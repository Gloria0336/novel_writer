import heapq
import json
import math

from engine.catalog import load_catalog
from engine.mapgen import generate_game_state, generate_map
from engine.turn import check_winner, run_demo_month, stable_state_json
from schema.models import HexCoord, MapGenConfig, Side, StructureType, TileMap


def _min_path_cost(tile_map: TileMap, start: HexCoord, goal: HexCoord) -> float:
    """Independent Dijkstra over passable tiles; returns inf if unreachable."""
    dist: dict[str, float] = {start.key(): 0.0}
    heap: list[tuple[float, int, int]] = [(0.0, start.q, start.r)]
    while heap:
        cost, q, r = heapq.heappop(heap)
        if q == goal.q and r == goal.r:
            return cost
        if cost > dist.get(f"{q},{r}", math.inf):
            continue
        for neighbor in tile_map.neighbors(HexCoord(q=q, r=r)):
            if not neighbor.passable:
                continue
            new_cost = cost + neighbor.movement_cost
            if new_cost < dist.get(neighbor.coord.key(), math.inf):
                dist[neighbor.coord.key()] = new_cost
                heapq.heappush(heap, (new_cost, neighbor.coord.q, neighbor.coord.r))
    return math.inf


def _stable_json(model) -> str:
    return json.dumps(model.model_dump(mode="json"), ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def test_catalog_loads_all_yaml_with_new_unit_fields():
    catalog = load_catalog()
    assert catalog.units["militia"].range == 1
    assert catalog.units["mage"].move_speed > 0
    assert catalog.monsters["goblin"].traits
    assert catalog.techs["gene_1"].cost
    assert catalog.node_bonus_templates["capital"][0].scope == "structure"


def test_generate_map_is_byte_stable_for_same_seed():
    catalog = load_catalog()
    config = MapGenConfig(seed="m1-golden", width=24, height=16, human_cities=2, neutral_sites=3)
    first = _stable_json(generate_map(config, catalog))
    second = _stable_json(generate_map(config, catalog))
    assert first == second


def test_generated_game_state_has_m1_structure_counts_and_passable_links():
    catalog = load_catalog()
    config = MapGenConfig(seed="m1-counts", width=28, height=18, human_cities=3)
    state = generate_game_state(config, catalog)
    structures = list(state.structures.values())
    assert [item.structure_type for item in structures].count(StructureType.CAPITAL) == 1
    assert [item.structure_type for item in structures].count(StructureType.MAIN_NEST) == 1
    assert [item.structure_type for item in structures].count(StructureType.CITY) == 3

    passable = {tile.coord.key() for tile in state.tile_map.tiles if tile.passable}
    for structure in structures:
        assert structure.footprint[0].key() in passable


def test_friendly_structures_have_finite_cost_paths():
    catalog = load_catalog()
    for seed in ("m1-conn-a", "m1-conn-b", "m1-conn-c", "m1-conn-d"):
        config = MapGenConfig(seed=seed, width=30, height=20, human_cities=3)
        state = generate_game_state(config, catalog)
        by_side: dict[Side, list[HexCoord]] = {}
        for structure in state.structures.values():
            if structure.owner is not None:
                by_side.setdefault(structure.owner, []).append(structure.footprint[0])
        for coords in by_side.values():
            anchor = coords[0]
            for other in coords[1:]:
                assert math.isfinite(_min_path_cost(state.tile_map, anchor, other)), (
                    f"unreachable friendly structures on seed {seed}: {anchor.key()} -> {other.key()}"
                )


def test_demo_month_advances_from_month_3_to_4_and_is_stable():
    catalog = load_catalog()
    first = run_demo_month("m1-demo", catalog)
    second = run_demo_month("m1-demo", catalog)
    assert first.turn.month == 4
    assert first.turn.phase == "domestic"
    assert len(first.combat_log) == 1
    assert stable_state_json(first) == stable_state_json(second)


def test_winner_check_can_trigger_for_victory_structures():
    state = generate_game_state(MapGenConfig(seed="m1-winner", width=24, height=16))
    main_nest = next(item for item in state.structures.values() if item.structure_type == StructureType.MAIN_NEST)
    main_nest.owner = Side.HUMAN
    assert check_winner(state) == Side.HUMAN
