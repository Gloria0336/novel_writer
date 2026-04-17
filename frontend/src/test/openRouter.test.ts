import { describe, expect, it } from "vitest";
import { buildWorkspaceRequest } from "../utils/openRouter";

describe("buildWorkspaceRequest", () => {
  it("injects system prompt, file context, history, and latest prompt", () => {
    const request = buildWorkspaceRequest({
      workspace: {
        id: "ws-1",
        name: "Draft Lab",
        model: "openai/gpt-4o-mini",
        systemPrompt: "Be concise.",
        temperature: 0.4,
        maxCompletionTokens: 512,
        attachedPaths: ["backend/novel_db/novel_00/chapters/ch001.md"],
        autoAttachActiveFile: false,
      },
      history: [
        {
          id: "m1",
          role: "assistant",
          content: "Previous answer",
          createdAt: 1,
          sourceFilePaths: [],
        },
      ],
      prompt: "Rewrite the opening paragraph.",
      attachedDrafts: [
        {
          path: "backend/novel_db/novel_00/chapters/ch001.md",
          originalSha: "sha",
          originalContent: "Old text",
          draftContent: "Current draft",
          isEditable: true,
          updatedAt: 1,
        },
      ],
    });

    expect(request.model).toBe("openai/gpt-4o-mini");
    expect(request.messages[0]).toEqual({
      role: "system",
      content: "Be concise.",
    });
    expect(request.messages[1].content).toContain("Current draft");
    expect(request.messages.at(-1)).toEqual({
      role: "user",
      content: "Rewrite the opening paragraph.",
    });
  });
});

