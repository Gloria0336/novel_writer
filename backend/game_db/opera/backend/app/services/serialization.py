from __future__ import annotations

import json
from uuid import uuid4

import yaml
from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models import (
    ActorProfile,
    AgentMemoryArtifact,
    Campaign,
    CampaignRun,
    DirectorNote,
    EmbeddingChunk,
    GMBrief,
    Rulebook,
    StoryEvent,
    StoryStateSnapshot,
    TurnResolution,
    WorldEntry,
)
from backend.app.services.campaigns import get_campaign_bundle_response, get_campaign_components


def build_export_payload(session: Session, campaign_id: str) -> dict:
    bundle = get_campaign_bundle_response(session, campaign_id).model_dump(mode="json")
    components = get_campaign_components(session, campaign_id)
    bundle["rulebook"] = components["rulebook"].payload_json
    bundle["embedding_chunks"] = [
        {
            "id": item.id,
            "actor_id": item.actor_id,
            "artifact_id": item.artifact_id,
            "scope": item.scope,
            "text": item.text,
            "vector_json": item.vector_json,
            "metadata_json": item.metadata_json,
            "created_at": item.created_at.isoformat(),
        }
        for item in components["embedding_chunks"]
    ]
    bundle["runs"] = [
        {
            "id": run.id,
            "status": run.status,
            "current_node": run.current_node,
            "interrupt_payload_json": run.interrupt_payload_json,
            "sequence_cursor": run.sequence_cursor,
            "created_at": run.created_at.isoformat(),
            "updated_at": run.updated_at.isoformat(),
        }
        for run in components["runs"]
    ]
    return bundle


def export_campaign(session: Session, campaign_id: str, format_name: str) -> tuple[str, dict]:
    payload = build_export_payload(session, campaign_id)
    if format_name == "json":
        return json.dumps(payload, indent=2, ensure_ascii=False), payload
    if format_name == "yaml":
        return yaml.safe_dump(payload, sort_keys=False, allow_unicode=True), payload
    if format_name == "markdown":
        content = [
            f"# {payload['campaign']['name']}",
            "",
            payload["campaign"]["description"],
            "",
            "## Rulebook",
            f"- Name: {payload['rulebook'].get('name', 'Unknown')}",
            f"- Version: {payload['rulebook'].get('version', 'Unknown')}",
            "",
            "## World Entries",
        ]
        for entry in payload["world_entries"]:
            content.extend([f"### {entry['title']}", entry["body"], ""])
        content.append("## Actors")
        for actor in payload["actors"]:
            content.extend([f"### {actor['name']} ({actor['role']})", actor["persona"], ""])
        return "\n".join(content), payload
    raise HTTPException(status_code=400, detail=f"Unsupported export format: {format_name}")


def import_campaign(session: Session, payload: dict, preserve_ids: bool) -> Campaign:
    campaign_payload = payload["campaign"]
    campaign_id = campaign_payload["id"] if preserve_ids else str(uuid4())
    if session.get(Campaign, campaign_id):
        raise HTTPException(status_code=409, detail="Campaign with this id already exists.")

    old_to_new_actor_ids: dict[str, str] = {}
    old_to_new_run_ids: dict[str, str] = {}

    campaign = Campaign(
        id=campaign_id,
        name=campaign_payload["name"],
        description=campaign_payload["description"],
        status=campaign_payload["status"],
        player_actor_id=None,
        active_run_id=campaign_payload.get("active_run_id"),
        metadata_json=campaign_payload.get("metadata_json", {}),
    )
    session.add(campaign)

    session.add(
        Rulebook(
            id=payload["rulebook"].get("id", str(uuid4())) if preserve_ids else str(uuid4()),
            campaign_id=campaign_id,
            name=payload["rulebook"].get("name", "Opera Core"),
            version=payload["rulebook"].get("version", "0.1.0"),
            payload_json=payload["rulebook"],
        )
    )

    for actor in payload.get("actors", []):
        new_actor_id = actor["id"] if preserve_ids else str(uuid4())
        old_to_new_actor_ids[actor["id"]] = new_actor_id
        session.add(
            ActorProfile(
                id=new_actor_id,
                campaign_id=campaign_id,
                name=actor["name"],
                role=actor["role"],
                persona=actor["persona"],
                motives_json=actor.get("motives_json", []),
                visibility_policy_json=actor.get("visibility_policy_json", {}),
                knowledge_scopes_json=actor.get("knowledge_scopes_json", []),
                secret_motives=actor.get("secret_motives", ""),
                model_provider=actor.get("model_provider", "openrouter"),
                model_name=actor.get("model_name", "openrouter/auto"),
                temperature=actor.get("temperature", 0.8),
                metadata_json=actor.get("metadata_json", {}),
            )
        )

    for entry in payload.get("world_entries", []):
        session.add(
            WorldEntry(
                id=entry["id"] if preserve_ids else str(uuid4()),
                campaign_id=campaign_id,
                title=entry["title"],
                category=entry["category"],
                visibility_scope=entry["visibility_scope"],
                body=entry["body"],
                tags_json=entry.get("tags_json", []),
                metadata_json=entry.get("metadata_json", {}),
            )
        )

    latest = payload.get("latest_snapshot")
    if latest:
        session.add(
            StoryStateSnapshot(
                id=latest["id"] if preserve_ids else str(uuid4()),
                campaign_id=campaign_id,
                version=latest["version"],
                current_scene=latest["current_scene"],
                active_objectives_json=latest.get("active_objectives_json", []),
                npc_statuses_json=latest.get("npc_statuses_json", {}),
                raw_state_json=latest.get("raw_state_json", {}),
            )
        )

    for run in payload.get("runs", []):
        new_run_id = run["id"] if preserve_ids else str(uuid4())
        old_to_new_run_ids[run["id"]] = new_run_id
        session.add(
            CampaignRun(
                id=new_run_id,
                campaign_id=campaign_id,
                status=run["status"],
                current_node=run["current_node"],
                interrupt_payload_json=run.get("interrupt_payload_json", {}),
                sequence_cursor=run.get("sequence_cursor", 0),
            )
        )

    for event in payload.get("timeline", []):
        session.add(
            StoryEvent(
                id=event["id"] if preserve_ids else str(uuid4()),
                campaign_id=campaign_id,
                run_id=old_to_new_run_ids.get(event.get("run_id"), event.get("run_id")),
                sequence_no=event["sequence_no"],
                event_kind=event["event_kind"],
                source_channel=event["source_channel"],
                actor_id=old_to_new_actor_ids.get(event.get("actor_id"), event.get("actor_id")),
                title=event["title"],
                body=event["body"],
                visibility_scope=event["visibility_scope"],
                payload_json=event.get("payload_json", {}),
            )
        )

    for memory in payload.get("memories", []):
        session.add(
            AgentMemoryArtifact(
                id=memory["id"] if preserve_ids else str(uuid4()),
                campaign_id=campaign_id,
                actor_id=old_to_new_actor_ids.get(memory.get("actor_id"), memory.get("actor_id")),
                scope=memory["scope"],
                artifact_type=memory["artifact_type"],
                summary=memory["summary"],
                facts_json=memory.get("facts_json", []),
                recent_excerpt=memory.get("recent_excerpt", ""),
                source_event_ids_json=memory.get("source_event_ids_json", []),
                token_count=memory.get("token_count", 0),
            )
        )

    for chunk in payload.get("embedding_chunks", []):
        session.add(
            EmbeddingChunk(
                id=chunk["id"] if preserve_ids else str(uuid4()),
                campaign_id=campaign_id,
                actor_id=old_to_new_actor_ids.get(chunk.get("actor_id"), chunk.get("actor_id")),
                artifact_id=chunk.get("artifact_id"),
                scope=chunk["scope"],
                text=chunk["text"],
                vector_json=chunk.get("vector_json", []),
                metadata_json=chunk.get("metadata_json", {}),
            )
        )

    for note in payload.get("director_notes", []):
        session.add(
            DirectorNote(
                id=note["id"] if preserve_ids else str(uuid4()),
                campaign_id=campaign_id,
                note_type=note["note_type"],
                title=note["title"],
                body=note["body"],
                payload_json=note.get("payload_json", {}),
                is_consumed=note.get("is_consumed", False),
            )
        )

    for brief in payload.get("gm_briefs", []):
        session.add(
            GMBrief(
                id=brief["id"] if preserve_ids else str(uuid4()),
                campaign_id=campaign_id,
                title=brief["title"],
                body=brief["body"],
                payload_json=brief.get("payload_json", {}),
                reveal_in_context=brief.get("reveal_in_context", True),
            )
        )

    for resolution in payload.get("resolutions", []):
        session.add(
            TurnResolution(
                id=resolution["id"] if preserve_ids else str(uuid4()),
                campaign_id=campaign_id,
                run_id=old_to_new_run_ids.get(resolution["run_id"], resolution["run_id"]),
                action_event_id=resolution.get("action_event_id"),
                seed=resolution["seed"],
                rule_version=resolution["rule_version"],
                outcome=resolution["outcome"],
                total=resolution["total"],
                target=resolution["target"],
                breakdown_json=resolution.get("breakdown_json", {}),
                override_source=resolution.get("override_source"),
                narration=resolution["narration"],
            )
        )

    campaign.player_actor_id = old_to_new_actor_ids.get(
        campaign_payload.get("player_actor_id"), campaign_payload.get("player_actor_id")
    )
    campaign.active_run_id = old_to_new_run_ids.get(
        campaign_payload.get("active_run_id"), campaign_payload.get("active_run_id")
    )
    session.commit()
    session.refresh(campaign)
    return campaign
