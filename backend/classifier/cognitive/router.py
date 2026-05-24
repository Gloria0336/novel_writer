"""Cognitive 分類器 — 依 spatial output + actor 清單 + event context，產出 MemoryDistribution。

Phase G：純啟發式判斷 perception_level + redact，無 LLM。
Phase H 會在 SECONDHAND / RUMOR 等級加 LLM perception_redact 強化。

護欄（**永不靜默違反**）：
- destination sensitivity == NSFW → 未在 knowledge_scopes 含 "nsfw" 的 actor 一律 UNAWARE
- destination sensitivity == DIRECTOR_ONLY → 只有 role=="gm" 或 visibility_policy.world=="all" 的 actor 看得到
- 事件 visibility_scope == "director" → 同上
"""

from __future__ import annotations

from classifier.cognitive.redact import (
    confidence_for,
    decay_hint_for,
    redact_for_perception,
)
from classifier.cognitive.types import (
    ActorContext,
    ActorPerception,
    EmbeddingChunkSpec,
    EventContext,
    MemoryArtifactSpec,
    MemoryDistribution,
    PerceptionLevel,
)
from classifier.core import ClassifierOutput, Sensitivity
from classifier.taxonomy import get_spec


def _determine_perception(
    actor: ActorContext,
    spatial: ClassifierOutput,
    event_ctx: EventContext,
) -> tuple[PerceptionLevel, str]:
    """回 (perception_level, reason 字串)。reason 進 decision_trace 供 debug。"""
    spec = get_spec(spatial.destination)
    visibility_scope = spatial.frontmatter.get("visibility_scope", "public")

    # ── 護欄層（最高優先）──────────────────────────────────────────────

    # GM 永遠看得到（GM 不是 actor，但若 role == gm 走 director-like view）
    if actor.role == "gm":
        return (PerceptionLevel.DIRECT_WITNESS, "actor role=gm → 永遠 direct")

    # NSFW destination：未授權一律 unaware
    if spec.sensitivity == Sensitivity.NSFW:
        if "nsfw" not in actor.knowledge_scopes and "all" not in actor.knowledge_scopes:
            return (PerceptionLevel.UNAWARE, "NSFW destination，actor 無 nsfw scope")

    # DIRECTOR_ONLY destination 或 visibility=director：除非明示授權，一律 unaware
    if spec.sensitivity == Sensitivity.DIRECTOR_ONLY or visibility_scope == "director":
        if "all" not in actor.knowledge_scopes:
            return (PerceptionLevel.UNAWARE, "DIRECTOR_ONLY destination，actor 無 all scope")

    # ── 一般感知判斷 ─────────────────────────────────────────────────

    # 事件主角 == 自己 → DIRECT
    if event_ctx.actor_id == actor.actor_id:
        return (PerceptionLevel.DIRECT_WITNESS, "actor 為事件主角")

    # 在 witness_ids 內 → DIRECT
    if actor.actor_id in (event_ctx.witness_ids or []):
        return (PerceptionLevel.DIRECT_WITNESS, "actor 在 witness_ids")

    # 解析 visibility_policy.story（早期短路：all / none）
    story_policy = actor.visibility_policy.get("story", "experienced")
    if story_policy == "all":
        return (PerceptionLevel.DIRECT_WITNESS, "visibility_policy.story=all")
    if story_policy == "none":
        return (PerceptionLevel.UNAWARE, "visibility_policy.story=none")

    # 知識範圍交集：actor 的 knowledge_scopes ∩ destination tags → 領域相關，升 SECONDHAND
    dest_tags = set(spatial.frontmatter.get("tags") or [])
    actor_scopes = set(actor.knowledge_scopes)
    if "all" in actor_scopes:
        return (PerceptionLevel.SECONDHAND, "knowledge_scopes=all → 被告知")
    if dest_tags & actor_scopes:
        return (PerceptionLevel.SECONDHAND, f"知識範圍交集 {sorted(dest_tags & actor_scopes)}")

    # experienced + 無 witness + 無 scope 交集 → RUMOR（耳語流通）
    if story_policy == "experienced":
        return (PerceptionLevel.RUMOR, "visibility_policy.story=experienced 且未 witness、scope 無交集")

    # 預設 fallback
    return (PerceptionLevel.RUMOR, "預設 rumor")


def _build_memory_artifact(
    actor: ActorContext,
    perception: ActorPerception,
    spatial: ClassifierOutput,
    event_ctx: EventContext,
) -> MemoryArtifactSpec:
    artifact_type = {
        PerceptionLevel.DIRECT_WITNESS: "episode",
        PerceptionLevel.SECONDHAND: "belief",
        PerceptionLevel.RUMOR: "rumor",
    }.get(perception.perception_level, "episode")

    return MemoryArtifactSpec(
        actor_id=actor.actor_id,
        scope="private",
        artifact_type=artifact_type,
        summary=perception.redacted_text[:280],
        facts=[],
        recent_excerpt=perception.redacted_text[:140],
        source_event_ids=[event_ctx.source_event_id],
    )


def distribute(
    spatial: ClassifierOutput,
    actors: list[ActorContext],
    event_ctx: EventContext,
    *,
    raw_body: str | None = None,
) -> MemoryDistribution:
    """依 spatial output + actors → 產生 MemoryDistribution。

    Args:
        spatial: spatial router 的輸出
        actors: campaign 中所有 actor（含 player / npc / gm）
        event_ctx: 事件來源 + witness + location
        raw_body: 完整原文（用來 redact）；若 None 則用 spatial.body_md
    """
    text = raw_body if raw_body is not None else spatial.body_md

    dist = MemoryDistribution(
        director_view=text,  # Director 永遠看全文
        gm_view=None,
    )

    has_gm = False
    for actor in actors:
        level, reason = _determine_perception(actor, spatial, event_ctx)
        dist.decision_trace[actor.actor_id] = f"{level.value}: {reason}"

        if actor.role == "gm":
            has_gm = True
            # GM 也有自己的 perception 紀錄，方便 debug
        if level == PerceptionLevel.UNAWARE:
            continue

        redacted = redact_for_perception(text, level, actor_name=actor.name)
        perception = ActorPerception(
            actor_id=actor.actor_id,
            perception_level=level,
            redacted_text=redacted,
            confidence=confidence_for(level),
            decay_hint=decay_hint_for(level),
            reason=reason,
        )
        dist.actor_views[actor.actor_id] = perception

        # 寫 artifact / embedding（gm 也算，但 scope=public 不重複）
        artifact = _build_memory_artifact(actor, perception, spatial, event_ctx)
        if actor.role == "gm":
            artifact.scope = "public"
            artifact.actor_id = None  # 公共記憶
        dist.memory_artifacts.append(artifact)
        dist.embedding_targets.append(EmbeddingChunkSpec(
            actor_id=artifact.actor_id,
            scope=artifact.scope,
            text=redacted,
        ))

    if has_gm:
        dist.gm_view = text

    return dist
