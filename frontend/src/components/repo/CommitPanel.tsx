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
          <div className="eyebrow">版本控制</div>
          <h3>變更檔案</h3>
        </div>
        <span className="inline-status">分支：{branch}</span>
      </div>

      {!hasGitHubToken ? <div className="panel-banner muted">尚未設定 GitHub PAT，目前無法提交到 GitHub。</div> : null}

      <div className="inline-row">
        <button className="ghost-button" onClick={onRefreshHead} type="button">
          重新整理
        </button>
        <button className="ghost-button" onClick={onIncludeAll} type="button">
          全選變更
        </button>
      </div>

      <div className="dirty-list">
        {dirtyDrafts.length === 0 ? (
          <div className="panel-empty">目前沒有尚未提交的變更。</div>
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
                  <span className="inline-status">{draft.isEditable ? "可編輯" : "唯讀"}</span>
                  <button className="ghost-button" onClick={() => onDiscardDraft(draft.path)} type="button">
                    放棄草稿
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
        提交訊息
        <textarea
          className="text-area"
          disabled={!hasGitHubToken}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="簡述這次修改內容..."
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
        {isSubmitting ? "提交中..." : "提交選取的變更"}
      </button>
    </section>
  );
}
