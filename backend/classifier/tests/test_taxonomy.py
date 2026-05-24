"""Taxonomy 與 spec 完整性測試。"""

from __future__ import annotations

import pytest

from classifier.core import Sensitivity, WriteMode
from classifier.taxonomy import DESTINATION_REGISTRY, Destination, get_spec


def test_every_destination_has_spec() -> None:
    """每個 Destination 都必須有對應 spec。"""
    missing = [d for d in Destination if d not in DESTINATION_REGISTRY]
    assert not missing, f"Destinations 沒有 spec: {missing}"


def test_specs_use_valid_enums() -> None:
    """spec.write_mode、spec.sensitivity 都必須是合法 enum。"""
    for dest, spec in DESTINATION_REGISTRY.items():
        assert isinstance(spec.write_mode, WriteMode), dest
        assert isinstance(spec.sensitivity, Sensitivity), dest
        assert spec.destination == dest


def test_paths_anchor_to_novel_root() -> None:
    """每個 path_template 都應以 {novel_root}/ 開頭。"""
    for dest, spec in DESTINATION_REGISTRY.items():
        assert spec.path_template.startswith("{novel_root}/"), (
            f"{dest} 的 path_template 必須相對 novel_root: {spec.path_template}"
        )


def test_nsfw_destinations_require_frontmatter() -> None:
    """NSFW 目的地必須 requires_frontmatter=True，便於追蹤 nsfw_ref_id 等元資料。"""
    for dest, spec in DESTINATION_REGISTRY.items():
        if spec.sensitivity == Sensitivity.NSFW:
            assert spec.requires_frontmatter, f"{dest} 是 NSFW 但未要求 frontmatter"


def test_get_spec_accepts_string_and_enum() -> None:
    spec_via_enum = get_spec(Destination.BIBLE_CHARACTER)
    spec_via_str = get_spec("bible_character")
    assert spec_via_enum is spec_via_str


def test_get_spec_rejects_unknown_string() -> None:
    with pytest.raises(ValueError):
        get_spec("not_a_real_destination")


def test_id_prefixes_unique() -> None:
    """有 id_prefix 的目的地，前綴應該唯一（避免分類混淆）。"""
    seen: dict[str, Destination] = {}
    for dest, spec in DESTINATION_REGISTRY.items():
        if spec.id_prefix is None:
            continue
        if spec.id_prefix in seen:
            # 允許重複的場景：CONTEXT_SECRETS 與 secret-* 系列；確保此情況有明確設計
            existing = seen[spec.id_prefix]
            pytest.fail(
                f"id_prefix '{spec.id_prefix}' 同時被 {existing} 與 {dest} 使用"
            )
        seen[spec.id_prefix] = dest
