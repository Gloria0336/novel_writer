import type { WorkspaceConfig } from "../../types/app";

interface WorkspaceRailProps {
  workspaces: WorkspaceConfig[];
  activeWorkspaceId: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onAddWorkspace: () => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function WorkspaceRail(props: WorkspaceRailProps) {
  const { workspaces, activeWorkspaceId, onSelectWorkspace, onAddWorkspace } = props;

  return (
    <div className="workspace-rail">
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          className={`workspace-rail-button ${workspace.id === activeWorkspaceId ? "is-active" : ""}`}
          onClick={() => onSelectWorkspace(workspace.id)}
          title={workspace.name}
          type="button"
        >
          {getInitials(workspace.name || "WS")}
        </button>
      ))}
      <button className="workspace-rail-add" onClick={onAddWorkspace} title="新增工作區" type="button">
        +
      </button>
    </div>
  );
}
