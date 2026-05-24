"""Writer 基礎：atomic write + dry-run preview。"""

from __future__ import annotations

import difflib
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from classifier.config import NOVEL_DB_ROOT, is_under_novel_db
from classifier.core import ClassifierOutput, Sensitivity
from classifier.rules import frontmatter as fm
from classifier.taxonomy import DESTINATION_REGISTRY, Destination, get_spec


class NovelDbWriteForbidden(RuntimeError):
    """偵測到要寫入 novel_db；自動工具一律拒絕。"""


def _assert_not_novel_db(path: Path) -> None:
    """硬性護欄：path 落在 NOVEL_DB_ROOT 之下 → 拋例外。

    這是最後一道閘；即使 caller 傳錯 target_root，也不會污染 novel_db。
    """
    if is_under_novel_db(path):
        raise NovelDbWriteForbidden(
            f"拒絕寫入 novel_db：{path}\n"
            f"NOVEL_DB_ROOT={NOVEL_DB_ROOT} 對所有自動化工具絕對唯讀。\n"
            f"請改用 staging working/ 路徑（見 classifier.staging.get_working_root）。"
        )


@dataclass
class WriterPreview:
    """dry-run 預覽：什麼會被寫、什麼會被建立、有什麼警告。"""

    destination: Destination
    target_path: Path
    is_new_file: bool
    old_text: str
    new_text: str
    warnings: list[str] = field(default_factory=list)

    @property
    def diff(self) -> str:
        if self.is_new_file:
            header = f"+++ {self.target_path} (new file)\n"
            return header + "".join(f"+ {line}\n" for line in self.new_text.splitlines())
        return "".join(
            difflib.unified_diff(
                self.old_text.splitlines(keepends=True),
                self.new_text.splitlines(keepends=True),
                fromfile=str(self.target_path),
                tofile=str(self.target_path),
                lineterm="",
            )
        )

    @property
    def is_noop(self) -> bool:
        return not self.is_new_file and self.old_text == self.new_text


class AtomicWriter:
    """寫到 tmp 檔 → fsync → os.replace。確保不會留下半寫狀態。"""

    @staticmethod
    def write(target: Path, text: str) -> None:
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp = target.with_suffix(target.suffix + ".tmp")
        data = text.encode("utf-8")
        # 用同一個 write-fd 做 write + flush + fsync；事後 os.replace。
        with open(tmp, "wb") as f:
            f.write(data)
            f.flush()
            try:
                os.fsync(f.fileno())
            except (OSError, AttributeError):
                # 部分 Windows 環境 / 特定檔系統不支援 fsync；不致命
                pass
        os.replace(tmp, target)


def resolve_target(output: ClassifierOutput, target_root: Path) -> Path:
    """把 spec.path_template 中的變數套入實際路徑。

    `target_root` 應該是 staging 的 working/ 路徑（**不能**是 NOVEL_DB_ROOT）。
    模板中歷史變數名仍為 `{novel_root}`，但實際填入 target_root，是命名遺留。
    """
    spec = get_spec(output.destination)
    hints = {**output.frontmatter, **output.schema_payload}

    # 收集所有可能的變數（{novel_root} 模板變數實際塞 target_root）
    fill = {
        "novel_root": str(target_root),
        "char_id": hints.get("char_id", "char_000"),
        "region_slug": hints.get("region_slug", "unknown_region"),
        "faction_slug": hints.get("faction_slug", "unknown_faction"),
        "slug": hints.get("slug") or hints.get("suggested_slug", "untitled"),
        "YYY": hints.get("year", "000"),
        "MM": hints.get("month", "01"),
        "DD": hints.get("day", "01"),
        "NNN": hints.get("number", "001"),
        "ts": hints.get("timestamp", "0000-00-00T00-00-00"),
    }
    # 把 hints 中明示的 YYY/MM/DD 拆出來（若分類器給的是 date_tag = Y000-M01-D01）
    if (date_tag := hints.get("date_tag")):
        # Format: Y{YYY}-M{MM}-D{DD}
        try:
            parts = date_tag.lstrip("Y").split("-")
            fill["YYY"] = parts[0]
            fill["MM"] = parts[1].lstrip("M")
            fill["DD"] = parts[2].lstrip("D")
        except (IndexError, ValueError):
            pass

    return Path(spec.path_template.format(**fill))


def write_preview(
    output: ClassifierOutput,
    target_root: Path,
    *,
    allow_nsfw: bool = False,
    existing_text: str | None = None,
) -> WriterPreview:
    """產生寫入預覽。實際寫入由 caller 在確認後呼叫 apply_preview。

    `target_root` 應為 staging working/ 路徑；落在 NOVEL_DB_ROOT 下時直接拒絕。
    `existing_text` 若給定，會用它作為現有檔內容（便於測試）；否則從磁碟讀。
    """
    from classifier.writers.dispatch import compose_new_text  # 避免循環

    _assert_not_novel_db(target_root)

    spec = get_spec(output.destination)
    warnings: list[str] = []

    if spec.sensitivity == Sensitivity.NSFW and not allow_nsfw:
        raise PermissionError(
            f"{output.destination} 是 NSFW destination；caller 必須傳 allow_nsfw=True。"
        )

    target = resolve_target(output, target_root)
    _assert_not_novel_db(target)  # 二次防線

    is_new_file = not target.exists() if existing_text is None else False
    if existing_text is None:
        old_text = "" if is_new_file else target.read_text(encoding="utf-8")
    else:
        old_text = existing_text

    new_text, extra_warnings = compose_new_text(output, old_text, spec)
    warnings.extend(extra_warnings)

    return WriterPreview(
        destination=Destination(output.destination),
        target_path=target,
        is_new_file=is_new_file,
        old_text=old_text,
        new_text=new_text,
        warnings=warnings,
    )


def apply_preview(preview: WriterPreview) -> None:
    """正式落地 dry-run preview。第三道 novel_db 防線。"""
    if preview.is_noop:
        return
    _assert_not_novel_db(preview.target_path)
    AtomicWriter.write(preview.target_path, preview.new_text)
