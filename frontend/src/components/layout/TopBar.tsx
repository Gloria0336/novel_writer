import type { BridgeStatus, RepoConfig } from "../../types/app";

interface TopBarProps {
  repoConfig: RepoConfig;
  selectedPath?: string;
  activeView: "ai" | "files";
  repoStatus: "idle" | "loading" | "ready" | "error";
  bridgeStatus?: BridgeStatus | null;
  sidebarOpen: boolean;
  dockOpen: boolean;
  onSwitchView: (view: "ai" | "files") => void;
  onRefreshRepo: () => void;
  onToggleSidebar: () => void;
  onToggleDock: () => void;
  onOpenSettings: () => void;
}

export function TopBar(props: TopBarProps) {
  const {
    repoConfig,
    selectedPath,
    activeView,
    repoStatus,
    bridgeStatus,
    sidebarOpen,
    dockOpen,
    onSwitchView,
    onRefreshRepo,
    onToggleSidebar,
    onToggleDock,
    onOpenSettings,
  } = props;

  const repoStatusLabel = {
    idle: "Idle",
    loading: "Loading",
    ready: "Ready",
    error: "Error",
  }[repoStatus];

  return (
    <header className="topbar">
      <div className="topbar-group">
        <div>
          <div className="eyebrow">Novel Writer</div>
          <div className="topbar-title">{selectedPath ?? "Select a chapter or canon file"}</div>
        </div>
        <nav className="topbar-nav" aria-label="Primary views">
          <button
            className={`workspace-tab ${activeView === "ai" ? "is-active" : ""}`}
            onClick={() => onSwitchView("ai")}
            type="button"
          >
            AI Chat
          </button>
          <button
            className={`workspace-tab ${activeView === "files" ? "is-active" : ""}`}
            onClick={() => onSwitchView("files")}
            type="button"
          >
            Files
          </button>
        </nav>
      </div>
      <div className="topbar-group">
        <span className={`status-pill status-${repoStatus}`}>{repoStatusLabel}</span>
        <span className="selected-file-chip">
          {repoConfig.owner}/{repoConfig.repo}@{repoConfig.branch}
        </span>
        {bridgeStatus ? (
          <span className={`status-pill ${bridgeStatus.ok ? "status-ready" : "status-error"}`}>
            Bridge: {bridgeStatus.repoAdapter}
          </span>
        ) : null}
        <button className="ghost-button" onClick={onRefreshRepo} type="button">
          Refresh Repo
        </button>
        <button className="ghost-button" onClick={onToggleSidebar} type="button">
          {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        </button>
        <button className="ghost-button" onClick={onToggleDock} type="button">
          {dockOpen ? "Hide Changes" : "Show Changes"}
        </button>
        <button className="solid-button" onClick={onOpenSettings} type="button">
          Settings
        </button>
      </div>
    </header>
  );
}
