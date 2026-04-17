import { createContext, useContext, useMemo } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import type { DraftEntry, LoadedFile } from "../types/app";
import { usePersistentState } from "../hooks/usePersistentState";

interface DraftStoreValue {
  drafts: Record<string, DraftEntry>;
  setDrafts: Dispatch<SetStateAction<Record<string, DraftEntry>>>;
  upsertLoadedFile: (file: LoadedFile) => void;
  updateDraftContent: (path: string, draftContent: string) => void;
  resetDraftToHead: (path: string, content: string, sha: string) => void;
  discardDraft: (path: string) => void;
  replaceOriginalFromHead: (file: LoadedFile) => void;
}

const DraftStoreContext = createContext<DraftStoreValue | null>(null);

export function DraftStoreProvider({ children }: PropsWithChildren) {
  const [drafts, setDrafts] = usePersistentState<Record<string, DraftEntry>>("drafts", {});

  const value = useMemo<DraftStoreValue>(
    () => ({
      drafts,
      setDrafts,
      upsertLoadedFile: (file) => {
        setDrafts((previous) => {
          const existing = previous[file.path];
          if (existing) {
            return {
              ...previous,
              [file.path]: {
                ...existing,
                isEditable: file.isEditable,
                readOnlyReason: file.readOnlyReason,
              },
            };
          }

          return {
            ...previous,
            [file.path]: {
              path: file.path,
              originalSha: file.sha,
              originalContent: file.content,
              draftContent: file.content,
              isEditable: file.isEditable,
              updatedAt: Date.now(),
              readOnlyReason: file.readOnlyReason,
            },
          };
        });
      },
      updateDraftContent: (path, draftContent) => {
        setDrafts((previous) => {
          const existing = previous[path];
          if (!existing) {
            return previous;
          }

          return {
            ...previous,
            [path]: {
              ...existing,
              draftContent,
              updatedAt: Date.now(),
            },
          };
        });
      },
      resetDraftToHead: (path, content, sha) => {
        setDrafts((previous) => {
          const existing = previous[path];
          if (!existing) {
            return previous;
          }

          return {
            ...previous,
            [path]: {
              ...existing,
              originalContent: content,
              draftContent: content,
              originalSha: sha,
              updatedAt: Date.now(),
            },
          };
        });
      },
      discardDraft: (path) => {
        setDrafts((previous) => {
          const next = { ...previous };
          delete next[path];
          return next;
        });
      },
      replaceOriginalFromHead: (file) => {
        setDrafts((previous) => ({
          ...previous,
          [file.path]: {
            path: file.path,
            originalSha: file.sha,
            originalContent: file.content,
            draftContent: file.content,
            isEditable: file.isEditable,
            updatedAt: Date.now(),
            readOnlyReason: file.readOnlyReason,
          },
        }));
      },
    }),
    [drafts, setDrafts],
  );

  return <DraftStoreContext.Provider value={value}>{children}</DraftStoreContext.Provider>;
}

export function useDraftStore() {
  const context = useContext(DraftStoreContext);
  if (!context) {
    throw new Error("useDraftStore must be used within DraftStoreProvider");
  }
  return context;
}
