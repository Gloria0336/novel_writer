import { describe, expect, it } from "vitest";
import { getEditableStatus } from "../utils/fileAccess";

describe("getEditableStatus", () => {
  it("allows novel_db text assets", () => {
    expect(getEditableStatus("backend/novel_db/novel_00/chapters/ch001.md")).toEqual({ isEditable: true });
    expect(getEditableStatus("backend/novel_db/novel_00/bible/characters.yaml")).toEqual({ isEditable: true });
  });

  it("blocks non-whitelisted files", () => {
    const result = getEditableStatus("frontend/src/App.tsx");
    expect(result.isEditable).toBe(false);
    expect(result.reason).toContain("backend/novel_db");
  });
});

