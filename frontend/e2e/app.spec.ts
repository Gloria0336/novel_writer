import { expect, test } from "@playwright/test";

async function mockBridge(page: import("@playwright/test").Page) {
  let headSha = "head-1";
  let treeSha = "tree-1";
  let fileContent = "# Chapter 1\n\nOriginal line.";

  await page.route("http://127.0.0.1:8787/api/status", async (route) => {
    await route.fulfill({
      json: {
        ok: true,
        repoAdapter: "github-rest",
        hasGitHubToken: true,
        hasOpenRouterApiKey: true,
      },
    });
  });

  await page.route("http://127.0.0.1:8787/api/repo/tree**", async (route) => {
    await route.fulfill({
      json: {
        entries: [
          {
            path: "backend/novel_db/novel_00/chapters/ch001.md",
            sha: "file-1",
            type: "blob",
          },
        ],
        headSha,
        baseTreeSha: treeSha,
        truncated: false,
      },
    });
  });

  await page.route("http://127.0.0.1:8787/api/repo/file**", async (route) => {
    await route.fulfill({
      json: {
        path: "backend/novel_db/novel_00/chapters/ch001.md",
        sha: "file-1",
        content: fileContent,
        isEditable: true,
      },
    });
  });

  await page.route("http://127.0.0.1:8787/api/ai/models", async (route) => {
    await route.fulfill({
      json: {
        models: [
          {
            id: "openai/gpt-4o-mini",
            name: "GPT-4o mini",
            contextLength: 128000,
            inputModalities: ["text"],
            outputModalities: ["text"],
            supportedParameters: ["temperature"],
          },
          {
            id: "anthropic/claude-3.5-haiku",
            name: "Claude Haiku",
            contextLength: 200000,
            inputModalities: ["text"],
            outputModalities: ["text"],
            supportedParameters: ["temperature"],
          },
        ],
      },
    });
  });

  await page.route("http://127.0.0.1:8787/api/ai/chat", async (route) => {
    await route.fulfill({
      json: {
        assistantText: "I tightened the opening and kept the canon references intact.",
        proposedContent: "# Chapter 1\n\nRewritten line.",
        targetPath: "backend/novel_db/novel_00/chapters/ch001.md",
      },
    });
  });

  await page.route("http://127.0.0.1:8787/api/repo/commit", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    fileContent = body.files[0]?.content ?? fileContent;
    treeSha = "tree-2";
    headSha = "head-2";
    await route.fulfill({
      json: {
        commitSha: "commit-2",
      },
    });
  });
}

test("loads repo tree and opens the initial file", async ({ page }) => {
  await mockBridge(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Files" }).click();

  await expect(page.getByRole("button", { name: "ch001.md" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "backend/novel_db/novel_00/chapters/ch001.md" })).toBeVisible();
});

test("uses AI chat to create a draft, then commits it from the files view", async ({ page }) => {
  await mockBridge(page);

  await page.goto("/");

  await expect(page.getByText("Target file: backend/novel_db/novel_00/chapters/ch001.md")).toBeVisible();
  await page.getByLabel("Revision prompt").fill("Rewrite the opening paragraph with stronger tension.");
  await page.getByRole("button", { name: "Send Prompt" }).click();
  await expect(page.getByText("I tightened the opening and kept the canon references intact.")).toBeVisible();

  await page.getByRole("button", { name: "Apply To Draft" }).click();
  await expect(page.getByText("Applied to draft.")).toBeVisible();

  await page.getByRole("button", { name: "Files" }).click();
  await expect(page.locator(".cm-content")).toContainText("Rewritten line.");

  await page.getByLabel("Commit message").fill("Refine chapter opening");
  await page.getByRole("button", { name: "Include All Dirty" }).click();
  await page.getByRole("button", { name: "Commit Selected Changes" }).click();

  await expect(page.getByText("Commit completed successfully.")).toBeVisible();
});

test("persists multiple workspaces with different models and prompts", async ({ page }) => {
  await mockBridge(page);
  await page.goto("/");

  await page.getByRole("button", { name: "New Workspace" }).click();
  await page.getByText("Workspace Settings").click();
  await page.getByLabel("Workspace name").fill("Checker");
  await page.getByLabel("System prompt").fill("You are a continuity checker.");
  await expect(page.getByText("2 text models")).toBeVisible();
  await page.locator("select.select-input").first().selectOption("anthropic/claude-3.5-haiku");

  await page.reload();
  await expect(page.getByRole("button", { name: "Checker" })).toBeVisible();
  await page.getByRole("button", { name: "Checker" }).click();
  await expect(page.getByLabel("System prompt")).toHaveValue("You are a continuity checker.");
  await expect(page.locator("select.select-input").first()).toHaveValue("anthropic/claude-3.5-haiku");
});
