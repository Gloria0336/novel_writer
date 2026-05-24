"""YAML frontmatter 解析、序列化、合併工具。"""

from __future__ import annotations

import re
from typing import Any

import yaml

_FRONTMATTER_PATTERN = re.compile(
    r"\A---\s*\n(.*?)\n---\s*\n?(.*)\Z",
    re.DOTALL,
)


def parse(text: str) -> tuple[dict[str, Any], str]:
    """切出 frontmatter 與 body。沒有 frontmatter 時回 ({}, text)。"""
    match = _FRONTMATTER_PATTERN.match(text)
    if not match:
        return {}, text
    raw_yaml, body = match.groups()
    try:
        data = yaml.safe_load(raw_yaml) or {}
    except yaml.YAMLError:
        return {}, text
    if not isinstance(data, dict):
        return {}, text
    return data, body


def serialize(frontmatter: dict[str, Any], body: str) -> str:
    """把 frontmatter + body 重組回 markdown。frontmatter 為空時不輸出 ---。"""
    if not frontmatter:
        return body
    rendered = yaml.safe_dump(
        frontmatter,
        allow_unicode=True,
        sort_keys=False,
        default_flow_style=False,
    ).rstrip()
    return f"---\n{rendered}\n---\n{body}"


def merge(old: dict[str, Any], new: dict[str, Any]) -> dict[str, Any]:
    """frontmatter 合併規則：

    - scalar：new 蓋 old
    - list：set-union，保留 old 順序，後追加 new 中新出現的
    - dict：遞迴 merge
    - new 中為 None 的 key 視為「無變更」，不覆寫 old
    """
    result: dict[str, Any] = dict(old)
    for key, new_val in new.items():
        if new_val is None:
            continue
        if key not in result:
            result[key] = new_val
            continue
        old_val = result[key]
        if isinstance(old_val, dict) and isinstance(new_val, dict):
            result[key] = merge(old_val, new_val)
        elif isinstance(old_val, list) and isinstance(new_val, list):
            merged_list = list(old_val)
            for item in new_val:
                if item not in merged_list:
                    merged_list.append(item)
            result[key] = merged_list
        else:
            result[key] = new_val
    return result
