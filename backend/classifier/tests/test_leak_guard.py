"""Secrets-leak linter 測試。"""

from __future__ import annotations

from pathlib import Path

from classifier.rules.leak_guard import (
    LeakWarning,
    SecretLeakError,
    load_secret_fragments,
    scan_for_leaks,
)
from classifier.taxonomy import Destination


def _make_lockbox(root: Path, text: str) -> None:
    lockbox = root / "context" / "secrets-lockbox.md"
    lockbox.parent.mkdir(parents=True, exist_ok=True)
    lockbox.write_text(text, encoding="utf-8")


def test_load_secret_fragments_empty_if_no_lockbox(tmp_path: Path) -> None:
    assert load_secret_fragments(tmp_path) == {}


def test_load_secret_fragments_parses_sections(tmp_path: Path) -> None:
    _make_lockbox(
        tmp_path,
        "# Secrets\n\n"
        "## secret-world-001\n\n"
        "深淵第三層底端有未公開的裂縫通往遠古遺跡。\n\n"
        "## secret-character-002\n\n"
        "夢玲其實是雙面諜為辛迪加工作。\n",
    )
    out = load_secret_fragments(tmp_path)
    assert "secret-world-001" in out
    assert "secret-character-002" in out
    assert any("深淵第三層底端有未公開的裂縫通往遠古遺跡" in f for f in out["secret-world-001"])


def test_scan_finds_leak_in_public_destination(tmp_path: Path) -> None:
    """body 含與 lockbox 完全相符的子字串時應命中。"""
    _make_lockbox(
        tmp_path,
        "## secret-world-001\n\n夢玲其實是雙面諜為辛迪加工作。\n",
    )
    body = "事前公告：夢玲其實是雙面諜為辛迪加工作。請保密。"
    warns = scan_for_leaks(Destination.BIBLE_CHARACTER, body, tmp_path)
    assert len(warns) == 1
    assert warns[0].secret_id == "secret-world-001"
    assert "雙面諜" in warns[0].truncated_context


def test_scan_skips_non_public_destinations(tmp_path: Path) -> None:
    """寫入 CONTEXT_SECRETS 或 NSFW 時，秘密內容是合法的，不該誤報。"""
    _make_lockbox(tmp_path, "## secret-world-001\n\n夢玲其實是雙面諜為辛迪加工作。\n")
    body = "夢玲其實是雙面諜為辛迪加工作。"
    assert scan_for_leaks(Destination.CONTEXT_SECRETS, body, tmp_path) == []
    assert scan_for_leaks(Destination.CONTEXT_NSFW_INTIMATE, body, tmp_path) == []


def test_scan_no_lockbox_returns_no_warnings(tmp_path: Path) -> None:
    body = "任何內容"
    assert scan_for_leaks(Destination.BIBLE_CHARACTER, body, tmp_path) == []


def test_short_fragments_ignored(tmp_path: Path) -> None:
    """太短的字串會誤判太多；MIN_LEAK_FRAGMENT 過濾掉。"""
    _make_lockbox(tmp_path, "## secret-world-001\n\n短\n")
    body = "短東西"
    assert scan_for_leaks(Destination.BIBLE_CHARACTER, body, tmp_path) == []


def test_secret_leak_error_carries_warnings() -> None:
    w = LeakWarning(secret_id="s1", fragment="x" * 20, truncated_context="ctx")
    err = SecretLeakError([w])
    assert err.warnings == [w]
    assert "s1" in str(err)
