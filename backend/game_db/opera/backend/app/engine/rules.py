from __future__ import annotations

import hashlib
import random
import re
from typing import Any


def infer_skill(action_text: str, rulebook: dict[str, Any]) -> str:
    lowered = action_text.lower()
    skills = rulebook.get("skills", {})
    for skill_name, config in skills.items():
        for keyword in config.get("keywords", []):
            if keyword in lowered:
                return skill_name
    if any(word in lowered for word in ("talk", "convince", "ask", "threaten")):
        return "influence"
    if any(word in lowered for word in ("look", "search", "inspect", "read", "notice")):
        return "investigation"
    if any(word in lowered for word in ("sneak", "shadow", "hide")):
        return "stealth"
    return "combat" if any(word in lowered for word in ("attack", "fight", "duel")) else "investigation"


def infer_difficulty(action_text: str, rulebook: dict[str, Any]) -> tuple[str, int]:
    lowered = action_text.lower()
    scale = rulebook.get("difficulty_scale", {})
    if any(word in lowered for word in ("impossible", "legendary", "miracle")):
        return "legendary", scale.get("legendary", 21)
    if any(word in lowered for word in ("desperate", "dire", "reckless")):
        return "dire", scale.get("dire", 18)
    if any(word in lowered for word in ("careful", "routine", "simple")):
        return "routine", scale.get("routine", 9)
    if any(word in lowered for word in ("sneak", "deceive", "outmaneuver", "attack")):
        return "hard", scale.get("hard", 15)
    return "risky", scale.get("risky", 12)


def derive_seed(*parts: str) -> str:
    raw = "::".join(parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def _randint(seed: str, start: int, end: int) -> int:
    rng = random.Random(seed)
    return rng.randint(start, end)


def resolve_action(
    *,
    action_text: str,
    actor_name: str,
    actor_stats: dict[str, Any],
    rulebook: dict[str, Any],
    seed: str,
    override: dict[str, Any] | None = None,
) -> dict[str, Any]:
    skill = infer_skill(action_text, rulebook)
    difficulty_label, target = infer_difficulty(action_text, rulebook)
    skills = rulebook.get("skills", {})
    attribute = skills.get(skill, {}).get("attribute", "wit")
    stats = actor_stats or {}
    attributes = stats.get("attributes", {})
    skill_ranks = stats.get("skills", {})

    natural_roll = _randint(seed, 1, 20)
    total = natural_roll + int(attributes.get(attribute, 0)) + int(skill_ranks.get(skill, 0))
    damage = 0
    status = None
    outcome = "failure"
    override_source = None

    if override:
        if "forced_roll" in override:
            natural_roll = int(override["forced_roll"])
            total = natural_roll + int(attributes.get(attribute, 0)) + int(skill_ranks.get(skill, 0))
            override_source = override.get("source", "director_override")
        if "forced_total" in override:
            total = int(override["forced_total"])
            override_source = override.get("source", "director_override")
        if "forced_outcome" in override:
            outcome = str(override["forced_outcome"])
            override_source = override.get("source", "director_override")

    if not override or "forced_outcome" not in override:
        margin = total - target
        if natural_roll == 20 or margin >= 8:
            outcome = "critical_success"
        elif margin >= 0:
            outcome = "success"
        elif margin >= -2:
            outcome = "partial_success"
        else:
            outcome = "failure"

    if skill == "combat":
        base_damage = _randint(seed + "::damage", 1, 6)
        damage = base_damage
        if outcome == "success":
            damage += int(rulebook.get("combat", {}).get("success_damage_bonus", 1))
        elif outcome == "critical_success":
            damage += int(rulebook.get("combat", {}).get("critical_damage_bonus", 3))
            status = "marked"
    elif outcome == "partial_success":
        status = "shaken"
    elif outcome == "failure" and re.search(r"magic|spell|ritual|hex", action_text, flags=re.I):
        status = "wounded"

    narration_map = {
        "critical_success": f"{actor_name} turns the moment decisively in their favor.",
        "success": f"{actor_name} gets what they want, but the tension stays alive.",
        "partial_success": f"{actor_name} advances, though the cost is already visible.",
        "failure": f"{actor_name} fails to control the moment and leaves an opening behind.",
    }

    return {
        "skill": skill,
        "attribute": attribute,
        "difficulty_label": difficulty_label,
        "target": target,
        "seed": seed,
        "roll": natural_roll,
        "total": total,
        "outcome": outcome,
        "damage": damage,
        "status": status,
        "override_source": override_source,
        "breakdown": {
            "roll": natural_roll,
            "attribute_bonus": int(attributes.get(attribute, 0)),
            "skill_bonus": int(skill_ranks.get(skill, 0)),
            "damage": damage,
        },
        "narration": narration_map[outcome],
    }

