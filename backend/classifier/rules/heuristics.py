"""啟發式分類偵測器 — regex / keyword / 結構特徵。

依序執行（`detect_all` 回所有命中，`detect_best` 回最高信心命中）。
LLM 後援只在這層全部 miss 或最高信心 < threshold 時才啟動。
"""

from __future__ import annotations

import re
from typing import Callable

from classifier.rules import frontmatter as fm
from classifier.core import ClassifierInput, HeuristicHit
from classifier.taxonomy import Destination

# ── regex 庫 ────────────────────────────────────────────────────────────────

_SECRET_TOKEN = re.compile(r"\bsecret-[a-z][a-z0-9_]*-\d+\b", re.IGNORECASE)
_CHAR_ID = re.compile(r"\bchar_\d{2,4}\b")
_EXT_CHAR_ID = re.compile(r"\bext_char_\d{2,4}\b")
_REGION_SLUG_ID = re.compile(r"\b[a-z_]+_layer_\d{3}\b|\bregion_[a-z_]+\b")
_DATE_TAG = re.compile(r"\bY\d{3}-M\d{2}-D\d{2}\b")
_RUMOR_HEADING = re.compile(r"^#{1,3}\s+.*(流言|傳聞|耳語|rumor|gossip)", re.IGNORECASE | re.MULTILINE)
_UNDATED_RUMOR_FILENAME = re.compile(r"undated-rumor-\d{1,4}", re.IGNORECASE)
_NSFW_MARKERS = re.compile(
    r"\b(nsfw_ref_id|intimate_dynamic|physical_sensitivity|behavioral_kinks|R[-_]?18)\b",
    re.IGNORECASE,
)
_REGION_TABLE_HEADER = re.compile(
    r"^\|\s*(區域|Region)\s*\|\s*(檔案|File)\s*\|", re.IGNORECASE | re.MULTILINE
)
_FACTION_TABLE_HEADER = re.compile(
    r"^\|\s*(勢力|Faction)\s*\|", re.IGNORECASE | re.MULTILINE
)
_YAML_ECOLOGY_HINT = re.compile(r"^(layers:|schema_notes:|abyss_ecology)", re.MULTILINE)
_CURRENT_STATUS_HINT = re.compile(r"current[\s_-]?status|當前狀態|世界狀態快照", re.IGNORECASE)
_CONTEXT_INJECTION_HINT = re.compile(r"AI[\s_-]?injection|長篇連貫性|核心摘要", re.IGNORECASE)
_LAST_CHAPTER_HINT = re.compile(r"last[\s_-]?chapter[\s_-]?summary|上一章摘要", re.IGNORECASE)
_SPECIES_HEADER = re.compile(r"^#{1,2}\s+.*(種族|物種|species)", re.IGNORECASE | re.MULTILINE)
_WORLDBUILDING_HINT = re.compile(r"world[\s_-]?building|世界觀總覽|世界設定", re.IGNORECASE)
_CALENDAR_HINT = re.compile(r"\bcalendar(\.md)?\b|曆法|月份|紀年", re.IGNORECASE)

# ── 偵測器 ─────────────────────────────────────────────────────────────────

DetectorFn = Callable[[ClassifierInput, dict, str], HeuristicHit | None]


def _detect_explicit_frontmatter(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    """frontmatter 直接寫了 destination 或 nsfw_ref_id。"""
    if (dest_raw := fm_dict.get("destination")):
        try:
            dest = Destination(dest_raw)
            return HeuristicHit(
                destination=dest.value,
                confidence=1.0,
                matched_pattern="frontmatter.destination",
                extracted_hints={"frontmatter": fm_dict},
            )
        except ValueError:
            pass
    if "nsfw_ref_id" in fm_dict or _EXT_CHAR_ID.search(str(fm_dict.get("nsfw_ref_id", ""))):
        return HeuristicHit(
            destination=Destination.CONTEXT_NSFW_CHAR_DETAILS.value,
            confidence=0.95,
            matched_pattern="frontmatter.nsfw_ref_id",
            extracted_hints={"frontmatter": fm_dict},
        )
    return None


def _detect_secret_token(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    if not (match := _SECRET_TOKEN.search(body)):
        return None
    return HeuristicHit(
        destination=Destination.CONTEXT_SECRETS.value,
        confidence=0.9,
        matched_pattern="secret_token",
        extracted_hints={"secret_id": match.group(0).lower()},
    )


def _detect_daily_date(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    # 檔名或 H1 含 Y000-M01-D01
    search_pool = (input_.hints.get("filename", "") or "") + "\n" + body[:500]
    if not (match := _DATE_TAG.search(search_pool)):
        return None
    return HeuristicHit(
        destination=Destination.UPDATES_DAILY.value,
        confidence=0.85,
        matched_pattern="date_tag",
        extracted_hints={"date_tag": match.group(0)},
    )


def _detect_gossip(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    fname = input_.hints.get("filename", "") or ""
    if _UNDATED_RUMOR_FILENAME.search(fname):
        return HeuristicHit(
            destination=Destination.UPDATES_GOSSIPS.value,
            confidence=0.95,
            matched_pattern="undated_rumor_filename",
        )
    if _RUMOR_HEADING.search(body):
        return HeuristicHit(
            destination=Destination.UPDATES_GOSSIPS.value,
            confidence=0.75,
            matched_pattern="rumor_heading",
        )
    return None


def _detect_nsfw(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    if not _NSFW_MARKERS.search(body):
        return None
    # 若指明特定角色 → CHAR_DETAILS；否則 INTIMATE
    if (match := _EXT_CHAR_ID.search(body)) or (match := _CHAR_ID.search(body)):
        return HeuristicHit(
            destination=Destination.CONTEXT_NSFW_CHAR_DETAILS.value,
            confidence=0.85,
            matched_pattern="nsfw_markers+char_id",
            extracted_hints={"char_id": match.group(0)},
        )
    return HeuristicHit(
        destination=Destination.CONTEXT_NSFW_INTIMATE.value,
        confidence=0.75,
        matched_pattern="nsfw_markers",
    )


def _detect_character(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    if not (match := _CHAR_ID.search(body)):
        return None
    return HeuristicHit(
        destination=Destination.BIBLE_CHARACTER.value,
        confidence=0.8,
        matched_pattern="char_id",
        extracted_hints={"char_id": match.group(0)},
    )


def _detect_region(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    if _REGION_TABLE_HEADER.search(body):
        return HeuristicHit(
            destination=Destination.REGIONS_INDEX.value,
            confidence=0.85,
            matched_pattern="region_table_header",
        )
    if _YAML_ECOLOGY_HINT.search(body):
        return HeuristicHit(
            destination=Destination.REGIONS_ECOLOGY_YAML.value,
            confidence=0.9,
            matched_pattern="yaml_ecology",
        )
    if (match := _REGION_SLUG_ID.search(body)):
        return HeuristicHit(
            destination=Destination.REGIONS_DETAIL.value,
            confidence=0.7,
            matched_pattern="region_slug",
            extracted_hints={"region_slug": match.group(0)},
        )
    return None


def _detect_faction(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    if _FACTION_TABLE_HEADER.search(body):
        return HeuristicHit(
            destination=Destination.FACTIONS_INDEX.value,
            confidence=0.8,
            matched_pattern="faction_table_header",
        )
    return None


def _detect_species(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    if _SPECIES_HEADER.search(body):
        return HeuristicHit(
            destination=Destination.BIBLE_SPECIES.value,
            confidence=0.75,
            matched_pattern="species_header",
        )
    return None


def _detect_context_files(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    fname = (input_.hints.get("filename", "") or "").lower()
    if "current_status" in fname or _CURRENT_STATUS_HINT.search(body[:300]):
        return HeuristicHit(
            destination=Destination.UPDATES_CURRENT_STATUS.value,
            confidence=0.8,
            matched_pattern="current_status_hint",
        )
    if "last-chapter-summary" in fname or _LAST_CHAPTER_HINT.search(body[:300]):
        return HeuristicHit(
            destination=Destination.CONTEXT_LAST_CHAPTER.value,
            confidence=0.85,
            matched_pattern="last_chapter_hint",
        )
    if "context.md" in fname or _CONTEXT_INJECTION_HINT.search(body[:300]):
        return HeuristicHit(
            destination=Destination.CONTEXT_CURRENT.value,
            confidence=0.8,
            matched_pattern="context_injection_hint",
        )
    return None


def _detect_worldbuilding(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    if _WORLDBUILDING_HINT.search(body[:500]):
        return HeuristicHit(
            destination=Destination.BIBLE_WORLDBUILDING.value,
            confidence=0.7,
            matched_pattern="worldbuilding_hint",
        )
    return None


def _detect_calendar(input_: ClassifierInput, fm_dict: dict, body: str) -> HeuristicHit | None:
    fname = (input_.hints.get("filename", "") or "").lower()
    if "calendar" in fname:
        return HeuristicHit(
            destination=Destination.CALENDAR_UPDATE.value,
            confidence=0.85,
            matched_pattern="calendar_filename",
        )
    return None


# 順序：信心高 / 特異性強的優先
_DETECTORS: list[DetectorFn] = [
    _detect_explicit_frontmatter,
    _detect_secret_token,
    _detect_gossip,
    _detect_daily_date,
    _detect_nsfw,
    _detect_calendar,
    _detect_context_files,
    _detect_region,
    _detect_faction,
    _detect_species,
    _detect_character,
    _detect_worldbuilding,
]


def detect_all(input_: ClassifierInput) -> list[HeuristicHit]:
    """跑所有偵測器，回所有命中。"""
    fm_dict, body = fm.parse(input_.raw_text)
    hits: list[HeuristicHit] = []
    for detector in _DETECTORS:
        if (hit := detector(input_, fm_dict, body)) is not None:
            hits.append(hit)
    return hits


def detect_best(input_: ClassifierInput) -> HeuristicHit | None:
    """回最高信心的命中；空 list 回 None。

    同信心時，先註冊（特異性高）者勝。
    """
    hits = detect_all(input_)
    if not hits:
        return None
    return max(hits, key=lambda h: h.confidence)
