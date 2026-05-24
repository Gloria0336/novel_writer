from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.engine import novel_db_overlay
from backend.app.engine.memory import compress_memory_summaries, embed_text, estimate_tokens
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
from backend.app.schemas import CampaignBundleResponse
from backend.app.services.defaults import (
    build_default_actors,
    build_default_rulebook,
    build_default_world_entries,
    build_initial_story_state,
    bootstrap_from_novel_db,
)


GM_MODEL_OPTIONS = (
    "anthropic/claude-sonnet-4.6",
    "openai/gpt-5.5",
    "x-ai/grok-4.3",
    "google/gemini-3.5-flash",
)

NPC_MODEL_OPTIONS = (
    "google/gemini-3.5-flash",
    "moonshotai/kimi-k2.6",
    "deepseek/deepseek-v4-flash",
    "x-ai/grok-4.3",
)


def _model_options_for_role(role: str) -> tuple[str, ...]:
    if role == "gm":
        return GM_MODEL_OPTIONS
    if role == "npc":
        return NPC_MODEL_OPTIONS
    return ()


def _validate_actor_model_update(actor: ActorProfile, updates: dict[str, Any]) -> None:
    if not ({"role", "model_provider", "model_name"} & updates.keys()):
        return

    role = updates.get("role") or actor.role
    allowed_models = _model_options_for_role(role)
    if not allowed_models:
        return

    provider = updates.get("model_provider", actor.model_provider)
    if provider != "openrouter":
        raise HTTPException(status_code=400, detail="GM/NPC 模型供應商必須是 openrouter。")

    model_name = updates.get("model_name", actor.model_name)
    if model_name not in allowed_models:
        allowed = "、".join(allowed_models)
        raise HTTPException(status_code=400, detail=f"{role} 模型只能使用：{allowed}")


def _not_found(name: str) -> HTTPException:
    return HTTPException(status_code=404, detail=f"找不到{name}")


def _value(source: Any, key: str, default: Any) -> Any:
    if isinstance(source, dict):
        return source.get(key, default)
    return getattr(source, key, default)


def next_sequence_no(session: Session, campaign_id: str) -> int:
    existing = session.scalar(
        select(func.max(StoryEvent.sequence_no)).where(StoryEvent.campaign_id == campaign_id)
    )
    return int(existing or 0) + 1


def latest_snapshot(session: Session, campaign_id: str) -> StoryStateSnapshot | None:
    return session.scalar(
        select(StoryStateSnapshot)
        .where(StoryStateSnapshot.campaign_id == campaign_id)
        .order_by(StoryStateSnapshot.version.desc())
        .limit(1)
    )


def _load_novel_overlay(campaign: Campaign) -> novel_db_overlay.BibleBundle | None:
    novel_id = (campaign.metadata_json or {}).get("novel_id")
    if not isinstance(novel_id, str) or not novel_id:
        return None
    try:
        return novel_db_overlay.load_bible_bundle(novel_id)
    except FileNotFoundError:
        return None


def _bundle_components(session: Session, campaign_id: str) -> dict[str, Any]:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise _not_found("劇本")
    rulebook = session.scalar(
        select(Rulebook).where(Rulebook.campaign_id == campaign_id).order_by(Rulebook.created_at.asc())
    )
    if not rulebook:
        raise HTTPException(status_code=500, detail="劇本缺少規則書資料。")
    return {
        "campaign": campaign,
        "rulebook": rulebook,
        "world_entries": list(
            session.scalars(
                select(WorldEntry).where(WorldEntry.campaign_id == campaign_id).order_by(WorldEntry.created_at.asc())
            )
        ),
        "actors": list(
            session.scalars(
                select(ActorProfile).where(ActorProfile.campaign_id == campaign_id).order_by(ActorProfile.created_at.asc())
            )
        ),
        "latest_snapshot": latest_snapshot(session, campaign_id),
        "timeline": list(
            session.scalars(
                select(StoryEvent).where(StoryEvent.campaign_id == campaign_id).order_by(StoryEvent.sequence_no.asc())
            )
        ),
        "memories": list(
            session.scalars(
                select(AgentMemoryArtifact)
                .where(AgentMemoryArtifact.campaign_id == campaign_id)
                .order_by(AgentMemoryArtifact.created_at.asc())
            )
        ),
        "embedding_chunks": list(
            session.scalars(
                select(EmbeddingChunk)
                .where(EmbeddingChunk.campaign_id == campaign_id)
                .order_by(EmbeddingChunk.created_at.asc())
            )
        ),
        "director_notes": list(
            session.scalars(
                select(DirectorNote).where(DirectorNote.campaign_id == campaign_id).order_by(DirectorNote.created_at.asc())
            )
        ),
        "gm_briefs": list(
            session.scalars(
                select(GMBrief).where(GMBrief.campaign_id == campaign_id).order_by(GMBrief.created_at.asc())
            )
        ),
        "resolutions": list(
            session.scalars(
                select(TurnResolution)
                .where(TurnResolution.campaign_id == campaign_id)
                .order_by(TurnResolution.created_at.asc())
            )
        ),
        "runs": list(
            session.scalars(
                select(CampaignRun).where(CampaignRun.campaign_id == campaign_id).order_by(CampaignRun.created_at.asc())
            )
        ),
        "novel_overlay": _load_novel_overlay(campaign),
    }


def get_campaign_components(session: Session, campaign_id: str) -> dict[str, Any]:
    return _bundle_components(session, campaign_id)


def get_campaign_bundle_response(session: Session, campaign_id: str) -> CampaignBundleResponse:
    bundle = _bundle_components(session, campaign_id)
    return CampaignBundleResponse(
        campaign=bundle["campaign"],
        rulebook=bundle["rulebook"].payload_json,
        world_entries=bundle["world_entries"],
        actors=bundle["actors"],
        latest_snapshot=bundle["latest_snapshot"],
        timeline=bundle["timeline"],
        memories=bundle["memories"],
        director_notes=bundle["director_notes"],
        gm_briefs=bundle["gm_briefs"],
        resolutions=bundle["resolutions"],
    )


def create_campaign(session: Session, payload: Any) -> Campaign:
    campaign = Campaign(
        name=payload.name,
        description=payload.description,
        status="active",
        metadata_json={
            "premise": payload.premise,
            "created_from": "local_web_console",
            **payload.metadata,
        },
    )
    session.add(campaign)
    session.flush()

    rulebook_payload = build_default_rulebook()
    session.add(
        Rulebook(
            campaign_id=campaign.id,
            name=rulebook_payload["name"],
            version=rulebook_payload["version"],
            payload_json=rulebook_payload,
        )
    )

    world_entries = payload.world_entries or build_default_world_entries(payload.premise)
    for entry in world_entries:
        session.add(
            WorldEntry(
                campaign_id=campaign.id,
                title=_value(entry, "title", ""),
                category=_value(entry, "category", "misc"),
                visibility_scope=_value(entry, "visibility_scope", "world"),
                body=_value(entry, "body", ""),
                tags_json=list(_value(entry, "tags", [])),
                metadata_json=dict(_value(entry, "metadata", {})),
            )
        )

    player_actor_id = None
    actor_payloads = payload.actors or build_default_actors(payload.player_name)
    for actor in actor_payloads:
        profile = ActorProfile(
            campaign_id=campaign.id,
            name=_value(actor, "name", "未命名"),
            role=_value(actor, "role", "npc"),
            persona=_value(actor, "persona", ""),
            motives_json=list(_value(actor, "motives", [])),
            visibility_policy_json=dict(_value(actor, "visibility_policy", {})),
            knowledge_scopes_json=list(_value(actor, "knowledge_scopes", [])),
            secret_motives=_value(actor, "secret_motives", ""),
            model_provider=_value(actor, "model_provider", "openrouter"),
            model_name=_value(actor, "model_name", "openrouter/auto"),
            temperature=float(_value(actor, "temperature", 0.8)),
            metadata_json=dict(_value(actor, "metadata", {})),
        )
        session.add(profile)
        session.flush()
        if profile.role == "player" and player_actor_id is None:
            player_actor_id = profile.id

    initial_state = _value(payload, "initial_story_state", None) or build_initial_story_state(payload.premise)
    session.add(
        StoryStateSnapshot(
            campaign_id=campaign.id,
            version=1,
            current_scene=initial_state["current_scene"],
            active_objectives_json=initial_state["active_objectives"],
            npc_statuses_json=initial_state["npc_statuses"],
            raw_state_json=initial_state["raw_state"],
        )
    )
    session.add(
        StoryEvent(
            campaign_id=campaign.id,
            run_id=None,
            sequence_no=1,
            event_kind="campaign_created",
            source_channel="system",
            actor_id=player_actor_id,
            title="劇本已建立",
            body=payload.premise,
            visibility_scope="public",
            payload_json={"premise": payload.premise, "processed_run_id": None},
        )
    )
    campaign.player_actor_id = player_actor_id
    session.add(
        AgentMemoryArtifact(
            campaign_id=campaign.id,
            actor_id=None,
            scope="public",
            artifact_type="public_summary",
            summary=payload.premise,
            facts_json=[payload.premise],
            recent_excerpt=payload.premise,
            source_event_ids_json=[],
            token_count=estimate_tokens(payload.premise),
        )
    )
    session.commit()
    session.refresh(campaign)
    return campaign


def create_campaign_from_novel(session: Session, payload: Any) -> Campaign:
    player_char_id = payload.player_char_id
    if not player_char_id:
        try:
            bundle = novel_db_overlay.load_bible_bundle(payload.novel_id)
            if bundle.characters:
                player_char_id = bundle.characters[0].char_id
        except FileNotFoundError:
            player_char_id = None

    premise = payload.premise or f"Campaign bootstrapped from {payload.novel_id}."
    bootstrap = bootstrap_from_novel_db(
        payload.novel_id,
        premise,
        player_char_id=player_char_id,
    )
    request = SimpleNamespace(
        name=payload.name or payload.novel_id,
        description=payload.description or f"Bootstrapped from novel_db/{payload.novel_id}.",
        player_name=player_char_id or "The Protagonist",
        premise=premise,
        world_entries=bootstrap["world_entries"],
        actors=bootstrap["actors"],
        initial_story_state=bootstrap["initial_story_state"],
        metadata={
            "novel_id": payload.novel_id,
            "player_char_id": player_char_id,
            "created_from": "novel_db",
        },
    )
    campaign = create_campaign(session, request)

    # 同步建立 staging（拷貝 novel_db → working / source_snapshot）。
    # 失敗不致命（campaign 已建好），只記錄到 metadata。
    from backend.app.services import campaign_staging

    try:
        paths = campaign_staging.bootstrap(campaign, overwrite=False)
        if paths:
            meta = dict(campaign.metadata_json or {})
            meta["staging_bootstrapped"] = True
            meta["staging_root"] = str(paths.root)
            campaign.metadata_json = meta
            session.commit()
    except FileExistsError:
        # 既有 staging 就重用，不覆寫使用者進行中的資料
        meta = dict(campaign.metadata_json or {})
        meta["staging_bootstrapped"] = True
        meta["staging_existed"] = True
        campaign.metadata_json = meta
        session.commit()
    except Exception as exc:  # pragma: no cover
        meta = dict(campaign.metadata_json or {})
        meta["staging_bootstrap_error"] = str(exc)
        campaign.metadata_json = meta
        session.commit()

    return campaign


def update_actor(session: Session, campaign_id: str, actor_id: str, payload: Any) -> ActorProfile:
    actor = session.get(ActorProfile, actor_id)
    if not actor or actor.campaign_id != campaign_id:
        raise _not_found("角色")

    updates = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else dict(payload)
    if "temperature" in updates and updates["temperature"] is not None:
        temp = float(updates["temperature"])
        if not (0.0 <= temp <= 2.0):
            raise HTTPException(status_code=400, detail="temperature 必須在 0.0–2.0 之間。")
        updates["temperature"] = temp

    _validate_actor_model_update(actor, updates)

    for field in ("name", "role", "persona", "model_provider", "model_name", "temperature"):
        if field in updates and updates[field] is not None:
            setattr(actor, field, updates[field])

    session.commit()
    session.refresh(actor)
    return actor


def get_or_create_run(session: Session, campaign_id: str, run_id: str | None = None) -> CampaignRun:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise _not_found("劇本")
    if run_id:
        run = session.get(CampaignRun, run_id)
        if not run or run.campaign_id != campaign_id:
            raise _not_found("劇本執行序")
        return run

    run = CampaignRun(
        campaign_id=campaign_id,
        status="paused",
        current_node="idle",
        interrupt_payload_json={"reason": "created"},
        sequence_cursor=0,
    )
    session.add(run)
    session.flush()
    campaign.active_run_id = run.id
    session.commit()
    session.refresh(run)
    return run


def append_story_event(
    session: Session,
    *,
    campaign_id: str,
    run_id: str | None,
    event_kind: str,
    source_channel: str,
    title: str,
    body: str,
    visibility_scope: str,
    actor_id: str | None = None,
    payload: dict[str, Any] | None = None,
) -> StoryEvent:
    event = StoryEvent(
        campaign_id=campaign_id,
        run_id=run_id,
        sequence_no=next_sequence_no(session, campaign_id),
        event_kind=event_kind,
        source_channel=source_channel,
        actor_id=actor_id,
        title=title,
        body=body,
        visibility_scope=visibility_scope,
        payload_json=payload or {},
    )
    session.add(event)
    session.flush()
    return event


def record_player_action(session: Session, campaign_id: str, payload: Any) -> StoryEvent:
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise _not_found("劇本")
    actor_id = payload.actor_id or campaign.player_actor_id
    event = append_story_event(
        session,
        campaign_id=campaign_id,
        run_id=campaign.active_run_id,
        event_kind="player_action",
        source_channel="player",
        actor_id=actor_id,
        title="玩家行動",
        body=payload.content,
        visibility_scope="public",
        payload={"intent": payload.intent, "metadata": payload.metadata, "processed_run_id": None},
    )
    session.commit()
    session.refresh(event)
    return event


def record_director_note(session: Session, campaign_id: str, payload: Any) -> DirectorNote:
    note = DirectorNote(
        campaign_id=campaign_id,
        note_type=payload.command_type,
        title=payload.title,
        body=payload.content,
        payload_json=payload.payload,
        is_consumed=False,
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


def record_gm_brief(session: Session, campaign_id: str, payload: Any) -> GMBrief:
    brief = GMBrief(
        campaign_id=campaign_id,
        title=payload.title,
        body=payload.body,
        payload_json=payload.payload,
        reveal_in_context=payload.reveal_in_context,
    )
    session.add(brief)
    session.commit()
    session.refresh(brief)
    return brief


def record_injected_event(session: Session, campaign_id: str, payload: Any) -> DirectorNote:
    note = DirectorNote(
        campaign_id=campaign_id,
        note_type="inject_event",
        title=payload.title,
        body=payload.body,
        payload_json=payload.payload,
        is_consumed=False,
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


def fetch_pending_player_action(session: Session, campaign_id: str) -> StoryEvent | None:
    player_events = list(
        session.scalars(
            select(StoryEvent)
            .where(
                StoryEvent.campaign_id == campaign_id,
                StoryEvent.event_kind == "player_action",
            )
            .order_by(StoryEvent.sequence_no.asc())
        )
    )
    for event in reversed(player_events):
        if not event.payload_json.get("processed_run_id"):
            return event
    return None


def fetch_pending_director_notes(session: Session, campaign_id: str) -> list[DirectorNote]:
    return list(
        session.scalars(
            select(DirectorNote)
            .where(
                DirectorNote.campaign_id == campaign_id,
                DirectorNote.is_consumed.is_(False),
            )
            .order_by(DirectorNote.created_at.asc())
        )
    )


def mark_story_event_processed(event: StoryEvent, run_id: str) -> None:
    payload = dict(event.payload_json or {})
    payload["processed_run_id"] = run_id
    event.payload_json = payload


def mark_notes_consumed(notes: list[DirectorNote]) -> None:
    for note in notes:
        note.is_consumed = True


def create_snapshot(
    session: Session,
    *,
    campaign_id: str,
    current_scene: str,
    active_objectives: list[str],
    npc_statuses: dict[str, Any],
    raw_state: dict[str, Any],
) -> StoryStateSnapshot:
    previous = latest_snapshot(session, campaign_id)
    snapshot = StoryStateSnapshot(
        campaign_id=campaign_id,
        version=(previous.version if previous else 0) + 1,
        current_scene=current_scene,
        active_objectives_json=active_objectives,
        npc_statuses_json=npc_statuses,
        raw_state_json=raw_state,
    )
    session.add(snapshot)
    session.flush()
    return snapshot


def create_resolution(
    session: Session,
    *,
    campaign_id: str,
    run_id: str,
    action_event_id: str | None,
    resolution: dict[str, Any],
    rule_version: str,
) -> TurnResolution:
    record = TurnResolution(
        campaign_id=campaign_id,
        run_id=run_id,
        action_event_id=action_event_id,
        seed=resolution["seed"],
        rule_version=rule_version,
        outcome=resolution["outcome"],
        total=int(resolution["total"]),
        target=int(resolution["target"]),
        breakdown_json=resolution["breakdown"],
        override_source=resolution.get("override_source"),
        narration=resolution["narration"],
    )
    session.add(record)
    session.flush()
    return record


def persist_memory_summary(
    session: Session,
    *,
    campaign_id: str,
    actor_id: str | None,
    memory_payload: dict[str, Any],
) -> AgentMemoryArtifact:
    artifact = AgentMemoryArtifact(
        campaign_id=campaign_id,
        actor_id=actor_id,
        scope=memory_payload["scope"],
        artifact_type=memory_payload["artifact_type"],
        summary=memory_payload["summary"],
        facts_json=memory_payload["facts"],
        recent_excerpt=memory_payload.get("recent_excerpt", ""),
        source_event_ids_json=memory_payload.get("source_event_ids", []),
        token_count=int(memory_payload.get("token_count") or estimate_tokens(memory_payload["summary"])),
    )
    session.add(artifact)
    session.flush()
    session.add(
        EmbeddingChunk(
            campaign_id=campaign_id,
            actor_id=actor_id,
            artifact_id=artifact.id,
            scope=memory_payload["scope"],
            text=artifact.summary,
            vector_json=embed_text(artifact.summary),
            metadata_json={"facts": artifact.facts_json, "artifact_type": artifact.artifact_type},
        )
    )
    return artifact


def compress_memories(session: Session, campaign_id: str, token_threshold: int) -> None:
    actor_ids = [None] + [
        actor.id
        for actor in session.scalars(select(ActorProfile).where(ActorProfile.campaign_id == campaign_id))
    ]
    for actor_id in actor_ids:
        artifacts = [
            artifact
            for artifact in session.scalars(
                select(AgentMemoryArtifact)
                .where(AgentMemoryArtifact.campaign_id == campaign_id)
                .order_by(AgentMemoryArtifact.created_at.asc())
            )
            if artifact.actor_id == actor_id
        ]
        if sum(item.token_count for item in artifacts) <= token_threshold:
            continue
        rolled_text, recent = compress_memory_summaries(
            [
                {
                    "summary": item.summary,
                    "token_count": item.token_count,
                    "created_at": item.created_at.isoformat(),
                }
                for item in artifacts
            ],
            token_threshold=token_threshold,
        )
        if not rolled_text:
            continue
        persist_memory_summary(
            session,
            campaign_id=campaign_id,
            actor_id=actor_id,
            memory_payload={
                "scope": "public" if actor_id is None else "private",
                "artifact_type": "compressed_summary",
                "summary": rolled_text,
                "facts": [rolled_text[:180]],
                "recent_excerpt": recent[-1]["summary"][:260] if recent else rolled_text[:260],
                "source_event_ids": [],
                "token_count": estimate_tokens(rolled_text),
            },
        )
