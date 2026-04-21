# MCP Bridge

Local bridge service for the Novel Writer frontend.

## Environment

The bridge reads environment variables from either:

1. the current shell session, or
2. `backend/mcp_bridge/.env`

Supported variables:

- `NOVEL_WRITER_GITHUB_TOKEN`: GitHub token used for repo tree/file/commit requests
- `NOVEL_WRITER_OPENROUTER_API_KEY`: OpenRouter API key used for model listing and AI chat
- `NOVEL_WRITER_BRIDGE_PORT`: Optional port override, defaults to `8787`
- `NOVEL_WRITER_OPERA_BASE_URL`: Base URL for the isolated Opera API, defaults to `http://127.0.0.1:8000/api`

Shell variables take precedence over `.env`.

## .env Setup

Create a `.env` file in `backend/mcp_bridge`:

```bash
cp .env.example .env
```

Then edit it:

```env
NOVEL_WRITER_GITHUB_TOKEN=ghp_your_github_token
NOVEL_WRITER_OPENROUTER_API_KEY=sk-or-your-openrouter-key
NOVEL_WRITER_BRIDGE_PORT=8787
NOVEL_WRITER_OPERA_BASE_URL=http://127.0.0.1:8000/api
```

## Run

```bash
cd backend/mcp_bridge
npm install
npm run build
npm start
```

If the bridge starts successfully, it will listen on:

```text
http://127.0.0.1:8787
```

You can verify it with:

```text
http://127.0.0.1:8787/api/status
```

Opera integration endpoints:

```text
GET  http://127.0.0.1:8787/api/integrations/opera/status
POST http://127.0.0.1:8787/api/integrations/opera/export
```

## Notes

The current adapter layer is shaped around the planned MCP boundary:

- `listTree(repoRef)`
- `readFile(repoRef, path)`
- `commitFiles(repoRef, message, files)`

It currently uses GitHub's server-side REST API behind that adapter so the frontend can move to a bridge-first architecture immediately. Swapping the implementation to a dedicated MCP client later should not require frontend changes.
