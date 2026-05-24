"""CLI smoke tests — taxonomy-doc、preview、campaign new/export、route --apply。

採用 staging 流程（不直接寫 novel_db）。
"""

from __future__ import annotations

import io
import json
from pathlib import Path

import pytest

from classifier.cli import main


@pytest.fixture
def fake_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """模擬 novel_db + staging 環境，隔離真實檔案。"""
    novel_db = tmp_path / "novel_db"
    novel_db.mkdir()
    novel = novel_db / "novel_test"
    (novel / "bible").mkdir(parents=True)
    (novel / "bible" / "character.md").write_text(
        "# Character\n\n## char_001\n\n基本資料\n", encoding="utf-8"
    )

    staging_root = tmp_path / "staging"

    monkeypatch.setattr("classifier.config.NOVEL_DB_ROOT", novel_db)
    monkeypatch.setattr("classifier.config.STAGING_ROOT", staging_root)
    monkeypatch.setattr("classifier.staging.STAGING_ROOT", staging_root)
    return novel


def test_taxonomy_doc(capsys: pytest.CaptureFixture) -> None:
    rc = main(["taxonomy-doc"])
    captured = capsys.readouterr()
    assert rc == 0
    assert "Destination" in captured.out
    assert "bible_character" in captured.out
    assert "staging" in captured.out  # 提示語


def test_preview_via_stdin_no_campaign_uses_scratch(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture, fake_env: Path
) -> None:
    text = "## char_042\n\n資料"
    monkeypatch.setattr("sys.stdin", io.StringIO(text))
    rc = main([
        "preview",
        "--stdin",
        "--novel-id", "novel_test",
        "--no-llm",
    ])
    captured = capsys.readouterr()
    assert rc == 0
    assert "bible_character" in captured.out


def test_campaign_new_creates_staging(capsys: pytest.CaptureFixture, fake_env: Path) -> None:
    rc = main([
        "campaign", "new",
        "--campaign-id", "test_camp",
        "--novel-id", "novel_test",
        "--json",
    ])
    captured = capsys.readouterr()
    assert rc == 0
    data = json.loads(captured.out)
    assert data["campaign_id"] == "test_camp"
    working = Path(data["working"])
    assert working.is_dir()
    assert (working / "bible" / "character.md").exists()


def test_campaign_list_after_new(capsys: pytest.CaptureFixture, fake_env: Path) -> None:
    main(["campaign", "new", "--campaign-id", "c_a", "--novel-id", "novel_test"])
    main(["campaign", "new", "--campaign-id", "c_b", "--novel-id", "novel_test"])
    capsys.readouterr()  # 清掉前面輸出
    rc = main(["campaign", "list", "--json"])
    captured = capsys.readouterr()
    assert rc == 0
    listed = json.loads(captured.out)
    ids = {c["campaign_id"] for c in listed}
    assert {"c_a", "c_b"} <= ids


def test_route_apply_requires_campaign_id(
    tmp_path: Path, capsys: pytest.CaptureFixture, fake_env: Path
) -> None:
    blob = tmp_path / "blob.md"
    blob.write_text("## char_001\n\n資料", encoding="utf-8")
    rc = main([
        "route",
        "--input", str(blob),
        "--novel-id", "novel_test",
        "--no-llm",
        "--apply",
        "--yes",
    ])
    captured = capsys.readouterr()
    assert rc == 2
    assert "campaign-id" in captured.err


def test_route_apply_writes_to_staging_not_novel_db(
    tmp_path: Path, capsys: pytest.CaptureFixture, fake_env: Path
) -> None:
    main(["campaign", "new", "--campaign-id", "wr", "--novel-id", "novel_test"])
    capsys.readouterr()

    blob = tmp_path / "blob.md"
    blob.write_text(
        "---\ndestination: bible_character\nchar_id: char_999\n---\n## char_999\n\n新增角色設定",
        encoding="utf-8",
    )
    rc = main([
        "route",
        "--input", str(blob),
        "--campaign-id", "wr",
        "--no-llm",
        "--apply",
        "--yes",
        "--json",
    ])
    assert rc == 0
    # staging working/ 應該被寫；novel_db 不該被動
    staging_working = fake_env.parent.parent / "staging" / "wr" / "working"
    target = staging_working / "bible" / "character.md"
    assert "char_999" in target.read_text(encoding="utf-8")
    # 確認 novel_db 內 character.md 沒被動
    original = fake_env / "bible" / "character.md"
    assert "char_999" not in original.read_text(encoding="utf-8")


def test_campaign_export_after_route(
    tmp_path: Path, capsys: pytest.CaptureFixture, fake_env: Path
) -> None:
    main(["campaign", "new", "--campaign-id", "ex", "--novel-id", "novel_test"])
    blob = tmp_path / "b.md"
    blob.write_text(
        "---\ndestination: bible_character\nchar_id: char_500\n---\n## char_500\n\n設定",
        encoding="utf-8",
    )
    main([
        "route", "--input", str(blob),
        "--campaign-id", "ex", "--no-llm", "--apply", "--yes",
    ])
    capsys.readouterr()
    rc = main(["campaign", "export", "--campaign-id", "ex", "--timestamp", "T0", "--json"])
    captured = capsys.readouterr()
    assert rc == 0
    data = json.loads(captured.out)
    assert data["modified"] + data["new"] >= 1
    # MANIFEST + diff.patch + README 都應該存在
    export_dir = Path(data["export_dir"])
    assert (export_dir / "MANIFEST.md").exists()
    assert (export_dir / "diff.patch").exists()
    assert (export_dir / "README.md").exists()
    # diff 內容應含 char_500
    diff_text = (export_dir / "diff.patch").read_text(encoding="utf-8")
    assert "char_500" in diff_text


def test_campaign_delete_removes_staging(
    capsys: pytest.CaptureFixture, fake_env: Path
) -> None:
    main(["campaign", "new", "--campaign-id", "rm", "--novel-id", "novel_test"])
    capsys.readouterr()
    rc = main(["campaign", "delete", "--campaign-id", "rm", "--yes"])
    assert rc == 0
    # list 後不應再有 rm
    capsys.readouterr()
    main(["campaign", "list", "--json"])
    captured = capsys.readouterr()
    listed = json.loads(captured.out)
    assert all(c["campaign_id"] != "rm" for c in listed)
