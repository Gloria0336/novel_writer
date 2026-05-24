from __future__ import annotations

from typing import Any

from backend.app.engine.memory import estimate_tokens, extract_structured_facts


def summarize_turn(
    *,
    campaign_name: str,
    snapshot: dict[str, Any],
    gm_output: dict[str, Any],
    actor_turns: list[dict[str, Any]],
    resolution: dict[str, Any] | None,
    actors: list[dict[str, Any]],
    source_event_ids: list[str],
) -> dict[str, Any]:
    scene = snapshot.get("current_scene", "")
    public_lines = [gm_output.get("narration", scene)]
    public_lines.extend(turn.get("public_text", turn.get("action", "")) for turn in actor_turns if turn.get("public_text") or turn.get("action"))
    if resolution:
        public_lines.append(resolution.get("narration", ""))

    public_summary = " ".join(line.strip() for line in public_lines if line.strip())
    facts = extract_structured_facts(scene, public_summary)

    gm_summary = (
        f"Scene anchor: {scene}\n"
        f"Pressure beats: {gm_output.get('pressure', 'Maintain rising tension.')}\n"
        f"Resolution: {resolution.get('outcome', 'none') if resolution else 'none'}"
    )
    director_summary = (
        f"Campaign {campaign_name} advanced to scene '{gm_output.get('scene_title', 'Untitled Scene')}'. "
        f"Open threads now include: {', '.join(snapshot.get('raw_state', {}).get('open_threads', [])[:3]) or 'none'}."
    )

    updates: list[dict[str, Any]] = []
    for actor in actors:
        role = actor.get("role", "npc")
        private_scope = "gm_private" if role == "gm" else "private"
        private_summary = (
            f"{actor['name']} remembers the scene as: {public_summary[:220]} "
            f"Personal motive pressure: {actor.get('secret_motives', '')[:140]}"
        ).strip()
        updates.append(
            {
                "actor_id": actor["id"],
                "scope": private_scope,
                "artifact_type": "rolling_summary",
                "summary": private_summary,
                "facts": extract_structured_facts(private_summary, actor.get("secret_motives", "")),
                "recent_excerpt": public_summary[:260],
                "source_event_ids": source_event_ids,
                "token_count": estimate_tokens(private_summary),
            }
        )

    return {
        "public_summary": public_summary,
        "gm_summary": gm_summary,
        "director_summary": director_summary,
        "facts": facts,
        "public_memory": {
            "scope": "public",
            "artifact_type": "public_summary",
            "summary": public_summary,
            "facts": facts,
            "recent_excerpt": public_summary[:260],
            "source_event_ids": source_event_ids,
            "token_count": estimate_tokens(public_summary),
        },
        "agent_memory_updates": updates,
    }

