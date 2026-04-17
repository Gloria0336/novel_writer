import { describe, expect, it } from "vitest";
import { resolveWorkspaceContext } from "../utils/workspaceContext";

describe("resolveWorkspaceContext", () => {
  it("collects novel canon files for the active chapter", () => {
    const resolution = resolveWorkspaceContext({
      entries: [
        { path: "backend/novel_db/novel_01/.cursorrules", sha: "1", type: "blob" },
        { path: "backend/novel_db/novel_01/bible/characters.yaml", sha: "2", type: "blob" },
        { path: "backend/novel_db/novel_01/context/CONTEXT.md", sha: "3", type: "blob" },
        { path: "backend/novel_db/novel_01/context/last-chapter-summary.md", sha: "4", type: "blob" },
        { path: "backend/novel_db/novel_01/outline/master-outline.yaml", sha: "5", type: "blob" },
        { path: "backend/novel_db/novel_01/outline/act1.md", sha: "6", type: "blob" },
        { path: "backend/novel_db/novel_01/chapters/ch008.md", sha: "7", type: "blob" },
      ],
      attachedPaths: [],
      selectedPath: "backend/novel_db/novel_01/chapters/ch008.md",
      autoAttachActiveFile: true,
      autoAttachRelatedFiles: true,
    });

    expect(resolution.requestedPaths).toEqual(["backend/novel_db/novel_01/chapters/ch008.md"]);
    expect(resolution.autoContextPaths).toEqual([
      "backend/novel_db/novel_01/.cursorrules",
      "backend/novel_db/novel_01/bible/characters.yaml",
      "backend/novel_db/novel_01/context/CONTEXT.md",
      "backend/novel_db/novel_01/context/last-chapter-summary.md",
      "backend/novel_db/novel_01/outline/master-outline.yaml",
      "backend/novel_db/novel_01/outline/act1.md",
    ]);
    expect(resolution.structureSummary).toContain("novel_01/");
    expect(resolution.structureSummary).toContain("bible/");
    expect(resolution.structureSummary).toContain("chapters/");
  });

  it("skips auto context when the feature is disabled", () => {
    const resolution = resolveWorkspaceContext({
      entries: [{ path: "backend/novel_db/novel_01/bible/characters.yaml", sha: "1", type: "blob" }],
      attachedPaths: ["backend/novel_db/novel_01/chapters/ch008.md"],
      selectedPath: "backend/novel_db/novel_01/chapters/ch008.md",
      autoAttachActiveFile: true,
      autoAttachRelatedFiles: false,
    });

    expect(resolution.requestedPaths).toEqual(["backend/novel_db/novel_01/chapters/ch008.md"]);
    expect(resolution.autoContextPaths).toEqual([]);
    expect(resolution.structureSummary).toBeUndefined();
  });
});
