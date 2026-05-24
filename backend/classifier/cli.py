"""classifier CLI — novel_db 唯讀；所有寫入走 campaign staging。

用法：
  python -m classifier campaign new --campaign-id Y --novel-id N
  python -m classifier campaign export --campaign-id Y
  python -m classifier campaign status --campaign-id Y
  python -m classifier campaign list
  python -m classifier campaign delete --campaign-id Y [--yes]

  python -m classifier route   --input PATH --campaign-id Y [--apply] [--yes]
  python -m classifier route   --stdin --campaign-id Y [--json] [--apply]
  python -m classifier scan    PATH --campaign-id Y [--apply]
  python -m classifier preview --input PATH --novel-id N        # 純探測，不需 campaign
  python -m classifier taxonomy-doc
"""

from __future__ import annotations

import argparse
import json
import sys
import tempfile
from pathlib import Path

from classifier import staging
from classifier.config import is_under_novel_db
from classifier.core import ClassifierInput
from classifier.router import route
from classifier.taxonomy import DESTINATION_REGISTRY
from classifier.writers.base import NovelDbWriteForbidden, apply_preview, write_preview


# ── 共用 ───────────────────────────────────────────────────────────────────


def _read_input(args: argparse.Namespace) -> tuple[str, dict]:
    hints: dict = {}
    if getattr(args, "stdin", False):
        text = sys.stdin.read()
    elif getattr(args, "input", None):
        path = Path(args.input)
        text = path.read_text(encoding="utf-8")
        hints["filename"] = path.name
    else:
        raise SystemExit("必須提供 --input 或 --stdin。")
    return text, hints


class _TargetRootError(Exception):
    """無法解析 target_root；由 cmd 層轉成 exit code 2 + stderr 訊息。"""


def _resolve_target_root(args: argparse.Namespace, *, allow_scratch: bool) -> Path:
    """從 args 算出 target_root（writer 用）。

    優先順序：
      1. --campaign-id 有給 → staging working/
      2. --apply 模式 → 強制要求 --campaign-id
      3. 否則（純 preview） → 臨時 scratch 目錄
    """
    campaign_id = getattr(args, "campaign_id", None)
    apply_mode = getattr(args, "apply", False)

    if campaign_id:
        return staging.get_working_root(campaign_id)

    if apply_mode:
        raise _TargetRootError(
            "--apply 需要 --campaign-id 指定 staging 目標。"
            " novel_db 絕對唯讀；先跑 `classifier campaign new --campaign-id X --novel-id N`。"
        )

    if not allow_scratch:
        raise _TargetRootError("此命令需要 --campaign-id。")

    # 純 preview，且沒指定 campaign：開臨時 scratch
    return Path(tempfile.mkdtemp(prefix="classifier_scratch_"))


def _print_preview(preview, output, as_json: bool, scratch_warning: bool = False) -> None:
    if as_json:
        payload = {
            "destination": preview.destination.value,
            "target_path": str(preview.target_path),
            "is_new_file": preview.is_new_file,
            "confidence": output.confidence,
            "reason": output.reason,
            "warnings": [{"code": w.code, "message": w.message} for w in preview.warnings],
            "diff": preview.diff,
        }
        if scratch_warning:
            payload["scratch_warning"] = "no --campaign-id; target_path 是臨時 scratch 路徑"
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return
    print(f"\n=== {preview.destination.value} → {preview.target_path} ===")
    if scratch_warning:
        print("[!] 未指定 --campaign-id；target_path 是臨時 scratch；--apply 時請帶 --campaign-id。")
    print(f"confidence: {output.confidence:.2f}  ({output.reason})")
    if preview.is_new_file:
        print("(new file)")
    if preview.warnings:
        for w in preview.warnings:
            print(f"  [!] {w.code}: {w.message}")
    if preview.is_noop:
        print("(no change)")
    else:
        print("\n--- diff ---")
        print(preview.diff or "(empty)")


# ── route / scan / preview ────────────────────────────────────────────────


def cmd_route(args: argparse.Namespace) -> int:
    text, hints = _read_input(args)
    try:
        target_root = _resolve_target_root(args, allow_scratch=True)
    except _TargetRootError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    scratch = args.campaign_id is None

    input_ = ClassifierInput(
        source="paste" if args.stdin else "file_scan",
        raw_text=text,
        novel_id=args.novel_id or _infer_novel_id_from_campaign(args.campaign_id),
        hints=hints,
    )
    output = route(input_, use_llm=not args.no_llm)

    try:
        preview = write_preview(output, target_root, allow_nsfw=args.allow_nsfw)
    except PermissionError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except NovelDbWriteForbidden as exc:
        print(f"ERROR (novel_db guard): {exc}", file=sys.stderr)
        return 3

    _print_preview(preview, output, args.json, scratch_warning=scratch)

    if args.apply:
        if scratch:
            # 不該發生（_resolve_target_root 已擋）；防禦
            print("ERROR: apply 不可使用 scratch；請帶 --campaign-id。", file=sys.stderr)
            return 2
        if not args.yes and not args.json:
            ans = input("Apply? [y/N] ").strip().lower()
            if ans != "y":
                print("aborted.")
                return 0
        try:
            apply_preview(preview)
        except NovelDbWriteForbidden as exc:
            print(f"ERROR (novel_db guard): {exc}", file=sys.stderr)
            return 3
        if not args.json:
            print(f"[OK] written: {preview.target_path}")
    return 0


def cmd_scan(args: argparse.Namespace) -> int:
    root = Path(args.path)
    if not root.exists():
        print(f"path not found: {root}", file=sys.stderr)
        return 2
    try:
        target_root = _resolve_target_root(args, allow_scratch=False)
    except _TargetRootError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    novel_id = args.novel_id or _infer_novel_id_from_campaign(args.campaign_id)

    paths = sorted(root.rglob("*.md")) if root.is_dir() else [root]
    for path in paths:
        text = path.read_text(encoding="utf-8")
        input_ = ClassifierInput(
            source="file_scan",
            raw_text=text,
            novel_id=novel_id,
            hints={"filename": path.name, "src_path": str(path)},
        )
        output = route(input_, use_llm=not args.no_llm)
        try:
            preview = write_preview(output, target_root, allow_nsfw=args.allow_nsfw)
        except (PermissionError, NovelDbWriteForbidden) as exc:
            print(f"SKIP {path}: {exc}", file=sys.stderr)
            continue
        _print_preview(preview, output, args.json)
        if args.apply:
            try:
                apply_preview(preview)
            except NovelDbWriteForbidden as exc:
                print(f"SKIP {path} (guard): {exc}", file=sys.stderr)
                continue
            if not args.json:
                print(f"[OK] written: {preview.target_path}")
    return 0


def cmd_preview(args: argparse.Namespace) -> int:
    # 永遠不寫，可不帶 --campaign-id
    args.apply = False
    args.yes = True
    return cmd_route(args)


def cmd_taxonomy_doc(args: argparse.Namespace) -> int:
    print("# novel_db Destination 參考表\n")
    print("> 注意：所有實際寫入都進入 staging working/，不會碰 novel_db 本體。")
    print()
    print("| Destination | 路徑樣板 | 寫入模式 | 敏感度 | 用途 |")
    print("| --- | --- | --- | --- | --- |")
    for dest, spec in DESTINATION_REGISTRY.items():
        print(
            f"| `{dest.value}` | `{spec.path_template}` | `{spec.write_mode.value}` "
            f"| `{spec.sensitivity.value}` | {spec.description} |"
        )
    return 0


# ── campaign 子命令 ───────────────────────────────────────────────────────


def cmd_campaign_new(args: argparse.Namespace) -> int:
    try:
        paths = staging.bootstrap_staging(
            args.campaign_id, args.novel_id, overwrite=args.overwrite
        )
    except FileExistsError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    if args.json:
        print(json.dumps({
            "campaign_id": paths.campaign_id,
            "root": str(paths.root),
            "source_snapshot": str(paths.source_snapshot),
            "working": str(paths.working),
        }, ensure_ascii=False, indent=2))
    else:
        print(f"[OK] campaign '{args.campaign_id}' bootstrapped from novel '{args.novel_id}'")
        print(f"  root: {paths.root}")
        print(f"  working (writable): {paths.working}")
        print(f"  source_snapshot (read-only): {paths.source_snapshot}")
    return 0


def cmd_campaign_export(args: argparse.Namespace) -> int:
    try:
        bundle = staging.export_campaign(args.campaign_id, ts=args.timestamp)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    new_count = sum(1 for c in bundle.changed_files if c.action == "new")
    mod_count = sum(1 for c in bundle.changed_files if c.action == "modified")
    del_count = sum(1 for c in bundle.changed_files if c.action == "deleted")
    if args.json:
        print(json.dumps({
            "export_dir": str(bundle.export_dir),
            "manifest": str(bundle.manifest_path),
            "diff": str(bundle.diff_path),
            "readme": str(bundle.readme_path),
            "new": new_count, "modified": mod_count, "deleted": del_count,
            "changes": [
                {"rel_path": c.rel_path, "action": c.action, "summary": c.summary}
                for c in bundle.changed_files
            ],
        }, ensure_ascii=False, indent=2))
    else:
        print(f"[OK] exported: {bundle.export_dir}")
        print(f"  {new_count} new, {mod_count} modified, {del_count} deleted")
        print(f"  MANIFEST: {bundle.manifest_path}")
        print(f"  diff.patch: {bundle.diff_path}")
        print(f"  README: {bundle.readme_path}")
        print()
        print("作者請手動審閱 MANIFEST.md 後再決定是否反向整合進 novel_db。")
    return 0


def cmd_campaign_status(args: argparse.Namespace) -> int:
    try:
        meta = staging.load_meta(args.campaign_id)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    paths = staging.get_staging_paths(args.campaign_id)
    if args.json:
        out = dict(meta)
        out["paths"] = {
            "root": str(paths.root),
            "working": str(paths.working),
            "source_snapshot": str(paths.source_snapshot),
        }
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print(f"campaign: {meta.get('campaign_id')}")
        print(f"  novel:        {meta.get('novel_id')}")
        print(f"  status:       {meta.get('status')}")
        print(f"  bootstrapped: {meta.get('bootstrapped_at')}")
        if meta.get('updated_at'):
            print(f"  updated:      {meta.get('updated_at')}")
        print(f"  root:         {paths.root}")
    return 0


def cmd_campaign_list(args: argparse.Namespace) -> int:
    campaigns = staging.list_campaigns()
    if args.json:
        print(json.dumps(campaigns, ensure_ascii=False, indent=2))
        return 0
    if not campaigns:
        print("(no campaigns)")
        return 0
    for c in campaigns:
        print(f"- {c.get('campaign_id')}  novel={c.get('novel_id')}  status={c.get('status')}")
    return 0


def cmd_campaign_delete(args: argparse.Namespace) -> int:
    if not args.yes:
        ans = input(f"Delete staging for '{args.campaign_id}'? [y/N] ").strip().lower()
        if ans != "y":
            print("aborted.")
            return 0
    staging.delete_staging(args.campaign_id)
    print(f"[OK] deleted: {args.campaign_id}")
    return 0


# ── infer helpers ─────────────────────────────────────────────────────────


def _infer_novel_id_from_campaign(campaign_id: str | None) -> str:
    if not campaign_id:
        return "<unknown>"
    try:
        meta = staging.load_meta(campaign_id)
        return meta.get("novel_id", "<unknown>")
    except FileNotFoundError:
        return "<unknown>"


# ── 解析器 ────────────────────────────────────────────────────────────────


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="classifier", description="novel_db content router (staging-only writes)")
    sub = parser.add_subparsers(dest="cmd", required=True)

    def _add_common_content(p):
        p.add_argument("--novel-id", default=None, help="例如 novel_04_dungen；用於讀 overlay")
        p.add_argument("--campaign-id", default=None, help="staging campaign id；--apply 必填")
        p.add_argument("--apply", action="store_true", help="真正寫入；預設只 dry-run")
        p.add_argument("--yes", "-y", action="store_true", help="apply 時跳過確認")
        p.add_argument("--allow-nsfw", action="store_true")
        p.add_argument("--no-llm", action="store_true")
        p.add_argument("--json", action="store_true")

    # route
    p_route = sub.add_parser("route", help="分類單一 blob")
    src = p_route.add_mutually_exclusive_group(required=True)
    src.add_argument("--input", type=str)
    src.add_argument("--stdin", action="store_true")
    _add_common_content(p_route)
    p_route.set_defaults(func=cmd_route)

    # scan
    p_scan = sub.add_parser("scan", help="掃描資料夾批次分類")
    p_scan.add_argument("path", type=str)
    _add_common_content(p_scan)
    p_scan.set_defaults(func=cmd_scan)

    # preview (always dry-run)
    p_preview = sub.add_parser("preview", help="只看分類結果與 diff，不寫")
    src2 = p_preview.add_mutually_exclusive_group(required=True)
    src2.add_argument("--input", type=str)
    src2.add_argument("--stdin", action="store_true")
    _add_common_content(p_preview)
    p_preview.set_defaults(func=cmd_preview)

    # taxonomy-doc
    p_taxonomy = sub.add_parser("taxonomy-doc", help="輸出 destination 參考表")
    p_taxonomy.set_defaults(func=cmd_taxonomy_doc)

    # campaign 子命令
    p_camp = sub.add_parser("campaign", help="campaign staging 管理")
    camp_sub = p_camp.add_subparsers(dest="campaign_cmd", required=True)

    p_camp_new = camp_sub.add_parser("new", help="從 novel_db bootstrap 暫存區")
    p_camp_new.add_argument("--campaign-id", required=True)
    p_camp_new.add_argument("--novel-id", required=True)
    p_camp_new.add_argument("--overwrite", action="store_true")
    p_camp_new.add_argument("--json", action="store_true")
    p_camp_new.set_defaults(func=cmd_campaign_new)

    p_camp_export = camp_sub.add_parser("export", help="產 MANIFEST + diff bundle")
    p_camp_export.add_argument("--campaign-id", required=True)
    p_camp_export.add_argument("--timestamp", default=None, help="自訂 ts，預設 UTC ISO")
    p_camp_export.add_argument("--json", action="store_true")
    p_camp_export.set_defaults(func=cmd_campaign_export)

    p_camp_status = camp_sub.add_parser("status", help="顯示 campaign meta")
    p_camp_status.add_argument("--campaign-id", required=True)
    p_camp_status.add_argument("--json", action="store_true")
    p_camp_status.set_defaults(func=cmd_campaign_status)

    p_camp_list = camp_sub.add_parser("list", help="列出所有 campaign")
    p_camp_list.add_argument("--json", action="store_true")
    p_camp_list.set_defaults(func=cmd_campaign_list)

    p_camp_del = camp_sub.add_parser("delete", help="刪除 staging")
    p_camp_del.add_argument("--campaign-id", required=True)
    p_camp_del.add_argument("--yes", "-y", action="store_true")
    p_camp_del.set_defaults(func=cmd_campaign_delete)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
