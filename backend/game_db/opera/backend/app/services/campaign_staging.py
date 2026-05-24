"""opera ↔ classifier.staging 整合層。

職責：
- bootstrap：campaign 起始時建立 staging（從 novel_db 拷貝至 working/source_snapshot）
- sync_run：每回合結束時，把 opera ORM 狀態轉成 ClassifierInput → 寫進 working/
- export：campaign 結束 / 中斷時產 MANIFEST + diff bundle

最高原則：**永遠不寫 novel_db**（由 classifier writer hard guard 保證）。
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from backend.app.models import Campaign

# 把 backend/ 加到 sys.path，讓 classifier 套件可 import
_BACKEND_ROOT = Path(__file__).resolve().parents[5]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from classifier import calendar_sync, opera_adapter, staging  # noqa: E402
from classifier.feeds import bible_changelog  # noqa: E402
from classifier.router import route as classifier_route  # noqa: E402
from classifier.rules.leak_guard import SecretLeakError, scan_for_leaks  # noqa: E402
from classifier.writers.base import (  # noqa: E402
    NovelDbWriteForbidden,
    apply_preview,
    write_preview,
)


# ── 公開 API ───────────────────────────────────────────────────────────────


def staging_id_for(campaign: Campaign) -> str:
    """從 campaign 解析 staging id；預設用 opera campaign.id。

    使用者可在 `campaign.metadata_json["staging_id"]` 覆寫成人類可讀名稱。
    """
    meta = campaign.metadata_json or {}
    return meta.get("staging_id") or campaign.id


def novel_id_for(campaign: Campaign) -> str | None:
    meta = campaign.metadata_json or {}
    nid = meta.get("novel_id")
    return nid if isinstance(nid, str) and nid else None


def bootstrap(campaign: Campaign, *, overwrite: bool = False) -> staging.StagingPaths | None:
    """campaign 起始時建立 staging。若 campaign 沒綁 novel_id，回 None（無 staging）。"""
    novel_id = novel_id_for(campaign)
    if not novel_id:
        return None
    return staging.bootstrap_staging(
        staging_id_for(campaign), novel_id, overwrite=overwrite
    )


def get_working_root(campaign: Campaign) -> Path | None:
    """取得 working/ 路徑；若 staging 未 bootstrap 則 None。"""
    try:
        return staging.get_working_root(staging_id_for(campaign))
    except FileNotFoundError:
        return None


def sync_run(
    session: Session,
    campaign_id: str,
    *,
    allow_nsfw: bool = False,
    date_tag: str | None = None,
    dry_run: bool = False,
    leak_guard: bool = True,
    write_changelog: bool = True,
) -> dict[str, Any]:
    """把 opera campaign 完整狀態同步到 staging working/。

    冪等：對相同狀態多次呼叫，第二次起 diff 都會是空。

    Args:
        dry_run: 只算 diff，不真寫；stats 含 `dry_run_diffs` 預覽清單。
        leak_guard: PUBLIC destinations 寫入前掃 secrets-lockbox；命中則跳過該筆。
        write_changelog: 寫入後追加 working/context/_changelog.md 一列。
        date_tag: 強制覆寫所有 StoryEvent 的日期；None 則用 calendar_sync。
    """
    # 延後 import 避免循環
    from backend.app.services.campaigns import get_campaign_components

    campaign = session.get(Campaign, campaign_id)
    if not campaign:
        raise ValueError(f"campaign {campaign_id} 不存在")

    novel_id = novel_id_for(campaign)
    if not novel_id:
        return {"status": "skipped", "reason": "campaign 未綁定 novel_id"}

    working = get_working_root(campaign)
    if working is None:
        return {"status": "skipped", "reason": "staging 未 bootstrap；先呼叫 bootstrap()"}

    bundle = get_campaign_components(session, campaign_id)

    # 未指定 date_tag → 用 calendar_sync 算（依最後一筆 event 的 sequence_no）
    if date_tag is None:
        last_seq = bundle["timeline"][-1].sequence_no if bundle["timeline"] else 0
        date_tag = calendar_sync.date_tag_for_event(campaign.metadata_json, last_seq)

    inputs = opera_adapter.collect_inputs(
        novel_id=novel_id,
        world_entries=bundle["world_entries"],
        actors=bundle["actors"],
        director_notes=bundle["director_notes"],
        gm_briefs=bundle["gm_briefs"],
        story_events=bundle["timeline"],
        date_tag=date_tag,
    )

    stats: dict[str, Any] = {
        "status": "ok",
        "novel_id": novel_id,
        "staging_id": staging_id_for(campaign),
        "working": str(working),
        "total_inputs": len(inputs),
        "applied": 0,
        "noop": 0,
        "skipped": 0,
        "leak_blocked": 0,
        "date_tag": date_tag,
        "dry_run": dry_run,
        "errors": [],
        "dry_run_diffs": [] if dry_run else None,
    }

    for inp in inputs:
        try:
            output = classifier_route(inp, use_llm=False)  # opera_adapter 已給 hint，無需 LLM
            preview = write_preview(output, working, allow_nsfw=allow_nsfw)
        except PermissionError as exc:
            stats["skipped"] += 1
            stats["errors"].append({"opera_id": inp.hints.get("opera_id"), "kind": "nsfw_blocked", "msg": str(exc)})
            continue
        except NovelDbWriteForbidden as exc:
            # 這條防線不該被觸發（target_root 是 staging）；觸發代表上游有 bug
            stats["skipped"] += 1
            stats["errors"].append({"opera_id": inp.hints.get("opera_id"), "kind": "guard_triggered", "msg": str(exc)})
            continue
        except Exception as exc:  # pragma: no cover  # 防禦性
            stats["skipped"] += 1
            stats["errors"].append({"opera_id": inp.hints.get("opera_id"), "kind": "preview_failed", "msg": str(exc)})
            continue

        if preview.is_noop:
            stats["noop"] += 1
            continue

        # Leak guard：PUBLIC destination 寫入前掃 secrets-lockbox
        if leak_guard:
            leak_warnings = scan_for_leaks(output.destination, preview.new_text, working)
            if leak_warnings:
                stats["leak_blocked"] += 1
                stats["errors"].append({
                    "opera_id": inp.hints.get("opera_id"),
                    "kind": "secrets_leak",
                    "msg": f"PUBLIC {output.destination} 含 {len(leak_warnings)} 筆 secrets-lockbox 字串",
                    "warnings": [
                        {"secret_id": w.secret_id, "fragment": w.fragment} for w in leak_warnings
                    ],
                })
                continue

        if dry_run:
            stats["dry_run_diffs"].append({
                "destination": output.destination,
                "target": str(preview.target_path),
                "is_new_file": preview.is_new_file,
                "diff": preview.diff,
            })
            continue

        try:
            apply_preview(preview)
        except NovelDbWriteForbidden as exc:
            stats["skipped"] += 1
            stats["errors"].append({"opera_id": inp.hints.get("opera_id"), "kind": "guard_triggered", "msg": str(exc)})
            continue
        stats["applied"] += 1

        if write_changelog:
            try:
                bible_changelog.append_entry(working, output=output, target_path=preview.target_path)
            except Exception as exc:  # pragma: no cover
                stats["errors"].append({"opera_id": inp.hints.get("opera_id"), "kind": "changelog_failed", "msg": str(exc)})

    # 更新 campaign.metadata_json.last_staging_sync_at（dry_run 也記）
    from datetime import UTC, datetime

    meta = dict(campaign.metadata_json or {})
    meta["last_staging_sync_at"] = datetime.now(UTC).isoformat()
    meta["last_staging_sync_stats"] = {
        k: v for k, v in stats.items()
        if k in {"applied", "noop", "skipped", "leak_blocked", "total_inputs", "dry_run", "date_tag"}
    }
    campaign.metadata_json = meta
    session.commit()

    return stats


def export(campaign: Campaign, *, ts: str | None = None) -> staging.ExportBundle | None:
    """campaign 結束 / 中斷時產 MANIFEST + diff bundle。

    無 staging 時回 None。
    """
    if get_working_root(campaign) is None:
        return None
    return staging.export_campaign(staging_id_for(campaign), ts=ts)


def status(campaign: Campaign) -> dict[str, Any]:
    """staging 狀態速覽（給 API 用）。"""
    try:
        meta = staging.load_meta(staging_id_for(campaign))
    except FileNotFoundError:
        return {"bootstrapped": False, "staging_id": staging_id_for(campaign)}
    paths = staging.get_staging_paths(staging_id_for(campaign))
    return {
        "bootstrapped": True,
        "staging_id": staging_id_for(campaign),
        "novel_id": meta.get("novel_id"),
        "status": meta.get("status"),
        "bootstrapped_at": meta.get("bootstrapped_at"),
        "updated_at": meta.get("updated_at"),
        "paths": {
            "root": str(paths.root),
            "working": str(paths.working),
            "source_snapshot": str(paths.source_snapshot),
            "exports": str(paths.exports_dir),
        },
        "last_sync": (campaign.metadata_json or {}).get("last_staging_sync_at"),
        "last_sync_stats": (campaign.metadata_json or {}).get("last_staging_sync_stats"),
    }


def teardown(campaign: Campaign) -> None:
    """刪除 campaign 的 staging（一般不用；除非要徹底清掉）。"""
    staging.delete_staging(staging_id_for(campaign))
