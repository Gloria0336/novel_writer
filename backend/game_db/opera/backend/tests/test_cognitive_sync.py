"""cognitive_sync 整合測試 — 把 StoryEvent → AgentMemoryArtifact / MemoryDistributionLog。"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# classifier 套件 import 路徑
_BACKEND_ROOT = Path(__file__).resolve().parents[4]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from backend.app.db import Base
from backend.app.models import (
    ActorProfile,
    AgentMemoryArtifact,
    Campaign,
    EmbeddingChunk,
    MemoryDistributionLog,
    Rulebook,
    StoryEvent,
)


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    s = SessionLocal()
    try:
        yield s
    finally:
        s.close()


@pytest.fixture
def basic_campaign(db_session):
    campaign = Campaign(
        name="cog", description="", status="active",
        metadata_json={"novel_id": "novel_test"},
    )
    db_session.add(campaign)
    db_session.flush()
    db_session.add(Rulebook(
        campaign_id=campaign.id, name="r", version="0", payload_json={},
    ))
    # 三個 actor：player + npc + gm
    player = ActorProfile(
        campaign_id=campaign.id, name="夢玲", role="player",
        persona="主角", motives_json=[], model_name="x",
        visibility_policy_json={"story": "experienced"},
        knowledge_scopes_json=["combat"],
        metadata_json={"char_id": "char_player"},
    )
    npc = ActorProfile(
        campaign_id=campaign.id, name="卡洛", role="npc",
        persona="同伴", motives_json=[], model_name="x",
        visibility_policy_json={"story": "experienced"},
        knowledge_scopes_json=[],
        metadata_json={"char_id": "char_npc"},
    )
    gm = ActorProfile(
        campaign_id=campaign.id, name="GM", role="gm",
        persona="敘事者", motives_json=[], model_name="x",
        metadata_json={},
    )
    db_session.add_all([player, npc, gm])
    db_session.commit()
    db_session.refresh(campaign)
    return {"campaign": campaign, "player": player, "npc": npc, "gm": gm}


def _add_event(db_session, campaign_id, **kwargs) -> StoryEvent:
    defaults = dict(
        campaign_id=campaign_id, run_id=None, sequence_no=1,
        event_kind="scene", source_channel="gm",
        title="酒館場景", body="夢玲走進酒館，遇到陌生人。",
        visibility_scope="public", payload_json={},
    )
    defaults.update(kwargs)
    e = StoryEvent(**defaults)
    db_session.add(e)
    db_session.commit()
    db_session.refresh(e)
    return e


# ── distribute_event ──────────────────────────────────────────────────────


def test_distribute_writes_artifacts_per_actor(db_session, basic_campaign) -> None:
    from backend.app.services import cognitive_sync

    cid = basic_campaign["campaign"].id
    event = _add_event(db_session, cid, actor_id=basic_campaign["player"].id)
    stats = cognitive_sync.distribute_event(db_session, cid, event.id)
    assert stats["status"] == "ok"
    assert stats["artifacts_written"] >= 1
    # 至少 player（actor 本人 → direct）+ gm（永遠 direct）
    artifacts = list(db_session.scalars(
        select(AgentMemoryArtifact).where(AgentMemoryArtifact.campaign_id == cid)
    ))
    actor_ids = {a.actor_id for a in artifacts}
    assert basic_campaign["player"].id in actor_ids


def test_distribute_creates_log(db_session, basic_campaign) -> None:
    from backend.app.services import cognitive_sync

    cid = basic_campaign["campaign"].id
    event = _add_event(db_session, cid)
    cognitive_sync.distribute_event(db_session, cid, event.id)
    log = db_session.scalar(
        select(MemoryDistributionLog).where(MemoryDistributionLog.event_id == event.id)
    )
    assert log is not None
    assert "actor_views" in log.distribution_json


def test_distribute_is_idempotent(db_session, basic_campaign) -> None:
    from backend.app.services import cognitive_sync

    cid = basic_campaign["campaign"].id
    event = _add_event(db_session, cid)
    stats1 = cognitive_sync.distribute_event(db_session, cid, event.id)
    stats2 = cognitive_sync.distribute_event(db_session, cid, event.id)
    assert stats2["artifacts_written"] == 0  # 全部被 dedup
    assert stats2["skipped_dup"] >= stats1["artifacts_written"]


def test_distribute_writes_embeddings(db_session, basic_campaign) -> None:
    from backend.app.services import cognitive_sync

    cid = basic_campaign["campaign"].id
    event = _add_event(db_session, cid)
    cognitive_sync.distribute_event(db_session, cid, event.id)
    embs = list(db_session.scalars(
        select(EmbeddingChunk).where(EmbeddingChunk.campaign_id == cid)
    ))
    assert embs
    # metadata 含 source_event_id
    for e in embs:
        assert e.metadata_json.get("source_event_id") == event.id


# ── 護欄完整測試 ──────────────────────────────────────────────────────────


def test_director_only_event_blocks_normal_actors(db_session, basic_campaign) -> None:
    """visibility_scope=director 的事件，非 GM 不該得到 artifact。"""
    from backend.app.services import cognitive_sync

    cid = basic_campaign["campaign"].id
    event = _add_event(db_session, cid, visibility_scope="director", event_kind="reveal", payload_json={})
    cognitive_sync.distribute_event(db_session, cid, event.id)
    # 只有 GM artifact（scope=public, actor_id=None）；player/npc 都應該 UNAWARE
    artifacts = list(db_session.scalars(
        select(AgentMemoryArtifact).where(
            AgentMemoryArtifact.campaign_id == cid,
            AgentMemoryArtifact.actor_id == basic_campaign["player"].id,
        )
    ))
    assert artifacts == []
    artifacts_npc = list(db_session.scalars(
        select(AgentMemoryArtifact).where(
            AgentMemoryArtifact.campaign_id == cid,
            AgentMemoryArtifact.actor_id == basic_campaign["npc"].id,
        )
    ))
    assert artifacts_npc == []


def test_get_cognitive_trace_returns_distribution(db_session, basic_campaign) -> None:
    from backend.app.services import cognitive_sync

    cid = basic_campaign["campaign"].id
    event = _add_event(db_session, cid)
    cognitive_sync.distribute_event(db_session, cid, event.id)
    trace = cognitive_sync.get_cognitive_trace(db_session, cid, event.id)
    assert trace["status"] == "ok"
    assert "actor_views" in trace["distribution"]
    assert "decision_trace" in trace["distribution"]


def test_get_cognitive_trace_missing_returns_not_found(db_session, basic_campaign) -> None:
    from backend.app.services import cognitive_sync

    trace = cognitive_sync.get_cognitive_trace(db_session, basic_campaign["campaign"].id, "fake")
    assert trace["status"] == "not_found"


# ── distribute_all_events ─────────────────────────────────────────────────


def test_distribute_all_events_processes_each(db_session, basic_campaign) -> None:
    from backend.app.services import cognitive_sync

    cid = basic_campaign["campaign"].id
    _add_event(db_session, cid, sequence_no=1, title="場景1")
    _add_event(db_session, cid, sequence_no=2, title="場景2", event_kind="combat")
    _add_event(db_session, cid, sequence_no=3, title="場景3")
    stats = cognitive_sync.distribute_all_events(db_session, cid)
    assert stats["events_processed"] == 3
    assert stats["artifacts_written"] >= 3
