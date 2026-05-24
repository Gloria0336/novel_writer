"""Campaign staging 整合測試 — bootstrap、sync、export、novel_db 唯讀驗證。

不打 LLM；opera_adapter 提供的 destination_hint 已讓 router 跳過 LLM。
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# 確保 classifier 套件可 import
_BACKEND_ROOT = Path(__file__).resolve().parents[4]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from backend.app.db import Base
from backend.app.models import (
    ActorProfile,
    Campaign,
    DirectorNote,
    GMBrief,
    Rulebook,
    StoryEvent,
    StoryStateSnapshot,
    WorldEntry,
)


# ── fixtures ───────────────────────────────────────────────────────────────


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def isolated_paths(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> dict:
    """建假的 novel_db + staging 目錄結構並重指各模組常數。

    回傳 dict 含實際路徑。
    """
    novel_db = tmp_path / "novel_db"
    novel = novel_db / "novel_test"
    (novel / "bible").mkdir(parents=True)
    (novel / "context").mkdir()
    (novel / "regions").mkdir()
    (novel / "bible" / "character.md").write_text(
        "# Character\n\n## char_007\n\n初始設定\n", encoding="utf-8"
    )
    (novel / "bible" / "worldbuilding.md").write_text(
        "# World\n\n## premise\n\n初始世界觀\n", encoding="utf-8"
    )
    (novel / "context" / "CONTEXT.md").write_text(
        "# CONTEXT\n\n初始摘要\n", encoding="utf-8"
    )

    staging_root = tmp_path / "staging"

    # 重指 classifier 端常數
    monkeypatch.setattr("classifier.config.NOVEL_DB_ROOT", novel_db)
    monkeypatch.setattr("classifier.config.STAGING_ROOT", staging_root)
    monkeypatch.setattr("classifier.staging.STAGING_ROOT", staging_root)
    # 重指 opera 端的 novel_db_overlay（它有獨立的 NOVEL_DB_ROOT 常數）
    monkeypatch.setattr("backend.app.engine.novel_db_overlay.NOVEL_DB_ROOT", novel_db)

    return {"novel_db": novel_db, "novel": novel, "staging_root": staging_root}


def _build_minimal_campaign(session, *, name: str = "Test", novel_id: str = "novel_test") -> Campaign:
    """直接建一個 Campaign + Rulebook（避開 create_campaign 的 default 行為）。"""
    campaign = Campaign(
        name=name,
        description="test",
        status="active",
        metadata_json={"novel_id": novel_id, "premise": "x"},
    )
    session.add(campaign)
    session.flush()
    session.add(Rulebook(
        campaign_id=campaign.id,
        name="test rulebook",
        version="0.0",
        payload_json={"name": "test"},
    ))
    session.commit()
    session.refresh(campaign)
    return campaign


# ── bootstrap ──────────────────────────────────────────────────────────────


def test_bootstrap_copies_novel_db_to_staging(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    paths = campaign_staging.bootstrap(campaign)
    assert paths is not None
    assert paths.working.is_dir()
    # working/ 應該含 novel_db 的內容
    assert (paths.working / "bible" / "character.md").exists()
    # source_snapshot 也有同樣內容
    assert (paths.source_snapshot / "bible" / "character.md").read_text(encoding="utf-8") \
        == isolated_paths["novel"].joinpath("bible/character.md").read_text(encoding="utf-8")


def test_bootstrap_returns_none_when_no_novel_id(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = Campaign(
        name="no novel", description="", status="active", metadata_json={}
    )
    db_session.add(campaign)
    db_session.commit()
    db_session.refresh(campaign)
    assert campaign_staging.bootstrap(campaign) is None


def test_get_working_root_none_before_bootstrap(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    assert campaign_staging.get_working_root(campaign) is None


# ── sync_run ──────────────────────────────────────────────────────────────


def test_sync_writes_actor_to_staging_not_novel_db(
    isolated_paths, db_session
) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)

    # 加一個 actor
    db_session.add(ActorProfile(
        campaign_id=campaign.id,
        name="夢玲",
        role="npc",
        persona="認真熱心",
        motives_json=["保護同伴"],
        model_name="x",
        metadata_json={"char_id": "char_999"},
    ))
    db_session.commit()

    stats = campaign_staging.sync_run(db_session, campaign.id)
    assert stats["status"] == "ok"
    assert stats["applied"] >= 1

    # 驗證寫入 staging working/
    working = campaign_staging.get_working_root(campaign)
    char_md = working / "bible" / "character.md"
    assert "char_999" in char_md.read_text(encoding="utf-8")

    # **關鍵：驗證 novel_db 沒被動**
    original_char = isolated_paths["novel"] / "bible" / "character.md"
    assert "char_999" not in original_char.read_text(encoding="utf-8")


def test_sync_writes_director_note_to_staging_secrets(
    isolated_paths, db_session
) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)
    db_session.add(DirectorNote(
        campaign_id=campaign.id,
        note_type="foreshadow",
        title="深淵裂縫",
        body="第三層底端有未公開的裂縫",
        payload_json={},
        is_consumed=False,
    ))
    db_session.commit()

    stats = campaign_staging.sync_run(db_session, campaign.id)
    assert stats["applied"] >= 1

    working = campaign_staging.get_working_root(campaign)
    secrets = working / "context" / "secrets-lockbox.md"
    assert secrets.exists()
    text = secrets.read_text(encoding="utf-8")
    assert "secret-foreshadow-" in text
    assert "深淵裂縫" in text

    # novel_db 唯讀驗證
    original_secrets = isolated_paths["novel"] / "context" / "secrets-lockbox.md"
    if original_secrets.exists():
        assert "深淵裂縫" not in original_secrets.read_text(encoding="utf-8")


def test_sync_is_idempotent(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)
    db_session.add(ActorProfile(
        campaign_id=campaign.id, name="x", role="npc", persona="p",
        motives_json=[], model_name="x", metadata_json={"char_id": "char_100"},
    ))
    db_session.commit()

    stats1 = campaign_staging.sync_run(db_session, campaign.id)
    stats2 = campaign_staging.sync_run(db_session, campaign.id)
    # 第二次跑 noop 應 >= 第一次 applied（因為已寫入，沒新變化）
    assert stats2["applied"] == 0
    assert stats2["noop"] >= 1


def test_sync_unknown_campaign_raises(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    with pytest.raises(ValueError):
        campaign_staging.sync_run(db_session, "fake_id")


def test_sync_without_novel_id_returns_skipped(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = Campaign(name="x", description="", status="active", metadata_json={})
    db_session.add(campaign)
    db_session.flush()  # 讓 campaign.id 真的被指派
    db_session.add(Rulebook(campaign_id=campaign.id, name="r", version="0.0", payload_json={}))
    db_session.commit()
    db_session.refresh(campaign)
    stats = campaign_staging.sync_run(db_session, campaign.id)
    assert stats["status"] == "skipped"


# ── export ─────────────────────────────────────────────────────────────────


def test_export_produces_bundle(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)
    db_session.add(ActorProfile(
        campaign_id=campaign.id, name="x", role="npc", persona="p",
        motives_json=[], model_name="x", metadata_json={"char_id": "char_777"},
    ))
    db_session.commit()
    campaign_staging.sync_run(db_session, campaign.id)

    bundle = campaign_staging.export(campaign, ts="T0")
    assert bundle is not None
    assert bundle.manifest_path.exists()
    assert bundle.diff_path.exists()
    assert bundle.readme_path.exists()
    # bible/character.md 應該被列為 modified
    actions = {c.rel_path: c.action for c in bundle.changed_files}
    assert actions.get("bible/character.md") == "modified"
    # diff.patch 應含 char_777
    assert "char_777" in bundle.diff_path.read_text(encoding="utf-8")


def test_export_without_staging_returns_none(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    # 沒 bootstrap
    assert campaign_staging.export(campaign) is None


# ── status ────────────────────────────────────────────────────────────────


def test_status_before_bootstrap(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    st = campaign_staging.status(campaign)
    assert st["bootstrapped"] is False


def test_status_after_bootstrap(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)
    st = campaign_staging.status(campaign)
    assert st["bootstrapped"] is True
    assert st["novel_id"] == "novel_test"
    assert "paths" in st


# ── create_campaign_from_novel 整合 ───────────────────────────────────────


def test_create_campaign_from_novel_auto_bootstraps(
    isolated_paths, db_session
) -> None:
    from backend.app.services import campaign_staging
    from backend.app.services.campaigns import create_campaign_from_novel

    payload = SimpleNamespace(
        novel_id="novel_test",
        name="auto",
        description="",
        premise="",
        player_char_id=None,
    )
    campaign = create_campaign_from_novel(db_session, payload)
    # staging metadata 應記錄成功
    assert campaign.metadata_json.get("staging_bootstrapped") is True
    # working/ 真的存在
    working = campaign_staging.get_working_root(campaign)
    assert working is not None and working.is_dir()


# ── novel_db 唯讀完整性 ─────────────────────────────────────────────────────


# ── dry_run / leak_guard / changelog (Phase F) ─────────────────────────────


def test_sync_dry_run_does_not_write(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)
    db_session.add(ActorProfile(
        campaign_id=campaign.id, name="x", role="npc", persona="p",
        motives_json=[], model_name="x", metadata_json={"char_id": "char_555"},
    ))
    db_session.commit()

    stats = campaign_staging.sync_run(db_session, campaign.id, dry_run=True)
    assert stats["dry_run"] is True
    assert stats["applied"] == 0
    assert isinstance(stats["dry_run_diffs"], list)
    assert any("char_555" in d["diff"] for d in stats["dry_run_diffs"])

    # 真實檔案沒被動
    working = campaign_staging.get_working_root(campaign)
    char_md = working / "bible" / "character.md"
    assert "char_555" not in char_md.read_text(encoding="utf-8")


def test_sync_writes_changelog(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)
    db_session.add(ActorProfile(
        campaign_id=campaign.id, name="x", role="npc", persona="p",
        motives_json=[], model_name="x", metadata_json={"char_id": "char_888"},
    ))
    db_session.commit()

    campaign_staging.sync_run(db_session, campaign.id)
    working = campaign_staging.get_working_root(campaign)
    log = working / "context" / "_changelog.md"
    assert log.exists()
    text = log.read_text(encoding="utf-8")
    assert "bible/character.md" in text
    assert "bible_character" in text


def test_sync_changelog_can_be_disabled(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)
    db_session.add(ActorProfile(
        campaign_id=campaign.id, name="x", role="npc", persona="p",
        motives_json=[], model_name="x", metadata_json={"char_id": "char_999"},
    ))
    db_session.commit()

    campaign_staging.sync_run(db_session, campaign.id, write_changelog=False)
    working = campaign_staging.get_working_root(campaign)
    assert not (working / "context" / "_changelog.md").exists()


def test_leak_guard_blocks_secret_text_in_public_write(
    isolated_paths, db_session
) -> None:
    """director_note 寫入後，下次同步若有 actor body 含 secret 字串，PUBLIC 寫入應被擋。"""
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)

    # 先建一個 director_note 並 sync，讓 secret 進入 lockbox
    db_session.add(DirectorNote(
        campaign_id=campaign.id, note_type="twist",
        title="夢玲身分", body="夢玲其實是被深淵感染的雙面諜體質。",
        payload_json={}, is_consumed=False,
    ))
    db_session.commit()
    campaign_staging.sync_run(db_session, campaign.id)

    # 再加一個 actor，其 persona 含上面 secret 字串
    db_session.add(ActorProfile(
        campaign_id=campaign.id, name="洩漏者", role="npc",
        persona="夢玲其實是被深淵感染的雙面諜體質。",  # 故意洩漏
        motives_json=[], model_name="x",
        metadata_json={"char_id": "char_leak"},
    ))
    db_session.commit()

    stats = campaign_staging.sync_run(db_session, campaign.id)
    assert stats["leak_blocked"] >= 1
    leak_errors = [e for e in stats["errors"] if e["kind"] == "secrets_leak"]
    assert leak_errors

    # PUBLIC 角色檔不該含洩漏內容
    working = campaign_staging.get_working_root(campaign)
    char_md = working / "bible" / "character.md"
    assert "雙面諜體質" not in char_md.read_text(encoding="utf-8")


def test_leak_guard_can_be_disabled(isolated_paths, db_session) -> None:
    """leak_guard=False 時，即使有洩漏也照寫（給特殊情況用）。"""
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)
    db_session.add(DirectorNote(
        campaign_id=campaign.id, note_type="twist",
        title="x", body="極機密內容請勿洩漏到公開檔案。",
        payload_json={}, is_consumed=False,
    ))
    db_session.commit()
    campaign_staging.sync_run(db_session, campaign.id)

    db_session.add(ActorProfile(
        campaign_id=campaign.id, name="洩", role="npc",
        persona="極機密內容請勿洩漏到公開檔案。",
        motives_json=[], model_name="x", metadata_json={"char_id": "char_X"},
    ))
    db_session.commit()
    stats = campaign_staging.sync_run(db_session, campaign.id, leak_guard=False)
    assert stats["leak_blocked"] == 0


def test_calendar_anchor_drives_date_tag(isolated_paths, db_session) -> None:
    from backend.app.services import campaign_staging

    campaign = _build_minimal_campaign(db_session)
    # 自訂 anchor：從 Y005-M06-D10 起
    meta = dict(campaign.metadata_json)
    meta["calendar_anchor"] = {"year": 5, "month": 6, "day": 10}
    campaign.metadata_json = meta
    db_session.commit()
    campaign_staging.bootstrap(campaign)

    # 加一個 scene 事件
    db_session.add(StoryEvent(
        campaign_id=campaign.id, run_id=None, sequence_no=3,
        event_kind="scene", source_channel="gm", actor_id=None,
        title="市集探索", body="夢玲走進市集。", visibility_scope="public",
        payload_json={},
    ))
    db_session.commit()
    stats = campaign_staging.sync_run(db_session, campaign.id)
    # date_tag 應該基於 anchor + sequence_no=3 → Y005-M06-D13
    assert stats["date_tag"] == "Y005-M06-D13"
    working = campaign_staging.get_working_root(campaign)
    daily = working / "updates" / "daily" / "Y005-M06-D13.md"
    assert daily.exists()


def test_novel_db_untouched_after_full_lifecycle(
    isolated_paths, db_session
) -> None:
    """跑完 bootstrap + 多次 sync + export，novel_db 內容應與起始 hash 相同。"""
    from backend.app.services import campaign_staging

    novel_db = isolated_paths["novel_db"]
    # snapshot novel_db 的所有檔案 hash
    import hashlib

    def _snapshot_hashes(root: Path) -> dict[str, str]:
        out = {}
        for p in root.rglob("*"):
            if p.is_file():
                out[str(p.relative_to(root))] = hashlib.sha256(p.read_bytes()).hexdigest()
        return out

    before = _snapshot_hashes(novel_db)
    assert before, "novel_db fixture 應有檔案"

    campaign = _build_minimal_campaign(db_session)
    campaign_staging.bootstrap(campaign)
    db_session.add_all([
        ActorProfile(
            campaign_id=campaign.id, name=n, role="npc", persona="p",
            motives_json=[], model_name="x", metadata_json={"char_id": f"char_{i:03d}"},
        )
        for i, n in enumerate(["a", "b", "c"])
    ])
    db_session.add(DirectorNote(
        campaign_id=campaign.id, note_type="twist", title="t", body="b",
        payload_json={}, is_consumed=False,
    ))
    db_session.commit()

    campaign_staging.sync_run(db_session, campaign.id)
    campaign_staging.sync_run(db_session, campaign.id)  # 二次
    campaign_staging.export(campaign, ts="T1")

    after = _snapshot_hashes(novel_db)
    assert after == before, "novel_db 在整個生命週期內應該完全沒變動"
