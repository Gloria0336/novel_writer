"""Secrets-leak linter — 寫入 PUBLIC destination 前，掃描內容是否含 secrets 字串。

讀取 staging working/ 下 `context/secrets-lockbox.md` 的 detail block，
把每個 `## secret-xxx-NNN` 區段的內文當「禁止字串」。
若 PUBLIC writes 含任何禁止字串，回 leak warning（caller 決定是否硬擋）。
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from classifier.core import Sensitivity
from classifier.taxonomy import Destination, get_spec


_SECRET_SECTION = re.compile(r"^##\s+(secret-[a-z][a-z0-9_]*-[a-z0-9]+)\s*$", re.MULTILINE)
# 最小被掃描子字串長度（避免短字串誤判）
MIN_LEAK_FRAGMENT = 12


@dataclass(frozen=True)
class LeakWarning:
    secret_id: str
    fragment: str  # 命中的子字串
    truncated_context: str  # body 中的上下文摘要


def load_secret_fragments(target_root: Path) -> dict[str, list[str]]:
    """讀 working/ 下 context/secrets-lockbox.md，回 {secret_id: [fragment, ...]}。

    fragment 取自每個 secret block 的字行：行長度 >= MIN_LEAK_FRAGMENT 的非空行。
    若 lockbox 不存在或為空，回空 dict（即不啟用 leak guard）。
    """
    lockbox = target_root / "context" / "secrets-lockbox.md"
    if not lockbox.exists():
        return {}
    text = lockbox.read_text(encoding="utf-8")
    out: dict[str, list[str]] = {}
    matches = list(_SECRET_SECTION.finditer(text))
    for i, m in enumerate(matches):
        secret_id = m.group(1)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end]
        fragments = [
            line.strip()
            for line in block.splitlines()
            if line.strip() and len(line.strip()) >= MIN_LEAK_FRAGMENT and not line.strip().startswith("#")
        ]
        if fragments:
            out[secret_id] = fragments
    return out


def scan_for_leaks(
    destination: Destination | str,
    body_text: str,
    target_root: Path,
) -> list[LeakWarning]:
    """若 destination 是 PUBLIC，掃描 body 是否含任一 secret fragment。

    非 PUBLIC destination 一律回空 list（secrets / nsfw 本來就允許機密內容）。
    """
    spec = get_spec(destination)
    if spec.sensitivity != Sensitivity.PUBLIC:
        return []

    fragments_by_secret = load_secret_fragments(target_root)
    if not fragments_by_secret:
        return []

    warnings: list[LeakWarning] = []
    for secret_id, fragments in fragments_by_secret.items():
        for frag in fragments:
            idx = body_text.find(frag)
            if idx == -1:
                continue
            ctx_start = max(0, idx - 30)
            ctx_end = min(len(body_text), idx + len(frag) + 30)
            warnings.append(
                LeakWarning(
                    secret_id=secret_id,
                    fragment=frag[:80],
                    truncated_context="…" + body_text[ctx_start:ctx_end] + "…",
                )
            )
    return warnings


class SecretLeakError(RuntimeError):
    """偵測到 secrets 內文洩漏到 PUBLIC destination。"""

    def __init__(self, warnings: list[LeakWarning]):
        self.warnings = warnings
        super().__init__(
            f"偵測到 {len(warnings)} 筆 secrets-leak；refused。第一筆：{warnings[0].secret_id} → "
            f"{warnings[0].truncated_context}"
        )
