from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.db import get_db
from backend.app.engine.context_policy import (
    assemble_actor_view,
    assemble_director_view,
    assemble_gm_view,
)
from backend.app.models import Campaign
from backend.app.schemas import (
    ActorProfileRead,
    ActorUpdate,
    CampaignBundleResponse,
    CampaignRead,
    CampaignViewResponse,
    CreateCampaignFromNovelRequest,
    CreateCampaignRequest,
    DirectorCommandRequest,
    DirectorNoteRead,
    ExportResponse,
    GMBriefRead,
    GMBriefRequest,
    ImportRequest,
    InjectEventRequest,
    PlayerActionRequest,
    StepRequest,
    StepResponse,
    StoryEventRead,
    TurnResolutionRead,
)
from backend.app.services import campaign_staging, campaigns, cognitive_sync
from backend.app.services.events import broker
from backend.app.services.orchestrator import OrchestratorService
from backend.app.services.serialization import export_campaign, import_campaign


router = APIRouter()
orchestrator = OrchestratorService()


@router.get("", response_model=list[CampaignRead])
def list_campaigns(db: Session = Depends(get_db)) -> list[Campaign]:
    return list(db.scalars(select(Campaign).order_by(Campaign.created_at.desc())))


@router.post("", response_model=CampaignBundleResponse)
def create_campaign(payload: CreateCampaignRequest, db: Session = Depends(get_db)) -> CampaignBundleResponse:
    campaign = campaigns.create_campaign(db, payload)
    return campaigns.get_campaign_bundle_response(db, campaign.id)


@router.post("/from-novel", response_model=CampaignBundleResponse)
def create_campaign_from_novel(
    payload: CreateCampaignFromNovelRequest,
    db: Session = Depends(get_db),
) -> CampaignBundleResponse:
    campaign = campaigns.create_campaign_from_novel(db, payload)
    return campaigns.get_campaign_bundle_response(db, campaign.id)


@router.get("/{campaign_id}", response_model=CampaignBundleResponse)
def get_campaign(campaign_id: str, db: Session = Depends(get_db)) -> CampaignBundleResponse:
    return campaigns.get_campaign_bundle_response(db, campaign_id)


@router.post("/{campaign_id}/actions/player")
def create_player_action(
    campaign_id: str,
    payload: PlayerActionRequest,
    db: Session = Depends(get_db),
) -> dict:
    event = campaigns.record_player_action(db, campaign_id, payload)
    broker.publish(campaign_id, "player_action", {"id": event.id, "body": event.body})
    return {"event_id": event.id, "sequence_no": event.sequence_no}


@router.post("/{campaign_id}/actions/director")
def create_director_action(
    campaign_id: str,
    payload: DirectorCommandRequest,
    db: Session = Depends(get_db),
) -> dict:
    note = campaigns.record_director_note(db, campaign_id, payload)
    broker.publish(campaign_id, "director_note", {"id": note.id, "title": note.title})
    return {"note_id": note.id}


@router.post("/{campaign_id}/director/gm-brief")
def create_gm_brief(
    campaign_id: str,
    payload: GMBriefRequest,
    db: Session = Depends(get_db),
) -> dict:
    brief = campaigns.record_gm_brief(db, campaign_id, payload)
    return {"brief_id": brief.id}


@router.post("/{campaign_id}/director/inject-event")
def inject_event(
    campaign_id: str,
    payload: InjectEventRequest,
    db: Session = Depends(get_db),
) -> dict:
    note = campaigns.record_injected_event(db, campaign_id, payload)
    broker.publish(campaign_id, "inject_event", {"id": note.id, "title": note.title})
    return {"note_id": note.id}


@router.post("/{campaign_id}/run/step", response_model=StepResponse)
def run_step(
    campaign_id: str,
    payload: StepRequest,
    db: Session = Depends(get_db),
) -> dict:
    result = orchestrator.run_step(db, campaign_id, payload)
    broker.publish(campaign_id, "step_complete", result)
    return result


@router.get("/{campaign_id}/views/gm", response_model=CampaignViewResponse)
def get_gm_view(campaign_id: str, db: Session = Depends(get_db)) -> CampaignViewResponse:
    bundle = campaigns.get_campaign_components(db, campaign_id)
    return CampaignViewResponse(campaign_id=campaign_id, audience="gm", layers=assemble_gm_view(bundle))


@router.get("/{campaign_id}/views/director", response_model=CampaignViewResponse)
def get_director_view(campaign_id: str, db: Session = Depends(get_db)) -> CampaignViewResponse:
    bundle = campaigns.get_campaign_components(db, campaign_id)
    return CampaignViewResponse(campaign_id=campaign_id, audience="director", layers=assemble_director_view(bundle))


@router.get("/{campaign_id}/views/agent/{actor_id}", response_model=CampaignViewResponse)
def get_actor_view(campaign_id: str, actor_id: str, db: Session = Depends(get_db)) -> CampaignViewResponse:
    bundle = campaigns.get_campaign_components(db, campaign_id)
    actor = next(actor for actor in bundle["actors"] if actor.id == actor_id)
    return CampaignViewResponse(
        campaign_id=campaign_id,
        audience="agent",
        actor_id=actor_id,
        layers=assemble_actor_view(bundle, actor=actor, retrieval_limit=4),
    )


@router.patch("/{campaign_id}/actors/{actor_id}", response_model=ActorProfileRead)
def update_actor(
    campaign_id: str,
    actor_id: str,
    payload: ActorUpdate,
    db: Session = Depends(get_db),
) -> ActorProfileRead:
    actor = campaigns.update_actor(db, campaign_id, actor_id, payload)
    broker.publish(campaign_id, "actor_updated", {"actor_id": actor.id, "model_name": actor.model_name})
    return ActorProfileRead.model_validate(actor)


@router.get("/{campaign_id}/timeline")
def get_timeline(campaign_id: str, db: Session = Depends(get_db)) -> dict:
    bundle = campaigns.get_campaign_components(db, campaign_id)
    return {
        "timeline": [StoryEventRead.model_validate(item).model_dump(mode="json") for item in bundle["timeline"]],
        "director_notes": [DirectorNoteRead.model_validate(item).model_dump(mode="json") for item in bundle["director_notes"]],
        "gm_briefs": [GMBriefRead.model_validate(item).model_dump(mode="json") for item in bundle["gm_briefs"]],
        "resolutions": [TurnResolutionRead.model_validate(item).model_dump(mode="json") for item in bundle["resolutions"]],
    }


@router.post("/{campaign_id}/import", response_model=CampaignBundleResponse)
def import_into_workspace(
    campaign_id: str,
    payload: ImportRequest,
    db: Session = Depends(get_db),
) -> CampaignBundleResponse:
    imported = import_campaign(db, payload.payload, payload.preserve_ids)
    return campaigns.get_campaign_bundle_response(db, imported.id)


@router.get("/{campaign_id}/export", response_model=ExportResponse)
def export_from_workspace(
    campaign_id: str,
    format_name: str = Query(default="json", alias="format"),
    db: Session = Depends(get_db),
) -> ExportResponse:
    content, payload = export_campaign(db, campaign_id, format_name)
    return ExportResponse(format=format_name, content=content, payload=payload)


@router.get("/{campaign_id}/staging/status")
def get_staging_status(campaign_id: str, db: Session = Depends(get_db)) -> dict:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        return {"error": "campaign not found", "campaign_id": campaign_id}
    return campaign_staging.status(campaign)


@router.post("/{campaign_id}/staging/bootstrap")
def staging_bootstrap(
    campaign_id: str,
    novel_id: str | None = Query(default=None),
    overwrite: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> dict:
    """手動 bootstrap staging。novel_id 不傳則用 campaign.metadata.novel_id。"""
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        return {"error": "campaign not found", "campaign_id": campaign_id}
    if novel_id:
        meta = dict(campaign.metadata_json or {})
        meta["novel_id"] = novel_id
        campaign.metadata_json = meta
        db.commit()
    paths = campaign_staging.bootstrap(campaign, overwrite=overwrite)
    if paths is None:
        return {"status": "skipped", "reason": "campaign 未綁定 novel_id"}
    return {
        "status": "ok",
        "staging_id": paths.campaign_id,
        "working": str(paths.working),
        "source_snapshot": str(paths.source_snapshot),
    }


@router.post("/{campaign_id}/staging/sync")
def staging_sync(
    campaign_id: str,
    allow_nsfw: bool = Query(default=False),
    date_tag: str | None = Query(default=None),
    dry_run: bool = Query(default=False, description="只算 diff，不真寫"),
    leak_guard: bool = Query(default=True, description="PUBLIC 寫入前掃 secrets-lockbox"),
    write_changelog: bool = Query(default=True),
    db: Session = Depends(get_db),
) -> dict:
    """手動觸發一次完整同步（覆蓋所有 opera 狀態到 staging working/）。"""
    return campaign_staging.sync_run(
        db, campaign_id,
        allow_nsfw=allow_nsfw, date_tag=date_tag,
        dry_run=dry_run, leak_guard=leak_guard, write_changelog=write_changelog,
    )


@router.post("/{campaign_id}/staging/export")
def staging_export(
    campaign_id: str,
    timestamp: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    """campaign 結束 / 中斷時產 MANIFEST + diff bundle。"""
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        return {"error": "campaign not found", "campaign_id": campaign_id}
    bundle = campaign_staging.export(campaign, ts=timestamp)
    if bundle is None:
        return {"status": "skipped", "reason": "staging 未 bootstrap"}
    return {
        "status": "ok",
        "export_dir": str(bundle.export_dir),
        "manifest": str(bundle.manifest_path),
        "diff": str(bundle.diff_path),
        "readme": str(bundle.readme_path),
        "changes": [
            {"rel_path": c.rel_path, "action": c.action, "summary": c.summary}
            for c in bundle.changed_files
        ],
        "counts": {
            "new": sum(1 for c in bundle.changed_files if c.action == "new"),
            "modified": sum(1 for c in bundle.changed_files if c.action == "modified"),
            "deleted": sum(1 for c in bundle.changed_files if c.action == "deleted"),
        },
    }


@router.delete("/{campaign_id}/staging")
def staging_delete(campaign_id: str, db: Session = Depends(get_db)) -> dict:
    """徹底刪除 staging（不影響 opera DB 中的 campaign）。"""
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        return {"error": "campaign not found", "campaign_id": campaign_id}
    campaign_staging.teardown(campaign)
    return {"status": "ok", "deleted": campaign_staging.staging_id_for(campaign)}


# ── Cognitive 分類層（Phase G-I）─────────────────────────────────────────


@router.post("/{campaign_id}/cognitive/distribute")
def cognitive_distribute(
    campaign_id: str,
    event_id: str | None = Query(default=None, description="只跑單一事件；不傳則跑全部"),
    db: Session = Depends(get_db),
) -> dict:
    """跑 cognitive 分發：把事件 → 各 actor 的 AgentMemoryArtifact / EmbeddingChunk。

    冪等：同 (campaign, event, actor, artifact_type) 不會重複寫入。
    """
    if event_id:
        return cognitive_sync.distribute_event(db, campaign_id, event_id)
    return cognitive_sync.distribute_all_events(db, campaign_id)


@router.get("/{campaign_id}/cognitive/trace")
def cognitive_trace(
    campaign_id: str,
    event_id: str = Query(..., description="opera StoryEvent id"),
    db: Session = Depends(get_db),
) -> dict:
    """看某事件的認知分發決策：每 actor 的 perception_level、redacted_text、reason。"""
    return cognitive_sync.get_cognitive_trace(db, campaign_id, event_id)


@router.get("/{campaign_id}/stream")
async def stream_campaign(campaign_id: str) -> StreamingResponse:
    queue = broker.subscribe(campaign_id)

    async def event_generator():
        try:
            yield ": connected\n\n"
            while True:
                message = await queue.get()
                yield f"data: {json.dumps(message, ensure_ascii=False)}\n\n"
        except asyncio.CancelledError:
            return
        finally:
            broker.unsubscribe(campaign_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
