"""Campaign staging — opera campaign 的可寫工作區。

設計原則（見 memory feedback_novel_db_read_only）：
- novel_db 對自動化工具絕對唯讀
- 所有 campaign 變動只能寫入此 staging 區
- export 時產 MANIFEST + diff + 變動檔拷貝，作者手動審閱與整合

目錄結構：
    {STAGING_ROOT}/{campaign_id}/
        source_snapshot/      ← campaign 起始時拷貝自 novel_db，之後唯讀
        working/              ← 唯一可寫區
        campaign_meta.json
        exports/{ts}/
            MANIFEST.md
            diff.patch
            README.md
            changed_files/
"""

from __future__ import annotations

import difflib
import json
import shutil
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

from classifier.config import STAGING_ROOT, is_under_novel_db, resolve_novel_root


# ── 路徑結構 ───────────────────────────────────────────────────────────────


@dataclass
class StagingPaths:
    campaign_id: str
    root: Path
    source_snapshot: Path
    working: Path
    meta_file: Path
    exports_dir: Path


def get_staging_paths(campaign_id: str) -> StagingPaths:
    """計算（不檢查存在性）staging 各路徑。"""
    if not campaign_id or "/" in campaign_id or "\\" in campaign_id or ".." in campaign_id:
        raise ValueError(f"非法 campaign_id: {campaign_id!r}")
    root = STAGING_ROOT / campaign_id
    return StagingPaths(
        campaign_id=campaign_id,
        root=root,
        source_snapshot=root / "source_snapshot",
        working=root / "working",
        meta_file=root / "campaign_meta.json",
        exports_dir=root / "exports",
    )


# ── 生命週期 ───────────────────────────────────────────────────────────────


def bootstrap_staging(
    campaign_id: str, novel_id: str, *, overwrite: bool = False
) -> StagingPaths:
    """從 `novel_db/{novel_id}/` 完整拷貝到 staging 的 source_snapshot 與 working。

    - 已存在且 overwrite=False → 拋 FileExistsError
    - novel_id 不存在 → 從 resolve_novel_root() 拋 FileNotFoundError
    - 寫 campaign_meta.json 記錄 novel_id、bootstrap 時間、status
    """
    paths = get_staging_paths(campaign_id)
    novel_root = resolve_novel_root(novel_id)

    if paths.root.exists():
        if not overwrite:
            raise FileExistsError(
                f"Campaign staging '{campaign_id}' 已存在於 {paths.root}。"
                f" 傳 overwrite=True 重新初始化，或先呼叫 delete_staging()。"
            )
        shutil.rmtree(paths.root)

    paths.root.mkdir(parents=True)
    shutil.copytree(novel_root, paths.source_snapshot)
    shutil.copytree(novel_root, paths.working)
    paths.exports_dir.mkdir()

    meta = {
        "campaign_id": campaign_id,
        "novel_id": novel_id,
        "novel_source_path": str(novel_root),
        "bootstrapped_at": datetime.now(UTC).isoformat(),
        "status": "active",
    }
    paths.meta_file.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return paths


def get_working_root(campaign_id: str) -> Path:
    """取得 working/ 路徑；不存在則拋例外。Writer 應永遠透過這拿 target_root。"""
    paths = get_staging_paths(campaign_id)
    if not paths.working.is_dir():
        raise FileNotFoundError(
            f"Campaign '{campaign_id}' staging 不存在於 {paths.root}。"
            f" 先呼叫 bootstrap_staging({campaign_id!r}, novel_id)。"
        )
    return paths.working


def get_source_snapshot_root(campaign_id: str) -> Path:
    paths = get_staging_paths(campaign_id)
    if not paths.source_snapshot.is_dir():
        raise FileNotFoundError(
            f"Campaign '{campaign_id}' source_snapshot 不存在。"
        )
    return paths.source_snapshot


def load_meta(campaign_id: str) -> dict:
    paths = get_staging_paths(campaign_id)
    if not paths.meta_file.exists():
        raise FileNotFoundError(f"campaign_meta.json 不存在於 {paths.meta_file}")
    return json.loads(paths.meta_file.read_text(encoding="utf-8"))


def update_status(campaign_id: str, status: str) -> None:
    meta = load_meta(campaign_id)
    meta["status"] = status
    meta["updated_at"] = datetime.now(UTC).isoformat()
    paths = get_staging_paths(campaign_id)
    paths.meta_file.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def list_campaigns() -> list[dict]:
    if not STAGING_ROOT.is_dir():
        return []
    out: list[dict] = []
    for child in sorted(STAGING_ROOT.iterdir()):
        if not child.is_dir():
            continue
        meta_file = child / "campaign_meta.json"
        if not meta_file.exists():
            continue
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            out.append(meta)
        except (json.JSONDecodeError, OSError):
            continue
    return out


def delete_staging(campaign_id: str) -> None:
    paths = get_staging_paths(campaign_id)
    if paths.root.exists():
        shutil.rmtree(paths.root)


def archive_campaign(campaign_id: str) -> Path:
    """把整個 campaign staging 打包到 exports 並標記 status=archived。回傳 archive 目錄。"""
    update_status(campaign_id, "archived")
    return export_campaign(campaign_id).export_dir


# ── Export ─────────────────────────────────────────────────────────────────


@dataclass
class ChangedFile:
    rel_path: str  # 相對於 working/
    action: str  # "new" | "modified" | "deleted"
    summary: str = ""


@dataclass
class ExportBundle:
    export_dir: Path
    manifest_path: Path
    diff_path: Path
    readme_path: Path
    changed_files: list[ChangedFile] = field(default_factory=list)


def export_campaign(campaign_id: str, *, ts: str | None = None) -> ExportBundle:
    """diff source_snapshot vs working，產 MANIFEST + patch + 變動檔拷貝。

    無變動時仍會建立 export 目錄（含空 MANIFEST），便於確認 campaign 真的沒推進。
    """
    paths = get_staging_paths(campaign_id)
    if not paths.working.is_dir():
        raise FileNotFoundError(f"Campaign '{campaign_id}' staging 不存在")

    timestamp = ts or datetime.now(UTC).strftime("%Y-%m-%dT%H-%M-%SZ")
    export_dir = paths.exports_dir / timestamp
    export_dir.mkdir(parents=True, exist_ok=True)
    changed_files_dir = export_dir / "changed_files"
    changed_files_dir.mkdir(exist_ok=True)

    changes = _diff_dirs(paths.source_snapshot, paths.working)

    for cf in changes:
        if cf.action in {"new", "modified"}:
            src = paths.working / cf.rel_path
            dst = changed_files_dir / cf.rel_path
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)

    try:
        meta = load_meta(campaign_id)
    except FileNotFoundError:
        meta = {"campaign_id": campaign_id, "novel_id": "<unknown>"}

    manifest_path = export_dir / "MANIFEST.md"
    manifest_path.write_text(
        _render_manifest(meta, timestamp, changes), encoding="utf-8"
    )

    diff_path = export_dir / "diff.patch"
    diff_path.write_text(
        _render_diff(paths.source_snapshot, paths.working, changes), encoding="utf-8"
    )

    readme_path = export_dir / "README.md"
    readme_path.write_text(_render_readme(meta), encoding="utf-8")

    return ExportBundle(
        export_dir=export_dir,
        manifest_path=manifest_path,
        diff_path=diff_path,
        readme_path=readme_path,
        changed_files=changes,
    )


# ── 內部 diff & render helpers ────────────────────────────────────────────


def _diff_dirs(snapshot: Path, working: Path) -> list[ChangedFile]:
    snapshot_files = {
        str(p.relative_to(snapshot)).replace("\\", "/"): p
        for p in snapshot.rglob("*")
        if p.is_file()
    }
    working_files = {
        str(p.relative_to(working)).replace("\\", "/"): p
        for p in working.rglob("*")
        if p.is_file()
    }

    changes: list[ChangedFile] = []
    for rel in sorted(working_files.keys()):
        work_path = working_files[rel]
        snap_path = snapshot_files.get(rel)
        if snap_path is None:
            changes.append(ChangedFile(rel_path=rel, action="new"))
        elif work_path.read_bytes() != snap_path.read_bytes():
            changes.append(ChangedFile(rel_path=rel, action="modified"))

    for rel in sorted(snapshot_files.keys() - working_files.keys()):
        changes.append(ChangedFile(rel_path=rel, action="deleted"))

    return changes


def _render_manifest(meta: dict, timestamp: str, changes: list[ChangedFile]) -> str:
    lines = [
        f"# Campaign Export — campaign_id={meta.get('campaign_id', '?')}",
        "",
        f"- Novel: `{meta.get('novel_id', '?')}`",
        f"- Source path: `{meta.get('novel_source_path', '?')}`",
        f"- Bootstrapped at: {meta.get('bootstrapped_at', '?')}",
        f"- Exported at: {timestamp}",
        f"- Status: {meta.get('status', 'active')}",
        "",
        "## 變動總覽",
        "",
    ]
    if not changes:
        lines.append("（無變動）")
        return "\n".join(lines) + "\n"

    by_action: dict[str, list[ChangedFile]] = {}
    for c in changes:
        by_action.setdefault(c.action, []).append(c)

    for action_label, key in [
        ("新增檔案", "new"),
        ("修改檔案", "modified"),
        ("刪除檔案", "deleted"),
    ]:
        items = by_action.get(key, [])
        if not items:
            continue
        lines.append(f"### {action_label}（{len(items)}）")
        lines.append("")
        for c in items:
            summary = f" — {c.summary}" if c.summary else ""
            lines.append(f"- `{c.rel_path}`{summary}")
        lines.append("")

    return "\n".join(lines) + "\n"


def _render_diff(snapshot: Path, working: Path, changes: list[ChangedFile]) -> str:
    chunks: list[str] = []
    for c in changes:
        if c.action == "new":
            new_text = (working / c.rel_path).read_text(encoding="utf-8", errors="replace").splitlines(keepends=True)
            diff = list(
                difflib.unified_diff(
                    [],
                    new_text,
                    fromfile=f"a/{c.rel_path}",
                    tofile=f"b/{c.rel_path}",
                    lineterm="",
                )
            )
            chunks.append("".join(diff))
        elif c.action == "modified":
            old = (snapshot / c.rel_path).read_text(encoding="utf-8", errors="replace").splitlines(keepends=True)
            new = (working / c.rel_path).read_text(encoding="utf-8", errors="replace").splitlines(keepends=True)
            diff = list(
                difflib.unified_diff(
                    old,
                    new,
                    fromfile=f"a/{c.rel_path}",
                    tofile=f"b/{c.rel_path}",
                    lineterm="",
                )
            )
            chunks.append("".join(diff))
        elif c.action == "deleted":
            old = (snapshot / c.rel_path).read_text(encoding="utf-8", errors="replace").splitlines(keepends=True)
            diff = list(
                difflib.unified_diff(
                    old,
                    [],
                    fromfile=f"a/{c.rel_path}",
                    tofile=f"b/{c.rel_path}",
                    lineterm="",
                )
            )
            chunks.append("".join(diff))
    return "\n".join(chunks)


def _render_readme(meta: dict) -> str:
    novel_id = meta.get("novel_id", "<novel_id>")
    return f"""# How to reintegrate this export

這份匯出是 campaign `{meta.get('campaign_id', '?')}` 從 novel `{novel_id}` 衍生的內容快照。
**novel_db 是真理來源；本匯出僅是參考。**請手動審閱再決定要不要合併。

## Option A — 完整套用（git apply）

    cd backend
    git apply <此匯出資料夾>/diff.patch
    # 然後檢視 git status / git diff，喜歡就 git add，不喜歡就 git checkout

## Option B — 個別檔案 copy

`changed_files/` 下是所有新增 / 修改檔的扁平拷貝。逐檔複製到 `novel_db/{novel_id}/`
對應位置即可。

## Option C — 純參考

讀 `MANIFEST.md` 取概觀，然後在 `novel_db/{novel_id}/` 中親自重寫你想保留的情節。

## 撤銷整合

如果整合後想退回 novel_db 原狀：

    git restore novel_db/{novel_id}/
"""
