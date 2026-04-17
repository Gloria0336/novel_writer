import { createContext, useContext, useMemo } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import type { CommitDraft } from "../types/app";
import { DEFAULT_COMMIT_DRAFT } from "../utils/constants";
import { usePersistentState } from "../hooks/usePersistentState";

interface CommitStoreValue {
  commitDraft: CommitDraft;
  setCommitDraft: Dispatch<SetStateAction<CommitDraft>>;
  setCommitMessage: (message: string) => void;
  toggleIncludedPath: (path: string) => void;
  includeAllDirty: (paths: string[]) => void;
  syncIncludedPaths: (paths: string[]) => void;
  resetCommitDraft: (branch: string) => void;
}

const CommitStoreContext = createContext<CommitStoreValue | null>(null);

export function CommitStoreProvider({ children }: PropsWithChildren) {
  const [commitDraft, setCommitDraft] = usePersistentState<CommitDraft>("commit", DEFAULT_COMMIT_DRAFT);

  const value = useMemo<CommitStoreValue>(
    () => ({
      commitDraft,
      setCommitDraft,
      setCommitMessage: (message) => {
        setCommitDraft((previous) => ({
          ...previous,
          message,
        }));
      },
      toggleIncludedPath: (path) => {
        setCommitDraft((previous) => {
          const included = new Set(previous.includedPaths);
          if (included.has(path)) {
            included.delete(path);
          } else {
            included.add(path);
          }
          return {
            ...previous,
            includedPaths: [...included],
          };
        });
      },
      includeAllDirty: (paths) => {
        setCommitDraft((previous) => ({
          ...previous,
          includedPaths: [...paths],
        }));
      },
      syncIncludedPaths: (paths) => {
        const pathSet = new Set(paths);
        setCommitDraft((previous) => ({
          ...previous,
          includedPaths: previous.includedPaths.filter((path) => pathSet.has(path)),
        }));
      },
      resetCommitDraft: (branch) => {
        setCommitDraft({
          ...DEFAULT_COMMIT_DRAFT,
          branch,
        });
      },
    }),
    [commitDraft, setCommitDraft],
  );

  return <CommitStoreContext.Provider value={value}>{children}</CommitStoreContext.Provider>;
}

export function useCommitStore() {
  const context = useContext(CommitStoreContext);
  if (!context) {
    throw new Error("useCommitStore must be used within CommitStoreProvider");
  }
  return context;
}
