"""In-world 行事曆同步 — `(campaign_id, turn_no) ↔ Y{NNN}-M{NN}-D{NN}`。

opera 端在 `Campaign.metadata_json.calendar_anchor` 紀錄起始日與每回合推進的 tick 數，
classifier 把 opera StoryEvent 寫入 staging 時呼叫 `date_tag_for_event(...)` 取得正確檔名。

Anchor 格式：
    {
      "year": 0,
      "month": 1,
      "day": 1,
      "turn_zero_at": "2026-05-24T00:00:00Z",   # 第 0 回合 = 哪一天
      "ticks_per_day": 1                          # 每幾回合算一天（預設 1）
    }
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CalendarAnchor:
    year: int = 0
    month: int = 1
    day: int = 1
    ticks_per_day: int = 1


DEFAULT_ANCHOR = CalendarAnchor()


def parse_anchor(meta: dict[str, Any] | None) -> CalendarAnchor:
    """從 campaign.metadata_json.calendar_anchor 解析；缺欄位用 DEFAULT_ANCHOR 補。"""
    raw = (meta or {}).get("calendar_anchor") or {}
    return CalendarAnchor(
        year=int(raw.get("year", DEFAULT_ANCHOR.year)),
        month=int(raw.get("month", DEFAULT_ANCHOR.month)),
        day=int(raw.get("day", DEFAULT_ANCHOR.day)),
        ticks_per_day=max(1, int(raw.get("ticks_per_day", DEFAULT_ANCHOR.ticks_per_day))),
    )


def date_tag_for_turn(anchor: CalendarAnchor, turn_no: int) -> str:
    """把 turn_no 換成 Y{YYY}-M{MM}-D{DD}。

    暫用簡化的「30 天月 / 12 月年」算法，避免實作完整曆法；
    novel 各自可在 calendar.md 自訂年月日結構，但回寫端只需檔名一致。
    """
    days_offset = max(0, turn_no) // anchor.ticks_per_day
    total = anchor.day - 1 + days_offset
    day = (total % 30) + 1
    month_offset = total // 30
    month = ((anchor.month - 1 + month_offset) % 12) + 1
    year = anchor.year + (anchor.month - 1 + month_offset) // 12
    return f"Y{year:03d}-M{month:02d}-D{day:02d}"


def date_tag_for_event(meta: dict[str, Any] | None, sequence_no: int) -> str:
    """便利函式：直接從 campaign meta + event sequence_no 算 date_tag。"""
    return date_tag_for_turn(parse_anchor(meta), sequence_no)


def advance_anchor_by_days(anchor: CalendarAnchor, days: int) -> CalendarAnchor:
    """回傳「推進 N 天」後的新 anchor（不修改原物件）。"""
    total = anchor.day - 1 + days
    day = (total % 30) + 1
    month_offset = total // 30
    month = ((anchor.month - 1 + month_offset) % 12) + 1
    year_inc = (anchor.month - 1 + month_offset) // 12
    return CalendarAnchor(
        year=anchor.year + year_inc,
        month=month,
        day=day,
        ticks_per_day=anchor.ticks_per_day,
    )
