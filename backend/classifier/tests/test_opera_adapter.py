"""opera_adapter 測試 — 用 SimpleNamespace 模擬 ORM 物件，驗證映射規則。"""

from __future__ import annotations

from types import SimpleNamespace

from classifier import opera_adapter as oa
from classifier.taxonomy import Destination


def _world_entry(**kwargs) -> SimpleNamespace:
    defaults = {
        "id": "we-001",
        "title": "絲絨海岸",
        "category": "geography",
        "visibility_scope": "world",
        "body": "霧氣浸透的港灣。",
        "tags_json": ["港口", "貿易"],
        "metadata_json": {},
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _actor(**kwargs) -> SimpleNamespace:
    defaults = {
        "id": "actor-abc123def",
        "name": "夢玲",
        "role": "npc",
        "persona": "認真、熱心。",
        "motives_json": ["守護同伴"],
        "visibility_policy_json": {},
        "knowledge_scopes_json": [],
        "secret_motives": "",
        "metadata_json": {},
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _director_note(**kwargs) -> SimpleNamespace:
    defaults = {
        "id": "note-001",
        "note_type": "foreshadow",
        "title": "深淵裂縫",
        "body": "第三層底端有未公開的裂縫。",
        "payload_json": {},
        "is_consumed": False,
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _gm_brief(**kwargs) -> SimpleNamespace:
    defaults = {
        "id": "brief-001",
        "title": "下一場景",
        "body": "市集起火。",
        "payload_json": {},
        "reveal_in_context": True,
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _story_event(**kwargs) -> SimpleNamespace:
    defaults = {
        "id": "evt-001",
        "sequence_no": 5,
        "event_kind": "scene",
        "source_channel": "gm",
        "actor_id": None,
        "title": "市集起火",
        "body": "火舌竄起。",
        "visibility_scope": "public",
        "payload_json": {},
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


# ── world entry → ────────────────────────────────────────────────────────


def test_world_entry_public_routes_by_category() -> None:
    inp = oa.world_entry_to_input(_world_entry(category="species"), "novel_04_dungen")
    assert inp is not None
    assert inp.hints["destination_hint"] == Destination.BIBLE_SPECIES.value


def test_world_entry_director_routes_to_secrets() -> None:
    inp = oa.world_entry_to_input(
        _world_entry(visibility_scope="director", category="history"),
        "novel_04_dungen",
    )
    assert inp.hints["destination_hint"] == Destination.CONTEXT_SECRETS.value


def test_world_entry_unknown_category_falls_back_to_worldbuilding() -> None:
    inp = oa.world_entry_to_input(_world_entry(category="random_x"), "novel_04_dungen")
    assert inp.hints["destination_hint"] == Destination.BIBLE_WORLDBUILDING.value


def test_world_entry_carries_opera_id_and_tags() -> None:
    inp = oa.world_entry_to_input(_world_entry(), "novel_04_dungen")
    assert inp.hints["opera_id"] == "we-001"
    assert "tags:" in inp.raw_text
    assert "港口" in inp.raw_text


# ── actor → ──────────────────────────────────────────────────────────────


def test_actor_npc_routes_to_bible_character() -> None:
    inp = oa.actor_to_input(_actor(), "novel_04_dungen")
    assert inp is not None
    assert inp.hints["destination_hint"] == Destination.BIBLE_CHARACTER.value
    assert inp.hints["char_id"].startswith("char_")


def test_actor_gm_is_skipped() -> None:
    assert oa.actor_to_input(_actor(role="gm"), "novel_04_dungen") is None


def test_actor_uses_metadata_char_id_when_present() -> None:
    inp = oa.actor_to_input(
        _actor(metadata_json={"char_id": "char_042"}), "novel_04_dungen"
    )
    assert inp.hints["char_id"] == "char_042"
    assert "char_id: char_042" in inp.raw_text


def test_actor_secret_creates_secrets_input() -> None:
    inp = oa.actor_secret_to_input(
        _actor(metadata_json={"char_id": "char_007"}, secret_motives="她其實是雙面諜。"),
        "novel_04_dungen",
    )
    assert inp is not None
    assert inp.hints["destination_hint"] == Destination.CONTEXT_SECRETS.value
    assert "secret-character-007" in inp.raw_text
    assert "雙面諜" in inp.raw_text


def test_actor_no_secret_returns_none() -> None:
    assert oa.actor_secret_to_input(_actor(secret_motives=""), "novel_04_dungen") is None


def test_actor_nsfw_creates_nsfw_input() -> None:
    actor = _actor(
        metadata_json={
            "char_id": "char_007",
            "nsfw_profile": {"intimate_dynamic": "主導", "physical_sensitivity": "高"},
        }
    )
    inp = oa.actor_nsfw_to_input(actor, "novel_04_dungen")
    assert inp is not None
    assert inp.hints["destination_hint"] == Destination.CONTEXT_NSFW_CHAR_DETAILS.value
    assert "nsfw_ref_id: ext_char_007" in inp.raw_text
    assert "bible_ref_id: char_007" in inp.raw_text
    assert "主導" in inp.raw_text


def test_actor_no_nsfw_profile_returns_none() -> None:
    assert oa.actor_nsfw_to_input(_actor(), "novel_04_dungen") is None


# ── director note → ────────────────────────────────────────────────────


def test_director_note_routes_to_secrets() -> None:
    inp = oa.director_note_to_input(_director_note(), "novel_04_dungen")
    assert inp.hints["destination_hint"] == Destination.CONTEXT_SECRETS.value
    assert "secret-foreshadow-" in inp.raw_text


# ── gm brief → ─────────────────────────────────────────────────────────


def test_gm_brief_reveal_routes_to_context_current() -> None:
    inp = oa.gm_brief_to_input(_gm_brief(), "novel_04_dungen")
    assert inp is not None
    assert inp.hints["destination_hint"] == Destination.CONTEXT_CURRENT.value
    assert "下一章鉤子" in inp.raw_text


def test_gm_brief_no_reveal_returns_none() -> None:
    assert oa.gm_brief_to_input(_gm_brief(reveal_in_context=False), "novel_04_dungen") is None


# ── story event → ──────────────────────────────────────────────────────


def test_story_event_scene_routes_to_daily() -> None:
    inp = oa.story_event_to_input(_story_event(), "novel_04_dungen", date_tag="Y000-M01-D05")
    assert inp.hints["destination_hint"] == Destination.UPDATES_DAILY.value
    assert inp.hints["date_tag"] == "Y000-M01-D05"


def test_story_event_rumor_routes_to_gossips() -> None:
    inp = oa.story_event_to_input(
        _story_event(
            event_kind="dialogue",
            title="酒館的傳聞",
            payload_json={"is_rumor": True},
        ),
        "novel_04_dungen",
    )
    assert inp.hints["destination_hint"] == Destination.UPDATES_GOSSIPS.value


def test_story_event_reveal_routes_to_secrets() -> None:
    inp = oa.story_event_to_input(
        _story_event(event_kind="reveal", payload_json={"reveal_target": "bible/worldbuilding.md"}),
        "novel_04_dungen",
    )
    assert inp.hints["destination_hint"] == Destination.CONTEXT_SECRETS.value
    assert inp.hints["reveal_target"] == "bible/worldbuilding.md"


def test_story_event_unknown_kind_returns_none() -> None:
    assert oa.story_event_to_input(_story_event(event_kind="garbage"), "novel_04_dungen") is None


# ── collect_inputs ─────────────────────────────────────────────────────


def test_collect_inputs_aggregates_all_sources() -> None:
    inputs = oa.collect_inputs(
        novel_id="novel_04_dungen",
        world_entries=[_world_entry()],
        actors=[_actor(metadata_json={"char_id": "char_001"}, secret_motives="X")],
        director_notes=[_director_note()],
        gm_briefs=[_gm_brief()],
        story_events=[_story_event()],
        date_tag="Y000-M01-D03",
    )
    # 1 world + 1 actor + 1 secret + 1 note + 1 brief + 1 event = 6
    assert len(inputs) == 6
    dests = [inp.hints["destination_hint"] for inp in inputs]
    assert Destination.BIBLE_CHARACTER.value in dests
    assert Destination.CONTEXT_SECRETS.value in dests
    assert Destination.CONTEXT_CURRENT.value in dests
    assert Destination.UPDATES_DAILY.value in dests
