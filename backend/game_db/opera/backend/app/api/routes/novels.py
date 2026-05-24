from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter

from backend.app.engine import novel_db_overlay
from backend.app.schemas import NovelSummary


router = APIRouter()
_EXCLUDED_DIRS = {"_exports", "_template", "__pycache__"}


def _readme_summary(root: Path) -> str:
    readme = root / "README.md"
    if not readme.exists():
        return ""
    lines = readme.read_text(encoding="utf-8").splitlines()
    paragraph: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if paragraph:
                break
            continue
        if stripped.startswith("#") or stripped.startswith("- `"):
            continue
        paragraph.append(stripped)
    return " ".join(paragraph)[:280]


@router.get("", response_model=list[NovelSummary])
def list_novels() -> list[NovelSummary]:
    summaries: list[NovelSummary] = []
    root = novel_db_overlay.NOVEL_DB_ROOT
    if not root.exists():
        return summaries

    for novel_root in sorted(path for path in root.iterdir() if path.is_dir()):
        if novel_root.name in _EXCLUDED_DIRS or novel_root.name.startswith("."):
            continue
        try:
            bundle = novel_db_overlay.load_bible_bundle(novel_root.name)
            characters = [
                {"char_id": character.char_id, "title": character.title}
                for character in bundle.characters
            ]
            world_section_count = len(bundle.world_sections)
        except FileNotFoundError:
            characters = []
            world_section_count = 0
        summaries.append(
            NovelSummary(
                novel_id=novel_root.name,
                readme_summary=_readme_summary(novel_root),
                characters=characters,
                world_section_count=world_section_count,
            )
        )
    return summaries
