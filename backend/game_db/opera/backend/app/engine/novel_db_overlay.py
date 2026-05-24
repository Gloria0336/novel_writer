"""讀 novel_db/{novel_id}/ 的 markdown / yaml，產出 opera bootstrap / overlay 用的結構。

Phase C 範圍：
- `parse_character_md` — 從 bible/character.md 拆出每個 char_id 區段
- `parse_worldbuilding_md` — 從 bible/worldbuilding.md 拆出世界觀區段
- `load_bible_bundle(novel_id)` — 高階：把 bible + context 載入成 dict bundle
- `overlay_for_*` — 給 context_policy 接的 overlay slice

不依賴 opera ORM；純 markdown / yaml 解析。
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


def _resolve_backend_root() -> Path:
    """從本檔位置（opera/backend/app/engine/）往上找到 backend/。"""
    here = Path(__file__).resolve()
    # ../../../../../ → opera/backend/app/engine -> opera/backend/app -> opera/backend -> opera -> game_db -> backend
    return here.parents[5]


BACKEND_ROOT = Path(os.environ.get("NOVEL_WRITER_BACKEND", _resolve_backend_root()))
NOVEL_DB_ROOT = BACKEND_ROOT / "novel_db"


def resolve_novel_root(novel_id: str) -> Path:
    return NOVEL_DB_ROOT / novel_id


# ── 資料結構 ───────────────────────────────────────────────────────────────


@dataclass
class CharacterSection:
    char_id: str
    title: str
    body_md: str
    frontmatter: dict[str, Any] = field(default_factory=dict)


@dataclass
class WorldSection:
    slug: str
    title: str
    body_md: str


@dataclass
class BibleBundle:
    novel_id: str
    characters: list[CharacterSection] = field(default_factory=list)
    world_sections: list[WorldSection] = field(default_factory=list)
    context_current: str = ""
    last_chapter_summary: str = ""
    secrets_lockbox: str = ""  # director-only
    current_status: str = ""


# ── 解析 ───────────────────────────────────────────────────────────────────


_CHAR_HEADING = re.compile(r"^##\s+(?P<id>[A-Za-z0-9_\-]+)\s*$", re.MULTILINE)
_H2_HEADING = re.compile(r"^##\s+(?P<title>.+?)\s*$", re.MULTILINE)
_RULE = re.compile(r"^\s*---\s*$", re.MULTILINE)


def _split_by_h2(text: str) -> list[tuple[str, str]]:
    """切 ## 區段：回 [(heading, body), ...]。

    body 含 heading 下方至下一個 ## 之前的所有內容。
    """
    matches = list(_H2_HEADING.finditer(text))
    out: list[tuple[str, str]] = []
    for i, m in enumerate(matches):
        title = m.group("title").strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip("\n")
        # 移除尾端的 horizontal rule
        body = _RULE.sub("", body).strip("\n")
        out.append((title, body))
    return out


def parse_character_md(path: Path) -> list[CharacterSection]:
    """把 bible/character.md 拆成 CharacterSection list。

    認得的 char_id 樣式：char_NNN、planned-protagonist、英數 slug。
    跳過 "## 群像狀態總表" 等明顯不是角色的標題。
    """
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    sections = []
    for title, body in _split_by_h2(text):
        # 過濾掉明顯不是角色的 ## 標題
        if title in {"使用規則", "群像狀態總表", "Character", "說明"}:
            continue
        if "|" in title:  # table header that leaked through
            continue
        char_id = title
        sections.append(
            CharacterSection(
                char_id=char_id,
                title=title,
                body_md=body,
                frontmatter={"source_file": str(path)},
            )
        )
    return sections


def parse_worldbuilding_md(path: Path) -> list[WorldSection]:
    """把 bible/worldbuilding.md 拆成 WorldSection list。"""
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    out: list[WorldSection] = []
    for title, body in _split_by_h2(text):
        slug = re.sub(r"\s+", "_", title.lower())[:60]
        out.append(WorldSection(slug=slug, title=title, body_md=body))
    return out


def _read_or_empty(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def load_bible_bundle(novel_id: str) -> BibleBundle:
    """讀整個 novel_db/{novel_id}/bible/ + context/ → BibleBundle。"""
    root = resolve_novel_root(novel_id)
    if not root.is_dir():
        raise FileNotFoundError(f"novel '{novel_id}' not found at {root}")

    return BibleBundle(
        novel_id=novel_id,
        characters=parse_character_md(root / "bible" / "character.md"),
        world_sections=parse_worldbuilding_md(root / "bible" / "worldbuilding.md"),
        context_current=_read_or_empty(root / "context" / "CONTEXT.md"),
        last_chapter_summary=_read_or_empty(root / "context" / "last-chapter-summary.md"),
        secrets_lockbox=_read_or_empty(root / "context" / "secrets-lockbox.md"),
        current_status=_read_or_empty(root / "updates" / "current_status.md"),
    )


# ── overlay slice：給 context_policy 用 ────────────────────────────────────


def overlay_for_director(bundle: BibleBundle) -> dict[str, Any]:
    """Director 看全部，含 secrets-lockbox。"""
    return {
        "novel_id": bundle.novel_id,
        "characters": [_char_to_dict(c) for c in bundle.characters],
        "world_sections": [_world_to_dict(w) for w in bundle.world_sections],
        "context_current": bundle.context_current,
        "current_status": bundle.current_status,
        "last_chapter_summary": bundle.last_chapter_summary,
        "secrets_lockbox": bundle.secrets_lockbox,  # Director only
    }


def overlay_for_gm(bundle: BibleBundle) -> dict[str, Any]:
    """GM 看公開正史 + 當前狀態，不看 secrets-lockbox。"""
    return {
        "novel_id": bundle.novel_id,
        "characters": [_char_to_dict(c) for c in bundle.characters],
        "world_sections": [_world_to_dict(w) for w in bundle.world_sections],
        "context_current": bundle.context_current,
        "current_status": bundle.current_status,
        "last_chapter_summary": bundle.last_chapter_summary,
    }


def overlay_for_actor(bundle: BibleBundle, actor: Any) -> dict[str, Any]:
    """Actor 看依 knowledge_scopes 過濾後的子集。

    actor 需有 `knowledge_scopes_json: list[str]` 屬性。"all" 等同 GM view。
    比對 frontmatter / world_section title 中是否含對應 scope tag。
    """
    scopes = set(getattr(actor, "knowledge_scopes_json", []) or [])
    if "all" in scopes:
        return overlay_for_gm(bundle)

    visible_world = [
        _world_to_dict(w)
        for w in bundle.world_sections
        if _section_matches_scopes(w.title + " " + w.body_md[:200], scopes)
    ]
    visible_chars = [
        _char_to_dict(c)
        for c in bundle.characters
        if _section_matches_scopes(c.title + " " + c.body_md[:200], scopes)
        or c.char_id == (actor.metadata_json or {}).get("char_id")
    ]
    return {
        "novel_id": bundle.novel_id,
        "characters": visible_chars,
        "world_sections": visible_world,
        "context_current": bundle.context_current,  # public summary; actors can see broad strokes
        # 不含 secrets / last_chapter / status
    }


def _section_matches_scopes(text: str, scopes: set[str]) -> bool:
    if not scopes:
        return False
    text_lower = text.lower()
    return any(scope.lower() in text_lower for scope in scopes)


def _char_to_dict(c: CharacterSection) -> dict[str, Any]:
    return {
        "char_id": c.char_id,
        "title": c.title,
        "body_md": c.body_md,
        "frontmatter": c.frontmatter,
    }


def _world_to_dict(w: WorldSection) -> dict[str, Any]:
    return {"slug": w.slug, "title": w.title, "body_md": w.body_md}
