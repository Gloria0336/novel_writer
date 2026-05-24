"""主分類流程 — heuristic → LLM 後援 → schema 驗證 → 信心閘 → 產出 ClassifierOutput。

Phase B 版本：無快取（IdempotencyKey 在 Phase E 加入），無 cognitive_router（Phase F-H）。
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from classifier.config import CONFIDENCE_THRESHOLD
from classifier.core import ClassifierInput, ClassifierOutput, HeuristicHit
from classifier.rules import frontmatter as fm
from classifier.rules.heuristics import detect_best
from classifier.taxonomy import Destination


def _normalize_slug(text: str, max_len: int = 60) -> str:
    """從任意文字產 url-safe slug；中文保留。"""
    text = text.strip()
    # 移除 markdown heading 符號
    text = re.sub(r"^#+\s*", "", text)
    # 把空白與標點換成 dash
    text = re.sub(r"[\s　\-_/\\]+", "-", text)
    text = re.sub(r"[^\w一-鿿\-]+", "", text)
    text = text.strip("-")
    return text[:max_len] or "untitled"


def _extract_h1(text: str) -> str:
    if match := re.search(r"^#\s+(.+)$", text, re.MULTILINE):
        return match.group(1).strip()
    return ""


def _build_output(
    input_: ClassifierInput,
    hit: HeuristicHit,
) -> ClassifierOutput:
    """把 HeuristicHit + 原始 input 組成 ClassifierOutput。

    處理 frontmatter parse、slug 推導、suggested_path 暫時用 destination value 佔位
    （實際路徑在 writer 端用 resolve_target 算）。
    """
    fm_dict, body = fm.parse(input_.raw_text)
    merged_hints = {**fm_dict, **hit.extracted_hints}

    # 補 slug
    if "slug" not in merged_hints:
        merged_hints["slug"] = _normalize_slug(_extract_h1(body) or "untitled")

    return ClassifierOutput(
        destination=hit.destination,
        suggested_path=Path(hit.destination),  # 真實 path 由 writer.resolve_target 解析
        frontmatter=merged_hints,
        body_md=body,
        confidence=hit.confidence,
        reason=hit.matched_pattern,
        schema_payload=merged_hints,
    )


def _quarantine(input_: ClassifierInput, hit: HeuristicHit | None, reason: str) -> ClassifierOutput:
    fm_dict, body = fm.parse(input_.raw_text)
    timestamp_slug = hashlib.sha1(input_.raw_text.encode("utf-8")).hexdigest()[:8]
    slug = _normalize_slug(_extract_h1(body) or "blob")
    confidence = hit.confidence if hit else 0.0
    suggested = hit.destination if hit else "unknown"
    return ClassifierOutput(
        destination=Destination.TEMPS_QUARANTINE.value,
        suggested_path=Path(Destination.TEMPS_QUARANTINE.value),
        frontmatter={
            **fm_dict,
            "ts": timestamp_slug,
            "slug": slug,
            "original_suggestion": suggested,
            "quarantine_reason": reason,
        },
        body_md=body,
        confidence=confidence,
        reason=f"quarantine: {reason}",
        schema_payload={"ts": timestamp_slug, "slug": slug},
    )


def route(
    input_: ClassifierInput,
    *,
    use_llm: bool = True,
    threshold: float = CONFIDENCE_THRESHOLD,
) -> ClassifierOutput:
    """主流程：opera destination_hint → heuristic → LLM 後援 → 信心閘 → quarantine fallback。"""
    # 1. opera_adapter 提供的明示 destination_hint，信心 1.0 直接採用
    if (hint_value := input_.hints.get("destination_hint")):
        try:
            dest = Destination(hint_value)
            return _build_output(
                input_,
                HeuristicHit(
                    destination=dest.value,
                    confidence=1.0,
                    matched_pattern="opera_destination_hint",
                    extracted_hints=input_.hints,
                ),
            )
        except ValueError:
            pass  # 不合法的 hint 就忽略

    best_hit = detect_best(input_)

    if best_hit and best_hit.confidence >= 0.95:
        # 信心極高（含 frontmatter 明示）直接採用，跳過 LLM
        return _build_output(input_, best_hit)

    if use_llm and (best_hit is None or best_hit.confidence < 0.85):
        from classifier.llm.route_via_llm import classify as llm_classify

        llm_hit = llm_classify(input_)
        if llm_hit is not None:
            # 若兩邊都有結果，挑信心高者
            if best_hit is None or llm_hit.confidence > best_hit.confidence:
                best_hit = llm_hit

    if best_hit is None:
        return _quarantine(input_, None, "no heuristic or LLM match")

    if best_hit.confidence < threshold:
        return _quarantine(input_, best_hit, f"confidence {best_hit.confidence:.2f} < {threshold:.2f}")

    return _build_output(input_, best_hit)


def route_many(inputs: list[ClassifierInput], **kwargs: Any) -> list[ClassifierOutput]:
    return [route(inp, **kwargs) for inp in inputs]


# ── IdempotencyKey utility（Phase B 提供函式，快取持久化留 Phase E）─────────


def idempotency_key(input_: ClassifierInput) -> str:
    payload = {
        "novel_id": input_.novel_id,
        "raw_text": input_.raw_text,
        "hints": dict(sorted(input_.hints.items())),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
