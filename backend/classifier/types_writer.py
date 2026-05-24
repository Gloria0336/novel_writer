"""Writer 共用的小型型別 — 抽出避免循環 import。"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ComposeWarning:
    code: str
    message: str


ComposeResult = tuple[str, list[ComposeWarning]]
