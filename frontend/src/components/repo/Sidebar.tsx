import { useEffect, useMemo, useRef, useState } from "react";
import type { RepoTreeNode } from "../../types/app";
import { FileTree } from "./FileTree";

interface SidebarProps {
  nodes: RepoTreeNode[];
  selectedPath?: string;
  dirtyPaths: string[];
  attachedPaths: string[];
  attachmentLimit: number;
  attachmentError?: string;
  sidebarOpen: boolean;
  onSelectPath: (path: string) => void;
  onToggleAttachment: (path: string) => void;
}

function collectDirectoryPaths(nodes: RepoTreeNode[]): string[] {
  const paths: string[] = [];

  const walk = (items: RepoTreeNode[]) => {
    for (const node of items) {
      if (node.kind !== "directory") {
        continue;
      }

      paths.push(node.path);
      walk(node.children ?? []);
    }
  };

  walk(nodes);
  return paths;
}

function collectTopLevelDirectoryPaths(nodes: RepoTreeNode[]): string[] {
  return nodes.filter((node) => node.kind === "directory").map((node) => node.path);
}

export function Sidebar(props: SidebarProps) {
  const { nodes, selectedPath, dirtyPaths, attachedPaths, attachmentLimit, attachmentError, sidebarOpen, onSelectPath, onToggleAttachment } = props;
  const directoryPaths = useMemo(() => collectDirectoryPaths(nodes), [nodes]);
  const topLevelDirectoryPaths = useMemo(() => collectTopLevelDirectoryPaths(nodes), [nodes]);
  const hasInitializedExpansion = useRef(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpandedPaths((previous) => {
      const validPaths = new Set(directoryPaths);

      if (!hasInitializedExpansion.current) {
        hasInitializedExpansion.current = true;
        return new Set(topLevelDirectoryPaths);
      }

      return new Set([...previous].filter((path) => validPaths.has(path)));
    });
  }, [directoryPaths, topLevelDirectoryPaths]);

  const toggleDirectory = (path: string) => {
    setExpandedPaths((previous) => {
      const next = new Set(previous);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <aside className={`file-sidebar ${sidebarOpen ? "" : "is-collapsed"}`}>
      <div className="file-sidebar-header">
        <div>
          <div className="eyebrow">Novel DB</div>
          <h3>Reference Files</h3>
          <div className="inline-status">Browsing only the contents of <code>backend/novel_db</code>.</div>
        </div>
        <div className="sidebar-header-actions">
          <span className="inline-status">
            Ref {attachedPaths.length}/{attachmentLimit}
          </span>
          <button className="ghost-button" onClick={() => setExpandedPaths(new Set())} type="button">
            Collapse All
          </button>
          <button className="ghost-button" onClick={() => setExpandedPaths(new Set(directoryPaths))} type="button">
            Expand All
          </button>
        </div>
      </div>
      {attachmentError ? <div className="panel-banner error">{attachmentError}</div> : null}
      <div className="file-sidebar-scroll">
        <FileTree
          attachedPaths={attachedPaths}
          attachmentLimit={attachmentLimit}
          dirtyPaths={dirtyPaths}
          expandedPaths={expandedPaths}
          nodes={nodes}
          onSelectPath={onSelectPath}
          onToggleAttachment={onToggleAttachment}
          onToggleDirectory={toggleDirectory}
          selectedPath={selectedPath}
        />
      </div>
    </aside>
  );
}
