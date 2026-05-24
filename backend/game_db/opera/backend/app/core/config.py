from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv


def _load_workspace_env() -> Path | None:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "workspace.env"
        if candidate.is_file():
            load_dotenv(candidate, override=True)
            return candidate
    load_dotenv()
    return None


WORKSPACE_ENV_PATH = _load_workspace_env()


@dataclass(slots=True)
class Settings:
    app_name: str = "Opera TRPG"
    api_prefix: str = "/api"
    database_url: str = field(
        default_factory=lambda: os.getenv(
            "OPERA_DATABASE_URL",
            "sqlite+pysqlite:///./opera_trpg.db",
        )
    )
    openrouter_api_key: str | None = field(
        default_factory=lambda: os.getenv("OPENROUTER_API_KEY")
    )
    openrouter_base_url: str = field(
        default_factory=lambda: os.getenv(
            "OPENROUTER_BASE_URL",
            "https://openrouter.ai/api/v1",
        )
    )
    site_url: str = field(
        default_factory=lambda: os.getenv(
            "OPENROUTER_SITE_URL",
            "http://localhost:5173",
        )
    )
    site_name: str = field(
        default_factory=lambda: os.getenv("OPENROUTER_SITE_NAME", "Opera TRPG")
    )
    memory_token_threshold: int = field(
        default_factory=lambda: int(os.getenv("OPERA_MEMORY_TOKEN_THRESHOLD", "900"))
    )
    retrieval_limit: int = field(
        default_factory=lambda: int(os.getenv("OPERA_RETRIEVAL_LIMIT", "4"))
    )
    cors_origins: list[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv(
                "OPERA_CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173",
            ).split(",")
            if origin.strip()
        ]
    )
    project_root: Path = field(
        default_factory=lambda: Path(__file__).resolve().parents[3]
    )
    workspace_env_path: Path | None = WORKSPACE_ENV_PATH
    # Staging 自動同步：每回合結束時把 opera 狀態寫進 classifier staging working/。
    # 永遠不會碰 novel_db（由 classifier writer hard guard 保證）。
    staging_sync_enabled: bool = field(
        default_factory=lambda: os.getenv("OPERA_STAGING_SYNC", "1").lower()
        not in {"0", "false", "off", "no"}
    )


def get_settings() -> Settings:
    return Settings()

