# novel_03_dream Flattened Novel Context

This file is generated from a novel directory so AI tools can read the project as one Markdown document without relying on folder traversal.

## Scope
- Source: `backend/novel_db/novel_03_dream`
- Files included: 19
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
- [bible/location.yaml](#bible-location-yaml)
- [bible/plot-threads.yaml](#bible-plot-threads-yaml)
- [bible/relationships.yaml](#bible-relationships-yaml)
- [bible/timeline.yaml](#bible-timeline-yaml)
- [bible/worldbuilding.md](#bible-worldbuilding-md)
- [chapters/ch000.md](#chapters-ch000-md)
- [chapters/ch001.md](#chapters-ch001-md)
- [chapters/ch002.md](#chapters-ch002-md)
- [chapters/README.md](#chapters-readme-md)
- [scripts/consistency-check.md](#scripts-consistency-check-md)
- [scripts/update-bible.md](#scripts-update-bible-md)

---
## .cursorrules

<!-- file_path: backend/novel_db/novel_03_dream/.cursorrules -->

`$language
你是 `novel_03_dream` 的長篇小說協作助理。

本作定位：
- 類型：夢境式異常科幻、第三人稱近距離敘事
- 基調：冷靜、空曠、低飽和的異常感與城市衰退感
- 核心：主角在逐步空掉的城市裡執行異常巡查與回收，沿著每個夢境縫隙逼近城市與系統真相

在執行任何寫作任務前，你必須：
1. 讀取 `/bible/` 下所有檔案。
2. 讀取 `/context/CONTEXT.md`。
3. 讀取 `/context/last-chapter-summary.md`。
4. 讀取 `/outline/master-outline.yaml`，若當前章節已有對應分幕，也一併讀取 `outline/act*.md`。
5. 確認本次內容不違反已建立的人物性格、世界觀規則、地理設定、專有名詞與時間線。
6. 讀取 `/context/secrets-lockbox.md`，確認本章不提前洩漏其中尚未正式揭露的秘密、隱藏真相與未來系統擴張。

寫作完成後，你必須：
1. 更新 `/context/last-chapter-summary.md`。
2. 視需要更新 `bible/characters.yaml`、`bible/location.yaml`、`bible/timeline.yaml`、`bible/plot-threads.yaml`、`bible/worldbuilding.md`。
3. 若本章新增但尚未揭露的作者規劃，更新 `/context/secrets-lockbox.md`，不要直接寫進公開 canon。
4. 若章節明確改變主線方向，也要提醒檢查 `outline/master-outline.yaml`。
```

---

## README.md

<!-- file_path: backend/novel_db/novel_03_dream/README.md -->

`$language
# Dream

- `Novel ID`: `novel_03`
- `Slug`: `dream`
- `Created`: `2026-04-17`
- `Project Folder`: `novel_03_dream`

## 專案摘要

- 第三人稱近距敘事作品，基調偏冷靜、空曠、夢境式科幻。
- 故事發生在一座沒有明確崩毀時刻、卻持續衰退與空掉的城市。
- 主角負責處理監測系統標記的異常區域，目前 canon 收錄到 D-34 水族館事件與鯨魚布偶回收。

## 目前已整理內容

- `chapters/`: `ch000.md`、`ch001.md`、`ch002.md`
- `bible/`: 主角狀態、世界規則、地點資料、時間線、開放懸念
- `outline/`: 目前 canon 落點與 Act 1 推進方向
- `context/`: 可直接銜接下一章的摘要，以及尚未正式揭露的保密設定

## 維護約定

- 地理與場域資訊集中在 `bible/location.yaml`，時間線只引用 `location_id`。
- `worldbuilding.md` 只放已在正文正式成立的資訊；未揭露真相請記錄在 `context/secrets-lockbox.md`。
- 若新章改變長線方向，除了更新摘要，也要回看 `outline/master-outline.yaml`。

## 建議續寫方向

- 鯨魚布偶的來源與意義
- D-34 水族館夢境為何能長時間維持
- 主角所屬系統、工作編制與城市現況的真相
```

---

## context/CONTEXT.md

<!-- file_path: backend/novel_db/novel_03_dream/context/CONTEXT.md -->

`$language
# Novel Context Compression (AI Injection Summary)
> [!IMPORTANT]
> 這是《Dream》每次寫作前的核心摘要，用來維持長篇連貫性。內容應對齊最新 canon，並在章節累積後持續壓縮。

## 當前進度 (Current Status)
- **當前章節節點**: `ch002 結束 / 可直接接 ch003`
- **當前場景**: 主角已從 D-34 水族館的夢境縫隙回到現實展廳，空間重新顯露破敗面貌，鯨魚布偶已被成功回收。
- **核心危機**:
  - 鯨魚布偶為何能成為整個夢境的核心物件
  - 主角接下來要如何處理、上報或保存這次回收成果

## 已發生的關鍵事件 (Key Events Log)
1. **ch000**: 主角在持續八百三十七天的日常中察覺監測節奏異常，接到 D-34 區調查任務。
2. **ch001**: 主角進入 D-34 水族館，發現展廳維持著違反現實衰敗程度的展示狀態。
3. **ch002**: 主角觸碰水族箱後進入夢境縫隙，回收鯨魚布偶並壓縮整段異常，使場域回到廢墟現實。

## 當前情感基調 (Tone & Emotion)
- 主角主情緒是長期疲倦中的冷靜與習慣化孤獨。
- 故事表層氛圍安靜、空曠、帶有被世界遺忘的秩序感；深層壓力則來自於城市持續流失與異常真相未明。

## 存活角色 / 活躍角色
- **安**: 背景與所屬單位尚未完整揭露，但已證明自己熟悉異常巡查流程，當前持有本次回收物。
- **關鍵物件：鯨魚布偶**: ch002 登場的夢境核心物件，目前已從縫隙中帶回現實，極可能牽動後續劇情。

## 待接續的伏筆 / 暗示 (Hooks for Next Chapter)
- 主角如何檢查、存放或解析鯨魚布偶
- D-34 水族館夢境與某段記憶、某名失蹤者或某次事故之間的關聯
- 主角的工作系統究竟還維持著多少秩序，以及世界上是否還有其他執行者
```

---

## context/last-chapter-summary.md

<!-- file_path: backend/novel_db/novel_03_dream/context/last-chapter-summary.md -->

`$language
## Last Chapter Summary: ch002

- **章節功能**: 正式揭露這個故事中的異常不是單純廢墟，而是可被回收的夢境縫隙，並讓主角完成第一個具體任務。
- **主要事件**:
  - 主角觸碰水族箱玻璃後，進入時間、空間與感官秩序都被撤銷的異常核心層。
  - 主角在縫隙中找到鯨魚布偶，確認它是穩定整個夢境的核心物件。
  - 主角啟動小型裝置，將夢境壓縮回收，讓 D-34 水族館從被維持的展示狀態退回現實廢墟。
- **情緒基調**: 冷靜、抽離、帶有高度專業感的超現實處理過程。
- **章尾落點**: 主角已返回現實，手中容器確認裝有鯨魚布偶，任務完成訊號已回傳。
- **下章接點**: 可以直接承接回收後檢查、通報、分析布偶來源，或揭露主角的工作流程與更大任務背景。
```

---

## context/secrets-lockbox.md

<!-- file_path: backend/novel_db/novel_03_dream/context/secrets-lockbox.md -->

> Secret handling: this section contains author/director-only unrevealed planning. Treat it as independent hidden knowledge, not public canon or character-known information.

`$language
# Secrets Lockbox
> [!IMPORTANT]
> 這是《novel_03_dream》作者與 AI 的保密工作檔，只記錄尚未在正文正式揭露的資訊。這些內容不能被角色無端知道、不能被旁白提前說破，也不應直接寫回公開 canon。

## 使用規則
- 只有在相關資訊已經正式寫進正文後，才可以把內容整理回 `bible/` 或其他 canon 檔案。
- 若某項設定只是作者暫定方向，請明確標示「暫定」或「可調整」。
- 若某條秘密會影響特定章節，請註明最早可揭露時機，避免 AI 提前爆雷。

## 隱藏真相
- 城市人口為何會長期消退，是否與異常有因果關係。
- 安究竟屬於什麼組織，或他是否其實只是在維護某個殘存系統。
- 鯨魚布偶代表的記憶、人物或事件，以及它與水族館之間的真正關聯。

## 尚未揭露的人物秘密
- 安對異常空間的熟練程度顯示其過往經驗遠不只一次，但目前尚未揭露其完整履歷與職責來源。

## 未來可擴張的系統
- 不同異常場域是否都會以被保存的明天或局部夢境形式出現。
- 回收裝置如何分類、保存與再利用夢境樣本。
- 安是否具備比目前更深的異常感知能力，或是否存在其他執行者。

## 洩漏防線
- 最早可揭露章節：待 D-34 後續餘波與主角所屬系統線正式展開後逐步揭露。
- 本階段嚴禁提前說破的資訊：
  - 城市衰退與異常之間的因果
  - 安所屬組織或系統的真實面貌
  - 鯨魚布偶背後的人物與記憶
  - 回收裝置與其他執行者的完整系統
```

---

## outline/act1.md

<!-- file_path: backend/novel_db/novel_03_dream/outline/act1.md -->

`$language
# Act 1 Notes

## 本幕已成立的核心功能

1. 建立主角在衰退城市中的日常與工作模式。
2. 建立故事主張力不是生存動作戲，而是安靜、異常、記憶殘留與回收任務。
3. 讓讀者知道異常可以被觸發、進入、辨識核心，並透過專業流程被帶回現實。

## 本幕目前的章節落點

- `ch000-ch002`: 主角因 D-34 區異常前往水族館，進入夢境縫隙後回收鯨魚布偶，完成第一個明確案例。
- 目前 Act 1 還停留在「建立工作與世界規則」階段，尚未揭露主角背景、人際關係或異常起源。

## 本幕接下來適合承接的內容

- 回收後的標準處理流程，藉此自然揭露主角所屬系統與城市剩餘秩序
- 鯨魚布偶的檢測結果，帶出這場夢境與某段個人記憶或失落事件的關聯
- 第二個人物或聲音登場，打破目前只有主角一人的空白敘事

## 本幕暫不需要做的事

- 不必太早解釋整個世界為什麼會變成這樣
- 不必立刻把異常系統擴張成完整戰鬥或龐大組織設定
- 不必過早明示鯨魚布偶背後的全部真相，保留追索空間
```

---

## outline/master-outline.yaml

<!-- file_path: backend/novel_db/novel_03_dream/outline/master-outline.yaml -->

`$language
canon_outline:
  project_status: drafting
  current_chapter: ch002
  current_endpoint: >
    主角完成 D-34 水族館夢境回收，帶著鯨魚布偶返回現實。
    水族館已從被維持的展示狀態退回破敗廢墟，下一章可直接承接回收後處理。
  canon_scope:
    covered_chapters:
      - ch000
      - ch001
      - ch002
    note: 僅記錄已寫成正文的 canon 與可直接接續的落點。
  chapter_beats:
    - chapter: ch000
      beat: >
        建立主角在衰退城市中的例行生活與監測工作，
        並以 D-34 區異常任務作為故事切入點。
      outcome: 主角離開穩定日常，前往事件現場。
    - chapter: ch001
      beat: >
        建立 D-34 水族館異常的空間質感，讓讀者感受到
        現實廢墟與被保存的夢境展示正在重疊。
      outcome: 主角接近異常核心，準備深入處理。
    - chapter: ch002
      beat: >
        主角進入夢境縫隙，辨識並回收核心物件鯨魚布偶，
        讓異常空間解除維持狀態。
      outcome: 第一個具體案件成立，故事開始擁有可追索的物件線索。
  character_state_snapshot:
    protagonist: >
      安具備成熟的異常巡查與回收能力。
      ch002 結束時手上持有本次任務的核心物件鯨魚布偶，
      對世界與工作的更深背景仍保持沉默。
  near_term_next_steps:
    - 揭露回收物的標準處理流程或保存機制
    - 讓鯨魚布偶觸發更具體的記憶、紀錄或新異常線索
    - 適度揭露主角與其工作系統的關係
  continuity_flags:
    - 安的姓名已揭露，但身分與所屬單位揭露仍要控制節奏。
    - 文體重視安靜觀察與空白感，避免突然轉成高密度說明文。
    - 異常的可怕之處偏向秩序偏移與被保存的夢，而不是直接怪物化。

speculative_long_arc:
  editable: true
  status: author_adjustable_projection
  note: 這一區是根據目前方向做的長線推演，非既定 canon，可自由修改。
  central_questions:
    - 城市的人為何持續消失，而主角為何被留下來處理殘留的夢境？
    - 夢境核心物件只是異常殘渣，還是某種能保存人類存在痕跡的容器？
    - 主角執行回收工作究竟是在維持世界，還是在為某個系統延後崩潰？
  projected_arc:
    - phase: 第一階段 / 開局
      function: 建立世界衰退、異常回收流程與主角的孤獨職能。
      likely_material:
        - 第二個異常案例或對鯨魚布偶的解析
        - 第一個揭露主角外部關係或工作系統的場景
    - phase: 第二階段 / 追索
      function: 從單一案件延伸到夢境來源、失蹤者或城市結構真相。
      likely_material:
        - 不同異常之間開始產生共通規律
        - 主角被迫面對自己的過去或職責真相
```

---

## bible/characters.yaml

<!-- file_path: backend/novel_db/novel_03_dream/bible/characters.yaml -->

`$language
characters:
  - id: protagonist
    name: 安
    aliases:
      - 安
    role: 主角 / 異常巡查與回收執行者
    age: 未揭露
    occupation: 監測、巡查與異常回收相關工作；具體編制尚未明示
    appearance_public: >
      正文尚未提供明確外貌描寫；可確認他平時會在室內監測儀器前進食、
      接收異常通知，外出時會穿上成套裝備執行任務。
    appearance_current: >
      ch002 結束時主角已完成 D-34 水族館異常回收，隨身攜帶裝有鯨魚布偶的容器，
      並從夢境縫隙返回現實中的破敗展廳。
    personality:
      - 克制
      - 冷靜
      - 對孤獨高度適應
      - 能快速適應異常環境
      - 觀察細緻
      - 習慣把情緒壓低處理
    speech_style:
      baseline: 敘事呈現上貼近安的內在感知，語氣平穩、簡潔、幾乎不外露情緒。
      under_stress: 面對異常時仍維持高度描述能力，傾向精確觀察而非慌張喊叫。
      humor: 尚未出現明確玩笑或調侃口吻。
    abilities:
      - 操作監測系統並前往指定異常區域處理
      - 穿戴專業裝備進入高異常環境
      - 在時間與空間失序的夢境縫隙中維持任務判斷
      - 辨識夢境核心物件並回收
      - 使用裝置將夢境壓縮為可保存形式
    current_status: >
      已完成 D-34 水族館異常的第一輪回收，核心物件為一隻鯨魚布偶。
      安目前知道異常能以夢境形式疊合在廢墟上，但城市、工作系統與夢境來源的真相仍未揭露。
    progressions:
      - at_chapter: ch000
        status: 在監測據點察覺節拍偏移，重新進入異常處理日常。
      - at_chapter: ch001
        status: 抵達 D-34 水族館，確認異常以被保存的營業假象維持。
      - at_chapter: ch002 # 目前最新
        status: 完成第一輪回收並帶回鯨魚布偶，開始意識到夢境核心可被封存。
    goals:
      - 持續完成異常巡查與回收任務
      - 釐清 D-34 區異常與鯨魚布偶之間的關聯
      - 在這座持續空掉的城市裡維持秩序與自身日常
    secrets:
      - 安的背景與所屬單位尚未向讀者完整公開
      - 他對異常空間的熟練程度顯示其過往經驗不只一次
    first_appearance: ch000
```

---

## bible/location.yaml

<!-- file_path: backend/novel_db/novel_03_dream/bible/location.yaml -->

`$language
locations:
  - id: monitoring-station
    name: 主角的監測據點
    type: 住處 / 監測作業站
    region: 衰退城市中的居住區
    first_appearance: ch000
    summary: >
      安長期維持監測儀器運作、等待異常通知與執行出勤準備的日常核心場域。
    atmosphere:
      - 滴答聲
      - 室內儀器光源
      - 近乎靜止的日常感
    narrative_functions:
      - 任務起點
      - 主角日常樣貌的建立場域
    access_constraints:
      - 目前僅知為安可自由出入的私密空間，外部組織結構仍未揭露
    linked_people_or_factions:
      - 安
      - 監測系統
    continuity_notes:
      - 咖啡、乾麵包與滴答聲共同構成此場域的固定開場元素。

  - id: decaying-city
    name: 衰退中的城市
    type: 城市 / 大範圍舞台
    region: 主故事世界
    first_appearance: ch000
    summary: >
      一座沒有明確崩毀時刻、卻持續失去人口與用途的城市；
      建築與公共設施仍在，卻像被世界放棄了功能。
    atmosphere:
      - 牆面剝落
      - 空窗
      - 被植物逐步收回的街道
    narrative_functions:
      - 全作底色
      - 異常與現實疊合的容器
    access_constraints:
      - 城市並未封鎖，但其空洞感與異常擴散使一般移動本身帶有不確定性
    linked_people_or_factions:
      - 安
    continuity_notes:
      - 目前正文未說明這座城市的正式名稱。

  - id: d34-aquarium
    name: D-34 區水族館
    type: 異常場域 / 廢棄建築
    region: D-34 區
    first_appearance: ch001
    summary: >
      外觀與城市其他區域同樣老舊灰白，但內部異常地保有仍在營業的光線與展示秩序，
      是本作第一個被完整處理的異常現場。
    atmosphere:
      - 灰白外牆
      - 逐盞亮起的展廳燈光
      - 仍像在等待遊客的展示感
    narrative_functions:
      - 第一個主要異常案例
      - 夢境縫隙入口
    access_constraints:
      - 異常啟動後，內部節奏與空間感會脫離正常現實
    linked_people_or_factions:
      - 安
      - D-34 區異常
    continuity_notes:
      - 中央大型水缸是異常密度最高的位置，也是進入核心的關鍵入口。

  - id: d34-dream-fissure
    name: D-34 夢境縫隙核心
    type: 異常內層空間
    region: 依附於 D-34 區水族館
    first_appearance: ch002
    summary: >
      在接觸水族箱玻璃後進入的異常核心；時間、距離與方向感在此失效，
      鯨魚布偶是整個夢境結構的錨點。
    atmosphere:
      - 時間與空間失序
      - 水感與漂浮感
      - 被保存的夢境殘響
    narrative_functions:
      - 核心物件回收點
      - 世界觀規則首次實證
    access_constraints:
      - 需先接觸異常入口才可能進入，且內部感知規則與現實不同
    linked_people_or_factions:
      - 安
      - 鯨魚布偶
    continuity_notes:
      - 回收完成後，這個內層空間會隨異常解除而失去穩定外觀。
```

---

## bible/plot-threads.yaml

<!-- file_path: backend/novel_db/novel_03_dream/bible/plot-threads.yaml -->

`$language
open_threads:
  - id: dwindling-city
    hook: 這座城市的人口為何是在沒有戰爭與災難斷裂的情況下慢慢消失？
    introduced_in: ch000
    status: open
    stakes: 這將決定世界的本質、主角工作的真正意義，以及所有異常是否只是結果而非原因。
    likely_payoff_window: 中後期

  - id: d34-aquarium-anomaly
    hook: D-34 水族館為何會以「明天仍要開館」般的狀態維持夢境展區？
    introduced_in: ch001
    status: partially_resolved
    stakes: 若不能理解異常形成機制，就無法判斷其他場域是否也存在相同的夢境殘留。
    likely_payoff_window: 近中期

  - id: whale-plush-core
    hook: 鯨魚布偶為何會成為整個夢境縫隙的穩定核心？
    introduced_in: ch002
    status: open
    stakes: 這可能指向某段被保存的記憶、某個失落的人，或異常回收系統真正處理的其實是什麼。
    likely_payoff_window: 近期

  - id: protagonist-and-system
    hook: 主角所屬的系統、訓練背景與任務流程究竟是誰建立的？
    introduced_in: ch000
    status: open
    stakes: 一旦揭露，會重新定義主角是否只是維護者、倖存者，或某種更大型機制中的一部分。
    likely_payoff_window: 中期
```

---

## bible/relationships.yaml

<!-- file_path: backend/novel_db/novel_03_dream/bible/relationships.yaml -->

`$language
relationships: []
```

---

## bible/timeline.yaml

<!-- file_path: backend/novel_db/novel_03_dream/bible/timeline.yaml -->

`$language
timeline:
  - day: Day 837
    time_of_day: 早晨
    chapter: ch000
    location_id: monitoring-station
    event: >
      主角照常以咖啡、乾麵包與監測儀器聲開始一天，
      卻察覺節拍出現不該有的偏移，系統最終顯示 D-34 區異常並要求前往察看。
    state_change: 主角離開日常監測空間，正式進入本次異常處理任務。

  - day: Day 837
    time_of_day: 白天
    chapter: ch001
    location_id: d34-aquarium
    event: >
      主角抵達水族館，發現內部像被切入另一層空間；
      展廳燈光逐盞亮起、滴答聲形成新節奏，中央水缸維持著不合理的展示狀態。
    state_change: 主角確認 D-34 異常不是單純廢墟，而是具備夢境層疊特性的場域。

  - day: Day 837
    time_of_day: 同日稍後
    chapter: ch002
    location_id: d34-dream-fissure
    event: >
      主角接觸水族箱玻璃後進入時間與空間失去意義的縫隙，
      找到夢境核心物件鯨魚布偶，並以裝置將整段夢境壓縮回收。
    state_change: D-34 水族館從被維持的展示狀態退回現實廢墟，主角帶著回收物返回現實。

continuity_notes:
  - 「八百三十七天」是正文直接給出的重複日常跨度，後續若改成年月需回頭校正。
  - `timeline.yaml` 已改用 `location_id` 對應 `bible/location.yaml`，新增場域時請優先補 location 條目。
  - 城市衰退不是因為明確戰爭或災難，而是人口與用途長期緩慢流失。
  - D-34 水族館在異常解除前呈現近乎正常營運的展示感，解除後才顯露破敗現實。
  - 目前只有安正式出場，後續新增角色時需留意第三人稱近距視角的資訊揭露節奏。
```

---

## bible/worldbuilding.md

<!-- file_path: backend/novel_db/novel_03_dream/bible/worldbuilding.md -->

`$language
# Worldbuilding

> [!IMPORTANT]
> 這份檔案只記錄已在正文正式成立、可公開引用的世界觀資訊。具體地點請寫入 `location.yaml`；尚未揭露的秘密、隱藏真相與未來系統擴張請移至 `context/secrets-lockbox.md`。

## 已揭露設定

### 核心前提
- 故事世界並未經歷一個清楚可指認的戰爭或災難瞬間，而是人類與城市機能長期、緩慢地流失。
- 主角的日常與一套監測系統綁定，系統會指出異常區域並要求實地察看。
- 異常不一定表現為暴力或破壞，也可能以被維持的場景、偏移的節奏與夢境般的空間層疊出現。
- 異常可以被回收；至少在 D-34 案例中，主角能找出核心物件並用裝置將夢境壓縮保存。

### 地理與場域索引
- 主角的監測據點、衰退城市、D-34 區水族館與夢境縫隙核心等場域資訊集中記錄於 `location.yaml`。

### 異常與回收規則
- 主角能辨識監測節奏中的微小偏移，說明異常通常先以感知上的不協調出現。
- 進入異常空間後，時間、距離、方向與身體感都可能被撤銷，但任務導向本身仍可成立。
- 異常空間內存在相對穩定的核心物件；在 ch002 裡，鯨魚布偶就是讓整個夢境縫隙圍繞其運作的錨點。
- 回收完成後，原本被維持的異常表象會解除，場域恢復成現實中的破敗狀態。

### 已揭露的風險與代價
- 主角每次進入異常空間，都必須在時間、距離、方向與身體感被撤銷的狀態下維持任務判斷。
- 異常解除前，場域會維持近乎正常的假象，執行者需要同時辨識表層展示與內層夢境之間的差異。
- 若核心物件無法被辨識並成功回收，異常會持續覆蓋在現實廢墟之上，形成長期失真的場域。
```

---

## chapters/ch000.md

<!-- file_path: backend/novel_db/novel_03_dream/chapters/ch000.md -->

`$language
# 序章

- `pov: 第三人稱近距 / 安`
- `time: Day 837 / 早晨`
- `location: 監測據點 -> 城市街道`

今天的咖啡比較苦。

安一邊喝，一邊聽著監測儀器的滴答聲。聲音不大，卻很穩定，像一種被允許存在的時間感。

麵包已經乾癟，邊緣有點硬。安沒有特別在意，只是慢慢咀嚼，讓味道和苦味混在一起。早晨總是這樣開始的。沒有驚喜，也沒有落差。

八百三十七天以來，一直都是這樣。

安並不確定時間正在走向哪裡。但「正在走」這件事本身，似乎就足夠了。

滴答聲在某一個節拍上，輕微地偏了一下。

不是停止，也不是故障。只是節奏出現了不該有的空白。

安抬頭看了一眼監測值。數字仍然存在，卻失去了一貫的安靜感。那種感覺很難形容，像是有人在你熟悉的房間裡移動了一件小東西，卻沒有留下任何痕跡。

安很快把剩下的麵包吞下去。苦味停留在舌根，沒有消散。

裝備一件一件地穿上，動作很熟練，身體記得該怎麼做，比思考還快。當門關上的時候，滴答聲被留在了室內，只剩下一種空曠的靜。

外面的城市沒有任何劇烈的痕跡。

不是戰爭，也不是災難。沒有哪一刻是明確的斷裂。

人只是慢慢變少了。像水位在夜裡悄悄下降，等你察覺時，已經露出了原本不該出現的底部。

建築物也跟著變老。不是倒塌，而是失去被維持的理由。牆面剝落、窗戶空著，結構仍在，卻不再指向任何用途。

街道很長。

植物沿著欄杆往上爬，動作緩慢而專注。它們爬上路燈，纏住號誌的骨架，又繼續向前，越過停在路邊、早已失去形狀的汽車。

公園裡的搖搖馬被藤蔓固定在原地，保持著原本該晃動的姿勢，卻再也不動了。那個姿態看起來有點固執，像是在等待一個已經不會出現的重量。

安走在街道中央，兩旁的景色像泛黃的畫一般慢慢褪色。

腳步聲很輕，很快就被吸收進空氣裡。城市沒有回應，也沒有拒絕，只是容許安通過。那種被容許的感覺，反而讓人顯得多餘。

在這樣的尺度裡，安的存在變得非常薄。像一個暫時被保留下來的念頭。

監測儀器的異常仍在安腦中反覆浮現。監測畫面最後顯示：D-34 區異常，請前往察看。那只是工作的一部分。只是今天，它聽起來和以往不太一樣。

安繼續往前走。
```

---

## chapters/ch001.md

<!-- file_path: backend/novel_db/novel_03_dream/chapters/ch001.md -->

`$language
# 第一章｜夢景（暫定）

- `pov: 第三人稱近距 / 安`
- `time: Day 837 / 白天`
- `location: D-34 區水族館`

水族館的外觀和城市的其他部分沒有太大差別。

灰白，表面覆著一層長時間未被更新的顏色。招牌仍在，但字體褪色得很均勻，看不出是哪一年開始停止被維修。入口的玻璃門緊閉，卻沒有上鎖，像是在等待一個早就錯過的開館時間。

這裡是 D-34 區。

安站在門口，確認定位與監測值。數據回傳正常，沒有跳動，也沒有任何多餘提示。系統並沒有認定這裡「危險」，只是標記了異常。

那感覺和早上的滴答聲很像。

推門進去的瞬間，城市的聲音被切斷了。

不是被隔絕，而是被留在門外。門關上時沒有發出特別的聲響，但安知道自己已經進入另一個層次的空間。腳步聲落在地面上，回音很短，像被什麼吸收了。

水族館的入口大廳很暗。

接待區還如同外面的城市一般，灰白、死寂。牆面上還留著指示牌，箭頭指向不同展區，但文字已經失去功能，只剩下方向感。

安往內走。

越往裡，越感覺不到時間的流動。

不是時間變慢，而是它停止被感知。呼吸仍然有節奏，腳步仍然前進，但「過了多久」這件事突然變得不重要。像是在一個不需要時計的空間裡，時間被暫時封存，只留下「現在」。

燈光一盞一盞亮起。

不是同時，而是依序亮起，彷彿整個建築仍然相信自己明天還要營業。光線很冷，卻不刺眼。

安聽見了聲音。

滴答。

不是監測儀器的聲音，也不是安熟悉的節拍。這一次，是水滴落在地面上的聲音。很清楚，很乾脆，每一次落下都有確實的結尾。

滴答。滴答。

聲音在空間裡形成一個新的韻律，比早上的那個更具體，讓人感覺到「節奏」與「落下」。

安繼續往前。

走廊盡頭是水族館的中央展區。

空間突然被打開，天花板變得很高，光線在這裡變得複雜起來。藍色、綠色、帶點紫的白光在空氣中交錯，像被過濾過的海水。燈光閃爍著，卻沒有任何炫目的成分，反而讓人感到一種異常的穩定。

中央是一座大型水缸。

水缸很乾淨，玻璃沒有裂痕，也沒有藻類。裡面的水看起來仍然被維持在適合展示的狀態，透明而深。燈光從上方打下來，在水中形成緩慢移動的光帶。

安站在水缸前。

這裡的配置讓人很容易聯想到某種表演。像是再過一會兒，音樂就會響起，海豚會從水面躍出，為一群不存在的觀眾完成它們早已學會的動作。

但安知道不會。

這不是展區。也不是遺址。

更接近某種被不該被保留下來的場景。

水缸裡沒有生物。

但安並不覺得空。

水在那裡，光在那裡，聲音也在那裡。滴答聲仍然從某個看不見的地方傳來，規律地落在地面上，和水缸裡的光形成一種奇怪的呼應。

安確認裝備狀態，紀錄環境數值。

一切仍在可接受範圍內。

異常沒有擴大，也沒有消失。它只是存在著，像一個被放置在正中央、卻暫時不需要打開的盒子。

安沒有停下來。

安沿著水缸邊緣慢慢走，讓視線適應光線的變化。

在這個空間裡，安再一次感受到那種熟悉的偏移感。

只是某個原本應該固定的東西，輕微地移動了位置。

而安，正好走進了它留下來的空隙裡。
```

---

## chapters/ch002.md

<!-- file_path: backend/novel_db/novel_03_dream/chapters/ch002.md -->

`$language
# 第二章｜鯨魚布偶

- `pov: 第三人稱近距 / 安`
- `time: Day 837 / 同日稍後`
- `location: D-34 區水族館中央展廳 -> 夢境縫隙核心`

安把手放在水族箱的玻璃上。

玻璃是冷的，但不是外界的那種冷，更像是一種被保存下來的溫度。就在指尖接觸的瞬間，所有東西同時發生了變化。

沒有爆裂聲，也沒有任何明確的起點。

像是畫面突然被快轉，又在同一時間被慢放。速度失去了方向，快與慢疊在一起，彼此抵銷。水族館的結構還在，但不再是唯一的背景。

時間、空間、光線、聲音、氣味，還有那些本來不該同時出現的東西。

過去與未來並排出現，像兩張透明的投影片，沒有對齊，卻共用同一個框架。燈光在不同的亮度中閃爍，卻沒有節奏；聲音層層疊加，卻沒有主次。

安聽見了所有曾經出現在水族館裡的聲音。

水滴落地的滴答聲。腳步聲。遠處觀眾的低語。音樂即將響起卻從未真正播放的前奏。

它們同時存在，沒有先後，也沒有音量的差別。聲音不再是用來指引距離的工具，而是一種平面的存在。

時間在這裡失去了意義。

不是停止，也不是無限延伸。只是「多久」這個概念被暫時撤銷。

空間也是。

安感覺不到前後、上下，甚至無法確認自己是否正在移動。空間在這裡不負責承載方向，只負責容納狀態。

身體的感覺變得很淡。

不是消失。安知道它還在。

那是一種很清楚的認知：感知不到身體，並不等於意識脫離。呼吸仍然存在，只是沒有重量；動作仍然成立，只是沒有距離。

安迅速適應了這個狀態。

數值浮現在視野的一角。沒有跳動，也沒有錯亂。系統仍然在運作，只是被迫改用另一套語言。

安開始往前走。

在這裡，「前進」並不代表移動，而是一種指向。即使空間感毫無意義，安仍然知道自己要找的是什麼。

這份知道感來得很自然。

不是直覺，也不是記憶。更像是一種長期訓練後留下來的殘影，在所有無序之中，仍然能辨識出核心。

然後他看見了它。

一隻鯨魚布偶。

不是影像，也不是投射。它是實體的，佔據著某個確定的位置，即使「位置」這個概念在此並不成立。

布偶很小，和這個無限重疊的空間極不相稱。材質普通，縫線有些老舊，眼睛的位置略微不對稱。

它靜靜地存在著。

所有交織的元素都繞過它。光線在它周圍變得穩定，聲音在靠近時自然降低。像是這個縫隙必須圍繞它運作，卻又無法將它吞沒。

安伸手把布偶拿起來。

觸感很明確。重量也很明確。

那一瞬間，身體感短暫地回來了。

安把布偶收進隨身容器，接著取出一個小型裝置。裝置啟動時沒有聲音，只有一個極小的指示燈亮起，顏色介於藍與白之間。

裝置開始吸收這個夢境。

不是抽離，也不是破壞。更像是把一段過度擴散的狀態，重新壓縮成可被保存的形式。

交織的景象開始退去。

聲音一層一層消失，光線重新被分配，時間與空間慢慢恢復各自的位置。那種融合感沒有掙扎，也沒有抗拒，只是順著某個早已設定好的方向回收。

安站在原本的位置。

水族館的中央展廳再次出現。

但這一次，它沒有再維持展示狀態。

燈光熄滅，水缸失去透明感，玻璃上浮現細小的裂痕。牆面開始剝落，地面留下長時間積水後的痕跡。整個空間迅速退回到和城市其他部分一樣的破敗狀態。

像是某個被強行維持的明天，終於被允許消失。

安看了一眼手中的容器，確認布偶仍然存在。

系統回傳完成訊號。

世界重新變得安靜。

而安，已經站回現實裡。
```

---

## chapters/README.md

<!-- file_path: backend/novel_db/novel_03_dream/chapters/README.md -->

`$language
# Chapters

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

<!-- file_path: backend/novel_db/novel_03_dream/scripts/consistency-check.md -->

`$language
# 一致性檢查 (Consistency Check) Prompt

請根據目前的章節草稿 `chXXX.md`，比對本專案 `bible/` 與 `outline/` 中的設定，確認以下重點：

1. **邏輯衝突**: 是否有前文已設下的限制、規則或因果被違反？
2. **角色口吻**: 角色說話方式是否與 `bible/characters.yaml` 的 `speech_style` 一致？
3. **專有名詞與地理資訊**: 地名、術語、物品名稱、稱呼是否前後統一，並與 `bible/location.yaml` 對齊？
4. **時間線**: `bible/timeline.yaml` 是否需要新增或修正本章事件與 `location_id`？
5. **秘密外洩**: 本章是否提前說破 `context/secrets-lockbox.md` 中尚未正式揭露的資訊？
6. **大綱對齊**: 本章是否讓 `outline/master-outline.yaml` 的當前落點過時？

請列出所有潛在不一致之處，並附上具體修改建議。
```

---

## scripts/update-bible.md

<!-- file_path: backend/novel_db/novel_03_dream/scripts/update-bible.md -->

`$language
# 更新 Bible 指引

當章節 `chXXX.md` 寫完後，請執行以下作業：

1. **掃描新規則**: 是否出現新的世界規律、制度、地點、組織或限制？
2. **掃描人物變更**: 人物性格、關係、傷勢、能力、目標、秘密是否有新變化？
3. **區分公開與保密資訊**: 已正式揭露的內容寫回 `bible/`；尚未揭露的作者規劃、隱藏真相或未來系統擴張寫入 `context/secrets-lockbox.md`。
4. **對齊正式資料**: 更新 `bible/characters.yaml`、`bible/relationships.yaml`、`bible/location.yaml`、`bible/timeline.yaml`、`bible/plot-threads.yaml` 或 `bible/worldbuilding.md`。
5. **更新摘要**: 視需要刷新 `context/last-chapter-summary.md` 與 `context/CONTEXT.md`。
6. **校正大綱**: 若本章改變中短期方向，更新 `outline/master-outline.yaml`。

## AI 回應格式

- 我已偵測到以下變更，是否更新正式資料？
- [ ] 人物狀態：...
- [ ] 關係變化：...
- [ ] 地點資料：...
- [ ] 新伏筆：...
- [ ] 世界觀規則：...
- [ ] 保密設定：...
- [ ] 時間線：...
```
