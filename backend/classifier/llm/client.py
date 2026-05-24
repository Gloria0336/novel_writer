"""Anthropic SDK 封裝 — 含 prompt caching 與 lazy import。

依賴 `anthropic` 套件，但只在實際呼叫時才 import，
讓 Phase A heuristics-only 流程不需要安裝 anthropic 也能跑。
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from classifier.config import DEFAULT_MODEL

_PROMPTS_DIR = Path(__file__).parent / "prompts"


@dataclass
class LLMResponse:
    raw_text: str
    parsed_json: dict[str, Any] | None
    model: str
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int = 0
    cache_creation_tokens: int = 0


def load_prompt(name: str) -> str:
    """讀取 prompts/ 下的 .md 範本。"""
    path = _PROMPTS_DIR / f"{name}.md"
    return path.read_text(encoding="utf-8")


class LLMUnavailableError(RuntimeError):
    """LLM 套件未安裝或無 API key。"""


def _require_anthropic():
    try:
        import anthropic  # noqa: F401  # type: ignore[import-not-found]

        return anthropic
    except ImportError as exc:
        raise LLMUnavailableError(
            "anthropic 套件未安裝。執行 `pip install anthropic` 或安裝 classifier[llm] 額外依賴。"
        ) from exc


def call_json(
    *,
    system_prompt: str,
    user_text: str,
    model: str | None = None,
    max_tokens: int = 2048,
    temperature: float = 0.0,
    cache_system: bool = True,
) -> LLMResponse:
    """呼叫 Claude 並期待 JSON 回應。

    system_prompt 預設加上 prompt caching breakpoint；改寫 user_text 不會 invalidate 快取。
    """
    anthropic = _require_anthropic()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise LLMUnavailableError("缺少 ANTHROPIC_API_KEY 環境變數。")

    client = anthropic.Anthropic(api_key=api_key)
    model = model or DEFAULT_MODEL

    system_blocks: list[dict[str, Any]]
    if cache_system:
        system_blocks = [
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ]
    else:
        system_blocks = [{"type": "text", "text": system_prompt}]

    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system_blocks,
        messages=[{"role": "user", "content": user_text}],
    )

    raw_text = "".join(
        block.text for block in response.content if getattr(block, "type", "") == "text"
    )
    parsed_json: dict[str, Any] | None = None
    try:
        # 模型可能在 JSON 前後加上 ```json fence 或散文，盡量挖出第一個 {...}
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start != -1 and end > start:
            parsed_json = json.loads(raw_text[start : end + 1])
    except (json.JSONDecodeError, ValueError):
        parsed_json = None

    usage = response.usage
    return LLMResponse(
        raw_text=raw_text,
        parsed_json=parsed_json,
        model=model,
        input_tokens=getattr(usage, "input_tokens", 0),
        output_tokens=getattr(usage, "output_tokens", 0),
        cache_read_tokens=getattr(usage, "cache_read_input_tokens", 0) or 0,
        cache_creation_tokens=getattr(usage, "cache_creation_input_tokens", 0) or 0,
    )
