import { createContext, useContext, useMemo } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import type { WorkspaceConfig, WorkspaceMessage, WorkspaceState } from "../types/app";
import { DEFAULT_WORKSPACE_TEMPLATE, createWorkspaceConfig } from "../utils/constants";
import { usePersistentState } from "../hooks/usePersistentState";

const initialWorkspace = createWorkspaceConfig(DEFAULT_WORKSPACE_TEMPLATE, "對話 1");

const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  workspaces: [initialWorkspace],
  activeWorkspaceId: initialWorkspace.id,
  messages: {
    [initialWorkspace.id]: [],
  },
};

interface WorkspaceStoreValue {
  state: WorkspaceState;
  setState: Dispatch<SetStateAction<WorkspaceState>>;
  addWorkspace: (config: WorkspaceConfig) => void;
  updateWorkspace: (workspaceId: string, patch: Partial<WorkspaceConfig>) => void;
  removeWorkspace: (workspaceId: string) => void;
  setActiveWorkspaceId: (workspaceId: string) => void;
  addMessage: (workspaceId: string, message: WorkspaceMessage) => void;
  replaceMessages: (workspaceId: string, messages: WorkspaceMessage[]) => void;
  clearMessages: (workspaceId: string) => void;
}

const WorkspaceStoreContext = createContext<WorkspaceStoreValue | null>(null);

function normalizeWorkspaceState(state: WorkspaceState): WorkspaceState {
  if (state.workspaces.length === 0) {
    return DEFAULT_WORKSPACE_STATE;
  }

  const workspaces = state.workspaces.map((workspace) => ({
    ...workspace,
    autoAttachRelatedFiles:
      workspace.autoAttachRelatedFiles ?? DEFAULT_WORKSPACE_TEMPLATE.autoAttachRelatedFiles,
  }));
  const validIds = new Set(workspaces.map((workspace) => workspace.id));
  const activeWorkspaceId = validIds.has(state.activeWorkspaceId) ? state.activeWorkspaceId : workspaces[0].id;
  const messages = Object.fromEntries(workspaces.map((workspace) => [workspace.id, state.messages[workspace.id] ?? []]));

  return {
    workspaces,
    activeWorkspaceId,
    messages,
  };
}

export function WorkspaceStoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = usePersistentState<WorkspaceState>("workspaces", DEFAULT_WORKSPACE_STATE);
  const normalizedState = useMemo(() => normalizeWorkspaceState(state), [state]);

  const value = useMemo<WorkspaceStoreValue>(
    () => ({
      state: normalizedState,
      setState,
      addWorkspace: (config) => {
        setState((previous) =>
          normalizeWorkspaceState({
            ...previous,
            workspaces: [...previous.workspaces, config],
            activeWorkspaceId: config.id,
            messages: {
              ...previous.messages,
              [config.id]: [],
            },
          }),
        );
      },
      updateWorkspace: (workspaceId, patch) => {
        setState((previous) =>
          normalizeWorkspaceState({
            ...previous,
            workspaces: previous.workspaces.map((workspace) =>
              workspace.id === workspaceId ? { ...workspace, ...patch } : workspace,
            ),
          }),
        );
      },
      removeWorkspace: (workspaceId) => {
        setState((previous) => {
          const workspaces = previous.workspaces.filter((workspace) => workspace.id !== workspaceId);
          if (workspaces.length === 0) {
            return DEFAULT_WORKSPACE_STATE;
          }
          const messages = { ...previous.messages };
          delete messages[workspaceId];
          return normalizeWorkspaceState({
            workspaces,
            activeWorkspaceId: previous.activeWorkspaceId === workspaceId ? workspaces[0].id : previous.activeWorkspaceId,
            messages,
          });
        });
      },
      setActiveWorkspaceId: (workspaceId) => {
        setState((previous) =>
          normalizeWorkspaceState({
            ...previous,
            activeWorkspaceId: workspaceId,
          }),
        );
      },
      addMessage: (workspaceId, message) => {
        setState((previous) =>
          normalizeWorkspaceState({
            ...previous,
            messages: {
              ...previous.messages,
              [workspaceId]: [...(previous.messages[workspaceId] ?? []), message],
            },
          }),
        );
      },
      replaceMessages: (workspaceId, messages) => {
        setState((previous) =>
          normalizeWorkspaceState({
            ...previous,
            messages: {
              ...previous.messages,
              [workspaceId]: messages,
            },
          }),
        );
      },
      clearMessages: (workspaceId) => {
        setState((previous) =>
          normalizeWorkspaceState({
            ...previous,
            messages: {
              ...previous.messages,
              [workspaceId]: [],
            },
          }),
        );
      },
    }),
    [normalizedState, setState],
  );

  return <WorkspaceStoreContext.Provider value={value}>{children}</WorkspaceStoreContext.Provider>;
}

export function useWorkspaceStore() {
  const context = useContext(WorkspaceStoreContext);
  if (!context) {
    throw new Error("useWorkspaceStore must be used within WorkspaceStoreProvider");
  }
  return context;
}
