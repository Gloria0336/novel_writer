import type { RepoTreeEntry } from "../types/app";

const NOVEL_DB_PREFIX = "backend/novel_db/";
const NOVEL_ID_PATTERN = /^novel_[A-Za-z0-9_]+$/;

export function detectNovelIdFromPath(path?: string): string | undefined {
  if (!path?.startsWith(NOVEL_DB_PREFIX)) {
    return undefined;
  }

  const segments = path.split("/");
  const novelId = segments[2];
  if (!novelId || novelId === "_template" || !NOVEL_ID_PATTERN.test(novelId)) {
    return undefined;
  }
  return novelId;
}

export function listNovelIds(entries: RepoTreeEntry[]): string[] {
  const novelIds = new Set<string>();

  for (const entry of entries) {
    const novelId = detectNovelIdFromPath(entry.path);
    if (novelId) {
      novelIds.add(novelId);
    }
  }

  return [...novelIds].sort((left, right) => left.localeCompare(right));
}
