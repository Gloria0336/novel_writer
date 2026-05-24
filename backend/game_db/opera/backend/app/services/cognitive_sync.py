"""cognitive 分類整合 — 把每筆 opera StoryEvent → 各 actor 的主觀記憶。

職責：
- 跑 cognitive_router.distribute 算出 MemoryDistribution
- 寫 AgentMemoryArtifact + EmbeddingChunk 列（依 actor）
- 寫 MemoryDistributionLog（debug 追蹤）
- **完全不碰 novel_db**；artifact 只在 opera SQLite

冪等：用 (campaign_id, source_event_id, actor_id, artifact_type) 去重。
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.engine.memory import embed_text, estimate_tokens
from backend.app.models import (
    AgentMemoryArtifact,
    Campaign,
    EmbeddingChunk,
    MemoryDistributionLog,
    StoryEvent,
)

# 把 backend/ 加 sys.path（讓 classifier 套件可 import）
_BACKEND_ROOT = Path(__file__).resolve().parents[5]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from classifier.cognitive.router import distribute  # noqa: E402
from classifier.cognitive.types import (  # noqa: E402
    ActorContext,
    EventContext,
    MemoryDistribution,
)
from classifier.core import ClassifierInput  # noqa: E402
from classifier.router import route as classifier_route  # noqa: E402


# ── 內部 helpers ───────────────────────────────────────────────────────────


def _artifact_already_exists(
    session: Session,
    *,
    campaign_id: str,
    actor_id: str | None,
    artifact_type: str,
    source_event_id: str,
) -> bool:
    """依 (campaign_id, actor_id, artifact_type, source_event_id) 去重。"""
    rows = session.scalars(
        select(AgentMemoryArtifact).where(
            AgentMemoryArtifact.campaign_id == campaign_id,
            AgentMemoryArtifact.artifact_type == artifact_type,
        )
    )
    for row in rows:
        if row.actor_id != actor_id:
            continue
        sources = row.source_event_ids_json or []
        if source_event_id in sources:
            return True
    return False


def _build_classifier_input_for_event(event: StoryEvent, novel_id: str) -> ClassifierInput:
    """把 StoryEvent 轉成 ClassifierInput，僅用於跑 spatial router 取得 body 與 destination。"""
    from classifier import opera_adapter

    inp = opera_adapter.story_event_to_input(event, novel_id)
    if inp is None:
        # 未知 event_kind：fallback 純文字
        inp = ClassifierInput(
            source="opera_row",
            raw_text=f"---\nopera_id: {event.id}\n---\n{event.body}",
            novel_id=novel_id,
            hints={"opera_id": event.id, "destination_hint": "temps_draft"},
        )
    return inp


def _persist_distribution(
    session: Session,
    *,
    campaign_id: str,
    event: StoryEvent,
    dist: MemoryDistribution,
) -> dict[str, int]:
    """把 dist.memory_artifacts / embedding_targets 寫入 opera。

    回傳 counts：{"artifacts_written": N, "skipped_dup": M}
    """
    counts = {"artifacts_written": 0, "skipped_dup": 0, "embeddings_written": 0}

    # 寫 MemoryDistributionLog（每事件一列；用 sha 去重）
    dist_json = dist.to_jsonable()
    sha = hashlib.sha256(
        json.dumps(dist_json, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()
    existing_log = session.scalar(
        select(MemoryDistributionLog).where(
            MemoryDistributionLog.campaign_id == campaign_id,
            MemoryDistributionLog.event_id == event.id,
        )
    )
    if existing_log is None:
        session.add(MemoryDistributionLog(
            campaign_id=campaign_id,
            event_id=event.id,
            distribution_json=dist_json,
            sha=sha,
        ))
    elif existing_log.sha != sha:
        existing_log.distribution_json = dist_json
        existing_log.sha = sha

    # 寫 artifact + embedding
    for spec in dist.memory_artifacts:
        if _artifact_already_exists(
            session,
            campaign_id=campaign_id,
            actor_id=spec.actor_id,
            artifact_type=spec.artifact_type,
            source_event_id=event.id,
        ):
            counts["skipped_dup"] += 1
            continue
        if not spec.summary.strip():
            continue
        artifact = AgentMemoryArtifact(
            campaign_id=campaign_id,
            actor_id=spec.actor_id,
            scope=spec.scope,
            artifact_type=spec.artifact_type,
            summary=spec.summary,
            facts_json=spec.facts,
            recent_excerpt=spec.recent_excerpt,
            source_event_ids_json=spec.source_event_ids,
            token_count=estimate_tokens(spec.summary),
        )
        session.add(artifact)
        session.flush()  # 拿到 artifact.id
        counts["artifacts_written"] += 1

        # 對應 embedding（找 dist.embedding_targets 中同 actor + scope）
        for emb in dist.embedding_targets:
            if emb.actor_id == spec.actor_id and emb.scope == spec.scope and emb.text == spec.summary[:280]:
                session.add(EmbeddingChunk(
                    campaign_id=campaign_id,
                    actor_id=emb.actor_id,
                    artifact_id=artifact.id,
                    scope=emb.scope,
                    text=emb.text,
                    vector_json=embed_text(emb.text),
                    metadata_json={
                        "perception_level": dist.actor_views.get(spec.actor_id or "", None) and
                                            dist.actor_views[spec.actor_id].perception_level.value,
                        "source_event_id": event.id,
                    } if spec.actor_id and spec.actor_id in dist.actor_views else {"source_event_id": event.id},
                ))
                counts["embeddings_written"] += 1
                break

    return counts


# ── 公開 API ───────────────────────────────────────────────────────────────


def distribute_event(
    session: Session,
    campaign_id: str,
    event_id: str,
) -> dict[str, Any]:
    """對單一 StoryEvent 跑 cognitive 分發。

    Returns: stats dict，含 distribution（jsonable）+ artifact counts。
    """
    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise ValueError(f"campaign {campaign_id} 不存在")
    event = session.get(StoryEvent, event_id)
    if not event or event.campaign_id != campaign_id:
        raise ValueError(f"event {event_id} 不屬於 campaign {campaign_id}")

    novel_id = (campaign.metadata_json or {}).get("novel_id", "unknown")

    # 跑 spatial router 取得 ClassifierOutput（destination + body）
    spatial_input = _build_classifier_input_for_event(event, novel_id)
    spatial = classifier_route(spatial_input, use_llm=False)

    # 收集 actors
    from backend.app.services.campaigns import get_campaign_components
    bundle = get_campaign_components(session, campaign_id)
    actors = [ActorContext.from_orm(a) for a in bundle["actors"]]

    # 組 EventContext
    payload = event.payload_json or {}
    event_ctx = EventContext(
        source_event_id=event.id,
        actor_id=event.actor_id,
        witness_ids=list(payload.get("witness_ids") or []),
        location=payload.get("location"),
        tags=list(payload.get("tags") or []),
    )

    # 跑 cognitive router
    dist = distribute(spatial, actors, event_ctx, raw_body=event.body)

    # 寫 artifact / embedding / log
    counts = _persist_distribution(session, campaign_id=campaign_id, event=event, dist=dist)
    session.commit()

    return {
        "status": "ok",
        "event_id": event.id,
        "distribution": dist.to_jsonable(),
        **counts,
    }


def distribute_all_events(session: Session, campaign_id: str) -> dict[str, Any]:
    """對 campaign 的所有 StoryEvent 跑 cognitive 分發；冪等。"""
    events = list(session.scalars(
        select(StoryEvent)
        .where(StoryEvent.campaign_id == campaign_id)
        .order_by(StoryEvent.sequence_no.asc())
    ))
    total_artifacts = 0
    total_skipped = 0
    total_embeddings = 0
    for event in events:
        try:
            stats = distribute_event(session, campaign_id, event.id)
            total_artifacts += stats.get("artifacts_written", 0)
            total_skipped += stats.get("skipped_dup", 0)
            total_embeddings += stats.get("embeddings_written", 0)
        except Exception:  # pragma: no cover  # 防禦
            continue
    return {
        "status": "ok",
        "events_processed": len(events),
        "artifacts_written": total_artifacts,
        "embeddings_written": total_embeddings,
        "skipped_duplicates": total_skipped,
    }


def get_cognitive_trace(
    session: Session, campaign_id: str, event_id: str
) -> dict[str, Any]:
    """讀 MemoryDistributionLog 回 distribution；debug API 用。"""
    log = session.scalar(
        select(MemoryDistributionLog).where(
            MemoryDistributionLog.campaign_id == campaign_id,
            MemoryDistributionLog.event_id == event_id,
        )
    )
    if log is None:
        return {"status": "not_found", "event_id": event_id}
    return {
        "status": "ok",
        "event_id": event_id,
        "distribution": log.distribution_json,
        "sha": log.sha,
        "created_at": log.created_at.isoformat(),
        "updated_at": log.updated_at.isoformat(),
    }
