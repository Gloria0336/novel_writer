"""Destination 列舉 + DESTINATION_REGISTRY。

每個目的地描述：路徑樣板、寫入模式、敏感度、ID 前綴、是否需要 frontmatter。
schema_cls 暫時用 dict（Phase B 換成正式 pydantic schema）。
"""

from __future__ import annotations

from dataclasses import dataclass
try:
    from enum import StrEnum
except ImportError:
    from enum import Enum

    class StrEnum(str, Enum):
        pass

from classifier.core import Sensitivity, WriteMode


class Destination(StrEnum):
    BIBLE_CHARACTER = "bible_character"
    BIBLE_WORLDBUILDING = "bible_worldbuilding"
    BIBLE_SPECIES = "bible_species"

    CONTEXT_CURRENT = "context_current"
    CONTEXT_LAST_CHAPTER = "context_last_chapter"
    CONTEXT_SECRETS = "context_secrets"

    CONTEXT_NSFW_INTIMATE = "context_nsfw_intimate"
    CONTEXT_NSFW_CHAR_DETAILS = "context_nsfw_char_details"

    UPDATES_DAILY = "updates_daily"
    UPDATES_GOSSIPS = "updates_gossips"
    UPDATES_CURRENT_STATUS = "updates_current_status"

    REGIONS_INDEX = "regions_index"
    REGIONS_DETAIL = "regions_detail"
    REGIONS_ECOLOGY_YAML = "regions_ecology_yaml"

    FACTIONS_INDEX = "factions_index"
    FACTIONS_DETAIL = "factions_detail"

    CALENDAR_UPDATE = "calendar_update"

    TEMPS_DRAFT = "temps_draft"
    TEMPS_QUARANTINE = "temps_quarantine"


@dataclass(frozen=True)
class DestinationSpec:
    """Destination 的靜態描述。

    `path_template` 允許這些變數：
      {novel_root}, {char_id}, {region_slug}, {faction_slug},
      {YYY}, {MM}, {DD}, {NNN}, {slug}, {ts}
    """

    destination: Destination
    path_template: str
    write_mode: WriteMode
    sensitivity: Sensitivity
    requires_frontmatter: bool = False
    section_anchor_template: str | None = None
    id_prefix: str | None = None
    description: str = ""


DESTINATION_REGISTRY: dict[Destination, DestinationSpec] = {
    Destination.BIBLE_CHARACTER: DestinationSpec(
        destination=Destination.BIBLE_CHARACTER,
        path_template="{novel_root}/bible/character.md",
        write_mode=WriteMode.APPEND_SECTION,
        sensitivity=Sensitivity.PUBLIC,
        section_anchor_template="## {char_id}",
        id_prefix="char_",
        description="角色公開正史；每角色一個 ## 區段，依 char_id 鎖定。",
    ),
    Destination.BIBLE_WORLDBUILDING: DestinationSpec(
        destination=Destination.BIBLE_WORLDBUILDING,
        path_template="{novel_root}/bible/worldbuilding.md",
        write_mode=WriteMode.APPEND_SECTION,
        sensitivity=Sensitivity.PUBLIC,
        section_anchor_template="## {slug}",
        description="世界觀公開總覽。",
    ),
    Destination.BIBLE_SPECIES: DestinationSpec(
        destination=Destination.BIBLE_SPECIES,
        path_template="{novel_root}/bible/species.md",
        write_mode=WriteMode.APPEND_SECTION,
        sensitivity=Sensitivity.PUBLIC,
        section_anchor_template="## {slug}",
        description="種族 / 物種設定。",
    ),
    Destination.CONTEXT_CURRENT: DestinationSpec(
        destination=Destination.CONTEXT_CURRENT,
        path_template="{novel_root}/context/CONTEXT.md",
        write_mode=WriteMode.UPSERT_BLOCK,
        sensitivity=Sensitivity.PUBLIC,
        section_anchor_template="## {block_name}",
        description="AI 注入用的長篇連貫性核心摘要。",
    ),
    Destination.CONTEXT_LAST_CHAPTER: DestinationSpec(
        destination=Destination.CONTEXT_LAST_CHAPTER,
        path_template="{novel_root}/context/last-chapter-summary.md",
        write_mode=WriteMode.OVERWRITE,
        sensitivity=Sensitivity.PUBLIC,
        description="最近章節壓縮摘要。",
    ),
    Destination.CONTEXT_SECRETS: DestinationSpec(
        destination=Destination.CONTEXT_SECRETS,
        path_template="{novel_root}/context/secrets-lockbox.md",
        write_mode=WriteMode.UPSERT_ROW,
        sensitivity=Sensitivity.DIRECTOR_ONLY,
        id_prefix="secret-",
        description="作者後台秘密與未揭露真相；upsert 不刪。",
    ),
    Destination.CONTEXT_NSFW_INTIMATE: DestinationSpec(
        destination=Destination.CONTEXT_NSFW_INTIMATE,
        path_template="{novel_root}/context/nsfw/intimate.md",
        write_mode=WriteMode.APPEND_SECTION,
        sensitivity=Sensitivity.NSFW,
        requires_frontmatter=True,
        section_anchor_template="## {char_id}",
        description="角色私密 / R-18 設定，集中檔。",
    ),
    Destination.CONTEXT_NSFW_CHAR_DETAILS: DestinationSpec(
        destination=Destination.CONTEXT_NSFW_CHAR_DETAILS,
        path_template="{novel_root}/context/nsfw/ext_char_{NNN}_details.md",
        write_mode=WriteMode.CREATE_FILE,
        sensitivity=Sensitivity.NSFW,
        requires_frontmatter=True,
        id_prefix="ext_char_",
        description="單一角色 NSFW 擴充細節檔。",
    ),
    Destination.UPDATES_DAILY: DestinationSpec(
        destination=Destination.UPDATES_DAILY,
        path_template="{novel_root}/updates/daily/Y{YYY}-M{MM}-D{DD}.md",
        write_mode=WriteMode.APPEND_SECTION,
        sensitivity=Sensitivity.PUBLIC,
        section_anchor_template="## evt-{opera_id_short}",
        description="按劇中日期歸檔的每日動態；每個 opera 事件一個 ## evt-{opera_id_short} 區段，保證冪等。",
    ),
    Destination.UPDATES_GOSSIPS: DestinationSpec(
        destination=Destination.UPDATES_GOSSIPS,
        path_template="{novel_root}/updates/gossips/undated-rumor-{NNN}-{slug}.md",
        write_mode=WriteMode.CREATE_FILE,
        sensitivity=Sensitivity.PUBLIC,
        id_prefix="rumor-",
        description="未綁定日期的流言池。",
    ),
    Destination.UPDATES_CURRENT_STATUS: DestinationSpec(
        destination=Destination.UPDATES_CURRENT_STATUS,
        path_template="{novel_root}/updates/current_status.md",
        write_mode=WriteMode.OVERWRITE,
        sensitivity=Sensitivity.PUBLIC,
        description="最新世界狀態快照。",
    ),
    Destination.REGIONS_INDEX: DestinationSpec(
        destination=Destination.REGIONS_INDEX,
        path_template="{novel_root}/regions/region_index.md",
        write_mode=WriteMode.APPEND_LINE,
        sensitivity=Sensitivity.PUBLIC,
        description="區域索引表。",
    ),
    Destination.REGIONS_DETAIL: DestinationSpec(
        destination=Destination.REGIONS_DETAIL,
        path_template="{novel_root}/regions/{region_slug}_overview.md",
        write_mode=WriteMode.CREATE_FILE,
        sensitivity=Sensitivity.PUBLIC,
        id_prefix="region_",
        description="單一區域 / 層域詳細檔。",
    ),
    Destination.REGIONS_ECOLOGY_YAML: DestinationSpec(
        destination=Destination.REGIONS_ECOLOGY_YAML,
        path_template="{novel_root}/regions/abyss_ecology_catalog.yaml",
        write_mode=WriteMode.YAML_UPSERT,
        sensitivity=Sensitivity.PUBLIC,
        description="生態 / 礦產 / 物產 YAML 目錄。",
    ),
    Destination.FACTIONS_INDEX: DestinationSpec(
        destination=Destination.FACTIONS_INDEX,
        path_template="{novel_root}/factions/faction_index.md",
        write_mode=WriteMode.APPEND_LINE,
        sensitivity=Sensitivity.PUBLIC,
        description="勢力索引。",
    ),
    Destination.FACTIONS_DETAIL: DestinationSpec(
        destination=Destination.FACTIONS_DETAIL,
        path_template="{novel_root}/factions/{faction_slug}.md",
        write_mode=WriteMode.CREATE_FILE,
        sensitivity=Sensitivity.PUBLIC,
        id_prefix="faction_",
        description="單一勢力詳細檔。",
    ),
    Destination.CALENDAR_UPDATE: DestinationSpec(
        destination=Destination.CALENDAR_UPDATE,
        path_template="{novel_root}/calendar.md",
        write_mode=WriteMode.APPEND_LINE,
        sensitivity=Sensitivity.PUBLIC,
        description="行事曆條目追加。",
    ),
    Destination.TEMPS_DRAFT: DestinationSpec(
        destination=Destination.TEMPS_DRAFT,
        path_template="{novel_root}/temps/{slug}.md",
        write_mode=WriteMode.CREATE_FILE,
        sensitivity=Sensitivity.PUBLIC,
        description="作者草稿暫存。",
    ),
    Destination.TEMPS_QUARANTINE: DestinationSpec(
        destination=Destination.TEMPS_QUARANTINE,
        path_template="{novel_root}/temps/_quarantine/{ts}-{slug}.md",
        write_mode=WriteMode.CREATE_FILE,
        sensitivity=Sensitivity.PUBLIC,
        description="低信心或衝突 fallback 隔離區。",
    ),
}


def get_spec(destination: Destination | str) -> DestinationSpec:
    """取得 destination 的 spec，接受 enum 或字串。"""
    if isinstance(destination, str):
        destination = Destination(destination)
    return DESTINATION_REGISTRY[destination]
