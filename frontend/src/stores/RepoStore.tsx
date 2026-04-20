import { createContext, useContext, useMemo } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import type { RepoSnapshot, RepoTreeEntry } from "../types/app";
import { usePersistentState } from "../hooks/usePersistentState";

const DEFAULT_REPO_SNAPSHOT: RepoSnapshot = {
  entries: [],
  headSha: "",
  baseTreeSha: "",
};

interface RepoStoreValue {
  snapshot: RepoSnapshot;
  setSnapshot: Dispatch<SetStateAction<RepoSnapshot>>;
  updateEntries: (entries: RepoTreeEntry[], headSha: string, baseTreeSha: string, truncated?: boolean) => void;
  setSelectedPath: (path?: string) => void;
}

const RepoStoreContext = createContext<RepoStoreValue | null>(null);

export function RepoStoreProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = usePersistentState<RepoSnapshot>("repo", DEFAULT_REPO_SNAPSHOT);

  const value = useMemo<RepoStoreValue>(
    () => ({
      snapshot,
      setSnapshot,
      updateEntries: (entries, headSha, baseTreeSha, truncated) => {
        setSnapshot((previous) => ({
          ...previous,
          entries,
          headSha,
          baseTreeSha,
          truncated,
          lastFetchedAt: Date.now(),
        }));
      },
      setSelectedPath: (path) => {
        setSnapshot((previous) => ({
          ...previous,
          selectedPath: path,
        }));
      },
    }),
    [setSnapshot, snapshot],
  );

  return <RepoStoreContext.Provider value={value}>{children}</RepoStoreContext.Provider>;
}

export function useRepoStore() {
  const context = useContext(RepoStoreContext);
  if (!context) {
    throw new Error("useRepoStore must be used within RepoStoreProvider");
  }
  return context;
}
