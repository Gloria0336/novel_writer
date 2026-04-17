import { useEffect, useMemo, useState } from "react";
import type { RepoTreeNode } from "../../types/app";

interface FileTreeProps {
  nodes: RepoTreeNode[];
  selectedPath?: string;
  dirtyPaths: string[];
  onSelectPath: (path: string) => void;
}

function collectDirectoryPaths(nodes: RepoTreeNode[]): string[] {
  const directories: string[] = [];

  const walk = (items: RepoTreeNode[]) => {
    for (const node of items) {
      if (node.kind === "directory") {
        directories.push(node.path);
        walk(node.children ?? []);
      }
    }
  };

  walk(nodes);
  return directories;
}

export function FileTree(props: FileTreeProps) {
  const { nodes, selectedPath, dirtyPaths, onSelectPath } = props;
  const dirtySet = useMemo(() => new Set(dirtyPaths), [dirtyPaths]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(collectDirectoryPaths(nodes)));

  useEffect(() => {
    setExpandedPaths(new Set(collectDirectoryPaths(nodes)));
  }, [nodes]);

  const toggle = (path: string) => {
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

  const renderNode = (node: RepoTreeNode) => {
    if (node.kind === "file") {
      const isSelected = node.path === selectedPath;
      return (
        <button
          key={node.id}
          className={`tree-file ${isSelected ? "is-selected" : ""}`}
          onClick={() => onSelectPath(node.path)}
          type="button"
        >
          <span>{node.name}</span>
          {dirtySet.has(node.path) ? <span className="tree-dirty-dot" /> : null}
        </button>
      );
    }

    const isExpanded = expandedPaths.has(node.path);
    return (
      <div key={node.id} className="tree-directory">
        <button className="tree-folder" onClick={() => toggle(node.path)} type="button">
          <span className="tree-arrow">{isExpanded ? "▾" : "▸"}</span>
          <span>{node.name}</span>
        </button>
        {isExpanded ? <div className="tree-children">{(node.children ?? []).map(renderNode)}</div> : null}
      </div>
    );
  };

  if (nodes.length === 0) {
    return <div className="panel-empty">目前沒有可顯示的檔案。</div>;
  }

  return <div className="file-tree">{nodes.map(renderNode)}</div>;
}
