# 更新 Bible 指引

> **第一原則：正文是最高權威。** 章節一旦寫成，`chapters/` 的內容即為正式真相；
> `bible/`、`outline/`、`context/` 的職責是追上正文，不是約束正文。
> 兩者衝突時，預設修改設定檔並在該處註明差異，不要默默改掉正文，也不要假裝衝突不存在。
>
> 標記慣例：凡由正文確立的事實，在設定檔中以 `[ChXXX]` 前綴標示，
> 使後人一眼看出哪些是不可再動的既成事實、哪些仍是可改的規劃。

當章節 `ChXXX.md` 寫完後，請執行以下作業：

## 一、掃描

1. **掃描新規則**: 是否出現新的世界規律、制度、地點、組織或限制？
2. **掃描人物變更**: 人物性格、關係、傷勢、能力、目標、秘密是否有新變化？
3. **掃描新的具體物**: 正文寫出來的場景細節、器物、店家、動物、習慣——
   即使當下只是背景，只要有可能再次出現，就要記下來（例：Ch001 的鐘聲、早課的岩石、主角房間的陳設）。
4. **掃描規劃與正文的落差**: 大綱裡列了但正文沒寫的、正文寫了但大綱沒列的，兩邊都要記。
   未執行的規劃項不要直接刪除——標明「未執行」並決定它是移交後續章節還是放棄。

## 二、回寫

5. **區分公開與保密資訊**: 已正式揭露的內容寫回 `bible/`；尚未揭露的作者規劃、隱藏真相或未來系統擴張寫入 `context/secrets-lockbox.md`。
6. **對齊正式資料**: 更新 `bible/characters.yaml`、`bible/relationships.yaml`、`bible/location.yaml`、`bible/timeline.yaml`、`bible/plot-threads.yaml` 或 `bible/worldbuilding.md`。
   - `first_appearance` 由 `planned` 改為實際章節編號。
   - `bible/timeline.yaml` 的 `story_timeline` 新增本章條目。
   - `bible/plot-threads.yaml` 中本章實際埋下的線，`status` 設為 `open`、`introduced_in` 填章節編號；
     並註明它目前的性質（是真伏筆，還是尚未被賦予意義的生活細節）。
7. **更新摘要**: 刷新 `context/last-chapter-summary.md`（含章尾落點、下章接點、知情層級檢查）
   與 `context/CONTEXT.md`（當前章節節點、當前場景、活躍角色狀態、待接續伏筆）。
8. **校正大綱**: 更新 `outline/master-outline.yaml` 的 `current_chapter`、`current_endpoint`、
   `canon_scope.covered_chapters`、`chapter_beats`、`character_state_snapshot`、`continuity_flags`；
   若本章改變中短期方向，一併更新 `outline/act*.md`。
9. **登記未決項**: 正文中留白或未寫定的東西（未命名的角色與店家、未指明的性別與毛色、
   沒寫出來的回答），一律登記到 `outline/master-outline.yaml` 的 `continuity_flags`，
   以免日後不同章節各自填出互相矛盾的答案。

## 三、文體

10. **文體是否有變動**: 若本章在人稱、時態、段落密度、對白處理上有新的作法，
    更新 `context/CONTEXT.md` 的「敘事文體規範」與 `outline/act1.md` 的對應段落。
    文體規範以**實際寫成的正文**為準。

## AI 回應格式

- 我已偵測到以下變更，是否更新正式資料？
- [ ] 人物狀態：...
- [ ] 關係變化：...
- [ ] 地點資料：...
- [ ] 新伏筆／新的生活細節：...
- [ ] 世界觀規則：...
- [ ] 保密設定：...
- [ ] 時間線：...
- [ ] 規劃與正文的落差：...
- [ ] 待決定的留白：...
- [ ] 文體規範：...
