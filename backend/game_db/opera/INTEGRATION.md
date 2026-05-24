# Opera TRPG Integration

This copy of Opera TRPG is integrated into `novel_writer` under:

```text
backend/game_db/opera
```

It is intentionally kept inside `backend/game_db` rather than restored as the repository root `frontend`.

Run backend commands from this directory:

```powershell
uvicorn backend.app.main:app --reload
python -B -m unittest discover -s backend/tests -v
```

The optional React/Vite control console remains colocated under:

```text
backend/game_db/opera/frontend
```

Run frontend commands from that directory only if you need the Opera control console:

```powershell
npm install
npm run dev
```
