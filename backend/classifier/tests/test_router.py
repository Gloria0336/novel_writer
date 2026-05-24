"""Router 主流程測試（heuristic-only，不打 LLM）。"""

from __future__ import annotations

from classifier.core import ClassifierInput
from classifier.router import idempotency_key, route
from classifier.taxonomy import Destination


def _inp(text: str, **hints) -> ClassifierInput:
    return ClassifierInput(
        source="paste",
        raw_text=text,
        novel_id="novel_04_dungen",
        hints=hints,
    )


def test_route_high_confidence_heuristic() -> None:
    text = "---\ndestination: bible_character\n---\n## char_010\n\n資料"
    out = route(_inp(text), use_llm=False)
    assert out.destination == Destination.BIBLE_CHARACTER.value
    assert out.confidence >= 0.95


def test_route_low_confidence_goes_to_quarantine() -> None:
    text = "純散文沒有任何可路由訊號。"
    out = route(_inp(text), use_llm=False)
    assert out.destination == Destination.TEMPS_QUARANTINE.value
    assert "quarantine" in out.reason


def test_route_secret_token_routes_correctly() -> None:
    out = route(_inp("與 secret-world-007 相關的描述。"), use_llm=False)
    assert out.destination == Destination.CONTEXT_SECRETS.value


def test_route_extracts_slug_from_h1() -> None:
    out = route(_inp("# 流言：失蹤的礦工\n\n聽說..."), use_llm=False)
    assert out.destination == Destination.UPDATES_GOSSIPS.value
    assert "失蹤的礦工" in out.frontmatter.get("slug", "")


def test_route_propagates_frontmatter() -> None:
    text = "---\ntags:\n  - 公開\n  - 區域\n---\n# 第三層"
    out = route(_inp(text), use_llm=False)
    assert "tags" in out.frontmatter
    assert "公開" in out.frontmatter["tags"]


def test_idempotency_key_stable() -> None:
    inp1 = _inp("hello", filename="x.md")
    inp2 = _inp("hello", filename="x.md")
    inp3 = _inp("hello", filename="y.md")
    assert idempotency_key(inp1) == idempotency_key(inp2)
    assert idempotency_key(inp1) != idempotency_key(inp3)


def test_idempotency_key_includes_novel_id() -> None:
    a = ClassifierInput(source="paste", raw_text="x", novel_id="novel_04_dungen")
    b = ClassifierInput(source="paste", raw_text="x", novel_id="novel_03_dream")
    assert idempotency_key(a) != idempotency_key(b)
