"""M2 strategic army movement over Tower's axial hex map."""

from __future__ import annotations

import heapq
import math

from schema.hexgeo import hex_distance
from schema.models import Army, ArmyMove, GameState, HexCoord, Side, Tile, TileFeature


def _side(value: Side | object | None) -> Side | None:
    return value.side if hasattr(value, "side") else value if isinstance(value, Side) else None


def tile_cost(tile: Tile, faction: Side | object | None = None) -> float:
    """Return the movement cost to enter ``tile`` for the given faction."""
    side = _side(faction)
    if not tile.passable:
        return math.inf
    cost = tile.movement_cost
    if TileFeature.SECRET_PATH in tile.features and side == Side.MONSTER:
        cost *= 0.85
    if TileFeature.WALL in tile.features and tile.owner is not None and tile.owner != side:
        cost *= 1.35
    if TileFeature.MOAT in tile.features and tile.owner is not None and tile.owner != side:
        cost *= 1.25
    return round(cost, 3)


def path_cost(state: GameState, path: list[HexCoord], faction: Side | object | None = None) -> float:
    """Cost of following ``path``; the starting tile is free."""
    if not path:
        raise ValueError("path may not be empty")
    total = 0.0
    for previous, current in zip(path, path[1:]):
        if hex_distance(previous, current) != 1:
            raise ValueError(f"path contains non-adjacent step: {previous.key()} -> {current.key()}")
        tile = state.tile_at(current)
        if tile is None:
            raise ValueError(f"path contains unknown tile: {current.key()}")
        step_cost = tile_cost(tile, faction)
        if not math.isfinite(step_cost):
            raise ValueError(f"path enters impassable tile: {current.key()}")
        total += step_cost
    return round(total, 3)


def reachable(state: GameState, army: Army, max_cost: float | None = None) -> dict[str, float]:
    """Dijkstra flood fill of all tiles an army can enter this order."""
    budget = army.movement_points if max_cost is None else max_cost
    if state.tile_at(army.position) is None:
        raise ValueError(f"army {army.id} is outside the map at {army.position.key()}")

    costs: dict[str, float] = {army.position.key(): 0.0}
    heap: list[tuple[float, int, int]] = [(0.0, army.position.q, army.position.r)]
    while heap:
        current_cost, q, r = heapq.heappop(heap)
        current_key = f"{q},{r}"
        if current_cost > costs.get(current_key, math.inf):
            continue
        for neighbor in state.hex_neighbors(HexCoord(q=q, r=r)):
            step = tile_cost(neighbor, army.owner)
            if not math.isfinite(step):
                continue
            next_cost = round(current_cost + step, 3)
            if next_cost > budget:
                continue
            neighbor_key = neighbor.coord.key()
            if next_cost < costs.get(neighbor_key, math.inf):
                costs[neighbor_key] = next_cost
                heapq.heappush(heap, (next_cost, neighbor.coord.q, neighbor.coord.r))
    return costs


def shortest_path(state: GameState, army: Army, destination: HexCoord) -> list[HexCoord] | None:
    """Cheapest passable path to ``destination`` within the army's movement budget."""
    start_key = army.position.key()
    dest_key = destination.key()
    costs: dict[str, float] = {start_key: 0.0}
    previous: dict[str, str] = {}
    heap: list[tuple[float, int, int]] = [(0.0, army.position.q, army.position.r)]

    while heap:
        current_cost, q, r = heapq.heappop(heap)
        current_key = f"{q},{r}"
        if current_key == dest_key:
            break
        if current_cost > costs.get(current_key, math.inf):
            continue
        for neighbor in state.hex_neighbors(HexCoord(q=q, r=r)):
            step = tile_cost(neighbor, army.owner)
            if not math.isfinite(step):
                continue
            next_cost = round(current_cost + step, 3)
            if next_cost > army.movement_points:
                continue
            neighbor_key = neighbor.coord.key()
            if next_cost < costs.get(neighbor_key, math.inf):
                costs[neighbor_key] = next_cost
                previous[neighbor_key] = current_key
                heapq.heappush(heap, (next_cost, neighbor.coord.q, neighbor.coord.r))

    if dest_key not in costs:
        return None
    path = [destination]
    cursor = dest_key
    while cursor != start_key:
        cursor = previous[cursor]
        q, r = (int(part) for part in cursor.split(",", 1))
        path.append(HexCoord(q=q, r=r))
    return list(reversed(path))


def validate_army_move(state: GameState, move: ArmyMove) -> float:
    """Validate an ArmyMove against map adjacency, terrain, and movement budget."""
    army = state.armies.get(move.army_id)
    if army is None:
        raise ValueError(f"unknown army: {move.army_id}")
    if move.path[0] != army.position:
        raise ValueError(f"ArmyMove.path must start at army position {army.position.key()}")
    missing_elites = set(move.elite_ids).difference(army.elite_ids)
    if missing_elites:
        raise ValueError(f"ArmyMove references elites not in army: {sorted(missing_elites)}")
    cost = path_cost(state, move.path, army.owner)
    if cost > army.movement_points:
        raise ValueError(f"ArmyMove exceeds movement points: {cost} > {army.movement_points}")
    return cost


def apply_army_move(state: GameState, move: ArmyMove) -> Army:
    """Apply a validated move and spend movement points."""
    cost = validate_army_move(state, move)
    army = state.armies[move.army_id]
    army.position = move.destination
    army.movement_points = round(max(0.0, army.movement_points - cost), 3)
    return army


def resolve_deployment(state: GameState, side: Side) -> GameState:
    """Apply all M2 ArmyMove orders for a side's submitted deployment."""
    deployment = state.turn.deployments.get(side)
    if deployment is None:
        return state
    for move in deployment.movements:
        army = state.armies.get(move.army_id)
        if army is None or army.owner != side:
            raise ValueError(f"deployment for {side.value} cannot move army {move.army_id}")
        apply_army_move(state, move)
    return state


def reset_movement_points(state: GameState) -> GameState:
    """Restore every army's per-month movement budget (P2.1 monthly reset)."""
    for army in state.armies.values():
        army.movement_points = army.base_movement_points
    return state


def _merge_units(into: list, extra: list) -> list:
    """Sum unit stacks by template id; keep deterministic ordering."""
    from schema.models import UnitStack

    merged: dict[str, float] = {}
    raw: dict[str, dict] = {}
    for stack in [*into, *extra]:
        merged[stack.template_id] = merged.get(stack.template_id, 0) + stack.count
        raw.setdefault(stack.template_id, {"attack": stack.attack, "defense": stack.defense, "hp": stack.hp})
    return [
        UnitStack(template_id=template_id, count=int(count), **raw[template_id])
        for template_id, count in sorted(merged.items())
    ]


def consolidate_friendly_armies(state: GameState, moved_ids: set[str] | None = None) -> GameState:
    """Merge co-located same-side armies into one (合流).

    The lowest army id on a tile becomes the survivor; the rest fold their units,
    elites, and the *minimum* remaining movement budget into it.  When
    ``moved_ids`` is given, only tiles touched by a move this turn are merged so
    armies that merely started together are left untouched.
    """
    from collections import defaultdict

    by_tile: dict[tuple[str, str], list] = defaultdict(list)
    for army in state.armies.values():
        by_tile[(army.position.key(), army.owner.value)].append(army)

    removed: set[str] = set()
    for group in by_tile.values():
        if len(group) < 2:
            continue
        if moved_ids is not None and not any(army.id in moved_ids for army in group):
            continue
        group.sort(key=lambda item: item.id)
        survivor = group[0]
        for other in group[1:]:
            survivor.units = _merge_units(survivor.units, other.units)
            survivor.elite_ids = sorted(set(survivor.elite_ids) | set(other.elite_ids))
            survivor.movement_points = min(survivor.movement_points, other.movement_points)
            removed.add(other.id)
    for army_id in removed:
        del state.armies[army_id]
    return state


def garrison_into_structures(state: GameState, moved_ids: set[str] | None = None) -> GameState:
    """Fold an army that ends on its own structure into the garrison (進駐).

    Only applies to friendly structures; entering an enemy/neutral structure is
    an assault handled by engagement detection, not a garrison merge.  When
    ``moved_ids`` is given, only armies that moved this turn are folded so
    pre-positioned garrison armies stay on the map.
    """
    for army_id, army in list(state.armies.items()):
        if moved_ids is not None and army_id not in moved_ids:
            continue
        # Armies carrying elites stay parked on the structure tile so their
        # elite instances are not lost; only plain unit stacks fold in for now.
        if army.elite_ids:
            continue
        tile = state.tile_at(army.position)
        if tile is None or tile.structure_id is None:
            continue
        structure = state.structures.get(tile.structure_id)
        if structure is None or structure.owner != army.owner:
            continue
        structure.garrison = _merge_units(structure.garrison, army.units)
        del state.armies[army_id]
    return state
