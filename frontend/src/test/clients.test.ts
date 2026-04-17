import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { GitHubClient } from "../services/githubClient";
import { OpenRouterClient } from "../services/openRouterClient";
import { server } from "./server";

describe("API clients", () => {
  it("loads repo tree and file content through GitHub client", async () => {
    server.use(
      http.get("https://api.github.com/repos/Gloria0336/novel_writer/git/ref/heads/main", () =>
        HttpResponse.json({ object: { sha: "head-sha" } }),
      ),
      http.get("https://api.github.com/repos/Gloria0336/novel_writer/git/commits/head-sha", () =>
        HttpResponse.json({ tree: { sha: "tree-sha" } }),
      ),
      http.get("https://api.github.com/repos/Gloria0336/novel_writer/git/trees/tree-sha", () =>
        HttpResponse.json({
          sha: "tree-sha",
          truncated: false,
          tree: [{ path: "backend/novel_db/novel_00/chapters/ch001.md", sha: "file-sha", type: "blob" }],
        }),
      ),
      http.get("https://api.github.com/repos/Gloria0336/novel_writer/contents/backend/novel_db/novel_00/chapters/ch001.md", () =>
        new HttpResponse(new TextEncoder().encode("# Chapter"), {
          headers: {
            "Content-Type": "application/octet-stream",
          },
        }),
      ),
    );

    const client = new GitHubClient({
      owner: "Gloria0336",
      repo: "novel_writer",
      branch: "main",
    });

    const tree = await client.getRepoTree();
    expect(tree.headSha).toBe("head-sha");
    expect(tree.entries).toHaveLength(1);

    const file = await client.getFileContent("backend/novel_db/novel_00/chapters/ch001.md", "file-sha");
    expect(file.content).toContain("Chapter");
    expect(file.isEditable).toBe(true);
  });

  it("loads OpenRouter text models", async () => {
    server.use(
      http.get("https://openrouter.ai/api/v1/models", () =>
        HttpResponse.json({
          data: [
            {
              id: "openai/gpt-4o-mini",
              name: "GPT-4o mini",
              context_length: 128000,
              architecture: {
                input_modalities: ["text"],
                output_modalities: ["text"],
              },
              supported_parameters: ["temperature"],
            },
            {
              id: "image/model",
              name: "Image model",
              context_length: 0,
              architecture: {
                input_modalities: ["text"],
                output_modalities: ["image"],
              },
              supported_parameters: [],
            },
            {
              id: "mystery/model",
              name: "Mystery model",
              context_length: 64000,
            },
          ],
        }),
      ),
    );

    const client = new OpenRouterClient("test-key");
    const models = await client.getModels();

    expect(models).toEqual([
      expect.objectContaining({
        id: "openai/gpt-4o-mini",
      }),
      expect.objectContaining({
        id: "mystery/model",
      }),
    ]);
  });
});
