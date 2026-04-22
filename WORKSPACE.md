# Integrated Workspace

This repository can host `Novel Writer` and `Opera` in one shell while keeping both backends independent.

## Layout

```text
novel_writer/
  backend/
  frontend/
  external/
    opera/
```

`external/opera` is expected to be a Git submodule.

## One-click startup

Use either:

```powershell
.\start-workspace.ps1
```

or double-click:

```text
start-workspace.cmd
```

The launcher starts:

- Novel Writer frontend on `http://127.0.0.1:4173`
- Novel Writer bridge on `http://127.0.0.1:8787`
- Opera frontend on `http://127.0.0.1:5173`
- Opera backend on `http://127.0.0.1:8000/api`

## Environment

Copy `workspace.env.example` to `workspace.env` if you want to override ports or secrets.

Important keys:

- `NOVEL_WRITER_FRONTEND_PORT`
- `NOVEL_WRITER_BRIDGE_PORT`
- `VITE_BRIDGE_BASE_URL`
- `VITE_OPERA_FRONTEND_URL`
- `NOVEL_WRITER_OPERA_BASE_URL`
- `OPERA_FRONTEND_PORT`
- `OPERA_BACKEND_PORT`
- `OPERA_DATABASE_URL`
- `OPENROUTER_API_KEY`

## Notes

- Novel Writer embeds Opera with an iframe-based `Opera` view in the top bar.
- Novel Writer still talks to Opera through the bridge API.
- Opera keeps its own backend, frontend, database, and Git history.
