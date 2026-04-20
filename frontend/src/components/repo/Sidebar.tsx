import type { DraftEntry, RepoTreeNode } from "../../types/app";
import { FileTree } from "./FileTree";

interface SidebarProps {
  nodes: RepoTreeNode[];
  selectedPath?: string;
  dirtyDrafts: DraftEntry[];
  branch: string;
  onSelectPath: (path: string) => void;
}

export function Sidebar(props: SidebarProps) {
  const { nodes, selectedPath, dirtyDrafts, branch, onSelectPath } = props;

  return (
    <div className="sidebar-content">
      <section className="tree-panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Repository</div>
            <h3>Novel Files</h3>
          </div>
          <span className="inline-status">{branch}</span>
        </div>
        <FileTree
          dirtyPaths={dirtyDrafts.map((draft) => draft.path)}
          nodes={nodes}
          onSelectPath={onSelectPath}
          selectedPath={selectedPath}
        />
      </section>
    </div>
  );
}
