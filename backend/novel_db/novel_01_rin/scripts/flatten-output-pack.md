# Flatten Output Instruction Pack

本指令包用於協助 LLM 在無法執行 `backend/novel_db/flatten.mjs` 時，手動輸出近似現有 flatten 檔的 Markdown 內容。

若可執行腳本，仍以 `flatten.mjs` 產物為準。本檔只定義人工或 LLM 輔助輸出的格式契約。

## LLM 任務

當使用者要求輸出 `novel_01_rin` 的 flatten 內容時，LLM 必須：

1. 依照本檔格式輸出單一 Markdown。
2. 不加入額外說明、前言、結語或對話。
3. 不改寫來源檔內容。
4. 不省略必要的標頭、目錄、檔案路徑註解、程式碼圍欄與分隔線。
5. 若來源檔內容未知，不得臆造；應明確要求使用者提供該檔內容。

## 輸出總格式

flatten 內容必須比照現有 `_exports/novel_01_rin.flatten.md`：

````markdown
# novel_01_rin Flattened Novel Context

This file is generated from a novel directory so AI tools can read the project as one Markdown document without relying on folder traversal.

## Scope
- Source: `backend/novel_db/novel_01_rin`
- Files included: N
- Included extensions: .md, .yaml, .yml, .json, .txt, plus .cursorrules
- Excluded directories: private, temp, temps, _exports
- Excluded filenames: (none)

## Secret Handling
context/secrets-lockbox.md contains author/director-only unrevealed planning. Treat it as independent hidden knowledge, not public canon or character-known information.

## Table of Contents
- [.cursorrules](#cursorrules)
- [README.md](#readme-md)
- ...

---

## .cursorrules

<!-- file_path: backend/novel_db/novel_01_rin/.cursorrules -->

```text
檔案內容
```

---

## README.md

<!-- file_path: backend/novel_db/novel_01_rin/README.md -->

```markdown
檔案內容
```
````

## 檔案排序

必須依照 `flatten.config.json` 的 `sectionOrder`：

1. `.cursorrules`
2. `README.md`
3. `context/`
4. `outline/`
5. `bible/`
6. `chapters/`
7. `scripts/`
8. 其他未列出的檔案或資料夾，按路徑字母排序排在最後

同一區段內按相對路徑排序。

目前 `novel_01_rin` 的常見順序為：

1. `.cursorrules`
2. `README.md`
3. `context/CONTEXT.md`
4. `context/rpg-start.md`
5. `context/session-state-template.md`
6. `outline/master-outline.yaml`
7. `outline/rpg-chapter-arc.yaml`
8. `bible/characters.yaml`
9. `bible/master-outline.md`
10. `bible/plot-threads.yaml`
11. `bible/rpg-rules.md`
12. `bible/worldbuilding.md`
13. `scripts/flatten-output-pack.md`

若檔案不存在，不要列入。若新增可包含副檔名，依照同樣排序規則加入。

## 檔案納入規則

納入：

- `.md`
- `.yaml`
- `.yml`
- `.json`
- `.txt`
- `.cursorrules`

排除：

- `private/`
- `temp/`
- `temps/`
- `_exports/`
- 非上述副檔名的檔案

## 程式碼圍欄語言

依副檔名選擇 fence language：

- `.md` -> `markdown`
- `.yaml` 或 `.yml` -> `yaml`
- `.json` -> `json`
- `.txt` -> `text`
- `.cursorrules` -> `text`
- 其他未知類型 -> 空白語言標記

若檔案內容本身包含三個反引號，必須將內容中的 ``` 轉成 ``\`，避免破壞外層圍欄。

## 每個檔案區塊格式

每個檔案都必須用以下格式：

````markdown
## relative/path.ext

<!-- file_path: backend/novel_db/novel_01_rin/relative/path.ext -->

```language
原始檔案內容
```
````

檔案區塊之間必須使用：

```markdown
---
```

## TOC 錨點規則

TOC 項目格式：

```markdown
- [relative/path.ext](#slug)
```

slug 規則比照現有 flatten：

- 轉小寫。
- `\` 轉 `/`。
- 非英數字與非 CJK 字元轉成 `-`。
- 移除開頭與結尾的 `-`。

例：

- `.cursorrules` -> `#cursorrules`
- `README.md` -> `#readme-md`
- `context/rpg-start.md` -> `#context-rpg-start-md`
- `outline/rpg-chapter-arc.yaml` -> `#outline-rpg-chapter-arc-yaml`

## Secret Handling

即使目前沒有 `context/secrets-lockbox.md`，標頭仍可保留現有 secret handling 說明，因為它比照 `flatten.config.json` 的全域輸出格式。

若日後實際納入 `context/secrets-lockbox.md`，該檔案區塊開頭需額外加入：

```markdown
> Secret handling: this section contains author/director-only unrevealed planning. Treat it as independent hidden knowledge, not public canon or character-known information.
```

## 品質檢查

輸出前確認：

- 第一行是 `# novel_01_rin Flattened Novel Context`。
- `Files included` 數量與 TOC 條目一致。
- TOC 順序與檔案區塊順序一致。
- 每個 TOC 項目都有對應 `##` 區塊。
- 每個檔案區塊都有 `<!-- file_path: ... -->`。
- 每個檔案內容都放在正確語言的 code fence 內。
- 章節式 RP 相關檔案不可遺漏：`.cursorrules`、`context/CONTEXT.md`、`context/rpg-start.md`、`context/session-state-template.md`、`outline/rpg-chapter-arc.yaml`、`bible/rpg-rules.md`。
