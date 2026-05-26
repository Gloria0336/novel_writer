"""novel_db_overlay 測試 — 解析真實 novel_04_dungen 檔案。

不需要 opera ORM；純檔案 IO。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from backend.app.engine import novel_db_overlay as overlay


def test_resolve_novel_root_for_existing_novel() -> None:
    root = overlay.resolve_novel_root("novel_04_dungen")
    assert root.is_dir()
    assert (root / "bible" / "character.md").exists()


def test_parse_character_md_returns_known_chars() -> None:
    path = overlay.resolve_novel_root("novel_04_dungen") / "bible" / "character.md"
    sections = overlay.parse_character_md(path)
    assert sections, "至少應該有一個角色區段"
    char_ids = {s.char_id for s in sections}
    assert "mengling" in char_ids
    # 不該誤把表格表頭或說明區當角色
    assert "使用規則" not in char_ids
    assert "群像狀態總表" not in char_ids


def test_parse_character_md_body_content() -> None:
    path = overlay.resolve_novel_root("novel_04_dungen") / "bible" / "character.md"
    sections = overlay.parse_character_md(path)
    mengling = next((s for s in sections if s.char_id == "mengling"), None)
    assert mengling is not None
    assert "夢玲" in mengling.body_md
    assert mengling.body_md.startswith("### 基本資料") or "### 基本資料" in mengling.body_md


def test_parse_characters_yaml_returns_known_chars() -> None:
    path = overlay.resolve_novel_root("novel_05_genshin") / "bible" / "characters.yaml"
    sections = overlay.parse_characters_yaml(path)
    assert sections
    traveler = next((s for s in sections if s.char_id == "traveler"), None)
    assert traveler is not None
    assert traveler.title == "旅行者（瑩）"
    assert "### Role" in traveler.body_md
    assert traveler.frontmatter["source_format"] == "yaml"


def test_parse_worldbuilding_md() -> None:
    path = overlay.resolve_novel_root("novel_04_dungen") / "bible" / "worldbuilding.md"
    if not path.exists():
        pytest.skip("worldbuilding.md 不存在於該 novel")
    sections = overlay.parse_worldbuilding_md(path)
    assert sections


def test_load_bible_bundle_for_novel_04() -> None:
    bundle = overlay.load_bible_bundle("novel_04_dungen")
    assert bundle.novel_id == "novel_04_dungen"
    assert bundle.characters
    # context/CONTEXT.md 可能存在也可能不存在；只驗證型別正確
    assert isinstance(bundle.context_current, str)
    assert isinstance(bundle.secrets_lockbox, str)


def test_load_bible_bundle_falls_back_to_characters_yaml() -> None:
    bundle = overlay.load_bible_bundle("novel_05_genshin")
    char_ids = {character.char_id for character in bundle.characters}
    assert "traveler" in char_ids
    assert len(bundle.characters) >= 30


def test_load_bible_bundle_missing_novel_raises() -> None:
    with pytest.raises(FileNotFoundError):
        overlay.load_bible_bundle("novel_does_not_exist")


def test_overlay_for_director_includes_secrets() -> None:
    bundle = overlay.load_bible_bundle("novel_04_dungen")
    view = overlay.overlay_for_director(bundle)
    assert "secrets_lockbox" in view


def test_overlay_for_gm_excludes_secrets() -> None:
    bundle = overlay.load_bible_bundle("novel_04_dungen")
    view = overlay.overlay_for_gm(bundle)
    assert "secrets_lockbox" not in view


def test_overlay_for_actor_with_all_scope_equals_gm_view() -> None:
    bundle = overlay.load_bible_bundle("novel_04_dungen")
    actor = type("A", (), {"knowledge_scopes_json": ["all"], "metadata_json": {}})()
    view = overlay.overlay_for_actor(bundle, actor)
    assert "secrets_lockbox" not in view
    assert "characters" in view


def test_overlay_for_actor_with_limited_scope_filters() -> None:
    bundle = overlay.load_bible_bundle("novel_04_dungen")
    actor = type("A", (), {"knowledge_scopes_json": [], "metadata_json": {"char_id": "mengling"}})()
    view = overlay.overlay_for_actor(bundle, actor)
    # 至少包含自己
    char_ids = [c["char_id"] for c in view["characters"]]
    assert "mengling" in char_ids
