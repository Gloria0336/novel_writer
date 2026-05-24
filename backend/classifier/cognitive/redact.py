"""啟發式 redaction — 依 perception_level 把完整文本 downgrade 成主觀記憶。

Phase G 用純規則（無 LLM）；Phase H 會加 LLM perception_redact prompt 強化語感。
"""

from __future__ import annotations

import re

from classifier.cognitive.types import PerceptionLevel


_SENTENCE_SPLIT = re.compile(r"(?<=[。！？!?])\s*")


def _first_n_sentences(text: str, n: int) -> str:
    sentences = [s.strip() for s in _SENTENCE_SPLIT.split(text.strip()) if s.strip()]
    return " ".join(sentences[:n]).strip()


def _strip_proper_details(text: str) -> str:
    """把可能洩漏的具體細節弱化：精確數字、時間、角色內心活動標記。

    啟發式版本：移除 frontmatter、HTML 註解、保留段落主幹。
    """
    # 移除 frontmatter
    text = re.sub(r"^---.*?---\s*", "", text, count=1, flags=re.DOTALL)
    # 移除 HTML 註解（HOLD 標記等）
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    return text.strip()


def redact_for_perception(
    text: str,
    level: PerceptionLevel,
    *,
    actor_name: str = "",
) -> str:
    """依 perception_level 把 text downgrade 成主觀記憶。

    - DIRECT_WITNESS: 完整文本（僅去 frontmatter / 註解）
    - SECONDHAND: 前 2 句 + 加入感官猜測前綴
    - RUMOR: 前 1 句 + 重寫為傳聞口吻
    - UNAWARE: 空字串（caller 應該不該調這個）
    """
    cleaned = _strip_proper_details(text)
    if not cleaned:
        return ""

    if level == PerceptionLevel.DIRECT_WITNESS:
        return cleaned

    if level == PerceptionLevel.SECONDHAND:
        excerpt = _first_n_sentences(cleaned, 2)
        prefix = f"（{actor_name}印象中）" if actor_name else "（印象中）"
        return f"{prefix}{excerpt}"

    if level == PerceptionLevel.RUMOR:
        excerpt = _first_n_sentences(cleaned, 1)
        return f"傳聞：{excerpt}"

    # UNAWARE
    return ""


def confidence_for(level: PerceptionLevel) -> float:
    return {
        PerceptionLevel.DIRECT_WITNESS: 0.95,
        PerceptionLevel.SECONDHAND: 0.65,
        PerceptionLevel.RUMOR: 0.35,
        PerceptionLevel.UNAWARE: 0.0,
    }[level]


def decay_hint_for(level: PerceptionLevel) -> str:
    return {
        PerceptionLevel.DIRECT_WITNESS: "stable",
        PerceptionLevel.SECONDHAND: "fading",
        PerceptionLevel.RUMOR: "volatile",
        PerceptionLevel.UNAWARE: "n/a",
    }[level]
