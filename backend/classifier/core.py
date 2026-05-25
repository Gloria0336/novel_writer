"""核心資料型別 — 分類器的輸入、輸出、列舉。"""

from __future__ import annotations

try:
    from enum import StrEnum
except ImportError:
    from enum import Enum

    class StrEnum(str, Enum):
        pass
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class Sensitivity(StrEnum):
    """目的地的敏感度等級。控制是否需要 caller 明確授權。"""

    PUBLIC = "public"
    DIRECTOR_ONLY = "director_only"
    NSFW = "nsfw"


class WriteMode(StrEnum):
    """Writer 對目的地檔案的寫入模式。"""

    APPEND_SECTION = "append_section"
    APPEND_LINE = "append_line"
    CREATE_FILE = "create_file"
    UPSERT_ROW = "upsert_row"
    UPSERT_BLOCK = "upsert_block"
    OVERWRITE = "overwrite"
    YAML_UPSERT = "yaml_upsert"


SourceKind = Literal["paste", "opera_row", "file_scan"]


class ClassifierInput(BaseModel):
    """分類器輸入：raw 內容 + 來源提示。"""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    source: SourceKind
    raw_text: str
    novel_id: str
    hints: dict[str, Any] = Field(default_factory=dict)
    attachments: list[Path] = Field(default_factory=list)


class ClassifierOutput(BaseModel):
    """分類器輸出（空間軸）：目的地 + 解析後內容 + 信心。

    認知軸（MemoryDistribution）由 cognitive_router 另外產生並合併。
    """

    destination: str  # Destination enum value
    suggested_path: Path
    frontmatter: dict[str, Any] = Field(default_factory=dict)
    body_md: str
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str = ""
    schema_payload: dict[str, Any] = Field(default_factory=dict)


class HeuristicHit(BaseModel):
    """啟發式偵測結果。"""

    destination: str
    confidence: float = Field(ge=0.0, le=1.0)
    matched_pattern: str
    extracted_hints: dict[str, Any] = Field(default_factory=dict)
