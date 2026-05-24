"""Frontmatter parse / serialize / merge 測試。"""

from __future__ import annotations

from classifier.rules import frontmatter as fm


def test_parse_no_frontmatter() -> None:
    text = "# 標題\n\n內文。"
    data, body = fm.parse(text)
    assert data == {}
    assert body == text


def test_parse_simple_frontmatter() -> None:
    text = "---\ntitle: 夢玲\ntags:\n  - 人類\n  - 術師\n---\n# 夢玲\n\n內文。"
    data, body = fm.parse(text)
    assert data == {"title": "夢玲", "tags": ["人類", "術師"]}
    assert body.startswith("# 夢玲")


def test_parse_invalid_yaml_falls_back() -> None:
    text = "---\n!! malformed: : :\n---\nbody"
    data, body = fm.parse(text)
    assert data == {}
    assert body == text


def test_parse_non_dict_yaml_falls_back() -> None:
    text = "---\n- just\n- a\n- list\n---\nbody"
    data, body = fm.parse(text)
    assert data == {}
    assert body == text


def test_serialize_round_trip() -> None:
    original_fm = {"title": "深淵層 1", "tags": ["公開", "區域"]}
    body = "# 深淵層 1\n\n描述。"
    text = fm.serialize(original_fm, body)
    parsed_fm, parsed_body = fm.parse(text)
    assert parsed_fm == original_fm
    assert parsed_body == body


def test_serialize_empty_frontmatter_skips_block() -> None:
    text = fm.serialize({}, "純內文")
    assert text == "純內文"


def test_merge_scalar_new_wins() -> None:
    merged = fm.merge({"status": "draft"}, {"status": "published"})
    assert merged == {"status": "published"}


def test_merge_list_set_union_preserves_order() -> None:
    merged = fm.merge(
        {"tags": ["a", "b", "c"]},
        {"tags": ["b", "d", "a", "e"]},
    )
    assert merged["tags"] == ["a", "b", "c", "d", "e"]


def test_merge_dict_recursive() -> None:
    merged = fm.merge(
        {"meta": {"author": "舊", "year": 2024}},
        {"meta": {"author": "新", "month": 3}},
    )
    assert merged == {"meta": {"author": "新", "year": 2024, "month": 3}}


def test_merge_none_in_new_does_not_overwrite() -> None:
    merged = fm.merge({"a": 1, "b": 2}, {"a": None, "b": 99})
    assert merged == {"a": 1, "b": 99}


def test_merge_adds_new_keys() -> None:
    merged = fm.merge({"a": 1}, {"b": 2})
    assert merged == {"a": 1, "b": 2}
