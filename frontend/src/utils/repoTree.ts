import type { RepoTreeEntry, RepoTreeNode } from "../types/app";

function createDirectoryNode(path: string, name: string): RepoTreeNode {
  return {
    id: `dir:${path || "/"}`,
    name,
    path,
    kind: "directory",
    children: [],
  };
}

export function normalizeRepoTree(entries: RepoTreeEntry[]): RepoTreeNode[] {
  const root = createDirectoryNode("", "");
  const directoryMap = new Map<string, RepoTreeNode>([["", root]]);

  const sorted = [...entries].sort((left, right) => left.path.localeCompare(right.path));

  for (const entry of sorted) {
    const segments = entry.path.split("/");
    let parentPath = "";
    let parentNode = root;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const currentPath = parentPath ? `${parentPath}/${segment}` : segment;
      const isLeaf = index === segments.length - 1;

      if (isLeaf && entry.type === "blob") {
        parentNode.children ??= [];
        parentNode.children.push({
          id: `file:${currentPath}`,
          name: segment,
          path: currentPath,
          kind: "file",
          entry,
        });
      } else {
        let directory = directoryMap.get(currentPath);
        if (!directory) {
          directory = createDirectoryNode(currentPath, segment);
          directoryMap.set(currentPath, directory);
          parentNode.children ??= [];
          parentNode.children.push(directory);
        }
        parentNode = directory;
        parentPath = currentPath;
      }
    }
  }

  const sortNodes = (nodes: RepoTreeNode[]) => {
    nodes.sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "directory" ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });

    for (const node of nodes) {
      if (node.children) {
        sortNodes(node.children);
      }
    }
  };

  sortNodes(root.children ?? []);
  return root.children ?? [];
}

export function flattenFilePaths(nodes: RepoTreeNode[]): string[] {
  const result: string[] = [];

  const walk = (items: RepoTreeNode[]) => {
    for (const node of items) {
      if (node.kind === "file") {
        result.push(node.path);
      } else if (node.children) {
        walk(node.children);
      }
    }
  };

  walk(nodes);
  return result;
}

