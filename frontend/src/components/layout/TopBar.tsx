interface TopBarProps {
  activeView: "ai" | "editor" | "opera";
  sidebarOpen: boolean;
  tweaksOpen: boolean;
  repoStatus: "idle" | "loading" | "ready" | "error";
  onSwitchView: (view: "ai" | "editor" | "opera") => void;
  onToggleSidebar: () => void;
  onToggleTweaks: () => void;
  onOpenSettings: () => void;
}

function StatusChip({ repoStatus }: Pick<TopBarProps, "repoStatus">) {
  const labelMap = {
    idle: "Idle",
    loading: "Loading",
    ready: "Ready",
    error: "Error",
  } as const;

  return <span className={`topbar-status is-${repoStatus}`}>{labelMap[repoStatus]}</span>;
}

export function TopBar(props: TopBarProps) {
  const {
    activeView,
    sidebarOpen,
    tweaksOpen,
    repoStatus,
    onSwitchView,
    onToggleSidebar,
    onToggleTweaks,
    onOpenSettings,
  } = props;

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark">Nw</div>
        <span className="brand-name">Novel Writer</span>
      </div>

      <div className="topbar-view-toggle" aria-label="Primary view switcher">
        <button
          className={`topbar-view-button ${activeView === "ai" ? "is-active" : ""}`}
          onClick={() => onSwitchView("ai")}
          type="button"
        >
          AI
        </button>
        <button
          className={`topbar-view-button ${activeView === "editor" ? "is-active" : ""}`}
          onClick={() => onSwitchView("editor")}
          type="button"
        >
          Editor
        </button>
        <button
          className={`topbar-view-button ${activeView === "opera" ? "is-active" : ""}`}
          onClick={() => onSwitchView("opera")}
          type="button"
        >
          Opera
        </button>
      </div>

      <div className="topbar-actions">
        <StatusChip repoStatus={repoStatus} />
        <button aria-label="Open settings" className="icon-button" onClick={onOpenSettings} type="button">
          <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
            <circle cx="7" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.3" />
            <path
              d="M7 0.5v2M7 11.5v2M0.5 7h2M11.5 7h2M2.1 2.1l1.4 1.4M10.5 10.5l1.4 1.4M11.9 2.1l-1.4 1.4M3.5 10.5l-1.4 1.4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.3"
            />
          </svg>
        </button>
        <button
          aria-label="Toggle sidebar"
          className={`icon-button ${sidebarOpen ? "is-active" : ""}`}
          onClick={onToggleSidebar}
          type="button"
        >
          <svg fill="none" height="12" viewBox="0 0 15 12" width="15">
            <rect height="10.8" rx="1.2" stroke="currentColor" strokeWidth="1.2" width="4.4" x=".6" y=".6" />
            <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" x1="7.5" x2="14" y1="1" y2="1" />
            <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" x1="7.5" x2="12" y1="6" y2="6" />
            <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" x1="7.5" x2="14" y1="11" y2="11" />
          </svg>
        </button>
        <button
          aria-label="Toggle tweaks panel"
          className={`icon-button ${tweaksOpen ? "is-active" : ""}`}
          onClick={onToggleTweaks}
          type="button"
        >
          <svg fill="none" height="14" viewBox="0 0 15 14" width="15">
            <circle cx="5.5" cy="4.5" r="1.6" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="9.5" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.2" />
            <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" x1="1" x2="3.9" y1="4.5" y2="4.5" />
            <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" x1="7.1" x2="14" y1="4.5" y2="4.5" />
            <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" x1="1" x2="7.9" y1="9.5" y2="9.5" />
            <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" x1="11.1" x2="14" y1="9.5" y2="9.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
