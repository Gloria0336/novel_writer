import { describe, expect, it } from "vitest";
import { flattenFilePaths, normalizeRepoTree } from "../utils/repoTree";

describe("normalizeRepoTree", () => {
  it("creates nested directory nodes and sorts files after folders", () => {
    const tree = normalizeRepoTree([
      { path: "backend/novel_db/novel_00/chapters/ch001.md", sha: "1", type: "blob" },
      { path: "backend/novel_db/novel_00/bible/characters.yaml", sha: "2", type: "blob" },
      { path: "frontend/index.html", sha: "3", type: "blob" },
    ]);

    expect(tree[0].name).toBe("backend");
    expect(tree[0].kind).toBe("directory");
    expect(flattenFilePaths(tree)).toEqual([
      "backend/novel_db/novel_00/bible/characters.yaml",
      "backend/novel_db/novel_00/chapters/ch001.md",
      "frontend/index.html",
    ]);
  });
});

