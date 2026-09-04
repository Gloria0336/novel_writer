# Kenlai

- `Novel ID`: `novel_07`
- `Slug`: `kenlai`
- `Created`: `2026-09-01`
- `Project Folder`: `novel_07_kenlai`

**現代修仙世界**。靈氣是科技的能源，也是科學的對象。三千年前一場復仇大戰打碎了大陸、殺光了六位大帝、毀掉了通往「世界之外」的道門——此後再無人成帝。五方勢力在這個沒有法律的世界上維持恐怖平衡，而世界本身正在慢慢壞掉，沒有人知道。

## 目前狀態（2026-09-04）

- **世界觀已完成**：`temp/v43.md`（438 項已確認決策）已拆分匯入 `bible/`、`outline/`、`context/`。
- **正文已開始**：`chapters/Ch001.md` 已寫成（災前日常，Day 1 的一個平凡早晨），並已回填 `bible/`、`outline/`、`context/`。
- **仍待決定**：核心衝突、故事承諾與第一幕結尾，見 `outline/act1.md`。
- **權威順序**：`chapters/`（正文，最高） → `bible/` 與 `context/secrets-lockbox.md`（正式 canon） → `temp/v43.md`（原始參考）。
  - 正文與設定檔衝突時，**以正文為準**，並回頭修正設定檔。
  - 設定檔彼此不一致、且皆未經正文確立時，以 v43 原文為裁決依據。
  - 設定檔中標記 `[Ch001]` 的條目為正文已寫定的事實，不可再改。

## 目錄用途

- `bible/`: 長期有效的角色、世界觀、關係、地點、時間線與伏筆資料。
- `outline/`: 主線大綱、幕結構、長線規劃與待回收節點。
- `context/`: 寫作前快速注入的最新摘要，以及只給作者與 AI 參考的未揭露秘密。
- `chapters/`: 正文章節。實際採用的命名為 `Ch001.md`、`Ch002.md`（首字母大寫）。
- `scripts/`: 給 AI 或作者使用的操作提示與檢查流程。
- `temp/`: 臨時參考資料，不直接視為正式設定。

## 建議工作流

1. 先填寫 `bible/` 與 `outline/`，建立故事核心前提。
2. 每次完成新章後更新 `context/last-chapter-summary.md`。
3. 視需要同步更新 `bible/` 的人物狀態、地點資料、設定規則與伏筆。
4. 若本章讓長線方向改變，更新 `outline/master-outline.yaml`。
5. 尚未正式揭露的真相、人物秘密與未來系統擴張，記錄到 `context/secrets-lockbox.md`，不要直接寫進公開 canon。
6. 在下一次寫作前壓縮並刷新 `context/CONTEXT.md`。

## 命名與維護規則

- 章節檔名使用 `Ch001.md`、`Ch002.md`（沿用 `Ch001.md` 的既有寫法）。
- `bible/` 只存放目前仍有效、需要跨章追蹤的資訊。
- 地理資訊優先集中在 `bible/location.yaml`，時間線僅引用對應地點。
- `worldbuilding.md` 只放已揭露且可公開引用的世界規則；未揭露內容請移到 `context/secrets-lockbox.md`。
- `context/` 偏向「現在這一刻」的摘要，不應變成完整百科。
- `temp/` 的內容除非明確整理進正式檔案，否則不算 canon。

## 下一步

- 續寫 `Ch002`：接點為草場的工作日常（`Ch001` 章尾主角正騎馬前往）。
- 決定核心衝突、故事承諾與第一幕結尾（見 `outline/act1.md`「仍待決定的三件事」）。
- 每次動筆前先讀 `context/CONTEXT.md`，其中的「敘事文體規範」已由 `Ch001` 定調，須沿用。
