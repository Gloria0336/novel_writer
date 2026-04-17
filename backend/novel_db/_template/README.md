# {{NOVEL_TITLE}}

- `Novel ID`: `{{NOVEL_ID}}`
- `Slug`: `{{NOVEL_SLUG}}`
- `Created`: `{{CREATED_DATE}}`
- `Project Folder`: `{{NOVEL_ID}}_{{NOVEL_SLUG}}`

這是新小說專案的通用模板。請把這裡的內容當成起始骨架，而不是最終 canon。

## 目錄用途

- `bible/`: 長期有效的角色、世界觀、關係、時間線與伏筆資料。
- `outline/`: 主線大綱、幕結構、長線規劃與待回收節點。
- `context/`: 寫作前快速注入的最新摘要，幫助維持連貫性。
- `chapters/`: 正文章節，建議使用 `ch001.md`、`ch002.md` 這種固定命名。
- `scripts/`: 給 AI 或作者使用的操作提示與檢查流程。
- `temp/`: 臨時參考資料，不直接視為正式設定。

## 建議工作流

1. 先填寫 `bible/` 與 `outline/`，建立故事核心前提。
2. 每次完成新章後更新 `context/last-chapter-summary.md`。
3. 視需要同步更新 `bible/` 的人物狀態、設定規則與伏筆。
4. 若本章讓長線方向改變，更新 `outline/master-outline.yaml`。
5. 在下一次寫作前壓縮並刷新 `context/CONTEXT.md`。

## 命名與維護規則

- 章節檔名建議使用 `ch001.md`、`ch002.md`。
- `bible/` 只存放目前仍有效、需要跨章追蹤的資訊。
- `context/` 偏向「現在這一刻」的摘要，不應變成完整百科。
- `temp/` 的內容除非明確整理進正式檔案，否則不算 canon。

## 建議起手式

- 先決定主角、核心衝突、故事承諾與第一幕結尾。
- 至少補完：
  - `bible/characters.yaml`
  - `bible/worldbuilding.md`
  - `outline/master-outline.yaml`
  - `context/CONTEXT.md`
