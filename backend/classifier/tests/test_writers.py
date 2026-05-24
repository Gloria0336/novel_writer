"""Writer dispatch + preview + idempotency 測試。"""

from __future__ import annotations

from pathlib import Path

import pytest

from classifier.core import ClassifierOutput, Sensitivity
from classifier.taxonomy import Destination, get_spec
from classifier.writers.base import apply_preview, write_preview


def _make_output(destination: Destination, **kwargs) -> ClassifierOutput:
    return ClassifierOutput(
        destination=destination.value,
        suggested_path=Path(destination.value),
        frontmatter=kwargs.pop("frontmatter", {}),
        body_md=kwargs.pop("body_md", ""),
        confidence=kwargs.pop("confidence", 0.9),
        reason=kwargs.pop("reason", "test"),
        schema_payload=kwargs.pop("schema_payload", {}),
    )


# ── APPEND_SECTION (BIBLE_CHARACTER) ───────────────────────────────────────


def test_bible_character_appends_new_section(tmp_path: Path) -> None:
    output = _make_output(
        Destination.BIBLE_CHARACTER,
        frontmatter={"char_id": "char_007"},
        body_md="### 基本資料\n\n- 姓名: 夢玲",
    )
    preview = write_preview(output, tmp_path)
    assert preview.is_new_file
    assert "## char_007" in preview.new_text
    assert "夢玲" in preview.new_text


def test_bible_character_idempotent(tmp_path: Path) -> None:
    """連續寫兩次相同內容，第二次 diff 為空。"""
    output = _make_output(
        Destination.BIBLE_CHARACTER,
        frontmatter={"char_id": "char_007"},
        body_md="### 基本資料\n\n- 姓名: 夢玲",
    )
    preview1 = write_preview(output, tmp_path)
    apply_preview(preview1)
    preview2 = write_preview(output, tmp_path)
    assert preview2.is_noop, f"second write should be noop; diff:\n{preview2.diff}"


def test_bible_character_replaces_existing_section(tmp_path: Path) -> None:
    target = tmp_path / "bible" / "character.md"
    target.parent.mkdir(parents=True)
    target.write_text(
        "# Character\n\n## char_007\n\n舊內容\n\n## char_999\n\n別人\n",
        encoding="utf-8",
    )
    output = _make_output(
        Destination.BIBLE_CHARACTER,
        frontmatter={"char_id": "char_007"},
        body_md="### 基本資料\n\n- 姓名: 夢玲（新版）",
    )
    preview = write_preview(output, tmp_path)
    apply_preview(preview)
    after = target.read_text(encoding="utf-8")
    assert "舊內容" not in after
    assert "新版" in after
    assert "## char_999" in after  # 不能破壞其他角色


def test_hold_marker_blocks_overwrite(tmp_path: Path) -> None:
    target = tmp_path / "bible" / "character.md"
    target.parent.mkdir(parents=True)
    target.write_text(
        "# Character\n\n## char_007\n\n<!-- HOLD -->\n手動編輯中\n",
        encoding="utf-8",
    )
    output = _make_output(
        Destination.BIBLE_CHARACTER,
        frontmatter={"char_id": "char_007"},
        body_md="覆寫嘗試",
    )
    preview = write_preview(output, tmp_path)
    apply_preview(preview)
    after = target.read_text(encoding="utf-8")
    assert "手動編輯中" in after
    assert "覆寫嘗試" not in after
    assert any(w.code == "hold_marker" for w in preview.warnings)


# ── APPEND_LINE ────────────────────────────────────────────────────────────


def test_regions_index_appends_line(tmp_path: Path) -> None:
    output = _make_output(
        Destination.REGIONS_INDEX,
        body_md="| 第三層 | layer_3.md | 礦業 | 礦工協會 | 採礦事件 |",
    )
    preview = write_preview(output, tmp_path)
    apply_preview(preview)
    target = tmp_path / "regions" / "region_index.md"
    assert "第三層" in target.read_text(encoding="utf-8")


def test_append_line_skips_duplicate(tmp_path: Path) -> None:
    target = tmp_path / "regions" / "region_index.md"
    target.parent.mkdir(parents=True)
    target.write_text("| 第三層 | layer_3.md | 礦業 | 礦工協會 | 採礦事件 |\n", encoding="utf-8")
    output = _make_output(
        Destination.REGIONS_INDEX,
        body_md="| 第三層 | layer_3.md | 礦業 | 礦工協會 | 採礦事件 |",
    )
    preview = write_preview(output, tmp_path)
    assert preview.is_noop
    assert any(w.code == "duplicate_line" for w in preview.warnings)


# ── CREATE_FILE ────────────────────────────────────────────────────────────


def test_create_file_with_frontmatter(tmp_path: Path) -> None:
    output = _make_output(
        Destination.UPDATES_GOSSIPS,
        frontmatter={"slug": "missing-miner", "number": "007"},
        body_md="# 流言：失蹤的礦工\n\n聽說...",
    )
    preview = write_preview(output, tmp_path)
    apply_preview(preview)
    # path = updates/gossips/undated-rumor-007-missing-miner.md
    files = list((tmp_path / "updates" / "gossips").glob("*.md"))
    assert len(files) == 1
    text = files[0].read_text(encoding="utf-8")
    assert "失蹤的礦工" in text
    assert "slug: missing-miner" in text


# ── UPDATES_DAILY (date_tag parsing) ───────────────────────────────────────


def test_updates_daily_resolves_date_from_tag(tmp_path: Path) -> None:
    output = _make_output(
        Destination.UPDATES_DAILY,
        frontmatter={"date_tag": "Y000-M01-D05"},
        body_md="## 事件\n\n發生了。",
    )
    preview = write_preview(output, tmp_path)
    apply_preview(preview)
    assert (tmp_path / "updates" / "daily" / "Y000-M01-D05.md").exists()


# ── UPSERT_ROW (CONTEXT_SECRETS) ───────────────────────────────────────────


def test_secrets_upsert_creates_then_updates(tmp_path: Path) -> None:
    target = tmp_path / "context" / "secrets-lockbox.md"
    out1 = _make_output(
        Destination.CONTEXT_SECRETS,
        frontmatter={"secret_id": "secret-world-001"},
        body_md="初始描述",
    )
    apply_preview(write_preview(out1, tmp_path))
    assert "secret-world-001" in target.read_text(encoding="utf-8")

    out2 = _make_output(
        Destination.CONTEXT_SECRETS,
        frontmatter={"secret_id": "secret-world-001"},
        body_md="揭曉後描述",
    )
    apply_preview(write_preview(out2, tmp_path))
    text = target.read_text(encoding="utf-8")
    assert "揭曉後描述" in text
    assert "初始描述" not in text


# ── NSFW 護欄 ──────────────────────────────────────────────────────────────


def test_nsfw_refused_without_allow_flag(tmp_path: Path) -> None:
    output = _make_output(
        Destination.CONTEXT_NSFW_INTIMATE,
        frontmatter={"char_id": "char_007"},
        body_md="私密設定",
    )
    with pytest.raises(PermissionError):
        write_preview(output, tmp_path, allow_nsfw=False)


def test_nsfw_allowed_with_flag(tmp_path: Path) -> None:
    output = _make_output(
        Destination.CONTEXT_NSFW_INTIMATE,
        frontmatter={"char_id": "char_007"},
        body_md="私密設定",
    )
    preview = write_preview(output, tmp_path, allow_nsfw=True)
    apply_preview(preview)
    assert (tmp_path / "context" / "nsfw" / "intimate.md").exists()


# ── OVERWRITE ──────────────────────────────────────────────────────────────


def test_current_status_overwrites(tmp_path: Path) -> None:
    target = tmp_path / "updates" / "current_status.md"
    target.parent.mkdir(parents=True)
    target.write_text("舊狀態\n", encoding="utf-8")
    output = _make_output(
        Destination.UPDATES_CURRENT_STATUS,
        body_md="新狀態",
    )
    apply_preview(write_preview(output, tmp_path))
    text = target.read_text(encoding="utf-8")
    assert "新狀態" in text
    assert "舊狀態" not in text


# ── YAML_UPSERT ────────────────────────────────────────────────────────────


def test_yaml_upsert_appends_new_layer(tmp_path: Path) -> None:
    target = tmp_path / "regions" / "abyss_ecology_catalog.yaml"
    target.parent.mkdir(parents=True)
    target.write_text(
        "layers:\n  - id: shallow_001\n    name: 鈣質洞穴\n",
        encoding="utf-8",
    )
    output = _make_output(
        Destination.REGIONS_ECOLOGY_YAML,
        schema_payload={"id": "shallow_002", "name": "螢光池"},
    )
    apply_preview(write_preview(output, tmp_path))
    text = target.read_text(encoding="utf-8")
    assert "shallow_001" in text
    assert "shallow_002" in text
    assert "螢光池" in text


def test_yaml_upsert_updates_existing_id(tmp_path: Path) -> None:
    target = tmp_path / "regions" / "abyss_ecology_catalog.yaml"
    target.parent.mkdir(parents=True)
    target.write_text(
        "layers:\n  - id: shallow_001\n    name: 舊名\n",
        encoding="utf-8",
    )
    output = _make_output(
        Destination.REGIONS_ECOLOGY_YAML,
        schema_payload={"id": "shallow_001", "name": "新名"},
    )
    apply_preview(write_preview(output, tmp_path))
    text = target.read_text(encoding="utf-8")
    assert "新名" in text


# ── Preview helpers ────────────────────────────────────────────────────────


def test_preview_diff_for_existing_file(tmp_path: Path) -> None:
    target = tmp_path / "bible" / "character.md"
    target.parent.mkdir(parents=True)
    target.write_text("# Character\n", encoding="utf-8")
    output = _make_output(
        Destination.BIBLE_CHARACTER,
        frontmatter={"char_id": "char_001"},
        body_md="設定",
    )
    preview = write_preview(output, tmp_path)
    assert not preview.is_new_file
    assert "+## char_001" in preview.diff or "+ ## char_001" in preview.diff
