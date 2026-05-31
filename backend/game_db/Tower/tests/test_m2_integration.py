"""M2 milestone integration: MILITARY settlement -> engagement -> COMBAT.

These tests exercise the whole turn loop (engine/turn.advance_one_month) rather
than the individual movement/engagement helpers, verifying that the M2 pieces are
actually wired together and behave deterministically.
"""

from __future__ import annotations

from engine.turn import advance_one_month, stable_state_json
from schema.models import (
    Army,
    ArmyMove,
    Deployment,
    DeployIntent,
    GameState,
    HexCoord,
    MapGenConfig,
    Side,
    Structure,
    StructureType,
    TerrainType,
    Tile,
    TileMap,
    UnitStack,
)


def _plain_map(width: int = 5, height: int = 3) -> TileMap:
    tiles = [
        Tile(
            coord=HexCoord(q=q, r=r),
            terrain_type=TerrainType.PLAIN,
            owner=Side.HUMAN if (q, r) == (0, 1) else None,
            structure_id="city" if (q, r) == (0, 1) else None,
        )
        for r in range(height)
        for q in range(width)
    ]
    return TileMap(width=width, height=height, master_seed="m2-int", tiles=tiles)


def _assault_state() -> GameState:
    return GameState(
        master_seed="m2-int",
        map_config=MapGenConfig(seed="m2-int", width=8, height=8),
        tile_map=_plain_map(),
        structures={
            "city": Structure(
                id="city",
                name="Border City",
                structure_type=StructureType.CITY,
                owner=Side.HUMAN,
                footprint=[HexCoord(q=0, r=1)],
                control_radius=1,
                fortification=1.0,
                garrison=[UnitStack(template_id="militia", count=10)],
            )
        },
        armies={
            "raider": Army(
                id="raider",
                owner=Side.MONSTER,
                position=HexCoord(q=1, r=1),
                movement_points=3,
                units=[UnitStack(template_id="goblin", count=100)],
            ),
        },
    )


def _attack_deployment() -> Deployment:
    return Deployment(
        side=Side.MONSTER,
        month=1,
        movements=[
            ArmyMove(
                army_id="raider",
                path=[HexCoord(q=1, r=1), HexCoord(q=0, r=1)],
                intent=DeployIntent.ATTACK,
            )
        ],
    )


def test_military_phase_moves_army_detects_engagement_and_resolves_combat():
    state = _assault_state()
    state.turn.deployments[Side.MONSTER] = _attack_deployment()

    advance_one_month(state)

    # The raider reached the city tile, an assault engagement was recorded...
    assert len(state.engagements) == 1
    assert state.engagements[0].reason == "structure_assault"
    assert state.engagements[0].structure_id == "city"
    # ...COMBAT turned it into exactly one combat report (no M1 demo fallback)...
    assert len(state.combat_log) == 1
    report = state.combat_log[0]
    assert report.outcome == "captured"
    assert report.new_owner == Side.MONSTER
    # ...the structure changed hands...
    assert state.structures["city"].owner == Side.MONSTER
    # ...and the month rolled forward with movement points reset to the baseline.
    assert state.turn.month == 2
    assert state.armies["raider"].position == HexCoord(q=0, r=1)
    assert state.armies["raider"].movement_points == 3


def test_turn_loop_is_deterministic():
    first = _assault_state()
    first.turn.deployments[Side.MONSTER] = _attack_deployment()
    second = _assault_state()
    second.turn.deployments[Side.MONSTER] = _attack_deployment()

    advance_one_month(first)
    advance_one_month(second)

    assert stable_state_json(first) == stable_state_json(second)


def test_simultaneous_resolution_applies_both_sides_in_one_month():
    state = _assault_state()
    # Add a human army that will move on the same month the raider attacks.
    state.armies["patrol"] = Army(
        id="patrol",
        owner=Side.HUMAN,
        position=HexCoord(q=3, r=1),
        movement_points=3,
        units=[UnitStack(template_id="militia", count=8)],
    )
    state.turn.deployments[Side.MONSTER] = _attack_deployment()
    state.turn.deployments[Side.HUMAN] = Deployment(
        side=Side.HUMAN,
        month=1,
        movements=[
            ArmyMove(
                army_id="patrol",
                path=[HexCoord(q=3, r=1), HexCoord(q=2, r=1)],
                intent=DeployIntent.REINFORCE,
            )
        ],
    )

    advance_one_month(state)

    # Both submitted moves were settled in the same MILITARY phase.
    assert state.armies["raider"].position == HexCoord(q=0, r=1)
    assert state.armies["patrol"].position == HexCoord(q=2, r=1)


def test_friendly_armies_merge_when_moving_onto_same_tile():
    state = _assault_state()
    # Two friendly monster armies converging on the same empty tile should fuse.
    state.armies["raider"].position = HexCoord(q=1, r=0)
    state.armies["raider2"] = Army(
        id="raider2",
        owner=Side.MONSTER,
        position=HexCoord(q=3, r=0),
        movement_points=4,
        units=[UnitStack(template_id="goblin", count=20)],
    )
    state.turn.deployments[Side.MONSTER] = Deployment(
        side=Side.MONSTER,
        month=1,
        movements=[
            ArmyMove(
                army_id="raider",
                path=[HexCoord(q=1, r=0), HexCoord(q=2, r=0)],
                intent=DeployIntent.REINFORCE,
            ),
            ArmyMove(
                army_id="raider2",
                path=[HexCoord(q=3, r=0), HexCoord(q=2, r=0)],
                intent=DeployIntent.REINFORCE,
            ),
        ],
    )

    advance_one_month(state)

    # Survivor keeps the lowest id and absorbs the other's goblins (100 + 20).
    assert "raider2" not in state.armies
    assert "raider" in state.armies
    survivor = state.armies["raider"]
    assert survivor.position == HexCoord(q=2, r=0)
    goblins = next(stack for stack in survivor.units if stack.template_id == "goblin")
    assert goblins.count == 120


def test_garrison_merge_when_friendly_army_enters_own_structure():
    state = _assault_state()
    state.armies["raider"].owner = Side.HUMAN  # reuse the tile setup with a friendly mover
    state.armies["raider"].position = HexCoord(q=1, r=1)
    state.armies["raider"].units = [UnitStack(template_id="militia", count=7)]
    state.turn.deployments[Side.HUMAN] = Deployment(
        side=Side.HUMAN,
        month=1,
        movements=[
            ArmyMove(
                army_id="raider",
                path=[HexCoord(q=1, r=1), HexCoord(q=0, r=1)],
                intent=DeployIntent.REINFORCE,
            )
        ],
    )

    advance_one_month(state)

    # The army folded into the city garrison (進駐) and left the army map.
    assert "raider" not in state.armies
    militia = next(stack for stack in state.structures["city"].garrison if stack.template_id == "militia")
    assert militia.count == 17  # 10 existing + 7 reinforcing
    assert not state.engagements  # friendly reinforcement is not an engagement
