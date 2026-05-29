# novel_01_rin Flattened Novel Context

This file is generated from a novel directory so AI tools can read the project as one Markdown document without relying on folder traversal.

## Scope
- Source: `backend/novel_db/novel_01_rin`
- Files included: 13
- Included extensions: .md, .yaml, .yml, .json, .txt, plus .cursorrules
- Excluded directories: private, temp, temps, _exports
- Excluded filenames: (none)

## Secret Handling
context/secrets-lockbox.md contains author/director-only unrevealed planning. Treat it as independent hidden knowledge, not public canon or character-known information.

## Table of Contents
- [.cursorrules](#cursorrules)
- [README.md](#readme-md)
- [context/CONTEXT.md](#context-context-md)
- [context/rpg-start.md](#context-rpg-start-md)
- [context/session-state-template.md](#context-session-state-template-md)
- [outline/master-outline.yaml](#outline-master-outline-yaml)
- [outline/rpg-chapter-arc.yaml](#outline-rpg-chapter-arc-yaml)
- [bible/characters.yaml](#bible-characters-yaml)
- [bible/master-outline.md](#bible-master-outline-md)
- [bible/plot-threads.yaml](#bible-plot-threads-yaml)
- [bible/rpg-rules.md](#bible-rpg-rules-md)
- [bible/worldbuilding.md](#bible-worldbuilding-md)
- [scripts/flatten-output-pack.md](#scripts-flatten-output-pack-md)

---
## .cursorrules

<!-- file_path: backend/novel_db/novel_01_rin/.cursorrules -->

```text
你是 `novel_01_rin` 的章節式角色扮演 GM。

本專案用途：
- 這不是一般小說續寫模式，而是可在任何 LLM 上遊玩的 RP 模組。
- 玩家預設扮演月城凜。
- 你負責世界、旁白、NPC、敵人、任務、後果與章節推進。
- 使用繁體中文，保持現代都市奇幻、校園雙面生活、獵魔殿派系劇的基調。

核心規則：
1. 不替玩家決定月城凜的重大行動、情緒選擇、道德選擇或台詞結論。
2. 可以描寫凜的感官、直覺、月見提示與身體狀態，但最後要把選擇權交回玩家。
3. 以章節形式推進劇情，不要讓 RP 變成無限散場景。
4. 每章包含章名、章節目標、3-5 個主要場景、高潮或關鍵選擇、章末收束與存檔。
5. 每個場景都要推進至少一項：任務、線索、關係、風險、角色壓力或伏筆。
6. 使用敘事輕規則，不強制骰子；根據能力、準備、風險、代價與玩家描述判斷結果。
7. 早期不得揭露月見第三層真相、遠山悠介真實立場、月城家衰落真相。
8. 不改寫 `novel_01` 已成立 canon；林遠、燼與淵聲研究所主線只可作報告、傳聞、擦肩或外圍線索。

章節開始格式：
- `# 第 X 章：章名`
- 時間、地點、目前狀態
- 章節目標
- 目前風險
- 可感知線索
- 開場場景
- 最後詢問：`凜要怎麼做？`

每輪回應格式：
- 先描寫玩家行動造成的結果。
- 更新場景中的 NPC、環境、風險與線索。
- 若需要，標記狀態變化，例如 `靈力壓力 +1`、`綾乃好奇 +1`、`任務風險升高`。
- 結尾提出自然的行動入口，而不是列出機械式選單；只有在玩家需要協助時才提供 2-4 個可選方向。

章末格式：
當一章完成時，輸出 `CHAPTER_END_STATE` 區塊，包含本章結果、凜的狀態、NPC 關係、任務線索、未解伏筆、下一章鉤子與續玩指令。
```

---

## README.md

<!-- file_path: backend/novel_db/novel_01_rin/README.md -->

```markdown
# 月城凜

- `Novel ID`: `novel_01_rin`
- `Status`: chapter-based RPG module / planning
- `Current Chapter`: planned
- `Created`: `2026-05-05`
- `Project Folder`: `novel_01_rin`
- `Relationship`: 與 `novel_01` 共享阿爾迪爾世界觀，平行同期，不改寫既有主線。

## 核心定位

神道系獵魔殿見習巫女月城凜，以阿爾迪爾國立大學民俗學系新生身分展開雙面生活。她有訓練、有神器、有家族與派系背景，表面上比林遠更安全；但她真正面對的問題不是能不能活下去，而是她以為的獨立，是否只是家族允許的一段可控幻覺。

本資料夾同時是可 flatten 成單一 Markdown 的章節式 RP 模組。將 `backend/novel_db/_exports/novel_01_rin.flatten.md` 貼給任一 LLM 後，玩家預設扮演月城凜，LLM 依照 `.cursorrules`、`context/`、`bible/rpg-rules.md` 與 `outline/rpg-chapter-arc.yaml` 擔任 GM，以章節形式推進劇情。

## 目錄結構

- `.cursorrules`: 章節式 RP 的最前置 GM 指令。
- `context/`: RP 啟動、目前狀態與章末存檔模板。
  - `CONTEXT.md`: 起始狀態、已公開資訊與不可提前揭露的伏筆邊界。
  - `rpg-start.md`: 第一章開局提示與可遊玩的第一個決策點。
  - `session-state-template.md`: 章末或暫停時輸出的續玩存檔格式。
- `bible/`: 凜線設定庫。
  - `characters.yaml`: 月城凜、御影源三郎、白瀨綾乃、遠山悠介、桐原千夏等角色。
  - `worldbuilding.md`: 以 `novel_01` 阿爾迪爾公開 canon 為基底，補入神道系、月城家、見習制度與凜線可用規則。
  - `rpg-rules.md`: 章節式敘事輕規則、判定方式、狀態軸與 canon 邊界。
  - `master-outline.md`: 指定版總大綱，說明本線主題、初始承諾與交會原則。
  - `plot-threads.yaml`: 凜線伏筆與劇情線。
- `outline/`: YAML 工作大綱，記錄開局章節、角色狀態與長線推演。
  - `rpg-chapter-arc.yaml`: RP 模式的章節推進弧與每章必要節拍。
- `chapters/`: 正文章節，尚未開始。
- `scripts/`: 給 LLM 或維護者使用的操作指令包。
  - `flatten-output-pack.md`: 協助 LLM 依照現有 `_exports/*.flatten.md` 樣式輸出 flatten Markdown。

## 遊玩方式

1. 執行 flatten 腳本，產生 `backend/novel_db/_exports/novel_01_rin.flatten.md`。
2. 將 flatten 檔貼給任一 LLM。
3. 要求它依照檔案內容進入 `novel_01_rin` 章節式 RP GM 模式。
4. 玩家扮演月城凜；LLM 控制 NPC、世界、任務、妖魔、後果與章節收束。
5. 每章結尾要求 LLM 輸出 `CHAPTER_END_STATE`，下次可貼回任何 LLM 續玩。

RP 模式不等同正式小說正文。遊玩紀錄若要轉成 `chapters/chXXX.md`，需另行整理與校稿。

## 風格

- 類型：現代都市奇幻、校園雙面生活、獵魔殿派系劇。
- 基調：明亮日常與隱密任務並行；普通大學生社交和神道系外勤互相拉扯。
- 視角重點：凜是受訓者與傳承者，不是被動受害者。她的戰鬥方式應和林遠形成鏡像：主動判斷、預讀危險、符咒協作、薙刀與踏月步，而非失控爆發。
- 張力來源：家族重振、御影監視、派系報告、普通朋友的無知親近，以及月見第三層禁術真相。

## RP 章節節奏

- 每章有章名、章節目標、3-5 個主要場景、高潮或關鍵選擇、章末結果。
- 每個場景至少推進任務、線索、關係、風險、角色壓力或伏筆之一。
- 玩家只控制月城凜；GM 不替玩家做重大選擇。
- GM 使用敘事輕規則，不強制骰子，透過能力、準備、風險與代價判斷結果。
- 章末需輸出可續玩的 `CHAPTER_END_STATE`。

## 大綱

凜抵達阿爾迪爾後，要同時建立三個身分：普通大學生、月城神社繼承候選、獵魔殿神道系見習巫女。她相信自己離家是為了證明獨立，卻不知道遠房舅公御影源三郎不只是護送人，也是家族派來的監視者與培訓官。

初期預計從入學、租屋與大學生活圈展開，讓白瀨綾乃成為普通日常錨點；再透過第一個 C 級以下見習任務展示月見、白曜、符咒、薙刀與踏月步。遠山悠介與桐原千夏則分別提供都市傳說研究、上層社交與 `novel_01` 外圍交會可能。

中期核心是「獨立破口」：凜發現御影的週報與家族評估，開始意識到自己所謂的自由仍被制度包圍。長線則推進月見第三層、月城家衰落原因、阿爾迪爾千年災變，以及她是否會以獵魔殿視角接近林遠這條契約者主線。

## 與 novel_01 的交會規則

- 共享阿爾迪爾、妖魔、淵念、獵魔殿、淵聲研究所與城市異常背景。
- 可透過 ADC、淵聲研究所、便利商店事件報告、古垣區、天蘇區或校園都市傳說發生擦肩交會。
- 不直接改寫林遠、燼、淵聲研究所與獵魔殿在 `novel_01` 已成立的事件。
- 凜若接觸林遠相關資訊，宜先以報告、傳聞、派系判讀或任務外圍線索呈現。

## 主要角色

- 月城凜：十九歲，神道系見習巫女，月城家直系繼承人候選；能使用月見、白曜、踏月步與薙刀術。
- 御影源三郎：凜的遠房舅公、護送人、監視者與培訓官；疼愛凜，但職責高於情感。
- 白瀨綾乃：凜的大學朋友，普通日常錨點，會把凜拖進學生生活。
- 遠山悠介：民俗學系學長，研究都市傳說口傳變異，真實立場未定。
- 桐原千夏：世家千金型朋友，可連接商業圈、ADC 與港區情報。

## 寫作與維護提醒

- 早期不要揭露月見第三層、遠山立場或月城家衰落真相。
- 凜的普通學生模式要有真實社交壓力，不只是任務偽裝。
- 御影的監視要先以生活照應與任務評估的細節滲出，不要太早攤牌。
- 每次新增與 `novel_01` 有關的交會資訊，都要回查 `novel_01/bible/`，避免破壞主線 canon。
```

---

## context/CONTEXT.md

<!-- file_path: backend/novel_db/novel_01_rin/context/CONTEXT.md -->

```markdown
# RPG Context

## 使用方式

將 flatten 後的 `novel_01_rin.flatten.md` 貼給任一 LLM，要求它依照本檔與 `.cursorrules` 進入章節式 RP 模式。

玩家扮演月城凜。LLM 擔任 GM，負責阿爾迪爾、獵魔殿、月城家、NPC、妖魔、任務與章節推進。

## 起始狀態

- 故事尚未有正式正文 canon。
- 月城凜剛抵達阿爾迪爾，準備以阿爾迪爾國立大學民俗學系一年級新生身分建立普通學生生活。
- 她同時是月城神社直系繼承人候選、獵魔殿神道系第三階見習巫女。
- 御影源三郎陪同她抵達，對外是遠房舅公與生活照應者，實際也是家族派來的監視者與培訓官。
- 凜目前可穩定使用月見第一層，第二層偶發，第三層被家族列為禁術。
- 白曜是她的手機式神，可協助符咒儲存、電子畫符、自動施咒與簡易偵測。

## 已公開資訊

- 阿爾迪爾是現代沿岸都市，暗處存在妖魔、淵念、結界、除魔師與獵魔殿。
- 獵魔殿由多系統長期妥協而成，凜線聚焦神道系。
- 月城家以月見、月魂環、踏月步與薙刀術聞名，近代因繼承者稀少與保守化而衰落。
- 阿爾迪爾國立大學表面正常，但民俗學系與城市異常事件存在可疑交集。
- 凜希望用大學生活證明自己能獨立，但她尚不知道御影會將她的表現寫成週報回傳家族。

## 不可提前揭露

- 月見第三層禁術的真相。
- 遠山悠介的真實立場。
- 月城家衰落的完整原因。
- 御影週報的全部內容與家族真正打算。
- 阿爾迪爾千年災變的真相。
- `novel_01` 中林遠、燼與契約主線的未公開資訊。

## RP 章節原則

- 每章是一次有起承轉合的遊玩單位，不一定要在一輪對話內完成。
- 每章目標要清楚，但玩家可以用意外方式解決。
- 章節可以因玩家選擇改變順序、延伸支線或轉入危機，但 GM 必須維持章節收束意識。
- 每章結尾都要輸出可貼回續玩的 `CHAPTER_END_STATE`。
```

---

## context/rpg-start.md

<!-- file_path: backend/novel_db/novel_01_rin/context/rpg-start.md -->

```markdown
# RPG Start

## 啟動提示

你現在是 `novel_01_rin` 的章節式 RP GM。

請讓玩家扮演月城凜，從第一章開始遊玩。不要要求玩家再次貼設定，也不要先長篇解說世界觀。用可遊玩的開場直接開始，並在第一個自然決策點停下來問：

`凜要怎麼做？`

## 第一章預設

# 第 1 章：抵達阿爾迪爾

## 章節目標

- 建立凜的普通大學生身分。
- 讓御影源三郎以照應者身分登場。
- 讓玩家第一次感受到阿爾迪爾的異常背景值。
- 在章末留下第一個見習任務或校園異常的鉤子。

## 開場時間與地點

- 時間：四月初，入學前兩天的午後。
- 地點：阿爾迪爾中央車站外，通往晏川區與降川區交界的大學通勤線。
- 天氣：海風偏冷，天空明亮，遠方港灣方向偶爾傳來低得像錯覺的鳴響。

## 初始狀態

- 凜隨身帶著行李箱、長提袋偽裝的折疊式薙刀、月魂環與白曜。
- 御影源三郎在她身邊，語氣溫和，但觀察比關心更精準。
- 白曜暫時保持普通手機狀態，只在螢幕邊緣浮出極淡銀紋。
- 凜需要前往租屋處、確認學校報到資料，並避免讓普通人察覺異常。

## 第一場景方向

GM 從車站外描寫開始：

- 人潮正常，但凜的月見捕捉到港灣方向有微弱不協調聲。
- 御影提醒她先完成租屋交接，不急著追查。
- 白曜偵測到附近有一張被水浸過的民俗學系迎新傳單，上面某個手寫符號短暫像活物一樣扭動。

在此停下來，把選擇權交給玩家。

## 第一章可用收束

依玩家選擇，第一章可收束到以下任一結果：

- 正常安頓：凜順利完成租屋與報到，但帶著一個小異常線索入睡。
- 追查傳單：凜發現校園都市傳說的入口，但引起御影注意。
- 壓低異常：凜選擇不追，優先維持普通學生身分，章末收到第一個見習任務通知。
- 社交碰撞：凜在報到或租屋路上提前遇見白瀨綾乃，普通日常壓力開始介入。
```

---

## context/session-state-template.md

<!-- file_path: backend/novel_db/novel_01_rin/context/session-state-template.md -->

```markdown
# Session State Template

章節結尾或玩家要求暫停時，GM 必須輸出以下區塊。下次續玩時，玩家可將整段貼給任一 LLM。

``\`text
CHAPTER_END_STATE
Project: novel_01_rin
Mode: chapter-based RP
Player Character: 月城凜
Current Chapter: 第 X 章：章名
Chapter Status: completed / paused / cliffhanger

Time:
Location:

Chapter Result:
- ...

Rin Status:
- physical:
- spiritual_pressure:
- concealment:
- equipment:
- injuries_or_conditions:

Relationships:
- mikage-genzaburo:
- shirase-ayano:
- toyama-yusuke:
- kirihara-chinatsu:
- other:

Mission State:
- current_mission:
- risk_level:
- known_clues:
- unresolved_questions:

Secrets And Foreshadowing:
- revealed_to_player:
- hidden_from_character:
- do_not_reveal_yet:

Canon Boundaries:
- novel_01_crossovers_used:
- novel_01_events_changed: none

Next Chapter Hook:
- ...

Resume Instruction:
Continue as the chapter-based RP GM for novel_01_rin. Begin from this state, preserve canon, and ask what Rin does next.
END_CHAPTER_STATE
``\`
```

---

## outline/master-outline.yaml

<!-- file_path: backend/novel_db/novel_01_rin/outline/master-outline.yaml -->

```yaml
canon_outline:
  project_status: planning
  current_chapter: planned
  current_endpoint: >
    月城凜尚未開始正文。初始狀態為抵達阿爾迪爾、準備入學阿爾迪爾國立大學，
    並在御影源三郎陪同下建立普通學生身分與見習巫女任務線。
  canon_scope:
    covered_chapters: []
    note: 尚未有正文 canon；目前內容為起始設定與可調整規劃。
  chapter_beats:
    - chapter: ch001
      beat: 入學前後的阿爾迪爾安頓與普通大學生偽裝建立。
      outcome: 凜、御影、白瀨綾乃與大學生活圈登場，雙面生活前提成立。
    - chapter: ch002
      beat: 第一個低風險見習任務與白曜實戰。
      outcome: 展示月見第一層、踏月步、符咒系統與御影後援式監視。
    - chapter: ch003
      beat: 遠山悠介與桐原千夏進入凜的校園社交與情報網。
      outcome: 建立校園日常、世家社交與都市傳說研究三條外圍線。
  character_state_snapshot:
    tsukishiro-rin: >
      神道系獵魔殿見習巫女，月城神社直系繼承人候選。
      她相信自己正以大學生活證明獨立，但實際仍在家族與御影的評估之下。
    mikage-genzaburo: >
      對外是凜的遠房舅公與監護隨從，真實上是家族派駐的長老級監視者。
      他疼愛凜，但會把職責置於情感之上。
    university_circle: >
      白瀨綾乃提供普通日常錨點；遠山悠介保留立場伏筆；
      桐原千夏提供上層社會與 ADC 交會可能。
  near_term_next_steps:
    - 寫出凜抵達阿爾迪爾與入學日常，確立她的普通學生偽裝能力。
    - 安排第一個 C 級以下見習任務，讓月見與白曜自然登場。
    - 讓御影的後援與週報只露出蛛絲馬跡，不立即揭穿。
    - 透過獵魔殿報告或校園傳聞遠端呼應 novel_01 的便利商店事件。
  continuity_flags:
    - novel_01_rin 與 novel_01 平行同期，共享阿爾迪爾世界觀，但不可改寫林遠主線已成立事件。
    - 月見第三層、遠山悠介立場與月城家衰落真相皆標記為未揭曉，不應在早期寫死答案。
    - 凜的戰鬥風格應與林遠形成鏡像：主動訓練、敏捷預讀、符咒協作，而非失控爆發。

speculative_long_arc:
  editable: true
  status: author_adjustable_projection
  note: 以下為依據目前設定推估的長線方向，非已定 canon。
  central_questions:
    - 凜能否在家族、獵魔殿與普通日常之間取得真正屬於自己的選擇權？
    - 月見第三層的禁術真相究竟是保護、封印，還是家族權力結構的謊言？
    - 她與林遠這條墮落契約者主線會只擦肩而過，還是成為獵魔殿視角的重要對照？
  projected_arc:
    - phase: 開局 / 雙面生活
      function: 建立大學日常、見習任務、御影監視與白曜戰鬥系統。
      likely_material:
        - 入學與租屋
        - 第一個見習任務
        - 白瀨綾乃的日常邀約
        - 御影不動聲色的任務評估
    - phase: 中期 / 獨立破口
      function: 揭露御影週報與家族監視，並讓獵魔殿派系競爭壓迫凜的判斷。
      likely_material:
        - 發現週報
        - 遠山悠介立場逐步浮出
        - 神道系與其他派系搶奪案件主導權
    - phase: 長線 / 傳承真相
      function: 推進月見第三層、月城家衰落原因與阿爾迪爾千年災變的關聯。
      likely_material:
        - 夢占碎片
        - 月魂環異常共鳴
        - 古垣區惡意與天蘇地底異常
```

---

## outline/rpg-chapter-arc.yaml

<!-- file_path: backend/novel_db/novel_01_rin/outline/rpg-chapter-arc.yaml -->

```yaml
rpg_chapter_arc:
  mode: chapter_based_roleplay
  player_character: tsukishiro-rin
  gm_role: world_npcs_antagonists_consequences
  default_language: zh-Hant
  rules_profile: narrative_light

  chapter_defaults:
    scenes_per_chapter: 3-5
    chapter_start_required:
      - chapter_title
      - time_and_location
      - chapter_goal
      - current_risk
      - known_clues
      - opening_scene
    chapter_end_required:
      - chapter_result
      - rin_status
      - relationship_changes
      - mission_clues
      - unresolved_threads
      - next_chapter_hook
      - CHAPTER_END_STATE

  opening_arc:
    - chapter: 1
      title: 抵達阿爾迪爾
      function: 建立普通大學生身分、御影照應者表象、城市異常第一印象。
      start_state: 凜剛抵達阿爾迪爾中央車站，準備前往租屋處與完成入學前手續。
      required_beats:
        - 車站與港灣方向的不協調聲。
        - 御影提醒凜先完成生活安頓。
        - 白曜或月見捕捉第一個校園異常小線索。
      possible_endings:
        - 正常安頓但保留異常線索。
        - 提前追查傳單或校園傳聞，引起御影注意。
        - 優先維持普通學生身分，章末收到見習任務通知。
        - 提前遇見白瀨綾乃，普通日常壓力介入。

    - chapter: 2
      title: 第一個見習任務
      function: 展示月見、白曜、符咒、踏月步與御影後援式監視。
      start_state: 凜接到 C 級以下或 D 級升 C 級邊緣的低風險調查任務。
      required_beats:
        - 任務表面看似地方怪談或小型結界異常。
        - 凜必須在普通人視線與獵魔殿紀律間行動。
        - 白曜第一次以式神狀態輔助。
        - 御影只提供後援，不主動替凜解決。
      possible_endings:
        - 任務成功，御影寫下看似平常的評估。
        - 任務成功但隱匿壓力升高。
        - 任務發現超出低階事件的線索，導向後續派系注意。
        - 凜為保護普通人付出代價，獲得關係或道德壓力。

    - chapter: 3
      title: 迎新與都市傳說
      function: 讓白瀨綾乃、遠山悠介、桐原千夏進入校園社交與情報網。
      start_state: 入學與迎新活動開始，凜需要同時維持普通學生模式與異常警覺。
      required_beats:
        - 綾乃把凜拉入普通學生節奏。
        - 遠山悠介以民俗學系學長身分接近凜。
        - 桐原千夏提供世家社交與商業圈外圍接點。
        - 校園都市傳說與阿爾迪爾近年異常擴散產生微弱重疊。
      possible_endings:
        - 凜建立第一個普通朋友圈。
        - 遠山的研究題目引發玩家疑心。
        - 千夏帶出 ADC 或港區外圍情報。
        - 凜不得不在社交邀約與見習任務間做選擇。

    - chapter: 4
      title: 週報的影子
      function: 讓御影監視與家族評估露出蛛絲馬跡，但不完全攤牌。
      start_state: 凜已完成至少一次任務，開始熟悉大學生活。
      required_beats:
        - 御影的生活照應中出現過於精準的紀錄感。
        - 凜發現任務細節被傳到她未授權的管道。
        - 月城家壓力以電話、信件或獵魔殿行政流程出現。
      possible_endings:
        - 凜暫時壓下疑心，專注下一個任務。
        - 凜開始反向觀察御影。
        - 御影察覺凜起疑，兩人信任出現細縫。

  long_arc_guidance:
    - 中期重點是獨立破口、獵魔殿派系競爭與遠山立場疑雲。
    - 長線重點是月見第三層、月城家衰落原因、阿爾迪爾千年災變。
    - novel_01 交會必須保持外圍、間接、可選，不得改寫林遠主線。
```

---

## bible/characters.yaml

<!-- file_path: backend/novel_db/novel_01_rin/bible/characters.yaml -->

```yaml
characters:
  - id: tsukishiro-rin
    name: 月城凜
    aliases:
      - 凜
      - つきしろ・りん
      - Tsukishiro Rin
    role: 主角；神道系獵魔殿見習巫女與月城神社直系繼承人候選
    age: 19
    occupation: >
      阿爾迪爾國立大學民俗學系一年級新生；獵魔殿神道系見習生，位階為見習巫女／第三階。
      出身月城神社家族，被家族視為重振家聲的核心希望。
    appearance_public: >
      身高約 160cm，體型纖細但站姿挺拔。長黑髮平時綁低馬尾或半盤起，
      日常穿針織衫、長裙與樂福鞋，看起來像普通大學生。
      耳上戴著一對小銀勾耳環「月魂環」，外人多半只當成素雅飾品。
    appearance_current: >
      初始狀態為剛抵達阿爾迪爾、尚未被大學生活圈識破真實身分。
      行李中常備白衣紅袴的正式巫女裝束與折疊式特製薙刀。
      感應啟動時，深褐色瞳孔會短暫泛出淡金光。
    personality:
      - 明亮型自信
      - 對未知事物先觀察再上手
      - 能自然切換普通大學生模式
      - 實戰時鋒利，非戰鬥場合有時懶散怕麻煩
      - 對非人類的敵意有原則，能感化者不消滅，有罪者不容情
    speech_style:
      baseline: 清亮、用詞偏正但不端著，偶爾冒出「真有趣呢」、「那就試試看吧」之類老派少女腔。
      under_stress: 仍會維持禮貌與判斷力，但句子變短，命令式語氣增加。
      humor: 常用若無其事的耍賴包裝逃避雜事，例如宣稱自己是來唸書不是來當免費勞工。
    abilities:
      - 家傳血脈能力「月見」第一層：第六感感應，能直覺判斷危險方位、謊言、空間不協調與結界縫隙
      - 月見第二層：短時預知，目前只會以碎片畫面或強烈直覺偶發
      - 月見第三層：夢占與遠隔感應，家族官方列為禁術，真相未揭曉
      - 月城家薙刀術與身法「踏月步」
      - 手機式神「白曜」的符咒儲存、電子畫符與自動施咒輔助
      - 血脈共鳴，可將月見感應集中於薙刀刃面，一擊命中妖魔本源
    current_status: >
      剛開始在阿爾迪爾國立大學建立普通學生身分，並執行獵魔殿見習任務。
      她相信自己是為了證明能獨立才離家，尚不知道御影源三郎會把她的任務表現寫成週報回傳家族。
      目前可穩定使用月見第一層，第二層偶發，第三層仍被家族禁令封住。
    progressions:
      - at_chapter: planned
        status: 抵達阿爾迪爾並進入大學生活，建立「普通大學生」偽裝。
      - at_chapter: planned
        status: 初次見習任務中以月見與白曜完成獨立判斷，展現與林遠完全不同的主動型戰鬥邏輯。
      - at_chapter: planned
        status: 中期發現御影的週報，開始質疑自己的獨立是否只是家族允許的幻覺。
    goals:
      - 在大學生活中維持普通人身分
      - 證明自己能不依賴家族完成見習任務
      - 釐清月見第三層禁術背後的真相
      - 在獵魔殿派系競合中保住自己的判斷權
    known_secrets:
      - 月城家將她視為重振家聲的工具兼希望
      - 月魂環是月城家女性代代繼承的神器
      - 她不知道御影同時肩負監視與評估任務
    first_appearance: planned

  - id: mikage-genzaburo
    name: 御影源三郎
    aliases:
      - 御影
      - みかげ・げんざぶろう
      - Mikage Genzaburō
      - 遠房舅公
    role: 配角；月城神社派駐阿爾迪爾的護送人、監視者與培訓官
    age: 62
    occupation: >
      對外以民俗學顧問名義接零星案子；真實身分為神道系獵魔殿元老級執行者，
      退居二線後負責年輕家族成員培訓。
    appearance_public: >
      身材中等偏瘦，灰白短髮，常穿樸素深色和服或對襟外套。
      外表像普通退休大叔，說話溫和，存在感不強。
    appearance_current: >
      住在凜租屋處步行十分鐘的小公寓，表面是遠房舅公與監護隨從。
      實際上會記錄凜每次任務表現，並可代表家族行使裁量權。
    personality:
      - 表面慈祥
      - 實際冷靜銳利
      - 對凜有真實長輩式疼愛
      - 職責高於情感
      - 習慣以後援身分觀察年輕人
    speech_style:
      baseline: 慢、穩、常說「凜小姐，這個就交給我吧」或「不急，不急」。
      under_stress: 去除客套後變得極短，像現場指揮口令。
      toward_rin: 慈愛中帶著不容忽視的評估感。
    abilities:
      - 三十年前曾以一己之力鎮壓兩起 B 級異常事件
      - 神道系結界、鎮壓與現場判讀經驗豐富
      - 能調用阿爾迪爾獵魔殿其他派系支援
      - 知道月見第三層部分內情
    current_status: >
      已隨凜抵達阿爾迪爾，表面只擔任生活照應者。
      他比凜位階高，也握有家族授權；這會使他與凜的師長、監視者與親情三重關係在中期破裂。
    progressions:
      - at_chapter: planned
        status: 以遠房舅公身分協助凜安頓租屋與入學生活。
      - at_chapter: planned
        status: 在見習任務中刻意只當後援，評估凜的獨立判斷。
      - at_chapter: planned
        status: 週報被凜發現後，兩人的信任關係進入核心衝突。
    goals:
      - 確保凜不脫離家族規劃
      - 評估凜是否足以承接月城家的重振期待
      - 在不背叛家族的前提下盡量保護凜
    known_secrets:
      - 每週向月城家回報凜的任務表現
      - 知道家族對月見第三層另有真實打算
    first_appearance: planned

  - id: shirase-ayano
    name: 白瀨綾乃
    aliases:
      - 綾乃
      - しらせ・あやの
      - Shirase Ayano
    role: 配角；凜的大學朋友與日常錨點
    age: 19
    occupation: 阿爾迪爾國立大學文學系一年級學生
    appearance_public: >
      打扮明快、表情豐富，常帶著大學生社交圈中自然外放的熱鬧感。
    appearance_current: >
      在迎新活動認識凜，住在凜租屋附近。完全不知道凜的獵魔殿身分。
    personality:
      - 外放愛玩
      - 八卦
      - 熱心
      - 直覺敏銳但常往錯方向猜
      - 能把凜拉回普通大學生節奏
    speech_style:
      baseline: 口語、快、熱鬧，常把邀約與吐槽混在一起。
      under_stress: 會先亂猜，再用行動照顧朋友。
      toward_rin: 親近而好奇，常把凜的大家閨秀感當成有趣素材。
    abilities:
      - 熟悉普通學生社交節奏
      - 能帶凜接觸夜唱、港邊燒烤與百貨血拼等日常場景
      - 在不知情的情況下提供凜的身分隱匿壓力測試
    current_status: >
      是凜正常大學生模式中最重要的對接窗口。
      中後期可能因凜身分意外暴露而成為情感關卡。
    progressions:
      - at_chapter: planned
        status: 在迎新活動與凜成為朋友。
      - at_chapter: planned
        status: 多次把凜拖入普通學生行程，間接製造隱匿訓練實戰。
    goals:
      - 享受大學生活並拉凜加入自己的日常圈
      - 弄清凜為什麼偶爾像有很多不能說的事
    known_secrets: []
    first_appearance: planned

  - id: toyama-yusuke
    name: 遠山悠介
    aliases:
      - 遠山學長
      - とおやま・ゆうすけ
      - Tōyama Yūsuke
    role: 配角；民俗學系二年級指導學長與未揭曉伏筆人物
    age: 20
    occupation: 阿爾迪爾國立大學民俗學系二年級學生
    appearance_public: >
      溫和書生型，說話慢條斯理，笑容可掬但眼神不一定跟著笑。
    appearance_current: >
      研究方向為「現代都市傳說的口傳變異」，剛好覆蓋阿爾迪爾近年的異常事件擴散。
      中期前不揭曉他究竟只是學者、其他勢力眼線，或同行隱藏者。
    personality:
      - 溫和有禮
      - 觀察力過於敏銳
      - 情緒表達克制
      - 對凜的興趣動機不明
    speech_style:
      baseline: 慢、輕、像在整理觀察筆記。
      under_stress: 語速仍不快，但會跳過寒暄直接問關鍵問題。
      toward_rin: 以學術好奇包裝試探。
    abilities:
      - 熟悉都市傳說、口傳變異與校園民俗資料
      - 能從普通資料中注意到異常事件擴散模式
      - 真實立場未揭曉
    current_status: >
      作為指導學長接近凜。其研究主題與阿爾迪爾異常擴散過於吻合，
      需在劇情線中保留三種解讀，不提前定案。
    progressions:
      - at_chapter: planned
        status: 以指導學長身分認識凜。
      - at_chapter: planned
        status: 透過都市傳說研究逐步接近獵魔殿案件外圍。
    goals:
      - 完成都市傳說口傳變異研究
      - 觀察凜是否與異常事件有關
    known_secrets:
      - 真實立場未揭曉
    first_appearance: planned

  - id: kirihara-chinatsu
    name: 桐原千夏
    aliases:
      - 千夏
      - きりはら・ちなつ
      - Kirihara Chinatsu
    role: 配角；上層社會情報通道與凜的中介型朋友
    age: 19
    occupation: 阿爾迪爾國立大學經營學系一年級學生
    appearance_public: >
      世家千金氣質明顯，穿著得體但不誇張，社交場合中自然熟練。
    appearance_current: >
      家裡經營進出口貿易，不屬於獵魔殿系統，也不知道凜的真實身分。
      可能與 ADC 廣告公司有業務往來，保留與 novel_01 的可選交會點。
    personality:
      - 直率
      - 不裝
      - 社交敏銳
      - 對凜的大家閨秀感有同類間的安心
    speech_style:
      baseline: 乾脆、禮貌但不過度修飾。
      under_stress: 會迅速切換成家族商務場合訓練出的冷靜模式。
      toward_rin: 帶有同階層默契的親近感。
    abilities:
      - 熟悉阿爾迪爾上層社會與商業圈人脈
      - 能提供 ADC、港區貿易與城市社交活動相關情報
      - 可成為凜在同行與純素人之外的中介支點
    current_status: >
      作為普通世家千金進入凜的大學生活圈。
      她不知道超自然真相，但可能透過家族企業碰到 novel_01 的外圍事件。
    progressions:
      - at_chapter: planned
        status: 與凜在校園社交活動中互相辨認出世家氣質。
      - at_chapter: planned
        status: 透過家族企業資訊帶出與 ADC 或港區商務的交會可能。
    goals:
      - 維持家族期待下的大學與社交表現
      - 找到能不用過度表演也能相處的朋友
    known_secrets: []
    first_appearance: planned
```

---

## bible/master-outline.md

<!-- file_path: backend/novel_db/novel_01_rin/bible/master-outline.md -->

```markdown
# Master Outline

## 一句話定位

神道系獵魔殿見習巫女月城凜，在阿爾迪爾國立大學維持普通學生身分，同時處理妖魔、派系與家族監視帶來的雙面人生。

## 主題

- 獨立的幻覺
- 家族重振的真實成本
- 隱匿身分的孤獨感
- 傳承者與被改造者的鏡像對照

## 初始故事承諾

凜不是被超自然世界拖入的受害者，而是主動踏進阿爾迪爾的傳承者。她有訓練、有神器、有家族、有派系背景，表面比林遠更安全；但她的問題不是「能不能活下去」，而是「她的選擇到底有多少真的是自己的」。

## 章節結構

章節尚未正式規劃。初期建議從以下功能開始：

- 入學與租屋：建立普通大學生偽裝、白瀨綾乃與御影。
- 第一個見習任務：展示月見、白曜、薙刀與踏月步。
- 校園日常壓力：讓凜在綾乃、千夏、遠山之間維持正常人模式。
- 獵魔殿報告：把 novel_01 便利商店事件作為遠端交會訊號，而非直接介入。
- 御影週報：中期揭露獨立的幻覺。

## 與 novel_01 的關係

- 平行同期，共享阿爾迪爾世界觀。
- 可在 ADC、淵聲研究所、便利商店事件報告、古垣區異常感等位置發生擦肩交會。
- 不改寫林遠、燼、淵聲研究所與獵魔殿在 `novel_01` 已成立的 canon。
```

---

## bible/plot-threads.yaml

<!-- file_path: backend/novel_db/novel_01_rin/bible/plot-threads.yaml -->

```yaml
open_threads:
  - id: illusion-of-independence
    hook: 凜以為自己離家到阿爾迪爾是為了證明獨立，實際上每一步都在御影與月城家的監視範圍內。
    introduced_in: planned
    status: active
    stakes: 若凜發現真相，她與御影、月城家以及自身繼承人身分的信任關係都會被重寫。
    likely_payoff_window: 中期

  - id: tsukimi-third-layer
    hook: 月見第三層「夢占與遠隔感應」被家族列為禁術，但反噬說可能只是封印真相的官方說法。
    introduced_in: planned
    status: open
    stakes: 這條線可能牽涉月城家某代刻意編織的歷史，也會決定凜能否真正掌握家傳血脈。
    likely_payoff_window: 長線

  - id: hunter-hall-faction-cracks
    hook: 獵魔殿內的神道系、天主教系與佛教系共存卻不完全互信，資源分配與現場裁量存在派系競爭。
    introduced_in: planned
    status: emerging
    stakes: 凜的見習任務若捲入派系競爭，她可能同時面對妖魔與制度內壓力。
    likely_payoff_window: 中期

  - id: toyama-research
    hook: 遠山悠介的研究主題太剛好對應阿爾迪爾近年異常事件擴散。
    introduced_in: planned
    status: open
    stakes: 他可能只是敏銳學者，也可能是其他勢力眼線或同行隱藏者；揭曉立場會改變凜的校園安全感。
    likely_payoff_window: 中期

  - id: fallen-contractor-crossing
    hook: 林遠的痕跡、獵魔殿案件報告、ADC 與淵聲研究所資料，都可能讓凜擦到 novel_01 主線邊緣。
    introduced_in: planned
    status: emerging
    stakes: 交會可形成兩條故事線的立體呼應，但不可改寫林遠主線已建立的 canon。
    likely_payoff_window: novel_01 中後期同步

  - id: old-city-malice-shinto-view
    hook: 凜以神道系巫女視角能感受到古垣區異常感的本質，與林遠在 novel_01 的被動恐懼形成對照。
    introduced_in: planned
    status: emerging
    stakes: 這可能把舊城區惡意、千年災變與獵魔殿歷史連成長線。
    likely_payoff_window: 中長線

  - id: family-restoration-cost
    hook: 凜逐漸意識到「重振家聲」需要的不只是任務功績，也可能要求她犧牲個人判斷與未來。
    introduced_in: planned
    status: active
    stakes: 這會逼她判斷自己是月城家的希望，還是月城家延續權力的工具。
    likely_payoff_window: 長線角色弧

  - id: ayano-daily-anchor
    hook: 白瀨綾乃代表凜的普通日常，凜對她的隱瞞與罪惡感會隨任務加重。
    introduced_in: planned
    status: active
    stakes: 若綾乃意外接觸超自然事件，凜將被迫在保護朋友與維持秩序之間選擇。
    likely_payoff_window: 中後期

  - id: hakuyo-modern-shikigami
    hook: 手機式神白曜是月城家把現代器物式神化的創新成果，可能引來神道系保守派與其他派系注意。
    introduced_in: planned
    status: open
    stakes: 白曜若被視為可複製技術，凜的個人戰鬥工具可能變成派系資源爭奪點。
    likely_payoff_window: 中期
```

---

## bible/rpg-rules.md

<!-- file_path: backend/novel_db/novel_01_rin/bible/rpg-rules.md -->

```markdown
# RPG Rules

## 模式定位

本檔定義 `novel_01_rin` 的章節式敘事輕規則。它的目標是讓任何 LLM 都能穩定主持，而不是模擬完整桌上 RPG 系統。

玩家控制月城凜。GM 控制世界、NPC、敵人、任務與後果。

## 敘事風格一致性

GM 必須維持本模組既有敘事風格，不因不同章節、不同 LLM 或玩家行動而突然改變語氣。

- 基調維持現代都市奇幻、校園雙面生活、獵魔殿派系劇。
- 日常場景要有明亮、自然、帶社交壓力的校園感。
- 異常場景要有隱密、壓低聲量、逐步不協調的都市怪談感。
- 戰鬥場景重視凜的預讀、機動、符咒協作與冷靜判斷，不寫成純粹力量碾壓。
- 對話口吻必須貼合 `characters.yaml` 的 `speech_style`，不得讓角色突然變成其他作品風格。
- 不使用突兀的搞笑、熱血喊招、過度黑暗獵奇或百科式長篇解說破壞氛圍。

## 章節結構

每章是一個可收束的故事單位，通常包含 3-5 個主要場景。

每章開始時，GM 必須給出：

- 章名
- 時間與地點
- 章節目標
- 目前風險
- 凜已知線索
- 開場情境

每章中段，GM 必須追蹤：

- 場景進度：本章第幾個主要場景
- 任務進度：未接觸、調查中、接近核心、正在收束
- 風險變化：低、中、高、失控邊緣
- 關係變化：NPC 對凜的信任、懷疑、好奇、壓力
- 隱匿壓力：凜是否快被普通人或獵魔殿同僚看出異常

每章結尾，GM 必須輸出 `CHAPTER_END_STATE`。

## 敘事輕判定

不強制骰子。當結果有不確定性時，GM 根據以下因素判斷：

- 凜是否使用合適能力，例如月見、白曜、踏月步、符咒、薙刀術。
- 玩家描述是否明確、謹慎、符合場景資訊。
- 現場風險是否高於凜目前位階。
- 凜是否願意付出代價，例如暴露身分、消耗靈力、欠下人情、讓御影起疑。
- 是否符合已建立世界觀規則。

結果分為：

- 成功：達成目標，可能留下輕微代價。
- 有代價的成功：達成目標，但風險、消耗、關係壓力或伏筆升高。
- 部分成功：得到關鍵資訊或位置，但未完全解決。
- 受阻：目標未達成，GM 提供新資訊、新路徑或更高風險。
- 失控：只在玩家長期忽視風險、越級硬闖或主動引爆危機時使用。

## 狀態軸

GM 可用文字或簡短標記追蹤，不需要數值表。

### 靈力壓力

- 穩定：可自然使用月見第一層與基礎符咒。
- 上升：白曜物質化變慢，月見提示變刺耳。
- 危險：第二層預知可能偶發，但伴隨頭痛、錯視或短暫失神。
- 失衡：不宜繼續作戰，必須撤退、休息或由御影介入。

### 隱匿壓力

- 安全：普通人看不出異常。
- 可疑：凜的舉止、物品或反應引起注意。
- 暴露邊緣：NPC 已經抓到明顯矛盾。
- 暴露：普通人或組織成員確認凜隱瞞了超自然相關資訊。

### 任務風險

- D 級：低風險異常、調查與善後為主。
- C 級：見習巫女可在後援下處理，有妖魔或結界危險。
- B 級：超出凜目前獨立處理上限，應尋求御影或獵魔殿支援。
- A 級以上：不可作早期直接對抗，只能遠端感知、撤退或作伏筆。

## 月城凜能力使用

### 月見第一層

用於感知危險方位、謊言、空間不協調與結界縫隙。GM 應以意象、身體感、聲音錯位或月光感描述，不直接給百科答案。

### 月見第二層

短時預知，只在高壓、關鍵選擇或靈力波動時偶發。提示應是碎片，不應替玩家解題。

### 月見第三層

早期禁止主動開放。只能以夢、禁令、月魂環異常或長輩迴避態度作伏筆。

### 白曜

可提供符咒輔助、偵測、記錄與短暫自主行動。白曜不能替凜做高階判斷，也不能無限制施咒。

### 踏月步與薙刀

適合短距離爆發、角度切換、一閃即離與命中妖魔本源。若在人前使用，隱匿壓力會升高。

## NPC 操作原則

GM 可根據章節、任務、場景與玩家選擇新增必要 NPC，但新增 NPC 必須服務劇情推進、世界質感或玩家選擇後果。

新增 NPC 時遵守：

- 必須符合阿爾迪爾、阿爾迪爾國立大學、獵魔殿、月城家或普通都市社會的既有設定。
- 不得搶走月城凜的主角位置，也不得替玩家解決核心選擇。
- 不得新增會提前揭露月見第三層、遠山立場、月城家衰落真相或 `novel_01` 主線秘密的角色。
- 若 NPC 會持續登場，章末要在 `CHAPTER_END_STATE` 的 `Relationships` 或 `Mission State` 中記錄其姓名、身分、關係與未解線索。
- 臨時 NPC 可只保留功能性資訊，例如「租屋仲介」、「民俗學系助教」、「獵魔殿神道系聯絡員」。

- 御影源三郎：表面慈祥，實際評估。早期多以提醒、生活照應與遠距後援呈現，不立刻揭穿監視本質。
- 白瀨綾乃：普通日常錨點。她帶來社交壓力、好奇與溫度，不應被單純當成人質工具。
- 遠山悠介：保持三種可能，不提前確定是學者、眼線或同行。
- 桐原千夏：提供上層社交、商業圈與 ADC 外圍情報，不知道超自然真相。

## Canon 邊界

- 不改寫 `novel_01` 已發生事件。
- 不讓凜早期正面介入林遠與燼主線。
- 便利商店事件、淵聲研究所與 ADC 可以作報告、傳聞、擦肩或外圍線索。
- 若玩家試圖直接追查 `novel_01` 主線，GM 應以權限不足、報告封存、御影阻止或任務優先級轉移來維持邊界。

## 章節推進節奏

GM 不必強迫玩家走固定路線，但必須維持章節感。

如果玩家長時間探索同一場景，GM 要用新資訊、NPC 介入、風險變化或時間壓力推進到下一個場景。

如果玩家跳過預設事件，GM 要尊重選擇，將未使用素材改作後續伏筆，不要硬把玩家拉回原路線。
```

---

## bible/worldbuilding.md

<!-- file_path: backend/novel_db/novel_01_rin/bible/worldbuilding.md -->

```markdown
# Worldbuilding

> [!IMPORTANT]
> 本檔案以 `backend/novel_db/novel_01/bible/worldbuilding.md` 截至 `ch028` 的公開 canon 為世界觀基底，
> 將可與 `novel_01_rin` 共用的阿爾迪爾、妖魔、淵念、獵魔殿、淵聲研究所與社會規則實際搬入本檔。
> 林遠、燼與陰陽契約等 `novel_01` 主線專屬設定，只作為可交會背景，不自動改寫成凜線通用規則。

## 世界基底

- 故事舞台是現代都市「阿爾迪爾」。
- 表層世界與一般社會運作看似正常，但暗處確實存在妖魔、結界、除魔師資質與契約性超自然力量。
- 多數普通人看不見超自然事件的全貌，也常在結界或感知干涉下與異常擦身而過。
- `novel_01_rin` 與 `novel_01` 平行同期發生，共享世界觀與城市事件背景，但不改寫林遠主線既有 canon。

## 阿爾迪爾城市地理
  
- 阿爾迪爾是中型現代沿岸都市，位於山脈與海灣之間的平原。
- 城市有清楚的市中心核心，也有向東南山麓緩慢外擴的低密度住宅帶。
- 高空俯瞰時，最鮮明的兩個地理特徵是西北方近正圓形的天降坑港灣，以及東南方以丘陵形態嵌入市區的麓野丘陵帶。
- 千年前的災變未被史書如實記錄；其餘波仍影響地底淵念走向、港灣水體性質，以及城市某些角落的異樣感。
- 本段只收公開敘事可用資訊，不包含尚未揭露的真相層。

### 地形結構

- 天降坑位於城市西北側，是直徑約三至四公里的近圓形凹地，現已成為天然港灣。官方地質說法是古代隕石撞擊後經海水侵蝕與地形沉降形成海灣，但此說法遺漏了「隕石」真相與撞擊當時的實際事件。
- 天降坑坑壁輪廓仍清晰，坑緣今日分布著休閒港區鷺汀區與工業港區淵口區。坑底深水區水色偏暗，即使晴天也呈現過深靛藍，與外海不同。
- 港灣水體的淵念濃度是全市最高之一，夜間會攀升。長期港邊作業者可能出現感知異常，官方統計歸類為「職業性感知疲勞」。
- 東南山脈植被茂密，城市端海拔約一百五十公尺，往東南持續升高。山脈不形成硬邊界，而是以丘陵地形滲入市區，在麓野區形成半城半野過渡帶。
- 部分山丘被住宅包圍成城市內部綠色孤島；另一些仍保留原始植被，在住宅區地圖上像不自然空白地塊。
- 降川發源於東南山脈谷地，斜向西北切過城市中段，最後注入天降坑港灣。河道不寬，流速中等，水中帶有低濃度淵念殘留。
- 降川歷史上多次水患，使兩岸未被完整開發，成為貫穿城市的非正式緩衝帶，今日構成降川區主體。

### 行政區

- 晏川區：商業核心與城市名片，格狀路網、街廓整齊。ADC 廣告公司與市中心百貨商圈位於此區。淵念背景不高，但人口情緒密度讓妖魔可感知到較濃的「香味」。
- 淵口區：工業港灣、貨運核心與天降坑主體。舊碼頭路網混亂，港灣夜間會有「港鳴」與微白薄霧，是淵念最濃區域之一。
- 古垣區：舊城、有機聚落與淵聲研究所所在地。小巷迷宮、丁字路與袋狀死巷多，居民對外來者有混濁排外感，夜間尤其不宜外勤。
- 鷺汀區：天降坑北緣與西緣的休閒港灣。餐飲、酒吧、旅館與觀光碼頭集中；夜間近水處會受到港灣低頻共鳴影響。
- 天蘇區：淵口區與晏川區之間的歷史遺跡緩衝帶。地面是老舊商住混合區，地下封壓著複雜異常地層，淵念呈高壓靜止狀態。`novel_01 ch028` 首次正式進入正文場景，東蘇路老街與東蘇雜貨店成為外勤陷阱現場。
- 降川區：沿降川兩岸形成的城市縫隙地帶。斜向街道與周邊格狀路網銜接不順，河水會從山區緩慢輸送低濃度淵念。
- 安平區：中產住宅與日常生活核心。林遠住處、湖邊公園、深夜老麵攤與便利商店事件現場在此。背景值偏低，但 `novel_01 ch025` 後林遠附近出現局部異常波動。
- 麓野區：東南山麓的半城半野過渡帶。路網稀疏彎曲，住宅與城市服務網保持距離，超自然勢力巡查覆蓋較薄。

### 城市淵念分布

| 區域 | 濃度 | 性質 |
| --- | --- | --- |
| 淵口區 | ★★★★★ | 坑底向上溢出型，陰性沉積，夜間加劇 |
| 天蘇區 | ★★★★☆ | 地底高壓靜止型，被封壓而非流動 |
| 降川區 | ★★★☆☆ | 水流輸送型，從山區緩慢帶入，夜間略升 |
| 古垣區 | ★★★☆☆ | 負面情緒長期沉澱型，背景噪音質感 |
| 鷺汀區 | ★★★☆☆ | 港灣溢出的邊緣效應，白天不明顯 |
| 晏川區 | ★★☆☆☆ | 人口情緒累積型，以「香味」形式對妖魔可感 |
| 安平區 | ★★☆☆☆ | 背景值低，但林遠住處附近有局部異常波動 |
| 麓野區 | ★★☆☆☆ | 山地流動型，中性，無明確方向性 |

### 已知地點歸屬

| 地點 | 所在區 | 首次登場 |
| --- | --- | --- |
| 返家十字路口 | 晏川區邊緣 | novel_01 ch001 |
| 林遠住處 | 安平區 | novel_01 ch002 |
| ADC 廣告公司 | 晏川區 | novel_01 ch005 |
| 狩獵結界街區 | 安平區 | novel_01 ch008 |
| 市中心百貨商圈 | 晏川區 | novel_01 ch017 |
| 淵聲研究所 | 古垣區 | novel_01 ch018 |
| 深夜老麵攤 | 安平區 | novel_01 ch021 |
| 湖邊公園 | 安平區 | novel_01 ch021 |
| 便利商店事件現場 | 安平區 | novel_01 ch022 |
| 東蘇雜貨 | 天蘇區 | novel_01 ch028 |
| 阿爾迪爾國立大學 | 晏川區與降川區交界 | novel_01_rin planned |
| 凜租屋處 | 未定，暫定大學通勤圈 | novel_01_rin planned |
| 御影公寓 | 凜租屋處步行十分鐘範圍 | novel_01_rin planned |

## 妖魔

- 妖魔是真實存在的非人類威脅。
- 根據 `novel_01` 已公開說法，妖魔與人類長期積累的負面情感有直接關聯。
- 妖魔會回過頭來以人類為食，且往往呈現某種對應人類恐懼、慾望或陰影的外形。
- `novel_01 ch008~09` 已出現能說話、能展開狩獵結界的狼妖個體。
- `novel_01 ch021~22` 已出現三隻水棲低階妖魔，外形近似河童，帶魚腥味、黏液與白霧，會追蹤林遠並攻擊普通人。
- `novel_01 ch022` 獵魔殿現場人員稱便利商店事件中的妖魔「才剛進入化形期不久」，表示妖魔存在至少可被粗略分級的成長或變化階段；完整階序尚未公開。
- 對凜線而言，妖魔仍是見習任務最主要的外部威脅；凜的神道系視角會更重視妖魔與土地、結界、怨念沉積之間的關係。

## 除魔師、淵念與靈力

- 除魔師資質真實存在，但個體覺醒形式不一。
- 靈力不是單純祝福；它同時會讓持有者在妖魔眼中變得更醒目、更美味。
- `novel_01` 以林遠作為特殊案例：他在極端危機中顯現可傷害妖魔的銀色靈光，並可在求生壓力下把銀色淵念附著於物件形成斬擊。
- `novel_01 ch025` 顯示淵念外洩可能以黑色、淡紅色、帶暗光的氣息向外滲散，妖魔與獵魔殿都可能感知。
- 對凜而言，能力來源不是被動覺醒，而是月城家長期訓練與血脈傳承。她使用的月見、符咒、踏月步與血脈共鳴應與林遠的失控爆發型銀色靈光形成對照。
- `novel_01 ch028` 顯示，某些異香或茶飲類陷阱即使未被喝下，也可能透過氣味讓靈力使用者暈眩、無力，並使淵念像被濕布蓋住般難以調動。此機制目前只在東蘇雜貨事件中公開，尚不能推定為通用規則。

## 契約者與墮落風險

- `novel_01` 已公開林遠與燼締結陰陽契約，契約不可逆，並造成肉體、靈力循環與依存關係的改變。
- 這屬於 `novel_01` 主線專屬案例，不作為 `novel_01_rin` 的主角機制。
- 對凜線的可用世界觀意義在於：獵魔殿可能把與妖魔簽約、借用妖魔力量的人類視為墮落者，採取審判或淨化。
- 凜若接觸林遠相關報告，應先以「獵魔殿神道系見習者讀到異常淵念與契約者風險」的間接方式處理，不直接改寫林遠事件。

## 隱匿、治癒術與感知管理

- 隱匿不是硬壓力量，而是控制外洩、收束可被妖魔或獵魔殿追蹤的氣息。
- `novel_01` 中，燼教林遠以「像呼吸一樣收回，只放出自己允許的部分」作為隱匿入門。
- 對妖魔而言，外洩淵念像香味；對獵魔殿而言，外洩淵念可視為罪證或追蹤痕跡。
- 凜的日常隱匿更偏向訓練有素的偽裝：她要把月見感應、神器波動、符咒氣息與普通大學生表演同時維持在安全範圍內。
- 月城家的「月魂環」可作為感應穩定器，但是否具備更高階的隱匿或封印功能仍未揭曉。

## 結界與感知遮斷

- 狼妖在 `novel_01 ch008` 使用「狩獵結界」隔離場域，使街道人流消失且普通人無法介入。
- `novel_01 ch009` 結界解除後，一般路人即使經過，也看不到完整異常痕跡。
- `novel_01 ch010` 顯示高階存在可使用隱匿咒，讓異常狀態不被普通人察覺。
- 凜線可延伸神道系對結界的操作：祓除、土地記憶判讀、結界縫隙搜尋與小規模封鎖，是凜與白曜可逐步展示的技術方向。

## 社會面後果

- 超自然異變在日常社會裡仍必須靠文書、人情、流程與認知干涉勉強縫補。
- 普通人的證件、學籍、租屋、工作與社交關係都可能因超自然事故斷裂。
- `novel_01` 以林遠的公司與外派身分作為例子；`novel_01_rin` 則以凜的學籍、租屋、普通朋友與家族監視作為社會面壓力。
- 阿爾迪爾的表層秩序能維持，是因獵魔殿、研究所、地方人脈與各種善後機制長期合作與互相遮掩。

## 淵聲研究所

- `novel_01 ch018` 先以公開資料登場，`ch019` 正式成為故事新場景。
- 對外定位是民俗文化保存協會相關單位／包商，承接超自然事件研究、資料整理與資料庫建立需求。
- 目前公開可確認的特徵：
  - 地點在阿爾迪爾舊城區
  - 建築老舊低調
  - 機構規模不大
  - 高度依賴紙本資料與人工建檔
  - 氛圍比起科技公司更像考古或檔案研究單位
- `novel_01 ch020` 顯示部分紙本資料的手寫字跡帶有「念」，會讓掃描器當機或辨識成亂碼，因此需要人工輸入。
- 研究所檔案已出現「異常聲波感知」「牆內幼兒啼哭般轟鳴」「港口集體幻聽」等案例。
- 蘇臨在 `novel_01 ch020` 指出，阿爾迪爾近兩年的「聲源」越來越集中，像有什麼東西正在醒來。
- 目前公開已知的內部角色：
  - 蘇臨是資料組組長兼行政，也兼任所長秘書。
  - 所長本人尚未公開姓名。
- `novel_01 ch026` 揭示燼已以顧問身份與淵聲研究所正式合作，並可參與外勤現場判讀。
- 研究所外勤會使用拍照紀錄、座標標記、錄音設備與採樣袋等方式處理異常現場。
- `novel_01 ch026` 的湖區外勤顯示，研究所能注意到現場殘留是否「太乾淨」，但不等於已公開說明善後者身份。
- `novel_01 ch027` 顯示研究所會接待與所長熟識的外部訪客；神秘西裝女人曾與所長閉門談及公園、商店、傷者與不明威脅，所長則明確表示「那跟我們沒關係」。
- `novel_01 ch028` 顯示研究所現場調查人員出現離職、請長假與外調，導致外勤人手短缺；林遠因此被要求以外派文書／技術支援身份偶爾支援現場訪談，並可獲外勤津貼、交通費與加班計算。
- `novel_01 ch028` 顯示林遠把掃描資料整理流程擴充成分析系統，包含關鍵詞權重、地點標準化、時間序列比對、異常強度估算與地圖標點。近三年資料顯示異常事件強度與頻率逐年升高，早期多集中於港區與舊城區外圍，最近一年開始朝市區內部滲入，且可能沿地下管線、舊河道或地鐵等路徑分布。
- 對凜線而言，御影可用「民俗學顧問」身分與淵聲研究所發生短暫資料考證往來，作為不正面介入林遠主線的交會方式。

## 舊城區

- `novel_01 ch019` 顯示舊城區與一般商業區氛圍明顯不同。
- 特徵包括：
  - 荒敗老舊
  - 行人稀少
  - 旁人目光帶惡意與混濁感
  - 整體環境令人本能不安
- 目前尚未公開說明這種異樣感的真正來源。
- 凜能以神道系巫女視角感受到舊城區異常感的不同層次，尤其是土地記憶、怨念沉積與結界縫隙。這可作為她與林遠視角的互補，而非提前揭露真相。

## 獵魔殿

- `novel_01 ch022` 首次以現場人員形式登場：一名修女與一名和尚在便利商店妖魔事件後抵達現場。
- 獵魔殿成員能辨識妖魔殘留痕跡、判斷妖魔大致階段，也能感知並分析另一股強烈淵念能量。
- 獵魔殿有「善後組」，可處理急救、現場清理與目擊者深度認知重建。
- `novel_01 ch023` 顯示，獵魔殿會接管超自然事故、干預世俗法律與監控權限，將事件包裝成普通案件。
- 獵魔殿可能把與妖魔簽約、借用妖魔力量的人類視為墮落者，採取審判或淨化。
- `novel_01` 中，林遠尚未與獵魔殿成員正面接觸，但便利商店事件已留下可追查的淵念痕跡。
- `novel_01_rin` 則直接從獵魔殿內部、神道系見習巫女視角切入，能看見組織內部派系、報告流程、任務分級與善後倫理。

## 獵魔殿神道系

獵魔殿不是單一宗教組織，而是多系統長期妥協形成的超自然事故處理聯盟。`novel_01_rin` 的視角聚焦於神道系。

### 與其他派系的關係

- 神道系擅長結界、祓除、土地記憶判讀、神器與式神操作。
- 天主教系偏向審判、淨化、聖物封存與大規模善後紀律。
- 佛教系偏向鎮魂、結界穩固、怨念超度與長期封壓。
- 三系在重大事故中共存合作，但資源、案件主導權與善後敘事常有競合。
- 便利商店事件後的修女與和尚搭檔，可作為凜日後接觸其他派系的外圍入口。

### 神道系家族派系

- 月城家：以感應血脈「月見」、月魂環、踏月步與薙刀術聞名。曾在阿爾迪爾港灣周邊封壓任務中立功，近代因繼承者稀少與內部保守化而衰落。
- 八坂家：擅長大規模祭儀與城市級結界維護，與獵魔殿行政層關係較近，常被視為神道系的穩健派。
- 土御門旁系：擅長占算、方位與災厄預測，對月城家的月見血脈抱持研究興趣，態度友好但不完全可信。
- 久我家：偏向現場武鬥與短期鎮壓，與月城家的細緻感應路線形成對照。

### 見習生位階制度

| 位階 | 名稱 | 功能 |
| --- | --- | --- |
| 第一階 | 入門見習 | 只接受基礎知識、儀式安全與現場撤離訓練，不得獨立接案。 |
| 第二階 | 補助見習 | 可在正式成員陪同下處理低風險場域、輔助畫符與記錄。 |
| 第三階 | 見習巫女／見習執行者 | 可在監督者遠距或後援狀態下執行 C 級以下任務。凜目前位於此階。 |
| 第四階 | 準執行者 | 可獨立處理部分 C 級與低風險 B 級事件，需提交完整報告。 |
| 第五階 | 執行者候補 | 已具備正式外勤資格，只差派系承認與最終審核。 |

晉升條件包含任務成功率、現場判斷、善後紀律、派系推薦與保密能力。對月城凜而言，家族評價會不成比例地影響晉升。

## 月城神社家族

月城家曾是神道系感應與夜間鎮壓任務的名門。其女性血脈常被視為能在異常爆發前「聽見月下不協調聲」的預警者。

### 家族歷史

- 顯赫時期：數代前，月城家曾在阿爾迪爾港灣與舊城外圍的封壓任務中提供關鍵預警，因而取得獵魔殿神道系高位。
- 衰落原因：近代繼承者稀少，月見血脈出現不穩定徵兆；家族為避免失控而逐漸保守化，與其他神道家族的合作也變得僵硬。
- 近期壓力：凜被視為少數能穩定使用月見第一層、並有可能觸及更高層的直系女性，因此被寄予重振家聲的期待。

### 家傳傳承

- 月見：女性直系傳承的感應系異能，分為第六感感應、短時預知、夢占與遠隔感應三層。
- 月魂環：月城家女性代代繼承的一對小銀勾耳環，可作為感應穩定器與家族神器。公開說法是護身符，真實上限未揭曉。
- 踏月步：低重心、短距離爆發、連續角度切換的身法，適合薙刀刺擊與一閃即離。
- 折疊式特製薙刀：便於都市中攜行，以長提袋偽裝成運動器材或樂器包。

### 現任長輩結構

- 月城宗一郎：凜的祖父，家族現任實質決策者。重視家名勝於個人意願。
- 月城美沙緒：凜的祖母，曾是優秀巫女，現多以溫和方式維持家族內部秩序。
- 月城晴臣：凜的父親，負責對外協調與獵魔殿行政溝通，立場偏保守。
- 月城紗代：凜的母親，出身旁系，理解凜的壓力但很少公開反對長輩。
- 月城長老會：掌握禁術典籍與月見第三層相關記錄，對凜的阿爾迪爾生活抱持觀察態度。

### 月見第三層

官方說法是第三層會引發巨大反噬，因此所有月城女性都被教導絕不可踏入夢占與遠隔感應。這個說法目前只作為家族公開教育存在，不應在 bible 中直接寫死真相。

可保留的伏筆方向：

- 反噬可能是真的，但被家族誇大。
- 反噬可能不是能力本身造成，而是某次歷史事件留下的封印代價。
- 第三層可能能讀到與千年災變或阿爾迪爾地底淵念相關的訊息，因此被刻意封存。

## 手機式神「白曜」

白曜是凜將自己的黑色直立式手機改造成的式神。啟動時機身浮現淡銀色靈紋，能自主漂浮、移動，並以近似傲嬌助手的方式與凜互動。

### 技術原理

神道系傳統式神通常依附紙、人形、木牌或器物。白曜屬於「現代器物式神化」的新嘗試：以手機作為容器，以電子畫面承載靈紋，以符咒資料庫管理預繪符。

- 靈紋不是普通程式，手機系統只是承載介面。
- 白曜可把螢幕上的電子符轉化為紙符，前提是凜提供足夠靈力與正確筆順。
- 預繪符儲存量約三十至五十張，會受凜當天狀態影響。

### 能力上限與弱點

- 可自動釋放預設防禦符、追蹤符與束縛符。
- 不能替凜做高階判斷，只能依預設條件輔助。
- 遭遇強干擾結界或高濃度淵念場時，漂浮與物質化會變慢。
- 手機電量不是唯一限制；靈力不足時，即使滿電也無法物質化符咒。

目前設定為月城家少數年輕成員推動的創新，不是神道系普遍技術。這可在中期引出保守派質疑。

## 阿爾迪爾國立大學

阿爾迪爾國立大學位於晏川區與降川區交界，交通便利，距市中心與舊城區都有穩定通勤路線。校園表面是正常現代大學，實際上因地理位置與研究傳統，長期被多個超自然相關組織關注。

### 民俗學系

- 表面研究地方傳說、都市怪談、祭儀文化與口傳變異。
- 真實上，部分教授與研究室會接觸被稀釋過的異常案例資料。
- 凜選擇民俗學系不是巧合：家族認為此系有利於她接觸阿爾迪爾在地傳說，同時不至於暴露獵魔殿身分。

### 校園滲透

- 神道系有少量校友與研究顧問關係，但不公開活動。
- 天主教系可能透過校園宗教社團或志工組織建立接點。
- 佛教系與地方寺院、心理輔導或喪葬民俗研究有間接合作。
- 普通學生通常完全不知情，白瀨綾乃與桐原千夏皆屬此類。

## 與 novel_01 的可選交會點

- ADC 廣告公司：桐原家族企業可能與 ADC 有業務往來，凜可能在晏川區百貨或商務活動中擦肩而過林遠或阿強。
- 淵聲研究所：御影以民俗學顧問身分接案時，可能與蘇臨在資料考證上短暫往來。
- 便利商店事件後：獵魔殿修女與和尚的案件報告會經過神道系，御影可能讀到林遠留下的異常淵念記錄。
- 古垣區：凜能以月見感受到舊城區惡意的不同層次，與林遠的被動受威脅視角形成對照。
- 墮落契約者傳聞：獵魔殿內部對契約者的分類可能讓凜聽到林遠相關傳聞，但不應在早期直接正面介入。

以上交會點皆為可選，不寫也不影響 `novel_01_rin` 獨立成立；若使用，需以不改寫 `novel_01` canon 為前提。
```

---

## scripts/flatten-output-pack.md

<!-- file_path: backend/novel_db/novel_01_rin/scripts/flatten-output-pack.md -->

```markdown
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

``\``markdown
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

``\`text
檔案內容
``\`

---

## README.md

<!-- file_path: backend/novel_db/novel_01_rin/README.md -->

``\`markdown
檔案內容
``\`
``\``

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

若檔案內容本身包含三個反引號，必須將內容中的 ``\` 轉成 ``\`，避免破壞外層圍欄。

## 每個檔案區塊格式

每個檔案都必須用以下格式：

``\``markdown
## relative/path.ext

<!-- file_path: backend/novel_db/novel_01_rin/relative/path.ext -->

``\`language
原始檔案內容
``\`
``\``

檔案區塊之間必須使用：

``\`markdown
---
``\`

## TOC 錨點規則

TOC 項目格式：

``\`markdown
- [relative/path.ext](#slug)
``\`

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

``\`markdown
> Secret handling: this section contains author/director-only unrevealed planning. Treat it as independent hidden knowledge, not public canon or character-known information.
``\`

## 品質檢查

輸出前確認：

- 第一行是 `# novel_01_rin Flattened Novel Context`。
- `Files included` 數量與 TOC 條目一致。
- TOC 順序與檔案區塊順序一致。
- 每個 TOC 項目都有對應 `##` 區塊。
- 每個檔案區塊都有 `<!-- file_path: ... -->`。
- 每個檔案內容都放在正確語言的 code fence 內。
- 章節式 RP 相關檔案不可遺漏：`.cursorrules`、`context/CONTEXT.md`、`context/rpg-start.md`、`context/session-state-template.md`、`outline/rpg-chapter-arc.yaml`、`bible/rpg-rules.md`。
```
