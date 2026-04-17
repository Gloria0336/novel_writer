import type { RepoTreeEntry, RepoTreeNode } from "../types/app";
import { normalizeRepoTree } from "./repoTree";

const NOVEL_DB_PREFIX = "backend/novel_db/";

export interface WorkspaceContextResolution {
  requestedPaths: string[];
  autoContextPaths: string[];
  structureSummary?: string;
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}

function inferNovelRoot(path: string): string | null {
  if (!path.startsWith(NOVEL_DB_PREFIX)) {
    return null;
  }

  const segments = path.split("/");
  if (segments.length < 3) {
    return null;
  }

  return segments.slice(0, 3).join("/");
}

function matchesAutoContextPath(path: string, novelRoot: string): boolean {
  return (
    path === `${novelRoot}/.cursorrules` ||
    path.startsWith(`${novelRoot}/bible/`) ||
    path === `${novelRoot}/context/CONTEXT.md` ||
    path === `${novelRoot}/context/last-chapter-summary.md` ||
    path === `${novelRoot}/outline/master-outline.yaml` ||
    (path.startsWith(`${novelRoot}/outline/act`) && path.endsWith(".md"))
  );
}

function getAutoContextPriority(path: string, novelRoot: string): number {
  if (path === `${novelRoot}/.cursorrules`) {
    return 0;
  }
  if (path.startsWith(`${novelRoot}/bible/`)) {
    return 1;
  }
  if (path === `${novelRoot}/context/CONTEXT.md`) {
    return 2;
  }
  if (path === `${novelRoot}/context/last-chapter-summary.md`) {
    return 3;
  }
  if (path === `${novelRoot}/outline/master-outline.yaml`) {
    return 4;
  }
  if (path.startsWith(`${novelRoot}/outline/act`) && path.endsWith(".md")) {
    return 5;
  }
  return 6;
}

function walkNodes(nodes: RepoTreeNode[], lines: string[], depth: number) {
  for (const node of nodes) {
    const indent = "  ".repeat(depth);
    if (node.kind === "directory") {
      lines.push(`${indent}${node.name}/`);
      walkNodes(node.children ?? [], lines, depth + 1);
    } else {
      lines.push(`${indent}${node.name}`);
    }
  }
}

function buildNovelStructureSummary(entries: RepoTreeEntry[], novelRoot: string): string | undefined {
  const relativeEntries = entries
    .filter((entry) => entry.type === "blob" && entry.path.startsWith(`${novelRoot}/`))
    .map((entry) => ({
      ...entry,
      path: entry.path.slice(novelRoot.length + 1),
    }));

  if (relativeEntries.length === 0) {
    return undefined;
  }

  const nodes = normalizeRepoTree(relativeEntries);
  const lines = [`${novelRoot.split("/").at(-1) ?? novelRoot}/`];
  walkNodes(nodes, lines, 1);
  return lines.join("\n");
}

export function resolveWorkspaceContext(params: {
  entries: RepoTreeEntry[];
  attachedPaths: string[];
  selectedPath?: string;
  autoAttachActiveFile: boolean;
  autoAttachRelatedFiles: boolean;
}): WorkspaceContextResolution {
  const { entries, attachedPaths, selectedPath, autoAttachActiveFile, autoAttachRelatedFiles } = params;

  const requestedPaths = uniquePaths(
    autoAttachActiveFile && selectedPath ? [...attachedPaths, selectedPath] : attachedPaths,
  );

  if (!autoAttachRelatedFiles) {
    return {
      requestedPaths,
      autoContextPaths: [],
    };
  }

  const novelRoots = uniquePaths(
    requestedPaths
      .map((path) => inferNovelRoot(path))
      .filter((root): root is string => Boolean(root)),
  );

  const autoContextPaths = uniquePaths(
    entries
      .filter((entry) => entry.type === "blob" && novelRoots.some((root) => matchesAutoContextPath(entry.path, root)))
      .map((entry) => entry.path)
      .sort((left, right) => {
        const leftRoot = novelRoots.find((root) => left.startsWith(`${root}/`)) ?? "";
        const rightRoot = novelRoots.find((root) => right.startsWith(`${root}/`)) ?? "";
        if (leftRoot !== rightRoot) {
          return leftRoot.localeCompare(rightRoot);
        }

        const priority = getAutoContextPriority(left, leftRoot) - getAutoContextPriority(right, rightRoot);
        return priority !== 0 ? priority : left.localeCompare(right);
      }),
  ).filter((path) => !requestedPaths.includes(path));

  const structureSummary = novelRoots
    .map((root) => buildNovelStructureSummary(entries, root))
    .filter((summary): summary is string => Boolean(summary))
    .join("\n\n");

  return {
    requestedPaths,
    autoContextPaths,
    structureSummary: structureSummary || undefined,
  };
}
