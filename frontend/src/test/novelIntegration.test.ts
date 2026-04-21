import { describe, expect, it } from "vitest";
import { detectNovelIdFromPath, listNovelIds } from "../utils/novelIntegration";

describe("novel integration helpers", () => {
  it("lists all available novel ids from repo entries", () => {
    const novelIds = listNovelIds([
      { path: "backend/novel_db/novel_02/chapters/ch001.md", sha: "1", type: "blob" },
      { path: "backend/novel_db/novel_01/context/CONTEXT.md", sha: "2", type: "blob" },
      { path: "backend/novel_db/_template/context/CONTEXT.md", sha: "3", type: "blob" },
      { path: "backend/novel_db/novel_01/outline/master-outline.yaml", sha: "4", type: "blob" },
    ]);

    expect(novelIds).toEqual(["novel_01", "novel_02"]);
  });

  it("detects the active novel id from the selected path", () => {
    expect(detectNovelIdFromPath("backend/novel_db/novel_03/chapters/ch002.md")).toBe("novel_03");
    expect(detectNovelIdFromPath("backend/novel_db/_template/context/CONTEXT.md")).toBeUndefined();
    expect(detectNovelIdFromPath("frontend/src/App.tsx")).toBeUndefined();
  });
});
