"""硬性 guard 測試 — writer 必須拒絕寫入 novel_db。"""

from __future__ import annotations

from pathlib import Path

import pytest

from classifier.core import ClassifierOutput
from classifier.taxonomy import Destination
from classifier.writers.base import (
    NovelDbWriteForbidden,
    _assert_not_novel_db,
    apply_preview,
    write_preview,
)


def _output(dest: Destination = Destination.BIBLE_CHARACTER) -> ClassifierOutput:
    return ClassifierOutput(
        destination=dest.value,
        suggested_path=Path(dest.value),
        frontmatter={"char_id": "char_001"},
        body_md="設定",
        confidence=0.9,
        reason="test",
    )


def test_assert_not_novel_db_passes_for_safe_path(tmp_path: Path) -> None:
    # tmp_path 不在 NOVEL_DB_ROOT 下
    _assert_not_novel_db(tmp_path)  # 不該拋


def test_assert_not_novel_db_rejects_novel_db_root(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    fake_novel_db = tmp_path / "novel_db_fake"
    fake_novel_db.mkdir()
    monkeypatch.setattr("classifier.config.NOVEL_DB_ROOT", fake_novel_db)
    with pytest.raises(NovelDbWriteForbidden):
        _assert_not_novel_db(fake_novel_db)


def test_assert_not_novel_db_rejects_subpath(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    fake_novel_db = tmp_path / "novel_db_fake"
    (fake_novel_db / "novel_x" / "bible").mkdir(parents=True)
    monkeypatch.setattr("classifier.config.NOVEL_DB_ROOT", fake_novel_db)
    with pytest.raises(NovelDbWriteForbidden):
        _assert_not_novel_db(fake_novel_db / "novel_x" / "bible" / "character.md")


def test_write_preview_refuses_novel_db_target(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    fake_novel_db = tmp_path / "novel_db_fake"
    fake_novel_db.mkdir()
    monkeypatch.setattr("classifier.config.NOVEL_DB_ROOT", fake_novel_db)
    with pytest.raises(NovelDbWriteForbidden):
        write_preview(_output(), fake_novel_db)


def test_write_preview_refuses_novel_db_subpath(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    fake_novel_db = tmp_path / "novel_db_fake"
    novel = fake_novel_db / "novel_x"
    novel.mkdir(parents=True)
    monkeypatch.setattr("classifier.config.NOVEL_DB_ROOT", fake_novel_db)
    with pytest.raises(NovelDbWriteForbidden):
        write_preview(_output(), novel)


def test_write_preview_allows_safe_path(tmp_path: Path) -> None:
    # tmp_path 不在 NOVEL_DB_ROOT 下；應正常產生 preview
    preview = write_preview(_output(), tmp_path)
    assert preview.target_path.is_relative_to(tmp_path)


def test_apply_preview_refuses_novel_db_path(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """即使 caller 偽造 WriterPreview，apply_preview 也應該擋。"""
    from classifier.writers.base import WriterPreview

    fake_novel_db = tmp_path / "novel_db_fake"
    fake_novel_db.mkdir()
    monkeypatch.setattr("classifier.config.NOVEL_DB_ROOT", fake_novel_db)

    forged = WriterPreview(
        destination=Destination.BIBLE_CHARACTER,
        target_path=fake_novel_db / "novel_x" / "bible" / "character.md",
        is_new_file=True,
        old_text="",
        new_text="malicious content",
    )
    with pytest.raises(NovelDbWriteForbidden):
        apply_preview(forged)
