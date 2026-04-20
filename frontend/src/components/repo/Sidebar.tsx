import type { RepoTreeNode } from "../../types/app";
import { FileTree } from "./FileTree";

interface SidebarProps {
  nodes: RepoTreeNode[];
  selectedPath?: string;
  dirtyPaths: string[];
  sidebarOpen: boolean;
  onSelectPath: (path: string) => void;
}

export function Sidebar(props: SidebarProps) {
  const { nodes, selectedPath, dirtyPaths, sidebarOpen, onSelectPath } = props;

  return (
    <aside className={`file-sidebar ${sidebarOpen ? "" : "is-collapsed"}`}>
      <div className="file-sidebar-header">
        <div>
          <div className="eyebrow">檔案</div>
          <h3>小說資料庫</h3>
        </div>
      </div>
      <div className="file-sidebar-scroll">
        <FileTree dirtyPaths={dirtyPaths} nodes={nodes} onSelectPath={onSelectPath} selectedPath={selectedPath} />
      </div>
    </aside>
  );
}
