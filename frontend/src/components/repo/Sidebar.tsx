import type { DraftEntry, RepoTreeNode } from "../../types/app";
import { CommitPanel } from "./CommitPanel";
import { FileTree } from "./FileTree";

interface SidebarProps {
  nodes: RepoTreeNode[];
  selectedPath?: string;
  dirtyDrafts: DraftEntry[];
  includedPaths: string[];
  commitMessage: string;
  branch: string;
  hasGitHubToken: boolean;
  isSubmittingCommit: boolean;
  onSelectPath: (path: string) => void;
  onToggleCommitPath: (path: string) => void;
  onIncludeAllDirty: () => void;
  onCommitMessageChange: (message: string) => void;
  onCommit: () => void;
  onRefreshHead: () => void;
  onDiscardDraft: (path: string) => void;
}

export function Sidebar(props: SidebarProps) {
  const {
    nodes,
    selectedPath,
    dirtyDrafts,
    includedPaths,
    commitMessage,
    branch,
    hasGitHubToken,
    isSubmittingCommit,
    onSelectPath,
    onToggleCommitPath,
    onIncludeAllDirty,
    onCommitMessageChange,
    onCommit,
    onRefreshHead,
    onDiscardDraft,
  } = props;

  return (
    <div className="sidebar-content">
      <section className="tree-panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Repository</div>
            <h3>File tree</h3>
          </div>
        </div>
        <FileTree
          dirtyPaths={dirtyDrafts.map((draft) => draft.path)}
          nodes={nodes}
          onSelectPath={onSelectPath}
          selectedPath={selectedPath}
        />
      </section>
      <CommitPanel
        branch={branch}
        dirtyDrafts={dirtyDrafts}
        hasGitHubToken={hasGitHubToken}
        includedPaths={includedPaths}
        isSubmitting={isSubmittingCommit}
        message={commitMessage}
        onCommit={onCommit}
        onDiscardDraft={onDiscardDraft}
        onIncludeAll={onIncludeAllDirty}
        onMessageChange={onCommitMessageChange}
        onRefreshHead={onRefreshHead}
        onTogglePath={onToggleCommitPath}
      />
    </div>
  );
}

