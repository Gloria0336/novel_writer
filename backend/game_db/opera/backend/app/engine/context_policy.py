from __future__ import annotations

from typing import Any

from backend.app.engine.memory import rank_memory_chunks


def _as_dict(model: Any, fields: list[str]) -> dict[str, Any]:
    return {field: getattr(model, field) for field in fields}


def _world_entries_for_actor(actor: Any, world_entries: list[Any]) -> list[dict[str, Any]]:
    knowledge_scopes = set(actor.knowledge_scopes_json or [])
    if "all" in knowledge_scopes:
        return [
            _as_dict(entry, ["id", "title", "category", "body", "tags_json", "metadata_json"])
            for entry in world_entries
        ]
    visible = []
    for entry in world_entries:
        tags = set(entry.tags_json or [])
        if entry.visibility_scope == "public" or entry.category in knowledge_scopes or tags & knowledge_scopes:
            visible.append(
                _as_dict(entry, ["id", "title", "category", "body", "tags_json", "metadata_json"])
            )
    return visible


def _events_for_actor(actor: Any, timeline: list[Any]) -> list[dict[str, Any]]:
    visible_events = []
    for event in timeline:
        payload = event.payload_json or {}
        witnessed = set(payload.get("witness_ids", []))
        if event.visibility_scope == "public" or event.actor_id == actor.id or actor.id in witnessed:
            visible_events.append(
                _as_dict(
                    event,
                    ["id", "sequence_no", "event_kind", "source_channel", "title", "body", "payload_json"],
                )
            )
    return visible_events


def _novel_overlay_for(bundle: dict[str, Any], audience: str, actor: Any | None = None) -> dict[str, Any] | None:
    """從 bundle 取 novel_db overlay 並依 audience 過濾。

    bundle["novel_overlay"] 由 caller 預先載入（透過 novel_db_overlay.load_bible_bundle）。
    若無 overlay，回 None；context_policy 對 None 應 graceful skip。
    """
    overlay = bundle.get("novel_overlay")
    if overlay is None:
        return None
    from backend.app.engine import novel_db_overlay as _overlay_mod

    if audience == "director":
        return _overlay_mod.overlay_for_director(overlay)
    if audience == "gm":
        return _overlay_mod.overlay_for_gm(overlay)
    if audience == "actor" and actor is not None:
        return _overlay_mod.overlay_for_actor(overlay, actor)
    return None


def assemble_director_view(bundle: dict[str, Any]) -> dict[str, Any]:
    snapshot = bundle["latest_snapshot"]
    view = {
        "layer1": {
            "world_entries": [_as_dict(entry, ["id", "title", "category", "body", "tags_json"]) for entry in bundle["world_entries"]],
            "rulebook": bundle["rulebook"].payload_json,
        },
        "layer2": {
            "current_scene": snapshot.current_scene if snapshot else "",
            "active_objectives": snapshot.active_objectives_json if snapshot else [],
            "npc_statuses": snapshot.npc_statuses_json if snapshot else {},
            "timeline": [
                _as_dict(event, ["id", "sequence_no", "event_kind", "source_channel", "title", "body", "visibility_scope"])
                for event in bundle["timeline"]
            ],
        },
        "layer3": {
            "all_memories": [
                _as_dict(memory, ["id", "actor_id", "scope", "artifact_type", "summary", "facts_json"])
                for memory in bundle["memories"]
            ]
        },
        "layer4": {
            "director_notes": [
                _as_dict(note, ["id", "note_type", "title", "body", "payload_json", "is_consumed"])
                for note in bundle["director_notes"]
            ],
            "gm_briefs": [_as_dict(brief, ["id", "title", "body", "payload_json"]) for brief in bundle["gm_briefs"]],
        },
    }
    if (overlay := _novel_overlay_for(bundle, "director")) is not None:
        view["novel_db_overlay"] = overlay
    return view


def assemble_gm_view(bundle: dict[str, Any]) -> dict[str, Any]:
    snapshot = bundle["latest_snapshot"]
    public_memories = [
        _as_dict(memory, ["id", "scope", "summary", "facts_json", "recent_excerpt"])
        for memory in bundle["memories"]
        if memory.scope == "public"
    ]
    releasable_notes = [
        _as_dict(note, ["id", "title", "body", "payload_json"])
        for note in bundle["director_notes"]
        if note.payload_json.get("share_with_gm") or note.note_type in {"nudge", "override"}
    ]
    view = {
        "layer1": {
            "world_entries": [_as_dict(entry, ["id", "title", "category", "body", "tags_json"]) for entry in bundle["world_entries"]],
            "rulebook": bundle["rulebook"].payload_json,
        },
        "layer2": {
            "current_scene": snapshot.current_scene if snapshot else "",
            "active_objectives": snapshot.active_objectives_json if snapshot else [],
            "npc_statuses": snapshot.npc_statuses_json if snapshot else {},
            "recent_events": [
                _as_dict(event, ["id", "sequence_no", "event_kind", "title", "body", "visibility_scope"])
                for event in bundle["timeline"][-8:]
            ],
        },
        "layer3": {"public_behavior_summaries": public_memories},
        "layer4": {
            "gm_briefs": [_as_dict(brief, ["id", "title", "body", "payload_json"]) for brief in bundle["gm_briefs"] if brief.reveal_in_context],
            "director_cues": releasable_notes,
        },
    }
    if (overlay := _novel_overlay_for(bundle, "gm")) is not None:
        view["novel_db_overlay"] = overlay
    return view


def assemble_actor_view(
    bundle: dict[str, Any],
    actor: Any,
    retrieval_limit: int,
) -> dict[str, Any]:
    snapshot = bundle["latest_snapshot"]
    actor_world = _world_entries_for_actor(actor, bundle["world_entries"])
    experienced_events = _events_for_actor(actor, bundle["timeline"])

    own_memories = [
        _as_dict(memory, ["id", "scope", "summary", "facts_json", "recent_excerpt"])
        for memory in bundle["memories"]
        if memory.actor_id == actor.id or memory.scope == "public"
    ]
    candidate_chunks = []
    for chunk in bundle["embedding_chunks"]:
        if chunk.scope == "public" or chunk.actor_id == actor.id:
            candidate_chunks.append(
                {
                    "id": chunk.id,
                    "text": chunk.text,
                    "scope": chunk.scope,
                    "vector": chunk.vector_json,
                    "metadata": chunk.metadata_json,
                }
            )
    query = " ".join(
        part
        for part in [
            snapshot.current_scene if snapshot else "",
            experienced_events[-1]["body"] if experienced_events else "",
            actor.secret_motives,
        ]
        if part
    )
    ranked_chunks = rank_memory_chunks(query=query, chunks=candidate_chunks, limit=retrieval_limit)

    view = {
        "layer1": {"world_entries": actor_world},
        "layer2": {
            "current_scene": snapshot.current_scene if snapshot else "",
            "experienced_events": experienced_events[-8:],
        },
        "layer3": {
            "memory_artifacts": own_memories[-8:],
            "retrieved_memory": ranked_chunks,
            "secret_motives": actor.secret_motives,
        },
    }
    if (overlay := _novel_overlay_for(bundle, "actor", actor)) is not None:
        view["novel_db_overlay"] = overlay
    return view

