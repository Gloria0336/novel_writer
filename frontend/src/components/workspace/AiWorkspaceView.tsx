import type { DraftEntry, RepoTreeNode, WorkspaceConfig, WorkspaceMessage } from "../../types/app";
import { FileTree } from "../repo/FileTree";
import { WorkspaceDock } from "./WorkspaceDock";

interface AiWorkspaceViewProps {
  nodes: RepoTreeNode[];
  selectedPath?: string;
  dirtyDrafts: DraftEntry[];
  workspaces: WorkspaceConfig[];
  activeWorkspaceId: string;
  messages: Record<string, WorkspaceMessage[]>;
  availablePaths: string[];
  models: import("../../types/app").ModelInfo[];
  modelLoading: boolean;
  modelError?: string;
  favoriteModels: string[];
  recentModels: string[];
  relatedContextCount: number;
  sendingWorkspaceId?: string;
  onSelectPath: (path: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onAddWorkspace: () => void;
  onRemoveWorkspace: (workspaceId: string) => void;
  onUpdateWorkspace: (workspaceId: string, patch: Partial<WorkspaceConfig>) => void;
  onSendPrompt: (workspaceId: string, prompt: string) => Promise<void>;
  onAttachPath: (workspaceId: string, path: string) => void;
  onDetachPath: (workspaceId: string, path: string) => void;
  onClearMessages: (workspaceId: string) => void;
  onToggleFavoriteModel: (modelId: string) => void;
  onApplyProposedDraft: (workspaceId: string, messageId: string) => Promise<void>;
}

export function AiWorkspaceView(props: AiWorkspaceViewProps) {
  const {
    nodes,
    selectedPath,
    dirtyDrafts,
    workspaces,
    activeWorkspaceId,
    messages,
    availablePaths,
    models,
    modelLoading,
    modelError,
    favoriteModels,
    recentModels,
    relatedContextCount,
    sendingWorkspaceId,
    onSelectPath,
    onSelectWorkspace,
    onAddWorkspace,
    onRemoveWorkspace,
    onUpdateWorkspace,
    onSendPrompt,
    onAttachPath,
    onDetachPath,
    onClearMessages,
    onToggleFavoriteModel,
    onApplyProposedDraft,
  } = props;

  return (
    <div className="view-grid ai-view">
      <aside className="view-sidebar">
        <section className="tree-panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Target Selection</div>
              <h3>Pick The File To Rewrite</h3>
            </div>
            <span className="inline-status">{selectedPath ? "Target ready" : "No file selected"}</span>
          </div>
          <FileTree
            dirtyPaths={dirtyDrafts.map((draft) => draft.path)}
            nodes={nodes}
            onSelectPath={onSelectPath}
            selectedPath={selectedPath}
          />
        </section>
      </aside>

      <section className="view-main">
        <WorkspaceDock
          activeWorkspaceId={activeWorkspaceId}
          availablePaths={availablePaths}
          favoriteModels={favoriteModels}
          messages={messages}
          modelError={modelError}
          modelLoading={modelLoading}
          models={models}
          onAddWorkspace={onAddWorkspace}
          onApplyProposedDraft={onApplyProposedDraft}
          onAttachPath={onAttachPath}
          onClearMessages={onClearMessages}
          onDetachPath={onDetachPath}
          onRemoveWorkspace={onRemoveWorkspace}
          onSelectWorkspace={onSelectWorkspace}
          onSendPrompt={onSendPrompt}
          onToggleFavoriteModel={onToggleFavoriteModel}
          onUpdateWorkspace={onUpdateWorkspace}
          recentModels={recentModels}
          relatedContextCount={relatedContextCount}
          selectedPath={selectedPath}
          sendingWorkspaceId={sendingWorkspaceId}
          workspaces={workspaces}
        />
      </section>
    </div>
  );
}
