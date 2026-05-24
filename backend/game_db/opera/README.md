# Opera TRPG

這是一個本機優先的多代理 TRPG 框架，包含 FastAPI 後端、React/Vite 控制台、可重現的決定性規則、分層記憶隔離，以及可接上 LangGraph 的編排流程。

## 內容包含
- 使用 FastAPI 提供劇本、行動、導演控制、過濾視角、匯入匯出與 SSE 事件串流。
- 使用 SQLite 持久化劇本、規則書、世界設定條目、故事狀態快照、事件、角色設定、分層記憶、向量嵌入、導演備註、GM 簡報與決定性解析結果。
- 四層記憶模型：
- 第 1 層：世界知識
- 第 2 層：故事狀態
- 第 3 層：每位代理各自擁有的結構化記憶、滾動摘要與本地向量檢索
- 第 4 層：只有導演可見的意圖與隱藏指引
- 具備可重播隨機種子的決定性規則引擎，並支援導演覆寫的稽核。
- React/Vite 網頁控制台包含五個面板：劇本總覽、世界觀 / 規則 / NPC 編輯器、執行檢視、記憶 / 狀態檢視與導演控制台。

## 專案結構
- `backend/app`：API、持久化、編排流程與領域邏輯
- `backend/tests`：單元測試與整合測試
- `frontend`：Vite/React 控制台

## 後端
在專案根目錄執行 API：

```bash
uvicorn backend.app.main:app --reload
```

重要環境變數：

```bash
OPERA_DATABASE_URL=sqlite+pysqlite:///./opera_trpg.db
OPENROUTER_API_KEY=...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_SITE_NAME=Opera TRPG
```

如果缺少 `OPENROUTER_API_KEY`，編排流程會退回本地的決定性敘事樣板，因此整個系統仍可離線運作。

## 前端
在 `frontend` 目錄中安裝並執行：

```bash
npm install
npm run dev
```

可選環境變數：

```bash
VITE_API_BASE=http://localhost:8000/api
```

## API 介面
- `POST /api/campaigns`
- `GET /api/campaigns`
- `GET /api/campaigns/{id}`
- `POST /api/campaigns/{id}/run/step`
- `POST /api/campaigns/{id}/actions/player`
- `POST /api/campaigns/{id}/actions/director`
- `POST /api/campaigns/{id}/director/gm-brief`
- `POST /api/campaigns/{id}/director/inject-event`
- `GET /api/campaigns/{id}/views/gm`
- `GET /api/campaigns/{id}/views/director`
- `GET /api/campaigns/{id}/views/agent/{agent_id}`
- `GET /api/campaigns/{id}/timeline`
- `POST /api/campaigns/{id}/import`
- `GET /api/campaigns/{id}/export`
- `GET /api/campaigns/{id}/stream`

## 測試
測試套件使用標準函式庫的 `unittest` 執行：

```bash
python -B -m unittest discover -s backend/tests -v
```

測試涵蓋：
- 代理視角的可見性邊界
- 決定性規則的可重播性
- 摘要器輸出
- API 層級的建立、行動、步進、匯出與匯入流程

## 備註
- LangGraph 目前在這個工作區是可選執行期依賴；安裝套件時編排器會標示自己為 `langgraph`，否則會使用相容的循序備援流程。
- 匯出支援 JSON、YAML 與 Markdown，匯入目前則預期為結構化的 JSON 或 YAML 資料。
