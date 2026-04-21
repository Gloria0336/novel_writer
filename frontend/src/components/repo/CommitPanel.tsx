import { useMemo } from "react";
import type { DraftEntry } from "../../types/app";
import { buildLineDiff } from "../../utils/diff";

interface CommitPanelProps {
  branch: string;
  dirtyDrafts: DraftEntry[];
  includedPaths: string[];
  message: string;
  isSubmitting: boolean;
  submitLabel?: string;
  statusMessage?: string;
  statusTone?: "muted" | "error" | "success";
  pushAvailable?: boolean;
  onTogglePath: (path: string) => void;
  onIncludeAll: () => void;
  onMessageChange: (message: string) => void;
  onCommit: () => void;
  onCommitAndPush: () => void;
  onRefreshHead: () => void;
  onDiscardDraft: (path: string) => void;
}

export function CommitPanel(props: CommitPanelProps) {
  const {
    branch,
    dirtyDrafts,
    includedPaths,
    message,
    isSubmitting,
    submitLabel,
    statusMessage,
    statusTone = "muted",
    pushAvailable = true,
    onTogglePath,
    onIncludeAll,
    onMessageChange,
    onCommit,
    onCommitAndPush,
    onRefreshHead,
    onDiscardDraft,
  } = props;

  const includedSet = useMemo(() => new Set(includedPaths), [includedPaths]);
  const canSubmit = dirtyDrafts.length > 0 && includedPaths.length > 0 && message.trim().length > 0 && !isSubmitting;

  return (
    <section className="commit-panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Version Control</div>
          <h3>Commit And Push</h3>
        </div>
        <span className="inline-status">Branch: {branch}</span>
      </div>

      <div className="panel-banner">
        Only files inside <code>backend/novel_db</code> can be committed from this UI.
      </div>
      {statusMessage ? <div className={`panel-banner ${statusTone === "error" ? "error" : statusTone === "success" ? "success" : ""}`}>{statusMessage}</div> : null}

      <div className="inline-row commit-actions-row">
        <button className="ghost-button" onClick={onRefreshHead} type="button">
          Refresh Repo
        </button>
        <button className="ghost-button" onClick={onIncludeAll} type="button">
          Include All Dirty
        </button>
      </div>

      <div className="dirty-list">
        {dirtyDrafts.length === 0 ? (
          <div className="panel-empty">No draft changes yet.</div>
        ) : (
          dirtyDrafts.map((draft) => {
            const diff = buildLineDiff(draft.originalContent, draft.draftContent);
            return (
              <details className="dirty-item" key={draft.path}>
                <summary>
                  <label className="checkbox-row">
                    <input checked={includedSet.has(draft.path)} onChange={() => onTogglePath(draft.path)} type="checkbox" />
                    <span>{draft.path}</span>
                  </label>
                </summary>
                <div className="inline-row">
                  <span className="inline-status">{draft.isEditable ? "Editable" : "Read only"}</span>
                  <button className="ghost-button" onClick={() => onDiscardDraft(draft.path)} type="button">
                    Discard Draft
                  </button>
                </div>
                <pre className="diff-preview">
                  {diff.map((segment, index) => (
                    <span className={`diff-${segment.kind}`} key={`${draft.path}-${index}`}>
                      {segment.value}
                    </span>
                  ))}
                </pre>
              </details>
            );
          })
        )}
      </div>

      <label>
        Commit message
        <textarea
          className="text-area"
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Describe the narrative or canon change..."
          rows={3}
          value={message}
        />
      </label>

      <div className="commit-submit-row">
        <button className="ghost-button" disabled={!canSubmit} onClick={onCommit} type="button">
          {isSubmitting && submitLabel === "Committing..." ? submitLabel : "Commit Only"}
        </button>
        <button className="solid-button" disabled={!canSubmit || !pushAvailable} onClick={onCommitAndPush} type="button">
          {isSubmitting && submitLabel ? submitLabel : "Commit And Push"}
        </button>
      </div>
    </section>
  );
}
