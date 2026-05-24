from __future__ import annotations

import hashlib
import math
import re
from collections import Counter
from typing import Any


WORD_RE = re.compile(r"[A-Za-z0-9_\u4e00-\u9fff]+")


def normalize_text(text: str) -> str:
    return " ".join(WORD_RE.findall(text.lower()))


def estimate_tokens(text: str) -> int:
    cleaned = normalize_text(text)
    if not cleaned:
        return 0
    return max(1, len(cleaned.split()))


def embed_text(text: str, dimensions: int = 64) -> list[float]:
    vector = [0.0] * dimensions
    tokens = normalize_text(text).split()
    if not tokens:
        return vector

    counts = Counter(tokens)
    for token, count in counts.items():
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        slot = int.from_bytes(digest[:2], "big") % dimensions
        sign = -1.0 if digest[2] % 2 else 1.0
        weight = 1.0 + (digest[3] / 255.0)
        vector[slot] += sign * weight * count

    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [round(value / norm, 6) for value in vector]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    return sum(a * b for a, b in zip(left, right))


def extract_structured_facts(*texts: str) -> list[str]:
    facts: list[str] = []
    seen: set[str] = set()
    for text in texts:
        for sentence in re.split(r"[.!?\n]+", text):
            sentence = sentence.strip(" -\t")
            if not sentence:
                continue
            if len(sentence.split()) < 3:
                continue
            fact = sentence[:180]
            key = fact.lower()
            if key not in seen:
                facts.append(fact)
                seen.add(key)
    return facts[:8]


def compress_memory_summaries(
    summaries: list[dict[str, Any]],
    token_threshold: int,
) -> tuple[str, list[dict[str, Any]]]:
    total = 0
    recent: list[dict[str, Any]] = []
    rolled: list[str] = []
    for entry in sorted(summaries, key=lambda item: item.get("created_at", ""), reverse=True):
        summary = entry.get("summary", "")
        tokens = entry.get("token_count") or estimate_tokens(summary)
        if total + tokens <= token_threshold // 2:
            recent.append(entry)
            total += tokens
        else:
            rolled.append(summary)

    rolled_text = " ".join(reversed(rolled)).strip()
    return rolled_text[:1200], list(reversed(recent))


def rank_memory_chunks(
    query: str,
    chunks: list[dict[str, Any]],
    limit: int,
) -> list[dict[str, Any]]:
    query_vector = embed_text(query)
    ranked = []
    for chunk in chunks:
        score = cosine_similarity(query_vector, chunk.get("vector", []))
        ranked.append({**chunk, "score": round(score, 4)})
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return [item for item in ranked[:limit] if item["score"] > 0]

