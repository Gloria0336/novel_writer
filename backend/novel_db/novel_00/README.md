# Novel 00

- `Novel ID`: `novel_00`
- `Status`: placeholder / template-derived
- `Current Chapter`: not started
- `Project Folder`: `novel_00`

## 定位

`novel_00` 目前是由小說模板建立出的空白專案，尚未形成正式題名、角色、世界觀或正文 canon。它適合作為新故事的試作區：先放入角色、世界規則與第一章草稿，再逐步把 `bible/`、`outline/` 與 `context/` 補齊。

## 目錄結構

- `chapters/`: 正文章節。現有 `ch001.md` 仍是空檔，尚未寫入正式內容。
- `bible/`: 公開 canon 設定庫，包含角色、地點、關係、時間線、劇情線與世界觀。
- `outline/`: 分幕與主線大綱。現有檔案仍保留模板格式。
- `context/`: 續寫上下文，包含最新章節摘要、工作上下文與尚未公開的秘密鎖箱。
- `scripts/`: 專案維護備忘，例如更新 bible 與一致性檢查流程。
- `temp/`: 臨時資料，不自動視為 canon。

## 目前內容狀態

- `bible/characters.yaml` 仍使用「主角名稱」等模板欄位。
- `bible/worldbuilding.md` 尚未建立具體核心前提。
- `outline/master-outline.yaml` 尚未提供正式故事方向。
- `chapters/ch001.md` 尚無正文內容。

## 建議建立順序

1. 先決定一句話定位：類型、主角、核心衝突與故事承諾。
2. 在 `bible/characters.yaml` 建立主角與第一批重要配角。
3. 在 `bible/worldbuilding.md` 寫入已確定的世界規則，未揭露秘密放入 `context/secrets-lockbox.md`。
4. 在 `outline/master-outline.yaml` 建立第一階段章節推進。
5. 完成 `chapters/ch001.md` 後，同步更新 `context/last-chapter-summary.md`。

## 寫作與維護提醒

- 這個專案尚無 canon，任何新設定都應先明確標記為「正式設定」或「暫定草案」。
- `temp/` 只放參考資料；要成為正式設定時，需手動同步到 `bible/` 或 `outline/`。
- 若用此資料夾開新坑，建議先改名或在 README 補上正式書名，避免後續與模板混淆。
