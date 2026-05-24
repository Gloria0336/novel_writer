"""opera ORM → ClassifierInput 轉換層。

設計原則：
- 不直接 import opera 模型，改用 duck typing（任何有對應屬性的物件都可）。
  這讓 classifier 可獨立測試，並避免循環依賴。
- 每個 to_*_input 函式回傳 None 表示「該列不該被分類」（例如 visibility 過濾、
  非該類型 event）；caller 應自行 filter。
- 回傳的 ClassifierInput.hints 帶上 destination_hint，讓 router 可選擇略過 LLM 後援
  （opera 端來源通常已知該往哪走）。
"""

from __future__ import annotations

from typing import Any, Protocol

from classifier.core import ClassifierInput
from classifier.taxonomy import Destination

# ── duck-typed 介面 ────────────────────────────────────────────────────────


class _HasId(Protocol):
    id: str


class _WorldEntry(Protocol):
    id: str
    title: str
    category: str
    visibility_scope: str
    body: str
    tags_json: list[str]
    metadata_json: dict[str, Any]


class _ActorProfile(Protocol):
    id: str
    name: str
    role: str
    persona: str
    motives_json: list[str]
    visibility_policy_json: dict[str, Any]
    knowledge_scopes_json: list[str]
    secret_motives: str
    metadata_json: dict[str, Any]


class _DirectorNote(Protocol):
    id: str
    note_type: str
    title: str
    body: str
    payload_json: dict[str, Any]
    is_consumed: bool


class _GMBrief(Protocol):
    id: str
    title: str
    body: str
    payload_json: dict[str, Any]
    reveal_in_context: bool


class _StoryEvent(Protocol):
    id: str
    sequence_no: int
    event_kind: str
    source_channel: str
    actor_id: str | None
    title: str
    body: str
    visibility_scope: str
    payload_json: dict[str, Any]


# ── 個別轉換 ───────────────────────────────────────────────────────────────


_CATEGORY_TO_DEST: dict[str, Destination] = {
    "geography": Destination.REGIONS_DETAIL,
    "region": Destination.REGIONS_DETAIL,
    "history": Destination.BIBLE_WORLDBUILDING,
    "magic": Destination.BIBLE_WORLDBUILDING,
    "species": Destination.BIBLE_SPECIES,
    "faction": Destination.FACTIONS_DETAIL,
    "campaign": Destination.CONTEXT_CURRENT,
}


def world_entry_to_input(entry: _WorldEntry, novel_id: str) -> ClassifierInput | None:
    """world_entry → ClassifierInput。

    visibility_scope=director → CONTEXT_SECRETS
    其餘依 category → BIBLE_* / REGIONS_DETAIL / FACTIONS_DETAIL。
    """
    if entry.visibility_scope == "director":
        dest = Destination.CONTEXT_SECRETS
    else:
        dest = _CATEGORY_TO_DEST.get(entry.category.lower(), Destination.BIBLE_WORLDBUILDING)

    slug = _slugify(entry.title)
    fm_lines = [
        f"opera_id: {entry.id}",
        f"category: {entry.category}",
        f"visibility_scope: {entry.visibility_scope}",
        f"slug: {slug}",
        f"title: {entry.title}",
    ]
    if entry.tags_json:
        fm_lines.append("tags:")
        for tag in entry.tags_json:
            fm_lines.append(f"  - {tag}")

    # body 不含 H2 anchor — writer 依 spec 補上。CREATE_FILE 目的地的 H1 由 caller 透過 title 補。
    body_lines: list[str] = []
    if dest in {Destination.REGIONS_DETAIL, Destination.FACTIONS_DETAIL}:
        body_lines.append(f"# {entry.title}")
        body_lines.append("")
    body_lines.append(entry.body.rstrip())

    raw_text = (
        "---\n"
        + "\n".join(fm_lines)
        + "\n---\n"
        + "\n".join(body_lines)
        + "\n"
    )
    return ClassifierInput(
        source="opera_row",
        raw_text=raw_text,
        novel_id=novel_id,
        hints={
            "opera_table": "world_entries",
            "opera_id": entry.id,
            "destination_hint": dest.value,
            "slug": slug,
        },
    )


def actor_to_input(actor: _ActorProfile, novel_id: str) -> ClassifierInput | None:
    """actor → BIBLE_CHARACTER 區段。

    若 metadata_json 有 nsfw_profile，會另外產一份 CONTEXT_NSFW_CHAR_DETAILS（caller 需呼兩次）。
    """
    if actor.role == "gm":
        return None  # GM 不寫入 bible

    char_id = (actor.metadata_json or {}).get("char_id") or f"char_{actor.id[:6]}"

    # body 不含 H2 anchor — writer 依 spec.section_anchor_template 補 `## {char_id}`。
    body_lines = [
        "### 基本資料",
        "",
        f"- 姓名：{actor.name}",
        f"- 定位：{actor.role}",
        "",
        "### 性格",
        "",
        actor.persona.rstrip(),
        "",
        "### 公開目標",
        "",
    ]
    for motive in actor.motives_json or []:
        body_lines.append(f"- {motive}")

    raw_text = (
        "---\n"
        f"char_id: {char_id}\n"
        f"opera_id: {actor.id}\n"
        f"role: {actor.role}\n"
        "---\n"
        + "\n".join(body_lines)
        + "\n"
    )
    return ClassifierInput(
        source="opera_row",
        raw_text=raw_text,
        novel_id=novel_id,
        hints={
            "opera_table": "actor_profiles",
            "opera_id": actor.id,
            "char_id": char_id,
            "destination_hint": Destination.BIBLE_CHARACTER.value,
        },
    )


def actor_secret_to_input(actor: _ActorProfile, novel_id: str) -> ClassifierInput | None:
    """actor.secret_motives → CONTEXT_SECRETS（若非空）。"""
    if not actor.secret_motives or not actor.secret_motives.strip():
        return None
    char_id = (actor.metadata_json or {}).get("char_id") or f"char_{actor.id[:6]}"
    secret_id = f"secret-character-{char_id.removeprefix('char_')}"
    # body 不含 `## {secret_id}` — writer (UPSERT_ROW) 會以 secret_id 為 anchor 自動加。
    raw_text = (
        "---\n"
        f"secret_id: {secret_id}\n"
        f"char_ref: {char_id}\n"
        f"opera_id: {actor.id}\n"
        "---\n"
        f"{actor.secret_motives.rstrip()}\n"
    )
    return ClassifierInput(
        source="opera_row",
        raw_text=raw_text,
        novel_id=novel_id,
        hints={
            "opera_table": "actor_profiles.secret_motives",
            "opera_id": actor.id,
            "secret_id": secret_id,
            "destination_hint": Destination.CONTEXT_SECRETS.value,
        },
    )


def actor_nsfw_to_input(actor: _ActorProfile, novel_id: str) -> ClassifierInput | None:
    """actor.metadata_json.nsfw_profile → CONTEXT_NSFW_CHAR_DETAILS。"""
    profile = (actor.metadata_json or {}).get("nsfw_profile")
    if not profile:
        return None
    char_id = (actor.metadata_json or {}).get("char_id") or f"char_{actor.id[:6]}"
    nsfw_ref = f"ext_char_{char_id.removeprefix('char_')}"
    raw_text = (
        "---\n"
        f"nsfw_ref_id: {nsfw_ref}\n"
        f"bible_ref_id: {char_id}\n"
        f"opera_id: {actor.id}\n"
        "---\n"
        f"# {char_id} NSFW 設定\n\n"
        + _render_dict_as_md(profile)
    )
    return ClassifierInput(
        source="opera_row",
        raw_text=raw_text,
        novel_id=novel_id,
        hints={
            "opera_table": "actor_profiles.nsfw_profile",
            "opera_id": actor.id,
            "char_id": char_id,
            "destination_hint": Destination.CONTEXT_NSFW_CHAR_DETAILS.value,
            "number": char_id.removeprefix("char_") or "000",
        },
    )


def director_note_to_input(note: _DirectorNote, novel_id: str) -> ClassifierInput | None:
    """director note → CONTEXT_SECRETS。

    is_consumed=True 且 payload.reveal_target 存在 → 由 secrets_lifecycle 另外處理搬遷；
    此 adapter 只把 note 本身寫入 secrets，搬遷邏輯不在此。
    """
    secret_id = f"secret-{note.note_type}-{note.id[:6]}"
    # body 不含 `## {secret_id}` — UPSERT_ROW writer 自動加。
    raw_text = (
        "---\n"
        f"secret_id: {secret_id}\n"
        f"note_type: {note.note_type}\n"
        f"opera_id: {note.id}\n"
        f"is_consumed: {note.is_consumed}\n"
        "---\n"
        f"### {note.title}\n\n{note.body.rstrip()}\n"
    )
    return ClassifierInput(
        source="opera_row",
        raw_text=raw_text,
        novel_id=novel_id,
        hints={
            "opera_table": "director_notes",
            "opera_id": note.id,
            "secret_id": secret_id,
            "destination_hint": Destination.CONTEXT_SECRETS.value,
        },
    )


def gm_brief_to_input(brief: _GMBrief, novel_id: str) -> ClassifierInput | None:
    """GMBrief (reveal_in_context=True) → CONTEXT_CURRENT「下一章鉤子」block。"""
    if not brief.reveal_in_context:
        return None
    # body 不含 `## 下一章鉤子` — UPSERT_BLOCK writer 自動加。
    raw_text = (
        "---\n"
        f"block_name: 下一章鉤子\n"
        f"opera_id: {brief.id}\n"
        "---\n"
        f"### {brief.title}\n\n{brief.body.rstrip()}\n"
    )
    return ClassifierInput(
        source="opera_row",
        raw_text=raw_text,
        novel_id=novel_id,
        hints={
            "opera_table": "gm_briefs",
            "opera_id": brief.id,
            "destination_hint": Destination.CONTEXT_CURRENT.value,
        },
    )


def story_event_to_input(
    event: _StoryEvent, novel_id: str, *, date_tag: str | None = None
) -> ClassifierInput | None:
    """story event → UPDATES_DAILY / UPDATES_GOSSIPS / 觸發 reveal lifecycle。

    date_tag 由 caller 從 calendar_sync 推導；若 None 則 fallback Y000-M01-D01。
    """
    payload = event.payload_json or {}
    is_rumor = bool(payload.get("is_rumor"))
    kind = event.event_kind
    opera_id_short = event.id[:8]

    if kind == "dialogue" and is_rumor:
        dest = Destination.UPDATES_GOSSIPS
        slug_seed = event.title
        hints = {
            "opera_table": "story_events",
            "opera_id": event.id,
            "opera_id_short": opera_id_short,
            "destination_hint": dest.value,
            "slug": _slugify(slug_seed),
            # 用 opera_id_short 作為檔名 NNN 區段，確保冪等
            "number": opera_id_short,
        }
    elif kind in {"scene", "combat", "exploration", "resolution", "dialogue"}:
        dest = Destination.UPDATES_DAILY
        tag = date_tag or "Y000-M01-D01"
        hints = {
            "opera_table": "story_events",
            "opera_id": event.id,
            "opera_id_short": opera_id_short,
            "destination_hint": dest.value,
            "date_tag": tag,
        }
    elif kind == "reveal":
        # secrets-lifecycle 觸發點：classifier router 端再讀 hints.reveal_target
        dest = Destination.CONTEXT_SECRETS
        secret_id = f"secret-reveal-{opera_id_short}"
        hints = {
            "opera_table": "story_events",
            "opera_id": event.id,
            "opera_id_short": opera_id_short,
            "secret_id": secret_id,
            "destination_hint": dest.value,
            "reveal_target": payload.get("reveal_target"),
        }
    else:
        return None  # 未知 kind，跳過

    # body 不含 H2 — writer 依 spec.section_anchor_template 補；UPDATES_DAILY 用 evt-{opera_id_short}
    raw_text = (
        "---\n"
        f"opera_id: {event.id}\n"
        f"opera_id_short: {opera_id_short}\n"
        f"event_kind: {kind}\n"
        f"sequence_no: {event.sequence_no}\n"
        + (f"date_tag: {hints.get('date_tag')}\n" if hints.get("date_tag") else "")
        + (f"secret_id: {hints['secret_id']}\n" if "secret_id" in hints else "")
        + (f"slug: {hints['slug']}\n" if "slug" in hints else "")
        + (f"number: {hints['number']}\n" if "number" in hints else "")
        + "---\n"
        f"### {event.title}\n\n{event.body.rstrip()}\n"
    )
    return ClassifierInput(
        source="opera_row",
        raw_text=raw_text,
        novel_id=novel_id,
        hints=hints,
    )


# ── 高階：批次 collect ─────────────────────────────────────────────────────


def collect_inputs(
    *,
    novel_id: str,
    world_entries: list[_WorldEntry] | None = None,
    actors: list[_ActorProfile] | None = None,
    director_notes: list[_DirectorNote] | None = None,
    gm_briefs: list[_GMBrief] | None = None,
    story_events: list[_StoryEvent] | None = None,
    date_tag: str | None = None,
) -> list[ClassifierInput]:
    """把一個 opera campaign 的所有可分類列轉成 ClassifierInput list。"""
    inputs: list[ClassifierInput] = []

    for entry in world_entries or []:
        if (inp := world_entry_to_input(entry, novel_id)) is not None:
            inputs.append(inp)

    for actor in actors or []:
        if (inp := actor_to_input(actor, novel_id)) is not None:
            inputs.append(inp)
        if (inp := actor_secret_to_input(actor, novel_id)) is not None:
            inputs.append(inp)
        if (inp := actor_nsfw_to_input(actor, novel_id)) is not None:
            inputs.append(inp)

    for note in director_notes or []:
        if (inp := director_note_to_input(note, novel_id)) is not None:
            inputs.append(inp)

    for brief in gm_briefs or []:
        if (inp := gm_brief_to_input(brief, novel_id)) is not None:
            inputs.append(inp)

    for event in story_events or []:
        if (inp := story_event_to_input(event, novel_id, date_tag=date_tag)) is not None:
            inputs.append(inp)

    return inputs


# ── 小工具 ────────────────────────────────────────────────────────────────


def _slugify(text: str) -> str:
    import re

    text = re.sub(r"[\s　\-_/\\]+", "-", text.strip())
    text = re.sub(r"[^\w一-鿿\-]+", "", text)
    return text.strip("-")[:60] or "untitled"


def _render_dict_as_md(data: Any, indent: int = 0) -> str:
    """簡易把 dict / list 轉成 markdown bullets。"""
    lines: list[str] = []
    prefix = "  " * indent
    if isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                lines.append(f"{prefix}- **{k}**：")
                lines.append(_render_dict_as_md(v, indent + 1))
            else:
                lines.append(f"{prefix}- **{k}**：{v}")
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, (dict, list)):
                lines.append(_render_dict_as_md(item, indent))
            else:
                lines.append(f"{prefix}- {item}")
    else:
        lines.append(f"{prefix}{data}")
    return "\n".join(lines)
