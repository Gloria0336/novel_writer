from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


def new_id() -> str:
    return str(uuid4())


class TimestampedModel:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


class Campaign(TimestampedModel, Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="draft", nullable=False)
    player_actor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    active_run_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class CampaignRun(TimestampedModel, Base):
    __tablename__ = "campaign_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(String(40), default="paused", nullable=False)
    current_node: Mapped[str] = mapped_column(String(80), default="idle", nullable=False)
    interrupt_payload_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    sequence_cursor: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Rulebook(TimestampedModel, Base):
    __tablename__ = "rulebooks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    version: Mapped[str] = mapped_column(String(40), default="0.1.0", nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class WorldEntry(TimestampedModel, Base):
    __tablename__ = "world_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    visibility_scope: Mapped[str] = mapped_column(String(40), default="world", nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    tags_json: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class StoryStateSnapshot(TimestampedModel, Base):
    __tablename__ = "story_state_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    current_scene: Mapped[str] = mapped_column(Text, nullable=False)
    active_objectives_json: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    npc_statuses_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    raw_state_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class StoryEvent(TimestampedModel, Base):
    __tablename__ = "story_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    run_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    sequence_no: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    event_kind: Mapped[str] = mapped_column(String(80), nullable=False)
    source_channel: Mapped[str] = mapped_column(String(40), nullable=False)
    actor_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    visibility_scope: Mapped[str] = mapped_column(String(40), default="public", nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class ActorProfile(TimestampedModel, Base):
    __tablename__ = "actor_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(40), nullable=False)
    persona: Mapped[str] = mapped_column(Text, nullable=False)
    motives_json: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    visibility_policy_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    knowledge_scopes_json: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    secret_motives: Mapped[str] = mapped_column(Text, default="", nullable=False)
    model_provider: Mapped[str] = mapped_column(String(40), default="openrouter", nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    temperature: Mapped[float] = mapped_column(Float, default=0.8, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    nsfw_ref_id: Mapped[str | None] = mapped_column(String(80), nullable=True)


class AgentMemoryArtifact(TimestampedModel, Base):
    __tablename__ = "agent_memory_artifacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    actor_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    scope: Mapped[str] = mapped_column(String(40), nullable=False)
    artifact_type: Mapped[str] = mapped_column(String(40), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    facts_json: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    recent_excerpt: Mapped[str] = mapped_column(Text, default="", nullable=False)
    source_event_ids_json: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class EmbeddingChunk(TimestampedModel, Base):
    __tablename__ = "embedding_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    actor_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    artifact_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    scope: Mapped[str] = mapped_column(String(40), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    vector_json: Mapped[list[float]] = mapped_column(JSON, default=list, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class DirectorNote(TimestampedModel, Base):
    __tablename__ = "director_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    note_type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_consumed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class GMBrief(TimestampedModel, Base):
    __tablename__ = "gm_briefs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    reveal_in_context: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class NovelDbBinding(TimestampedModel, Base):
    """opera UUID ↔ novel_db canonical slug 的雙向綁定。

    保證 round-trip 冪等：每個 opera 行只鑄一次 slug，之後永遠查表。
    kind: actor / world_entry / director_note / story_event / gm_brief。
    """

    __tablename__ = "novel_db_bindings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    opera_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    novel_id: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    kind: Mapped[str] = mapped_column(String(40), nullable=False)


class MemoryDistributionLog(TimestampedModel, Base):
    """每次內容分發到記憶層的決策紀錄（cognitive 分類層使用）。

    Phase C 先建表；Phase F-H 才會大量寫入。debug API
    GET /campaigns/{id}/cognitive-trace 從這裡查。
    """

    __tablename__ = "memory_distribution_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    event_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    distribution_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    sha: Mapped[str] = mapped_column(String(64), index=True, nullable=False)


class TurnResolution(TimestampedModel, Base):
    __tablename__ = "turn_resolutions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campaign_id: Mapped[str] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    run_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    action_event_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    seed: Mapped[str] = mapped_column(String(120), nullable=False)
    rule_version: Mapped[str] = mapped_column(String(40), nullable=False)
    outcome: Mapped[str] = mapped_column(String(40), nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    target: Mapped[int] = mapped_column(Integer, nullable=False)
    breakdown_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    override_source: Mapped[str | None] = mapped_column(String(80), nullable=True)
    narration: Mapped[str] = mapped_column(Text, nullable=False)

