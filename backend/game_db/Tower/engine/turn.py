"""M2 end-to-end turn loop.

MILITARY now resolves submitted ``ArmyMove`` deployments and detects engagements;
COMBAT still resolves each engagement with a temporary power-comparison scaffold
until M4 replaces it with the deterministic realtime tactical engine.
"""

from __future__ import annotations

import json

from schema.models import (
    Army,
    ArmyMove,
    Catalog,
    CombatOutcome,
    CombatReport,
    Engagement,
    GameState,
    MapGenConfig,
    Side,
    Structure,
    StructureType,
    TurnPhase,
    UnitStack,
    derive_seed,
)

from .engagement import find_engagements
from .mapgen import generate_game_state
from .movement import (
    apply_army_move,
    consolidate_friendly_armies,
    garrison_into_structures,
    reset_movement_points,
)


def stack_power(stack: UnitStack, catalog: Catalog | None = None) -> float:
    if stack.attack is not None or stack.defense is not None or stack.hp is not None:
        attack = stack.attack or 1
        defense = stack.defense or 1
        hp = stack.hp or 1
        return stack.count * (attack * 1.25 + defense + hp * 0.2)
    if catalog is not None:
        if unit := catalog.units.get(stack.template_id):
            return stack.count * (unit.attack * 1.25 + unit.defense + unit.hp * 0.2)
        if species := catalog.monsters.get(stack.template_id):
            return stack.count * (species.base_attack * 1.25 + species.base_defense + species.base_hp * 0.2)
    return stack.count * 5


def structure_power(structure: Structure, catalog: Catalog | None = None) -> float:
    return sum(stack_power(stack, catalog) for stack in structure.garrison) * max(1.0, structure.fortification)


def _choose_demo_battle(state: GameState) -> tuple[Structure, Structure] | None:
    human_targets = [
        item for item in state.structures.values() if item.owner == Side.HUMAN and item.structure_type == StructureType.CITY
    ]
    monster_attackers = [
        item for item in state.structures.values() if item.owner == Side.MONSTER and item.structure_type == StructureType.TRIBE
    ]
    if not human_targets or not monster_attackers:
        return None
    target = sorted(human_targets, key=lambda item: item.id)[0]
    attacker = min(monster_attackers, key=lambda item: abs(item.footprint[0].q - target.footprint[0].q) + abs(item.footprint[0].r - target.footprint[0].r))
    return attacker, target


def resolve_placeholder_combat(state: GameState, catalog: Catalog | None = None) -> CombatReport | None:
    """TODO(P4.6): replace this dev scaffold with the realtime tactical engine."""
    chosen = _choose_demo_battle(state)
    if chosen is None:
        return None
    attacker, defender = chosen
    battle_seed = derive_seed(state.master_seed, "m1-placeholder-combat", state.turn.month, attacker.id, defender.id)
    attacker_power = structure_power(attacker, catalog)
    defender_power = structure_power(defender, catalog)
    if attacker_power > defender_power * 1.08:
        outcome = CombatOutcome.CAPTURED
        new_owner: Side | None = attacker.owner
        defender.owner = attacker.owner
    elif defender_power > attacker_power * 1.08:
        outcome = CombatOutcome.REPELLED
        new_owner = defender.owner
    else:
        outcome = CombatOutcome.ATTRITION
        new_owner = defender.owner
    report = CombatReport(
        structure_id=defender.id,
        location=defender.footprint[0],
        month=state.turn.month,
        attacker=attacker.owner or Side.MONSTER,
        defender=defender.owner,
        attacker_power=round(attacker_power, 3),
        defender_power=round(defender_power, 3),
        fortification=defender.fortification,
        outcome=outcome,
        attacker_casualties=int(attacker_power * 0.03),
        defender_casualties=int(defender_power * (0.08 if outcome == CombatOutcome.CAPTURED else 0.025)),
        new_owner=new_owner,
        seed=battle_seed,
    )
    state.combat_log.append(report)
    return report


def army_power(army: Army, catalog: Catalog | None = None) -> float:
    return sum(stack_power(stack, catalog) for stack in army.units)


def resolve_engagement_combat(state: GameState, engagement: Engagement, catalog: Catalog | None = None) -> CombatReport:
    """TODO(P4.6): replace this scaffold with the realtime tactical battle.

    For M2 each strategic engagement is resolved by comparing aggregated power so
    the turn loop produces a stable, deterministic outcome and ownership change.
    """
    attackers = [state.armies[aid] for aid in engagement.attackers if aid in state.armies]
    defenders = [state.armies[did] for did in engagement.defenders if did in state.armies]
    attacker_power = sum(army_power(army, catalog) for army in attackers)
    defender_power = sum(army_power(army, catalog) for army in defenders)

    structure = state.structures.get(engagement.structure_id) if engagement.structure_id else None
    fortification = 1.0
    if structure is not None:
        defender_power += structure_power(structure, catalog)
        fortification = structure.fortification

    battle_seed = derive_seed(
        state.master_seed, "m2-engagement", state.turn.month, engagement.id
    )
    new_owner: Side | None = engagement.defender_side
    if attacker_power > defender_power * 1.08:
        outcome = CombatOutcome.CAPTURED
        new_owner = engagement.attacker_side
        if structure is not None and engagement.attacker_side is not None:
            structure.owner = engagement.attacker_side
    elif defender_power > attacker_power * 1.08:
        outcome = CombatOutcome.REPELLED
    else:
        outcome = CombatOutcome.ATTRITION

    report = CombatReport(
        structure_id=engagement.structure_id,
        location=engagement.location,
        month=state.turn.month,
        attacker=engagement.attacker_side or Side.MONSTER,
        defender=engagement.defender_side,
        attacker_power=round(attacker_power, 3),
        defender_power=round(defender_power, 3),
        fortification=fortification,
        outcome=outcome,
        attacker_casualties=int(attacker_power * 0.03),
        defender_casualties=int(defender_power * (0.08 if outcome == CombatOutcome.CAPTURED else 0.025)),
        new_owner=new_owner,
        seed=battle_seed,
    )
    state.combat_log.append(report)
    return report


def resolve_military_phase(state: GameState, catalog: Catalog | None = None) -> list[Engagement]:
    """Simultaneous MILITARY settlement: collect both deployments, then resolve.

    Both sides' submitted ArmyMoves are applied, co-located friendly armies are
    merged (合流), engagements are detected, and friendly armies that moved onto
    their own structure without triggering a fight garrison in (進駐).
    """
    moved_ids: set[str] = set()
    applied_moves: list[ArmyMove] = []
    for side in (Side.HUMAN, Side.MONSTER):
        deployment = state.turn.deployments.get(side)
        if deployment is None:
            continue
        for move in deployment.movements:
            army = state.armies.get(move.army_id)
            if army is None or army.owner != side:
                raise ValueError(f"deployment for {side.value} cannot move army {move.army_id}")
            apply_army_move(state, move)
            moved_ids.add(move.army_id)
            applied_moves.append(move)

    consolidate_friendly_armies(state, moved_ids)
    engagements = find_engagements(state, applied_moves)
    engaged_ids = {aid for eng in engagements for aid in (*eng.attackers, *eng.defenders)}
    garrison_into_structures(state, moved_ids - engaged_ids)
    state.engagements = engagements
    return engagements


def check_winner(state: GameState) -> Side | None:
    for structure in state.structures.values():
        if structure.structure_type == StructureType.CAPITAL and structure.owner == Side.MONSTER:
            state.winner = Side.MONSTER
        if structure.structure_type == StructureType.MAIN_NEST and structure.owner == Side.HUMAN:
            state.winner = Side.HUMAN
    return state.winner


def advance_one_month(state: GameState, catalog: Catalog | None = None) -> GameState:
    state.engagements = []
    engagements: list[Engagement] = []
    for phase in (TurnPhase.DOMESTIC, TurnPhase.INTELLIGENCE, TurnPhase.MILITARY, TurnPhase.COMBAT):
        state.turn.phase = phase
        if phase == TurnPhase.MILITARY:
            engagements = resolve_military_phase(state, catalog)
        if phase == TurnPhase.COMBAT:
            if engagements:
                for engagement in engagements:
                    resolve_engagement_combat(state, engagement, catalog)
            else:
                # No real engagements this month: keep the M1 demo scaffold so the
                # end-to-end smoke still exercises COMBAT.  TODO(P4.6): remove.
                resolve_placeholder_combat(state, catalog)
    check_winner(state)
    if state.winner is None:
        state.turn.month += 1
        state.turn.phase = TurnPhase.DOMESTIC
        reset_movement_points(state)  # P2.1: movement budget refreshes each month
    return state


def run_demo_month(seed: str = "m1-demo", catalog: Catalog | None = None) -> GameState:
    state = generate_game_state(MapGenConfig(seed=seed), catalog)
    state.turn.month = 3
    return advance_one_month(state, catalog)


def stable_state_json(state: GameState) -> str:
    payload = state.model_dump(mode="json")
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
