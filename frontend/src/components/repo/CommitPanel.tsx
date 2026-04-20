import { useMemo } from "react";
import type { DraftEntry } from "../../types/app";
import { buildLineDiff } from "../../utils/diff";

interface CommitPanelProps {
  branch: string;
  dirtyDrafts: DraftEntry[];
  includedPaths: string[];
  message: string;
  hasGitHubToken: boolean;
  isSubmitting: boolean;
  onTogglePath: (path: string) => void;
  onIncludeAll: () => void;
  onMessageChange: (message: string) => void;
  onCommit: () => void;
  onRefreshHead: () => void;
  onDiscardDraft: (path: string) => void;
}

export function CommitPanel(props: CommitPanelProps) {
  const {
    branch,
    dirtyDrafts,
    includedPaths,
    message,
    hasGitHubToken,
    isSubmitting,
    onTogglePath,
    onIncludeAll,
    onMessageChange,
    onCommit,
    onRefreshHead,
    onDiscardDraft,
  } = props;

  const includedSet = useMemo(() => new Set(includedPaths), [includedPaths]);

  return (
    <section className="commit-panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Changes</div>
          <h3>Commit Drafts</h3>
        </div>
        <span className="inline-status">Branch: {branch}</span>
      </div>

      {!hasGitHubToken ? <div className="panel-banner muted">The bridge does not have a GitHub token configured.</div> : null}

      <div className="inline-row">
        <button className="ghost-button" onClick={onRefreshHead} type="button">
          Refresh Head
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
          disabled={!hasGitHubToken}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Describe the narrative or canon change..."
          rows={3}
          value={message}
        />
      </label>
      <button
        className="solid-button"
        disabled={!hasGitHubToken || dirtyDrafts.length === 0 || includedPaths.length === 0 || !message.trim() || isSubmitting}
        onClick={onCommit}
        type="button"
      >
        {isSubmitting ? "Committing..." : "Commit Selected Changes"}
      </button>
    </section>
  );
}
