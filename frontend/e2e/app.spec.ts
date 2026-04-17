import { test, expect } from "@playwright/test";

async function mockGitHub(page: import("@playwright/test").Page) {
  let headSha = "head-1";
  let treeSha = "tree-1";
  let fileContent = "# Chapter 1\n\nOriginal line.";

  await page.route("https://api.github.com/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.endsWith("/git/ref/heads/main") && method === "GET") {
      await route.fulfill({ json: { object: { sha: headSha } } });
      return;
    }

    if (url.endsWith(`/git/commits/${headSha}`) && method === "GET") {
      await route.fulfill({ json: { tree: { sha: treeSha } } });
      return;
    }

    if (url.includes("/git/trees/") && method === "GET") {
      await route.fulfill({
        json: {
          sha: treeSha,
          truncated: false,
          tree: [
            {
              path: "backend/novel_db/novel_00/chapters/ch001.md",
              sha: "file-1",
              type: "blob",
            },
          ],
        },
      });
      return;
    }

    if (url.includes("/contents/backend/novel_db/novel_00/chapters/ch001.md") && method === "GET") {
      await route.fulfill({
        body: Buffer.from(fileContent),
        contentType: "application/octet-stream",
      });
      return;
    }

    if (url.endsWith("/git/trees") && method === "POST") {
      treeSha = "tree-2";
      const body = JSON.parse(route.request().postData() ?? "{}");
      fileContent = body.tree[0].content;
      await route.fulfill({ json: { sha: treeSha } });
      return;
    }

    if (url.endsWith("/git/commits") && method === "POST") {
      headSha = "head-2";
      await route.fulfill({ json: { sha: headSha } });
      return;
    }

    if (url.endsWith("/git/refs/heads/main") && method === "PATCH") {
      await route.fulfill({ json: { object: { sha: headSha } } });
      return;
    }

    await route.fulfill({ status: 404, body: "Not mocked" });
  });
}

async function mockOpenRouter(page: import("@playwright/test").Page) {
  await page.route("https://openrouter.ai/api/v1/models", async (route) => {
    await route.fulfill({
      json: {
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
            id: "anthropic/claude-3.5-haiku",
            name: "Claude Haiku",
            context_length: 200000,
            architecture: {
              input_modalities: ["text"],
              output_modalities: ["text"],
            },
            supported_parameters: ["temperature"],
          },
        ],
      },
    });
  });

  await page.route("https://openrouter.ai/api/v1/chat/completions", async (route) => {
    await route.fulfill({
      json: {
        choices: [
          {
            message: {
              role: "assistant",
              content: "Here is a rewritten paragraph.",
            },
          },
        ],
      },
    });
  });
}

test("loads repo tree and opens the initial file", async ({ page }) => {
  await mockGitHub(page);
  await mockOpenRouter(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Show Sidebar" }).click();

  await expect(page.getByRole("button", { name: "ch001.md" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "backend/novel_db/novel_00/chapters/ch001.md" })).toBeVisible();
});

test("edits and commits a chapter draft", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "novel-writer-ui:settings",
      JSON.stringify({
        schemaVersion: 1,
        data: {
          schemaVersion: 1,
          githubPat: "test-pat",
          uiPrefs: {
            sidebarOpen: true,
            sidebarWidth: 320,
            dockHeight: 320,
            favoriteModels: [],
            recentModels: [],
          },
          defaultWorkspaceTemplate: {
            model: "openai/gpt-4o-mini",
            systemPrompt: "test",
            temperature: 0.7,
            maxCompletionTokens: 1200,
            autoAttachActiveFile: true,
          },
        },
      }),
    );
  });

  await mockGitHub(page);
  await mockOpenRouter(page);
  await page.goto("/");

  await page.locator(".cm-content").click();
  await page.keyboard.press("End");
  await page.keyboard.type(" Added sentence.");

  await page.getByLabel("Commit message").fill("Update opening line");
  await page.getByRole("button", { name: "Include all dirty" }).click();
  await page.getByRole("button", { name: "Commit selected changes" }).click();

  await expect(page.getByText("Commit completed successfully.")).toBeVisible();
});

test("persists multiple workspaces with different models and prompts", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "novel-writer-ui:settings",
      JSON.stringify({
        schemaVersion: 1,
        data: {
          schemaVersion: 1,
          openRouterApiKey: "test-openrouter",
          uiPrefs: {
            sidebarOpen: false,
            sidebarWidth: 320,
            dockHeight: 320,
            favoriteModels: [],
            recentModels: [],
          },
          defaultWorkspaceTemplate: {
            model: "openai/gpt-4o-mini",
            systemPrompt: "draft prompt",
            temperature: 0.7,
            maxCompletionTokens: 1200,
            autoAttachActiveFile: true,
          },
        },
      }),
    );
  });

  await mockGitHub(page);
  await mockOpenRouter(page);
  await page.goto("/");

  await page.getByRole("button", { name: "New Workspace" }).click();
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
