from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class WorldEntryCreate(BaseModel):
    title: str
    category: str
    visibility_scope: str = "world"
    body: str
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ActorCreate(BaseModel):
    name: str
    role: Literal["player", "npc", "gm"] = "npc"
    persona: str
    motives: list[str] = Field(default_factory=list)
    visibility_policy: dict[str, Any] = Field(default_factory=dict)
    knowledge_scopes: list[str] = Field(default_factory=list)
    secret_motives: str = ""
    model_provider: str = "openrouter"
    model_name: str = "openrouter/auto"
    temperature: float = 0.8
    metadata: dict[str, Any] = Field(default_factory=dict)


class ActorUpdate(BaseModel):
    name: str | None = None
    role: Literal["player", "npc", "gm"] | None = None
    persona: str | None = None
    model_provider: str | None = None
    model_name: str | None = None
    temperature: float | None = None


class CreateCampaignRequest(BaseModel):
    name: str
    description: str = ""
    player_name: str = "The Protagonist"
    premise: str = "A new campaign begins on the edge of a political storm."
    world_entries: list[WorldEntryCreate] = Field(default_factory=list)
    actors: list[ActorCreate] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class CreateCampaignFromNovelRequest(BaseModel):
    novel_id: str
    name: str | None = None
    description: str = ""
    premise: str = ""
    player_char_id: str | None = None


class NovelCharacterSummary(BaseModel):
    char_id: str
    title: str


class NovelSummary(BaseModel):
    novel_id: str
    readme_summary: str
    characters: list[NovelCharacterSummary] = Field(default_factory=list)
    world_section_count: int = 0


class PlayerActionRequest(BaseModel):
    actor_id: str | None = None
    content: str
    intent: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)


class DirectorCommandRequest(BaseModel):
    content: str
    command_type: Literal["note", "retcon", "nudge", "override"] = "note"
    title: str = "Director Command"
    payload: dict[str, Any] = Field(default_factory=dict)


class GMBriefRequest(BaseModel):
    title: str
    body: str
    reveal_in_context: bool = True
    payload: dict[str, Any] = Field(default_factory=dict)


class InjectEventRequest(BaseModel):
    title: str
    body: str
    payload: dict[str, Any] = Field(default_factory=dict)


class StepRequest(BaseModel):
    run_id: str | None = None
    pause_before_node: str | None = None
    max_actor_turns: int = 3


class StoryEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    run_id: str | None
    sequence_no: int
    event_kind: str
    source_channel: str
    actor_id: str | None
    title: str
    body: str
    visibility_scope: str
    payload_json: dict[str, Any]
    created_at: datetime


class ActorProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    role: str
    persona: str
    motives_json: list[str]
    visibility_policy_json: dict[str, Any]
    knowledge_scopes_json: list[str]
    secret_motives: str
    model_provider: str
    model_name: str
    temperature: float
    metadata_json: dict[str, Any]


class WorldEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    category: str
    visibility_scope: str
    body: str
    tags_json: list[str]
    metadata_json: dict[str, Any]


class StoryStateSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    version: int
    current_scene: str
    active_objectives_json: list[str]
    npc_statuses_json: dict[str, Any]
    raw_state_json: dict[str, Any]
    created_at: datetime


class AgentMemoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_id: str | None
    scope: str
    artifact_type: str
    summary: str
    facts_json: list[str]
    recent_excerpt: str
    source_event_ids_json: list[str]
    token_count: int
    created_at: datetime


class DirectorNoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    note_type: str
    title: str
    body: str
    payload_json: dict[str, Any]
    is_consumed: bool
    created_at: datetime


class GMBriefRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    body: str
    payload_json: dict[str, Any]
    reveal_in_context: bool
    created_at: datetime


class TurnResolutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    run_id: str
    action_event_id: str | None
    seed: str
    rule_version: str
    outcome: str
    total: int
    target: int
    breakdown_json: dict[str, Any]
    override_source: str | None
    narration: str
    created_at: datetime


class CampaignRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    status: str
    player_actor_id: str | None
    active_run_id: str | None
    metadata_json: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class CampaignBundleResponse(BaseModel):
    campaign: CampaignRead
    rulebook: dict[str, Any]
    world_entries: list[WorldEntryRead]
    actors: list[ActorProfileRead]
    latest_snapshot: StoryStateSnapshotRead | None
    timeline: list[StoryEventRead]
    memories: list[AgentMemoryRead]
    director_notes: list[DirectorNoteRead]
    gm_briefs: list[GMBriefRead]
    resolutions: list[TurnResolutionRead]


class CampaignViewResponse(BaseModel):
    campaign_id: str
    audience: str
    actor_id: str | None = None
    layers: dict[str, Any]


class StepNodeResult(BaseModel):
    node: str
    status: Literal["completed", "interrupted", "skipped"]
    detail: str


class StepResponse(BaseModel):
    campaign_id: str
    run_id: str
    status: str
    current_node: str
    gm_output: dict[str, Any]
    actor_turns: list[dict[str, Any]]
    resolution: dict[str, Any] | None
    summary: dict[str, Any] | None
    node_log: list[StepNodeResult]
    interrupt_payload: dict[str, Any]


class ImportRequest(BaseModel):
    payload: dict[str, Any]
    preserve_ids: bool = True


class ExportResponse(BaseModel):
    format: Literal["json", "yaml", "markdown"]
    content: str
    payload: dict[str, Any]
