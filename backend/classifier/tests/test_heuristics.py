"""啟發式偵測器測試 — 含對抗樣本。"""

from __future__ import annotations

import pytest

from classifier.core import ClassifierInput
from classifier.rules.heuristics import detect_all, detect_best
from classifier.taxonomy import Destination


def _make_input(text: str, *, filename: str = "", source: str = "paste") -> ClassifierInput:
    return ClassifierInput(
        source=source,  # type: ignore[arg-type]
        raw_text=text,
        novel_id="novel_04_dungen",
        hints={"filename": filename} if filename else {},
    )


# ── 明示 frontmatter ───────────────────────────────────────────────────────


def test_explicit_destination_frontmatter_wins() -> None:
    text = "---\ndestination: bible_character\n---\n# char_007\n\n設定。"
    best = detect_best(_make_input(text))
    assert best is not None
    assert best.destination == Destination.BIBLE_CHARACTER.value
    assert best.confidence == 1.0


def test_invalid_destination_frontmatter_ignored() -> None:
    text = "---\ndestination: not_a_real_one\n---\n# 標題"
    # 不應拋例外；改走其他偵測器
    hits = detect_all(_make_input(text))
    assert all(h.matched_pattern != "frontmatter.destination" for h in hits)


def test_nsfw_ref_id_in_frontmatter() -> None:
    text = "---\nnsfw_ref_id: ext_char_001\n---\n細節"
    best = detect_best(_make_input(text))
    assert best is not None
    assert best.destination == Destination.CONTEXT_NSFW_CHAR_DETAILS.value


# ── secrets 偵測 ───────────────────────────────────────────────────────────


def test_secret_token_routes_to_secrets() -> None:
    text = "# 深淵真相\n\n與 secret-world-001 相關。"
    best = detect_best(_make_input(text))
    assert best is not None
    assert best.destination == Destination.CONTEXT_SECRETS.value
    assert best.extracted_hints["secret_id"] == "secret-world-001"


def test_secret_character_token() -> None:
    text = "## 角色秘密：secret-character-003"
    best = detect_best(_make_input(text))
    assert best.destination == Destination.CONTEXT_SECRETS.value


# ── 日期 / gossip 偵測 ─────────────────────────────────────────────────────


def test_date_tag_in_body_routes_to_daily() -> None:
    text = "# Y000-M01-D05 今日紀錄\n\n發生了..."
    best = detect_best(_make_input(text))
    assert best.destination == Destination.UPDATES_DAILY.value
    assert best.extracted_hints["date_tag"] == "Y000-M01-D05"


def test_date_tag_in_filename() -> None:
    text = "# 今日"
    best = detect_best(_make_input(text, filename="Y000-M02-D10.md"))
    assert best.destination == Destination.UPDATES_DAILY.value


def test_gossip_filename_beats_other_signals() -> None:
    text = "# 城裡的傳聞\n\n夢玲在第三區出現。"
    best = detect_best(_make_input(text, filename="undated-rumor-007-mengling.md"))
    assert best.destination == Destination.UPDATES_GOSSIPS.value


def test_rumor_heading_routes_to_gossip() -> None:
    text = "# 流言：失蹤的礦工\n\n聽說他們都被深淵吞了。"
    best = detect_best(_make_input(text))
    assert best.destination == Destination.UPDATES_GOSSIPS.value


# ── NSFW ────────────────────────────────────────────────────────────────────


def test_nsfw_marker_with_char_id_routes_to_char_details() -> None:
    text = "# char_007 私密設定\n\nintimate_dynamic: 主導。\nphysical_sensitivity: 高。"
    best = detect_best(_make_input(text))
    assert best.destination == Destination.CONTEXT_NSFW_CHAR_DETAILS.value


def test_nsfw_marker_without_char_id_routes_to_intimate() -> None:
    text = "# 通用 NSFW 設定\n\nR-18 風格與場景偏好說明。"
    best = detect_best(_make_input(text))
    assert best.destination == Destination.CONTEXT_NSFW_INTIMATE.value


# ── 角色 / 區域 / 種族 ────────────────────────────────────────────────────


def test_char_id_routes_to_bible_character() -> None:
    text = "## char_012\n\n基本資料：..."
    best = detect_best(_make_input(text))
    assert best.destination == Destination.BIBLE_CHARACTER.value


def test_region_table_header_routes_to_regions_index() -> None:
    text = "| Region | File | Function |\n| --- | --- | --- |\n| 深淵層 1 | a.md | 礦 |"
    best = detect_best(_make_input(text))
    assert best.destination == Destination.REGIONS_INDEX.value


def test_yaml_ecology_routes_to_ecology() -> None:
    text = "schema_notes: 生態目錄\nlayers:\n  - id: shallow_001"
    best = detect_best(_make_input(text))
    assert best.destination == Destination.REGIONS_ECOLOGY_YAML.value


def test_species_header_routes_to_bible_species() -> None:
    text = "## 種族：深淵蛇人\n\n描述..."
    best = detect_best(_make_input(text))
    assert best.destination == Destination.BIBLE_SPECIES.value


# ── 對抗樣本 ───────────────────────────────────────────────────────────────


def test_worldbuilding_paragraph_with_secret_word_does_not_route_to_secrets() -> None:
    """「秘密」一詞不該觸發 secrets；必須是 secret-xxx-NNN 完整 token 才算。"""
    text = "# 世界觀總覽\n\n這個城市有它自己的秘密角落。"
    best = detect_best(_make_input(text))
    assert best is None or best.destination != Destination.CONTEXT_SECRETS.value


def test_past_tense_rumor_without_marker_words_is_unrouted() -> None:
    """沒有「流言/rumor」字眼的純敘述不應誤判為 gossip。"""
    text = "## 第三區晚間發生了爭執，最終以和解收場。"
    best = detect_best(_make_input(text))
    if best is not None:
        assert best.destination != Destination.UPDATES_GOSSIPS.value


def test_empty_text_no_hits() -> None:
    assert detect_all(_make_input("")) == []
    assert detect_best(_make_input("")) is None


def test_pure_calendar_filename_routes_to_calendar() -> None:
    best = detect_best(_make_input("- Y000-M01: 初春", filename="calendar.md"))
    assert best is not None
    assert best.destination == Destination.CALENDAR_UPDATE.value


# ── 信心排序 ───────────────────────────────────────────────────────────────


def test_explicit_frontmatter_beats_body_signals() -> None:
    """frontmatter destination=bible_worldbuilding 應勝過 body 內的 char_id 訊號。"""
    text = "---\ndestination: bible_worldbuilding\n---\n## char_001 提及"
    best = detect_best(_make_input(text))
    assert best.destination == Destination.BIBLE_WORLDBUILDING.value


def test_detect_all_returns_multiple_hits() -> None:
    text = "## char_007\n\n與 secret-character-007 相關。"
    hits = detect_all(_make_input(text))
    dests = {h.destination for h in hits}
    assert Destination.CONTEXT_SECRETS.value in dests
    assert Destination.BIBLE_CHARACTER.value in dests


@pytest.mark.parametrize(
    "fixture",
    [
        ("# 今日紀錄 Y000-M03-D12\n\n事件", Destination.UPDATES_DAILY),
        ("# 流言池\n\n## 流言：森林深處的低語", Destination.UPDATES_GOSSIPS),
        ("# 種族：地精族\n\n設定", Destination.BIBLE_SPECIES),
        ("## char_042\n\n資料", Destination.BIBLE_CHARACTER),
    ],
)
def test_parametrized_routing(fixture) -> None:
    text, expected = fixture
    best = detect_best(_make_input(text))
    assert best is not None
    assert best.destination == expected.value
