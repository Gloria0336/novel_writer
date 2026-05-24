"""分類器設定 — 路徑、閾值、模型 id。"""

from __future__ import annotations

import os
from pathlib import Path


def _find_backend_root() -> Path:
    """從此檔案位置往上找，定位到 backend/ 根目錄。"""
    here = Path(__file__).resolve()
    # classifier 套件在 backend/classifier/ 下，往上一層就是 backend/
    return here.parent.parent


BACKEND_ROOT: Path = Path(os.environ.get("NOVEL_WRITER_BACKEND", _find_backend_root()))
NOVEL_DB_ROOT: Path = BACKEND_ROOT / "novel_db"
TEMPLATE_ROOT: Path = NOVEL_DB_ROOT / "_template"

# 暫存區根目錄：所有 campaign 的 source_snapshot/working/exports 都掛在這下。
# **永遠與 NOVEL_DB_ROOT 完全分離**，是唯一允許寫入的根。
STAGING_ROOT: Path = Path(
    os.environ.get(
        "CLASSIFIER_STAGING_ROOT",
        BACKEND_ROOT / "game_db" / "opera" / "campaigns_staging",
    )
)

CONFIDENCE_THRESHOLD: float = float(os.environ.get("CLASSIFIER_CONFIDENCE_THRESHOLD", "0.65"))

DEFAULT_MODEL: str = os.environ.get("CLASSIFIER_LLM_MODEL", "claude-opus-4-7")

CACHE_DB_PATH: Path = Path(
    os.environ.get("CLASSIFIER_CACHE_DB", BACKEND_ROOT / "classifier" / ".cache.db")
)


def resolve_novel_root(novel_id: str) -> Path:
    """把 novel_id 解析為實際路徑，例如 novel_04_dungen → backend/novel_db/novel_04_dungen/。

    **僅供讀取用**；寫入請走 staging。
    """
    candidate = NOVEL_DB_ROOT / novel_id
    if not candidate.is_dir():
        raise FileNotFoundError(
            f"Novel '{novel_id}' not found under {NOVEL_DB_ROOT}. "
            f"Existing: {sorted(p.name for p in NOVEL_DB_ROOT.iterdir() if p.is_dir())}"
        )
    return candidate


def is_under_novel_db(path: Path) -> bool:
    """判斷 path 是否落在 NOVEL_DB_ROOT 之下（含 NOVEL_DB_ROOT 本身）。"""
    try:
        path.resolve().relative_to(NOVEL_DB_ROOT.resolve())
        return True
    except (ValueError, OSError):
        return False
