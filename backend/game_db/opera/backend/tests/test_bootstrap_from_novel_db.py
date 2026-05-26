"""bootstrap_from_novel_db 測試 — 跑真實 novel_04_dungen bootstrap，驗證 payload 結構。"""

from __future__ import annotations

import pytest

from backend.app.services import defaults


def test_bootstrap_real_novel_returns_actors_and_world_entries() -> None:
    payload = defaults.bootstrap_from_novel_db("novel_04_dungen", "測試 premise")
    assert payload["novel_overlay"] is not None
    assert payload["actors"], "至少要有 GM + 角色"
    # 第一個應該是 GM
    assert payload["actors"][0]["role"] == "gm"
    # 至少有一個 npc 角色（從 bible/character.md 來）
    assert any(a["role"] in {"npc", "player"} for a in payload["actors"])


def test_bootstrap_player_flag_assigns_player_role() -> None:
    payload = defaults.bootstrap_from_novel_db(
        "novel_04_dungen", "premise", player_char_id="mengling"
    )
    player_actors = [a for a in payload["actors"] if a["role"] == "player"]
    assert player_actors, "指定 player_char_id=mengling 應該產生 player role 角色"
    assert player_actors[0]["metadata"]["char_id"] == "mengling"


def test_bootstrap_yaml_novel_returns_player_and_npcs() -> None:
    payload = defaults.bootstrap_from_novel_db(
        "novel_05_genshin", "premise", player_char_id="traveler"
    )
    player_actors = [actor for actor in payload["actors"] if actor["role"] == "player"]
    npc_actors = [actor for actor in payload["actors"] if actor["role"] == "npc"]
    assert player_actors
    assert player_actors[0]["metadata"]["char_id"] == "traveler"
    assert len(npc_actors) >= 30


def test_bootstrap_initial_story_state_carries_novel_id() -> None:
    payload = defaults.bootstrap_from_novel_db("novel_04_dungen", "premise")
    assert payload["initial_story_state"]["raw_state"]["novel_id"] == "novel_04_dungen"


def test_bootstrap_unknown_novel_falls_back_to_defaults() -> None:
    payload = defaults.bootstrap_from_novel_db("novel_does_not_exist", "premise")
    assert payload["novel_overlay"] is None
    # fallback 應該用 hardcoded defaults：5 個 actors + 4 個 world entries
    assert len(payload["actors"]) == 5
    assert len(payload["world_entries"]) == 4


def test_bootstrap_world_entries_marked_from_novel_db() -> None:
    payload = defaults.bootstrap_from_novel_db("novel_04_dungen", "premise")
    if not payload["world_entries"]:
        pytest.skip("novel_04_dungen 沒有 worldbuilding 區段")
    entry = payload["world_entries"][0]
    assert entry["metadata"]["source"] == "novel_db.bible.worldbuilding"
