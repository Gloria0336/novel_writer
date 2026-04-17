import { describe, expect, it } from "vitest";
import { buildCommitTreeEntries, hasHeadConflict } from "../utils/githubCommit";

describe("github commit helpers", () => {
  it("builds tree entries only for selected paths", () => {
    const entries = buildCommitTreeEntries(
      [
        {
          path: "a.md",
          originalSha: "1",
          originalContent: "before",
          draftContent: "after",
          isEditable: true,
          updatedAt: 1,
        },
        {
          path: "b.md",
          originalSha: "2",
          originalContent: "before",
          draftContent: "after",
          isEditable: true,
          updatedAt: 1,
        },
      ],
      ["b.md"],
    );

    expect(entries).toEqual([
      {
        path: "b.md",
        mode: "100644",
        type: "blob",
        content: "after",
      },
    ]);
  });

  it("detects head conflicts", () => {
    expect(hasHeadConflict("old", "new")).toBe(true);
    expect(hasHeadConflict("same", "same")).toBe(false);
  });
});

