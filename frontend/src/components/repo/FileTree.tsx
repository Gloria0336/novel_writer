import { useMemo } from "react";
import type { RepoTreeNode } from "../../types/app";

interface FileTreeProps {
  nodes: RepoTreeNode[];
  selectedPath?: string;
  dirtyPaths: string[];
  attachedPaths: string[];
  attachmentLimit: number;
  expandedPaths: Set<string>;
  onSelectPath: (path: string) => void;
  onToggleDirectory: (path: string) => void;
  onToggleAttachment: (path: string) => void;
}

export function FileTree(props: FileTreeProps) {
  const {
    nodes,
    selectedPath,
    dirtyPaths,
    attachedPaths,
    attachmentLimit,
    expandedPaths,
    onSelectPath,
    onToggleDirectory,
    onToggleAttachment,
  } = props;
  const dirtySet = useMemo(() => new Set(dirtyPaths), [dirtyPaths]);
  const attachedSet = useMemo(() => new Set(attachedPaths), [attachedPaths]);
  const canAttachMore = attachedPaths.length < attachmentLimit;

  const renderNode = (node: RepoTreeNode) => {
    if (node.kind === "file") {
      const isSelected = node.path === selectedPath;
      const isAttached = attachedSet.has(node.path);

      return (
        <div className={`tree-file-row ${isSelected ? "is-selected" : ""} ${isAttached ? "is-attached" : ""}`} key={node.id}>
          <button className={`tree-file ${isSelected ? "is-selected" : ""}`} onClick={() => onSelectPath(node.path)} type="button">
            <span className="tree-file-label">
              <span>{node.name}</span>
              {dirtySet.has(node.path) ? <span className="tree-dirty-dot" aria-label="draft dirty" /> : null}
            </span>
          </button>
          <button
            aria-label={isAttached ? `Remove ${node.name} from references` : `Use ${node.name} as a reference file`}
            className={`tree-attach-button ${isAttached ? "is-active" : ""}`}
            disabled={!isAttached && !canAttachMore}
            onClick={() => onToggleAttachment(node.path)}
            type="button"
          >
            Ref
          </button>
        </div>
      );
    }

    const isExpanded = expandedPaths.has(node.path);

    return (
      <div className="tree-directory" key={node.id}>
        <button className="tree-folder" onClick={() => onToggleDirectory(node.path)} type="button">
          <span className="tree-folder-label">
            <span className="tree-arrow">{isExpanded ? "v" : ">"}</span>
            <span>{node.name}</span>
          </span>
        </button>
        {isExpanded ? <div className="tree-children">{(node.children ?? []).map(renderNode)}</div> : null}
      </div>
    );
  };

  if (nodes.length === 0) {
    return <div className="panel-empty">No files found inside the novel database.</div>;
  }

  return <div className="file-tree">{nodes.map(renderNode)}</div>;
}
