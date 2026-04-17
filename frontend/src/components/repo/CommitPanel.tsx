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
          <div className="eyebrow">Commit</div>
          <h3>Dirty files</h3>
        </div>
        <span className="inline-status">branch: {branch}</span>
      </div>

      {!hasGitHubToken ? <div className="panel-banner muted">尚未提供 GitHub PAT，現在是唯讀模式，commit 區已停用。</div> : null}

      <div className="inline-row">
        <button className="ghost-button" onClick={onRefreshHead} type="button">
          Refresh HEAD
        </button>
        <button className="ghost-button" onClick={onIncludeAll} type="button">
          Include all dirty
        </button>
      </div>

      <div className="dirty-list">
        {dirtyDrafts.length === 0 ? (
          <div className="panel-empty">目前沒有未提交的本地草稿。</div>
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
                  <span className="inline-status">{draft.isEditable ? "editable" : "read-only"}</span>
                  <button className="ghost-button" onClick={() => onDiscardDraft(draft.path)} type="button">
                    Discard draft
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
          placeholder="Summarize this editing batch..."
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
        {isSubmitting ? "Committing..." : "Commit selected changes"}
      </button>
    </section>
  );
}

