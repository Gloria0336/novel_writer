import type { DraftEntry } from "../types/app";

export interface CommitTreeEntryPayload {
  path: string;
  mode: "100644";
  type: "blob";
  content: string;
}

export function buildCommitTreeEntries(drafts: DraftEntry[], includedPaths: string[]): CommitTreeEntryPayload[] {
  const includedSet = new Set(includedPaths);
  return drafts
    .filter((draft) => includedSet.has(draft.path))
    .map((draft) => ({
      path: draft.path,
      mode: "100644",
      type: "blob",
      content: draft.draftContent,
    }));
}

export function hasHeadConflict(previousHeadSha: string, currentHeadSha: string): boolean {
  return previousHeadSha !== currentHeadSha;
}

