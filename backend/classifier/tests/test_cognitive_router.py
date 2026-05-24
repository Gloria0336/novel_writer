"""cognitive/router 測試 — 護欄、perception 判定、distribute 整合。"""

from __future__ import annotations

from pathlib import Path

from classifier.cognitive.router import distribute
from classifier.cognitive.types import (
    ActorContext,
    EventContext,
    PerceptionLevel,
)
from classifier.core import ClassifierOutput
from classifier.taxonomy import Destination


def _spatial(destination: Destination, body: str = "事件描述", **fm) -> ClassifierOutput:
    return ClassifierOutput(
        destination=destination.value,
        suggested_path=Path("x"),
        frontmatter=fm,
        body_md=body,
        confidence=0.9,
        reason="test",
    )


def _actor(actor_id: str, role: str = "npc", **kwargs) -> ActorContext:
    return ActorContext(
        actor_id=actor_id,
        name=kwargs.pop("name", f"actor-{actor_id}"),
        role=role,
        visibility_policy=kwargs.pop("visibility_policy", {}),
        knowledge_scopes=kwargs.pop("knowledge_scopes", []),
        secret_motives=kwargs.pop("secret_motives", ""),
    )


def _event(source_id: str = "evt_1", **kwargs) -> EventContext:
    return EventContext(source_event_id=source_id, **kwargs)


# ── 護欄層（NSFW / DIRECTOR_ONLY） ─────────────────────────────────────────


def test_nsfw_destination_unaware_for_actor_without_scope() -> None:
    spatial = _spatial(Destination.CONTEXT_NSFW_INTIMATE)
    a = _actor("a", knowledge_scopes=["combat"])
    dist = distribute(spatial, [a], _event(), raw_body="親密場景")
    assert a.actor_id not in dist.actor_views  # UNAWARE 不寫入 actor_views
    # decision_trace 應有 unaware 解釋
    assert "unaware" in dist.decision_trace[a.actor_id]
    assert "nsfw" in dist.decision_trace[a.actor_id].lower()


def test_nsfw_destination_visible_for_actor_with_nsfw_scope() -> None:
    spatial = _spatial(Destination.CONTEXT_NSFW_INTIMATE)
    a = _actor("a", knowledge_scopes=["nsfw"])
    dist = distribute(spatial, [a], _event(actor_id="a"), raw_body="親密場景")
    assert a.actor_id in dist.actor_views


def test_director_only_unaware_for_normal_actor() -> None:
    spatial = _spatial(Destination.CONTEXT_SECRETS)
    a = _actor("a", knowledge_scopes=["combat"])
    dist = distribute(spatial, [a], _event(), raw_body="秘密")
    assert a.actor_id not in dist.actor_views


def test_director_only_visible_for_actor_with_all_scope() -> None:
    spatial = _spatial(Destination.CONTEXT_SECRETS)
    a = _actor("a", knowledge_scopes=["all"])
    dist = distribute(spatial, [a], _event(), raw_body="秘密")
    assert a.actor_id in dist.actor_views


def test_visibility_scope_director_in_frontmatter_blocks_normal_actors() -> None:
    spatial = _spatial(
        Destination.BIBLE_WORLDBUILDING,
        visibility_scope="director",
        body="director-only world entry",
    )
    a = _actor("a", knowledge_scopes=["geography"])
    dist = distribute(spatial, [a], _event(), raw_body="director-only world entry")
    assert a.actor_id not in dist.actor_views


# ── perception level 判定 ────────────────────────────────────────────────


def test_event_actor_self_is_direct_witness() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    a = _actor("a")
    dist = distribute(spatial, [a], _event(actor_id="a"), raw_body="x")
    assert dist.actor_views["a"].perception_level == PerceptionLevel.DIRECT_WITNESS


def test_witness_id_makes_direct_witness() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    a = _actor("a")
    b = _actor("b")
    dist = distribute(spatial, [a, b], _event(actor_id="a", witness_ids=["b"]), raw_body="x")
    assert dist.actor_views["b"].perception_level == PerceptionLevel.DIRECT_WITNESS


def test_policy_story_all_grants_direct() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    a = _actor("a", visibility_policy={"story": "all"})
    dist = distribute(spatial, [a], _event(actor_id="other"), raw_body="x")
    assert dist.actor_views["a"].perception_level == PerceptionLevel.DIRECT_WITNESS


def test_policy_story_experienced_without_witness_is_rumor() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    a = _actor("a", visibility_policy={"story": "experienced"})
    dist = distribute(spatial, [a], _event(actor_id="other", witness_ids=[]), raw_body="x")
    assert dist.actor_views["a"].perception_level == PerceptionLevel.RUMOR


def test_policy_story_none_is_unaware() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    a = _actor("a", visibility_policy={"story": "none"})
    dist = distribute(spatial, [a], _event(actor_id="other"), raw_body="x")
    assert a.actor_id not in dist.actor_views


def test_tag_overlap_makes_secondhand() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY, tags=["combat", "city"])
    a = _actor("a", knowledge_scopes=["combat"])
    dist = distribute(spatial, [a], _event(actor_id="other"), raw_body="x")
    assert dist.actor_views["a"].perception_level == PerceptionLevel.SECONDHAND


# ── GM 特殊 ─────────────────────────────────────────────────────────────


def test_gm_actor_always_direct_witness() -> None:
    spatial = _spatial(Destination.CONTEXT_SECRETS)  # director-only
    gm = _actor("gm1", role="gm")
    dist = distribute(spatial, [gm], _event(), raw_body="任何")
    assert gm.actor_id in dist.actor_views
    assert dist.actor_views["gm1"].perception_level == PerceptionLevel.DIRECT_WITNESS


def test_gm_present_populates_gm_view() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    gm = _actor("gm1", role="gm")
    dist = distribute(spatial, [gm], _event(), raw_body="場景")
    assert dist.gm_view == "場景"


def test_no_gm_means_gm_view_none() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    a = _actor("a")
    dist = distribute(spatial, [a], _event(actor_id="a"), raw_body="x")
    assert dist.gm_view is None


# ── 整合：director_view 永遠完整 ─────────────────────────────────────────


def test_director_view_always_full_text() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    dist = distribute(spatial, [], _event(), raw_body="完整文本")
    assert dist.director_view == "完整文本"


# ── memory artifacts 與 embedding ───────────────────────────────────────


def test_memory_artifacts_one_per_actor_with_perception() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    a = _actor("a", visibility_policy={"story": "all"})
    b = _actor("b", visibility_policy={"story": "none"})  # UNAWARE → 不寫
    dist = distribute(spatial, [a, b], _event(actor_id="other"), raw_body="x")
    actor_ids_in_artifacts = {m.actor_id for m in dist.memory_artifacts}
    assert "a" in actor_ids_in_artifacts
    assert "b" not in actor_ids_in_artifacts


def test_gm_artifact_uses_public_scope_and_no_actor_id() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    gm = _actor("gm1", role="gm")
    dist = distribute(spatial, [gm], _event(), raw_body="x")
    gm_artifacts = [m for m in dist.memory_artifacts if m.scope == "public"]
    assert gm_artifacts
    assert gm_artifacts[0].actor_id is None


def test_embedding_targets_match_artifacts() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    a = _actor("a", visibility_policy={"story": "all"})
    dist = distribute(spatial, [a], _event(actor_id="other"), raw_body="場景描述")
    assert len(dist.embedding_targets) == len(dist.memory_artifacts)


# ── trace 與 jsonable ───────────────────────────────────────────────────


def test_decision_trace_has_entry_per_actor() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    actors = [_actor("a"), _actor("b"), _actor("c")]
    dist = distribute(spatial, actors, _event(), raw_body="x")
    assert {"a", "b", "c"} <= set(dist.decision_trace.keys())


def test_to_jsonable_round_trips() -> None:
    spatial = _spatial(Destination.UPDATES_DAILY)
    a = _actor("a", visibility_policy={"story": "all"})
    dist = distribute(spatial, [a], _event(actor_id="other"), raw_body="x")
    data = dist.to_jsonable()
    assert "actor_views" in data
    assert "a" in data["actor_views"]
    assert "perception_level" in data["actor_views"]["a"]
