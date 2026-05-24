from __future__ import annotations

from typing import Any

from backend.app.engine import novel_db_overlay


def build_default_rulebook() -> dict[str, Any]:
    return {
        "name": "Opera 核心規則",
        "version": "0.1.0",
        "dice": {"primary": "d20", "damage": "d6"},
        "attributes": {
            "might": "身體力量、耐力與戰鬥壓制力。",
            "grace": "潛行、機動性、技巧性與反應速度。",
            "wit": "調查、感知、戰術與推理能力。",
            "spirit": "意志、共感、秘術掌控與精神強度。",
        },
        "skills": {
            "combat": {"attribute": "might", "keywords": ["attack", "fight", "strike", "guard"]},
            "stealth": {"attribute": "grace", "keywords": ["sneak", "hide", "shadow", "slip"]},
            "investigation": {
                "attribute": "wit",
                "keywords": ["inspect", "study", "search", "investigate", "question"],
            },
            "influence": {
                "attribute": "spirit",
                "keywords": ["convince", "threaten", "persuade", "command", "bargain"],
            },
            "survival": {
                "attribute": "wit",
                "keywords": ["track", "navigate", "endure", "hunt", "forage"],
            },
            "sorcery": {
                "attribute": "spirit",
                "keywords": ["spell", "ritual", "ward", "invoke", "hex"],
            },
        },
        "difficulty_scale": {
            "routine": 9,
            "risky": 12,
            "hard": 15,
            "dire": 18,
            "legendary": 21,
        },
        "combat": {
            "base_hp": 12,
            "success_damage_bonus": 1,
            "critical_damage_bonus": 3,
        },
        "status_effects": {
            "shaken": "在壓力下行動時處於劣勢。",
            "wounded": "耐力下降，且更容易受到後續打擊。",
            "marked": "對手取得優勢或更清楚的戰術情報。",
        },
        "turn_structure": [
            "GM 描述場景",
            "玩家宣告行動",
            "相關 NPC 做出反應",
            "系統解析檢定",
            "更新狀態與記憶",
        ],
    }


def build_default_world_entries(premise: str) -> list[dict[str, Any]]:
    return [
        {
            "title": "絲絨海岸",
            "category": "geography",
            "visibility_scope": "world",
            "body": "一串被霧氣浸透的港灣城市，舊公會與新興辛迪加在此爭奪忠誠與影響力。",
            "tags": ["港口", "貿易", "政治"],
            "metadata": {"knowledge_level": "公開"},
        },
        {
            "title": "灰燼協約",
            "category": "history",
            "visibility_scope": "world",
            "body": "一紙殘破的和平條約結束了延續一個世代的城邦戰爭，卻留下秘密條款與無人清償的債務。",
            "tags": ["條約", "歷史", "戰爭"],
            "metadata": {"knowledge_level": "學術"},
        },
        {
            "title": "脈衝工藝",
            "category": "magic",
            "visibility_scope": "world",
            "body": "施法者將活生生的意志調諧到可傳導的遺物上來施展魔法，而每一道術式都會留下情感殘響。",
            "tags": ["魔法", "遺物", "情緒"],
            "metadata": {"knowledge_level": "限制"},
        },
        {
            "title": "目前劇本前提",
            "category": "campaign",
            "visibility_scope": "world",
            "body": premise,
            "tags": ["前提"],
            "metadata": {"knowledge_level": "公開"},
        },
    ]


def build_default_actors(player_name: str) -> list[dict[str, Any]]:
    return [
        {
            "name": "場記 GM",
            "role": "gm",
            "persona": "沉著、重視感官描寫，並能敏銳回應玩家主動性。",
            "motives": ["透過有意義的選擇提升壓力。", "維持整體調性與連續性。"],
            "visibility_policy": {"world": "all", "story": "all", "memories": "public"},
            "knowledge_scopes": ["all"],
            "secret_motives": "在每一幕埋下三條尚未解決的線索。",
            "model_provider": "openrouter",
            "model_name": _DEFAULT_GM_MODEL,
            "temperature": 0.7,
            "metadata": {"kind": "gm"},
        },
        {
            "name": player_name,
            "role": "player",
            "persona": "好奇、固執，即使要付出代價也想保護陌生人。",
            "motives": ["查出究竟是誰從動亂中得利。", "維持脆弱卻必要的同盟關係。"],
            "visibility_policy": {"world": "self_scope", "story": "experienced", "memories": "self+public"},
            "knowledge_scopes": ["geography", "campaign", "history"],
            "secret_motives": "把你過去欠辛迪加的債藏到最戲劇性的時刻再揭露。",
            "model_provider": "openrouter",
            "model_name": _DEFAULT_PLAYER_MODEL,
            "temperature": 0.8,
            "metadata": {
                "stats": {
                    "attributes": {"might": 1, "grace": 2, "wit": 2, "spirit": 1},
                    "skills": {"combat": 1, "stealth": 2, "investigation": 3, "influence": 1, "survival": 1, "sorcery": 0},
                    "hp": 12,
                }
            },
        },
        {
            "name": "薇菈．奎爾",
            "role": "npc",
            "persona": "優雅的對手型掮客，總是帶著微笑讓每個人一步步欠下人情。",
            "motives": ["取得能壓制玩家的籌碼。", "保護辛迪加悄然擴張的計畫。"],
            "visibility_policy": {"world": "self_scope", "story": "experienced", "memories": "self+public"},
            "knowledge_scopes": ["geography", "history", "campaign"],
            "secret_motives": "設計一場危機，逼玩家不得不接受你的幫助。",
            "model_provider": "openrouter",
            "model_name": _DEFAULT_NPC_MODEL,
            "temperature": 0.85,
            "metadata": {
                "stats": {
                    "attributes": {"might": 0, "grace": 2, "wit": 3, "spirit": 3},
                    "skills": {"combat": 0, "stealth": 2, "investigation": 2, "influence": 4, "survival": 0, "sorcery": 1},
                    "hp": 10,
                },
                "stance": "對手",
            },
        },
        {
            "name": "卡洛修士",
            "role": "npc",
            "persona": "曾經激進的神職者，聲音疲憊，卻總會本能地擋在危險與平民之間。",
            "motives": ["阻止城市重演上一次戰爭。", "試探玩家是否承受得起真相。"],
            "visibility_policy": {"world": "self_scope", "story": "experienced", "memories": "self+public"},
            "knowledge_scopes": ["history", "magic", "campaign"],
            "secret_motives": "你知道《灰燼協約》中有一條足以拉下一位總督的條款。",
            "model_provider": "openrouter",
            "model_name": "moonshotai/kimi-k2.6",
            "temperature": 0.65,
            "metadata": {
                "stats": {
                    "attributes": {"might": 2, "grace": 0, "wit": 2, "spirit": 3},
                    "skills": {"combat": 2, "stealth": 0, "investigation": 1, "influence": 2, "survival": 2, "sorcery": 2},
                    "hp": 13,
                },
                "stance": "盟友",
            },
        },
        {
            "name": "錫眼蛾",
            "role": "npc",
            "persona": "靠著比任何大人預期都更敏銳的聽力活下來的信差孩子。",
            "motives": ["活下去。", "每個秘密只賣一次。"],
            "visibility_policy": {"world": "self_scope", "story": "experienced", "memories": "self+public"},
            "knowledge_scopes": ["geography", "campaign"],
            "secret_motives": "你其實已經見過今晚那場火災的始作俑者。",
            "model_provider": "openrouter",
            "model_name": "deepseek/deepseek-v4-flash",
            "temperature": 0.9,
            "metadata": {
                "stats": {
                    "attributes": {"might": 0, "grace": 3, "wit": 2, "spirit": 1},
                    "skills": {"combat": 0, "stealth": 3, "investigation": 1, "influence": 1, "survival": 2, "sorcery": 0},
                    "hp": 8,
                },
                "stance": "變數",
            },
        },
    ]


def build_initial_story_state(premise: str) -> dict[str, Any]:
    return {
        "current_scene": "雨絲掠過燈籠街區，失蹤使節的傳聞正沿著市集迅速擴散。",
        "active_objectives": [
            "查出使節為何在黎明前失蹤。",
            "決定你最先挖出的真相要交給哪個勢力。",
        ],
        "npc_statuses": {
            "薇菈．奎爾": {"state": "active", "attitude": "watchful"},
            "卡洛修士": {"state": "active", "attitude": "guarded"},
            "錫眼蛾": {"state": "active", "attitude": "skittish"},
        },
        "raw_state": {
            "premise": premise,
            "scene_tags": ["雨夜", "市集", "政治緊張"],
            "threat_clock": {"city_unrest": 1, "syndicate_heat": 0},
            "open_threads": [
                "誰會從使節失蹤中獲利？",
                "為何碼頭附近會出現脈衝工藝的殘留？",
            ],
            "director_flags": [],
        },
    }


# ── novel_db 對齊：從現存小說檔案 bootstrap campaign ──────────────────────


_DEFAULT_GM_MODEL = "anthropic/claude-sonnet-4.6"
_DEFAULT_NPC_MODEL = "google/gemini-3.5-flash"
_DEFAULT_PLAYER_MODEL = "anthropic/claude-3.5-haiku"


def _world_section_to_entry(section: novel_db_overlay.WorldSection) -> dict[str, Any]:
    return {
        "title": section.title,
        "category": "worldbuilding",
        "visibility_scope": "world",
        "body": section.body_md,
        "tags": [],
        "metadata": {
            "knowledge_level": "公開",
            "source": "novel_db.bible.worldbuilding",
            "slug": section.slug,
        },
    }


def _character_to_actor(
    section: novel_db_overlay.CharacterSection, player_name: str | None = None
) -> dict[str, Any]:
    """把 bible/character.md 一個 char_id 區段轉成 ActorProfile dict。

    player_name 若給定且等於該 char_id，role=player；否則 role=npc。
    persona 直接用 body_md 的前 500 字濃縮。
    """
    is_player = player_name is not None and section.char_id == player_name
    return {
        "name": section.title,
        "role": "player" if is_player else "npc",
        "persona": section.body_md[:500].strip() or "（待補）",
        "motives": [],
        "visibility_policy": {
            "world": "self_scope",
            "story": "experienced",
            "memories": "self+public",
        },
        "knowledge_scopes": ["all"] if is_player else [],
        "secret_motives": "",
        "model_provider": "openrouter",
        "model_name": _DEFAULT_PLAYER_MODEL if is_player else _DEFAULT_NPC_MODEL,
        "temperature": 0.8,
        "metadata": {
            "char_id": section.char_id,
            "source": "novel_db.bible.character",
        },
    }


def bootstrap_from_novel_db(
    novel_id: str,
    premise: str | None = None,
    *,
    player_char_id: str | None = None,
) -> dict[str, Any]:
    """從 novel_db/{novel_id}/ 載入並產出 campaign bootstrap payload。

    回傳格式對應 CreateCampaignRequest 期待的欄位：
      - `world_entries`: list[WorldEntryCreate-like dict]
      - `actors`: list[ActorCreate-like dict]
      - `initial_story_state`: dict
      - `novel_overlay`: 完整 BibleBundle（給 caller 之後寫入 NovelDbBinding 與 overlay）

    若 novel_db 中沒對應檔案，回退到傳統 default。
    """
    try:
        bundle = novel_db_overlay.load_bible_bundle(novel_id)
    except FileNotFoundError:
        # fallback：用傳統 hard-coded defaults
        return {
            "world_entries": build_default_world_entries(premise or ""),
            "actors": build_default_actors("The Protagonist"),
            "initial_story_state": build_initial_story_state(premise or ""),
            "novel_overlay": None,
        }

    world_entries: list[dict[str, Any]] = [
        _world_section_to_entry(w) for w in bundle.world_sections
    ]
    actors: list[dict[str, Any]] = [
        _character_to_actor(c, player_name=player_char_id) for c in bundle.characters
    ]
    # 確保至少有一個 GM
    actors.insert(
        0,
        {
            "name": "場記 GM",
            "role": "gm",
            "persona": "沉著、重視感官描寫，並能敏銳回應玩家主動性。",
            "motives": ["透過有意義的選擇提升壓力。", "維持整體調性與連續性。"],
            "visibility_policy": {"world": "all", "story": "all", "memories": "public"},
            "knowledge_scopes": ["all"],
            "secret_motives": "",
            "model_provider": "openrouter",
            "model_name": _DEFAULT_GM_MODEL,
            "temperature": 0.7,
            "metadata": {"kind": "gm", "source": "bootstrap"},
        },
    )

    # 由 context/CONTEXT.md 種入初始 snapshot
    initial = build_initial_story_state(premise or "")
    if bundle.context_current.strip():
        initial["current_scene"] = bundle.context_current[:500].strip()
    if bundle.current_status.strip():
        initial["raw_state"]["current_status_excerpt"] = bundle.current_status[:1000].strip()
    initial["raw_state"]["novel_id"] = novel_id

    return {
        "world_entries": world_entries,
        "actors": actors,
        "initial_story_state": initial,
        "novel_overlay": bundle,
    }
