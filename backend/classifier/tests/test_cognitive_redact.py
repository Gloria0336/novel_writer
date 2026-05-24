"""cognitive/redact 測試。"""

from __future__ import annotations

from classifier.cognitive.redact import (
    confidence_for,
    decay_hint_for,
    redact_for_perception,
)
from classifier.cognitive.types import PerceptionLevel


SAMPLE = (
    "夢玲走進酒館。一名陌生人遞給她一枚徽章。"
    "她的心跳加速，意識到這代表辛迪加開始接觸自己。"
    "她決定回去稟報。"
)


def test_direct_witness_keeps_full_text() -> None:
    out = redact_for_perception(SAMPLE, PerceptionLevel.DIRECT_WITNESS)
    assert "酒館" in out
    assert "稟報" in out  # 末句保留


def test_secondhand_truncates_with_prefix() -> None:
    out = redact_for_perception(SAMPLE, PerceptionLevel.SECONDHAND, actor_name="卡洛")
    assert out.startswith("（卡洛印象中）")
    # 應該只含前兩句
    assert "稟報" not in out
    assert "酒館" in out


def test_rumor_keeps_only_first_sentence_with_prefix() -> None:
    out = redact_for_perception(SAMPLE, PerceptionLevel.RUMOR)
    assert out.startswith("傳聞:") or out.startswith("傳聞：")
    assert "酒館" in out
    assert "稟報" not in out
    assert "辛迪加" not in out  # 第二句外的細節不該洩漏


def test_unaware_returns_empty() -> None:
    assert redact_for_perception(SAMPLE, PerceptionLevel.UNAWARE) == ""


def test_strips_frontmatter() -> None:
    text = "---\nopera_id: x\n---\n夢玲走進酒館。"
    out = redact_for_perception(text, PerceptionLevel.DIRECT_WITNESS)
    assert "opera_id" not in out
    assert "夢玲" in out


def test_strips_html_comments() -> None:
    text = "夢玲走進酒館。<!-- HOLD -->"
    out = redact_for_perception(text, PerceptionLevel.DIRECT_WITNESS)
    assert "HOLD" not in out


def test_confidence_decreases_with_level() -> None:
    c_direct = confidence_for(PerceptionLevel.DIRECT_WITNESS)
    c_second = confidence_for(PerceptionLevel.SECONDHAND)
    c_rumor = confidence_for(PerceptionLevel.RUMOR)
    c_unaware = confidence_for(PerceptionLevel.UNAWARE)
    assert c_direct > c_second > c_rumor > c_unaware
    assert c_unaware == 0.0


def test_decay_hints() -> None:
    assert decay_hint_for(PerceptionLevel.DIRECT_WITNESS) == "stable"
    assert decay_hint_for(PerceptionLevel.RUMOR) == "volatile"
