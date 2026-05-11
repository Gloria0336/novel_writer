# 星落戰紀 — 核心驗證 MVP

基於 [`../card_game_design_v3.2.md`](../card_game_design_v3.2.md) 與 [`../card_game_cardlist_v1.md`](../card_game_cardlist_v1.md) 實作的 Windows 桌面卡牌遊戲。

## 技術堆疊

- Electron 33 + electron-vite + React 18 + TypeScript 5
- Vitest 2（規則層測試）
- electron-builder（Windows .exe 打包）

## 指令

```powershell
# 安裝依賴
npm install

# 開發（啟動 Electron 視窗，HMR）
npm run dev

# 跑測試
npm test
npm run test:coverage

# 編譯 (TS 型別檢查 + Vite build)
npm run build

# 打包成 Windows .exe（產出至 release/）
npm run dist
```

## 專案結構

```
src/
  core/      規則引擎（純函式，不依賴 React / data）
  data/      靜態資料（卡牌、英雄、種族、職業、Boss）
  game/      整合層（React Context、hooks）
  ui/        React 元件
test/        規則層 e2e
electron/    主進程與 preload
```

分層由 ESLint `import/no-restricted-paths` 強制：

- `core/` 不可 import `data/` 或 React
- `data/` 只可 import `core/types`
- `ui/` 不可直接 import `core/` 或 `data/`，必須透過 `game/`

## 開發里程碑

| | 內容 | 狀態 |
|---|---|---|
| M1 | 專案骨架 + 數值合成 spec | ✅ |
| M2 | 規則引擎骨幹（reducer、雙軌攻擊、9 個關鍵字） | ✅ |
| M3 | 效果引擎 + 通用卡 54 張 | ✅ |
| M4 | 三位 Demo 英雄與量表（軍令/共鳴/血怒） | ✅ |
| M5 | 腐植巢穴 + AI | ✅ |
| M6 | UI + e2e + Windows 打包 | ✅ |

## 測試覆蓋

```
✓ 6 個核心 spec + 3 個 e2e spec → 共 97 tests
  - 數值合成（18）
  - PRNG（6）
  - 雙軌攻擊與關鍵字（21）
  - 效果引擎（14）
  - 英雄與量表（17）
  - 巢穴 AI（8）
  - E2E 三位英雄各自的規則戰鬥（13）
```

## 完成定義（DoD）

- [x] `npm install` + `npm run dev` 可啟動 Electron 視窗
- [x] 三位英雄可從 HeroSelectScreen 選擇
- [x] BattleScreen 可完整操作戰鬥（部署、施法、攻擊、技能、終極技、結束回合）
- [x] 三位英雄各能擊敗腐植巢穴
- [x] 97 / 97 測試全綠（`npm test`）
- [x] `npm run build` 成功（TS 嚴格模式 + electron-vite）
- [x] `npm run dist:dir` 產出可執行資料夾 `release/win-unpacked/星落戰紀.exe`（269MB）

## 打包說明

**推薦方式**（無需特殊權限）：
```powershell
npm run dist:dir
# 產出 release/win-unpacked/，雙擊 星落戰紀.exe 即可執行
```

**完整 NSIS 安裝包** — `npm run dist`：
此模式需要 Windows 符號連結建立權限（macOS code-sign 工具需要 symlink）。
若失敗請：
1. 以系統管理員身份執行 PowerShell，或
2. 開啟 Windows 設定 → 隱私權與安全性 → 開發人員專用 → 開啟「開發人員模式」

開發人員模式啟用後，再次執行 `npm run dist` 即可產出 `release/星落戰紀-Setup-x.x.x.exe`。
