"""LLM 後援分類 — 拼裝 prompt、呼叫、解析 JSON、轉成 HeuristicHit 形式。"""

from __future__ import annotations

from typing import Any

from classifier.core import ClassifierInput, HeuristicHit
from classifier.llm.client import LLMUnavailableError, call_json, load_prompt
from classifier.taxonomy import DESTINATION_REGISTRY, Destination


def _render_destinations_table() -> str:
    rows = ["| 目的地 | 路徑 | 寫入模式 | 敏感度 | 用途 |", "| --- | --- | --- | --- | --- |"]
    for dest, spec in DESTINATION_REGISTRY.items():
        rows.append(
            f"| `{dest.value}` | `{spec.path_template}` | `{spec.write_mode.value}` | `{spec.sensitivity.value}` | {spec.description} |"
        )
    return "\n".join(rows)


def build_system_prompt() -> str:
    template = load_prompt("route_blob")
    return template.replace("{DESTINATIONS_TABLE}", _render_destinations_table())


def build_user_text(input_: ClassifierInput) -> str:
    hints_text = ""
    if input_.hints:
        hints_text = "\n# Hints\n\n" + "\n".join(
            f"- `{k}`: {v!r}" for k, v in sorted(input_.hints.items())
        )
    return (
        f"# Source\n\n- kind: `{input_.source}`\n- novel_id: `{input_.novel_id}`"
        f"{hints_text}\n\n# Raw content\n\n```\n{input_.raw_text}\n```"
    )


def classify(input_: ClassifierInput) -> HeuristicHit | None:
    """用 LLM 分類，轉成 HeuristicHit 形式回傳。

    LLM 不可用或 JSON 解析失敗時回 None；caller 應 fallback 到 TEMPS_QUARANTINE。
    """
    try:
        response = call_json(
            system_prompt=build_system_prompt(),
            user_text=build_user_text(input_),
            max_tokens=512,
        )
    except LLMUnavailableError:
        return None

    parsed = response.parsed_json
    if not parsed or "destination" not in parsed:
        return None

    try:
        dest = Destination(parsed["destination"])
    except ValueError:
        return None

    confidence = float(parsed.get("confidence", 0.5))
    confidence = max(0.0, min(1.0, confidence))

    return HeuristicHit(
        destination=dest.value,
        confidence=confidence,
        matched_pattern=f"llm:{response.model}",
        extracted_hints=_clean_hints(parsed.get("extracted_hints", {})),
    )


def _clean_hints(hints: Any) -> dict[str, Any]:
    if not isinstance(hints, dict):
        return {}
    return {k: v for k, v in hints.items() if v not in (None, "", [], {})}
