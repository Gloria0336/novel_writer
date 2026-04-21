import { createServer } from "node:http";
import { URL } from "node:url";
import { BRIDGE_PORT, GITHUB_TOKEN, OPENROUTER_API_KEY } from "./config.js";
import { OpenRouterBridgeClient } from "./openRouterClient.js";
import { LocalFsRepoAdapter, RepoAuthError, RepoConflictError } from "./repoAdapter.js";
import type { AiChatRequest, BridgeStatus, CommitRequest, RepoRef } from "./types.js";

const repoAdapter = new LocalFsRepoAdapter();
const openRouterClient = new OpenRouterBridgeClient();

function sendJson(response: import("node:http").ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.end(JSON.stringify(body));
}

async function readJson<T>(request: import("node:http").IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as T) : ({} as T);
}

function requireQueryValue(url: URL, key: string): string {
  const value = url.searchParams.get(key);
  if (!value) {
    throw new Error(`Missing query parameter: ${key}`);
  }
  return value;
}

function repoRefFromUrl(url: URL): RepoRef {
  return {
    owner: requireQueryValue(url, "owner"),
    repo: requireQueryValue(url, "repo"),
    branch: requireQueryValue(url, "branch"),
  };
}

function getStatus(): BridgeStatus {
  return {
    ok: true,
    repoAdapter: repoAdapter.name,
    hasGitHubToken: Boolean(GITHUB_TOKEN),
    hasOpenRouterApiKey: Boolean(OPENROUTER_API_KEY),
  };
}

function handleError(response: import("node:http").ServerResponse, error: unknown) {
  if (error instanceof RepoConflictError) {
    sendJson(response, 409, { error: error.message });
    return;
  }

  if (error instanceof RepoAuthError) {
    sendJson(response, 401, { error: error.message });
    return;
  }

  if (error instanceof SyntaxError) {
    sendJson(response, 400, { error: "Invalid JSON request body." });
    return;
  }

  sendJson(response, 500, {
    error: error instanceof Error ? error.message : "Unknown bridge error.",
  });
}

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (!request.url) {
    sendJson(response, 400, { error: "Missing request URL." });
    return;
  }

  const url = new URL(request.url, `http://127.0.0.1:${BRIDGE_PORT}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/status") {
      sendJson(response, 200, getStatus());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/repo/tree") {
      const repoRef = repoRefFromUrl(url);
      const result = await repoAdapter.listTree(repoRef);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/repo/file") {
      const repoRef = repoRefFromUrl(url);
      const path = requireQueryValue(url, "path");
      const sha = requireQueryValue(url, "sha");
      const result = await repoAdapter.readFile(repoRef, path, sha);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/ai/models") {
      const models = await openRouterClient.getModels();
      sendJson(response, 200, { models });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/ai/chat") {
      const payload = await readJson<AiChatRequest>(request);
      const result = await openRouterClient.sendChat(payload);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/repo/commit") {
      const payload = await readJson<CommitRequest>(request);
      const result = await repoAdapter.commitFiles(payload);
      sendJson(response, 200, result);
      return;
    }

    sendJson(response, 404, { error: "Route not found." });
  } catch (error) {
    handleError(response, error);
  }
});

server.listen(BRIDGE_PORT, "127.0.0.1", () => {
  console.log(`Novel Writer bridge listening on http://127.0.0.1:${BRIDGE_PORT}`);
});
