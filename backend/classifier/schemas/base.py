"""schema base — 所有 destination payload 的共同欄位。"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DestinationPayload(BaseModel):
    """寫入目的地檔案前的中介結構。

    `frontmatter` 與 `body_md` 對應 writer 的兩個寫入區塊。
    `extra` 保留 destination 特定欄位，Phase B 各子類補上強型別。
    """

    model_config = ConfigDict(extra="allow")

    frontmatter: dict[str, Any] = Field(default_factory=dict)
    body_md: str = ""
    extra: dict[str, Any] = Field(default_factory=dict)
