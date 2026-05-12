# novel_02_random Flattened Novel Context

This file is generated from a novel directory so AI tools can read the project as one Markdown document without relying on folder traversal.

## Scope
- Source: `backend/novel_db/novel_02_random`
- Files included: 24
- Included extensions: .md, .yaml, .yml, .json, .txt, plus .cursorrules
- Excluded directories: private, temp, _exports
- Excluded filenames: (none)

## Secret Handling
context/secrets-lockbox.md contains author/director-only unrevealed planning. Treat it as independent hidden knowledge, not public canon or character-known information.

## Table of Contents
- [.cursorrules](#cursorrules)
- [README.md](#readme-md)
- [context/CONTEXT.md](#context-context-md)
- [context/last-chapter-summary.md](#context-last-chapter-summary-md)
- [context/secrets-lockbox.md](#context-secrets-lockbox-md)
- [outline/act1.md](#outline-act1-md)
- [outline/master-outline.yaml](#outline-master-outline-yaml)
- [bible/characters.yaml](#bible-characters-yaml)
- [bible/demonology.yaml](#bible-demonology-yaml)
- [bible/inner_setting.yaml](#bible-inner-setting-yaml)
- [bible/location.yaml](#bible-location-yaml)
- [bible/organizations.yaml](#bible-organizations-yaml)
- [bible/plot-threads.yaml](#bible-plot-threads-yaml)
- [bible/relationships.yaml](#bible-relationships-yaml)
- [bible/species.yaml](#bible-species-yaml)
- [bible/timeline.yaml](#bible-timeline-yaml)
- [bible/worldbuilding.md](#bible-worldbuilding-md)
- [chapters/ch001.md](#chapters-ch001-md)
- [chapters/ch002.md](#chapters-ch002-md)
- [chapters/ch003.md](#chapters-ch003-md)
- [chapters/ch004-1.md](#chapters-ch004-1-md)
- [chapters/README.md](#chapters-readme-md)
- [scripts/consistency-check.md](#scripts-consistency-check-md)
- [scripts/update-bible.md](#scripts-update-bible-md)

---
## .cursorrules

<!-- file_path: backend/novel_db/novel_02_random/.cursorrules -->

```text
你是 `novel_02_random` 的長篇小說協作助理。

在執行任何寫作任務前，你必須：
1. 讀取 `/bible/` 下所有檔案。
2. 讀取 `/context/CONTEXT.md`。
3. 讀取 `/context/last-chapter-summary.md`。
4. 讀取 `/outline/master-outline.yaml`，若當前章節已有對應分幕，也一併讀取 `outline/act*.md`。
5. 確認本次內容不違反已建立的人物性格、世界觀規則、地理設定、專有名詞與時間線。
6. 讀取 `/context/secrets-lockbox.md`，確認本章不提前洩漏其中尚未正式揭露的秘密、隱藏真相與未來系統擴張。

# 章節回顧檢查
寫作完成後，你必須：
1. 更新 `/context/last-chapter-summary.md`。
2. 視需要更新 `bible/characters.yaml`、`bible/location.yaml`、`bible/organizations.yaml`、`bible/timeline.yaml`、`bible/plot-threads.yaml`、`bible/worldbuilding.md`。
3. 若本章新增但尚未揭露的作者規劃，更新 `/context/secrets-lockbox.md`，不要直接寫進公開 canon。
4. 若章節明確改變主線方向，也要提醒檢查 `outline/master-outline.yaml`。
5. `chapters/serect/` 中新增的任何資料，不得作為正文資料來源，也不得用於章節回顧檢查或更新。
```

---

## README.md

<!-- file_path: backend/novel_db/novel_02_random/README.md -->

```markdown
# Random

- `Novel ID`: `novel_02`
- `Slug`: `random`
- `Status`: worldbuilding / short-story drafting
- `Created`: `2026-04-17`
- `Project Folder`: `novel_02_random`

## 核心定位

`novel_02_random` 是一個大型魔導奇幻世界資料庫，並以短篇、角色支線或群像片段逐步落地。世界是一片漂浮於宇宙星空中的巨大平面大陸，曾由創世眾神與原初四族共同生活；眾神之戰後，大陸分裂、神明離去、黑暗次元滲透，現代文明則發展出魔導科技、騎士制度、公會網絡與跨種族政治格局。

目前正文以「短篇一：山獵人」建立第一個落地案例：西邊群山下的村莊被山妖逼到衰敗，老村長變賣一切請來沉默的討伐者，山獵人獨自入山，以骨箭、長弓與大太刀斬殺大型妖物。

## 目錄結構

- `chapters/`: 正文章節與短篇草稿，現有 `ch001.md`、`ch002.md`、`ch003.md`、`ch004-1.md` 與章節 README。
- `bible/`: 正式世界設定與角色資料。
  - `characters.yaml`: 山獵人、老村長、山妖、貝奧爾德、艾拉、艾瑟蘭迪爾家族、芮卡等角色與勢力。
  - `worldbuilding.md`: 創世、眾神、兩顆月亮、曆法、種族、魔導科技、政治、騎士、公會與日常文化。
  - `species.yaml`: 種族資料。
  - `demonology.yaml`: 魔族、黑暗次元與腐化體系。
  - `organizations.yaml`: 帝國、公會、騎士團與其他組織。
  - `location.yaml`: 大陸、國家、城市、山區與重要場域。
  - `timeline.yaml`: 歷史與章節時間線。
  - `relationships.yaml`: 角色與勢力關係。
  - `plot-threads.yaml`: 主線、短篇與伏筆。
  - `inner_setting.yaml`: 內部設定工作檔。
- `outline/`: 主線與分幕大綱，目前仍偏規劃狀態。
- `context/`: 續寫上下文與未公開秘密，適合接續章節前載入。
- `temp/`: 臨時參考資料，例如曆法、冒險者公會、帝國城市文化、魔族派系、角色草案等。
- `scripts/`: 設定更新與一致性檢查流程說明。

## 風格

- 類型：史詩奇幻、魔導科技、短篇群像、冒險與政治世界觀。
- 基調：古典奇幻的厚重感，加上魔導工業、飛行器、終端、騎士團與多族政治。
- 戰鬥描寫：重視空間、重量、動作軌跡與敵我尺度差。`ch001` 的山獵人戰鬥是目前最清楚的風格樣本。
- 世界描寫：設定量大，但正文應透過任務、地理、習俗、政治摩擦與角色行動自然揭露，不宜一次百科式倒出。

## 世界大綱

遠古時代，創世眾神以星空物質凝聚平面大陸，並與人、純獸、矮人、精靈等原初四族共同生活。後來眾神之間產生嫌隙，黑暗次元趁虛腐化妖神與獸神，引發眾神之戰。戰爭造成大陸分裂、次元壁破裂、魔族誕生，也讓妖族、魔法泉源與後世各種神話遺產成為現代秩序的一部分。

現今為盟約曆 2256 年，距離上次魔族全面入侵約五百年。表面是長期和平，實際上黑暗次元裂縫正在擴大，異常事件頻率上升，各大勢力雖有察覺，卻不願公開承擔共同應對成本。艾瑟蘭帝國內部也有人類平民院崛起、精靈貴族院守舊、矮人工業貢獻與政治話語權不均等結構性裂痕。

## 當前正文

- `ch001.md`: 「短篇一：山獵人」。建立山村、懸賞、山妖與討伐者的硬派奇幻基調。
- `ch002.md`、`ch003.md`、`ch004-1.md`: 已有後續章節草稿，接續前應回查 `context/` 與 `bible/plot-threads.yaml`。

## 主要設定焦點

- 兩顆月亮：破碎主月與完整副月，牽涉月神之死、神殿遺產與天象儀式。
- 七大種族：人類、精靈、矮人、妖族、魔族、獸族、半神族。
- 魔族三大類：惡魔類、魔化類、原生類，各有階級與腐化邏輯。
- 魔導科技：魔晶、魔石、魔導裝置、空間魔法傳輸、飛行器與終端。
- 騎士與公會：冒險者公會、騎士團認定、空騎團、聖殿騎士團等制度。
- 政治格局：艾瑟蘭帝國、大聯盟、海峽無政府島群與各族權力平衡。

## 寫作與維護提醒

- `temp/` 是參考，不自動視為 canon；正式採用需同步進 `bible/`。
- 正文新增地點、種族、組織或歷史事件時，應更新對應 bible 檔。
- 若短篇彼此分散，`plot-threads.yaml` 要標清楚哪些是同一主線、哪些是獨立世界切片。
- 避免設定先行壓過故事，優先讓角色任務、衝突與具體場景帶出世界規則。
```

---

## context/CONTEXT.md

<!-- file_path: backend/novel_db/novel_02_random/context/CONTEXT.md -->

```markdown
# Novel Context Compression (AI Injection Summary)
> [!IMPORTANT]
> 這是《Random》每次寫作前的核心摘要，用來維持長篇連貫性。內容應對齊最新 canon，並在章節累積後持續壓縮。

## 當前進度 (Current Status)
- **當前章節節點**: `ch004-1`
- **當前場景**: 艾爾諾老師與少年在黑石城旅店過夜後的清晨。少年剛被老師發現徹夜改造報廢手持切割刀，老師允許他帶著作品同行，並要求早餐後說明陣列設計。
- **核心危機**:
  - 帝國北上道路沿線黑暗侵蝕事件變多，腐獸、魔化植物與腐化魔狼已影響村鎮與商隊。
  - 少年魔法控制力不差，但黑魔法緒論與黑暗侵蝕生物知識不足，實戰誤判可能致命。
  - 少年的魔導工程熱情會讓他偏離老師安排的課業，但這項才能可能成為後續重要工具線。

## 已發生的關鍵事件 (Key Events Log)
1. **world-bible**: 世界為漂浮於星空中的平面大陸，由兩塊主大陸與中間島群構成；艾瑟蘭帝國是第一大陸三族聯盟核心，黑暗次元滲透已在和平表象下加劇。
2. **ch001**: 山獵人受老村長最後懸賞，進入西邊群山並斬殺佔據靈泉、吞食村民與走獸的山妖。
3. **ch004-1**: 艾爾諾老師在北上道路旁完成黑暗侵蝕村莊委託，並用腐化魔狼戰鬥教導少年黑暗能量可重建行動迴路。
4. **ch004-1**: 艾爾諾老師施展未知星光魔法，無咒語抹除二十三隻腐化魔狼，顯示她掌握非標準屬性體系或隱秘魔法。
5. **ch004-1**: 少年在黑石城礦業工會商店取得報廢手持切割刀，徹夜改造成更小、更省魔法石的可用原型。

## 當前情感基調 (Tone & Emotion)
- 少年主情緒是對老師的敬畏、被糾正後的緊張，以及面對魔導工程時壓不住的興奮。
- 表層氛圍帶師徒喜劇與技術探索感；深層壓力來自黑暗侵蝕擴大、老師魔法來源不明與北上目的尚未揭露。

## 存活角色 / 活躍角色
- **艾爾諾老師**: 帝國宮廷榮譽法師，黑髮、年輕、神秘。實力極強，能以未知星光魔法抹除黑暗侵蝕。教學嚴格毒舌，但會保留少年真正有價值的才能。
- **少年**: ch004-1 視角角色，艾爾諾老師的弟子。能精準使用雷霆之鏈，但黑暗侵蝕知識不足；魔導工程直覺突出，已完成改造切割刀原型。
- **黑石城矮人老闆**: 礦業工會商店店主，將報廢切割刀送給少年。後續若回到黑石城，可作為礦業工具與矮人工業線入口。
- **山獵人**: ch001 主角，已斬殺山妖後離開，真實身分與力量來源未公開。

## 待接續的伏筆 / 暗示 (Hooks for Next Chapter)
- 艾爾諾老師星光魔法的本質、來源，以及它為何能克制或抹除黑暗能量。
- 少年的姓名、出身、離開帝都原因，以及他為何同時具備戰鬥魔法控制力與魔導工程才能。
- 改造切割刀的穩定性、實戰用途與可能造成的事故。
- 北上道路黑暗侵蝕是否只是局部事件，或已是黑暗次元滲透升級的徵兆。
- 艾爾諾老師帶少年北上的真正目的尚未公開。
```

---

## context/last-chapter-summary.md

<!-- file_path: backend/novel_db/novel_02_random/context/last-chapter-summary.md -->

```markdown
## Last Chapter Summary: ch004-1

- **章節功能**: 建立艾爾諾老師與少年師徒線，展示北上道路黑暗侵蝕正在擴大，並讓少年魔導工程才能首次明確登場。
- **主要事件**:
  - 艾爾諾老師在帝國北上道路旁完成被黑暗能量侵蝕的村莊委託，收取公會委託費。
  - 少年以「雷霆之鏈」精準擊倒二十三隻魔狼，卻因忽略黑暗能量可繞過神經系統重建殺戮迴路而被老師糾正。
  - 艾爾諾老師以未知星光魔法無咒語抹除腐化魔狼，顯示其魔法體系超出標準屬性。
  - 兩人抵達黑石城；少年放棄跟老師去魔法書店，轉去礦業工會商店研究魔導機械。
  - 少年取得報廢手持切割刀並徹夜改造，成功縮小體積與降低魔法石消耗，但也在旅店天花板留下切痕。
- **情緒基調**: 師徒喜劇感、魔法實戰教學、北方危機陰影與少年對魔導工程的興奮交錯。
- **章尾落點**: 艾爾諾老師允許少年帶著改造切割刀同行，並要求早餐後說明昨晚改過的陣列。
- **下章接點**: 早餐後的陣列說明、改造切割刀測試、或兩人繼續北上面對更嚴重的黑暗侵蝕事件。
```

---

## context/secrets-lockbox.md

<!-- file_path: backend/novel_db/novel_02_random/context/secrets-lockbox.md -->

> Secret handling: this section contains author/director-only unrevealed planning. Treat it as independent hidden knowledge, not public canon or character-known information.

```markdown
# Secrets Lockbox
> [!IMPORTANT]
> 這是作者與 AI 的保密工作檔，只記錄「尚未在正文正式揭露」的資訊。這些內容不能被角色無端知道、不能被旁白提前說破，也不應直接寫回公開 canon。

## 使用規則
- 只有在相關資訊已經正式寫進正文後，才可以把內容整理回 `bible/` 或其他 canon 檔案。
- 若某項設定只是作者暫定方向，請明確標示「暫定」或「可調整」。
- 若某條秘密會影響特定章節，請註明最早可揭露時機，避免 AI 提前爆雷。

## 隱藏真相
- 記錄目前不能讓讀者或角色直接得知的核心真相。

## 尚未揭露的人物秘密

### 貝奧爾德（beolrd-wanderer）— 龍神真身

**真實身分**
遊人貝奧爾德的真實身分是龍神，七大神祇之一，也是眾神之戰中少數未殞落、未主動離去的神明。他並非選擇留在大陸，而是在眾神之戰中遭到封印，至今無法離開。「貝奧爾德」是他的本名，也是龍神的真名；因為無人知道龍神本名，他以真名示人反而是最安全的隱藏方式。現以人形在大陸上隱居活動，真實樣貌與神格身分不為任何現世存在所知。

**封印的來由**
眾神之戰期間，龍神因與妖神、獸神原本關係良好，加之實力過於強大，在諸神眼中構成不確定的威脅——他若站在妖神獸神一側戰局將無法收拾；他若保持中立同樣是不可控的變數。封印並非因為他做了什麼，而是因為他「可能做什麼」。諸神以集體決議的形式施加封印，包含仍與他關係友好的神明。決議的表決過程、各神的立場與異議，均已成為無從查證的歷史。貝奧爾德本人知道是誰投了票，但相關神明如今或死或去，無從對質。

**封印的效果**
封印將貝奧爾德限制在大陸之上，無法離去，且持續壓制其神力。目前僅剩約兩成實力可自由運用；若試圖強行突破封印上限，封印會以某種方式加重或觸發反制機制（細節可後續設計）。人形是封印施加後的常態，龍形雖仍可短暫現出，但代價與風險極高，目前未在任何正文場景中發生。

**千年來的目標與那次抉擇**
在不觸發封印的前提下，找到解除封印的方法。千年的尋找中，他曾一度接近真正的答案——解封所需的力量來源是黑暗次元的本源。貝奧爾德拒絕了。他討厭眾神，但比起眾神，他更討厭黑暗次元；借用黑暗次元的力量解封，在他看來是比繼續被封印更不可接受的事。拒絕之後，他順手介入並協助大陸擋下了那次黑暗次元的入侵，沒有留名，沒有讓任何人知道是他做的。那次介入消耗了他當時相當大比例的可用神力，恢復花了很長時間。那次抉擇之後，解封的線索再度歸零。

**真實性格**
表面呈現的冷靜超然是長年自我克制的結果，不是天性。貝奧爾德的實際性格相當暴躁易怒，對愚蠢行為的容忍度極低，對被迫隱忍的處境有深層的慢性憤怒。千年的封印生涯沒有磨平這個部分，只是讓他練就了一套把情緒壓到表面以下的習慣。壓得住時看起來超然；壓不住時以極為節制但清晰的方式透出來，讓旁人感受到溫度驟降。他對自己被封印一事的情緒是複雜的：憤怒、不甘、以及某種不願承認的、針對投票封印他的舊友的悲哀。拒絕黑暗次元的那個決定，他從未後悔，但也從未覺得輕鬆。

**洩漏防線**
- 最早可揭露章節：待定
- 嚴禁提前說破：
  - 貝奧爾德即龍神
  - 封印的存在與效果
  - 封印由諸神集體施加（含友好神明）
  - 貝奧爾德的真實脾性與千年處境
  - 他曾接近解封答案、拒絕黑暗次元、並介入那次入侵

## 未來可擴張的系統
- 記錄能力、制度、歷史、陣營、代價機制或世界層級的後續擴張。
```

---

## outline/act1.md

<!-- file_path: backend/novel_db/novel_02_random/outline/act1.md -->

```markdown
﻿# Act 1 Notes

## 本幕已成立的核心功能

1. 主角的初始狀態與缺口。
2. 核心衝突如何闖入日常。
3. 這部作品承諾讀者的主要張力是什麼。

## 本幕目前的章節落點

- `ch001-chXXX`: 用 1 到 3 行描述這一幕目前已完成的內容。

## 本幕接下來適合承接的內容

- 下一個必須發生的事件
- 一個會改變關係或局勢的場面
- 一個能把故事往第二幕推進的決策

## 本幕暫不需要做的事

- 記錄目前刻意不揭露、不展開或不加速的部分，避免節奏失控。
```

---

## outline/master-outline.yaml

<!-- file_path: backend/novel_db/novel_02_random/outline/master-outline.yaml -->

```yaml
﻿canon_outline:
  project_status: planning
  current_chapter: planned
  current_endpoint: 尚未開始正文
  canon_scope:
    covered_chapters: []
    note: 僅記錄已寫成正文的 canon 與可直接接續的落點。
  chapter_beats:
    - chapter: ch001
      beat: 主角第一次面對核心衝突。
      outcome: 故事主前提成立。
  character_state_snapshot:
    protagonist: >
      記錄主角在目前 canon 中的最新狀態，方便跨章維持一致。
  near_term_next_steps:
    - 第一章要完成的劇情轉折
  continuity_flags:
    - 若後續需要統一稱呼、時間或規則，請在此標記。

speculative_long_arc:
  editable: true
  status: author_adjustable_projection
  note: 這一區是根據目前方向做的長線推演，非既定 canon，可自由修改。
  central_questions:
    - 主角最終要解決的核心問題是什麼？
  projected_arc:
    - phase: 第一階段 / 開局
      function: 建立角色、世界與主要衝突。
      likely_material:
        - 第一個重大轉折
        - 第一個需要付出代價的選擇
```

---

## bible/characters.yaml

<!-- file_path: backend/novel_db/novel_02_random/bible/characters.yaml -->

```yaml
characters:
  - id: mountain-hunter
    name: 山獵人
    aliases:
      - 獵人
      - 熊一般的大漢
    role: 短篇一主角 / 討伐者
    age: 未公開
    species: 未公開
    occupation: 接受懸賞的獵人或武裝討伐者
    appearance_public: >
      高挑壯碩，長髮與鬍鬚久未整理，遮住大半面容；身穿厚重熊皮獵裝，
      遠看像一頭熊，背負長弓與大太刀。
    appearance_current: >
      ch001 清晨獨自進入西邊群山，熊皮獵裝沾滿晨霧，完成討伐後拭淨刀身並離開湖畔。
    personality:
      - 冷漠寡言
      - 行動沉穩
      - 對危險近乎無動於衷
      - 戰鬥時乾淨精準
    speech_style:
      baseline: 極少說話，回答短促直接。
      under_stress: 正文尚未出現失控或明顯情緒波動。
      humor: 未出現。
    abilities:
      - 以獸骨追蹤山妖方位
      - 使用骨箭與長弓進行精準狙擊
      - 使用大太刀近身斬殺大型妖物
      - 山地行動能力極強，能在碎石、樹枝與巨型敵人身上快速換位
    current_status: >
      ch001 已斬殺佔據深山湖畔的山妖，未久留、未領受村民反應即轉身離開。
    progressions:
      - at_chapter: ch001
        status: 接受老村長最後懸賞，獨自進山。
      - at_chapter: ch001
        status: 在深山湖畔射瞎山妖左眼，破壞其腿部筋腱，最終斬首。
    goals:
      - 完成懸賞任務
      - 未公開的長期目標
    secrets:
      - 真實身分、過往經歷與力量來源尚未公開。
    first_appearance: ch001

  - id: old-village-chief
    name: 老村長
    aliases:
      - 村長
    role: 委託人 / 村莊代表
    age: 年老
    species: 人類或未公開
    occupation: 西邊群山下村莊的村長
    appearance_public: >
      年老而疲憊，曾有驢子代步；為了最後一次懸賞變賣一切，回村時只剩陪伴多年的拐杖。
    appearance_current: >
      ch001 清晨站在村口，目送山獵人進入山林。
    personality:
      - 為村莊存亡孤注一擲
      - 願意放下身段求助
      - 承受長期失敗與失去村民的壓力
    speech_style:
      baseline: 懇求、沉重，帶有求救意味。
      under_stress: 淚聲俱下。
      humor: 未出現。
    abilities:
      - 動員村莊殘餘資源發布懸賞
      - 前往城裡尋找可處理山妖的人
    current_status: >
      已將最後希望押在山獵人身上；ch001 中未描寫他得知討伐結果的反應。
    progressions:
      - at_chapter: ch001
        status: 變賣所有可用資源，帶回山獵人。
    goals:
      - 拯救村莊
      - 終結山妖對山產、靈泉與村民的威脅
    secrets: []
    first_appearance: ch001

  - id: mountain-demon
    name: 山妖
    aliases:
      - 佔據大山的妖物
    role: ch001 主要威脅
    age: 未公開
    species: 妖族或大型妖物
    occupation: 佔據深山與靈泉的掠食者
    appearance_public: >
      體型龐大，脊背高聳，肌肉如山石，渾身覆暗褐色硬甲，縫隙長出粗硬毛束；
      兩眼混濁發黃，飲水時能使湖面與碎石震動。
    appearance_current: >
      ch001 已於深山湖畔被山獵人斬首。
    personality:
      - 傲慢
      - 掠食性強
      - 首次受傷時憤怒且不可置信
    speech_style:
      baseline: 以嘶吼與嚎叫表現。
      under_stress: 震怒、慘嚎。
      humor: 無。
    abilities:
      - 巨大肉體力量
      - 硬甲防禦
      - 以山中走獸、靈泉與村民為食
      - 涎液具有高熱或腐蝕性，滴落地面會砸出冒熱氣凹洞
    current_status: >
      ch001 死亡，威脅暫時解除。
    progressions:
      - at_chapter: ch001
        status: 被骨箭射中左眼。
      - at_chapter: ch001
        status: 右腿筋腱被切斷後失衡跪地。
      - at_chapter: ch001
        status: 喉嚨弱點遭大太刀切開，頭顱落地。
    goals:
      - 佔據深山資源
      - 捕食山中生物與村民
    secrets:
      - 其來源、是否受黑暗次元或其他勢力影響尚未公開。
    first_appearance: ch001

  - id: beolrd-wanderer
    name: 貝奧爾德（Beolrd）
    aliases:
      - 遊人
      - 那個人
    role: 身分不明的江湖人物
    age: 外貌約四十餘歲，實際年齡不明
    species: 外觀為人類，實際未公開
    occupation: 無固定職業，長期遊歷各地
    appearance_public: >
      人形外觀年約四十出頭，身形高挑，氣質沉靜而難以接近。面容輪廓深刻，
      眼神帶著看過太多事情之後才有的疏離感，不像那個年紀的人應有的眼神。
      身上總是穿著一套樣式古樸的大衣，剪裁已是很久以前的風格，但保養極為仔細，
      看不出任何磨損痕跡。長年活動於北部，穿著風格與北方氣候相符。
      身邊經常跟隨一名僕從，兩人關係不像主僕也不像朋友，外人很難準確描述。
      說話時偶爾會停頓一拍，像在確認某句話值不值得說出口。
    appearance_current: 尚未登場。
    personality:
      - 給人第一印象是冷靜超然，遇到麻煩事習慣置身事外
      - 說話惜字如金，不主動介入他人事務，不輕易表態
      - 熟悉之後偶爾露出一點不耐煩，但收得很快，像長年訓練出來的自我克制
    speech_style:
      baseline: 惜字如金，說話前偶爾停頓一拍，直接且簡短。
      under_stress: 尚未登場，未知。
      humor: 未出現。
    abilities:
      - 實際能力未公開
    current_status: 尚未登場，長期遊歷各地，活動範圍以北部為主。
    progressions: []
    goals:
      - 長期目標未公開
    secrets:
      - 真實身分、實際年齡與能力來源均未公開。
    first_appearance: 待定

  - id: aella-flair
    name: 艾拉·芙萊爾（Aella Flair）
    aliases:
      - 芙萊爾
      - 空騎的小妹
    role: 空騎團特別調查組副隊長
    age: 24
    species: 人類
    occupation: 空騎團正式騎士 / 特別調查組副隊長
    appearance_public: >
      身形輕巧而比例勻稱，臉部線條柔和，笑起來帶坦率感，讓人快速卸下防備。
      眼睛大而清亮，情緒藏不住。頭髮任務時束緊，私下隨意散著或鬆綁一半。
      空騎制服穿在她身上總帶幾分「還在成長」的氣息，比制服本身更年輕一點。
    appearance_current: 尚未登場。
    personality:
      - 天真且真誠，說話直接，不拐彎
      - 熱情，對任務認真，對組員上心，好奇心停不下來
      - 努力踏實，被信任就想回應信任，不帶攻擊性
      - 偶爾因衝動闖禍，事後真心道歉不找藉口
    speech_style:
      baseline: 直接說出所想，不多也不少；語氣開朗坦率。
      under_stress: 尚未揭露。
      humor: 天然坦率，自己不一定察覺到有趣。
    abilities:
      - 飛行器操控：天賦型駕駛，空間感知與手感極為敏銳，是空騎團公認頂尖駕駛之一，擅長高速機動與複雜地形應對
      - 偵查與追蹤：觀察力細膩，現場快速抓住關鍵細節，直覺判斷準確；現場應變快，不擅長長線佈局
      - 親和力：讓陌生人放鬆，消息來源願意多說，目擊者願意多描述
    current_status: >
      空騎團特別調查組最年輕副隊長，在組內形成自然的「妹妹」定位。
      前輩對她寵而不縱，任務標準不因年輕降低；她與所有組員處得來，是組內難得的潤滑存在。尚未登場。
    progressions:
      - at_chapter: world-bible
        status: 有記錄以來通過空騎團外部招募考核年齡最小的正式騎士，亦是特別調查組最年輕的副隊長。
    goals:
      - 做好任務，不辜負空騎團的信任
      - 長線動機尚未揭露
    secrets:
      - 招募前的詳細經歷未公開。
      - 真正促使她進入特別調查組的原因未公開。
      - 她對空騎團中立立場的個人看法未公開。
    first_appearance: 待定

  - id: aethlandir-house
    name: 艾瑟蘭迪爾家族
    aliases:
      - House Aethlandir
      - 舊帝國的觀星者
    role: 世界級政治家族 / 艾瑟蘭帝國掌權者
    age: 家族歷史萬年以上
    species: 精靈
    occupation: 政治、經濟與魔導科技上層架構掌控者
    appearance_public: >
      作為家族與勢力存在，並非單一角色。外界認知其制度完善、人才配置精準、政治判斷冷靜。
    appearance_current: >
      仍掌控帝國政治、經濟與科技領域，但軍事話語權正因人類崛起而逐漸流失。
    personality:
      - 理性
      - 制度導向
      - 將歷史視為政治判斷而非道德辯解
      - 重視情報與天象研究傳承
    speech_style:
      baseline: 家族敘事偏冷靜、史觀化、重視結果。
      under_stress: 可能轉向路線分歧與權力防衛。
      humor: 未定。
    abilities:
      - 萬年級家族教育與人才培育制度
      - 政治資訊收集與顧問傳統
      - 貴族院與知識機構話語權
      - 魔導科技產業上層架構掌控
    current_status: >
      面對人類平民院席次上升與軍事力量擴張，家族內部出現強硬阻撓與重新定位兩種方向。
    progressions:
      - at_chapter: world-bible
        status: 由古精靈帝國占星使傳統延續而來。
      - at_chapter: world-bible
        status: 眾神之戰後離開森林，主動與人類、矮人建立聯盟，成為艾瑟蘭帝國基石。
    goals:
      - 維持家族在帝國中的主導地位
      - 找出人類崛起後的新權力位置
    secrets:
      - 家族內部路線分歧尚可作為後續劇情推進點。
    first_appearance: world-bible

  - id: reka
    name: 芮卡（Reka）
    aliases: []
    role: A 級冒險家（傭兵）
    age: 28（出道至今約十年）
    species: 獸人（人狼混血，人族特徵 90%、狼族特徵 10%）
    occupation: 於第二大陸活動的獨行或臨時組隊傭兵／冒險家
    appearance_public: >
      皮膚黝黑，身材壯碩，肌肉線條因長年近戰訓練而分明有力，在同齡女性中體格突出。
      獸人血統在外觀上的體現極低調，頭髮帶有狼族特有的粗硬質感與略帶灰白的自然色澤，
      尾巴保留狼尾形態，其餘外觀與人族無異。沙漠出身讓她對酷熱環境有天然適應力，
      著裝偏向輕便，不習慣厚重防具。
    appearance_current: 尚未登場。
    personality:
      - 對喜歡的人熱情直接，親近時有強烈保護欲與佔有感
      - 對不喜歡的人冷淡兇狠，不掩飾態度
      - 務實乾脆，不拖泥帶水
      - 任務上判斷快、執行直接，但不擅長外交或談判
      - 經歷豐富卻沒有變得圓滑，反而更清楚自己要什麼
    speech_style:
      baseline: 直接、少廢話，不喜歡迂迴試探。
      under_stress: 傾向更強硬、更具壓迫感。
      humor: 未明確呈現，整體風格偏直來直往。
    abilities:
      - 雙手大劍戰鬥：以大型雙手劍進行高壓制力與高破壞力的近戰
      - 腿技：在近身纏鬥與破防上極具威脅，實戰中常比劍更難防
      - 體能與耐力：自幼於高強度環境成長，長時間戰鬥消耗低於同級對手
      - 酷熱環境適應：對沙漠與高溫地帶有天然適應力
    current_status: >
      第二大陸 A 級冒險家，依任務性質選擇單獨行動或臨時組隊，沒有固定搭檔或所屬組織。尚未登場。
    progressions:
      - at_chapter: world-bible
        status: 出身第二大陸南方聯邦沙漠民族，十六歲時已是族中最強大的戰士之一。
      - at_chapter: world-bible
        status: 十八歲離開族群，開始在第二大陸各地承接傭兵任務，至今約十年。
      - at_chapter: world-bible
        status: 以大量實戰累積成 A 級冒險家。
    goals:
      - 以任務為當前主要驅動
      - 長線目標尚未揭露
    secrets:
      - 離開族群的真正原因尚未公開。
    first_appearance: 待定

  - id: lulu
    name: 露露（Lulu）
    aliases: []
    role: 帝國第一軍團副團長
    age: 28
    species: 人類
    occupation: 帝國第一軍團副團長
    origin: 未公開
    base: 第一大陸，艾瑟蘭帝國
    appearance_public: >
      五官端正銳利，美貌是事實，但她的氣場讓人在意識到她的臉之前，先感受到那股壓迫感。
      身形挺拔結實，是長年實戰而非刻意錘鍊出的體態，動作習慣性地節省，沒有任何多餘的姿態。
      戰鬥時髮束緊，私下也少有鬆散，像是把「不讓人看見鬆懈」這件事練成了習慣。
      衣著配合軍職，不著意打扮，但打扮的時候不輸任何人。腰間懸掛的聖劍外觀鑄造語言遠古，
      劍身刻有不屬於任何已知流派的紋路，幾乎沒有人敢多問。
    appearance_current: 尚未登場。
    personality:
      - 嚴格、距離感強、指令精準不廢言
      - 副團長的氣場不是表演，是用無數次不退讓堆積出來的
      - 不討好任何人，不在軍務以外主動製造話題
      - 對上級不卑不亢，對下屬清楚有據
      - 面對政治壓力習慣以沉默代替表態
      - 對下屬有強烈責任感，傷亡是她私下最難消化的事
      - 不是沒有溫度，而是不認為溫度應該在這個位置上顯露
    speech_style:
      baseline: 嚴格、精準、少廢言，軍務場合保持距離感。
      under_stress: 更沉默，傾向以最短指令維持局勢。
      humor: 未明確呈現。
    abilities:
      - 魔法劍術：以魔法能量強化自身與劍身為核心，偏向精準集中而非大範圍爆發，效率高、消耗低
      - 近距離戰鬥：攻速、穿透力與連擊密度遠超同等物理戰力，近距離戰場幾乎沒有破綻
      - 聖劍共鳴：聖劍在她手中會出現普通魔導武器無法達到的效果，但觸發條件與機制尚未完全掌握
      - 戰場統率：能在資訊不完整的情況下做出最低損傷的選擇，實質影響力長期高於名義職位
    sacred_sword: >
      遠古遺物，外觀鑄造語言比艾瑟蘭帝國三族聯盟更為古老，來源無從考證，任何已知文獻均無對應記載。
      她不是透過神殿授予或政治認可取得聖劍，具體的取得過程是她的秘密。聖劍與她的魔法強化系統之間存在某種共鳴，
      她無法完全解釋其本質，也從未找到任何線索可以解答。她選擇對此保持沉默，不是因為不在意，
      而是因為沒有找到值得說的對象，也沒有找到值得信任的答案。
    current_status: >
      帝國第一軍團副團長，具體長線目標尚未揭露。尚未登場。
    progressions:
      - at_chapter: world-bible
        status: 以帝國第一軍團副團長身分加入正式角色設定。
    goals:
      - 以職責為主要驅動
      - 具體長線目標尚未揭露
    secrets:
      - 全名與家族背景尚未公開。
      - 聖劍的真正來源與她取得它的完整經過。
      - 聖劍共鳴超出控制的觸發條件與她的應對方式。
      - 她對帝國當前政治局勢（精靈貴族院 vs 人類平民院崛起）的個人立場。
      - 她在第一軍團的實質影響力是否已超過團長。
    first_appearance: 待定

  - id: elno-honorary-mage
    name: 艾爾諾老師
    aliases:
      - 艾爾諾
      - 老師
      - 帝國宮廷榮譽法師
    role: 少年的魔法導師 / 帝國宮廷榮譽法師
    age: 外貌年輕，具體年齡未公開
    species: 未公開
    occupation: 帝國宮廷榮譽法師，旅行中指導少年
    appearance_public: >
      黑色長髮，旅行時穿深色外衣與短斗篷，腰間掛細長魔杖。外觀不像傳統宮廷法師，
      行動後常保持衣著乾淨、袖口無焦痕，給旁人一種難以判斷實力深淺的壓迫感。
    appearance_current: >
      ch004-1 由帝都一路北上，沿途處理黑暗能量侵蝕事件；在黑石城落腳，默許少年帶走並改造報廢切割刀。
    personality:
      - 冷靜、精準，對危險判斷極快
      - 教學嚴格，會用現場錯誤逼學生記住代價
      - 表面毒舌，實際會觀察並保留學生真正有價值的才能
      - 行事神秘，掌握疑似非標準屬性的星光系魔法
    speech_style:
      baseline: 簡短直接，常以一句話切中學生錯誤。
      under_stress: 尚未出現明顯失控，面對腐化魔狼時仍保持平靜。
      humor: 乾冷毒舌，常用成績或事實壓住少年辯解。
    abilities:
      - 宮廷級魔法實力，能獨自解決被黑暗能量侵蝕的森林。
      - 無咒語、無魔杖施放未知星光魔法，能將腐化魔狼與黑暗煙霧直接抹除。
      - 深入理解黑暗能量侵蝕生物的二次驅動迴路與戰鬥風險。
      - 具備高階魔導陣列判讀能力，能快速看出少年改造切割刀的導管與風壓陣列變更。
    current_status: >
      ch004-1 與少年抵達黑石城後準備繼續北上；要求少年早餐後說明改造陣列，
      代表她沒有否定少年的魔導工程才能。
    progressions:
      - at_chapter: ch004-1
        status: 在北上道路旁拯救受黑暗侵蝕威脅的村莊，收取公會委託費。
      - at_chapter: ch004-1
        status: 借魔狼戰鬥指出少年只破壞大腦、未處理黑暗能量迴路的致命誤判。
      - at_chapter: ch004-1
        status: 在黑石城發現少年徹夜改造報廢切割刀後，雖責罵仍允許他帶著成果同行。
    goals:
      - 帶少年北上並完成尚未公開的行程目的。
      - 訓練少年正確理解黑暗能量與實戰魔法。
      - 觀察少年在魔導工程上的特殊才能。
    secrets:
      - 星光魔法的屬性、本質與來源尚未公開。
      - 她選擇帶少年離開帝都北上的真正原因尚未公開。
    first_appearance: ch004-1

  - id: unnamed-mage-apprentice
    name: 少年
    aliases:
      - 弟子
      - 艾爾諾老師的學生
    role: ch004-1 視角角色 / 魔法學徒
    age: 少年，具體年齡未公開
    species: 人類或未公開
    occupation: 艾爾諾老師的魔法弟子
    appearance_public: >
      正文尚未詳細描寫外貌。從行動與反應看仍帶少年感，會努力維持合格弟子的姿態，
      但面對魔導機械時容易露出壓不住的興奮。
    appearance_current: >
      ch004-1 跟隨艾爾諾老師自帝都北上；在黑石城徹夜改造礦業工會商店報廢的手持切割刀。
    personality:
      - 崇拜並敬畏艾爾諾老師，常在心中放大她的神秘與強大
      - 魔法基礎不差，能同時精準定位二十三隻魔狼
      - 對魔導機械有強烈熱情，看到礦業工具會迅速投入結構分析
      - 容易被興趣帶跑，但不是單純貪玩，具備改良與實作能力
    speech_style:
      baseline: 對老師恭敬，遇到技術話題時語速與興奮度上升。
      under_stress: 會立刻認錯或補充辯解，尤其面對老師時。
      humor: 內心吐槽較多，外在常被老師一句話壓回去。
    abilities:
      - 雷霆之鏈：能以咒文與魔杖同時擊中二十三隻魔狼頭顱。
      - 魔法控制：能進行多目標精準定位，但對黑暗侵蝕生物理解不足。
      - 魔導工程直覺：能看懂水系魔晶、風壓陣列、導流與壓縮結構。
      - 臨時改造能力：缺乏標準工坊與完整零件時，仍能將報廢切割刀縮小並降低魔法石消耗。
    current_status: >
      ch004-1 已完成粗糙但可運作的改造切割刀，準備帶著它繼續與艾爾諾老師同行；
      仍需向老師解釋陣列設計與天花板切痕事故。
    progressions:
      - at_chapter: ch004-1
        status: 以雷霆之鏈擊倒二十三隻魔狼，卻因忽略黑暗能量二次驅動而被老師糾正。
      - at_chapter: ch004-1
        status: 在黑石城礦業工會商店研究手持切割刀、運輸機等魔導機械。
      - at_chapter: ch004-1
        status: 取得報廢切割刀並徹夜改造，成功縮小體積與降低消耗，但穩定性尚未完整測試。
    goals:
      - 成為足以讓艾爾諾老師認可的魔法師。
      - 持續研究魔導工程，將魔法轉化為可被生活與戰鬥使用的工具。
      - 補足黑魔法緒論與黑暗侵蝕生物知識。
    secrets:
      - 少年姓名、家世與離開帝都的原因尚未公開。
      - 他對魔導工程的才能是否與某種身分或背景相關尚未公開。
    first_appearance: ch004-1

  - id: blackstone-dwarf-shopkeeper
    name: 黑石城矮人老闆
    aliases:
      - 礦業工會商店老闆
      - 鬍子編成三股的矮人
    role: 黑石城礦業工會商店店主
    age: 未公開
    species: 矮人
    occupation: 礦業工會商店經營者
    appearance_public: >
      鬍子編成三股，站在櫃檯後方持帳本，態度務實而不失寬容。
      正文未詳細描寫體格與衣著，應維持矮人工匠或商店主人的實用形象。
    appearance_current: >
      ch004-1 關店前提醒少年若不買東西就該離開，後來把報廢切割刀送給少年。
    personality:
      - 務實
      - 對非採購客人的長時間旁觀有耐心上限
      - 不把無維修價值的報廢品看得太重
    speech_style:
      baseline: 直接、簡短，以交易與店務為中心。
      under_stress: 未出現。
      humor: 帶有矮人式務實揶揄。
    abilities:
      - 熟悉礦業工具買賣與報廢判斷。
      - 能辨認少年並非礦工或工會採購員。
    current_status: >
      ch004-1 已將一具報廢手持切割刀送給少年，可能不知道該物件會被改造成可用原型。
    progressions:
      - at_chapter: ch004-1
        status: 在黑石城礦業工會商店短暫登場，送出報廢切割刀。
    goals:
      - 正常經營商店並準時關門。
    secrets: []
    first_appearance: ch004-1
```

---

## bible/demonology.yaml

<!-- file_path: backend/novel_db/novel_02_random/bible/demonology.yaml -->

```yaml
demonology:
  id: demonkind
  name: 魔族
  category: umbrella_species
  source_sections:
    - worldbuilding.md#魔族體系與階級
    - temp/demon_faction.md
  summary: >
    魔族是幾個不同種類物種的統稱，並非單一種族。依起源分為惡魔類、魔化類、原生類。
    三大類之間地位有別，惡魔類最高，原生類居中，魔化類最低。
  relationship_to_world:
    default_relation: 與帝國及大陸其他種族多半敵對
    exceptions: 僅極少數特例不主動與現界種族為敵
  hierarchy:
    formal_leader:
      title: 魔王
      required_origin: demon_class
      role: 魔族政治正統的象徵延續
      practical_authority: 有限
    historical_unifier:
      title: 魔帝
      status: 已被殺
      consequence: 統一魔族政權分裂，至今未再統一。
    class_order:
      - demon_class
      - native_class
      - corrupted_class
    notes:
      - 惡魔類各分支與派系多半各自為政。
      - 部分魔化類與原生類個體會脫離惡魔類控制，自行形成地位較低的聚落。

branches:
  - id: demon_class
    name: 惡魔類
    rank: highest
    origin: 黑暗次元原生物種
    source_section: worldbuilding.md#惡魔類
    summary: >
      黑暗次元的原生物種，魔族正統，地位最高。可使用大陸魔法體系或更純粹的黑暗能量，
      個體能力普遍強大。
    political_status:
      - 魔族正統
      - 魔王必須出身此類
      - 多數分支與派系各自為政
    common_traits:
      physical:
        - 個體普遍強大
      magical:
        - 可使用大陸魔法體系
        - 可使用純粹黑暗能量
      social:
        - 統治地位最高
    subtypes:
      - demon
      - ancient_demon
      - nightmare_demon
      - flame_demon
      - curse_demon
      - giant_demon
      - sky_demon
      - ice_demon

  - id: corrupted_class
    name: 魔化類
    rank: lowest
    origin: 大陸物種遭黑暗能量侵蝕心智與肉體後異變
    source_section: worldbuilding.md#魔化類
    summary: >
      由黑暗能量侵蝕大陸物種的心智與肉體而成，腐化過程單向且不可逆。
      地位極低，多為各惡魔派系手下數量最龐大的基層戰力。
    transformation_rules:
      reversibility: irreversible
      direction: 單向腐化
      cause: 黑暗能量侵蝕
    common_traits:
      physical:
        - 肉體異變
      mental:
        - 心智受侵蝕
      social:
        - 地位極低
        - 多為砲灰或基層戰力
    subtypes:
      - corrupted_human
      - corrupted_beast
      - corrupted_plant
      - corrupted_yao
      - corrupted_beastfolk

  - id: native_class
    name: 原生類
    rank: middle
    origin: 黑暗次元能量與大陸生命能量融合生成的新物種
    source_section: worldbuilding.md#原生類
    summary: >
      黑暗次元能量與大陸生命能量融合生成的全新物種，既非腐化體，也非原生惡魔。
      構造通常較簡單，地位低，多為基層戰力或獨立聚落底層成員。
    common_traits:
      physical:
        - 構造通常較簡單
      magical:
        - 由黑暗次元能量與大陸生命能量融合生成
      social:
        - 地位低
        - 多為基層戰力或獨立聚落底層成員
    subtypes:
      - slime
      - tentacle
      - insectoid
      - crystal

subtypes:
  - id: demon
    name: 惡魔
    branch: demon_class
    status: 正統核心
    source_section: worldbuilding.md#惡魔類
    summary: >
      惡魔類中的正統核心，類人外形，頭生角，成年平均體高約 2.5 公尺。
      數量最少但能力最強、地位最高，是惡魔類中的支配階層。
    traits:
      physical:
        - 類人外形
        - 頭上大多有角
        - 成年平均體高約 2.5 公尺
      magical:
        - 擅長攻擊型大陸魔法
        - 攻擊常附帶黑暗能量
        - 幾乎全員具備黑暗能量自癒能力
      social:
        - 數量最少
        - 統治地位最高
    roles:
      - 支配階層
      - 政治正統核心

  - id: ancient_demon
    name: 古魔
    branch: demon_class
    status: 古老原生物種
    source_section: worldbuilding.md#惡魔類
    summary: >
      最古老的黑暗次元原生物種，形體多半不可名狀，不走大陸魔法體系，
      偏重強悍肉身與純黑暗能量衝擊。
    traits:
      physical:
        - 形狀奇特且不可名狀
        - 沒有統一外形規律
        - 體魄強壯
      magical:
        - 不使用大陸能量體系
        - 可直接使用純粹黑暗能量衝擊
      mental:
        - 多半沒有群體觀念
        - 智商低下
        - 殺戮心與排他性極強
    roles:
      - 戰獸
      - 守衛
      - 打手
    social_notes:
      - 因難以管控，常被放逐、排擠或畏懼。

  - id: nightmare_demon
    name: 夢魔
    branch: demon_class
    status: 精神操控者
    source_section: worldbuilding.md#惡魔類
    summary: >
      介於實體與虛體之間的類人種，成年個體背生 2 至 8 隻觸手。
      能力以夢境操控、催眠、幻覺、精神連結與強制控制為主。
    traits:
      physical:
        - 多為幽影型態
        - 介於實體與虛體之間
        - 外形類人
        - 成年個體背部有 2 至 8 隻觸手
      magical:
        - 夢境操控
        - 催眠
        - 幻覺
        - 虛像
        - 精神連結
        - 強制控制
      social:
        - 觸手數量越多，階級越高
    rank_markers:
      - 背部觸手數量
    roles:
      - 刺客
      - 控場者

  - id: flame_demon
    name: 炎魔
    branch: demon_class
    status: 菁英中堅
    source_section: worldbuilding.md#惡魔類
    summary: >
      體型巨大，皮膚通紅，頭生巨角，成年體高約 4 至 5 公尺。
      全員不懼火焰，擅長火系魔法，多居火山地帶。
    traits:
      physical:
        - 體型巨大
        - 皮膚通紅
        - 頭生巨角
        - 成年體高約 4 至 5 公尺
      magical:
        - 不懼火焰
        - 擅長火系魔法
      habitat:
        - 火山地帶
    roles:
      - 菁英中堅力量

  - id: curse_demon
    name: 咒魔
    branch: demon_class
    status: 非自然生成分支
    source_section: worldbuilding.md#惡魔類
    summary: >
      惡魔類中唯一非自然生成的分支，由大型戰場的亡魂怨念聚集而生。
      擅長詛咒、腐化、侵蝕、下蠱與死靈術，通常擔任軍師。
    traits:
      physical:
        - 身形細長
        - 外形類人但比例極細長
      magical:
        - 詛咒
        - 腐化
        - 侵蝕
        - 下蠱
        - 死靈術
      origin:
        - 大型戰場的亡魂怨念聚集而生
      mental:
        - 天生具有靈智
    roles:
      - 軍師

  - id: giant_demon
    name: 巨魔
    branch: demon_class
    status: 重型戰力
    source_section: worldbuilding.md#惡魔類
    summary: >
      惡魔類中體型最龐大，成年平均體高約 7 至 10 公尺。
      智力低，不使用魔法，但肉體戰力與防禦極高。
    traits:
      physical:
        - 體型為惡魔類中最龐大
        - 成年平均體高約 7 至 10 公尺
        - 體技極強
        - 防禦極高
      magical:
        - 不會使用魔法
      mental:
        - 智商極低
    roles:
      - 戰爭前鋒
      - 戰將

  - id: sky_demon
    name: 天魔
    branch: demon_class
    status: 空戰骨幹
    source_section: worldbuilding.md#惡魔類
    summary: >
      類鳥形、蝙蝠形或人形，背生翅膀。修行大陸法系但更偏重物理戰，
      是惡魔類的重要突擊與空戰骨幹。
    traits:
      physical:
        - 類鳥形、蝙蝠形或人形
        - 背生翅膀
      magical:
        - 修行大陸法系
      combat:
        - 以物理攻擊為主
    roles:
      - 突擊戰力
      - 空戰骨幹
      - 菁英中堅力量

  - id: ice_demon
    name: 冰魔
    branch: demon_class
    status: 施法者
    source_section: worldbuilding.md#惡魔類
    summary: >
      皮膚呈藍色或紫色，體型與惡魔相近。使用冰系魔法，魔法造詣強於防禦，
      數量少於炎魔，常擔任施法者角色。
    traits:
      physical:
        - 皮膚呈藍色或紫色
        - 體型與惡魔相近
      magical:
        - 使用冰系魔法
        - 魔法造詣強
      weaknesses:
        - 防禦較弱
      social:
        - 數量比炎魔少
    roles:
      - 魔法師
      - 施法者

  - id: corrupted_human
    name: 腐人類
    branch: corrupted_class
    source_section: worldbuilding.md#魔化類
    summary: >
      人類或三族個體遭黑暗能量侵蝕後的異變結果。
      外形退化為近似哥布林或地精的矮小邪惡生物。
    source_species:
      - human
      - elf
      - dwarf
    traits:
      physical:
        - 矮小
        - 外形近似哥布林或地精
      combat:
        - 以物理攻擊為主
        - 個體戰力低
      social:
        - 數量極其龐大
    roles:
      - 砲灰

  - id: corrupted_beast
    name: 腐獸類
    branch: corrupted_class
    source_section: worldbuilding.md#魔化類
    summary: >
      一般走獸與飛禽遭侵蝕後形成，獸性與攻擊本能被極端放大。
      分布最廣，幾乎遍及次元壁裂縫周邊生態區。
    source_species:
      - animals
    traits:
      physical:
        - 體型膨脹
        - 骨骼外露或增生
        - 皮毛焦黑或帶黑暗能量光澤
      mental:
        - 動物本能仍存
        - 完全喪失理性
      social:
        - 數量最多
        - 分布最廣
    habitat:
      - 次元壁裂縫附近生態區

  - id: corrupted_plant
    name: 腐植類
    branch: corrupted_class
    source_section: worldbuilding.md#魔化類
    summary: >
      植物或自然地形長期受黑暗能量滲透後異變成具攻擊性的生命體。
      通常固著或移動緩慢，但污染範圍廣且難以徹底清除。
    source_species:
      - plants
      - natural_terrain
    traits:
      physical:
        - 通常固著或移動緩慢
      mental:
        - 沒有心智
      magical:
        - 黑暗能量滲透自然物質後生成
      ecological:
        - 蔓延範圍廣
        - 難以徹底清除
    habitat:
      - 黑暗次元裂縫附近污染地帶

  - id: corrupted_yao
    name: 妖魔
    branch: corrupted_class
    source_section: worldbuilding.md#魔化類
    summary: >
      修煉中的妖族遭黑暗能量侵蝕後的異變結果。
      保留殘破自我意識卻全面偏向暴力與破壞，是魔化類中智力最高也最危險的一支。
    source_species:
      - yaozu
    traits:
      physical:
        - 外形保留妖族原貌但帶有黑暗能量痕跡
      mental:
        - 保留殘破自我意識
        - 偏向暴力與破壞
        - 魔化類中智力最高
      danger:
        - 魔化類中最危險的一支

  - id: corrupted_beastfolk
    name: 魔獸
    branch: corrupted_class
    source_section: worldbuilding.md#魔化類
    summary: >
      獸族遭黑暗能量侵蝕後形成的異變體；兼具殘存智慧與失控獸性。
      比腐獸類更有組織、比妖魔更難溝通。
    source_species:
      - beastfolk
    traits:
      mental:
        - 殘存智慧與失控獸性並存
        - 少數個體保留破碎記憶
        - 不穩定
      social:
        - 比腐獸類更具組織性
        - 比妖魔更難溝通

  - id: slime
    name: 史萊姆類
    branch: native_class
    source_section: worldbuilding.md#原生類
    summary: >
      黑暗能量凝聚成的半液態生命體，無固定形狀。
      可吞噬並腐蝕接觸物質，以黑暗能量持續侵蝕周遭環境。
    traits:
      physical:
        - 半液態生命體
        - 無固定形狀
      magical:
        - 持續以黑暗能量侵蝕周遭環境
      combat:
        - 吞噬
        - 腐蝕接觸物質

  - id: tentacle
    name: 觸手類
    branch: native_class
    source_section: worldbuilding.md#原生類
    summary: >
      多觸手構造生命體，可能固著也可能緩慢移動。
      觸手帶有強烈腐蝕效果，是主要攻擊與捕食手段。
    traits:
      physical:
        - 多觸手構造
        - 可能固著或緩慢移動
      combat:
        - 觸手腐蝕
        - 捕食

  - id: insectoid
    name: 蟲類
    branch: native_class
    source_section: worldbuilding.md#原生類
    summary: >
      小型群聚生命體，單體戰力弱，但以大量繁殖與集體行動構成威脅。
      部分個體具寄生其他生物的能力。
    traits:
      physical:
        - 小型群聚生命體
      combat:
        - 大量繁殖
        - 集體行動
        - 部分個體可寄生其他生物
      weaknesses:
        - 單體戰力弱

  - id: crystal
    name: 晶體類
    branch: native_class
    source_section: worldbuilding.md#原生類
    summary: >
      由黑暗能量結晶化形成，個體構造簡單，但可彼此組合成更複雜的晶體魔像。
    traits:
      physical:
        - 黑暗能量結晶化生命體
        - 個體構造簡單
      magical:
        - 可彼此組合成更複雜的晶體魔像
      scaling_rules:
        - 晶體魔像的規模與複雜度取決於參與組合的晶體數量與排列方式。
```

---

## bible/inner_setting.yaml

<!-- file_path: backend/novel_db/novel_02_random/bible/inner_setting.yaml -->

```yaml
inner_settings:

  - id: aella-flair
    r18_traits:
      - 敏感青澀：年輕且未經人事，身體極度敏感，容易在強制或誘騙下快速墮落。
      - 羞恥反差：平時坦率開朗，在床笫間被迫展現淫態時會有強烈的羞恥哭泣與抗拒，但身體卻很誠實。

  - id: reka
    r18_traits:
      - 獸人發情期：保留了狼族的發情期特性，一旦發作便會陷入渴望交配的狂熱中，需索無度。
      - 強勢騎乘：在性愛中喜歡占據主導地位，熱愛狂野的騎乘位與直接的肉體碰撞。
      - 戰敗屈服：若在戰鬥中被徹底擊敗，會遵從獸人慕強本能，心甘情願成為強者的性奴隸。
```

---

## bible/location.yaml

<!-- file_path: backend/novel_db/novel_02_random/bible/location.yaml -->

```yaml
locations:
  - id: starborne-flat-world
    name: 漂浮於無盡星空之上的平面大陸
    type: 世界 / 平面大陸
    region: 宇宙星空之中
    first_appearance: world-bible
    summary: >
      由創世眾神以星空物質凝聚而成的巨大平面島嶼。現今由兩塊主大陸與中間島群構成，
      大陸邊緣有瀑布般的土石傾入虛空。
    atmosphere:
      - 從宇宙視角看如黑暗海洋中的發光陸地
      - 星光、魔法泉源與古老神話感並存
    narrative_functions:
      - 世界總舞台
      - 創世神話與眾神之戰遺產
      - 次元壁危機的承載空間
    access_constraints:
      - 非一般角色可離開或從外部觀測的尺度
      - 邊緣接續虛空，具高度危險性
    linked_people_or_factions:
      - 創世眾神
      - 七大種族
      - 黑暗次元
    continuity_notes:
      - 世界不是球體，而是漂浮於星空中的巨大平面大陸。

  - id: first-continent-aethlan-empire
    name: 第一大陸 / 艾瑟蘭帝國
    type: 主大陸 / 君主立憲帝國
    region: 兩大陸之一
    first_appearance: world-bible
    summary: >
      以中國地理為原型，中央為廣袤平原丘陵與大陸型氣候，三面臨海。
      由人類、精靈、矮人的三族聯盟共同建立。
    atmosphere:
      - 魔導科技昌明
      - 貴族院與平民院政治角力明顯
      - 邊境和平表象下有魔族侵擾
    narrative_functions:
      - 三族聯盟政治主舞台
      - 人類崛起與精靈主導權衝突
      - 北境魔族侵擾與次元壁滲透線
    access_constraints:
      - 北方高原與南方叢林為半自治少數民族聚居地
      - 北方深處仍有大片未探索土地
      - 邊境魔族勢力多為敵對態勢
    linked_people_or_factions:
      - 艾瑟蘭迪爾家族
      - 三族聯盟
      - 貴族院
      - 平民院
      - 聖殿騎士團
    continuity_notes:
      - 精靈長期掌握貴族院與知識話語權；人類在平民院與軍事上快速上升；矮人掌握工業命脈但政治分裂。

  - id: second-continent-great-league
    name: 第二大陸 / 大聯盟
    type: 主大陸 / 鬆散政治聯盟
    region: 兩大陸之一
    first_appearance: world-bible
    summary: >
      比第一大陸更大且地形複雜，多山、水系縱橫，中央有廣袤沙漠。
      各成員國自願遵守共同公約，但無強制執行機構與統一軍隊。
    atmosphere:
      - 多元但缺乏共同認同
      - 北方純種族國家較多
      - 南方複合勢力與種族混居較常見
    narrative_functions:
      - 多國外交、冒險者文化與種族政治舞台
      - 妖族帝國、人獸王國、多元聯邦等勢力互動區
    access_constraints:
      - 聯盟規範靠自願遵守，跨國協調困難
      - 大國制衡維持現狀，衝突風險潛伏
    linked_people_or_factions:
      - 熊族王國
      - 虎族王國
      - 狐族王國
      - 妖族帝國
      - 人獸王國
      - 多元聯邦
    continuity_notes:
      - 越往北方越多純種族國家；南方以種族混居複合勢力為主。

  - id: middle-sea-islands
    name: 中間海域與島群
    type: 危險海域 / 島群 / 無政府地帶
    region: 兩大陸之間
    first_appearance: world-bible
    summary: >
      兩大陸之間的危險地帶，部分區域是眾神之戰遺留的次元壁薄弱點。
      島群各自為政，海盜文化主導。
    atmosphere:
      - 危機四伏
      - 航路知識即權力
      - 亡命者、流亡者、冒險者混雜
    narrative_functions:
      - 跨陸交通阻礙
      - 海盜與航路控制權衝突
      - 次元異常事件發生區
    access_constraints:
      - 只有極少數已知特定航路可安全通行
      - 海盜勢力可能徵收過路費或直接劫掠
      - 部分區域有空間異常與次元壁薄弱風險
    linked_people_or_factions:
      - 海盜勢力
      - 航海公會
      - 空騎團
    continuity_notes:
      - 船運是跨陸交通主流；飛船速度快但昂貴；空間傳送陣最快也最昂貴，且節點稀少。

  - id: sun-solar-palace
    name: 日宮（太陽神之殿）
    type: 神殿 / 天體
    region: 天空高空，無法接近
    first_appearance: world-bible
    summary: >
      太陽神以神力鑄造的神殿，承載於太陽之上、依固定軌道自主運行。
      太陽神離去後，日宮完好保存，太陽仍熾烈地在既定軌道上運行。
      任何飛行器均無法接近，空騎團高空堡壘亦有已知高度上限；內部是否空置，至今無人知曉。
    atmosphere:
      - 熾烈、神聖、遙不可及
      - 佔星者視其為「太陽神的遺言」，無法被回應的神殿
    narrative_functions:
      - 神明已離去卻遺物仍存的象徵
      - 日月同框（日蝕）時成為宗教詮釋焦點
    access_constraints:
      - 完全無法接近，無任何已知進入方式
      - 高度超過空騎團高空堡壘的已知上限
    linked_people_or_factions:
      - 太陽神（已離去）
      - 空騎團（已知高度極限的參照）
    continuity_notes:
      - 太陽神與月神是唯二以神殿形式留下天體的神明，其他神明未有類似記錄。

  - id: main-moon-broken-palace
    name: 主月（破碎月宮）
    type: 神殿遺跡 / 天體
    region: 天空，依原有軌道運行
    first_appearance: world-bible
    summary: >
      月神最初的神殿，月神死亡時遭受衝擊而破碎。
      碎片靠殘存神力維持引力、在原有軌道自主聚合運行，成為殘缺的月亮。
      銀白色，體積較大，表面有明顯裂痕與缺口，夜晚光芒中可見不規則暗塊。週期 30 天。
    atmosphere:
      - 殘破中仍保有冷白光芒
      - 裂痕與缺口是月神死亡的直接見證
      - 碎片流星雨出現時被視為凶兆
    narrative_functions:
      - 月神之死的視覺見證，每晚可見
      - 大型碎片脫落事件可作為情節觸發點
      - 各地宗教解讀分歧的核心符號
    access_constraints:
      - 無法接近，構成流星雨的碎片具撞擊風險
    linked_people_or_factions:
      - 月神（已死亡）
      - 生命女神（與月神共創女神魔法體系）
    continuity_notes:
      - 月神之名、死因及細節在各文化流傳版本中存在大量出入，是神學與史學爭議核心。
      - 可確認的事實：主月宮在某個時刻破碎了，副月宮完好保留。

  - id: secondary-moon-lunar-palace
    name: 副月（副月宮・新月雛形）
    type: 神殿 / 天體 / 未成形神明
    region: 天空，依原有軌道運行
    first_appearance: world-bible
    summary: >
      月神在持續成長過程中孕育的新月雛形，是尚未完全成形的第二個月神胚胎。
      月神死亡時因尚未成熟而未成為攻擊目標，完好保留至今。
      帶淡藍紫色澤，體積較小，外觀完整無損。週期 20 天。
    atmosphere:
      - 完整且帶冷藍紫光
      - 在殘破主月旁顯得格外刺目
      - 各地宗教對其態度截然不同：敬畏、期待、或試圖干預
    narrative_functions:
      - 未誕生神明的存在，潛在的世界觀衝突核心
      - 「副月凌主月」天象可用作儀式或情節時間錨
      - 各宗教勢力對副月的立場可反映其信仰本質
    access_constraints:
      - 無法接近
    linked_people_or_factions:
      - 月神（孕育者，已死亡）
    continuity_notes:
      - 各地宗教對副月存在根本分歧：有人奉為繼承者、有人畏為不穩定核心、也有人試圖干預其成長進程。

  - id: western-mountain-village
    name: 西邊群山下的村莊
    type: 村莊 / 懸賞起點
    region: 西邊群山山腳
    first_appearance: ch001
    summary: >
      原本山產豐隆，近年因深山山妖佔據大山、捕食走獸與村民而衰敗。
      村莊多次討伐失敗，老村長最後變賣一切請來山獵人。
    atmosphere:
      - 清晨晨霧
      - 村民低聲竊語與絕望氣氛
      - 因人口與經濟流失而衰敗
    narrative_functions:
      - ch001 委託來源
      - 呈現山妖造成的民生代價
      - 山獵人登場場景
    access_constraints:
      - 通往深山的隘口過去有多支討伐團失蹤
      - 村莊資源已幾乎耗盡
    linked_people_or_factions:
      - 老村長
      - 山獵人
      - 山妖
    continuity_notes:
      - 老村長去城裡前尚有驢子，回村時只剩拐杖與山獵人。

  - id: deep-mountain-spirit-lake
    name: 深山湖畔
    type: 靈泉 / 戰鬥場景
    region: 西邊群山深處
    first_appearance: ch001
    summary: >
      位於山坳間，四面嶙峋岩壁與墨綠密林，湖面平靜如磨光石板。
      靈氣在此匯聚，山妖在湖邊飲水並被山獵人斬殺。
    atmosphere:
      - 靈氣濃稠且帶腥甜氣味
      - 山鳥與蟲鳴消失，風過松針聲格外清晰
      - 湖面泛著輕微光澤
    narrative_functions:
      - ch001 決戰地點
      - 靈泉資源與山妖佔據的核心
      - 展示山獵人追蹤、狙擊與近戰能力
    access_constraints:
      - 山路狹窄且多碎石樹根
      - 山妖長期盤踞，普通討伐隊難以抵達或生還
    linked_people_or_factions:
      - 山獵人
      - 山妖
    continuity_notes:
      - 山獵人以獸骨指向西北方找到此地；山妖死亡後靈氣失去依附並散入空氣。

  - id: capital-aethlan
    name: 首都：艾瑟蘭
    type: 城市 / 帝國首都
    region: 第一大陸中部平原，三條主要河流交匯處
    first_appearance: world-bible
    summary: >
      帝國政治、經濟、文化的絕對核心。城市以舊皇宮為圓心向外輻射擴張，
      歷經兩千餘年層疊建設，新舊城區形成清晰的同心圓結構。
    atmosphere:
      - 舊城區石砌莊重、街道狹窄，夜晚燈火克制安靜
      - 新城區魔導管線外露、銀色導管沿拱廊蜿蜒，夜間形成連續藍白光帶
      - 過渡商業區人流最密集，白天政商高速運轉、夜晚酒館劇場密集
    narrative_functions:
      - 帝國政治核心場景（皇宮廣場、貴族院、平民院）
      - 三族聚居差異的縮影
      - 盟約日遊行與年度演說舞台
    access_constraints:
      - 舊城區貴族宅邸有門禁，非受邀者難以進入核心區域
    linked_people_or_factions:
      - 皇室
      - 貴族院（精靈主導）
      - 平民院（人類崛起中）
      - 艾瑟蘭迪爾家族
    continuity_notes:
      - 精靈家族集中於舊城區；人類遍布各處尤以新城區為主；矮人多聚集在靠近工業區與地下倉儲設施的邊緣城區。

  - id: port-city-velkan
    name: 海港城市：維爾坎
    type: 城市 / 海上貿易門戶
    region: 第一大陸東南沿海，依山面海
    first_appearance: world-bible
    summary: >
      帝國最大的海上貿易門戶，面向中間海域的商業咽喉。
      城市沿港灣斜坡層疊而建，從碼頭區一路向上延伸至山脊上的瞭望堡壘。
    atmosphere:
      - 嘈雜、快節奏、對外來者寬容
      - 建築顏色比首都豐富，石砌外牆常塗以暖色灰泥
      - 入夜後港口仍持續運作，魔導起重設備與水上導引燈沿港灣排列
    narrative_functions:
      - 跨陸商業與情報流通核心
      - 種族最複雜的帝國城市（含妖族、獸族社群）
      - 碼頭市集、冒險者公會分支、海盜半公開活動場景
    access_constraints:
      - 海盜出身的商人在此半公開活動，與官方維持微妙默契
    linked_people_or_factions:
      - 商人公會
      - 冒險者公會
      - 海盜勢力
      - 中間海域島群商人
    continuity_notes:
      - 碼頭市集每旬開市三天，來自兩大陸的商品在此集散。維爾坎人以務實著稱，不太在意對方種族或立場，只要交易公平即可。

  - id: academy-city-elno
    name: 學院城：艾爾諾
    type: 城市 / 學術與魔導研究中心
    region: 第一大陸西部丘陵地帶
    first_appearance: world-bible
    summary: >
      古精靈王國的舊都，現為帝國最重要的學術與魔導研究中心。
      城市規模不大但建築密度極高，幾乎每棟建築都有數百年以上的歷史。
      城外有大片精靈聚居的林地，是三族聯盟建立前精靈文明的核心遺址。
    atmosphere:
      - 安靜、秩序、帶著一種對知識的莊重感
      - 細高尖塔、繁複幾何窗花與以星象為主題的浮雕覆蓋公共建築外牆
      - 街道鋪以磨光白石，幾乎保持前帝國時期格局，未曾拓寬
      - 外來者容易感受到無言的審視——不是敵意，而是標準
    narrative_functions:
      - 魔導研究、古籍典藏與精靈學術政治舞台
      - 大圖書館最核心館藏區（非精靈學者不得入內）的政治爭議
      - 老精靈貴族維持古老生活方式的保留地
    access_constraints:
      - 大圖書館入館需資格審核，最核心典藏區非精靈學者不得進入
      - 城中精靈比例遠高於帝國其他城市，外來者受到無形審視
    linked_people_or_factions:
      - 大圖書館
      - 精靈老貴族家族
      - 學者與研究機構
    continuity_notes:
      - 大圖書館部分館藏可追溯至眾神之戰前。魔導科技以最低調的方式整合進古老建築，導管與金屬構件盡量隱藏於牆體之內。非精靈學者不得進入最核心典藏區一事，至今仍是帝國內部政治爭議點。

  - id: northern-aethlan-road
    name: 帝國北上道路
    type: 道路 / 北方交通線
    region: 艾瑟蘭帝國中北部至北境方向
    first_appearance: ch004-1
    summary: >
      由帝都向北延伸的道路系統。越往北，魔物與黑暗能量侵蝕事件越頻繁，
      商隊減少，驛站燈火轉暗，許多村鎮下午即急著關門。
    atmosphere:
      - 乾冷北風
      - 被燒成灰黑色的腐植林
      - 村民與受傷親人聚集在路邊，帶著劫後餘生的緊繃
      - 夜晚像某種會從地平線爬來的威脅
    narrative_functions:
      - 展示黑暗次元滲透已影響帝國內部交通與民生
      - 作為艾爾諾老師教導少年實戰判斷的移動舞台
      - 串接帝都、北方村鎮與黑石城
    access_constraints:
      - 道路附近可能出現腐獸、魔化植物與受黑暗能量侵蝕的魔狼。
      - 普通村鎮與商隊對日落後行動高度保守。
    linked_people_or_factions:
      - elno-honorary-mage
      - unnamed-mage-apprentice
      - adventurers-guild
      - dark-dimension
    continuity_notes:
      - ch004-1 中艾爾諾老師沿途處理的委託顯示，黑暗侵蝕已不是孤立事件。

  - id: blackstone-city
    name: 黑石城
    type: 礦業城市
    region: 艾瑟蘭帝國北上道路沿線
    first_appearance: ch004-1
    summary: >
      熱鬧的礦業城市，城牆不高但厚重，以深灰色石材與銀色金屬骨架構成。
      城外道路被運礦車壓得結實平整，遠處山坡有礦井升降塔與魔導輪盤。
    atmosphere:
      - 煤煙、金屬粉塵、麥酒與熱湯味混在一起
      - 矮人、工人、商隊、冒險者與厚外套居民往來頻繁
      - 魔導輪盤與礦井升降塔像城市呼吸般緩慢運轉
    narrative_functions:
      - 展示矮人與帝國礦業魔導技術的日常化應用
      - 讓少年魔導工程天賦首次明確浮出水面
      - 作為北上旅途中可補給、住宿與採購的城市節點
    access_constraints:
      - 礦業設施與工會商店以礦工、採購員及相關從業者為主要服務對象。
      - 夜間商店會關門，旅店則可接待通行者。
    linked_people_or_factions:
      - unnamed-mage-apprentice
      - elno-honorary-mage
      - blackstone-dwarf-shopkeeper
      - mining-guild
    continuity_notes:
      - ch004-1 中少年從黑石城礦業工會商店取得報廢手持切割刀，並在旅店房間完成改造。

  - id: blackstone-mining-guild-shop
    name: 黑石城礦業工會商店
    type: 商店 / 礦業工具供應點
    region: 黑石城
    first_appearance: ch004-1
    summary: >
      兩層高石造建築，門口掛有交叉礦鎬與齒輪標誌。店內展示照明魔晶燈、
      探測儀、大型礦車替換零件、手持切割刀與履帶式魔導運輸機等礦業工具。
    atmosphere:
      - 金屬與魔法氣息濃厚
      - 工業魔晶燈在關店時逐盞調暗
      - 展示牆與玻璃櫃帶有務實、密集的工坊感
    narrative_functions:
      - 觸發少年對魔導工程的深度分析與改造衝動
      - 展示魔法作為生活與產業工具的另一種語言
      - 提供報廢切割刀作為少年第一個可攜式改造原型
    access_constraints:
      - 非礦工或工會採購員可入內觀看，但長時間不購買會被店主提醒離開。
      - 報廢品通常不具商業維修價值，可能被低價處理或直接送出。
    linked_people_or_factions:
      - blackstone-dwarf-shopkeeper
      - unnamed-mage-apprentice
      - mining-guild
    continuity_notes:
      - 少年取得的報廢切割刀原本外殼裂開、噴嘴歪斜，風壓陣列有兩片符文片燒黑，水系魔晶已被拆走。
```

---

## bible/organizations.yaml

<!-- file_path: backend/novel_db/novel_02_random/bible/organizations.yaml -->

```yaml
organizations:
  - id: adventurers-guild
    name: 冒險者公會
    aliases:
      - 統一冒險者公會
      - 公會
    category: autonomous_transregional_organization
    first_appearance: world-bible
    source_sections:
      - temp/adventurers_guild.md#起源與性質
      - temp/adventurers_guild.md#組織架構
      - temp/adventurers_guild.md#政治立場
      - temp/adventurers_guild.md#成員制度
      - temp/adventurers_guild.md#任務制度
      - temp/adventurers_guild.md#服務範圍
      - temp/adventurers_guild.md#糾紛處理機制
      - temp/adventurers_guild.md#與騎士制度的關係
    summary: >
      冒險者公會是由早期探險家群體自然演進而來的自治組織，
      並非由任何單一政治實體創立或主導。隨著懸賞需求與冒險者數量增加，
      各地形成固定集散據點，最終發展為由地區總會與分會構成的公會體系。
      公會由主要政治實體共同承認，是懸賞流通、情報交換與騎士團雛形形成的重要節點。
    origin:
      founded_by: 早期探險家群體自然演進
      founding_nature: 非國家主導、非單一創辦人制度
      development: >
        從鬆散的探險者與懸賞集散地，逐步演變為跨地區的自治公會網絡。
    governance:
      central_authority: 無固定總會，無凌駕各地的最高機構
      regional_headquarters: >
        各國或各地區設有一個地區總會，作為當地公會體系最高層級。
      branches: >
        地區總會下設數量不等的分會，分布於各城市與重要據點。
      standardization: >
        各地區總會在任務標準、等級認定與內部規則上不盡相同，
        但透過協議維持最低共識，使跨地區活動仍可運作。
    political_position:
      stance: 中立
      recognized_by:
        - 各主要政治實體
      limitations:
        - 公會整體不代表任何政治勢力。
        - 各地會長可與當地政治勢力往來，但私下立場不代表公會整體。
      importance: >
        中立慣例是公會能跨政治實體運作的基礎，也是各勢力願意共同承認其地位的前提。
    membership:
      eligibility:
        - 自由報名
        - 不限種族
        - 不限出身
        - 不限背景
      assessment: >
        較大的分會或地區總會設有考核場地，新成員依體能、戰鬥能力或專業技能測試分配初始等級。
      adventurer_ranks:
        - F
        - E
        - D
        - C
        - B
        - A
        - S
      promotion_basis:
        - 任務完成品質
        - 能力表現
        - 同儕評價
        - 會長或審核委員會評定
      notes:
        - 升級並非純粹依任務數量自動計算。
        - S 級會員在各地皆極為稀少。
      internal_staff: >
        公會會吸納冒險者成為正式員工，負責管理、後勤、審核或執行職務；
        此類人員仍保有冒險者身分，但主要以公會雇員身分運作。
    credentials:
      guild_card_scope: 不跨地區通用
      exchange_mechanism: >
        各地公會之間設有同等證明或換證機制，供跨地區活動的冒險者使用；
        換證程序與標準依各地協議而定。
    mission_system:
      mission_ranks:
        - F
        - E
        - D
        - C
        - B
        - A
        - AA
        - S
      reward_policy: >
        各等級對應固定賞金範圍，由各地公會依當地物價與風險基準設定。
      commission_policy: >
        公會依任務等級抽取固定比例手續費，比例各地略有差異但大致統一。
      posting_rules:
        - 任何個人、組織或政治實體均可向公會發布委託。
        - 公會負責審核任務內容的合法性與等級合理性。
        - AA 級以上高等級任務通常需要更嚴格的審核程序。
      settlement: >
        任務完成後由公會確認完成狀況並結算，賞金扣除抽成後撥付給執行成員。
        公會在此流程中作為第三方擔保方。
    services:
      - 任務發布與結算
      - 冒險者休憩、情報交換與集會場地
      - 組隊與委託方配對媒合
      - 裝備買賣與後勤補給
      - 大型分會修繕工坊
      - 賞金存儲、跨地區匯兌與基本借貸
      - 地形、敵情、目標資訊與地區動態等情報服務
    intelligence_policy:
      access_model: 分級銷售
      restrictions:
        - 高等情報僅對特定等級以上會員開放，或需另行計費。
    dispute_resolution:
      minor_disputes:
        examples:
          - 任務完成認定爭議
          - 賞金計算分歧
          - 輕微契約違反
        handling: >
          由公會內部仲裁機制處理，公會員工或指定仲裁人居中協調，
          裁定結果對雙方具約束力。
      major_disputes:
        examples:
          - 重大財產損失
          - 人身傷亡責任
          - 刑事行為
          - 跨政治實體爭議
        handling: >
          移交外部相應的政治或法律機構處理，公會提供相關紀錄與協助，
          但不承擔最終裁決責任。
    related_systems:
      - id: knighthood-system
        relationship: >
          S 級懸賞任務的獨立執行能力是騎士團認定條件之一，
          因此公會等級認定體系與騎士制度存在實質連動。
        boundary: 公會不直接授予或撤銷騎士資格。
    related_entities:
      - first-continent-aethlan-empire
      - second-continent-great-league
    narrative_functions:
      - 提供跨政治實體通用的懸賞、情報與冒險者流動基礎。
      - 作為普通冒險者、國家機構與騎士制度之間的制度橋梁。
      - 可承接地方災害、討伐、護送、調查與跨境委託劇情。
      - 中立原則與地方會長私下立場可形成政治衝突或灰色地帶。
    continuity_notes:
      - 公會沒有全世界統一的最高總會；後續描寫應以各地區總會獨立運作為前提。
      - 公會證不跨地區通用，跨區冒險者需走換證或同等證明機制。
      - 公會可承接政治實體發布的委託，但不因此成為該政治實體的下屬組織。
      - S 級冒險者稀少，且 S 級任務能力可與騎士團認定產生關聯。

  - id: sky-rider-corps
    name: 空騎團
    aliases:
      - 空騎
    category: autonomous_neutral_knighthood
    first_appearance: world-bible
    summary: >
      空騎團是現存騎士團中立場最為徹底的一支，不附屬於任何政治實體，
      以高機動偵查能力與微型魔導飛行器聞名於世。
      旗下設有特別調查組，負責處理敏感性高或跨地區的複雜任務。
      總部為一座位置不對外公開的自主漂浮高空堡壘，是空騎團行動自由與中立身分的物質保障。
    origin:
      founding_nature: 具體建立歷史未公開
      development: >
        空騎團的核心技術體系——微型魔導飛行器與漂浮高空堡壘——早於現有紀錄，
        其起源與創始者至今未有官方說法。
    governance:
      central_authority: 團長（具體職位結構未公開）
      headquarters:
        type: 自主漂浮高空堡壘
        location: 位置不對外公開
        access_restriction: >
          堡壘位於超出一般飛行器可達高度的空層，亦高於空騎團飛行器的已知高度上限，
          外界無法主動接觸；空騎團成員的往返方式不對外透露。
      internal_units:
        - id: sky-rider-special-investigation-unit
          name: 特別調查組
    political_position:
      stance: 完全中立
      recognized_by:
        - 艾瑟蘭帝國（承認但不控制）
        - 其他主要政治實體（普遍承認其中立資格）
      limitations:
        - 不代表任何政治實體行動。
        - 不承接具有明確政治傾向的委託。
        - 成員在任職期間個人政治立場不得影響公務行動。
      importance: >
        中立地位是空騎團得以跨越各方政治壁壘自由行動的核心保障；
        一旦中立性受到質疑，其存在價值與各方的容忍度均會受到根本性動搖。
    capabilities:
      primary_strengths:
        - 高機動偵查
        - 空中情報收集
        - 快速部署與撤離
      equipment:
        - name: 微型魔導飛行器
          description: >
            空騎團獨有技術，單人或雙人操控，機動性遠超一般載具；
            具體構造與推進原理不對外公開。
          known_limitation: 存在已知高度上限，無法接近日宮所在高層空域。
        - name: 自主漂浮高空堡壘
          description: >
            空騎團總部，位於不對外公開的空層，可自主維持漂浮與運行，
            不依賴地面基礎設施。
    membership:
      recruitment:
        - 對外設有公開招募考核，通過者方能成為正式騎士。
        - 考核標準嚴苛，年齡最小通過紀錄由艾拉·芙萊爾保持。
      species_restriction: 未公開明確限制，但成員組成以人類為主。
      known_members:
        - id: aella-flair
          role: 特別調查組副隊長
    related_systems:
      - id: knighthood-system
        relationship: >
          空騎團符合騎士團認定三條件之一——具有舉世公認的特殊功績——
          同時以中立立場運作，不依賴政治實體授予資格。
    related_entities:
      - first-continent-aethlan-empire
    narrative_functions:
      - 提供跨政治實體的中立偵查與情報力量，可在各方衝突中作為資訊來源或中間人。
      - 高空堡壘與飛行器是世界觀中少數能接近上層空域的存在，與日月神殿的謎題直接相關。
      - 特別調查組可承接敏感、跨境或政治上不方便由帝國直接出面的任務。
      - 艾拉·芙萊爾作為最年輕副隊長，其成長弧線可與組織內部張力產生互動。
    continuity_notes:
      - 高空堡壘位置嚴格保密，任何描寫不應透露其具體座標或接觸方式。
      - 空騎團飛行器有高度上限，日宮附近空域已超出其可達範圍，此為已建立的物理限制。
      - 空騎團中立性是核心設定，後續描寫若涉及其捲入政治事件，須處理此張力而非迴避。
      - 招募考核公開存在，但考核內容與錄取標準不對外公開。

  - id: first-imperial-temple-knights
    name: 帝國第一聖殿騎士團
    aliases:
      - 第一聖殿騎士團
      - 聖殿騎士團
    category: imperial_religious_holy_order
    first_appearance: world-bible
    summary: >
      帝國第一聖殿騎士團由人神親自認可，以消滅魔族為核心使命。
      對外形象為全員人類的純粹聖戰力量，然而現任團長實為半神族，
      團內亦存在極少數非人類成員，此事於外界幾乎完全不為人知。
      其宗教合法性建立在人神的認可之上，政治上與帝國深度綁定，
      但神學上的超然地位使其同時擁有獨立於世俗皇權的特殊立場。
    origin:
      founded_by: 人神（認可者）
      founding_nature: 神明直接認可的聖戰騎士團
      development: >
        由人神親自認可建立，以人族對抗魔族的聖戰使命為核心，
        在帝國內部積累深厚宗教威望與政治話語權。
        人神離去後，騎士團以繼承神明意志自居，其制度正統性延續至今。
    governance:
      central_authority: 團長（現任為半神族，對外身分保密）
      internal_hierarchy: 具體層級架構未公開
      succession_principle: 未公開
    political_position:
      stance: 名義上效忠帝國，實際上持有宗教獨立地位
      recognized_by:
        - 艾瑟蘭帝國（深度政治綁定）
        - 各人類聚居地（廣泛的民間宗教合法性）
      limitations:
        - 宗教使命優先於世俗皇權，兩者衝突時以神明意志詮釋為準。
        - 反魔族立場使其在涉及魔族的政治判斷上缺乏彈性。
      tensions:
        - 帝國皇室對騎士團宗教號召力的依賴與忌憚並存。
        - 人類平民院崛起可能強化騎士團在帝國內部的政治影響力。
        - 騎士團對非人類成員的內部管理與對外形象之間存在結構性矛盾。
    public_image:
      perceived_composition: 全員人類
      actual_composition: >
        以人類為絕對主體；現任團長為半神族，另有極少數非人類成員，
        外界幾乎完全不知情。
      image_management: >
        騎士團刻意維護全員人類的公開形象，此形象對其宗教合法性與民間動員力至關重要；
        非人類成員的存在屬於嚴格保密的內部事務。
    mission:
      primary: 消滅魔族
      theological_basis: >
        人神認可賦予騎士團對抗黑暗次元與魔族的神聖使命，
        成員普遍視此任務為對神明意志的直接繼承與履行。
      scope:
        - 主動追蹤並消滅魔族個體與聚落
        - 協助帝國處理魔族威脅
        - 在民間維護對抗魔族的宗教信念
    known_secrets:
      - 現任團長為半神族，對外身分嚴格保密。
      - 團內存在極少數非人類成員，與對外形象存在根本性落差。
      - 人神離去後，騎士團對「神明意志」的詮釋權實際上由騎士團自身掌握。
    related_systems:
      - id: knighthood-system
        relationship: >
          獲人神親自認可，同時具備帝國政治承認，
          是騎士團三種認定條件中最具宗教份量的一類。
      - id: human-god-faith
        relationship: >
          建立在人神認可之上，人神離去後以「繼承神明意志」維持神學正統性；
          詮釋權的歸屬是潛在的制度張力來源。
    related_entities:
      - first-continent-aethlan-empire
      - human-god
    narrative_functions:
      - 在反魔族敘事中作為正統宗教力量登場，可與其他陣營形成使命上的衝突或合作。
      - 現任團長為半神族一事，是可用於解構「純粹聖戰」形象的重要伏筆。
      - 對魔族的強硬立場使其在涉及魔族個體立場複雜化時成為製造張力的外部壓力源。
      - 騎士團的宗教號召力可作為帝國內部政治博弈的籌碼或戰場。
      - 神明離去後「意志詮釋權」歸屬的問題，可作為騎士團內部路線分歧的潛在引爆點。
    continuity_notes:
      - 團長為半神族屬於高度保密資訊，正文中除非到達對應劇情節點，否則不應從騎士團視角主動透露。
      - 外界描寫騎士團時應維持「全員人類」的認知基準，與實際情況的落差可作為後續揭露伏線。
      - 人神離去後的神學詮釋問題不應輕易解決，此張力應在騎士團相關劇情中持續存在。
      - 騎士團與帝國的關係是相互利用而非單純從屬，描寫時應體現雙方各自的盤算。

  - id: mining-guild
    name: 礦業工會
    aliases:
      - 礦業工會商店
    category: industrial_trade_guild
    first_appearance: ch004-1
    summary: >
      黑石城等礦業城市中負責礦業工具、採購、報廢設備與相關物資流通的行業組織。
      ch004-1 中其商店展示大量魔導礦業工具，包含手持切割刀、履帶式魔導運輸機與探測儀。
    origin:
      founding_nature: 未公開，推定隨礦業城市與矮人工業體系發展而形成。
      development: >
        目前僅在黑石城以商店形式登場，更多制度、分會與跨城協作尚未公開。
    governance:
      central_authority: 未公開
      branches: >
        黑石城至少存在一處對礦工、工會採購員與相關客戶開放的商店據點。
    political_position:
      stance: 偏產業中立
      recognized_by:
        - 黑石城礦業體系
      limitations:
        - 目前未見其介入政治或軍事衝突。
    services:
      - 礦井工具展示與買賣
      - 魔導礦業設備零件供應
      - 報廢工具處理
      - 探測、照明、運輸與切割類工具流通
    related_entities:
      - blackstone-city
      - blackstone-mining-guild-shop
      - dwarves
    narrative_functions:
      - 展示矮人與帝國工業魔導技術如何落地到礦業生產。
      - 作為少年魔導工程才能的觸發點。
      - 可提供後續魔導工具、材料、零件與工坊劇情入口。
    continuity_notes:
      - ch004-1 的手持切割刀設計以水系魔晶生成水流，風系陣列壓縮穩定方向，形成高壓水柱切割。
      - 履帶式魔導運輸機使用四角浮力陣列抵消部分重量，而非真正飛行。

organization_units:
  - id: adventurers-guild-regional-headquarters
    name: 地區總會
    parent_organization: adventurers-guild
    category: regional_governing_unit
    summary: >
      各國或各地區公會體系的最高層級，負責當地任務標準、等級認定、
      分會管理、跨地區協議與重大委託審核。
    authority_scope: 依所在地區或政治實體範圍而定
    notes:
      - 地區總會彼此獨立，沒有固定總會統轄。
      - 地區總會間透過協議維持最低制度共識。

  - id: adventurers-guild-branch
    name: 分會
    parent_organization: adventurers-guild
    category: local_operational_unit
    summary: >
      分布於城市與重要據點的公會基層據點，直接處理任務公告、結算、
      冒險者交流、後勤服務與在地情報。
    authority_scope: 所在城市或據點周邊
    notes:
      - 大型分會可設考核場地與修繕工坊。
      - 分會規模與服務完整度依所在地需求而異。

  - id: sky-rider-special-investigation-unit
    name: 特別調查組
    parent_organization: sky-rider-corps
    category: specialized_operational_unit
    summary: >
      空騎團下設的精銳單位，負責處理敏感性高、涉及跨地區或情報複雜度超出一般任務的案件。
      成員編制較小，任務自由度高，在空騎團整體中立框架內享有較大的行動彈性。
    authority_scope: 由空騎團團長直接授權，不受地域限制
    known_members:
      - id: aella-flair
        role: 副隊長
        notes: >
          有記錄以來通過空騎團外部招募考核年齡最小的正式騎士，
          亦是特別調查組最年輕的副隊長。
    notes:
      - 特別調查組隊長身分未公開。
      - 成員確切人數不對外公開。
      - 任務性質通常不對外公告，完成情況亦不進入一般委託結算流程。
```

---

## bible/plot-threads.yaml

<!-- file_path: backend/novel_db/novel_02_random/bible/plot-threads.yaml -->

```yaml
open_threads:
  - id: dark-dimension-infiltration
    hook: 黑暗次元已進入滲透初期，但各勢力因政治算計選擇沉默。
    introduced_in: world-bible
    status: open
    stakes: >
      若次元壁再次大規模破裂，五百年前的魔族全面入侵可能重演；各勢力的互不信任會放大災難。
    likely_payoff_window: 長期

  - id: aethlan-power-realignment
    hook: 艾瑟蘭帝國的人類平民院與軍事力量正在崛起，精靈貴族院與艾瑟蘭迪爾家族面臨權力重組。
    introduced_in: world-bible
    status: open
    stakes: >
      三族聯盟原有的「精靈主導、人類執行、矮人製造」格局可能瓦解，引發制度改革或內部衝突。
    likely_payoff_window: 中期

  - id: dwarven-political-frustration
    hook: 矮人掌握工業命脈，卻因城邦與氏族分裂導致集體政治話語權不足。
    introduced_in: world-bible
    status: open
    stakes: >
      若矮人的不滿被政治勢力利用，三族聯盟的工業基礎與魔導科技供應鏈可能被動搖。
    likely_payoff_window: 中期

  - id: knight-orders-hidden-truths
    hook: 空騎團掌握未知高空堡壘與飛行核心技術；聖殿騎士團外界認知與內部真相不一致。
    introduced_in: world-bible
    status: open
    stakes: >
      騎士團表面中立或使命單純，實際可能掌握足以改變國際局勢的技術、身分與歷史秘密。
    likely_payoff_window: 中期

  - id: mountain-demon-origin
    hook: ch001 的山妖已被斬殺，但其來源、形成原因與是否牽涉黑暗次元尚未公開。
    introduced_in: ch001
    status: open
    stakes: >
      若山妖不是孤立事件，而是黑暗次元滲透、妖族異常或地方勢力失控的徵兆，西邊群山事件可能只是更大危機的前兆。
    likely_payoff_window: 短期到中期

  - id: mountain-hunter-identity
    hook: 山獵人展現超出普通討伐者的追蹤、機動與斬殺能力，但真實身分與過往完全未公開。
    introduced_in: ch001
    status: open
    stakes: >
      他的力量來源、與公會或騎士體系是否有關，會影響讀者對第一章事件尺度的理解。
    likely_payoff_window: 短期到中期

  - id: elno-starlight-magic
    hook: 艾爾諾老師能以無咒語、無魔杖的星光魔法抹除受黑暗能量驅動的魔狼，該魔法不屬於少年熟悉的標準屬性體系。
    introduced_in: ch004-1
    status: open
    stakes: >
      若星光魔法與黑暗次元、眾神遺產或宮廷法師體系隱秘知識有關，
      艾爾諾老師的身分與北上目的可能牽動主線危機。
    likely_payoff_window: 短期到中期

  - id: apprentice-magic-engineering-talent
    hook: 少年能在缺少完整零件與工坊的情況下，將報廢礦業切割刀改造成更小、更省魔法石的可用原型。
    introduced_in: ch004-1
    status: open
    stakes: >
      這項才能可能讓少年走向不同於純戰鬥法師的道路，也可能成為對抗腐植類魔物與黑暗侵蝕事件的新工具線。
    likely_payoff_window: 短期

  - id: northern-road-corruption-escalation
    hook: 帝國北上道路沿線出現腐獸、魔化植物與黑暗能量侵蝕魔狼，村鎮與商隊行動已受到影響。
    introduced_in: ch004-1
    status: open
    stakes: >
      黑暗侵蝕若持續擴大，北方交通、礦業城市補給與帝國對北境的掌控都會受到壓力。
    likely_payoff_window: 短期到中期
```

---

## bible/relationships.yaml

<!-- file_path: backend/novel_db/novel_02_random/bible/relationships.yaml -->

```yaml
relationships:
  - pair:
      - mountain-hunter
      - old-village-chief
    dynamic: >
      老村長是走投無路的委託人，山獵人是最後被請來的討伐者。兩者關係以懸賞與救命請託為核心，
      情感交流極少，但村長把村莊存亡押在山獵人身上。
    trust_level: 低到中
    tension: 中
    conflict_points:
      - 山獵人要價高，村民對其能力與動機有疑慮。
      - 山獵人冷漠寡言，沒有給村莊任何情緒安撫。
    last_updated_in: ch001

  - pair:
      - mountain-hunter
      - mountain-demon
    dynamic: >
      討伐者與獵物的關係。山妖是壓垮村莊的巨大威脅，山獵人則以冷靜、精準且不拖泥帶水的方式完成斬殺。
    trust_level: 無
    tension: 高
    conflict_points:
      - 山妖佔據深山資源並捕食村民。
      - 山獵人接下懸賞後直接進入山妖領域。
    last_updated_in: ch001

  - pair:
      - old-village-chief
      - mountain-demon
    dynamic: >
      山妖長期摧毀村莊生計與人口安全，老村長代表村莊承擔失敗討伐後的殘局。
    trust_level: 無
    tension: 高
    conflict_points:
      - 山妖吞食走獸、靈泉與村民。
      - 多次討伐團進入隘口後未歸。
      - 老村長已耗盡村莊最後資源發布懸賞。
    last_updated_in: ch001

  - pair:
      - aethlandir-house
      - humans
    dynamic: >
      艾瑟蘭迪爾家族及精靈主導層長期掌握帝國政治、經濟與科技架構；人類憑數量、軍事與平民院席次快速崛起，
      正在改變三族聯盟原有分工。
    trust_level: 中
    tension: 高
    conflict_points:
      - 人類平民院席次持續上升。
      - 精靈貴族院以制度性手段阻撓權力重組。
      - 家族軍事話語權正在流失。
    last_updated_in: world-bible

  - pair:
      - elves
      - dwarves
    dynamic: >
      精靈提供知識理論與領導方向，矮人提供工業製造與機械工藝。雙方同屬三族聯盟核心，
      但矮人因城邦與氏族分裂而政治話語權不足。
    trust_level: 中
    tension: 中
    conflict_points:
      - 矮人的實際工業貢獻高於政治影響力。
      - 精靈長期掌握文化與制度話語權。
    last_updated_in: world-bible

  - pair:
      - known-powers
      - dark-dimension
    dynamic: >
      各大勢力都已有黑暗次元滲透相關情報，但因政治算計、利益博弈與互不信任，沒有人願意公開承認或承擔共同應對成本。
    trust_level: 無
    tension: 高
    conflict_points:
      - 次元壁裂縫擴大與異常事件頻繁出現。
      - 五百年前魔族全面入侵的歷史被多數人視為傳說。
      - 各勢力選擇沉默，導致危機延誤。
    last_updated_in: world-bible

  - pair:
      - elno-honorary-mage
      - unnamed-mage-apprentice
    dynamic: >
      嚴師與天賦學生的師徒關係。艾爾諾老師用實戰、毒舌與冷靜判斷訓練少年，
      少年既敬畏又崇拜她，並希望得到她對魔法與魔導工程才能的認可。
    trust_level: 中到高
    tension: 中
    conflict_points:
      - 少年對魔導機械的興趣常偏離老師安排的魔法課業。
      - 少年黑魔法緒論基礎不足，實戰中曾誤判腐化魔狼的行動機制。
      - 老師並未否定少年的工程才能，但要求他能解釋與承擔改造後果。
    last_updated_in: ch004-1

  - pair:
      - unnamed-mage-apprentice
      - blackstone-dwarf-shopkeeper
    dynamic: >
      短暫的店主與客人關係。少年在礦業工會商店沉迷研究魔導工具，
      矮人老闆在關店前提醒他離開，並將無維修價值的報廢切割刀送給他。
    trust_level: 低
    tension: 低
    conflict_points:
      - 少年長時間觀看展示品但沒有購買正式商品。
      - 老闆務實地把切割刀視為報廢品，少年則看見可改造價值。
    last_updated_in: ch004-1

  - pair:
      - elno-honorary-mage
      - dark-dimension
    dynamic: >
      艾爾諾老師已具備處理黑暗能量侵蝕事件的知識與實戰能力。
      她能辨識腐化生物脫離神經系統後仍可由黑暗能量驅動，並以未知星光魔法將污染抹除。
    trust_level: 無
    tension: 高
    conflict_points:
      - 黑暗能量已使北上道路附近出現腐化野獸、魔狼與魔化植物。
      - 艾爾諾老師似乎知道比一般魔法師更多的黑暗侵蝕機制。
      - 她的星光魔法對黑暗能量具有特殊壓制或抹除效果，來源未公開。
    last_updated_in: ch004-1
```

---

## bible/species.yaml

<!-- file_path: backend/novel_db/novel_02_random/bible/species.yaml -->

```yaml
species:
  - id: human
    name: 人類
    category: major_species
    origin: 原初四族之一
    first_appearance: world-bible
    source_sections:
      - worldbuilding.md#七大種族
      - worldbuilding.md#節日
      - worldbuilding.md#飲食
      - worldbuilding.md#日常禮儀
    summary: >
      凝聚力與繁殖力強，適應力高。在三族聯盟中提供勞動力、工程創新與快速成長的人口基礎。
    traits:
      biological:
        - 繁殖力強
        - 適應力高
      social:
        - 凝聚力強
        - 是三族聯盟的人口與勞動力基礎
      magical: []
    cultural_profile:
      food:
        - 厚重、份量大、口味鹹香。
        - 燉肉、烤餅與根莖類蔬菜是主食圈核心。
        - 發展出以麵包為媒介的包夾文化，是街頭常見便食形式。
      etiquette:
        - 日常問候較隨意，點頭或揮手皆可。
        - 平民社群在非正式場合傾向直呼名字，並逐漸影響更正式場合。
      festivals:
        - festival_double_moon_night
        - festival_farewell_day
    political_role:
      - 三族聯盟的勞動力、工程創新與人口基礎。
    related_locations:
      - first-continent-aethlan-empire
    related_species:
      - elf
      - dwarf
    notes: []

  - id: elf
    name: 精靈
    category: major_species
    origin: 原初四族之一
    first_appearance: world-bible
    source_sections:
      - worldbuilding.md#七大種族
      - worldbuilding.md#節日
      - worldbuilding.md#飲食
      - worldbuilding.md#日常禮儀
    summary: >
      長壽、都市化且高度科技化。主導魔法理論系統化，是三族聯盟的知識與領導核心。
    traits:
      biological:
        - 長壽
      social:
        - 都市化程度高
        - 科技化程度高
        - 對稱謂與社交禮節敏感
      magical:
        - 主導魔法理論系統化
    cultural_profile:
      food:
        - 偏輕食、細工，講究食材原味與季節性。
        - 對辛辣與過重調味有明顯迴避傾向。
        - 正式精靈式餐宴可持續數小時，接近社交儀式。
      etiquette:
        - 私下場合保留古老的雙手合攏禮。
        - 貴族對稱謂高度敏感，錯用稱謂是明確失禮。
        - 對人類友人的死亡有獨立且繁複的哀悼禮節。
      festivals:
        - festival_double_moon_night
        - festival_farewell_day
    political_role:
      - 三族聯盟的知識核心。
      - 三族聯盟的領導核心。
    related_locations:
      - first-continent-aethlan-empire
    related_species:
      - human
      - dwarf
    notes: []

  - id: dwarf
    name: 矮人
    category: major_species
    origin: 原初四族之一
    first_appearance: world-bible
    source_sections:
      - worldbuilding.md#七大種族
      - worldbuilding.md#節日
      - worldbuilding.md#飲食
      - worldbuilding.md#日常禮儀
    summary: >
      對金屬與礦石有天賦直覺，是工業技術核心；但城邦與氏族分裂使其政治話語權低於實際貢獻。
    traits:
      biological: []
      social:
        - 城邦與氏族分裂削弱政治話語權。
        - 熟識之間習慣以拳碰肩。
      magical: []
      craft:
        - 對金屬與礦石有天賦直覺。
        - 是帝國工業技術核心之一。
    cultural_profile:
      food:
        - 以高熱量、高蛋白為核心。
        - 釀酒文化極為發達。
        - 矮人麥酒是帝國境內流通最廣的酒類之一。
        - 重要場合共飲同一桶酒以示信任；拒絕共飲是明確冒犯。
      etiquette:
        - 熟識者以拳碰肩問候。
      festivals:
        - festival_double_moon_night
        - festival_farewell_day
    political_role:
      - 工業技術核心。
      - 實際貢獻高於政治話語權。
    related_locations:
      - first-continent-aethlan-empire
    related_species:
      - human
      - elf
    notes: []

  - id: yaozu
    name: 妖族
    category: major_species
    origin: 妖神與獸神神體碎片孕育的第一批祖先延續而來
    first_appearance: world-bible
    source_sections:
      - worldbuilding.md#七大種族
      - worldbuilding.md#魔族體系與階級
    summary: >
      由妖神與獸神神體碎片孕育的第一批祖先延續而來，後世也可由動植物及自然事物長久修煉形成。
      妖族是多亞種集合，個體立場偏中立。
    traits:
      biological:
        - 多亞種集合
        - 可由動植物及自然事物長久修煉形成
      social:
        - 個體立場偏中立
      magical:
        - 具神識修煉基礎
    corruption_risk:
      demonology_ref: corrupted_yao
      note: 修煉中的妖族遭黑暗能量侵蝕後可能異變為妖魔。
    cultural_profile:
      food: []
      etiquette: []
      festivals: []
    related_species:
      - beastfolk
      - demonkind
    notes: []

  - id: demonkind
    name: 魔族
    category: umbrella_species
    origin: 黑暗次元或腐化力量
    first_appearance: world-bible
    source_sections:
      - worldbuilding.md#七大種族
      - worldbuilding.md#魔族體系與階級
      - demonology.yaml
    summary: >
      源自黑暗次元或腐化力量，外界常以邪惡標籤看待，但魔族內部有自身文化與秩序。
      魔族不是單一種族，而是數個起源不同物種的統稱。
    taxonomy_ref: demonology.yaml
    branches:
      - demon_class
      - corrupted_class
      - native_class
    traits:
      biological:
        - 起源不一，包含黑暗次元原生、現界物種腐化、以及混合能量生成的新物種。
      social:
        - 內部存在自身文化與秩序。
        - 整體與帝國及大陸諸族多半敵對。
      magical:
        - 可使用大陸魔法體系、純黑暗能量，或黑暗能量造成的腐化能力。
    cultural_profile:
      food: []
      etiquette: []
      festivals: []
    related_species:
      - human
      - elf
      - dwarf
      - yaozu
      - beastfolk
    notes:
      - 詳細分支、階級與個別類型見 demonology.yaml。

  - id: beastfolk
    name: 獸族
    category: major_species
    origin: 遠古祖先被認為是原初四族中的純獸
    first_appearance: world-bible
    source_sections:
      - worldbuilding.md#七大種族
      - worldbuilding.md#魔族體系與階級
    summary: >
      獸族是外界統稱，內部有自身稱呼。主流為完全獸型但具智慧的個體。
    traits:
      biological:
        - 主流個體為完全獸型
        - 具智慧
      social:
        - 外界統稱與內部自稱可能不同
      magical: []
    corruption_risk:
      demonology_ref: corrupted_beastfolk
      note: 獸族遭黑暗能量侵蝕後可能異變為魔獸。
    cultural_profile:
      food: []
      etiquette: []
      festivals: []
    related_species:
      - yaozu
      - demonkind
    notes: []

  - id: demigod
    name: 半神族
    category: rare_species
    origin: 創世神族留下的造物或遺產
    first_appearance: world-bible
    source_sections:
      - worldbuilding.md#七大種族
    summary: >
      創世神族留下的造物或遺產，近乎不死、數量極少、全員天生施法，真實身分往往成謎。
    traits:
      biological:
        - 近乎不死
        - 數量極少
      social:
        - 真實身分往往成謎
      magical:
        - 全員天生施法
    cultural_profile:
      food: []
      etiquette: []
      festivals: []
    related_species: []
    notes: []

festivals:
  - id: festival_covenant_day
    name: 盟約日
    timing: 盟約曆 1 月 1 日
    scope: 帝國全境
    source_section: worldbuilding.md#節日
    summary: >
      帝國建立紀念日，全境公假三天，是帝國最具政治象徵意義的節日，也是官方發布重大政策的傳統時機。
    participants:
      - human
      - elf
      - dwarf
      - empire_citizens
    rituals:
      - 首都舉行大型遊行。
      - 帝王或攝政於皇宮廣場發表年度演說。
      - 貴族院與平民院代表共同出席。
      - 各地城市有煙火與魔導光演。
    narrative_functions:
      - 官方發布重大政策的傳統時機。
      - 展示帝國秩序與三族共存的政治舞台。

  - id: festival_double_moon_night
    name: 雙月夜
    timing: 每 60 天，主副月同圓之夜
    scope: 帝國境內
    source_section: worldbuilding.md#節日
    summary: >
      非固定日期，由占星者提前公告。帝國境內宗教氛圍最濃厚的節日。
    participants:
      - human
      - elf
      - dwarf
    rituals:
      - 精靈進行年度星象解讀儀式。
      - 人類偏向家族團聚與許願。
      - 矮人在此夜開爐鑄造重要器物。
    beliefs:
      - 精靈傳統認為雙月夜是占星最準確的時刻。
      - 矮人認為此夜神力餘韻最強。
    narrative_functions:
      - 可用於星象預言、家族願望、重要器物鑄造等橋段。

  - id: festival_rift_day
    name: 裂痕日
    timing: 神寂日之一，6 月末
    scope: 帝國全境
    source_section: worldbuilding.md#節日
    summary: >
      紀念眾神之戰與大陸分裂的哀悼日，全境禁止宣戰與簽署軍事協議。
    participants:
      - empire_citizens
    rituals:
      - 各地神殿開放。
      - 民間在裂痕日前夕修繕家中破損器物，象徵不讓裂痕過夜。
    laws_or_taboo:
      - 唯一明文寫入帝國憲章的儀式性禁令。
      - 禁止宣戰與簽署軍事協議。
    narrative_functions:
      - 可作為戰爭、外交與宗教衝突的限制條件。

  - id: festival_farewell_day
    name: 告別日
    timing: 神寂日之一，10 月末
    scope: 帝國境內
    source_section: worldbuilding.md#節日
    summary: >
      紀念眾神陸續離去的哀悼時節中最重要的一天，傳說是最後一位神明沉默的日子。
    participants:
      - human
      - elf
      - dwarf
      - empire_citizens
    rituals:
      - 精靈燃燒舊書信與記憶物，象徵放下。
      - 人類偏向祭祖。
      - 矮人封閉最深層礦坑入口一日。
    related_customs:
      - 帝國通行習俗是在告別日之前完成入土或火化。
      - 遺留物由家族保管三年後方可轉讓。
    narrative_functions:
      - 可承載死亡、記憶、告別與神明沉默等主題。

shared_culture:
  - id: empire_formal_greeting
    name: 帝國正式問候
    source_section: worldbuilding.md#日常禮儀
    summary: >
      右手置於左胸、微微頷首，起源於三族聯盟簽約時設計的中性禮儀，刻意迴避任何單一族群的傳統姿勢。
    participants:
      - human
      - elf
      - dwarf

  - id: empire_mixed_table
    name: 混桌飲食
    source_section: worldbuilding.md#飲食
    summary: >
      三族融合後，帝國城市發展出混桌飲食習慣。高端餐館提供三族套餐，各自保留風格但共享餐桌空間。
    participants:
      - human
      - elf
      - dwarf
    narrative_functions:
      - 帝國多族共存的日常體現之一。

  - id: magitech_device_etiquette
    name: 魔導裝置禮節
    source_section: worldbuilding.md#日常禮儀
    summary: >
      在正式場合或神殿內使用個人魔導終端被視為失禮；商業場合則相對寬鬆，邊談事情邊查閱魔導終端是常見行為。
    participants:
      - empire_citizens
```

---

## bible/timeline.yaml

<!-- file_path: backend/novel_db/novel_02_random/bible/timeline.yaml -->

```yaml
timeline:
  - day: 太古之初
    time_of_day: 神話時代
    chapter: world-bible
    location_id: starborne-flat-world
    event: 創世眾神以宇宙星空物質凝聚平面大陸，與原初四族共同生活。
    state_change: 世界成形，神與種族共居的樂園時代開始。

  - day: 太古紀・裂變
    time_of_day: 神話時代
    chapter: world-bible
    location_id: starborne-flat-world
    event: 眾神之間產生嫌隙，黑暗次元腐化妖神與獸神，引爆眾神之戰。
    state_change: 次元壁在多處破裂，魔族誕生。

  - day: 太古紀・終戰
    time_of_day: 神話時代
    chapter: world-bible
    location_id: starborne-flat-world
    event: 眾神之戰將大陸一分為二，妖神與獸神殞落。
    state_change: 神體碎片孕育妖族，潰散神力成為魔法泉源。

  - day: 太古紀・月神殞落（星落曆 元年）
    time_of_day: 神話時代
    chapter: world-bible
    location_id: main-moon-broken-palace
    event: 月神在不明戰鬥中死亡，主月宮遭衝擊破碎；副月宮因尚未成熟而完好保存。
    state_change: 主月成為殘破的破碎月宮，在星空中自主聚合運行；副月完整保留，成為尚未誕生的第二個月神。精靈學者以此為紀元建立星落曆。

  - day: 約兩千年前
    time_of_day: 神退紀
    chapter: world-bible
    location_id: starborne-flat-world
    event: 眾神陸續離去，最後可靠記錄僅確認生命女神、人神與龍神仍存於世。
    state_change: 此後眾神幾乎徹底沉默，神祇是否仍存在成為疑問。

  - day: 眾神之戰後
    time_of_day: 古精靈帝國式微期
    chapter: world-bible
    location_id: first-continent-aethlan-empire
    event: 艾瑟蘭迪爾家族先祖離開森林，與人類、矮人尋求聯盟。
    state_change: 三族聯盟日後成為艾瑟蘭帝國基石，部分傳統精靈視其為背叛。

  - day: 盟約曆 元年（現今 2256 年前）
    time_of_day: 建國紀元
    chapter: world-bible
    location_id: first-continent-aethlan-empire
    event: 三族聯盟正式建立艾瑟蘭帝國，盟約曆由此起算。
    state_change: 世俗政治以盟約曆為通行曆法，精靈學者私下仍附注星落曆年份。

  - day: 五百年前
    time_of_day: 魔族全面入侵
    chapter: world-bible
    location_id: starborne-flat-world
    event: 上一次魔族全面入侵發生。
    state_change: 戰爭記憶在當下多數人認知中逐漸變成傳說。

  - day: 當下（盟約曆 2256 年）
    time_of_day: 和平時代
    chapter: world-bible
    location_id: starborne-flat-world
    event: 魔導科技高度發展，各勢力維持表面和平；黑暗次元開始小規模滲透。
    state_change: 次元壁不穩定性加劇，但各勢力因政治利益與不信任選擇沉默。

  - day: 盟約曆 2256 年 08 月 20 日（星落曆 2481 年 12 月 26 日）
    time_of_day: 清晨
    chapter: ch001
    location_id: western-mountain-village
    event: 老村長變賣一切後帶回山獵人，村民在村口目送山獵人進山。
    state_change: 村莊最後一次討伐山妖的懸賞正式開始。

  - day: 盟約曆 2256 年 08 月 20 日（星落曆 2481 年 12 月 26 日）
    time_of_day: 清晨至上午
    chapter: ch001
    location_id: deep-mountain-spirit-lake
    event: 山獵人以獸骨尋跡抵達深山湖畔，射瞎山妖左眼後近身斬殺山妖。
    state_change: 佔據深山、吞食走獸靈泉與村民的山妖死亡，村莊威脅暫時解除。

  - day: 盟約曆 2256 年（具體日期未定）
    time_of_day: 傍晚前後
    chapter: ch004-1
    location_id: northern-aethlan-road
    event: 艾爾諾老師在北上道路旁處理受黑暗能量侵蝕的腐植林與村莊委託，隨後讓少年練習討伐二十三隻魔狼。
    state_change: >
      確認北上道路沿線黑暗侵蝕事件頻率上升；少年展現精準雷魔法控制，
      但因不了解黑暗能量二次驅動迴路而被老師糾正。

  - day: 盟約曆 2256 年（具體日期未定）
    time_of_day: 傍晚至夜晚
    chapter: ch004-1
    location_id: blackstone-city
    event: 艾爾諾老師與少年抵達黑石城，入住旅店；少年沒有跟老師去魔法書店，而是前往礦業工會商店研究魔導機械。
    state_change: >
      黑石城作為礦業城市正式登場；少年對魔導工程的興趣與分析能力成為明確角色特徵。

  - day: 盟約曆 2256 年（具體日期未定）
    time_of_day: 深夜至翌日清晨
    chapter: ch004-1
    location_id: blackstone-city
    event: 少年取得報廢手持切割刀後徹夜改造，將其縮小並降低魔法石消耗，造成旅店天花板細切痕。
    state_change: >
      少年完成第一個可攜式魔導工程改造原型；艾爾諾老師雖責罵他分心，
      仍允許他帶著作品同行並要求說明陣列設計。

continuity_notes:
  - 現今為盟約曆 2256 年；距上次魔族全面入侵約五百年，距眾神最後可靠記錄約兩千年。
  - 星落曆以月神殞落為元年，比盟約曆更古老；兩曆落差是精靈身分認同的活細節。
  - 主月週期 30 天、副月週期 20 天，最小公倍數 60 天，構成雙月同圓等主要天象。
  - 世界地理是兩塊主大陸加中間島群，不是單一大陸或球形世界。
  - ch001 的山妖死亡已是正文 canon；其來源與是否牽涉黑暗次元尚未公開。
  - ch004-1 的具體日期尚未定錨；目前僅能確定發生在少年離開帝都並與艾爾諾老師北上期間。
```

---

## bible/worldbuilding.md

<!-- file_path: backend/novel_db/novel_02_random/bible/worldbuilding.md -->

```markdown
# Worldbuilding

> [!IMPORTANT]
> 本檔依 `world-bible.pdf` 建立 `novel_02` 的世界設定基準，並補入 `ch001` 已寫成正文的公開 canon。尚未進入正文但由世界觀文件明確指定的資訊，可作為後續創作的設定依據；具體場景請維護於 `location.yaml`。

## 核心前提

- 世界是一片漂浮於宇宙星空中的巨大平面大陸，由遠古創世眾神以星空物質凝聚而成；大陸邊緣如瀑布般向虛空傾落。
- 現今地理由兩塊主大陸與散佈其間的島群構成。兩大陸曾為一體，在眾神之戰中被一分為二。
- 文明基調為魔導科技文明。魔法可被提煉為能源，讓普通人借由魔導裝置使用魔力效果；天生施法者則保留傳統魔法體系。
- 當下距上次魔族全面入侵約五百年，是罕見的長期和平時代，但黑暗次元已開始滲透，次元壁裂縫正在擴大。

## 創世、眾神與歷史

- 太古之初，創世眾神與原初四族（人、純獸、矮人、精靈）共同生活，眾神作為守護神庇佑大地。
- 眾神之間不明原因產生嫌隙，黑暗次元趁虛腐化妖神與獸神，引爆眾神之戰。
- 眾神之戰造成大陸分裂、多處次元壁破裂，魔族由此誕生。妖神與獸神殞落後，其神體碎片孕育出妖族，神力潰散成為魔法泉源。
- 約兩千年前，眾神陸續離去。最後可靠記錄中仍存於世的神祇為生命女神、人神與龍神；此後眾神幾乎徹底沉默。

## 日月、神殿與天文

- 太陽與月亮不只是天體，同時是太陽神與月神的神殿所在——「日宮」與「月宮」。兩神以神力鑄造日月，使其依固定軌道循環運行，形成現界的晝夜週期。
- 太陽神離去時，日宮完好保存。太陽依然在既定軌道上自主運行；日宮內部是否空置，至今無人知曉，任何飛行器均無法接近，空騎團高空堡壘亦有已知高度上限。
- 月神擁有兩座月宮。主月宮是最初的神殿；副月宮是月神成長過程中孕育的新月雛形，尚未完全成形的第二個月神胚胎。月神死亡時，主月宮破碎，碎片靠殘存神力維持引力自主聚合運行，成為殘缺的主月。副月宮因尚未成熟而未受攻擊，完好保留至今。

### 兩顆月亮

- **主月（破碎月宮）**：銀白色，體積較大，表面有明顯裂痕與缺口。是月神遺體的一部分，也是其死亡的直接見證。碎片偶爾脫軌形成流星雨；大型碎片脫落被視為凶兆。
- **副月（新月雛形）**：帶淡藍紫色澤，體積較小，外觀完整。各地宗教對其詮釋存在根本分歧：有人奉為繼承者等待其成神，有人畏為不穩定的神力核心，也有人試圖干預其成長進程。

### 天象節點

主月週期 30 天，副月週期 20 天，最小公倍數為 60 天，構成以下主要天象：

- **雙月同圓**（每 60 天）：破碎主月與完整副月同時圓滿，帝國政治公告的傳統時機之一。
- **副月凌主月**：完整副月遮蔽破碎主月，各地宗教詮釋為新生蓋過死亡，或對死亡的哀悼。
- **碎片雨**（不定期）：主月碎片脫軌形成的流星雨，歷史上有記載的大型撞擊事件。
- **日月同框（日蝕）**：部分信仰詮釋為「太陽神回頭凝視月神之死」，各地皆有對應儀式。

占星者普遍將觀測日月視為「讀神的遺言」——兩座神殿仍在運行，但發出遺言的神明再也無法回應詮釋。

## 紀元與曆法

- **盟約曆**：以三族聯盟正式建立艾瑟蘭帝國為元年，為帝國境內通行的世俗曆法，政治文書、商業契約、軍事紀錄均採用此曆。現今為**盟約曆 2256 年**。一年 360 天，12 個月，每月 30 天（與主月週期同步）；每月分 5 週，每週 6 天，第六日為公休。另設 4 個「神寂日」，不屬於任何月份，作為紀念眾神之戰與神明離去的傳統假日。
- **星落曆**：以月神殞落為元年，比盟約曆更為古老，為精靈學者、神殿典籍與占星文獻所使用。部分文化認為用星落曆計日本身即是一種哀悼儀式。帝國官方場合使用盟約曆，但老精靈貴族私下通信仍習慣附注星落曆年份，隱然透露身分認同與歷史重量的差異。

## 七大種族

- 人類：原初四族之一，凝聚力與繁殖力強，適應力高。在三族聯盟中提供勞動力、工程創新與快速成長的人口基礎。
- 精靈：原初四族之一，長壽、都市化且高度科技化。主導魔法理論系統化，是三族聯盟的知識與領導核心。
- 矮人：原初四族之一，對金屬與礦石有天賦直覺，是工業技術核心；但城邦與氏族分裂使其政治話語權低於實際貢獻。
- 妖族：由妖神與獸神神體碎片孕育的第一批祖先延續而來，後世也可由動植物及自然事物長久修煉形成；多亞種集合，個體立場偏中立。
- 魔族：源自黑暗次元或腐化力量，外界常以「邪惡」標籤看待，但魔族內部有自身文化與秩序。分為惡魔類、魔化類、原生類。
- 獸族：外界統稱，內部有自身稱呼。主流為完全獸型但具智慧的個體，遠古祖先被認為是原初四族中的純獸。
- 半神族：創世神族留下的造物或遺產，近乎不死、數量極少、全員天生施法，真實身分往往成謎。

## 魔族體系與階級

- 魔族不是單一種族，而是數個起源不同物種的統稱。依起源可分為惡魔類（黑暗次元原生物種）、魔化類（大陸物種遭黑暗能量侵蝕後異變）、原生類（黑暗次元能量與大陸生命能量融合而成的新物種）。
- 三大類之間存在穩定階級秩序：惡魔類地位最高，原生類居中，魔化類最低。整體上與帝國及大陸諸族多半敵對，僅極少數特例不主動與現界種族為敵。
- 魔族形式上的最高領導為魔王，必須出身惡魔類，是政治正統的象徵延續；但實際上各惡魔類分支與派系多半各自為政，魔王的實際約束力有限。
- 歷史上惡魔類曾建立統一魔族政權；魔帝被殺後，該政權分裂至今未再統一。部分魔化類與原生類個體也會脫離惡魔類控制，自行形成地位較低的聚落。

### 惡魔類

- 惡魔類是黑暗次元的原生物種，魔族正統，個體普遍強大，可使用大陸魔法體系或更純粹的黑暗能量。
- **惡魔**：惡魔類中的正統核心，類人外形、頭生角，成年平均體高約 2.5 公尺；擅長攻擊型大陸魔法，攻擊常附帶黑暗能量，自癒能力極強，是數量最少但統治地位最高的支配階層。
- **古魔**：最古老的黑暗次元原生物種，形體多半不可名狀，不走大陸魔法體系，偏重強悍肉身與純黑暗能量衝擊；因難以管束，常被放逐、畏懼或充作戰獸、守衛與打手。
- **夢魔**：介於實體與虛體之間的類人種，成年個體背生 2 至 8 隻觸手，觸手數量與階級正相關；能力以夢境操控、催眠、幻覺、精神連結與強制控制為主，常擔任刺客或控場者。
- **炎魔**：體型巨大、皮膚通紅、頭生巨角，成年體高約 4 至 5 公尺；全員不懼火焰，擅長火系魔法，多居火山地帶，是惡魔類的菁英中堅之一。
- **咒魔**：身形細長，擅詛咒、腐化、侵蝕、下蠱與死靈術；由大型戰場的亡魂怨念聚集而生，是惡魔類中唯一非自然生成的分支，常擔任軍師。
- **巨魔**：惡魔類中體型最龐大，成年平均體高約 7 至 10 公尺；智力低，不使用魔法，但肉體戰力與防禦極高，多為戰爭前鋒或戰將。
- **天魔**：類鳥形、蝙蝠形或人形，背生翅膀；修行大陸法系但更偏重物理戰，是惡魔類的重要突擊與空戰骨幹。
- **冰魔**：皮膚呈藍色或紫色，體型與惡魔相近；使用冰系魔法，魔法造詣強於防禦，數量少於炎魔，常擔任施法者角色。

### 魔化類

- 魔化類由黑暗能量侵蝕大陸物種的心智與肉體而成，腐化過程單向且不可逆，地位極低，多為各惡魔派系手下數量最龐大的基層戰力。
- **腐人類**：人類或三族個體遭侵蝕後的異變體，外形退化為近似哥布林或地精的矮小邪惡生物；個體戰力低，但數量極其龐大，是最典型的砲灰。
- **腐獸類**：一般走獸與飛禽遭侵蝕後形成，獸性與攻擊本能被極端放大，常見體型膨脹、骨骼外露、皮毛焦黑等特徵；分布最廣，幾乎遍及次元壁裂縫周邊生態區。
- **腐植類**：植物或自然地形長期受黑暗能量滲透後異變成具攻擊性的生命體；通常固著或移動緩慢，但污染範圍廣且難以徹底清除。
- **妖魔**：修煉中的妖族遭侵蝕後的異變結果；保留殘破自我意識卻全面偏向暴力與破壞，是魔化類中智力最高也最危險的一支。
- **魔獸**：獸族遭侵蝕後形成的異變體；兼具殘存智慧與失控獸性，比腐獸類更有組織、比妖魔更難溝通，少數個體仍保留破碎記憶，因此更不穩定。

### 原生類

- 原生類是黑暗次元能量與大陸生命能量融合生成的全新物種，既非腐化體，也非原生惡魔；構造通常較簡單，地位低，多為基層戰力或獨立聚落底層成員。
- **史萊姆類**：半液態生命體，無固定形狀，可吞噬、腐蝕接觸物質，並持續以黑暗能量侵蝕周遭環境。
- **觸手類**：多觸手構造生命體，可能固著也可能緩慢移動；觸手帶有強烈腐蝕效果，是其主要攻擊與捕食手段。
- **蟲類**：小型群聚生命體，單體戰力弱，但以大量繁殖與集體行動構成威脅；部分個體具寄生其他生物的能力。
- **晶體類**：由黑暗能量結晶化形成，個體構造簡單，但可彼此組合成更複雜的晶體魔像；其規模與複雜度取決於參與組合的晶體數量與排列方式。

## 魔導科技與戰力系統

- 魔導科技以魔晶、魔石提煉出的魔法能量作為燃料，機械裝置作為引擎；空間魔法負責能量傳輸。
- 精密魔導終端已普及到平民負擔得起的程度。生物學昌盛，物理學研究較少，尚未接觸分子、原子、核子層級科學。
- 自主魔偶由魔法引導神識製作，高階魔偶少數具有自主意識，一般魔偶多為自動化工具。
- 傳統魔法只有天生施法者能使用，本質是自由的，力量上限取決於個人想像與理解深度；魔法本身無固定屬性，屬性多由流派形成。
- 人族有武鬥家修煉系統，可透過極致肉體訓練發展到鬥氣外放。妖族與獸族各有狂化天賦。
- 生命女神與月神共同創造女神魔法體系，供信仰修道者使用，主體為非攻擊性魔法。
- 魔族魔法通達黑暗次元，越接近黑暗次元本質越強，表現形式與現界種族差異極大。

## 政治格局

- 第一大陸為艾瑟蘭帝國，由三族聯盟建立，是君主立憲帝國，設有精靈主導的貴族院與人類崛起中的平民院。
- 艾瑟蘭帝國北部高原與南部叢林的少數民族聚居地名義歸屬帝國，實際半自治；北方深處仍有大片未探索土地。
- 第二大陸由大聯盟鬆散維繫。成員國自願遵守共同標準與公約，無強制執行機構、無統一軍隊，共同認同感薄弱。
- 大聯盟北方四國包括熊族王國、虎族王國、狐族王國與妖族帝國；南方以人獸王國與多元聯邦為代表。
- 兩大陸之間的島群為海峽無政府地帶，海盜文化主導，各島各自為政，控制安全航路即是權力來源。

## 騎士與公會制度

- 騎士不是單純的傳統騎士團成員，而是職業、身分象徵與制度的綜合概念，接近冒險者體系頂端的高級稱號。
- 統一冒險者公會由各政治實體共同承認，是懸賞、情報流通與騎士團雛形形成的核心節點。
- 騎士團認定可來自三種條件之一：具備獨立執行 S 級懸賞任務的戰力、獲政治實體正式承認、或具有舉世公認的特殊功績。
- 空騎團為完全中立的騎士團，以偵查與機動聞名，掌握微型魔導飛行器與未知位置的自主漂浮高空堡壘。
- 聖殿騎士團由人神親自認可，使命是消滅魔族。外界認為全員人類，現任團長實為半神族，且團內有極少數非人類成員。

## 已揭露風險與代價

- 黑暗次元是無意識的腐化與淹沒之力，但深處存在少數有意識的強大存在，動機不明。
- 次元壁在眾神之戰後表面癒合，內部從未穩定，現已進入滲透初期，異常事件頻率正在上升。
- 各大勢力並非完全不知情，但無人願意率先公開承認危機或承擔共同應對成本。
- 艾瑟蘭帝國內部的人類平民院崛起、精靈貴族院阻撓、矮人工業貢獻與政治話語權不均，正在累積結構性裂痕。

## 建築風格

帝國城市建築以文藝復興時期歐洲城市為底，拱廊、圓頂、石砌廣場與對稱立面是各地通行的建築語言。三族聯盟建立後，矮人的鑄造工藝與精靈的魔導技術逐漸滲透進建築設計，銀色系金屬構件——導管、骨架、燈柱、橋樑——疊加在石砌底層之上，形成帝國特有的視覺語彙：古典厚重的地基，加上流線精密的金屬覆層。

三族建築傾向各有差異：精靈在建築頂部與窗框施以繁複幾何雕飾；矮人負責地下結構與金屬骨架，講究承重精準而非裝飾；人類主導街道規劃與公共空間，偏好開闊廣場與便於集會的大型階梯。三者疊加，構成帝國城市的整體面貌。

## 節日

- **盟約日**（盟約曆 1 月 1 日）：帝國建立紀念日，全境公假三天。首都舉行大型遊行，帝王或攝政於皇宮廣場發表年度演說，貴族院與平民院代表共同出席。各地城市有煙火與魔導光演，是帝國最具政治象徵意義的節日，也是官方發布重大政策的傳統時機。
- **雙月夜**（每 60 天，主副月同圓之夜）：非固定日期，由占星者提前公告。精靈傳統視雙月夜為占星最準確的時刻，進行年度星象解讀儀式；人類習俗偏向家族團聚與許願；矮人有在雙月夜開爐鑄造重要器物的傳統，認為此夜神力餘韻最強。帝國境內宗教氛圍最濃厚的節日。
- **裂痕日**（神寂日之一，6 月末）：紀念眾神之戰與大陸分裂的哀悼日，全境禁止宣戰與簽署軍事協議，是唯一明文寫入帝國憲章的儀式性禁令。各地神殿開放，民間習俗是在裂痕日前夕修繕家中破損的器物，象徵「不讓裂痕過夜」。
- **告別日**（神寂日之一，10 月末）：紀念眾神陸續離去的哀悼時節中最重要的一天，傳說是最後一位神明沉默的日子。精靈傳統是在此日燃燒舊書信與記憶物，象徵放下；人類習俗偏向祭祖；矮人則有封閉最深層礦坑入口一日的傳統。

## 飲食

帝國飲食文化以麵食、燉煮與烘焙為骨幹，反映中部平原農業底層的穀物中心飲食結構。三族各有偏好，但城市日常飲食已高度混合。

- **人類飲食**：厚重、份量大、口味鹹香，燉肉、烤餅與根莖類蔬菜是主食圈核心。發展出以麵包為媒介的「包夾文化」，各種填料夾入不同形狀的麵包中，是街頭最常見的便食形式。
- **精靈飲食**：偏輕食、細工、講究食材原味與季節性，對辛辣與過重調味有明顯迴避傾向。正式精靈式餐宴可能持續數小時，更接近社交儀式而非單純進食。
- **矮人飲食**：以高熱量、高蛋白為核心，釀酒文化極為發達，矮人麥酒是帝國境內流通最廣的酒類之一。矮人社群有在重要場合共飲同一桶酒以示信任的傳統，拒絕共飲在矮人文化中是明確的冒犯訊號。
- **共食文化**：三族融合後，帝國城市發展出「混桌」飲食習慣。高端餐館提供三族套餐，各自保留風格但共享餐桌空間，是帝國多族共存的日常體現之一。

## 日常禮儀

- **問候**：帝國通行的正式問候是右手置於左胸、微微頷首，起源於三族聯盟簽約時設計的中性禮儀，刻意迴避任何單一族群的傳統姿勢。精靈私下場合保留古老的雙手合攏禮，矮人熟識之間習慣以拳碰肩，人類日常問候則隨意許多，點頭或揮手皆可。
- **稱謂**：精靈貴族對稱謂的敏感度遠高於人類，使用錯誤的稱謂在精靈社交圈中是明確的失禮。人類平民社群在非正式場合傾向直呼名字，這個習慣正隨著平民院地位上升而逐漸滲透進更正式場合，讓老精靈貴族頗為不適。
- **魔導裝置禮節**：在正式場合或神殿內使用個人魔導終端被視為失禮。商業場合則相對寬鬆，邊談事情邊查閱魔導終端是常見行為。
- **死亡與哀悼**：帝國通行習俗是在告別日之前完成入土或火化，遺留物由家族保管三年後方可轉讓。精靈因壽命極長，對人類友人的死亡有一套獨立的哀悼禮節，比人類習俗更為繁複且持續更長時間。

## ch001 已成立 canon

- 西邊群山下有一座依靠山產與靈泉生存的村莊，近年因山妖佔據深山而衰敗。
- 山妖以山中走獸、靈泉甚至村民為食，村莊多次討伐失敗，青壯人口與經濟來源大量流失。
- 老村長變賣一切發布最後懸賞，請來被稱為「山獵人」的大漢。
- 山獵人以獸骨尋跡、骨箭、長弓與大太刀獨自進山，在深山湖畔斬殺山妖。
```

---

## chapters/ch001.md

<!-- file_path: backend/novel_db/novel_02_random/chapters/ch001.md -->

```markdown
# 短篇一：山獵人

- `pov: 全知`
- `time: 清晨`
- `location: 西邊群山下的村莊與深山湖畔`
- `status: canon_draft`

西邊的群山下，有一個山產豐隆的村莊。

村莊這幾年少了許多人。有一隻山妖佔據了深處的大山，以山中走獸、靈泉、甚至是村民為食，村莊多次召集討伐團、發佈懸賞，但那些進入隘口的人們從未回來過，數年下來村莊失去了青壯人口與經濟來源，開始慢慢衰敗。

這是最後一次發布的懸賞，老村長已經把一切都變賣了，甚至去城裡時還騎著一頭驢子，回來時只剩陪伴多年的拐杖，還有一個看起來像熊一般的大漢，村長說他就叫山獵人。

山獵人高挑壯碩，從未整理過的長髮與鬍鬚覆蓋大部分的面容，加上一件厚重的熊皮獵裝讓他遠看就像一頭熊。他十分冷漠，聽完村長淚聲俱下的請求後只是淡淡地說了一聲好，便回到村長準備的屋子休息了。

晨霧還未散去，村長站在村口，望著那道高大的背影消失在山林之間，身後幾個村民低聲竊語，有人說這獵人要價太貴，有人說山妖豈是一個人能對付的，也有人說，就算是去送死，那副不在乎的模樣也著實讓人說不出話來。

山獵人沒有回頭。

山間小徑被晨露打濕，腳下每一步都踩得紮實。兩側雜木叢生，枝葉在薄霧中凝著細密的水珠，偶有山鳥驚起，撲翅聲在林間一閃即逝。獵人的熊皮獵裝沾了霧氣，顏色深了幾分，背上的長弓與大太刀隨著步伐輕微搖晃，發出極低沉的悶響。

他不急，也不慢。

越往上走，山路越窄，有些地方乾脆消失不見，被滾落的碎石和凸起的樹根取代。尋常人走到這裡，早已氣喘吁吁、腳步凌亂，但獵人只是微微低頭，抬腿，跨過，繼續向上，像是這片山對他來說，不過是熟悉的老路。

空氣漸漸變了。

越靠近山腰，靈氣愈發濃稠，混著潮濕的泥土氣息和某種說不清的腥甜，鑽進鼻腔、貼著皮膚，像是什麼看不見的東西在慢慢滲透進來。山鳥銷聲匿跡，蟲鳴也停了，四周只剩風穿過松針的細碎聲響。獵人停下腳步，抬起頭，透過交錯的枝葉縫隙，遠遠望向更深處的山脊。

他從懷裡取出一小塊獸骨，在拇指上輕輕一劃，血珠滲出，隨即被骨頭緩緩吸乾，骨頭的紋路泛起一絲微弱的暗光，指向西北方。

他收起骨頭，調整了一下肩上太刀的位置，轉向西北，繼續走。

群山在這裡讓出了一片空曠。

湖泊靜靜臥在山坳之間，四面是嶙峋的岩壁與墨綠的密林，湖面平得像一塊磨光的石板，倒映著蒼白的晨空。靈氣在此匯聚成形，連水面都透著輕微的光澤，像是壓著什麼東西浮在下面。

山妖就在湖邊。

牠俯身在水中飲水，體型龐大得幾乎荒謬，脊背高聳，一塊凸起的肌肉便有山石那般大，渾身覆著錯落的暗褐色硬甲，縫隙間長出稀疏粗硬的毛束，隨著呼吸緩緩起伏。每一口飲下，湖面便漾起一圈沉重的漣漪，四周的碎石隨著牠喉嚨吞動而輕微顫抖，像是大地被迫在配合牠的節奏呼吸。

兩隻混濁的黃眼深陷在頭骨之中，半睜著，懶散且傲慢。

獵人從林緣無聲掠出，落上湖畔的一塊凸岩。岩石微微一沉，靴底穩穩貼住表面，他半蹲，身形幾乎與背後的岩壁融為一體，只有那雙眼睛，靜靜落在山妖的左眼上。

摘弓，搭箭。

那支骨箭與尋常箭矢不同，箭身泛著枯黃，雕著細密的刻紋，箭頭由獸骨磨成，尖銳得反光，帶著一股說不清的沉甸。他的右手扣弦，緩緩後拉，弓身彎至極限，弓弦繃出一道沉默的弧度，嗡地顫著極低的聲音。

吸氣。靜止。

世界在這一刻安靜下來。

箭離弦。

聲音不大，卻快得幾乎不可見，空氣被剖開一道細線，正中山妖左眼眼窩深處。

山妖發出一聲震徹山谷的嚎叫，那聲音不像痛苦，更像是憤怒與不可置信的混合，牠從未受過傷，更不曾有什麼東西膽敢靠近牠至此。牠猛地後仰，龐大的身軀砸進湖中，掀起數丈高的水柱，湖底的淤泥與石塊隨著衝擊翻湧而出，水聲轟隆如悶雷，山壁上的碎石嘩啦啦滾落，幾棵老松被震得搖搖欲墜。

大地在顫。

獵人已經動了。

他從岩石躍下的同時，右手已握住了太刀刀柄，腳踩碎石仍步步穩實，身形順著下坡的衝力加速，黑灰的長髮被氣流揚起。太刀出鞘，刀身在晨光中一閃，他扛刀上肩，借著俯衝之勢徑直殺向山妖的脖頸。

牠察覺了。

混濁的右眼倏地睜開，長滿硬毛的巨手橫掃而來，帶著一道沉悶的破風聲，那力道足以將一堵石牆拍成碎礫。獵人沒有硬接，刀鋒在接觸的前一瞬微微側傾，借著那股橫掃的力道，整個人被拋了出去，在空中旋半圈，輕巧落上湖邊一棵老松的粗枝，樹枝劇烈搖晃，松針紛紛落下。

山妖轉身，對著那個小小的身影發出低沉的嘶吼，口中涎液滴落，在地面砸出一個個冒著熱氣的凹洞。

獵人從樹上躍下，這次沒有朝頭部去，腳尖點地即起，徑直殺向山妖的下盤。

山妖舉拳砸下，一拳，兩拳，三拳，每一拳落地都是一個深坑，碎石崩飛，地面開裂出一道道放射狀的裂縫。獵人在那一片混亂之中左右閃挪，腳步沒有半分停頓，像水流過石頭一般繞過每一次砸擊，靴底踏過裂縫邊緣，借著地面的高低起伏輕巧換向，始終保持著向前的衝力。

刀光劃過。

腳踝處，硬甲的縫隙，刀鋒精準插入，深深劃進脆弱的筋腱。

山妖一聲慘嚎，右腿膝蓋重重砸地，大地劇烈震顫，山壁上的碎石成片崩落，轟然砸進湖中，水柱再度沖天而起。牠揮手想抓住那個如跳蚤般的東西，掌心張開，俯身壓來。

獵人腳踩牠的指背，順勢借力一躍，落上了那隻手的手腕。

地面遠在數十尺之下。

他沒有停下。

沿著手臂奔跑，皮革靴底踩在堅硬的甲殼上發出急促的悶響，山妖另一隻手狠狠拍來，獵人側身俯低，那隻巨手從頭頂掠過，帶起的氣流將他的長髮猛地掃向一側。再一拳，他矮身一蹲，拳風從肩上颳過，借著那股氣流向前衝刺，加速。

山妖低吼，喉嚨在眼前張合，那道傷著牠的小東西，正向牠衝來。

牠第一次感到某種說不清楚的東西。

刀出。

乾淨，精準，沒有多餘的力氣，只有那一道恰到好處的弧線，劃過山妖喉嚨最脆弱的地方。

嘶的一聲，輕得像一道裂帛。

山妖站在那裡，停了片刻，像是還沒弄清楚發生了什麼事。

然後，那顆小屋般大小的頭顱，緩緩傾斜，轟然落地。

聲音在群山之間迴盪，一遍，又一遍，驚起不知何處潛伏的鳥群，遮天蔽日地衝向天空。湖面在巨響中蕩起一圈圈難以平息的漣漪，靈氣失去了依附，悄悄散入空氣。

獵人落地，單膝半跪吸收衝力，站起，低頭，從腰間取出一塊粗布，緩緩拭去刀身上的血跡，收刀入鞘。

他看都沒看那顆頭顱一眼，轉身，沿著來時的方向走回林中。

晨霧尚未完全散去，山澗的水聲遠遠傳來，清冽如昨。
```

---

## chapters/ch002.md

<!-- file_path: backend/novel_db/novel_02_random/chapters/ch002.md -->

```markdown
# 艾瑟蘭皇室的一天

* ` - 盟約曆 2256 年 10 月 1 日，週三`

清晨五點，皇宮深處的鐘聲準時響起。

第一聲落下時，六扇房門外的老管家同時抬手，叩門。

聲音不重，卻沒有任何商量餘地。

艾瑟蘭家族年輕一代的六位皇子與皇女，在同一刻被從睡夢裡喚醒。他們都還很年輕，五十到六十歲之間，若換算成人類，不過十二至十五歲。精靈的少年期漫長而安靜，可皇室的少年期並不寬容。

侍從們魚貫而入，拉開厚重窗簾。

天尚未亮透，舊皇宮的石牆仍浸在冷灰色晨光裡。銀色魔導導管沿著窗框內側微微發亮，像埋在牆中的細長星脈。有人坐在床邊發呆，有人閉著眼任由侍從梳髮，有人已經伸手去拿昨晚未讀完的書，卻被女僕沉默地收走。

盥洗，束髮，整理衣領，扣上家族徽章。

一切都很快。

因為他們離開房門後的第一件事，從來不是用餐。

而是占星室。

這是艾瑟蘭家族維持了萬年的傳統。

在這個家族裡，清晨不是由太陽開始，而是由星象開始。

六人穿過長廊時，腳步聲在石地上輕輕迴響。壁面浮雕刻著古老星圖，主月、副月、日宮與早已沉默的神明，被雕成不會老去的圖案，冷冷俯視著一代又一代走過此處的孩子。

占星室位於皇宮東翼最高處。

圓頂尚暗，穹頂上嵌滿細小魔晶，模擬夜空未散前最後一刻的星位。台上的老博士已經站在那裡，手裡捧著一卷長得過分的星象紀錄，指節瘦得像乾枯樹枝，聲音微微發顫。

「盟約曆二二五六年，十月一日，週三。主月偏西，副月入第三宮，昨夜無碎片脫軌記錄。北境觀測站回報，星流短暫偏移，尚不足以判定為凶兆……」

台下六人站成一排。

長子精神清醒，背脊挺直，像已經準備好把每個字都記進腦中。

次女低著頭，睫毛垂下，表面安靜，實則正努力不要睡著。

第三位皇子偷偷打了個呵欠，被身後老管家看了一眼，立刻收回下巴。

最年幼的皇女還帶著剛醒的茫然，雙手攏在袖中，望著穹頂上緩慢移動的星點，像在看一場與自己無關的夢。

老博士繼續報告。

他說星象，說日宮軌跡，說副月亮度，說帝國北方的觀測異常，說舊星落曆與今日盟約曆的對應日期。

六位皇子皇女聽著。

有的人聽見未來。

有的人只聽見飢餓。

老管家站在後方，沒有出聲。

他只是看著。

他看過他們的父輩也這樣站在台下，看過更早一代的皇室少年在同一個清晨裡打瞌睡、犯錯、被糾正，最後長成可以在貴族院中微笑說謊的人。

六點整，星象簡報結束。

老博士合上卷軸，六位皇子皇女右手置於左胸，微微頷首。

禮儀完成後，他們才被允許前往飯廳。

早餐很冷，也很輕。

薄片烘焙麵包、冷製果物、少量乳酪，以及一杯熱花草茶。餐具銀白，瓷盤乾淨得近乎冷淡。桌上沒有多餘談笑，只有刀叉輕碰盤面的細聲。

年紀最小的皇女小聲問能不能多一片麵包。

侍從沒有立刻回答。

坐在主位旁的老管家看了她一眼，終究點了頭。

她於是低頭吃得很慢，像那片麵包是整個早晨唯一溫柔的東西。

上午是理論學習課。

今日課程為《魔導科技發展應用史論》。

講師從艾爾諾專程而來，是一名資深教授，衣領高而整齊，聲音乾燥，像翻頁時被紙張刮出的聲響。他站在講堂前，身後浮起一整面魔導投影。

從早期魔晶燃料，到空間魔法傳輸。

從矮人工業骨架，到精靈理論模型。

從平民魔導終端普及，到帝國城市夜間藍白光帶的形成。

六位皇子皇女坐在長桌後方，面前攤著筆記本。

他們不能只知道皇宮裡的燈如何亮起。

他們必須知道那盞燈背後是哪一座礦山、哪一個矮人工會、哪一條法案、哪一次貴族院妥協。

帝國不是靠王冠運轉的。

帝國靠制度運轉。

而皇室必須比任何人都更早明白這件事。

十二點，見習午宴開始。

這不是休息。

只是換一種方式上課。

今日他們陪同一名艾瑟蘭家族旁系公爵，接見城市工程技師公會代表。午宴設在南側小宴廳，窗外可見皇宮廣場一角，遠處新城區的銀白色高樓在正午日光下像一排無聲的刀。

菜餚比早餐豐盛。

但六位皇子皇女都知道，真正要吞下去的不是食物。

是談判。

公爵坐在主位，神情溫和，語氣平穩。他與技師公會代表討論明年的法律制度規劃，也討論技師福利制度的勞資調解。代表們措辭謹慎，偶爾抬眼看向坐在旁側的年輕皇室成員。

那些孩子很安靜。

安靜地聽工時、薪資、事故責任、魔導建設維修風險。

安靜地看一名工程師在談到高空管線墜落事故時，手指短暫收緊。

安靜地明白，首都夜裡那些漂亮的藍白燈光，不是自己亮起來的。

有人在高處維修。

有人在地下鋪管。

有人被法案保護。

也有人還沒有。

下午兩點，戶外課程開始。

皇宮北側訓練場的地面由白石與深色金屬嵌合而成，四周立著防護用魔導柱。皇家騎士團副團長已經等在場中，披風未動，手裡握著訓練用長劍。

在這裡，皇子與皇女沒有差別。

劍不會因為對手是女孩就放慢。

箭不會因為對手是弟弟就轉彎。

防護魔法亮起時，六人各自站定。

有人選劍，有人選短槍，有人偏好魔導弓，也有人乾脆放棄武器，先練防禦陣式。

副團長不稱讚，也不安慰。

摔倒了就起來。

手震了就握緊。

怕痛就記住痛從哪裡來。

兩名皇女在場中央交手，劍身相擊，發出清脆震響。年長的那位攻勢凌厲，步伐乾淨；年幼的那位被逼得連退三步，卻在第四步時忽然壓低身形，從對方手腕下方切入，逼出一次漂亮的反擊。

旁邊的皇子們停了一瞬。

副團長冷冷道：「看什麼？下一組。」

沒有人再笑。

汗水順著額角滑下，落進衣領。

白石地面被鞋底磨出細痕。

在艾瑟蘭家族，優雅不是免於戰鬥。

優雅是即使被擊倒，也知道如何站起來，並且不讓恐懼先於身體暴露。

十八點，夕陽準備西下。

訓練結束後，六人換下濕透的衣物，重新整理儀容，來到皇宮西側陽台。

這是一天裡少數不被課表切割的時間。

夕陽灑向新城區，餘暉落在一棟棟銀白色外牆上，金光被反射、折疊、推遠，最後鋪滿整座首都。魔導管線在建築立面上微微發亮，藍白光尚未完全接手夜晚，金色仍停在城市肩頭。

整座艾瑟蘭像一座巨大的寶藏。

也像一個太重的承諾。

六位皇子皇女靠在陽台邊聊天。

有人抱怨教授的課太長。

有人模仿老博士顫抖的聲音，被老管家遠遠瞥了一眼後立刻閉嘴。

有人說午宴上的技師代表其實很緊張。

有人說副團長今天明明放水了。

「沒有。」長子說。

「有。」次女立刻反駁。

於是他們短暫地像普通孩子一樣爭論起來。

沒有貴族院，沒有平民院，沒有精靈與人類的權力重組，沒有北境陰影，也沒有黑暗次元正在遠方滲透。

只有夕陽。

只有風。

只有六個還沒完全長大的孩子，在皇宮陽台上偷來的一小段傍晚。

皇族內部不強制晚餐。

夜晚屬於個人。

有人回書房繼續挑燈夜讀，桌上攤著厚重的魔導史與法律文本。

有人在小型練習室裡重新練下午失敗的劍招，一遍，又一遍。

有人去音樂室彈琴，琴聲隔著長廊傳出，清冷而斷續。

有人坐在窗邊看月亮，主月殘破的銀白光芒落在臉上，副月淡藍紫的影子貼著窗框，像另一個尚未醒來的神明。

老管家巡過長廊。

一間一間看過去。

他沒有催促。

他知道這些夜晚會結束。

再過幾十年，這些孩子會被送上議席、邊境、外交宴會與政治婚約。他們會學會說更漂亮的話，也會學會不在不該難過的時候難過。

所以今晚，能多讀一頁書，能多彈一段琴，能多看一會兒月亮，都可以。

二十三點，皇宮內部鐘聲響起。

第一聲沉穩。

第二聲悠長。

第三聲落下時，主要幹道上的魔導燈開始一盞接一盞熄滅。

藍白光從遠處退去。

長廊暗下來，庭院暗下來，皇宮廣場暗下來。

舊城區重新回到它克制而安靜的夜裡。

六位皇子皇女的房門陸續關上。

最後一名侍從吹熄壁燈，老管家站在走廊盡頭，確認所有門縫都歸於黑暗。

皇宮終於安靜。

可艾瑟蘭不曾真正睡去。

在石牆之內，星象紀錄已經被送往明晨的占星室。

在新城區，最後一條魔導管線仍低低發熱。

在遠方北境，不知名的風正越過無人看守的山脊。

明日五點，鐘聲還會響起。

而他們仍會醒來。

像艾瑟蘭家族萬年來所有年輕的孩子一樣，在還沒完全懂得帝國之前，就先學會承受帝國。
```

---

## chapters/ch003.md

<!-- file_path: backend/novel_db/novel_02_random/chapters/ch003.md -->

```markdown
## 空騎團內部回顧報告

**檔案編號**：SKR-2254-0101-NF-08/13
**建檔時間**：盟約曆 2254 年 1 月 1 日
**保密等級**：B
**任務性質**：偵查任務，附帶條件式救援權限
**參與成員**：第八小隊、第十三小隊
**委託者**：艾瑟蘭帝國北方要塞第三軍團
**任務地點**：艾瑟蘭帝國北方要塞隘口西北三十公里處
**主要目標**：偵查近期出現之魔族聚落情報，確認失蹤巡邏隊現況
**附帶授權**：若情況允許，可就地轉為救援任務
**任務結果**：偵查任務轉為救援任務。失蹤巡邏隊救援成功。第一梯隊生還人員撤離成功。敵方前線施法單位遭擊殺。疑似冰魔臨時聚落位置已確認。

**特記事項**：
本次任務中，第八小隊成員艾拉·芙萊爾於第一梯隊受伏擊、空中支援單位折損、通訊短暫混亂之情況下，仍完成敵方施法單位壓制、救援訊號發送、受困巡邏隊位置確認與撤離路線引導。其行動被列為本次救援成功之主要轉折點。

---

## 一、任務背景

盟約曆二二五三年十二月二十六日，空騎團接獲北方要塞第三軍團緊急委託。

帝國北方要塞一支十二人巡邏隊於隘口西北方向失聯。失聯前最後一次回報提及「低溫異常」、「白霧不隨風移動」與「遠處疑似出現人工營火」。其後通訊中斷。

北方要塞長期與盤踞於北境深處的冰魔勢力對峙。近期邊境壓力上升，第三軍團主力被牽制於正面防線，無法抽調足夠偵查人手深入西北區域，遂委託空騎團協助偵查。

當時距離任務地點最近的空騎團單位有二。

其一為駐紮於北方要塞外圍補給平台的第十三小隊。

其二為正在北方大城修整的第八小隊。

第八小隊當時包含正式騎士艾拉·芙萊爾。

她不是隊長。

不是主攻手。

也不是這次行動最資深的人。

她在第一梯隊中的任務，是側翼支援與記錄。

換言之，她應該跟著領隊飛，記下看到的一切，在需要時補位，在不需要時保持安靜。

那是她在任務簡報中被分配到的位置。

也是這份報告中，最早被劃掉的判斷。

---

## 二、行動開始

盟約曆二二五三年十二月三十日，二十一時整。

第一梯隊藉夜色出發。

北方的夜空很低。

風從雪原盡頭壓過來，冷得像一把沒有開刃的刀，慢慢抵住人的骨頭。遠方要塞的燈火被拋在身後，逐漸縮成一排昏黃光點。

七具微型魔導飛行器壓低高度，沿山脊陰影向西北推進。

艾拉·芙萊爾飛在側翼。

她把頭髮束得很緊，護目鏡扣在額前，身上的空騎制服被寒風壓得貼住肩線。記錄儀固定在左側肩甲下方，晶片低低發亮，將前方黑暗、風速、溫度與魔力濃度逐一記下。

她很年輕。

年輕到隊裡的人有時會叫她「小妹」。

可她飛得很穩。

飛行器在她手中不像機械，更像某種願意聽話的活物。她能在風切改變前半秒壓低重心，也能在山壁陰影突然逼近時，毫不猶豫地偏轉三度，讓整具飛行器貼著岩面滑過去。

通訊頻道裡，領隊低聲下令。

「保持隊形。不要開高亮。記錄手，持續回報。」

艾拉看了一眼儀表。

「風速穩定。魔力濃度比上一段高。溫度下降得不自然。」

「幅度？」

「七分鐘內下降十一度。」

頻道裡安靜了一瞬。

冰魔活動區。

這是所有人心裡同時浮出的答案。

沒有人說出口。

他們繼續前進。

雪地在下方展開，白得沒有邊界。偶爾有裸露的黑色岩脊從雪層間刺出，像巨獸死後露出的骨頭。夜色壓住一切，連月光都顯得冰冷。

二十二時四十七分，艾拉首先發現了異常。

是雪面上的折痕。

在一處背風坡下方，雪地被某種規律移動壓出痕跡，痕跡不深，卻異常整齊。旁邊有幾處被刻意掩埋過的灰燼，還有半截凍硬的繩索露出雪面。

她立刻通報。

「九點鐘方向，坡下有營地痕跡。不是自然形成。」

領隊下令盤旋確認。

飛行器群在夜色中無聲散開。艾拉壓低高度，讓記錄儀掃過地表。營地很小，看起來像臨時棄置，沒有明顯生命反應，沒有火，沒有活動物體。

太乾淨了。

乾淨得像是故意留給他們看的。

艾拉盯著雪面，眉頭慢慢皺起。

「隊長，這裡不對。」

「說。」

「如果他們撤得這麼急，不會把灰燼埋得這麼平。這不像逃離，像整理。」

領隊沒有立刻回答。

幾秒後，他仍然下達降落搜索命令。

第一梯隊五人降落。

艾拉與另外兩名隊友留空支援。

這是當時依規程最合理的判斷。

也是伏擊開始前，最後一個完整命令。

---

## 三、伏擊

五名隊員落地後，雪原安靜了大約十四秒。

第十五秒，營地中央的雪層裂開。

白霧從地下噴出，像被壓抑已久的呼吸。

接著是冰槍。

不是一支。

是數十支。

它們從雪下、岩後、斜坡背面同時刺出，藍白色魔法光在夜色裡暴亮。第一名落地隊員還沒來得及展開防護，胸口就被冰槍貫穿，整個人被釘在後方岩壁上。

第二人翻滾避開，左腿仍被冰刃切開。

第三人發出警報。

「遭伏擊！敵襲！冰魔——」

聲音被爆炸切斷。

空中支援同時遭到攻擊。

兩道冰系魔法從側後方山壁射出，準確命中高處盤旋的飛行器。艾拉右側的隊友連人帶機被冰霜覆住，飛行器核心在半空中熄滅，直直墜向雪原。

另一名隊友試圖拉升，被第二道冰矛擊中燃料槽。

爆光在夜色中炸開。

很短。

短得像有人在黑暗裡眨了一下眼。

然後他們就不見了。

艾拉聽見自己呼吸停了一拍。

通訊頻道裡全是雜音。

落地隊員在喊。

有人在咳血。

有人要求撤離。

有人叫她名字。

「艾拉！拉高！拉高！」

她沒有拉高。

冰霧翻湧，地面有至少十七個敵方反應。坡後兩名冰魔施法者正在重新凝聚法陣。落地隊員被壓在營地中央，退路被封。若空中支援完全撤出，地面五人會在一分鐘內死亡。

艾拉的手指握緊操縱桿。

她看見其中一名冰魔法師抬頭。

那張臉在冰霧裡泛著淡紫色，眼睛冷得沒有半點情緒。它的手掌正對準地面傷員，第二輪冰槍即將成形。

艾拉俯衝。

不是標準支援角度。

太低。

太快。

幾乎是自殺。

她讓飛行器貼著雪坡斜切下去，右側機翼邊緣擦過岩面，爆出一串短促火星。冰魔法師轉向她，冰刃在空中展開，像一面忽然張開的白色扇骨。

艾拉沒有避開。

她壓低機身，從冰刃下方鑽過去。

風聲炸進耳中。

視野被雪粉填滿。

她在距離地面不到三尺的位置強行翻轉飛行器，機腹幾乎貼著雪面滑行，右手扣下側翼短炮。

第一發偏了。

第二發命中法陣邊緣。

第三發擊穿冰魔法師的肩口。

那名冰魔踉蹌後退，法陣崩散。

艾拉沒有停。

她從對方身側掠過，左手拔出固定在飛行器旁的短刃，借機身速度一刀劃過它的喉嚨。

血是深藍色的。

冰魔法師倒下時，另一名施法者已經完成轉向。

艾拉聽見警報尖叫。

飛行器表面溫度驟降。

她知道自己被鎖定了。

她也知道，自己不可能直線逃掉。

於是她向下。

向雪地更低的地方。

她把飛行器壓進營地中央翻湧的白霧裡，幾乎與地面隊員擦肩而過。落地隊員震驚地抬頭，只看見她的機尾燈在霧中一閃而逝。

冰魔法術追著她落下。

她等的就是這個。

在冰槍群刺入白霧前一瞬，艾拉猛地拉升。

冰槍穿過她剛才的位置，狠狠砸進營地中央，卻也切斷了敵方布置在雪下的一部分冰霜束縛陣。

地面隊員身上的壓制鬆動。

「走！」艾拉在頻道裡喊，「現在！」

她的聲音發抖。

但命令很清楚。

---

## 四、發現巡邏隊

支援訊號是在二十二時五十三分發出的。

按理說，記錄手不應在未經領隊確認下改變任務優先級。

但那時領隊重傷，副領隊失去通訊，空中支援僅剩艾拉一人。

她沒有時間等命令回來。

她發出最高強度支援信號，同時標記敵方伏擊點、施法單位位置與可疑地下空洞反應。

就在那一次低空迴旋中，她看見了另一組痕跡。

營地西北側的雪丘後方，有一排極淡的拖行印。

艾拉轉向。

身後冰刃追來。

她貼著地面穿過兩塊岩石之間的窄縫，飛行器外殼被削掉一層金屬，整個機身劇烈震動。她咬住牙，沒有回頭。

雪丘後方是一處半塌的岩洞。

洞口被冰層封住，只留下一道極細縫隙。縫隙裡有光。

很弱。

像快死的魔導燈。

艾拉立刻切換記錄儀焦距。

她看見裡面有人。

帝國軍制服，是巡邏隊。

他們還活著。

「發現巡邏隊。」她說，「座標已標記。重複，發現巡邏隊，仍有生還者。」

通訊那頭雜音很重。

過了兩秒，才有人回應。

是第十三小隊後方支援。

「芙萊爾，確認？」

艾拉繞過洞口，第二次掃描。

「確認。至少七人生還，兩人無反應。洞口被冰層封死，需要破障。」

「你現在的位置太靠前，撤回等支援。」

艾拉看著雷達。

敵方正在回收包圍圈。

落地隊員還沒完全撤出。

巡邏隊被困在洞內。

如果她撤，冰魔會在支援抵達前處理掉所有證據。

包括活人。

她吸了一口氣。

「我會標亮洞口。請支援隊直接打我的標記。」

「芙萊爾，不准——」

她切入低空。

飛行器拖著受損尾翼，在岩洞前方劃過一道極亮的魔導標記。那道光貼著冰層燃起，像在黑夜裡割出一道傷口。

冰魔注意到了她。

全部。

十幾道視線從雪原各處轉來。

艾拉忽然覺得很安靜。

不是外面安靜。

她知道自己正在做一件很可能會死的事。

也知道如果現在沒有人去做，洞裡的人就真的會死。

所以她又飛了一圈。

第二道標記。

第三道標記。

冰層開始鬆動。

支援隊的遠程炮擊終於抵達。

第一發落在洞口右側，第二發擊中標記中央，冰層炸開。

白霧與碎冰向外噴出，洞內傳來人聲。

那一刻，艾拉沒有笑。

支援隊還需要時間。

於是她替他們買時間。

---

## 五、撤離

後續戰鬥持續了二十一分鐘。

正式報告中，這二十一分鐘被壓縮成四行文字。

「艾拉·芙萊爾持續進行低空牽制。」

「敵方施法火力被迫轉向。」

「第十三小隊支援抵達後，完成洞口破障。」

「受困巡邏隊與第一梯隊生還人員撤離。」

但記錄儀留下了更完整的東西。

它記下艾拉受損飛行器每一次不合理的轉向。

記下警報聲從未停止。

記下她在左翼失衡後，用手動模式硬拖著機身擦過雪坡。

記下她在第三次遭冰霜法術命中後，右手短暫失去知覺，仍然用左手完成拉升。

記下她一共七次從敵方施法單位前方掠過。

每一次都低得不像飛行。

更像墜落。

只是她始終沒有真正落下去。

她把敵人的視線從傷員身上奪走。

把法術從洞口前方引開。

把自己變成雪原上唯一必須先被擊落的目標。

第十三小隊抵達時，看見的就是那樣的畫面。

一具幾乎報廢的微型魔導飛行器，拖著斷裂的尾焰，在雪霧與冰槍之間穿行。它不再漂亮，也不再穩定，外殼滿是裂痕，左側推進器忽明忽暗。

可它還在飛。

艾拉還在飛。

直到最後一名巡邏隊員被拖上救援飛行器，直到第一梯隊重傷員完成固定，直到支援隊長在頻道裡喊出撤離完成，她才終於拉高。

那時她的視野已經開始發黑。

失血，低溫，魔力震盪，飛行器反噬，每一項都足以讓她墜落。

她卻仍然問了一句：

「人齊了嗎？」

頻道裡有人回答。

「齊了。」

艾拉沉默了半秒。

然後她說：

「那我回來了。」

飛行器在下一秒失去平衡。

它像一隻折翼的鳥，從北方夜空斜斜墜下。

支援隊在半空接住了她。

---

## 六、任務結果

本次任務最終確認，失蹤巡邏隊十二人中，七人生還，兩人死亡，三人失蹤後確認遭敵方轉移，後續追蹤未果。

第一梯隊七人中，兩名空中支援成員陣亡，兩名落地隊員重傷，一名輕傷，兩名保有行動能力。

敵方確認包含冰魔施法者至少二名，其中一名由艾拉·芙萊爾擊殺，另一名於支援隊抵達後撤離。現場另有多名魔化類基層戰力活動痕跡，疑似為冰魔前線臨時聚落或誘捕據點。

任務原定目標為偵查。

最終結果為偵查成功，並附帶救援成功。

若無艾拉·芙萊爾於伏擊發生後立即破壞敵方施法節奏、發送支援訊號、確認巡邏隊位置並持續牽制敵方火力，第一梯隊與失蹤巡邏隊生還機率將顯著降低。

---

## 七、內部評語節錄

**第八小隊隊長評語：**

艾拉·芙萊爾在本次任務中多次違反常規安全距離，但所有違規行動皆建立於現場判斷與救援必要性之上。她不是沒有恐懼，而是在恐懼中仍能判斷下一步。這點比單純的勇敢更重要。

**第十三小隊支援隊長評語：**

她把一具受損飛行器飛成了整支小隊的防線。這不是訓練可以教出來的東西。

**北方要塞第三軍團回函節錄：**

若空騎團未即時轉為救援，本軍團失蹤巡邏隊將無人生還。第三軍團對第八小隊、第十三小隊及艾拉·芙萊爾騎士表達正式謝意。

---

## 八、後續建議

一、建議授予艾拉·芙萊爾一級任務功績紀錄。
二、建議將其列入高機動偵查人才觀察名單。
三、建議安排心理評估與傷後飛行穩定性測試。
四、建議未來涉及高風險異常地帶、失蹤人員定位、敵方誘捕判讀之任務，可優先考慮其參與。
五、備註：此建議不代表可忽視其年齡與資歷限制。該員具高度天賦，但仍需資深成員約束與導引。

---

報告最後一頁，沒有寫她醒來後的事。

沒有寫她在醫療艙裡睜眼時，第一句話仍是問巡邏隊有沒有活下來。

沒有寫第八小隊剩下的人在門外站了很久，沒有人進去，也沒有人離開。

沒有寫她知道兩名隊友死亡後，安靜了整整一天。

檔案只記錄結果。

因為空騎團是騎士團。

騎士團不會把眼淚寫進報告。

但從那天之後，艾拉·芙萊爾這個名字，第一次被送進了特別調查組的候選名單。

不是因為她飛得快。

空騎團裡從不缺飛得快的人。

而是她知道自己該往哪裡飛。
```

---

## chapters/ch004-1.md

<!-- file_path: backend/novel_db/novel_02_random/chapters/ch004-1.md -->

```markdown
# ch004-1：艾爾諾老師總是神秘又強大

- `pov: 少年`
- `time: 傍晚前後`
- `location: 帝國北上道路 / 黑石城`
- `status: canon_draft`

艾爾諾老師總是神秘又強大。

這是我離開帝都之後，第三十七次如此確信。

「謝謝大師拯救我們的村莊！」

老村長跪在路邊時，聲音幾乎帶著哭腔。他身後擠著一群衣衫沾滿泥土的村民，有人抱著孩子，有人扶著受傷的親人，更多人只是站在那裡，望著道路旁那片被燒成灰黑色的腐植林，像還不敢相信自己真的活了下來。

而老師只是站在車道中央，黑色長髮被北方乾冷的風吹得微微揚起。

她沒有穿宮廷法師常見的繁複長袍，只在深色外衣外披了一件旅行用的短斗篷，腰間掛著一支細長魔杖，袖口沒有一點焦痕，靴底甚至沒有沾上太多泥。若不是地上還殘留著剛才魔法轟擊後的溫熱痕跡，她看上去簡直不像剛剛獨自解決了一整片被黑暗能量侵蝕的森林。

「不用謝我。」老師說，「向公會付過委託費就行。」

老村長愣了一下，連忙點頭。

我站在她身後，努力讓自己的表情看起來像一名合格的弟子，而不是一個正在心裡尖叫的人。

這就是艾爾諾老師。

帝國宮廷榮譽法師。

也是那一眾頭髮銀白、金色、淡褐或帶著精靈血統光澤的榮譽法師之中，唯一的黑髮，最年輕，最不像傳統宮廷法師，卻也是我見過最讓人看不透的人。

從帝都一路向北，魔物變得越來越多。

起初只是被黑暗能量吸引的野獸，後來是失去理智的腐獸，再往北，連村民口中幾十年沒出現過的魔化植物都開始在道路附近蔓延。商隊減少，驛站的燈也比南方暗得多，許多村鎮一到下午就急著關門，像夜晚不是自然降臨，而是某種會從地平線上爬過來的東西。

可老師總能在抬手之間消滅一切。

她有時連咒語都不念。

只是抬手，指尖亮起一點星光。

然後那些會讓冒險者小隊緊張半天的怪物，就像被世界本身抹除了一樣，無聲無息地消失，只留下風、泥土，以及旁人還沒來得及發出的驚呼。

強大。

神秘。

「啪！」

後腦勺忽然被敲了一下。

我整個人差點向前栽出去。

「發什麼呆。」老師的聲音從旁邊飄來，「再不吟唱咒語，目標要跑了。」

「啊！是！老師！」

我這才猛地回神。

前方荒草坡上，一群魔狼正沿著乾涸河床遊蕩。牠們比普通狼大了一圈，皮毛灰黑，肋骨處有幾道不自然的隆起，嘴角垂著黏稠唾液。牠們還沒有完全腐化，至少眼睛仍然保留著生物該有的混濁黃色，行動也還算有規律。

二十三隻。

我在心裡數了一遍。

老師沒有出手，只是站在旁邊看著我。

那比被魔狼盯著還可怕。

我深吸一口氣，握緊魔杖。

杖身的魔晶微微發熱，貼著掌心傳來穩定的震動。魔力從胸口深處被牽引出來，沿著手臂流向指尖，又經由杖芯中刻好的導引陣式被梳理、壓縮、分流。我把意識放出去，像在黑暗中拉開二十三條細線，分別扣住每一隻魔狼頭顱後方最脆弱的位置。

咒文不能急。

老師說過，越是熟悉的魔法越不能急，因為熟悉會讓人自以為準確。

我開口。

「連接天與地的靈啊，聆聽我的請求、我的召喚，傳導、生滅、發光。以破碎風暴之冠為誓，以蒼藍雷火之脈為引，我喚醒撕裂黑夜的制裁——」

杖尖亮起。

細小的電光在空氣中蜿蜒，如同被驚醒的藍白色小蛇，沿著我預先定位好的二十三條路徑同時竄出。

「雷霆之鏈！」

下一瞬，荒草坡上閃過二十三道微光。

雷霆像針一樣刺入魔狼頭顱，在牠們發出嚎叫前就切斷了神經與意識。二十三隻魔狼幾乎同時倒下，身體抽動了幾下，便沉沉壓進枯草裡。

我鬆了一口氣。

這次應該不錯。

至少沒有炸掉半個山坡，也沒有把地面打出焦坑，更沒有像上次那樣讓老師站在原地沉默三秒，然後問我是不是對道路本身有什麼仇。

老師走到我身邊，視線掃過那些倒地的魔狼。

「不錯。」她說。

我的背脊立刻挺直。

「沒什麼浪費。二十三隻魔狼，每一絲雷霆都精準擊中大腦，生物學學得很好。」

我還沒來得及高興，她的語氣就淡了下去。

「但黑魔法緒論，倒是還了不少給我。」

我愣住。

就在老師說話的同時，荒草坡上傳來一陣濕黏的骨節聲。

第一隻魔狼重新站了起來。

接著是第二隻。

第三隻。

二十三具本該死去的身體像被看不見的線拉起，四肢僵硬地撐住地面。牠們的頭顱仍歪斜著，眼眶裡的混濁黃光一點點熄滅，取而代之的是漆黑到不反光的深色。紫黑色煙霧從牠們的毛皮縫隙間滲出，沿著脊背緩慢翻湧。

我下意識後退半步。

老師沒有動。

「被黑暗能量侵蝕的生物，不用大腦也可以行動。」她說，「牠們的神經系統已經不是唯一的行動中樞。黑暗能量會在肉體裡重建一套非常粗糙，但足夠驅動殺戮本能的迴路。」

二十三雙漆黑的眼睛同時轉向我們。

那一瞬間，我覺得荒草坡上的風都冷了下來。

「如果是在快速戰鬥中，這種誤判能害死你。」

魔狼張開嘴。

牠們還未發出怒吼，老師已經輕輕抬起左手。

沒有咒語。

沒有魔杖。

只有一片奇異的星光自她掌心擴散出去。

那不是我熟悉的任何屬性魔法。它不像火，也不像風，不像雷，不像水，更不像學院裡教授們會在投影板上拆解的標準術式。那片光芒很安靜，像夜空倒扣下來，又像無數細小星屑在同一刻睜開眼睛。

星光覆蓋全場。

二十三隻魔狼同時僵住。

下一瞬，牠們消失了。

不是被燒毀，不是被切碎，也不是被傳送走。

而是像某種從未應該存在於這裡的污點，被世界輕輕擦掉。草葉仍在原處搖晃，泥土沒有被翻開，空氣裡甚至沒有留下焦味。只有淡淡的紫黑煙霧在星光裡消散，像被吞沒進看不見的深處。

我張了張嘴。

老師放下手。

「走吧。」她說，「下次再練習。要在日落之前到達下一個城鎮。」

我看著她的背影，連忙追上去。

「老師，剛才那是什麼魔法？」

「等你黑魔法緒論不會考七十一分的時候再問。」

「七十一分明明及格了！」

「所以你現在還活著。」

我閉嘴了。

非常有道理。

而且完全無法反駁。

黑石城在傍晚時出現在道路盡頭。

那是一座相當熱鬧的礦業城市，城牆不高，卻厚得驚人，深灰色石材裡嵌著一條條銀色金屬骨架，在夕陽下反著冷亮的光。城外道路被運礦車壓得結實平整，矮人、工人、商隊、冒險者與披著厚外套的本地居民混在一起，空氣裡有煤煙、金屬粉塵、麥酒和熱湯的味道。

遠處山坡上能看見礦井升降塔。

巨大的魔導輪盤緩緩轉動，粗纜帶著載滿礦石的吊箱升起又落下。每一次轉動，塔身上的魔晶都會亮一下，像城市在用自己的節奏呼吸。

我忍不住多看了幾眼。

老師也看了我幾眼。

我立刻把視線收回來。

我們進城時，太陽剛好落下。旅店老闆一聽見老師的名字，臉色從職業性的熱情變成了真正的恭敬，連忙替我們安排了二樓最安靜的兩間房。老師把斗篷掛好，確認窗鎖與防護陣後，才轉頭看向我。

「我去看看魔法書店。」她說，「你要去嗎？剛好補充一些白天的黑魔法知識。」

我僵了一下。

理智告訴我，身為弟子，這時候應該立刻點頭，跟著老師去魔法書店，購買《黑暗侵蝕生物行動模式總論》或《腐化體二次驅動迴路導讀》之類聽起來就會讓人一邊讀一邊懷疑人生的書。

但黑石城。

礦業城市。

魔導機械。

運輸機。

切割刀。

礦井用自動支架。

我聽見自己的良心發出一聲很輕的碎裂聲。

「老師，那個……」我努力讓聲音保持平穩，「我想去逛一下市集。」

老師看了我很久。

她那雙眼睛總讓人有一種錯覺，好像不管我把藉口藏在多深的地方，她都能伸手把它拎出來，抖一抖，再問我這東西是不是很可笑。

我站在原地，背後開始冒汗。

最後，老師只是說：「去吧。」

「謝謝老師！」

我幾乎是立刻鞠躬，轉身，出門，下樓，穿過旅店大廳。

當然，我沒去逛市集。

至少不是一般意義上的市集。

我轉頭就衝到了礦業工會商店。

那是一棟兩層高的石造建築，門口掛著交叉礦鎬與齒輪的標誌。裡面比我想像中還要精彩。整面牆掛滿各式各樣的礦井工具，從最普通的照明魔晶燈，到可自動調節角度的探測儀，再到大型礦車的替換零件，每一件都散發著令人心跳加快的金屬與魔法氣息。

我站在第一個展示櫃前，幾乎忘了呼吸。

「這個手持切割刀……」

我貼近玻璃。

櫃中放著一具長約半臂的切割工具，握柄後方嵌著水系魔晶，前端則有兩層微型風壓陣列。旁邊的說明牌寫得很簡略，但原理已經足夠清楚。

「先生成水流，再透過風魔法壓縮成高壓水柱進行切割……好精妙。」

這不是單純把水系與風系魔法疊在一起。

它在輸出端設了三段壓縮，讓水流在短距離內完成增壓，又用風系陣列穩定方向，避免切割線震盪。若是改良內部魔力通道，也許能降低二成消耗。不，如果把第二段風壓陣列改成環形導流，說不定能再縮短前端結構。

我轉向下一台機械。

「這個運輸機，可以輕鬆抬起數噸礦產！」

那是一台半人高的履帶式魔導運輸機，底盤厚重，背部有可折疊的承重架。它的核心不在力量，而在平衡。四個角落的浮力陣列不是為了讓它飛起來，而是抵消一部分重量，讓礦工能用更小的推力移動巨大礦石。

太聰明了。

太漂亮了。

和那些只會把魔力粗暴砸出去的戰鬥術式相比，這些機械簡直像另一種語言。

一種把魔法變成生活，把想像變成工具的語言。

我不知道自己在店裡待了多久。

直到櫃檯後方傳來一聲咳嗽。

「小弟弟。」

我抬起頭。

老闆是一名鬍子編成三股的矮人，手裡拿著帳本，正用一種已經忍耐很久的眼神看著我。

「你不是礦工吧？」

「不是。」

「也不是工會採購員？」

「不是。」

「你如果沒有要買東西的話，要關門了。」

「喔……抱歉。」

我有些尷尬地退開半步，這才注意到窗外天色已經徹底暗下來。商店裡的工業魔晶燈一盞接一盞調暗，牆上那些精巧工具在昏黃光裡變得像睡著了一樣。

我正準備離開，視線忽然瞥見櫃檯旁的一個木箱。

木箱裡放著一具明顯損壞的切割刀。

外殼裂開，前端噴嘴歪斜，風壓陣列有兩片符文片已經燒黑。水系魔晶被拆走了，但內部導管還在，握柄下方的穩定槽也沒有完全報廢。對真正的礦工來說，它大概已經沒有維修價值。

但在我眼裡，它簡直還有半條命。

「老闆。」我指向那個木箱，「這具切割刀可以賣給我嗎？」

矮人老闆低頭看了一眼。

「那個？」

「嗯。」

「送你吧。」他擺擺手，「拿來報廢的，修好也賺不了多少錢。你要搬得動就搬走，別摔壞我的地板。」

「謝謝老闆！」

我抱起那具跟一個箱子差不多大的切割刀時，差點當場往前栽倒。

它比看起來重很多。

非常重。

重得我開始懷疑自己對魔導機械的愛是不是還不夠堅定。

但我還是把它抱回了旅店。

老師的房門關著，裡面沒有聲音。她大概還在看書，或者已經發現我根本沒去市集，只是懶得現在出來揍我。

我輕手輕腳地回到自己房間，把切割刀放上桌。

然後我徹夜未眠。

損壞比我想像中嚴重。

前端噴嘴變形，內部水流導管有三處裂縫，風壓陣列燒毀一半，穩定槽裡殘留的魔力焦痕說明它曾經在過載狀態下被強行使用。若按照原本構造修復，需要新的符文片、完整水系魔晶，還有一套標準工坊工具。

我什麼都沒有。

只有旅店房間裡一張桌子，一盞小魔晶燈，一套旅行修理工具，以及一個剛被老師用黑魔法緒論嘲笑過的腦袋。

所以我不修復原本的它。

我重做它。

把前端切短。

拆掉多餘外殼。

將三段風壓改成兩段環形導流。

水系魔晶可以用小型通用魔法石暫代，只要輸出不要太高，再配合壓縮陣列節流，應該能撐住短時間使用。原本的承重框架太笨重，那是給礦工戴著厚手套操作的設計，若改成單手握持，可以直接縮小三分之一。

不，還能再小一點。

窗外的街聲漸漸沉下去。

遠處礦井升降塔的低鳴也變得稀疏。

我把零件拆開、排列、重新刻線。幾次魔力導入失敗，燒得指尖發麻。一次導管沒接好，壓縮水流直接噴上天花板，在木板上留下一條細得可怕的切痕。

我盯著那條切痕看了幾秒。

然後默默把輸出再降了半格。

天色亮起時，我已經記不得自己試了多少次。

最後一次魔力流通順暢地通過握柄，沿著縮短後的導管進入前端，在兩層環形風壓陣列之間被壓成一條穩定的細線。水流切過我放在桌角的廢金屬片，聲音很輕，像細針刺穿紙面。

成功了。

雖然很粗糙。

雖然外殼難看得像被人從垃圾堆裡拼回來。

雖然穩定性還需要測試，連續輸出可能超過十五秒就會過熱。

但它縮小了很多。

而且更省魔法石用量。

我趴在桌上時，本來只想休息一下。

再睜眼，是被開門聲驚醒的。

「起床。」老師的聲音傳來，「再不起來就把你和行李一起丟上馬車。」

我猛地抬頭，額頭差點撞上桌角。

老師站在門口。

她的視線先落在我臉上，又落向桌上四散的零件、刻壞的符文片、濕了一角的筆記本，最後停在那具粗糙但明顯體積縮小許多的切割刀上。

房間裡安靜了幾秒。

我忽然覺得，比被二十三隻魔狼盯著還可怕的事情出現了。

老師走過來，拿起那具切割刀。

她沒有立刻罵我。

這反而更可怕。

她翻看握柄，看過前端導流環，又用指尖敲了敲我臨時刻上去的壓縮陣列。

「水流導管改短了。」她說。

「是。」

「第二段風壓陣列改成環形導流。」

「是。」

「魔法石消耗降了？」

「如果不連續輸出，應該能比原型省三成左右。」

「應該？」

「還沒完整測試。」

老師抬眼看我。

我立刻補充：「我沒有對活物測試，也沒有拆旅店的東西！」

老師又看了一眼天花板。

我順著她的視線看見那道細細的切痕。

「……大部分沒有。」

下一瞬，老師抬手就巴了下來。

「你小子又在研究這些有的沒的了！」

「痛！老師！這不是有的沒的，這是魔導工程！」

「你是我的魔法弟子，不是礦業工會的見習維修工。」

「可是它真的很精妙！原本設計太大了，如果改良輸出端，它可以給普通城鎮巡邏隊使用，甚至能在腐植類魔物蔓延時切開根系——」

「你黑魔法緒論七十一分。」

「……」

她只用一句話就讓我閉嘴了。

老師把切割刀放回桌上。

她的手仍然停在上面，指尖輕輕敲了兩下，像是在確認那個粗糙作品的平衡。過了一會兒，她轉身往門口走去。

「十分鐘內洗臉、收拾行李、下樓吃早餐。」

我愣了一下。

「老師，那這個……」

「帶著。」她頭也不回地說，「既然熬了一整晚，就自己背。」

我低頭看著桌上那具難看得有點可愛的切割刀，忽然覺得困意都淡了許多。

老師走到門邊時，腳步停了一下。

我看見她側過臉。

她嘴角是笑的。

很淡。

但確實是笑的。

「還有。」她說，「早飯後，把你昨晚改過的陣列畫給我看。你最好能解釋為什麼天花板沒有被你切穿。」

我立刻站直。

「是！老師！」

門關上。

我看著滿桌零件，又看向窗外剛升起的晨光。

艾爾諾老師果然神秘又強大。
```

---

## chapters/README.md

<!-- file_path: backend/novel_db/novel_02_random/chapters/README.md -->

```markdown
﻿# Chapters

- 這個資料夾只放正文章節。
- 建議使用固定命名格式：`ch001.md`、`ch002.md`、`ch003.md`。
- 每章開頭可自行決定是否保留簡短 metadata，例如：

``\`md
- `pov: 主角名稱`
- `time: Day 1 / 晚上`
- `location: 場景名稱`
``\`

- 若故事有分卷、外傳或番外，可再額外建立一致的命名規則，但建議先固定主線章節編號。
```

---

## scripts/consistency-check.md

<!-- file_path: backend/novel_db/novel_02_random/scripts/consistency-check.md -->

```markdown
# 一致性檢查 (Consistency Check) Prompt

請根據目前的章節草稿 `chXXX.md`，比對本專案 `bible/` 與 `outline/` 中的設定，確認以下重點：

1. **邏輯衝突**: 是否有前文已設下的限制、規則或因果被違反？
2. **角色口吻**: 角色說話方式是否與 `bible/characters.yaml` 的 `speech_style` 一致？
3. **專有名詞、地理與組織資訊**: 地名、術語、物品名稱、組織稱呼、政治實體名稱是否前後統一，並與 `bible/location.yaml`、`bible/organizations.yaml` 對齊？
4. **時間線**: `bible/timeline.yaml` 是否需要新增或修正本章事件與 `location_id`？
5. **秘密外洩**: 本章是否提前說破 `context/secrets-lockbox.md` 中尚未正式揭露的資訊？
6. **大綱對齊**: 本章是否讓 `outline/master-outline.yaml` 的當前落點過時？

請列出所有潛在不一致之處，並附上具體修改建議。
```

---

## scripts/update-bible.md

<!-- file_path: backend/novel_db/novel_02_random/scripts/update-bible.md -->

```markdown
# 更新 Bible 指引

當章節 `chXXX.md` 寫完後，請執行以下作業：

1. **掃描新規則**: 是否出現新的世界規律、制度、地點、組織或限制？
2. **掃描人物變更**: 人物性格、關係、傷勢、能力、目標、秘密是否有新變化？
3. **區分公開與保密資訊**: 已正式揭露的內容寫回 `bible/`；尚未揭露的作者規劃、隱藏真相或未來系統擴張寫入 `context/secrets-lockbox.md`。
4. **對齊正式資料**: 更新 `bible/characters.yaml`、`bible/relationships.yaml`、`bible/location.yaml`、`bible/organizations.yaml`、`bible/timeline.yaml`、`bible/plot-threads.yaml` 或 `bible/worldbuilding.md`。
5. **更新摘要**: 視需要刷新 `context/last-chapter-summary.md` 與 `context/CONTEXT.md`。
6. **校正大綱**: 若本章改變中短期方向，更新 `outline/master-outline.yaml`。

## AI 回應格式

- 我已偵測到以下變更，是否更新正式資料？
- [ ] 人物狀態：...
- [ ] 關係變化：...
- [ ] 地點資料：...
- [ ] 組織／團體／政治實體：...
- [ ] 新伏筆：...
- [ ] 世界觀規則：...
- [ ] 保密設定：...
- [ ] 時間線：...
```
