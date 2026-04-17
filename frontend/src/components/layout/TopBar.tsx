import type { RepoConfig } from "../../types/app";

interface TopBarProps {
  repoConfig: RepoConfig;
  selectedPath?: string;
  sidebarOpen: boolean;
  dockOpen: boolean;
  repoStatus: "idle" | "loading" | "ready" | "error";
  onToggleSidebar: () => void;
  onToggleDock: () => void;
  onRefreshRepo: () => void;
  onOpenSettings: () => void;
}

export function TopBar(props: TopBarProps) {
  const { repoConfig, selectedPath, sidebarOpen, dockOpen, repoStatus, onToggleSidebar, onToggleDock, onRefreshRepo, onOpenSettings } =
    props;

  const repoStatusLabel = {
    idle: "待命",
    loading: "同步中",
    ready: "已就緒",
    error: "錯誤",
  }[repoStatus];

  return (
    <header className="topbar">
      <div className="topbar-group">
        <button className="ghost-button" onClick={onToggleSidebar} type="button">
          {sidebarOpen ? "隱藏檔案樹" : "顯示檔案樹"}
        </button>
        <div>
          <div className="eyebrow">小說工作台</div>
          <div className="topbar-title">{selectedPath ?? "尚未選取文檔"}</div>
        </div>
      </div>
      <div className="topbar-group">
        <span className={`status-pill status-${repoStatus}`}>{repoStatusLabel}</span>
        <div className="selected-file-chip">
          {repoConfig.owner}/{repoConfig.repo}@{repoConfig.branch}
        </div>
        <button className="ghost-button" onClick={onRefreshRepo} type="button">
          重新整理
        </button>
        <button className="ghost-button" onClick={onToggleDock} type="button">
          {dockOpen ? "隱藏 AI 區" : "顯示 AI 區"}
        </button>
        <button className="solid-button" onClick={onOpenSettings} type="button">
          設定
        </button>
      </div>
    </header>
  );
}
