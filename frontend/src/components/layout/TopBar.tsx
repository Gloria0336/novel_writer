import type { RepoConfig } from "../../types/app";

interface TopBarProps {
  repoConfig: RepoConfig;
  selectedPath?: string;
  sidebarOpen: boolean;
  repoStatus: "idle" | "loading" | "ready" | "error";
  hasGitHubToken: boolean;
  hasOpenRouterKey: boolean;
  onToggleSidebar: () => void;
  onRefreshRepo: () => void;
  onOpenSettings: () => void;
}

export function TopBar(props: TopBarProps) {
  const {
    repoConfig,
    selectedPath,
    sidebarOpen,
    repoStatus,
    hasGitHubToken,
    hasOpenRouterKey,
    onToggleSidebar,
    onRefreshRepo,
    onOpenSettings,
  } = props;

  return (
    <header className="topbar">
      <div className="topbar-group">
        <button className="ghost-button" onClick={onToggleSidebar} type="button">
          {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        </button>
        <div>
          <div className="eyebrow">Novel Writer Console</div>
          <div className="topbar-title">
            {repoConfig.owner}/{repoConfig.repo} <span>@ {repoConfig.branch}</span>
          </div>
        </div>
      </div>
      <div className="topbar-center">
        <span className={`status-pill status-${repoStatus}`}>{repoStatus}</span>
        <span className={`status-pill ${hasGitHubToken ? "status-live" : "status-muted"}`}>
          GitHub {hasGitHubToken ? "PAT ready" : "read-only"}
        </span>
        <span className={`status-pill ${hasOpenRouterKey ? "status-live" : "status-muted"}`}>
          OpenRouter {hasOpenRouterKey ? "key ready" : "offline"}
        </span>
      </div>
      <div className="topbar-group">
        <div className="selected-file-chip">{selectedPath ?? "No file selected"}</div>
        <button className="ghost-button" onClick={onRefreshRepo} type="button">
          Refresh HEAD
        </button>
        <button className="solid-button" onClick={onOpenSettings} type="button">
          Settings
        </button>
      </div>
    </header>
  );
}

