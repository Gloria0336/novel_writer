import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { BridgeClient, BridgeConflictError } from "../services/bridgeClient";
import { server } from "./server";

describe("BridgeClient", () => {
  it("loads repo tree and file content through the bridge", async () => {
    server.use(
      http.get("http://127.0.0.1:8787/api/repo/tree", () =>
        HttpResponse.json({
          entries: [{ path: "backend/novel_db/novel_00/chapters/ch001.md", sha: "file-sha", type: "blob" }],
          headSha: "head-sha",
          baseTreeSha: "tree-sha",
          truncated: false,
        }),
      ),
      http.get("http://127.0.0.1:8787/api/repo/file", () =>
        HttpResponse.json({
          path: "backend/novel_db/novel_00/chapters/ch001.md",
          sha: "file-sha",
          content: "# Chapter",
          isEditable: true,
        }),
      ),
    );

    const client = new BridgeClient();
    const tree = await client.getRepoTree({
      owner: "Gloria0336",
      repo: "novel_writer",
      branch: "main",
    });

    expect(tree.headSha).toBe("head-sha");
    expect(tree.entries).toHaveLength(1);

    const file = await client.getFileContent(
      {
        owner: "Gloria0336",
        repo: "novel_writer",
        branch: "main",
      },
      "backend/novel_db/novel_00/chapters/ch001.md",
      "file-sha",
    );

    expect(file.content).toContain("Chapter");
    expect(file.isEditable).toBe(true);
  });

  it("loads models and AI chat responses through the bridge", async () => {
    server.use(
      http.post("http://127.0.0.1:8787/api/ai/models", () =>
        HttpResponse.json({
          models: [
            {
              id: "openai/gpt-4o-mini",
              name: "GPT-4o mini",
              contextLength: 128000,
              inputModalities: ["text"],
              outputModalities: ["text"],
              supportedParameters: ["temperature"],
            },
          ],
        }),
      ),
      http.post("http://127.0.0.1:8787/api/ai/chat", () =>
        HttpResponse.json({
          assistantText: "I rewrote the chapter opening.",
          proposedContent: "# Chapter 1\n\nNew draft.",
          targetPath: "backend/novel_db/novel_00/chapters/ch001.md",
        }),
      ),
    );

    const client = new BridgeClient();
    const models = await client.getModels();
    expect(models).toEqual([
      expect.objectContaining({
        id: "openai/gpt-4o-mini",
      }),
    ]);

    const response = await client.sendChat({
      repoRef: {
        owner: "Gloria0336",
        repo: "novel_writer",
        branch: "main",
      },
      workspace: {
        id: "ws-1",
        name: "Workspace 1",
        model: "openai/gpt-4o-mini",
        systemPrompt: "Be precise.",
        temperature: 0.7,
        maxCompletionTokens: 512,
        attachedPaths: [],
        autoAttachActiveFile: true,
        autoAttachRelatedFiles: true,
      },
      history: [],
      prompt: "Rewrite the opening.",
      attachedDrafts: [],
      targetPath: "backend/novel_db/novel_00/chapters/ch001.md",
    });

    expect(response.proposedContent).toContain("New draft");
  });

  it("maps 409 responses to BridgeConflictError", async () => {
    server.use(
      http.post("http://127.0.0.1:8787/api/repo/commit", () =>
        HttpResponse.json({ error: "Head changed." }, { status: 409 }),
      ),
    );

    const client = new BridgeClient();

    await expect(
      client.createCommit({
        repoRef: {
          owner: "Gloria0336",
          repo: "novel_writer",
          branch: "main",
        },
        headSha: "head-1",
        baseTreeSha: "tree-1",
        message: "Test",
        files: [],
      }),
    ).rejects.toBeInstanceOf(BridgeConflictError);
  });

  it("returns commit and push metadata from the bridge", async () => {
    server.use(
      http.post("http://127.0.0.1:8787/api/repo/commit", () =>
        HttpResponse.json({
          commitSha: "abc123",
          pushed: true,
          pushedBranch: "main",
        }),
      ),
    );

    const client = new BridgeClient();
    const result = await client.createCommit({
      repoRef: {
        owner: "Gloria0336",
        repo: "novel_writer",
        branch: "main",
      },
      headSha: "head-1",
      baseTreeSha: "tree-1",
      message: "Push test",
      files: [{ path: "backend/novel_db/novel_00/chapters/ch001.md", content: "Updated" }],
      push: true,
    });

    expect(result).toEqual({
      commitSha: "abc123",
      pushed: true,
      pushedBranch: "main",
    });
  });

  it("loads Opera integration status and exports a novel through the bridge", async () => {
    server.use(
      http.get("http://127.0.0.1:8787/api/integrations/opera/status", () =>
        HttpResponse.json({
          ok: true,
          reachable: true,
          baseUrl: "http://127.0.0.1:8000/api",
          service: "novel-writer-import",
          supportedSecretHandling: ["director_only"],
        }),
      ),
      http.post("http://127.0.0.1:8787/api/integrations/opera/export", async ({ request }) => {
        const body = (await request.json()) as { novelId: string };
        expect(body.novelId).toBe("novel_01");
        return HttpResponse.json({
          campaignId: "campaign-1",
          campaignName: "Novel 01",
          importedCounts: {
            worldEntries: 6,
            actors: 4,
            timelineEvents: 2,
            directorNotes: 2,
          },
          warnings: [],
        });
      }),
    );

    const client = new BridgeClient();
    const status = await client.getOperaStatus();
    expect(status.ok).toBe(true);
    expect(status.baseUrl).toContain("8000");

    const result = await client.exportNovelToOpera({
      novelId: "novel_01",
      options: { secretHandling: "director_only" },
    });
    expect(result.importedCounts.timelineEvents).toBe(2);
    expect(result.campaignName).toBe("Novel 01");
  });
});
