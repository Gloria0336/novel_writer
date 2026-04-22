import type { OperaIntegrationStatus } from "../../types/app";

interface OperaConsoleProps {
  frontendUrl: string;
  status?: OperaIntegrationStatus;
  statusLoading: boolean;
  onRefreshStatus: () => void;
}

export function OperaConsole(props: OperaConsoleProps) {
  const { frontendUrl, status, statusLoading, onRefreshStatus } = props;

  const backendMessage = statusLoading
    ? "Checking Opera backend status..."
    : status?.ok
      ? `Opera backend is reachable at ${status.baseUrl}.`
      : status?.error
        ? `Opera backend unavailable: ${status.error}`
        : "Opera backend status unavailable.";

  return (
    <section className="opera-workspace">
      <div className="opera-header-card">
        <div className="opera-copy">
          <div className="eyebrow">Integrated Console</div>
          <h2>Opera Workspace</h2>
          <p>
            Opera stays on its own backend and frontend stack. Novel Writer hosts it here as a dedicated surface so the two
            systems can share one shell without sharing runtime state.
          </p>
        </div>

        <div className="opera-actions">
          <button className="ghost-button" onClick={onRefreshStatus} type="button">
            Refresh Status
          </button>
          <a className="solid-button opera-launch-link" href={frontendUrl} rel="noreferrer" target="_blank">
            Open in New Tab
          </a>
        </div>
      </div>

      <div className="opera-status-grid">
        <div className={`settings-state ${status?.ok ? "is-ready" : "is-muted"}`}>{backendMessage}</div>
        <div className="settings-state is-muted">Embedded frontend URL: {frontendUrl}</div>
      </div>

      <div className="opera-frame-shell">
        <iframe className="opera-frame" loading="lazy" src={frontendUrl} title="Opera console" />
      </div>
    </section>
  );
}
