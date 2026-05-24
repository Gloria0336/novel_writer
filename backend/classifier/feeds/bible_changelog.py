"""Bible 變更日誌 — 每次 staging 寫入後在 working/context/_changelog.md 留紀錄。

格式（追加表格列）：
    | 時間 | destination | rel_path | opera_id | summary |

讓作者反向整合時能快速看「這次 campaign 影響了哪些檔案、為什麼」。
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from classifier.core import ClassifierOutput
from classifier.taxonomy import Destination

CHANGELOG_REL_PATH = "context/_changelog.md"

_HEADER = """# 本 campaign 變更日誌

> 自動由 classifier writer 維護；列出每次 staging 寫入的 destination、檔案、opera 來源。
> 作者反向整合到 novel_db 時可依此清單逐項審閱。

| 時間 (UTC) | destination | 檔案 | opera_id | 摘要 |
| --- | --- | --- | --- | --- |
"""


def _ensure_header(path: Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(_HEADER, encoding="utf-8")


def append_entry(
    target_root: Path,
    *,
    output: ClassifierOutput,
    target_path: Path,
    summary: str = "",
) -> None:
    """在 target_root/context/_changelog.md 追加一列。"""
    log_path = target_root / CHANGELOG_REL_PATH
    _ensure_header(log_path)

    ts = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        rel = str(target_path.relative_to(target_root)).replace("\\", "/")
    except ValueError:
        rel = str(target_path)
    opera_id = output.frontmatter.get("opera_id") or output.schema_payload.get("opera_id") or ""
    summary = summary or _derive_summary(output)
    row = f"| {ts} | `{output.destination}` | `{rel}` | `{opera_id}` | {summary} |\n"

    # 追加；避免重複（idempotent 跑 sync 不該重複加同一列）
    existing = log_path.read_text(encoding="utf-8")
    if row in existing:
        return
    with log_path.open("a", encoding="utf-8") as f:
        f.write(row)


def _derive_summary(output: ClassifierOutput) -> str:
    """摘要：第一行有意義文字，最多 80 字。"""
    body = output.body_md.strip().splitlines()
    for line in body:
        stripped = line.strip().lstrip("#").lstrip("-").strip()
        if stripped and not stripped.startswith("|"):
            return stripped[:80].replace("|", "\\|")
    return ""
