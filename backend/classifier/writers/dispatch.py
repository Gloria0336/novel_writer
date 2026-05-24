"""依 WriteMode 分派到對應的 compose 函式。

每個 compose 函式 input: (ClassifierOutput, 既有檔案文字, DestinationSpec)
                  output: (新檔案文字, warnings)
"""

from __future__ import annotations

import re

from classifier.core import ClassifierOutput
from classifier.rules import frontmatter as fm
from classifier.taxonomy import DestinationSpec
from classifier.types_writer import ComposeResult, ComposeWarning
from classifier.core import WriteMode


HOLD_MARKER = "<!-- HOLD -->"


def compose_new_text(
    output: ClassifierOutput, old_text: str, spec: DestinationSpec
) -> ComposeResult:
    """主分派。"""
    mode = spec.write_mode
    if mode == WriteMode.APPEND_SECTION:
        return _compose_append_section(output, old_text, spec)
    if mode == WriteMode.APPEND_LINE:
        return _compose_append_line(output, old_text, spec)
    if mode == WriteMode.CREATE_FILE:
        return _compose_create_file(output, old_text, spec)
    if mode == WriteMode.UPSERT_ROW:
        return _compose_upsert_row(output, old_text, spec)
    if mode == WriteMode.UPSERT_BLOCK:
        return _compose_upsert_block(output, old_text, spec)
    if mode == WriteMode.OVERWRITE:
        return _compose_overwrite(output, old_text, spec)
    if mode == WriteMode.YAML_UPSERT:
        return _compose_yaml_upsert(output, old_text, spec)
    raise ValueError(f"Unknown write mode: {mode}")


def _anchor_for(output: ClassifierOutput, spec: DestinationSpec) -> str:
    """從 spec.section_anchor_template 與 output frontmatter 算出實際 anchor 字串。

    例如 spec=`## {char_id}` + frontmatter={'char_id': 'char_007'} → `## char_007`。
    """
    if spec.section_anchor_template is None:
        return ""
    fm = output.frontmatter
    sp = output.schema_payload
    fill = {
        "char_id": fm.get("char_id", sp.get("char_id", "")),
        "slug": fm.get("slug", sp.get("slug", "")),
        "block_name": fm.get("block_name", sp.get("block_name", "")),
        "opera_id_short": fm.get("opera_id_short", sp.get("opera_id_short", "")),
        "secret_id": fm.get("secret_id", sp.get("secret_id", "")),
    }
    return spec.section_anchor_template.format(**fill)


def _find_section(text: str, anchor: str) -> tuple[int, int] | None:
    """找 markdown 區段範圍：從 anchor 那一行起，到下一個同級或更高級 heading 前。

    回 (start_offset, end_offset) 或 None。
    """
    if not anchor:
        return None
    # anchor 開頭通常是 `## xxx`
    heading_level = len(anchor) - len(anchor.lstrip("#"))
    pattern = re.compile(
        rf"^{re.escape(anchor)}\s*$", re.MULTILINE
    )
    match = pattern.search(text)
    if not match:
        return None
    start = match.start()
    # 找下一個 ≤ heading_level 的 heading
    next_pattern = re.compile(
        rf"^#{{1,{heading_level}}}\s+", re.MULTILINE
    )
    next_match = next_pattern.search(text, pos=match.end())
    end = next_match.start() if next_match else len(text)
    return (start, end)


def _compose_append_section(
    output: ClassifierOutput, old_text: str, spec: DestinationSpec
) -> ComposeResult:
    warnings: list[ComposeWarning] = []
    anchor = _anchor_for(output, spec)
    body = output.body_md.rstrip() + "\n"
    new_section = (anchor + "\n\n" + body).rstrip() + "\n"

    if not old_text.strip():
        # 空檔案：先加 H1 + 後加新區段
        return (new_section, warnings)

    existing = _find_section(old_text, anchor)
    if existing is None:
        # 不存在 → 追加到檔案尾
        sep = "" if old_text.endswith("\n") else "\n"
        return (old_text + sep + "\n" + new_section, warnings)

    # 已存在 → 檢查 HOLD marker
    start, end = existing
    existing_section = old_text[start:end]
    if HOLD_MARKER in existing_section:
        warnings.append(
            ComposeWarning(
                code="hold_marker",
                message=f"Section `{anchor}` 含 {HOLD_MARKER}；跳過覆寫。",
            )
        )
        return (old_text, warnings)

    # 取代區段
    return (old_text[:start] + new_section + old_text[end:], warnings)


def _compose_append_line(
    output: ClassifierOutput, old_text: str, spec: DestinationSpec
) -> ComposeResult:
    line = output.body_md.strip()
    if not line:
        return (old_text, [])
    if line in old_text:
        return (old_text, [ComposeWarning("duplicate_line", "該行已存在，跳過。")])
    sep = "" if old_text.endswith("\n") or not old_text else "\n"
    return (old_text + sep + line + "\n", [])


def _compose_create_file(
    output: ClassifierOutput, old_text: str, spec: DestinationSpec
) -> ComposeResult:
    warnings: list[ComposeWarning] = []
    if old_text:
        warnings.append(
            ComposeWarning(
                "file_exists",
                f"CREATE_FILE 模式但目標已存在；將覆寫。",
            )
        )
    rendered = fm.serialize(output.frontmatter, output.body_md.rstrip() + "\n")
    return (rendered, warnings)


def _compose_overwrite(
    output: ClassifierOutput, old_text: str, spec: DestinationSpec
) -> ComposeResult:
    rendered = fm.serialize(output.frontmatter, output.body_md.rstrip() + "\n")
    return (rendered, [])


def _compose_upsert_row(
    output: ClassifierOutput, old_text: str, spec: DestinationSpec
) -> ComposeResult:
    """secrets-lockbox 風格：表格列 upsert + 下方 detail block upsert。

    Phase B 簡化版：以 secret_id 為 anchor，把對應 ## {secret_id} block upsert。
    完整表格列維護留待 Phase E。
    """
    warnings: list[ComposeWarning] = []
    secret_id = output.frontmatter.get("secret_id") or output.schema_payload.get("secret_id")
    if not secret_id:
        warnings.append(ComposeWarning("missing_id", "UPSERT_ROW 需 secret_id；跳過。"))
        return (old_text, warnings)

    anchor = f"## {secret_id}"
    body = output.body_md.rstrip() + "\n"
    new_section = f"{anchor}\n\n{body}".rstrip() + "\n"

    existing = _find_section(old_text, anchor)
    if existing is None:
        sep = "" if old_text.endswith("\n") or not old_text else "\n"
        return (old_text + sep + "\n" + new_section, warnings)
    start, end = existing
    if HOLD_MARKER in old_text[start:end]:
        warnings.append(ComposeWarning("hold_marker", f"{secret_id} 含 HOLD；跳過。"))
        return (old_text, warnings)
    return (old_text[:start] + new_section + old_text[end:], warnings)


def _compose_upsert_block(
    output: ClassifierOutput, old_text: str, spec: DestinationSpec
) -> ComposeResult:
    """CONTEXT.md 風格：依 block_name 找區段並 upsert。"""
    return _compose_append_section(output, old_text, spec)  # 邏輯目前等價


def _compose_yaml_upsert(
    output: ClassifierOutput, old_text: str, spec: DestinationSpec
) -> ComposeResult:
    """YAML 目錄 upsert — 依 id 欄位 upsert 到 layers/items 列表。

    Phase B 簡化版：把新 entry append 到 YAML 結尾；完整 id-based merge 留待 Phase E。
    """
    import yaml

    warnings: list[ComposeWarning] = []
    try:
        data = yaml.safe_load(old_text) if old_text.strip() else {"layers": []}
    except yaml.YAMLError as exc:
        warnings.append(ComposeWarning("yaml_parse_error", str(exc)))
        return (old_text, warnings)

    if not isinstance(data, dict):
        data = {"layers": []}
    data.setdefault("layers", [])

    payload = output.schema_payload or output.frontmatter
    if payload:
        new_id = payload.get("id")
        if new_id:
            # upsert by id
            existing_idx = next(
                (i for i, item in enumerate(data["layers"]) if isinstance(item, dict) and item.get("id") == new_id),
                None,
            )
            if existing_idx is not None:
                data["layers"][existing_idx] = {**data["layers"][existing_idx], **payload}
            else:
                data["layers"].append(payload)
        else:
            data["layers"].append(payload)
            warnings.append(ComposeWarning("no_id", "YAML_UPSERT 無 id 欄位；改為 append。"))

    rendered = yaml.safe_dump(data, allow_unicode=True, sort_keys=False, default_flow_style=False)
    return (rendered, warnings)
