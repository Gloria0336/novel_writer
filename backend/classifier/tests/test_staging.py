"""classifier.staging 測試 — bootstrap、working、export、list、delete。"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from classifier import staging


@pytest.fixture
def fake_novel_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """建一個假 novel_db 結構，並把 NOVEL_DB_ROOT 與 STAGING_ROOT 都重指到 tmp_path 子目錄。"""
    novel_db = tmp_path / "novel_db"
    novel_db.mkdir()
    novel = novel_db / "novel_test"
    (novel / "bible").mkdir(parents=True)
    (novel / "context").mkdir()
    (novel / "bible" / "character.md").write_text("# Character\n\n## char_001\n\n基本資料\n", encoding="utf-8")
    (novel / "bible" / "worldbuilding.md").write_text("# World\n\n## premise\n\n設定\n", encoding="utf-8")
    (novel / "context" / "CONTEXT.md").write_text("# CONTEXT\n\n摘要\n", encoding="utf-8")

    staging_root = tmp_path / "staging"

    monkeypatch.setattr("classifier.config.NOVEL_DB_ROOT", novel_db)
    monkeypatch.setattr("classifier.config.STAGING_ROOT", staging_root)
    monkeypatch.setattr("classifier.staging.STAGING_ROOT", staging_root)
    return novel


# ── bootstrap ──────────────────────────────────────────────────────────────


def test_bootstrap_creates_full_layout(fake_novel_db: Path) -> None:
    paths = staging.bootstrap_staging("camp_001", "novel_test")
    assert paths.root.is_dir()
    assert paths.source_snapshot.is_dir()
    assert paths.working.is_dir()
    assert paths.meta_file.exists()
    assert paths.exports_dir.is_dir()
    # 內容真的複製過來
    assert (paths.working / "bible" / "character.md").read_text(encoding="utf-8").startswith("# Character")
    assert (paths.source_snapshot / "bible" / "character.md").read_text(encoding="utf-8").startswith("# Character")


def test_bootstrap_meta_records_novel_id(fake_novel_db: Path) -> None:
    staging.bootstrap_staging("camp_002", "novel_test")
    meta = staging.load_meta("camp_002")
    assert meta["novel_id"] == "novel_test"
    assert meta["campaign_id"] == "camp_002"
    assert meta["status"] == "active"
    assert "bootstrapped_at" in meta


def test_bootstrap_rejects_existing_without_overwrite(fake_novel_db: Path) -> None:
    staging.bootstrap_staging("dup", "novel_test")
    with pytest.raises(FileExistsError):
        staging.bootstrap_staging("dup", "novel_test")


def test_bootstrap_overwrite_resets(fake_novel_db: Path) -> None:
    paths1 = staging.bootstrap_staging("ow", "novel_test")
    # 在 working 寫東西
    (paths1.working / "test_marker.md").write_text("temp", encoding="utf-8")
    # overwrite 重建
    paths2 = staging.bootstrap_staging("ow", "novel_test", overwrite=True)
    assert not (paths2.working / "test_marker.md").exists()


def test_bootstrap_unknown_novel_raises(fake_novel_db: Path) -> None:
    with pytest.raises(FileNotFoundError):
        staging.bootstrap_staging("c", "novel_does_not_exist")


def test_get_staging_paths_rejects_illegal_id(fake_novel_db: Path) -> None:
    for bad in ["", "../escape", "a/b", "a\\b", "..\\evil"]:
        with pytest.raises(ValueError):
            staging.get_staging_paths(bad)


def test_get_working_root_requires_bootstrap(fake_novel_db: Path) -> None:
    with pytest.raises(FileNotFoundError):
        staging.get_working_root("not_yet")


# ── working 操作 ───────────────────────────────────────────────────────────


def test_working_writes_are_isolated_from_snapshot(fake_novel_db: Path) -> None:
    paths = staging.bootstrap_staging("iso", "novel_test")
    target = paths.working / "bible" / "character.md"
    target.write_text("# Character\n\n## char_001\n\n修改\n", encoding="utf-8")
    snapshot = paths.source_snapshot / "bible" / "character.md"
    assert "修改" not in snapshot.read_text(encoding="utf-8")


# ── export ─────────────────────────────────────────────────────────────────


def test_export_empty_campaign_succeeds(fake_novel_db: Path) -> None:
    staging.bootstrap_staging("empty", "novel_test")
    bundle = staging.export_campaign("empty", ts="2026-05-24T00-00-00Z")
    assert bundle.export_dir.is_dir()
    assert bundle.manifest_path.exists()
    text = bundle.manifest_path.read_text(encoding="utf-8")
    assert "無變動" in text
    assert bundle.changed_files == []


def test_export_detects_modified_file(fake_novel_db: Path) -> None:
    paths = staging.bootstrap_staging("mod", "novel_test")
    (paths.working / "bible" / "character.md").write_text(
        "# Character\n\n## char_001\n\n新內容\n", encoding="utf-8"
    )
    bundle = staging.export_campaign("mod", ts="2026-05-24T00-00-00Z")
    actions = {c.rel_path: c.action for c in bundle.changed_files}
    assert actions.get("bible/character.md") == "modified"
    # diff.patch 應該包含內容
    diff_text = bundle.diff_path.read_text(encoding="utf-8")
    assert "新內容" in diff_text
    assert "bible/character.md" in diff_text


def test_export_detects_new_file(fake_novel_db: Path) -> None:
    paths = staging.bootstrap_staging("newf", "novel_test")
    (paths.working / "updates" / "daily").mkdir(parents=True)
    (paths.working / "updates" / "daily" / "Y000-M01-D01.md").write_text(
        "新事件", encoding="utf-8"
    )
    bundle = staging.export_campaign("newf")
    actions = {c.rel_path: c.action for c in bundle.changed_files}
    assert actions.get("updates/daily/Y000-M01-D01.md") == "new"
    # changed_files/ 目錄應有拷貝
    copied = bundle.export_dir / "changed_files" / "updates" / "daily" / "Y000-M01-D01.md"
    assert copied.exists()
    assert "新事件" in copied.read_text(encoding="utf-8")


def test_export_detects_deleted_file(fake_novel_db: Path) -> None:
    paths = staging.bootstrap_staging("delf", "novel_test")
    (paths.working / "bible" / "worldbuilding.md").unlink()
    bundle = staging.export_campaign("delf")
    actions = {c.rel_path: c.action for c in bundle.changed_files}
    assert actions.get("bible/worldbuilding.md") == "deleted"


def test_export_readme_mentions_manual_only(fake_novel_db: Path) -> None:
    staging.bootstrap_staging("r", "novel_test")
    bundle = staging.export_campaign("r")
    readme = bundle.readme_path.read_text(encoding="utf-8")
    assert "手動" in readme
    assert "git apply" in readme  # Option A
    assert "novel_test" in readme


# ── list / delete / archive ────────────────────────────────────────────────


def test_list_campaigns(fake_novel_db: Path) -> None:
    staging.bootstrap_staging("c1", "novel_test")
    staging.bootstrap_staging("c2", "novel_test")
    listed = staging.list_campaigns()
    ids = {c["campaign_id"] for c in listed}
    assert {"c1", "c2"} <= ids


def test_delete_staging(fake_novel_db: Path) -> None:
    paths = staging.bootstrap_staging("dl", "novel_test")
    assert paths.root.exists()
    staging.delete_staging("dl")
    assert not paths.root.exists()


def test_update_status(fake_novel_db: Path) -> None:
    staging.bootstrap_staging("st", "novel_test")
    staging.update_status("st", "completed")
    meta = staging.load_meta("st")
    assert meta["status"] == "completed"
    assert "updated_at" in meta
