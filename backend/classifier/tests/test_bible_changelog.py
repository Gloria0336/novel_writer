"""bible_changelog 測試。"""

from __future__ import annotations

from pathlib import Path

from classifier.core import ClassifierOutput
from classifier.feeds.bible_changelog import CHANGELOG_REL_PATH, append_entry
from classifier.taxonomy import Destination


def _output(opera_id: str = "evt-xyz", body: str = "新增 char_007 設定", dest=Destination.BIBLE_CHARACTER) -> ClassifierOutput:
    return ClassifierOutput(
        destination=dest.value,
        suggested_path=Path("x"),
        frontmatter={"opera_id": opera_id, "char_id": "char_007"},
        body_md=body,
        confidence=0.9,
        reason="test",
    )


def test_first_call_creates_file_with_header(tmp_path: Path) -> None:
    target = tmp_path / "bible" / "character.md"
    target.parent.mkdir(parents=True)
    target.write_text("x", encoding="utf-8")
    append_entry(tmp_path, output=_output(), target_path=target)
    log = tmp_path / CHANGELOG_REL_PATH
    assert log.exists()
    text = log.read_text(encoding="utf-8")
    assert "本 campaign 變更日誌" in text
    assert "evt-xyz" in text
    assert "bible/character.md" in text


def test_repeated_same_entry_is_idempotent(tmp_path: Path) -> None:
    target = tmp_path / "bible" / "character.md"
    target.parent.mkdir(parents=True)
    target.write_text("x", encoding="utf-8")
    output = _output()
    append_entry(tmp_path, output=output, target_path=target)
    append_entry(tmp_path, output=output, target_path=target)
    log = tmp_path / CHANGELOG_REL_PATH
    text = log.read_text(encoding="utf-8")
    # opera_id 應只出現一次（在表格列中）
    assert text.count("evt-xyz") == 1


def test_different_opera_ids_append_separate_rows(tmp_path: Path) -> None:
    target = tmp_path / "bible" / "character.md"
    target.parent.mkdir(parents=True)
    target.write_text("x", encoding="utf-8")
    append_entry(tmp_path, output=_output(opera_id="evt-A"), target_path=target)
    append_entry(tmp_path, output=_output(opera_id="evt-B"), target_path=target)
    log = tmp_path / CHANGELOG_REL_PATH
    text = log.read_text(encoding="utf-8")
    assert "evt-A" in text
    assert "evt-B" in text


def test_summary_extracted_from_body(tmp_path: Path) -> None:
    target = tmp_path / "bible" / "character.md"
    target.parent.mkdir(parents=True)
    target.write_text("x", encoding="utf-8")
    append_entry(tmp_path, output=_output(body="### 基本資料\n\n姓名:夢玲"), target_path=target)
    log = tmp_path / CHANGELOG_REL_PATH
    text = log.read_text(encoding="utf-8")
    assert "基本資料" in text  # 自第一行提取
