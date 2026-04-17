import { diffLines } from "diff";

export interface DiffSegment {
  value: string;
  kind: "added" | "removed" | "unchanged";
}

export function buildLineDiff(originalText: string, updatedText: string): DiffSegment[] {
  return diffLines(originalText, updatedText).map((part) => ({
    value: part.value,
    kind: part.added ? "added" : part.removed ? "removed" : "unchanged",
  }));
}

