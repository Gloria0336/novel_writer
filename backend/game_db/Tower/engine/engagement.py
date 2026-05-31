"""M2 strategic engagement detection."""

from __future__ import annotations

from collections import defaultdict

from schema.models import Army, ArmyMove, DeployIntent, Engagement, GameState, HexCoord, Side, Structure, controlled_tiles, derive_seed


def _opponent(side: Side) -> Side:
    return Side.MONSTER if side == Side.HUMAN else Side.HUMAN


def _engagement_id(state: GameState, coord: HexCoord, index: int) -> str:
    return derive_seed(state.master_seed, "engagement", state.turn.month, coord.key(), index)


def _split_armies(armies: list[Army], attacker_side: Side | None = None) -> tuple[list[Army], list[Army], Side | None, Side | None]:
    if attacker_side is None:
        sides = sorted({army.owner for army in armies}, key=lambda item: item.value)
        attacker_side = sides[0] if sides else None
    defender_side = _opponent(attacker_side) if attacker_side is not None else None
    attackers = [army for army in armies if army.owner == attacker_side]
    defenders = [army for army in armies if army.owner == defender_side]
    return attackers, defenders, attacker_side, defender_side


def _structure_at(state: GameState, coord: HexCoord) -> Structure | None:
    tile = state.tile_at(coord)
    if tile is None or tile.structure_id is None:
        return None
    return state.structures.get(tile.structure_id)


def find_engagements(state: GameState, moves: list[ArmyMove] | None = None) -> list[Engagement]:
    """Find combat triggers after movement has been applied.

    M2 only creates strategic triggers.  M4 will expand each engagement into a
    tactical battle map and deterministic battle replay.
    """
    engagements: list[Engagement] = []
    seen: set[tuple[str, str, str]] = set()

    def add(
        coord: HexCoord,
        armies: list[Army],
        reason: Engagement["reason"],
        attacker_side: Side | None = None,
        structure: Structure | None = None,
    ) -> None:
        attackers, defenders, resolved_attacker, resolved_defender = _split_armies(armies, attacker_side)
        if structure is not None and structure.owner is not None:
            resolved_defender = structure.owner
            resolved_attacker = _opponent(structure.owner) if resolved_attacker is None else resolved_attacker
            attackers = [army for army in armies if army.owner == resolved_attacker]
            defenders = [army for army in armies if army.owner == resolved_defender]
        if not attackers:
            return
        if not defenders and structure is None:
            return
        key = (
            coord.key(),
            ",".join(sorted(army.id for army in attackers)),
            ",".join(sorted([army.id for army in defenders] + ([structure.id] if structure else []))),
        )
        if key in seen:
            return
        seen.add(key)
        engagements.append(
            Engagement(
                id=_engagement_id(state, coord, len(engagements)),
                location=coord,
                month=state.turn.month,
                attackers=sorted(army.id for army in attackers),
                defenders=sorted(army.id for army in defenders),
                attacker_side=resolved_attacker,
                defender_side=resolved_defender,
                structure_id=structure.id if structure is not None else None,
                reason=reason,
            )
        )

    by_coord: dict[str, list[Army]] = defaultdict(list)
    for army in state.armies.values():
        by_coord[army.position.key()].append(army)
    for armies in by_coord.values():
        if len({army.owner for army in armies}) > 1:
            add(armies[0].position, armies, "army_collision")

    for army in state.armies.values():
        structure = _structure_at(state, army.position)
        if structure is not None and structure.owner is not None and structure.owner != army.owner:
            add(army.position, [army], "structure_assault", attacker_side=army.owner, structure=structure)

    controlled: list[tuple[Structure, set[str]]] = [
        (structure, {coord.key() for coord in controlled_tiles(structure)})
        for structure in state.structures.values()
        if structure.owner is not None
    ]
    for army in state.armies.values():
        for structure, coords in controlled:
            if structure.owner != army.owner and army.position.key() in coords:
                add(army.position, [army], "control_contest", attacker_side=army.owner, structure=structure)

    for move in moves or []:
        if move.intent != DeployIntent.ATTACK:
            continue
        army = state.armies.get(move.army_id)
        if army is None:
            continue
        local_armies = [item for item in state.armies.values() if item.position == army.position]
        structure = _structure_at(state, army.position)
        if any(item.owner != army.owner for item in local_armies) or (
            structure is not None and structure.owner is not None and structure.owner != army.owner
        ):
            add(army.position, local_armies, "attack_order", attacker_side=army.owner, structure=structure)

    return engagements
