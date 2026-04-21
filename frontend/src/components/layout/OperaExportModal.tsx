import { useEffect, useState } from "react";
import type { OperaExportResponse, OperaIntegrationStatus } from "../../types/app";

interface OperaExportModalProps {
  isOpen: boolean;
  novels: string[];
  initialNovelId?: string;
  status?: OperaIntegrationStatus;
  statusLoading: boolean;
  exporting: boolean;
  exportError?: string;
  exportResult?: OperaExportResponse;
  onClose: () => void;
  onRefreshStatus: () => void;
  onExport: (novelId: string) => Promise<void>;
}

export function OperaExportModal(props: OperaExportModalProps) {
  const {
    isOpen,
    novels,
    initialNovelId,
    status,
    statusLoading,
    exporting,
    exportError,
    exportResult,
    onClose,
    onRefreshStatus,
    onExport,
  } = props;
  const [selectedNovelId, setSelectedNovelId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const nextNovelId =
      (initialNovelId && novels.includes(initialNovelId) ? initialNovelId : undefined) ??
      novels[0] ??
      "";
    setSelectedNovelId(nextNovelId);
  }, [initialNovelId, isOpen, novels]);

  if (!isOpen) {
    return null;
  }

  const hasNovels = novels.length > 0;
  const statusText = statusLoading
    ? "Checking Opera status..."
    : status?.ok
      ? `Opera is reachable at ${status.baseUrl}.`
      : status?.error
        ? `Opera unavailable: ${status.error}`
        : "Opera status unavailable.";

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div className="modal-card modal-card-compact" role="dialog" aria-modal="true" aria-label="Export to Opera">
        <div className="modal-header">
          <div>
            <div className="eyebrow">Opera</div>
            <h2>Export to Opera</h2>
          </div>
          <button aria-label="Close Opera export dialog" className="icon-button" onClick={onClose} type="button">
            X
          </button>
        </div>

        <div className={`settings-state ${status?.ok ? "is-ready" : "is-muted"}`}>{statusText}</div>

        <label className="modal-field">
          <span>Novel</span>
          <select
            className="select-input"
            disabled={!hasNovels || exporting}
            onChange={(event) => setSelectedNovelId(event.target.value)}
            value={selectedNovelId}
          >
            {hasNovels ? null : <option value="">No novels found</option>}
            {novels.map((novelId) => (
              <option key={novelId} value={novelId}>
                {novelId}
              </option>
            ))}
          </select>
          <small className="field-hint">This export is read-only for Novel Writer and creates a new Opera campaign every time.</small>
        </label>

        {exportError ? <div className="panel-banner error">{exportError}</div> : null}

        {exportResult ? (
          <section className="modal-summary">
            <div className="panel-banner success">
              Created <strong>{exportResult.campaignName}</strong> in Opera.
            </div>
            <div className="modal-metric-grid">
              <div className="modal-metric">
                <span>World entries</span>
                <strong>{exportResult.importedCounts.worldEntries}</strong>
              </div>
              <div className="modal-metric">
                <span>Actors</span>
                <strong>{exportResult.importedCounts.actors}</strong>
              </div>
              <div className="modal-metric">
                <span>Timeline events</span>
                <strong>{exportResult.importedCounts.timelineEvents}</strong>
              </div>
              <div className="modal-metric">
                <span>Director notes</span>
                <strong>{exportResult.importedCounts.directorNotes}</strong>
              </div>
            </div>
            {exportResult.warnings.length > 0 ? (
              <ul className="modal-list">
                {exportResult.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <div className="modal-footer">
          <button className="ghost-button" onClick={onRefreshStatus} type="button">
            Refresh Status
          </button>
          <button
            className="solid-button"
            disabled={!selectedNovelId || !hasNovels || exporting || statusLoading || status?.ok === false}
            onClick={() => void onExport(selectedNovelId)}
            type="button"
          >
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
