"""calendar_sync 測試。"""

from __future__ import annotations

from classifier.calendar_sync import (
    CalendarAnchor,
    advance_anchor_by_days,
    date_tag_for_event,
    date_tag_for_turn,
    parse_anchor,
)


def test_default_anchor_starts_at_y000_m01_d01() -> None:
    assert date_tag_for_turn(CalendarAnchor(), 0) == "Y000-M01-D01"


def test_turn_advances_one_day_per_tick_by_default() -> None:
    a = CalendarAnchor()
    assert date_tag_for_turn(a, 1) == "Y000-M01-D02"
    assert date_tag_for_turn(a, 29) == "Y000-M01-D30"
    assert date_tag_for_turn(a, 30) == "Y000-M02-D01"


def test_ticks_per_day_groups_turns() -> None:
    """ticks_per_day=3 → 每 3 回合一天。"""
    a = CalendarAnchor(ticks_per_day=3)
    assert date_tag_for_turn(a, 0) == "Y000-M01-D01"
    assert date_tag_for_turn(a, 2) == "Y000-M01-D01"
    assert date_tag_for_turn(a, 3) == "Y000-M01-D02"
    assert date_tag_for_turn(a, 5) == "Y000-M01-D02"
    assert date_tag_for_turn(a, 6) == "Y000-M01-D03"


def test_year_wraps_after_12_months() -> None:
    a = CalendarAnchor(year=0, month=12, day=30)
    assert date_tag_for_turn(a, 1) == "Y001-M01-D01"


def test_parse_anchor_handles_missing_meta() -> None:
    assert parse_anchor(None) == CalendarAnchor()
    assert parse_anchor({}) == CalendarAnchor()


def test_parse_anchor_reads_fields() -> None:
    meta = {"calendar_anchor": {"year": 5, "month": 3, "day": 15, "ticks_per_day": 2}}
    a = parse_anchor(meta)
    assert a == CalendarAnchor(year=5, month=3, day=15, ticks_per_day=2)


def test_date_tag_for_event_uses_meta() -> None:
    meta = {"calendar_anchor": {"year": 2, "month": 6, "day": 10}}
    assert date_tag_for_event(meta, 0) == "Y002-M06-D10"
    assert date_tag_for_event(meta, 5) == "Y002-M06-D15"


def test_advance_anchor_by_days() -> None:
    a = CalendarAnchor(year=0, month=1, day=29)
    b = advance_anchor_by_days(a, 3)
    assert (b.year, b.month, b.day) == (0, 2, 2)
    # ticks_per_day 保留
    assert b.ticks_per_day == a.ticks_per_day
