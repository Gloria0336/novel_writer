"""Cognitive 分類層的核心型別。

回答的問題：「同一份內容該被誰知道、以什麼形式知道？」
（與 spatial 分類器的「該存在哪裡？」正交。）
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class PerceptionLevel(StrEnum):
    """actor 對某個內容的感知層級。"""

    DIRECT_WITNESS = "direct_witness"  # 親眼看到 / 親身經歷 → 完整文本
    SECONDHAND = "secondhand"  # 在場但有遮蔽，或被告知 → 精簡 + 主觀猜測
    RUMOR = "rumor"  # 不在場但聽說 → 嚴重變形、低信心
    UNAWARE = "unaware"  # 完全隔絕 → 不寫任何 memory artifact


@dataclass(frozen=True)
class ActorPerception:
    """單一 actor 對單一內容的感知產出。"""

    actor_id: str
    perception_level: PerceptionLevel
    redacted_text: str  # 該 actor 實際「記得」的版本
    confidence: float = 1.0  # 0.0-1.0，影響日後回憶可靠性
    decay_hint: str = "stable"  # stable / fading / volatile
    reason: str = ""  # 為何給此 perception_level（debug 用）


@dataclass
class MemoryArtifactSpec:
    """對應 opera.AgentMemoryArtifact 的中介結構。"""

    actor_id: str | None  # None = 公共記憶（可走 GM）
    scope: str  # "public" | "private" | "director"
    artifact_type: str  # "episode" | "belief" | "rumor" | "compressed_summary" 等
    summary: str
    facts: list[str] = field(default_factory=list)
    recent_excerpt: str = ""
    source_event_ids: list[str] = field(default_factory=list)


@dataclass
class EmbeddingChunkSpec:
    """對應 opera.EmbeddingChunk 的中介結構。"""

    actor_id: str | None
    scope: str
    text: str
    artifact_ref_id: str | None = None  # caller 寫 AgentMemoryArtifact 後可填回


@dataclass
class MemoryDistribution:
    """一份內容如何擴散到 opera 記憶層與代理 AI。

    與 spatial 的 ClassifierOutput 並列；router 端會把兩者合併。
    """

    director_view: str = ""  # Director 永遠看完整版（多半 == raw_body）
    gm_view: str | None = None  # GM 可見的版本；None = GM 不該看
    actor_views: dict[str, ActorPerception] = field(default_factory=dict)
    memory_artifacts: list[MemoryArtifactSpec] = field(default_factory=list)
    embedding_targets: list[EmbeddingChunkSpec] = field(default_factory=list)
    # debug：每個決策的原因說明（actor_id → reason 字串）
    decision_trace: dict[str, str] = field(default_factory=dict)

    def to_jsonable(self) -> dict[str, Any]:
        """轉成 JSON-friendly dict（給 cognitive-trace API 用）。"""
        return {
            "director_view": self.director_view,
            "gm_view": self.gm_view,
            "actor_views": {
                aid: {
                    "perception_level": p.perception_level.value,
                    "redacted_text": p.redacted_text,
                    "confidence": p.confidence,
                    "decay_hint": p.decay_hint,
                    "reason": p.reason,
                }
                for aid, p in self.actor_views.items()
            },
            "memory_artifacts": [
                {
                    "actor_id": m.actor_id,
                    "scope": m.scope,
                    "artifact_type": m.artifact_type,
                    "summary": m.summary,
                    "facts": m.facts,
                    "recent_excerpt": m.recent_excerpt,
                    "source_event_ids": m.source_event_ids,
                }
                for m in self.memory_artifacts
            ],
            "embedding_targets": [
                {
                    "actor_id": e.actor_id,
                    "scope": e.scope,
                    "text": e.text,
                    "artifact_ref_id": e.artifact_ref_id,
                }
                for e in self.embedding_targets
            ],
            "decision_trace": self.decision_trace,
        }


# ── 給 cognitive_router 使用的 actor 介面（duck-typed） ─────────────────────


@dataclass
class ActorContext:
    """從 opera ActorProfile 提取出 cognitive_router 需要的最小資訊。

    duck-typed：caller 可從任何 ORM 物件構造。
    """

    actor_id: str
    name: str
    role: str  # "player" | "npc" | "gm"
    visibility_policy: dict[str, Any] = field(default_factory=dict)
    knowledge_scopes: list[str] = field(default_factory=list)
    secret_motives: str = ""

    @classmethod
    def from_orm(cls, actor: Any) -> "ActorContext":
        return cls(
            actor_id=actor.id,
            name=actor.name,
            role=actor.role,
            visibility_policy=dict(actor.visibility_policy_json or {}),
            knowledge_scopes=list(actor.knowledge_scopes_json or []),
            secret_motives=actor.secret_motives or "",
        )


@dataclass
class EventContext:
    """事件層級的補充資訊：誰在現場、來自哪個 opera 表、敏感度等。

    cognitive_router 用這判斷 perception_level。
    """

    source_event_id: str  # opera event/note/brief id
    actor_id: str | None = None  # 事件主角（若有）
    witness_ids: list[str] = field(default_factory=list)  # 在場見證
    location: str | None = None
    tags: list[str] = field(default_factory=list)
