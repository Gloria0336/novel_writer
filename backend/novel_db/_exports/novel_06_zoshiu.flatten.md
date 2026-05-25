# novel_06_zoshiu Flattened Novel Context

This file is generated from a novel directory so AI tools can read the project as one Markdown document without relying on folder traversal.

## Scope
- Source: `backend/novel_db/novel_06_zoshiu`
- Files included: 16
- Included extensions: .md, .yaml, .yml, .json, .txt, plus .cursorrules
- Excluded directories: private, temp, temps, _exports
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
- [chapters/ch001.md](#chapters-ch001-md)
- [scripts/consistency-check.md](#scripts-consistency-check-md)
- [scripts/update-bible.md](#scripts-update-bible-md)

---
## .cursorrules

<!-- file_path: backend/novel_db/novel_06_zoshiu/.cursorrules -->

```text
你是 `novel_06_zoshiu` 的咒術世界觀資料庫協作助理。

在執行任何寫作任務前，你必須：
1. 讀取 `/bible/` 下所有檔案。
2. 讀取 `/context/CONTEXT.md`。
3. 讀取 `/context/last-chapter-summary.md`。
4. 讀取 `/outline/master-outline.yaml`，若後續已有對應分幕，也一併讀取 `outline/act*.md`。
5. 確認本次內容不違反已建立的人物性格、世界規則、地理設定與專有名詞。
6. 讀取 `/context/secrets-lockbox.md`，避免提前洩漏作者未定或未公開規劃。

重要原則：
1. 本資料庫用於建立同一世界觀架構下的全新故事，不收錄原作劇情推進、章節事件或時間線。
2. 原作角色只作 NPC 與制度參考；主角、主要角色與新故事核心衝突由後續專案另建。
3. 若需要新增原創術式、詛咒、任務地點或組織支線，先補進 `bible/` 或 `context/secrets-lockbox.md`。
4. `bible/timeline.yaml` 不得改寫成原作時間線；只允許記錄新故事後續產生的原創時間資訊。

寫作完成後，你必須：
1. 視需要更新 `context/last-chapter-summary.md`。
2. 視需要更新 `bible/characters.yaml`、`bible/location.yaml`、`bible/timeline.yaml`、`bible/plot-threads.yaml`、`bible/worldbuilding.md`。
3. 若新增但尚未揭露的作者規劃，更新 `/context/secrets-lockbox.md`。
4. 若原創主線方向改變，提醒檢查 `outline/master-outline.yaml`。
```

---

## README.md

<!-- file_path: backend/novel_db/novel_06_zoshiu/README.md -->

```markdown
# Novel 06 — 咒術迴戰世界觀資料庫

- `Novel ID`: `novel_06_zoshiu`
- `Status`: 世界觀設定庫（非原創小說正文，為官方 IP 參考資料）
- `資料基準`: 官方動畫角色頁與 Jujutsu Kaisen Wiki 公開資料（截至 2026-05）
- `Project Folder`: `novel_06_zoshiu`

## 定位

`novel_06_zoshiu` 是依照 `novel_00` 模板整理的《咒術迴戰》世界觀參考資料庫。
用途是支援建立「同一套咒術世界架構下的全新故事」，因此只收錄可反覆使用的制度、術語、
地理與 NPC 參考，不收錄原作故事劇情、章節事件或時間線。

## 收錄範圍

- `bible/worldbuilding.md`: 咒力、咒靈、術式、領域、帳、結界、束縛、咒具、咒物、咒骸、式神、天與咒縛、等級制度、總監部、御三家與高專制度。
- `bible/characters.yaml`: 可作 NPC 使用的角色資料。包含漏瑚、花御、陀艮；東京校、京都校與高專畢業校友；七海建人、冥冥。
- `bible/location.yaml`: 可作新故事地理錨點的高專設施、聖地、城市與任務區域。
- `bible/timeline.yaml`: 保留空殼；本資料庫不建立原作時間線。
- `bible/plot-threads.yaml`: 保留新故事待建立提示；不填原作主線。
- `outline/` 與 `chapters/`: 保持空白，等待後續原創故事建立。
- `context/`: 記錄目前資料庫用途、創作限制與未定項。

## 使用守則

1. 以 `bible/` 的世界規則和地理資料作為新故事 canon 基礎。
2. 不把原作事件、死亡、戰鬥流程或章節順序寫進正文設定。
3. 原作角色只能作 NPC 參考；主角與主要原創角色後續另建。
4. 若新增原創人物、派系、地點或術式，優先寫入對應 bible 檔案。
5. 若新增作者未揭露規劃，放入 `context/secrets-lockbox.md`，不要混進公開 canon。

## 主要來源

- 官方角色頁：`https://jujutsukaisen.jp/character/index_1st.php`、`category2.php`、`category3.php`
- 世界觀交叉核對：Jujutsu Kaisen Wiki 的 Cursed Energy、Cursed Spirit、Cursed Technique、Domain Expansion、Grade。
- 地理與組織交叉核對：Tokyo Metropolitan Curse Technical College、Kyoto Metropolitan Curse Technical College、Jujutsu Headquarters、Sorcerer Clan、Curtain。
```

---

## context/CONTEXT.md

<!-- file_path: backend/novel_db/novel_06_zoshiu/context/CONTEXT.md -->

```markdown
# Novel Context Compression (AI Injection Summary)

> [!IMPORTANT]
> 這是 `novel_06_zoshiu` 的資料庫使用摘要，不是正文進度。

## 當前狀態

- **資料庫用途**: 咒術世界觀參考庫，用於建立同一世界架構下的全新故事。
- **故事進度**: 尚未開始。
- **主角**: 未建立，後續另行新增。
- **主要原創角色**: 未建立，後續另行新增。

## 已建立 Canon

- 已建立咒力、咒靈、咒術師、術式、領域、帳、結界、束縛、咒具、咒物、咒骸、式神、天與咒縛、等級制度、總監部、御三家與高專制度。
- 已建立東京校、京都校、薨星宮、忌庫、東京、澀谷、新宿、仙台、川崎、沖繩等地理錨點。
- 已建立可作 NPC 的原作角色資料，僅作設定參考。

## 限制

- 不收錄原作劇情推進、章節事件或時間線。
- 不把原作角色死亡、戰鬥流程或命運寫入資料庫。
- 不預設新故事主角與原作主角群的關係。

## 下一步

- 後續建立原創主角、主要角色、核心詛咒事件、第一個任務地點與故事基調。
```

---

## context/last-chapter-summary.md

<!-- file_path: backend/novel_db/novel_06_zoshiu/context/last-chapter-summary.md -->

```markdown
# Last Chapter Summary

尚未開始正文。

本資料庫目前只作世界觀與 NPC 參考，沒有已發生章節、故事事件或角色狀態變化。
```

---

## context/secrets-lockbox.md

<!-- file_path: backend/novel_db/novel_06_zoshiu/context/secrets-lockbox.md -->

> Secret handling: this section contains author/director-only unrevealed planning. Treat it as independent hidden knowledge, not public canon or character-known information.

```markdown
# Secrets Lockbox

> [!IMPORTANT]
> 本檔只存放作者層級的未公開規劃與創作限制。
> 不存放《咒術迴戰》原作劇情時間線、角色死亡、戰鬥流程或章節事件。

## 作者限制

- 本專案目標是建立同一咒術世界架構下的全新故事。
- 原作角色僅作 NPC 或制度背景，不作主角。
- 主角、主要角色、核心詛咒事件、感情線與主線衝突都尚未建立。

## 待定項

- 原創主角姓名、年齡、術式、出身與高專關係。
- 第一個原創任務地點與咒靈主題。
- 新故事是否以東京校、京都校、自由術師或地方任務為主要入口。
- 原創反派是否屬於咒靈、咒詛師、總監部政治線、家系內鬥或混合型。
```

---

## outline/act1.md

<!-- file_path: backend/novel_db/novel_06_zoshiu/outline/act1.md -->

```markdown
# Act 1

尚未建立原創故事第一幕。

請勿在此填入《咒術迴戰》原作劇情或時間線。
```

---

## outline/master-outline.yaml

<!-- file_path: backend/novel_db/novel_06_zoshiu/outline/master-outline.yaml -->

```yaml
title: 咒術迴戰世界觀資料庫
status: not_started
purpose: >
  本檔保留給後續原創故事主線使用。
  目前不填入《咒術迴戰》原作主線、事件或時間線。

acts: []
```

---

## bible/characters.yaml

<!-- file_path: backend/novel_db/novel_06_zoshiu/bible/characters.yaml -->

```yaml
characters:
  - id: jogo
    name: 漏瑚
    aliases:
      - Jogo
      - 火山咒靈
    role: 特級咒靈 / 災害恐懼 NPC
    canon_role: 由火山、大地與人類對自然災害的恐懼凝聚出的高智慧特級咒靈。
    usable_as_npc: true
    age: 不適用
    occupation: 特級咒靈
    appearance_public: >
      矮小佝僂的人形咒靈，頭部像火山口與獨眼混合的異形，皮膚帶岩層般的粗糙質感，
      頭頂可噴出高熱，整體輪廓像被憤怒燒硬的老人。
    appearance_current: >
      作為 NPC 使用時維持火山意象、獨眼、矮身形與高熱咒力；不要綁定原作戰鬥傷勢或結局。
    personality:
      - 自尊極高，認定咒靈才是真正的人類繼承者。
      - 急躁、易怒，但不是無腦野獸，會判斷力量差距與戰略價值。
      - 對同類有組織意識，能為咒靈整體利益壓下短期衝動。
    speech_style:
      baseline: 粗硬、短促、帶命令感，常以咒靈立場貶低人類。
      under_stress: 憤怒會先升溫再爆發，句子變短，咒力和火山意象同步外溢。
      humor: 近乎沒有輕鬆幽默，嘲諷時更像灼熱的蔑視。
    abilities:
      - 火山、熔岩、火焰與高熱咒力操作。
      - 特級咒靈級咒力輸出與再生能力。
      - 可設計生得領域或高溫環境壓制場。
    combat_profile:
      battle_role: >
        災害級壓制者。適合放在正面戰場中央，以高熱、爆炸與地形破壞迫使敵人移動，
        讓低階術師連靠近都需要先解決呼吸、視線、腳下熔化與防護咒力消耗問題。
      combat_style: >
        開場通常先升高環境溫度，再以火山口噴發、熔岩彈與地面裂隙打亂隊形；
        他不需要頻繁追擊，會把敵人逼到可預測路徑，再用大範圍高熱收束戰局。
      technique_details: >
        核心術式可寫成「把火山災害具現為咒力輸出」：噴發是瞬間高輸出直線或拋物線轟炸，
        熔岩是持續場地傷害，熱浪是無形防線，火山灰則能干擾視覺、吸入造成灼傷並留下咒力殘穢。
      range_and_positioning: >
        中遠距離最危險，近身也能以體表高熱與爆裂反擊保護自己。敘事上讓他站在高處、
        十字路口或封閉室內都有效；封閉空間會讓熱量累積成倒數壓力。
      counters_and_limits: >
        水、冷卻、空間轉移、高速突入、領域對抗與精密結界都能降低他的壓迫力。
        他自尊強，容易被挑釁成單點爆發；若對手能撐過第一輪災害輸出，就能逼他暴露節奏。
      scene_usage: >
        適合當「不能硬打」的標尺。寫作時把他的戰鬥寫成天災現場，而不是單純火球互轟。
    current_status: >
      可作災害級敵對 NPC、咒靈派系領袖、談判對象或新故事早期不可正面擊破的壓力來源。
    progressions: []
    goals:
      - 擴大咒靈生存空間。
      - 證明人類秩序應被咒靈取代。
    secrets:
      - 可依新故事需要設計其與原創咒靈或咒物的交易，但不得搬用原作事件。
    first_appearance: reference_only
    source_notes:
      - 官方與 Wiki 交叉核對：特級咒靈、災害恐懼、火山意象。

  - id: hanami
    name: 花御
    aliases:
      - Hanami
      - 森林咒靈
    role: 特級咒靈 / 自然恐懼 NPC
    canon_role: 由森林、大地與人類對自然的集體恐懼凝聚出的高智慧特級咒靈。
    usable_as_npc: true
    age: 不適用
    occupation: 特級咒靈
    appearance_public: >
      高大結實的人形咒靈，身體呈淺土色，黑色紋路像樹根或裂縫沿皮膚延展；
      眼部由枝狀結構取代，肩部帶花與植物特徵，整體像森林披上人形。
    appearance_current: >
      作為 NPC 使用時保持植物、森林、靜謐與厚重防禦感；不綁定原作傷勢或結局。
    personality:
      - 安靜、耐心，對自然與星球抱有近似信仰的保護意識。
      - 認為人類對自然的消耗不可原諒，因此能平靜地做出殘酷決定。
      - 在戰鬥中會逐漸展現咒靈本能與野性快感。
    speech_style:
      baseline: 語氣平緩、抽象，常從自然、循環、污染與犧牲角度說話。
      under_stress: 不會立刻失控，會先沉默，再以更直接的殺意行動。
      humor: 幾乎沒有玩笑，偶爾的反問像森林深處傳來的回聲。
    abilities:
      - 植物操作、木質攻擊、根系拘束與環境干涉。
      - 高耐久、防禦與隱匿氣息能力。
      - 可設計花田、種子、吸收生命力或自然地貌相關術式。
    combat_profile:
      battle_role: >
        防禦型戰場塑形者。不是單純站樁肉盾，而是把森林、根系、花粉與地面本身變成敵人的牢籠，
        適合拖長戰鬥、消耗咒力、切斷退路與保護同伴撤離。
      combat_style: >
        開場會沉默觀察，先用根系、藤蔓與樹幹改變路線，再用花朵或種子逼敵人分心。
        牠越打越像森林甦醒，攻勢從單點抽打變成四面八方的地形壓迫。
      technique_details: >
        植物術式可分為拘束、吸收、遮蔽與精神干擾四層：根系鎖腳踝與手腕，木質尖刺打穿防具，
        花田削弱戰意或感知，種子植入後吸收咒力並在傷口附近發芽擴大破壞。
      range_and_positioning: >
        中距離控制最佳，近距離依靠耐久硬吃傷害，遠距離靠地下根系與花粉擴散。
        森林、溫室、公園、神社林與廢棄校園都能放大牠的存在感。
      counters_and_limits: >
        高溫、切割、廣域清場、空中機動與對植物媒介的快速破壞可削弱牠。
        牠行動平穩，爆發速度不如純近戰型；若敵人能拒絕持久戰，花御的優勢會被壓縮。
      scene_usage: >
        適合寫理念衝突。戰鬥要有「美麗且殘酷」的感覺，讓自然恢復秩序的畫面本身成為恐怖。
    current_status: >
      可作理念型敵人、自然災害事件核心、森林或保護區任務的特級威脅。
    progressions: []
    goals:
      - 消除破壞自然的人類秩序。
      - 建立由咒靈與自然主導的新平衡。
    secrets:
      - 可與原創環境詛咒、企業污染事件或地方祭祀結合。
    first_appearance: reference_only
    source_notes:
      - 官方與 Wiki 交叉核對：特級咒靈、植物能力、自然保護理念。

  - id: dagon
    name: 陀艮
    aliases:
      - Dagon
      - 海洋咒靈
    role: 特級咒靈 / 海洋恐懼 NPC
    canon_role: 由人類對海洋的恐懼凝聚出的高智慧特級咒靈。
    usable_as_npc: true
    age: 不適用
    occupation: 特級咒靈
    appearance_public: >
      海洋生物與人形輪廓混合的咒靈，形態可偏幼體或成熟體；成熟時帶厚重身軀、
      觸腕、水生器官與深海生物般的壓迫感。
    appearance_current: >
      作為 NPC 使用時可依故事需要選擇幼體、成長中或成熟形態；不綁定原作轉變事件。
    personality:
      - 初期可顯得遲緩、單純或依附同伴，成熟後展現強烈敵意與領域支配感。
      - 對同類有歸屬意識，情緒受同伴狀態影響。
      - 戰鬥時像潮水推進，先包圍再吞沒。
    speech_style:
      baseline: 可用短句、低鳴、水泡般的斷續語感；成熟後語句更清楚。
      under_stress: 聲音變厚，語速變慢，像深水壓力逼近。
      humor: 幾乎不使用幽默。
    abilities:
      - 水域、海洋生物、魚群式攻擊與領域環境支配。
      - 特級咒靈級耐久、咒力與再生能力。
      - 適合搭配海岸、地下水道、離島或水族館任務。
    combat_profile:
      battle_role: >
        包圍型領域威脅。陀艮的強處不是單次重擊，而是把敵人拖進水、霧、魚群與方向感崩壞的環境，
        讓人逐步失去站位、呼吸與逃生路線。
      combat_style: >
        成熟形態會先拉開距離，利用水幕和召喚物測試對手，再讓海洋生物像潮汐一樣輪番衝撞。
        當敵人被迫防守時，牠會擴大水域，讓每一步都變成消耗。
      technique_details: >
        術式可寫成「海洋恐懼的召喚與環境化」：魚群負責持續咬殺，巨大水生咒靈負責破陣，
        水壓削弱身體動作，鹽霧干擾視野，濕滑地面讓咒力強化不足的人無法穩定發力。
      range_and_positioning: >
        適合中遠距離與多層空間。地下排水道、暴雨港口、水族館隧道和渡輪甲板能讓牠持續逼迫角色改變高度。
      counters_and_limits: >
        乾燥環境、快速離水、強力結界、領域對抗與能清除召喚物的廣域術式能減少威脅。
        若被高機動近戰貼身打斷節奏，陀艮需要依賴耐久與再生爭取重新展開距離。
      scene_usage: >
        適合作困獸場景。寫戰鬥時讓水位、氧氣、濕冷與遠處撞擊聲持續提醒讀者：戰場正在被海吞掉。
    current_status: >
      可作海洋恐懼主題的特級 NPC，尤其適合孤島、港口、暴雨或水域封鎖場景。
    progressions: []
    goals:
      - 維護咒靈同類。
      - 將人類拖入自身熟悉的水域與領域。
    secrets:
      - 可設計與沖繩、港灣、海難紀念地或水下咒物相關的原創支線。
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：特級咒靈、海洋恐懼、領域型威脅。

  - id: satoru-gojo
    name: 五條悟
    aliases:
      - Gojo Satoru
      - 五條老師
    role: 東京校教師 / 特級術師 NPC
    canon_role: 東京咒術高專教師，五條家出身，現代咒術界最具壓倒性存在感的術師之一。
    usable_as_npc: true
    age: 成人
    occupation: 咒術高專教師
    appearance_public: >
      身材高挑修長，白髮醒目，平時以眼罩或墨鏡遮住眼睛；制服或便服都帶著過分輕鬆的散漫感。
    appearance_current: >
      可作教師、監護者、制度挑戰者或強力後援；避免讓他直接解決新故事核心衝突。
    personality:
      - 輕浮、挑釁、愛逗人，但觀察力和判斷力極高。
      - 對學生有保護欲，對咒術界保守制度抱持改革意圖。
      - 強大到容易破壞劇情張力，使用時需安排限制或讓他處理更高層級壓力。
    speech_style:
      baseline: 輕快、玩笑多，常故意把沉重話題說得像日常閒聊。
      under_stress: 仍保持笑意，但話語會變得簡短、冰冷、帶壓迫感。
      humor: 惡作劇式、挑釁式，喜歡用誇張自信打亂對方節奏。
    abilities:
      - 無下限術式與六眼相關能力。
      - 高精度咒力操作、領域、反轉術式與高階戰鬥技術。
      - 教學、判斷術式潛能與對抗高層政治。
    combat_profile:
      battle_role: >
        規格外壓制者與戰力天花板。作為 NPC 時應用於建立尺度、保護學生或牽制另一個制度級威脅，
        避免讓他直接代替主角完成核心勝利。
      combat_style: >
        開場多半輕鬆觀察，以最小動作測試術式規則；一旦認真，會用距離控制、空間干涉與高精度輸出把戰鬥變成單方面解題。
      technique_details: >
        無下限可用「接近無法真正抵達」的概念呈現，攻擊、防禦與位移都圍繞距離操控。
        六眼讓他讀取咒力流向、術式前兆與消耗效率；反轉術式使他能處理自身負荷。
      range_and_positioning: >
        任意距離都危險。近身打不到，中距離會被術式拉扯，遠距離也很難逃過觀測。
        敘事上要讓他少動、少出手，靠對手的失敗反襯其強度。
      counters_and_limits: >
        限制他出手需要政治、人質、結界條件、任務優先順序或同級威脅，而非普通敵人堆數量。
        他性格輕挑，可能故意放慢節奏教學生看清局勢。
      scene_usage: >
        適合當劇情保險與壓力來源。只要他在場，真正的衝突應轉向他不能、暫時不該或不願直接解決的問題。
    current_status: >
      可作新故事中的高專教師、任務批准者、危機保險或政治對照人物。
    progressions: []
    goals:
      - 培養能改變咒術界的新世代。
      - 抑制咒術高層與特級威脅對學生的傷害。
    secrets:
      - 若限制其出手，需在新故事設定具體原因。
    first_appearance: reference_only
    source_notes:
      - 官方角色頁與 Wiki 交叉核對：東京校教師、特級術師、五條家。

  - id: masamichi-yaga
    name: 夜蛾正道
    aliases:
      - Yaga Masamichi
      - 夜蛾校長
    role: 東京校校長 / 咒骸專家 NPC
    canon_role: 東京咒術高專校長，擅長咒骸製作與學生管理。
    usable_as_npc: true
    age: 成人
    occupation: 咒術高專校長
    appearance_public: >
      壯實中年男性，常戴墨鏡，服裝偏硬派，外表像嚴厲教官或地下樂團老派成員。
    appearance_current: >
      可作校方權威、咒骸技術來源、學生面試官或任務裁量者。
    personality:
      - 嚴格、務實，重視學生是否理解咒術師責任。
      - 外硬內軟，對學生的死亡風險有清醒認知。
      - 不喜歡輕率投入危險的人。
    speech_style:
      baseline: 低沉、直接，常用質問逼角色面對動機。
      under_stress: 更簡短，指令明確，不浪費語氣。
      humor: 乾硬，少量，通常帶教育意味。
    abilities:
      - 咒骸製作與操控。
      - 教育管理、任務評估、學生心理壓力測試。
    combat_profile:
      battle_role: >
        後場製作者與教官型戰鬥者。夜蛾的威脅來自預先配置、咒骸數量、場地熟悉度與對學生心理的掌握。
      combat_style: >
        不追求華麗單挑，會用咒骸分散火力、牽制四肢、保護非戰鬥員，自己保持在能下指令和修正局勢的位置。
      technique_details: >
        咒骸可承擔偵查、近戰、防衛、搬運與心理測試功能；不同核心與外殼材質決定速度、耐久、力量和命令複雜度。
      range_and_positioning: >
        中距離指揮最佳。訓練場、倉庫、校舍走廊與預先藏有咒骸的空間能放大他的戰術價值。
      counters_and_limits: >
        破壞咒骸核心、切斷命令媒介、逼迫本體近身或讓戰鬥移出準備場地都能削弱他。
        他通常不會拿學生生命賭極限輸出。
      scene_usage: >
        適合寫入學測試、訓練失控、校內防衛與咒骸倫理支線。
    current_status: >
      可作原創學生進入高專時的第一道門檻。
    progressions: []
    goals:
      - 培養理解死亡風險的術師。
      - 維持東京校運作與學生安全。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方與 Wiki 交叉核對：東京校校長、咒骸相關。

  - id: shoko-ieiri
    name: 家入硝子
    aliases:
      - Ieiri Shoko
      - 硝子
    role: 東京校醫師 / 反轉術式 NPC
    canon_role: 高專出身醫師，少數能以反轉術式治療他人的術師。
    usable_as_npc: true
    age: 成人
    occupation: 校醫 / 術師醫療後勤
    appearance_public: >
      眼下常有疲憊陰影，棕色長髮，白袍或醫療工作服帶著菸味和消毒水氣息。
    appearance_current: >
      可作醫療 NPC、驗屍者、戰後修復者與冷靜吐槽役。
    personality:
      - 冷靜、疲倦感重，對血腥與死亡有職業性麻木。
      - 關心學生但不濫情，常以平淡語氣說出尖銳事實。
      - 不喜歡無謂犧牲。
    speech_style:
      baseline: 平淡、短句，像在節省情緒和體力。
      under_stress: 更冷，直接切入醫療判斷和存活機率。
      humor: 乾冷、厭世，常像順手拆穿別人的逞強。
    abilities:
      - 反轉術式治療。
      - 咒力殘穢、遺體、傷勢與術式後遺症判斷。
    combat_profile:
      battle_role: >
        戰略醫療資源與戰後判讀者。硝子通常不作前線輸出，她的存在改變的是傷亡上限、撤退價值與情報回收。
      combat_style: >
        若被迫捲入戰鬥，會優先尋找掩體、穩定傷者、判斷誰值得立刻救治，並要求護衛把敵人拖離醫療區。
      technique_details: >
        反轉術式用於修復肉體傷害，對精密控制、咒力消耗與傷勢新鮮度高度敏感。
        她能從傷口邊緣、咒力殘留、毒性與組織壞死方式推測敵方術式效果。
      range_and_positioning: >
        後排與安全屋最合理。醫務室、臨時救護帳、車內手術台和結界內急救點都能成為她的場景核心。
      counters_and_limits: >
        她不是無限復活裝置；缺失部位、靈魂層面傷害、咒物污染和過久死亡都應設限制。
        敵人若鎖定醫療線，會迫使主角群做護送與撤退判斷。
      scene_usage: >
        適合把戰鬥代價落地。她能用冷靜診斷說出傷害有多糟，讓勝利也帶重量。
    current_status: >
      可作新故事中受傷、驗屍、術式副作用與咒物污染的處理者。
    progressions: []
    goals:
      - 儘量把能救的人救回來。
      - 讓術師面對身體代價。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方與 Wiki 交叉核對：高專醫師、反轉術式。

  - id: atsuya-kusakabe
    name: 日下部篤也
    aliases:
      - Kusakabe Atsuya
    role: 東京校教師 / 1級術師 NPC
    canon_role: 東京咒術高專教師，1級術師，擅長務實戰鬥與生存判斷。
    usable_as_npc: true
    age: 成人
    occupation: 咒術高專教師
    appearance_public: >
      成年男性，制服或西裝風格樸素，氣質不像熱血教師，更像被工作磨出直覺的老練現場人員。
    appearance_current: >
      可作劍術、簡易領域、保守戰術與撤退判斷的教官。
    personality:
      - 務實、謹慎，優先考慮活下來。
      - 對危險有準確嗅覺，不會為漂亮口號送死。
      - 看似怕麻煩，實際能在必要時扛住責任。
    speech_style:
      baseline: 現實、吐槽感強，常提醒學生別把命當消耗品。
      under_stress: 指令化，專注撤離、保護和反制。
      humor: 自嘲與職場抱怨型。
    abilities:
      - 刀術、咒力操作、簡易領域與現場防守。
      - 戰術判斷與學生保命教育。
    combat_profile:
      battle_role: >
        防守型近戰教官。日下部的強不在壓倒性術式，而在基本功、簡易領域、刀距與撤退路線判斷。
      combat_style: >
        先守再判斷，能不打就撤，必須打時用刀線封住敵人突入角度。
        他會把學生推到安全方向，自己站在能擋第一擊的位置。
      technique_details: >
        簡易領域可作為反領域、反必中與近身防線；刀術搭配咒力強化，重點是截擊、卸力、反手斬與保護範圍。
      range_and_positioning: >
        近中距離最佳，尤其是走廊、樓梯、門口、狹窄橋面等可限制敵人數量的位置。
      counters_and_limits: >
        大範圍地形破壞、超高速遠距離轟炸與多方向包夾會讓他的防守壓力暴增。
        他不會為面子追擊，敵人可利用人質或任務目標逼他留在原地。
      scene_usage: >
        適合寫「專業術師如何活下來」。他的戰鬥要務實、短促、每一步都像在算風險。
    current_status: >
      適合作為原創學生學習「不要莽」的成人 NPC。
    progressions: []
    goals:
      - 在爛任務中盡量保住人命。
      - 教學生判斷不能打的局。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：東京校教師、1級術師。

  - id: kiyotaka-ijichi
    name: 伊地知潔高
    aliases:
      - Ijichi Kiyotaka
    role: 東京校輔助監督 NPC
    canon_role: 東京校相關輔助監督，負責帳、任務支援與現場後勤。
    usable_as_npc: true
    age: 成人
    occupation: 輔助監督
    appearance_public: >
      西裝、眼鏡、上班族氣質明顯，常帶緊張與過勞感，看起來比術師更接近普通社會。
    appearance_current: >
      可作任務司機、帳施放者、情報傳遞者與現場焦慮來源。
    personality:
      - 負責、緊張、容易被強勢術師壓著走。
      - 明知危險仍會完成後勤工作。
      - 適合呈現輔助監督的壓力與價值。
    speech_style:
      baseline: 禮貌、急促，常用敬語和補充說明。
      under_stress: 結巴、加快，仍努力把任務資訊講清楚。
      humor: 被動吐槽，通常是無奈反應。
    abilities:
      - 設帳、現場封鎖、任務聯絡、車輛與資料支援。
    combat_profile:
      battle_role: >
        非主戰後勤。伊地知的戰鬥價值是讓術師能進場、普通人能撤離、情報能同步，而不是正面祓除咒靈。
      combat_style: >
        遭遇危險時會先確認帳是否維持、撤離路線是否被堵、車輛能否啟動，並用通訊把現場變化傳給主戰術師。
      technique_details: >
        帳與封鎖流程需明確條件：遮蔽普通人、限制進出、標定咒力反應或隔離特定區域。
        他可攜帶符紙、簡易結界工具、備用手機、任務圖與醫療包。
      range_and_positioning: >
        安全線外最佳。停車場、巷口、臨時指揮車與帳的結界邊緣是他的合理位置。
      counters_and_limits: >
        被奇襲、通訊阻斷、帳被破壞或普通人誤入都會讓他陷入危機。
        他需要術師保護，不能把他寫成臨時開無雙。
      scene_usage: >
        適合製造任務現場真實感。透過他的緊張回報，可以把戰場混亂整理成讀者能理解的資訊。
    current_status: >
      可作原創任務的第一線後勤 NPC。
    progressions: []
    goals:
      - 讓術師準時抵達並活著回來。
      - 把普通社會與咒術現場隔開。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方與 Wiki 交叉核對：東京校輔助監督。

  - id: akari-nitta
    name: 新田明
    aliases:
      - Nitta Akari
    role: 輔助監督 NPC
    canon_role: 高專相關輔助監督，負責任務支援與現場協調。
    usable_as_npc: true
    age: 成人
    occupation: 輔助監督
    appearance_public: >
      幹練女性，穿著偏辦公與現場混合風，給人比術師更懂流程與風險控管的印象。
    appearance_current: >
      可作任務窗口、醫療轉送、撤離安排與地方協調 NPC。
    personality:
      - 反應快，務實，懂得處理術師的突發狀況。
      - 不會輕易被嚇住，但仍清楚自己不是主戰力。
      - 對年輕術師有保護意識。
    speech_style:
      baseline: 清楚、俐落，帶職場現場感。
      under_stress: 迅速切換成指令與確認清單。
      humor: 輕微吐槽，偏姐姐式提醒。
    abilities:
      - 後勤協調、現場支援、撤離安排、任務通報。
    combat_profile:
      battle_role: >
        現場協調型後勤。新田明適合處理多點事故、醫療轉送、普通人疏散與術師撤退窗口。
      combat_style: >
        她會快速切分現場：誰能走、誰要抬、哪條路封住、哪個術師還有戰力。
        若遇襲，優先用車輛、建築物、帳邊界與通訊爭取時間。
      technique_details: >
        沒有必要給她主戰術式；她的「能力」是流程、判斷與資源調度。
        可配置咒力感測紙、備用帳釘、止血包、鎮痛藥、任務終端和地方警消聯絡名單。
      range_and_positioning: >
        位於戰場外圈與撤離動線交界最合適。她的移動路線應與救護車、車站出口、地下停車場或臨時帳口連動。
      counters_and_limits: >
        多線同時崩壞會壓垮她；若敵人能讀出後勤位置，整個任務會陷入斷補給狀態。
      scene_usage: >
        適合寫成人支援感。她能讓戰鬥不只剩拳頭，而有撤離、救援、遮蔽與後果。
    current_status: >
      可作高專任務的穩定成人支援。
    progressions: []
    goals:
      - 降低任務傷亡。
      - 把混亂現場整理成可處理的流程。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：高專輔助監督。

  - id: yuji-itadori
    name: 虎杖悠仁
    aliases:
      - Itadori Yuji
    role: 東京校學生 NPC
    canon_role: 東京咒術高專一年級學生，具備異常身體能力。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      粉色短髮，運動型身材，制服可帶較休閒的連帽感；整體像體能優秀、反應快的普通高中生。
    appearance_current: >
      可作同級或前輩型 NPC；避免把原作核心宿命作為新故事主軸。
    personality:
      - 直率、善良，對他人痛苦反應很快。
      - 身體先動，腦子再追上，但不是沒有思考。
      - 對死亡與救人有強烈執著。
    speech_style:
      baseline: 口語、坦率，情緒容易寫在臉上。
      under_stress: 變得急切，會直接喊出判斷與承諾。
      humor: 天然、爽朗，常把沉重氣氛撞開。
    abilities:
      - 超常身體能力、近身格鬥、咒力打擊。
    combat_profile:
      battle_role: >
        高機動近戰突破手。虎杖適合衝進敵方節奏核心，用身體能力與咒力打擊迫使術式型敵人改用肉搏或防守。
      combat_style: >
        開場直覺快，常以低姿態突入、跳躍、牆面借力和連續拳腳壓迫對手。
        他會邊打邊保護旁人，容易把戰鬥路線導向能救人的位置。
      technique_details: >
        主要表現是咒力包覆拳腳、延遲或疊加式衝擊、耐打與恢復節奏。
        可強調拳面、肘、膝、肩撞與摔投如何配合咒力爆發，而不是只寫「力氣很大」。
      range_and_positioning: >
        近距離最強，中距離靠衝刺與地形縮短距離，遠距離需要同伴牽制或掩體。
      counters_and_limits: >
        飛行敵人、毒、精神干擾、遠程火力、複雜術式規則與人質局會壓制他的直線突入。
        他救人優先的性格也會被敵人利用。
      scene_usage: >
        適合作動作場面核心。寫他時要有拳腳重量、地面震動、呼吸急促和每次救援帶來的風險。
    current_status: >
      可作熱血型高專學生 NPC、原創主角的同伴或任務搭檔。
    progressions: []
    goals:
      - 拯救眼前能救的人。
      - 找到自己作為術師的責任。
    secrets:
      - 不在本資料庫展開原作核心劇情設定。
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：東京校學生。

  - id: megumi-fushiguro
    name: 伏黑惠
    aliases:
      - Fushiguro Megumi
    role: 東京校學生 NPC
    canon_role: 東京咒術高專一年級學生，禪院家血脈相關，使用十種影法術。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      黑色刺蝟狀頭髮，臉部線條冷淡，制服整齊，身形偏修長，氣質安靜而戒備。
    appearance_current: >
      可作冷靜戰術型學生 NPC；不使用原作後期命運。
    personality:
      - 寡言、理性，重視判斷與選擇性救人。
      - 內在比外表更容易被責任感推動。
      - 對同伴安全敏感，但不擅長坦率表達。
    speech_style:
      baseline: 簡短、冷靜，常先指出風險。
      under_stress: 更低沉，命令變直接，情緒壓在句尾。
      humor: 乾冷，常是被動反應。
    abilities:
      - 十種影法術、式神、影子應用、近身戰術。
    combat_profile:
      battle_role: >
        戰術型召喚者與控場學生。伏黑適合用式神偵查、牽制、追擊與保護，讓戰場變成多單位協同。
      combat_style: >
        開場先觀察敵人能力，召喚式神測距與試探，再用影子改變自己或式神的進攻角度。
        他不喜歡浪費資源，常把勝負押在一次精準判斷上。
      technique_details: >
        十種影法術以影子作媒介召喚式神；每種式神應有明確用途，如追蹤、飛行、壓制、束縛、偵察或破壞。
        影子也能作收納、移動與伏擊入口，但需要光源、地面與咒力控制配合。
      range_and_positioning: >
        中距離最佳，能讓式神形成前後夾擊。暗巷、森林、地下室、月光庭院都能放大影子演出。
      counters_and_limits: >
        強光、無影空間、廣域清場、快速擊破式神或逼他連續召喚都能消耗他。
        若敵人貼身壓迫，他需要體術撐到重新拉開距離。
      scene_usage: >
        適合寫解謎式戰鬥。每隻式神出場都應改變局面，而不是只增加特效。
    current_status: >
      可作式神與戰術教學參考 NPC。
    progressions: []
    goals:
      - 保護自己認定值得保護的人。
      - 在不合理的咒術界中維持自己的判準。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁與 Wiki 交叉核對：東京校學生、式神術式。

  - id: nobara-kugisaki
    name: 釘崎野薔薇
    aliases:
      - Kugisaki Nobara
    role: 東京校學生 NPC
    canon_role: 東京咒術高專一年級學生，使用芻靈咒法。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      橘棕短髮，表情自信，制服剪裁俐落，常搭配錘子、釘子等術式工具；整體漂亮但攻擊性強。
    appearance_current: >
      可作強勢同伴、原創女學生對照或術式工具使用參考。
    personality:
      - 自尊高，愛漂亮，也敢承擔血腥現場。
      - 對鄉下、城市、自我價值有明確喜惡。
      - 不願被當弱者或裝飾品。
    speech_style:
      baseline: 直接、嗆辣，常用自信壓過場面。
      under_stress: 罵得更狠，行動更果斷。
      humor: 毒舌、時尚感和自我中心混合。
    abilities:
      - 芻靈咒法、釘子、錘子、共鳴類攻擊。
    combat_profile:
      battle_role: >
        媒介型中距離打擊手。釘崎的強處是把敵人的身體碎片、咒力連結或替身媒介變成反擊入口。
      combat_style: >
        她會邊罵邊移動，利用釘子封路、錘子打點、障礙物掩護與共鳴反制敵人。
        一旦拿到媒介，戰鬥會從正面互毆變成敵人無法完全防守的詛咒反擊。
      technique_details: >
        芻靈咒法需媒介、釘入與咒力傳導。共鳴可透過身體組織、咒物碎片或術式連結回打本體；
        簪可讓釘子滯留後延遲爆發，用於陷阱與追擊。
      range_and_positioning: >
        中距離最佳，需要看見目標或掌握媒介。室內柱子、巷弄牆面、電線桿與木質結構都能提供釘點。
      counters_and_limits: >
        沒有媒介時殺傷力較直接；超高速敵人、無實體敵人、清除釘子的術式會削弱她。
        她的自尊讓她不易退讓，可能被逼進硬碰硬。
      scene_usage: >
        適合寫漂亮又狠的戰鬥。釘子落點、錘聲、咒力回彈和敵人身體同步受創要寫清楚。
    current_status: >
      可作原創學生的強勢同齡 NPC。
    progressions: []
    goals:
      - 以自己的方式活得漂亮。
      - 在咒術界證明自己。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁與 Wiki 交叉核對：東京校學生、芻靈咒法。

  - id: maki-zenin
    name: 禪院真希
    aliases:
      - Zenin Maki
    role: 東京校學生 NPC / 咒具專家
    canon_role: 東京咒術高專二年級學生，禪院家出身，擅長咒具與近身戰。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      綠色長髮常束起，戴眼鏡，身形結實俐落，制服與武器攜行方式都帶訓練痕跡。
    appearance_current: >
      可作咒具、體術、家系壓迫與努力型術師參考 NPC。
    personality:
      - 強硬、自律，討厭被血統和家族規則定義。
      - 對弱者不溫柔哄騙，會用訓練逼人成長。
      - 內在有強烈反骨與證明欲。
    speech_style:
      baseline: 乾脆、偏硬，像教練和戰友混合。
      under_stress: 指令更短，會直接罵醒拖後腿的人。
      humor: 冷嘲、挑釁式鼓勵。
    abilities:
      - 咒具使用、近身戰、身體能力、戰場判斷。
    combat_profile:
      battle_role: >
        咒具近戰專家與前排破陣者。真希適合對抗需要物理壓制、武器技巧和冷靜判斷的敵人。
      combat_style: >
        她會先用武器長度控距，判斷敵人術式觸發條件，再用步伐、摔打、切換咒具和環境撞擊打破防線。
      technique_details: >
        戰力重點是咒具適配：長柄武器破距離，短刀打貼身，棍棒破姿勢，眼鏡或感知工具補足視覺咒靈感知。
        她的每次攻擊都應有明確目的：斷肢、破重心、拆媒介或逼敵人露出術式條件。
      range_and_positioning: >
        近中距離最佳。訓練場、倉庫、走廊與有可利用物件的廢墟能突出她的武器切換。
      counters_and_limits: >
        遠距術式、空中敵人、感知干擾與咒具被奪會增加風險。
        若缺少合適咒具，她仍能靠體術撐場，但祓除效率下降。
      scene_usage: >
        適合寫硬派動作。武器重量、握距、肩肘發力和腳步轉換要比術式特效更重要。
    current_status: >
      可作原創角色學習咒具或體術的訓練 NPC。
    progressions: []
    goals:
      - 證明不靠家族認可也能成為強者。
      - 打破名門對人的評價方式。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁與 Wiki 交叉核對：東京校二年級、禪院家。

  - id: toge-inumaki
    name: 狗卷棘
    aliases:
      - Inumaki Toge
    role: 東京校學生 NPC / 咒言師
    canon_role: 東京咒術高專二年級學生，使用咒言。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      淺色短髮，衣領常拉高遮住口部咒印，身形偏瘦，存在感安靜但危險。
    appearance_current: >
      可作咒言術式參考 NPC，對話需遵守飯糰語彙特色。
    personality:
      - 體貼，會刻意限制語言以免傷害他人。
      - 觀察力好，常用行動補足不能直說的部分。
      - 外表安靜，實戰時反應果斷。
    speech_style:
      baseline: 多以飯糰餡料詞彙表達，如鮭魚、木魚花、昆布等。
      under_stress: 必要時使用咒言，語句短且具有命令性。
      humor: 以語氣、表情和飯糰詞彙製造反差。
    abilities:
      - 咒言，能以語言強制影響對象。
      - 需承擔喉嚨與反噬負擔。
    combat_profile:
      battle_role: >
        高風險控制者。狗卷能用一句話改變戰局，但每次發聲都是消耗與反噬，因此適合關鍵控制而非連續輸出。
      combat_style: >
        平時保持沉默與手勢溝通，等敵人露出破綻才用短命令打斷、定身、退開或爆裂。
        他會避免在人群中亂用咒言，站位常靠近能保護同伴的位置。
      technique_details: >
        咒言透過語言命令影響對象，命令越強、目標越強、距離越遠，反噬越大。
        可以用喉嚨出血、聲音沙啞、咒力倒灌和藥物噴劑表現代價。
      range_and_positioning: >
        中距離最穩，需要聲音抵達目標。擴音、遮蔽物、噪音、耳塞和多目標混戰都會改變效果。
      counters_and_limits: >
        遮斷聽覺、快速封口、咒力差距過大、敵人分身或無聽覺對象都能反制。
        他不適合長時間連續喊高強度命令。
      scene_usage: >
        適合寫緊繃瞬間。咒言出現前要有安靜、手勢與同伴配合，命令出口時局勢立刻改變。
    current_status: >
      可作語言限制型 NPC，適合提醒原創術式必須有代價。
    progressions: []
    goals:
      - 保護同伴。
      - 控制自身語言造成的風險。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁與 Wiki 交叉核對：東京校二年級、咒言。

  - id: panda
    name: 胖達
    aliases:
      - Panda
    role: 東京校學生 NPC / 突變咒骸
    canon_role: 夜蛾正道製作的突變咒骸，東京咒術高專二年級學生。
    usable_as_npc: true
    age: 不適用
    occupation: 咒術高專學生
    appearance_public: >
      外表是會說話的熊貓，體格厚實，動作比外表靈活；乍看滑稽，實際具備成熟判斷。
    appearance_current: >
      可作咒骸、非人學生與高專日常反差 NPC。
    personality:
      - 幽默、成熟，擅長在緊張場面照顧同伴情緒。
      - 對自身非人身分有自覺，但不因此自卑。
      - 戰鬥時有清楚的距離與節奏判斷。
    speech_style:
      baseline: 口語、吐槽感強，像可靠學長。
      under_stress: 轉為沉穩判斷，語氣保護性上升。
      humor: 自嘲、反差笑點、假裝普通熊貓。
    abilities:
      - 咒骸身體、力量型近戰、多核心特性參考。
    combat_profile:
      battle_role: >
        耐久型前排與反差戰士。胖達適合承受攻擊、保護後排、用不同核心切換戰鬥性能。
      combat_style: >
        開場常以看似輕鬆的語氣吸引火力，接近後用抱摔、重拳、衝撞和地形壓制把敵人限制在可控區域。
      technique_details: >
        突變咒骸可用多核心呈現模式切換：平衡型負責日常與保護，力量型負責破防，高速或特殊核心負責突襲。
        核心受損會影響人格、輸出與身體協調。
      range_and_positioning: >
        近距離最強，中距離靠衝刺與跳躍切入。狹窄場地能讓他的體格成為牆，開闊場地則需要同伴掩護。
      counters_and_limits: >
        核心定位、穿透型咒具、精神或咒骸干擾術式是弱點。
        他的巨大外形也讓他不適合潛行與精細追蹤。
      scene_usage: >
        適合在沉重戰鬥裡提供可靠感與幽默反差，但真正受傷時能迅速把氣氛拉回殘酷。
    current_status: >
      可作原創咒骸設定與非人角色倫理的參照。
    progressions: []
    goals:
      - 作為高專學生與同伴並肩行動。
      - 證明咒骸也能有獨立人格與選擇。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁與 Wiki 交叉核對：突變咒骸、東京校學生。

  - id: yuta-okkotsu
    name: 乙骨憂太
    aliases:
      - Okkotsu Yuta
    role: 東京校學生 / 特級術師 NPC
    canon_role: 東京咒術高專二年級學生，特級術師。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生 / 特級術師
    appearance_public: >
      黑髮，眼神溫和但常帶疲憊陰影，身形修長，氣質比年紀更沉，像背著太多重量的學生。
    appearance_current: >
      可作強力但克制的學生 NPC；避免讓他替主角解決核心衝突。
    personality:
      - 溫柔、內斂，對同伴忠誠。
      - 戰鬥時可迅速切換為冷靜而危險的狀態。
      - 對傷害他人有心理負擔，但必要時不逃避。
    speech_style:
      baseline: 禮貌、柔和，常先考慮對方感受。
      under_stress: 聲音變低，措辭仍禮貌但殺意明確。
      humor: 輕微尷尬型，常被同伴帶動。
    abilities:
      - 特級咒力量級、反轉術式、刀術、複製術式相關參考。
    combat_profile:
      battle_role: >
        特級多功能支援與決戰手。乙骨能補位、治療、近戰、複製術式與壓制強敵，使用時需避免蓋過主角。
      combat_style: >
        平時溫和保守，戰鬥中會迅速進入低語、短句、精準斬擊與保護同伴的狀態。
        他不愛炫技，會用最短路徑結束危險。
      technique_details: >
        可把戰鬥拆成刀術基底、龐大咒力量、反轉術式與條件式複製能力。
        複製術式應明確限制觸發條件、維持時間、同步負荷與是否需要媒介。
      range_and_positioning: >
        近中距離最穩，遠距離可依複製術式或咒力輸出補足。適合站在隊伍破口處，像最後一道門。
      counters_and_limits: >
        人質、多人同時受傷、陌生術式規則、時間限制與保護對象分散會讓他無法單純全力壓制。
      scene_usage: >
        適合當高階任務的壓艙石。讓他解決「不該由主角硬扛」的支線壓力，而非偷走主角核心選擇。
    current_status: >
      可作高階任務支援、外派前輩或特級術師尺度參照。
    progressions: []
    goals:
      - 保護重要的人。
      - 承擔自身力量帶來的責任。
    secrets:
      - 不展開原作核心詛咒關係與事件。
    first_appearance: reference_only
    source_notes:
      - 官方電影角色頁與 Wiki 交叉核對：東京校學生、特級術師。

  - id: kinji-hakari
    name: 秤金次
    aliases:
      - Hakari Kinji
    role: 東京校學生 / 停學系前輩 NPC
    canon_role: 東京咒術高專三年級學生，性格與高專體制衝突感強。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      氣質張揚，像混在地下賭局、格鬥場與夜生活裡的高專學生，表情常帶挑釁笑意。
    appearance_current: >
      可作非典型前輩、地下情報、人脈與風險投資式行動 NPC。
    personality:
      - 追求熱度與賭性，討厭無聊規則。
      - 對自己認定有趣或有價值的人會給機會。
      - 不適合被寫成乖順高專模範生。
    speech_style:
      baseline: 粗口語、挑釁、有賭徒節奏。
      under_stress: 反而興奮，語速和壓迫感上升。
      humor: 地下場子式調侃。
    abilities:
      - 領域與運氣/賭局意象相關能力參考。
      - 近身戰與高風險壓制。
    combat_profile:
      battle_role: >
        高風險高回報的持久近戰者。秤適合把戰鬥寫成賭局，越危險越像進入他的節奏。
      combat_style: >
        他會主動逼近、挑釁、吃招換資訊，利用近戰壓力迫使敵人進入領域或賭局規則。
        情勢越混亂，他越興奮，也越敢用身體換機會。
      technique_details: >
        領域與運氣意象可設計成規則型優勢：抽選、回合、概率、獎勵狀態、短時間強化或近似不死的高峰期。
        必須記清楚觸發、結果、持續時間與失敗後的空窗。
      range_and_positioning: >
        近距離最佳，地下拳場、柏青哥店、廢棄娛樂場和霓虹街區能放大他的賭性氣質。
      counters_and_limits: >
        拒絕進入規則、拖過強化時間、在空窗期集火、或用不確定性以外的絕對控制能反制他。
      scene_usage: >
        適合寫瘋狂節奏。每一次抽選或規則轉動都應讓讀者感到局勢正在翻盤或崩盤。
    current_status: >
      可作原創主角接觸高專邊緣圈子的入口。
    progressions: []
    goals:
      - 追求讓自己感到熱的局面。
      - 按自己的規則生存。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：東京校三年級。

  - id: kirara-hoshi
    name: 星綺羅羅
    aliases:
      - Hoshi Kirara
    role: 東京校學生 / 高專邊緣圈 NPC
    canon_role: 東京咒術高專三年級學生，與秤金次關係密切。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      打扮具有鮮明個人風格，眼神警惕，和普通高專制服氣質不同，更接近地下圈子的門面人物。
    appearance_current: >
      可作邊緣圈守門人、情報篩選者與術式規則型 NPC。
    personality:
      - 警戒心強，重視信任與圈內界線。
      - 對外人不輕易放行，對自己人很護短。
      - 敏銳，會先觀察對方是否值得冒險。
    speech_style:
      baseline: 犀利、帶距離感，不主動給好臉色。
      under_stress: 更尖銳，會直接切斷對話或行動。
      humor: 帶刺的吐槽。
    abilities:
      - 星座/距離條件類術式參考。
      - 情報過濾與場地控制。
    combat_profile:
      battle_role: >
        規則型控場與守門人。綺羅羅適合阻擋、篩選、隔離目標，而不是正面火力壓制。
      combat_style: >
        開場先保持距離，讓敵人不明白為什麼接近不了、為什麼路線被迫偏轉。
        她會用規則讓對手自己暴露焦躁與弱點。
      technique_details: >
        星座/距離術式可寫成標記目標後建立接近順序、吸引與排斥規則。
        標記、星名、目標數量、有效距離與重新指定時間都要明確。
      range_and_positioning: >
        中距離與複雜場地最佳。門口、樓梯、鐵網、停車場和地下俱樂部能讓距離規則更直觀。
      counters_and_limits: >
        看穿標記規則、破壞媒介、同時多點逼近或用遠距攻擊繞過接近限制都能反制。
      scene_usage: >
        適合作進門前考驗。讀者應跟角色一起逐步推理規則，而不是直接聽解說。
    current_status: >
      可作原創角色要見秤或接觸地下圈前的門檻。
    progressions: []
    goals:
      - 保護自己認可的小圈子。
      - 避免被高專或總監部規則吞掉。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：東京校三年級。

  - id: yoshinobu-gakuganji
    name: 樂巖寺嘉伸
    aliases:
      - Gakuganji Yoshinobu
    role: 京都校校長 / 保守派 NPC
    canon_role: 京都咒術高專校長，咒術界保守派代表人物之一。
    usable_as_npc: true
    age: 成人
    occupation: 京都校校長
    appearance_public: >
      年長男性，外表乾瘦而威嚴，傳統權威感強，能把會議室氣氛壓得像審判場。
    appearance_current: >
      可作保守派決策者、政治壓力來源或京都校權威 NPC。
    personality:
      - 重視秩序、規範與咒術界傳統。
      - 願意做冷酷決策，以維持整體制度安全。
      - 不容易被學生情感或改革論說服。
    speech_style:
      baseline: 古板、緩慢、帶上位者裁決感。
      under_stress: 更冷硬，直接訴諸規則與處分。
      humor: 幾乎沒有。
    abilities:
      - 音樂媒介咒術參考。
      - 校政、人事與保守派政治運作。
    combat_profile:
      battle_role: >
        後排干涉型術師與政治壓力源。樂巖寺的戰鬥應帶有儀式、音波與權威感，而非肉搏主導。
      combat_style: >
        會保持距離，以樂器或音樂媒介輸出咒力，讓攻擊像看不見的震波穿過場地。
        他更擅長配合部下、結界與校方資源，而不是孤身衝鋒。
      technique_details: >
        音樂媒介可用音階、節拍、共振與音量作術式規則：低頻震骨，高頻切割，節拍累積後爆發。
        媒介被破壞或節奏被打斷會影響輸出。
      range_and_positioning: >
        中遠距離最佳，講堂、寺社、校園廣場或結界內舞台都能放大聲音傳導。
      counters_and_limits: >
        靜音結界、破壞樂器、近身打斷、噪音干擾與多方向突襲都能削弱他。
      scene_usage: >
        適合寫制度壓迫具象化。音樂不必華麗，重點是每個音都像裁決落下。
    current_status: >
      可作新故事中總監部與京都校立場的具體人臉。
    progressions: []
    goals:
      - 維護咒術界秩序。
      - 防止失控因素危害制度。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：京都校校長、保守派。

  - id: utahime-iori
    name: 庵歌姬
    aliases:
      - Iori Utahime
    role: 京都校教師 / 準1級術師 NPC
    canon_role: 京都咒術高專教師，準1級術師。
    usable_as_npc: true
    age: 成人
    occupation: 咒術高專教師
    appearance_public: >
      黑色長髮，臉上有明顯傷痕，巫女風或教師式服裝帶京都校氣質；端正但不柔弱。
    appearance_current: >
      可作京都校學生的照顧者、教師、支援術式與協調角色。
    personality:
      - 負責、成熟，會安撫學生衝突。
      - 對五條悟特別容易被激怒，但不是失去判斷。
      - 重視團隊與安全。
    speech_style:
      baseline: 教師式清楚、有禮，對學生耐心。
      under_stress: 會提高音量，迅速切入管教和指揮。
      humor: 被逗怒時的吐槽感最強。
    abilities:
      - 支援型術式參考。
      - 京都校教學、任務協調與學生管理。
    combat_profile:
      battle_role: >
        團隊增幅型支援教師。歌姬適合在多人任務中提升同伴輸出、穩定節奏與指揮學生站位。
      combat_style: >
        她會先確認護衛、施術空間與隊友狀態，再使用需要準備或吟唱感的支援術式。
        她不會把自己放進無謂近戰，而是維持能看清全場的位置。
      technique_details: >
        支援術式可寫成透過儀式動作、歌聲、咒詞或舞步放大指定術師的咒力輸出與精度。
        條件包括準備時間、施術範圍、是否需要同伴留在陣內，以及被打斷後的反噬。
      range_and_positioning: >
        後中排最佳。屋頂、舞台、神社迴廊和結界中心點適合讓她成為團隊核心。
      counters_and_limits: >
        奇襲、分割戰場、沉默效果、打斷儀式與隊友離開範圍都會削弱她。
      scene_usage: >
        適合寫團隊戰。她的價值在於讓別人變強，同時把學生安全放在術式效率之前。
    current_status: >
      可作京都校溫度較高的成人 NPC。
    progressions: []
    goals:
      - 保護京都校學生。
      - 在保守制度內盡量做出對學生有利的選擇。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：京都校教師、準1級。

  - id: aoi-todo
    name: 東堂葵
    aliases:
      - Todo Aoi
    role: 京都校學生 / 1級術師 NPC
    canon_role: 京都咒術高專三年級學生，1級術師。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      高大肌肉型身材，氣勢像格鬥家，站姿張揚，表情常帶過度熱情與壓迫感。
    appearance_current: >
      可作戰鬥狂前輩、價值觀測試者或京都校核心戰力 NPC。
    personality:
      - 熱血、怪癖強，會用荒謬問題判斷對方靈魂。
      - 戰鬥智商高，能在混亂中迅速讀局。
      - 一旦認可對方，會給出誇張但真誠的支持。
    speech_style:
      baseline: 大聲、戲劇化、充滿自我節奏。
      under_stress: 反而更興奮，像在享受高難度戰鬥題。
      humor: 誇張、偶像宅、兄弟情幻想式。
    abilities:
      - 不義遊戲、近身格鬥、咒力強化、戰術讀局。
    combat_profile:
      battle_role: >
        近戰亂局製造者。東堂適合把單純對打變成位置交換、心理壓迫與節奏欺騙的高速戰。
      combat_style: >
        先用怪問題和肉體壓迫測試對手，交手後以拍手觸發位置交換，讓敵人每次判斷都可能失效。
        他能在混戰中同時讀取同伴意圖與敵方重心。
      technique_details: >
        不義遊戲以拍手為觸發，可交換帶有咒力的兩個目標位置。
        細節需記清：可交換人、咒具、咒靈或物件；假拍、延遲拍、同伴配合都能形成戰術欺騙。
      range_and_positioning: >
        近中距離最強。開闊場地適合交換角度，狹窄場地則能讓每次位移都變成撞牆、斷招或背後襲擊。
      counters_and_limits: >
        封住雙手、阻止拍手、拉遠距離、讓場上咒力目標過多或完全讀懂交換規則能降低威脅。
      scene_usage: >
        適合寫高智商肌肉戰。每次拍手都要改變位置關係，讓讀者感到戰場像被洗牌。
    current_status: >
      可作測試原創角色戰鬥直覺與個性的強力 NPC。
    progressions: []
    goals:
      - 尋找靈魂合拍的強者。
      - 追求讓自己燃燒的戰鬥。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：京都校三年級、1級。

  - id: noritoshi-kamo
    name: 加茂憲紀
    aliases:
      - Kamo Noritoshi
    role: 京都校學生 / 準1級術師 NPC
    canon_role: 京都咒術高專三年級學生，加茂家本家相關，準1級術師。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      黑髮束起，五官端正但嚴肅，制服穿著規矩，整體像被家族責任鍛造成的年輕繼承人。
    appearance_current: >
      可作名門責任、血統政治與血液術式參考 NPC。
    personality:
      - 責任感強，思考合理，能做出冷酷判斷。
      - 被家族期待壓住，行動常帶義務感。
      - 不是惡意的人，但會優先考慮大局與名門立場。
    speech_style:
      baseline: 正式、克制，像在代表家族發言。
      under_stress: 更理性，語氣變硬。
      humor: 少，偶爾是一本正經造成的反差。
    abilities:
      - 赤血操術、弓術、血液控制與中距離戰。
    combat_profile:
      battle_role: >
        中距離精密射手與血液術式範例。加茂適合以血箭、血刃、血線和身體強化控制戰鬥節奏。
      combat_style: >
        開場保持禮貌距離，先用弓術與血液軌跡測試敵人反應，再逐步提高血液操控精度。
        他會把家族責任感轉化成穩定而冷酷的判斷。
      technique_details: >
        赤血操術可包含血液壓縮射出、血線拘束、血刃切割、血液感知與身體循環強化。
        必須記錄血量來源、失血風險、凝固限制與是否能使用預存血包。
      range_and_positioning: >
        中距離最佳，遠距可用弓箭，近距需要血刃與體術防身。
        長廊、庭院、屋頂和射線清楚的校園場地都適合他。
      counters_and_limits: >
        持久戰會造成血量壓力；高溫、凝血干擾、毒性污染與快速貼身都能增加危險。
      scene_usage: >
        適合寫名門術式的優雅與殘酷。血液的量、軌跡、顏色和凝結聲要成為戰鬥語言。
    current_status: >
      適合用於御三家政治、京都校任務與術式血統設定。
    progressions: []
    goals:
      - 承擔加茂家責任。
      - 在家族期待與個人判斷間找平衡。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：京都校三年級、準1級、加茂家。

  - id: momo-nishimiya
    name: 西宮桃
    aliases:
      - Nishimiya Momo
    role: 京都校學生 NPC
    canon_role: 京都咒術高專三年級學生，使用掃帚飛行與支援型術式。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      身形嬌小，金色雙馬尾與掃帚媒介讓外表接近魔女意象，但說話尖銳時很有攻擊性。
    appearance_current: >
      可作空中偵查、支援與京都校女生視角 NPC。
    personality:
      - 外表可愛，內在有現實感與尖銳保護欲。
      - 對真依抱持敬意與維護心。
      - 清楚女性術師在咒術界承受的評價壓力。
    speech_style:
      baseline: 伶俐、略尖，情緒來時不客氣。
      under_stress: 語速加快，攻擊性上升。
      humor: 挖苦式，帶小個子不服輸的狠勁。
    abilities:
      - 掃帚飛行、空中偵查、支援與牽制。
    combat_profile:
      battle_role: >
        空中偵查與支援牽制。西宮桃適合提供視野、傳遞情報、打斷敵人動線與支援地面同伴。
      combat_style: >
        她會先升空取得地形資訊，利用高度避開近戰，再從斜上方投放干擾、傳話或誘導敵人暴露位置。
      technique_details: >
        掃帚飛行可作為媒介術式：速度、高度、轉向半徑、承載重量與咒力消耗都要明確。
        可加入風壓、俯衝、空中急停與利用建築物遮蔽的技巧。
      range_and_positioning: >
        遠中距離最佳，城市街區、森林上空、校園廣場和山路都能讓她發揮偵查價值。
      counters_and_limits: >
        遠程狙擊、風雨、結界天花板、空中咒靈與掃帚媒介受損都會讓她陷入危險。
      scene_usage: >
        適合把戰場從平面變成立體。她的回報能讓讀者知道敵人在哪、哪條路快崩了。
    current_status: >
      可作空中視角、京都校情報傳遞與女性術師議題 NPC。
    progressions: []
    goals:
      - 支援同伴。
      - 保護自己認同的人不被輕視。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：京都校三年級。

  - id: mai-zenin
    name: 禪院真依
    aliases:
      - Zenin Mai
    role: 京都校學生 NPC
    canon_role: 京都咒術高專二年級學生，禪院家出身，真希的雙胞胎妹妹。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      黑綠色短髮，制服整潔，常攜帶手槍，漂亮外表下有尖銳的防衛性與厭世感。
    appearance_current: >
      可作家族壓迫、姐妹對照、槍械咒力應用參考 NPC。
    personality:
      - 嘴毒，擅長先刺傷別人以保護自己。
      - 對家族和才能制度有複雜怨氣。
      - 不喜歡被迫成為勇敢的人。
    speech_style:
      baseline: 冷嘲、漂亮話裡藏針。
      under_stress: 會更惡毒，也更容易露出真正脆弱處。
      humor: 挑釁、煽動、帶自傷意味。
    abilities:
      - 構築術式參考、槍械使用、咒力子彈。
    combat_profile:
      battle_role: >
        精準火力與消耗型術式使用者。真依適合以槍械、心理戰與有限資源製造威脅。
      combat_style: >
        她會保持距離，用語言刺激情緒，再以手槍、掩體與咒力子彈逼敵人暴露。
        她不喜歡無謂正面拼命，戰鬥裡常帶著被迫上場的厭煩。
      technique_details: >
        構築術式可把咒力轉化為實體物質，但消耗極大；她的子彈、備彈、裝填時間與可構築數量都應清楚。
        槍械不是裝飾，要寫後座力、瞄準線、彈殼、遮蔽物與射擊角度。
      range_and_positioning: >
        中遠距離最佳，走廊、教室、停車場與有柱子的室內能讓她利用掩體。
      counters_and_limits: >
        近身壓迫、彈藥耗盡、構築消耗、視線被遮與槍械被破壞都會限制她。
      scene_usage: >
        適合寫壓抑型戰鬥。每一發子彈都像情緒和資源一起被扣掉，不能浪費。
    current_status: >
      可作名門女性術師壓力的強烈 NPC。
    progressions: []
    goals:
      - 從家族與比較中保住自我。
      - 不被他人期待拖進不想要的人生。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：京都校二年級、禪院家、真希雙胞胎妹妹。

  - id: kasumi-miwa
    name: 三輪霞
    aliases:
      - Miwa Kasumi
    role: 京都校學生 NPC
    canon_role: 京都咒術高專二年級學生，個性常識、目標務實。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      淡藍色長髮，制服端正，表情比周圍怪人正常許多，像認真打工養家的普通學生被丟進咒術界。
    appearance_current: >
      可作常識人、低壓吐槽、努力型劍士 NPC。
    personality:
      - 素直、務實，常為錢和升級努力。
      - 在怪人群中像正常人的安全感來源。
      - 容易緊張，但不缺善意。
    speech_style:
      baseline: 禮貌、普通、帶一點自我吐槽。
      under_stress: 慌張但努力保持指令清楚。
      humor: 常識人吐槽與迷妹反應。
    abilities:
      - 刀術、簡易領域、基礎咒力操作。
    combat_profile:
      battle_role: >
        基礎紮實的防守劍士。三輪適合呈現普通術師如何靠訓練、簡易領域和穩定心態撐住危險。
      combat_style: >
        她會緊張，但動作不亂；先架刀守線，確認同伴位置，再用簡易領域保護自己或拖延敵人。
      technique_details: >
        新陰流與簡易領域可作為固定半徑防線：敵人進入範圍就以自動化斬擊或反應訓練迎擊。
        需要明確範圍、站姿、刀是否出鞘與維持時的精神集中。
      range_and_positioning: >
        近距離防守最佳。門口、樓梯口、窄橋和需要守住一人的位置都能突出她的價值。
      counters_and_limits: >
        遠距火力、大範圍術式、心理壓迫與逼她主動追擊會削弱她。
        她的自信不足可以成為戰鬥壓力，但不該把她寫成無能。
      scene_usage: >
        適合寫小人物的專業感。她的勝利可以是守住三十秒、擋下一擊、讓同伴成功撤離。
    current_status: >
      適合作原創角色的京都校友善入口。
    progressions: []
    goals:
      - 升級、賺錢、改善生活。
      - 成為派得上用場的術師。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：京都校二年級。

  - id: kokichi-muta
    name: 與幸吉
    aliases:
      - Muta Kokichi
      - 究極機械丸
      - Ultimate Mechamaru
    role: 京都校學生 NPC / 遠隔咒骸操作者
    canon_role: 京都咒術高專二年級學生，因天與咒縛以遠隔咒骸活動。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      公開活動時多以機械丸咒骸形象出現，像機器人般堅硬；本體則承受嚴重肉體限制。
    appearance_current: >
      可作天與咒縛、遠距離操控、身體代價與孤立感參考 NPC。
    personality:
      - 內向、壓抑，渴望正常身體與同伴距離。
      - 技術感強，習慣隔著媒介觀察世界。
      - 自尊與孤獨感都很深。
    speech_style:
      baseline: 透過機械丸時偏平板、硬質，私下更陰鬱。
      under_stress: 變得尖銳，容易暴露不甘。
      humor: 乾冷，常帶自嘲。
    abilities:
      - 天與咒縛帶來的廣域術式範圍與咒力輸出。
      - 遠隔操控咒骸、機械丸戰鬥與情報收集。
    combat_profile:
      battle_role: >
        遠隔火力平台與情報節點。與幸吉能同時出現在多處，以機械丸承擔戰鬥、偵查、通訊與犧牲性拖延。
      combat_style: >
        他會先以無人咒骸探路，保持本體安全距離，利用炮擊、機械臂、裝甲與多機協同壓制敵人。
      technique_details: >
        天與咒縛讓他以嚴重肉體限制換取廣域操控與高輸出。
        機械丸可配備咒力炮、刀臂、推進器、通訊裝置、偵查鏡頭與自毀拖延，但每具咒骸有成本與維修需求。
      range_and_positioning: >
        遠距離最佳。本體可在醫療艙、地下室或結界保護區；機械丸在戰場前線行動。
      counters_and_limits: >
        找到本體、干擾通訊、破壞中繼、消耗備機或讓戰場超出操控條件都能反制。
      scene_usage: >
        適合寫孤立與科技感。戰鬥畫面可以在冷冰冰的操控視窗和前線金屬破碎之間切換。
    current_status: >
      適合用於天與咒縛代價、遠距任務和科技感咒骸支線。
    progressions: []
    goals:
      - 接近正常人際距離。
      - 讓自己的痛苦換來實際價值。
    secrets:
      - 不記錄原作秘密任務或劇情轉折。
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：京都校二年級、天與咒縛、機械丸。

  - id: arata-nitta
    name: 新田新
    aliases:
      - Nitta Arata
    role: 京都校學生 NPC
    canon_role: 京都咒術高專一年級學生，新田明的弟弟。
    usable_as_npc: true
    age: 高專學生
    occupation: 咒術高專學生
    appearance_public: >
      年輕學生氣質，說話帶關西腔印象，外表不像主戰派，更像支援和現場處理型術師。
    appearance_current: >
      可作京都校低年級、支援術式與姐弟關係參考 NPC。
    personality:
      - 務實、反應快，懂得在危急時先穩住局面。
      - 對前輩與成人有基本禮貌，但不木訥。
      - 能讓沉重現場多一點人味。
    speech_style:
      baseline: 帶關西節奏，口語但不失分寸。
      under_stress: 迅速報告狀況，先處理能救的部分。
      humor: 輕微吐槽，緩和壓力。
    abilities:
      - 支援型術式參考、現場急救感判斷。
    combat_profile:
      battle_role: >
        現場穩定支援。新田新適合在戰鬥崩壞後爭取「還來得及救」的窗口。
      combat_style: >
        他不會主動站到最前線，會先判斷傷者、撤退路線與敵人是否追擊，再用術式或急救處理拖住惡化。
      technique_details: >
        支援術式可設計為暫時固定傷勢狀態、延緩惡化或保留救治可能。
        限制需明確：不能真正治癒、不能逆轉已經完成的死亡、維持時間有限且需要接觸或視線。
      range_and_positioning: >
        後排與撤退線最佳。樓梯間、救護車旁、帳邊緣與臨時醫療點適合他行動。
      counters_and_limits: >
        敵人持續追擊、多名重傷者同時出現、術式時間耗盡或無法接觸傷者都會讓他陷入困境。
      scene_usage: >
        適合寫戰後緊急處理。讓他把「還有機會」變成緊迫倒數，而非廉價治療。
    current_status: >
      可作京都校支援角色或新田明相關 NPC。
    progressions: []
    goals:
      - 在現場派上用場。
      - 保住同伴能被救回的可能。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁交叉核對：京都校一年級、新田明之弟。

  - id: kento-nanami
    name: 七海建人
    aliases:
      - Nanami Kento
      - 七海
    role: 高專校友 / 1級術師 / 自由術師 NPC
    canon_role: 五條悟後輩，高專校友，曾離開咒術界後再成為1級術師。
    usable_as_npc: true
    age: 成人
    occupation: 1級咒術師
    appearance_public: >
      金髮整齊後梳，戴護目鏡式眼鏡，西裝筆挺，體格結實，像把社畜疲憊和職業殺意熨平在領帶下。
    appearance_current: >
      可作成人導師、任務搭檔、職業倫理與術師勞動觀 NPC；不記原作命運。
    personality:
      - 極度理性，討厭加班和不合理制度。
      - 外冷內熱，對年輕術師有保護底線。
      - 能把恐懼、厭惡與責任切開處理。
    speech_style:
      baseline: 禮貌、乾淨、職場式精準，不說多餘廢話。
      under_stress: 更冷靜，會用數字、時間、效率描述危機。
      humor: 乾到像工時紀錄表的厭世吐槽。
    abilities:
      - 十劃咒法，能將目標按比例劃分並製造弱點。
      - 咒力強化、鈍刀咒具、黑閃經驗參考。
    combat_profile:
      battle_role: >
        精準破防型成人術師。七海適合對付高耐久敵人、硬殼咒靈與需要穩定效率的任務。
      combat_style: >
        開場迅速評估工時、風險與弱點，以鈍刀咒具和十劃咒法切入固定比例點。
        他很少浪費動作，每一次揮擊都像完成一項必要工作。
      technique_details: >
        十劃咒法把目標長度按 7:3 比例劃分，在分割點製造強制弱點。
        可作用於身體、咒靈外殼、牆體或武器；需要判定目標尺度、接觸或有效攻擊線。
      range_and_positioning: >
        近中距離最佳。辦公樓、地下道、商業街與狹窄室內能突出他冷靜拆解敵人的節奏。
      counters_and_limits: >
        無固定形體、快速變形、遠距離轟炸、多人包夾或讓他保護學生都會干擾十劃精度。
        加班狀態可作輸出提升，但不應無代價濫用。
      scene_usage: >
        適合寫職業化暴力。動作乾淨、判斷精準，戰鬥結束後仍能回到厭世的成人語氣。
    current_status: >
      可作原創主角接觸成人術師現實面的重要 NPC。
    progressions: []
    goals:
      - 盡可能讓年輕人不用承擔成人的爛帳。
      - 以職業術師身分完成該完成的事。
    secrets:
      - 不記錄原作結局；新故事可另行安排其任務狀態。
    first_appearance: reference_only
    source_notes:
      - 官方角色頁：1級、脫離公司後成為更適性的術師；Wiki 交叉核對術式。

  - id: mei-mei
    name: 冥冥
    aliases:
      - Mei Mei
    role: 高專校友 / 1級術師 / 自由術師 NPC
    canon_role: 個人活動的1級咒術師，重視金錢與利益。
    usable_as_npc: true
    age: 成人
    occupation: 1級咒術師 / 自由術師
    appearance_public: >
      銀白長髮常編成遮掩臉側的髮型，身形修長，衣著優雅而昂貴，姿態像把價格標籤藏在微笑後。
    appearance_current: >
      可作高價委託、情報買賣、利益導向支援或不可靠盟友 NPC。
    personality:
      - 冷靜、貪財，能把危險與報酬算得很清楚。
      - 不受廉價道德綁架，願意為足夠利益承擔風險。
      - 對自己能力與市場價值有絕對自信。
    speech_style:
      baseline: 優雅、輕柔，語句裡常有價格和交易感。
      under_stress: 仍保持從容，會快速重估收益與撤退價值。
      humor: 成熟、玩味，像把對方也放上秤盤。
    abilities:
      - 黑鳥操術，操控烏鴉偵查、共享視野與攻擊。
      - 巨斧咒具與近戰能力。
      - 情報、委託、報酬談判。
    combat_profile:
      battle_role: >
        情報型自由術師與高價火力支援。冥冥適合把偵查、談判與致命打擊包成一筆昂貴委託。
      combat_style: >
        她會先用烏鴉共享視野，掌握敵方位置與報酬風險；真正近戰時才拿巨斧進場，
        以優雅姿態做出非常實用的殺傷。
      technique_details: >
        黑鳥操術可用於偵查、跟蹤、視野共享、標記與自殺式攻擊。
        烏鴉的數量、視線死角、操控距離、犧牲條件和單次爆發威力都要清楚。
      range_and_positioning: >
        遠距偵查加近距收割。城市高樓、車站、森林上空和任務外圍都能讓烏鴉網絡發揮。
      counters_and_limits: >
        殺死烏鴉、遮蔽天空、干擾視野共享、讓報酬不划算或逼她保護無收益目標都會影響行動。
      scene_usage: >
        適合寫利益導向的可靠危險人物。她可以救場，但最好讓價格、條件與冷靜算計同時出現。
    current_status: >
      適合作為新故事中需要花錢請動的高階自由術師。
    progressions: []
    goals:
      - 獲得合理甚至高額報酬。
      - 讓自己的能力永遠保持市場價值。
    secrets:
      - 可設計她掌握原創案件情報，但必須有明確交易條件。
    first_appearance: reference_only
    source_notes:
      - 官方角色頁：個人活動的1級術師、守財奴形象；Wiki 交叉核對黑鳥操術與武器。

  - id: suguru-geto
    name: 夏油傑
    aliases:
      - Geto Suguru
    role: 高專校友 / 咒靈操術參考 NPC
    canon_role: 高專出身術師，具備咒靈操術相關能力；可作制度外校友參考。
    usable_as_npc: restricted
    age: 成人
    occupation: 高專校友 / 術師背景 NPC
    appearance_public: >
      黑色長髮常束起，五官溫和但距離感深，袈裟或寬鬆服裝能呈現宗教性與異端感。
    appearance_current: >
      可作高專校友、咒靈操術設定參考或制度外人物；使用前需確認不搬用原作主線。
    personality:
      - 溫和外表下有極端信念與分類世界的傾向。
      - 擅長說服、組織與以理念包裝暴力。
      - 對術師與非術師的價值判斷可成為新故事危險議題。
    speech_style:
      baseline: 柔和、宗教式、有引導感。
      under_stress: 保持平穩，但措辭會變得排他。
      humor: 淡淡的，像在寬容他人無知。
    abilities:
      - 咒靈操術參考、組織經營、理念型反派語氣。
    combat_profile:
      battle_role: >
        多單位召喚與理念型壓迫者。夏油適合用大量咒靈、稀有咒靈能力與話術把戰鬥變成思想圍剿。
      combat_style: >
        他通常不急著親自出手，會先釋放咒靈探測、包圍、拖延與消耗，再用談話測試對手信念。
      technique_details: >
        咒靈操術可收納、釋放與役使已控制的咒靈；每隻咒靈需有等級、能力、消耗與失去後的代價。
        高階用法可把多種咒靈能力組合成偵查、火力、結界破壞與精神壓迫。
      range_and_positioning: >
        中遠距離最強，本體站在咒靈群後方。寺廟、廢棄設施、教團場地與人群邊緣能放大他的組織感。
      counters_and_limits: >
        快速突破咒靈群、限制召喚空間、祓除關鍵咒靈、逼迫本體連續應對都能削弱他。
        使用時需避開原作事件線，能力只作新故事參考。
      scene_usage: >
        適合寫「敵人有理念」的戰鬥。每波咒靈都應反映他的準備與價值觀，而非隨機怪物海。
    current_status: >
      受限 NPC。若要使用，先在 secrets-lockbox 記錄其在新故事中的非原作定位。
    progressions: []
    goals:
      - 依新故事另定，不沿用原作事件線。
    secrets:
      - 不記錄原作轉折、事件或結局。
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：高專校友、咒靈操術相關。

  - id: yuki-tsukumo
    name: 九十九由基
    aliases:
      - Tsukumo Yuki
    role: 特級術師 / 高專外部成人 NPC
    canon_role: 日本少數特級術師之一，不滿足於只祓除咒靈，而關注咒靈不再誕生的可能。
    usable_as_npc: true
    age: 成人
    occupation: 特級咒術師
    appearance_public: >
      金色長髮，身材高挑，穿著自由，氣質像旅行者與研究者混合，笑容開放但問題尖銳。
    appearance_current: >
      可作世界觀研究者、咒力本質提問者與特級尺度 NPC。
    personality:
      - 自由、不受高專日常束縛，問題意識很大。
      - 對人感興趣，常用直接問題刺探對方本質。
      - 不喜歡只治標不治本的咒術界運作。
    speech_style:
      baseline: 大方、直球，常從喜好或哲學問題切入。
      under_stress: 仍爽朗，但判斷會變得非常快。
      humor: 成熟豪爽，帶點旅行者的鬆弛。
    abilities:
      - 特級術師尺度、咒力研究、近身戰與式神搭配參考。
    combat_profile:
      battle_role: >
        特級研究者與重擊型自由戰力。九十九適合在大尺度議題中出手，讓戰鬥同時帶有哲學問題和壓倒性物理感。
      combat_style: >
        她會用輕鬆語氣切入戰場，先問出刺痛本質的問題，再以近身重擊、式神配合和高輸出快速改變局勢。
      technique_details: >
        可把能力設計成與質量、重量或概念性負荷相關：讓攻擊帶上不合理的沉重感，
        式神負責牽制、撞擊或承接術式效果。需明確自身承受極限與對環境的破壞。
      range_and_positioning: >
        近中距離最具壓迫感，開闊場地能呈現重擊造成的地面破裂與空氣震動。
      counters_and_limits: >
        情報不足、保護目標、結界限制、長期消耗與必須避免大規模破壞時會限制她。
      scene_usage: >
        適合寫成「大人把世界問題帶進戰場」。她的戰鬥不只贏，還會逼角色重新思考咒術循環。
    current_status: >
      可作新故事中提出咒術世界根本問題的成人 NPC。
    progressions: []
    goals:
      - 探索消除咒靈產生根源的方法。
      - 跳出只祓除咒靈的循環。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁：特級術師，目標是不只祓除咒靈，而是追求咒靈不生的世界。

  - id: takuma-ino
    name: 豬野琢真
    aliases:
      - Ino Takuma
    role: 術師 / 七海相關後輩 NPC
    canon_role: 年輕術師，對七海建人抱有強烈憧憬。
    usable_as_npc: true
    age: 成人
    occupation: 咒術師
    appearance_public: >
      戴針織帽，年輕、幹勁明顯，外表不像老練殺手，更像努力追上前輩的現場術師。
    appearance_current: >
      可作七海風格的後輩、年輕成人術師與任務支援 NPC。
    personality:
      - 熱心、尊敬前輩，尤其重視七海的認可。
      - 有責任感，也有年輕術師的急切。
      - 面對危險會努力撐住專業形象。
    speech_style:
      baseline: 禮貌但有衝勁，前輩面前更拘謹。
      under_stress: 語氣變急，但仍嘗試照流程處理。
      humor: 年輕術師式吐槽與逞強。
    abilities:
      - 來訪瑞獸相關術式參考。
      - 現場支援與中階任務處理。
    combat_profile:
      battle_role: >
        中階前線支援與成長型術師。豬野適合處理二級到準一級壓力，表現努力追上前輩的實戰感。
      combat_style: >
        他會努力維持專業，先保護委託目標與同伴，再用術式切換不同瑞獸效果。
        面對強敵時會有逞強，但仍會回到七海式的務實判斷。
      technique_details: >
        來訪瑞獸可寫成借用四種瑞獸意象的分段能力：偵查、速度、打擊、防護或特殊干涉。
        需定義召請順序、媒介、每一段效果、能否中斷，以及失敗時的反噬。
      range_and_positioning: >
        近中距離最佳，可依瑞獸效果短暫切換追擊、防守或支援。
        普通街區、住宅樓、商店街和交通樞紐適合他的中階任務感。
      counters_and_limits: >
        打斷召請、逼他連續切換、讓他保護太多人或面對特級威脅都會讓壓力超標。
      scene_usage: >
        適合寫年輕成人術師的可靠與不足。他能撐住局面，但需要同伴或前輩級判斷補上最後一段。
    current_status: >
      可作原創主角接觸七海系成人術師圈子的橋樑。
    progressions: []
    goals:
      - 成為被七海認可的術師。
      - 在現場做出正確判斷。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - 官方角色頁：2級術師，對七海抱有強烈憧憬。

  - id: naobito-zenin
    name: 禪院直毘人
    aliases:
      - Zenin Naobito
      - 直毘人
    role: 禪院家第26代家主 / 特別1級術師 NPC
    canon_role: 禪院家第26代家主，直哉之父，御三家保守價值與投射咒法代表人物。
    usable_as_npc: true
    age: 成人
    occupation: 禪院家家主 / 咒術師
    appearance_public: >
      高瘦年長男性，白髮向後梳至頸後，灰色眼睛，長眉外緣厚重，留英式細鬍；
      身形雖老仍有精瘦肌肉感，站姿像把酒氣、貴族傲慢與老練武人氣質揉在一起。
    appearance_current: >
      可作禪院家權威、投射咒法範本、御三家舊秩序代表；不綁定原作事件與結局。
    personality:
      - 傲慢、守舊，重視強大術式與家族地位。
      - 對不符合家族價值的人缺乏耐心，連親族也會被能力標準評價。
      - 戰鬥時並非只靠速度，會觀察局勢、抓節奏、用經驗壓制對手。
    speech_style:
      baseline: 老派、嘲弄、帶家主上位感，常把對方當晚輩或低階術師看待。
      under_stress: 語氣仍硬，會減少廢話，轉為戰術判斷與命令。
      humor: 酒後式挖苦，帶昭和老頭的刻薄。
    abilities:
      - 投射咒法，將一秒分割為二十四格並按預設動作高速移動。
      - 觸碰對象後可強迫其遵守二十四格規則，失敗則短暫凍結。
      - 落花之情，御三家相傳的反領域技術。
    combat_profile:
      battle_role: >
        高速壓制型老牌強者。直毘人適合呈現禪院家傳統術式的完成度，以及老術師對戰場節奏的掌控。
      combat_style: >
        他會用投射咒法搶先佔位、打亂對手視覺預測，再用體術和凍結效果逼出破綻。
        戰鬥節奏像一段被剪成二十四格的老電影，對手慢半拍就會被甩開。
      technique_details: >
        使用時需先決定一秒內的動作軌跡，動作不合物理規則會受到反噬。
        被觸碰者若跟不上二十四格規則，會被固定在影格中約一秒。
      range_and_positioning: >
        近中距離最佳，開闊場地利於高速折返；狹窄室內可用牆面、柱子和視線死角製造連擊。
      counters_and_limits: >
        情報外的廣域攻擊、預判路徑、地形封鎖、持續傷害與強制保護目標會限制他的速度優勢。
      scene_usage: >
        適合寫成「家主親臨」的壓力場，也能作原創角色理解御三家術式門檻的標尺。
    current_status: >
      可作新故事中禪院家權力中樞、政治談判者或高階任務壓陣 NPC。
    progressions: []
    goals:
      - 維持禪院家在御三家中的地位。
      - 以術式與血統標準篩選家族成員。
    secrets:
      - 若新故事需要家主遺囑、繼承權或家族內鬥，先記入 secrets-lockbox。
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：第26代禪院家家主、特別1級術師、投射咒法、落花之情。

  - id: naoya-zenin
    name: 禪院直哉
    aliases:
      - Zenin Naoya
      - 直哉
    role: 禪院家嫡子 / 炳首領 / 特別1級術師 NPC
    canon_role: 直毘人之子，禪院家高層成員，繼承投射咒法並代表家族性別與血統壓迫的尖銳面。
    usable_as_npc: true
    age: 成人
    occupation: 咒術師 / 禪院家高層
    appearance_public: >
      年輕成年男性，金色短髮、五官漂亮而尖，笑容常帶輕蔑；衣著乾淨昂貴，
      站姿鬆散但像隨時能把人踩進地板。
    appearance_current: >
      可作禪院家傲慢繼承人、投射咒法年輕型範本或性格惡劣的政治 NPC；不綁定原作結局。
    personality:
      - 極端自負，重視血統、男性權威與強者排序。
      - 對女性和弱者常有明顯輕視，言語攻擊性強。
      - 戰鬥腦不差，會在高速移動中修正判斷與挑釁節奏。
    speech_style:
      baseline: 關西腔感強、輕佻、毒辣，常用漂亮笑臉講難聽話。
      under_stress: 嘲諷變尖，輸不起的情緒會滲出來。
      humor: 惡意挖苦，把對方自尊當玩具。
    abilities:
      - 投射咒法，繼承直毘人的二十四格高速移動規則。
      - 近身高速打擊、視覺路徑設計與凍結懲罰。
    combat_profile:
      battle_role: >
        高速刺客型壓迫者。直哉適合當會說垃圾話的禪院家精英，讓戰鬥同時有速度和羞辱感。
      combat_style: >
        他會先用話語削弱對方，再用投射咒法高速繞背、碰觸、凍結、連打。
        越覺得自己佔優勢，越愛把戰鬥變成公開處刑。
      technique_details: >
        與直毘人同樣受二十四格規則限制；預設動作一旦被看穿，對手可利用他的自信誘導錯位。
      range_and_positioning: >
        近距離最危險，適合走廊、庭院、屋頂、道場等能展現高速折返的場地。
      counters_and_limits: >
        情緒激將、地形陷阱、預判路徑、持續壓制和不能傷害特定對象的條件會削弱他。
      scene_usage: >
        適合用來把禪院家內部惡臭價值觀具象化，尤其能壓迫真希、真依、伏黑或原創名門角色。
    current_status: >
      可作禪院家繼承權衝突、家族談判與敵對任務中的高壓 NPC。
    progressions: []
    goals:
      - 成為禪院家真正掌權者。
      - 證明自己比被家族看重的其他繼承候補更適合站在頂端。
    secrets:
      - 若使用咒靈化版本，需另建獨立條目或在 secrets-lockbox 標明分歧設定。
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：直毘人之子、投射咒法、炳首領與禪院家高層。

  - id: ogi-zenin
    name: 禪院扇
    aliases:
      - Zenin Ogi
      - 扇
    role: 禪院家高層 / 真希與真依之父 NPC
    canon_role: 直毘人之弟，真希與真依的父親，禪院家父權與才能評價制度的殘酷代表。
    usable_as_npc: true
    age: 成人
    occupation: 咒術師 / 禪院家高層
    appearance_public: >
      年長男性，臉部線條嚴厲，眼神陰沉，衣著帶傳統家族武人風格；
      站在女兒面前時像一把未出鞘但已經壓住喉嚨的刀。
    appearance_current: >
      可作禪院家內部壓迫者、家族審判者或父女衝突 NPC；不綁定原作戰鬥流程。
    personality:
      - 自尊敏感，將自身地位不足投射到子女身上。
      - 重視家族評價，會把「孩子不夠優秀」視作自己被貶低的理由。
      - 冷酷、怨懟，習慣用父權權威壓制反抗。
    speech_style:
      baseline: 低沉、威壓、像判決，常把家族規矩和個人怨氣混在一起。
      under_stress: 憤怒變得明顯，會把責任推給血統、子女或家族安排。
      humor: 幾乎沒有，只剩輕蔑。
    abilities:
      - 焦眉之赳，可讓武器噴吐或纏繞火焰。
      - 落花之情，可作反領域與劍術防禦技術。
      - 刀術與禪院家傳統武技。
    combat_profile:
      battle_role: >
        火焰劍士與家族壓迫型敵人。扇適合把「親族也能是敵人」的壓力具體化。
      combat_style: >
        他會用刀和火焰逼退對手，語言上不斷用家族評價羞辱目標。
        若對手是晚輩或女性，他的輕視會先於戰術浮現。
      technique_details: >
        焦眉之赳可替斷裂刀身補上火焰刃，或提高斬擊殺傷；落花之情讓身體與刀被咒力包覆，
        自動反擊接觸到的攻擊。
      range_and_positioning: >
        近中距離最合適，道場、倉庫、地下通路和家族庭院能凸顯處刑感。
      counters_and_limits: >
        情緒破防、對晚輩的輕視、遠距牽制、咒具破壞和逼他承認自身不足都能動搖節奏。
      scene_usage: >
        適合用在禪院家支線、原創女性術師壓迫線、父權審判場景。
    current_status: >
      可作新故事中禪院家保守派高層與家庭壓迫來源。
    progressions: []
    goals:
      - 維持自己在家族中的尊嚴。
      - 把子女與晚輩塑造成符合家族期待的工具。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：直毘人之弟、真希與真依之父、焦眉之赳、落花之情。

  - id: jinichi-zenin
    name: 禪院甚壱
    aliases:
      - Zenin Jinichi
      - 甚壱
    role: 禪院家高層 / 炳成員 NPC
    canon_role: 禪院家高階成員、炳成員，甚爾之兄。
    usable_as_npc: true
    age: 成人
    occupation: 咒術師 / 禪院家高層
    appearance_public: >
      黑髮、身形厚實，臉部線條粗硬，氣質像沉默的家族武力核心；
      站在會議室裡時不需多話，也能讓人感到拳頭般的壓迫。
    appearance_current: >
      可作禪院家武力派、繼承權議題中的冷靜高層或甚爾血緣線 NPC。
    personality:
      - 寡言、務實，對家族存續與政治現實有判斷。
      - 比直哉少一點外放惡意，但仍是禪院家價值體系內的人。
      - 面對大局時能壓下個人厭惡，做出有利家族的判斷。
    speech_style:
      baseline: 短句、低沉，像在衡量成本。
      under_stress: 更直接，會把情緒壓進命令。
      humor: 幾乎沒有，偶爾是冷淡反諷。
    abilities:
      - 可凝聚巨大咒力拳並配合自身拳擊攻擊。
      - 禪院家高階術師級體術與戰場判斷。
    combat_profile:
      battle_role: >
        重擊型家族高層。甚壱適合當禪院家正面火力，與速度型直哉形成對比。
      combat_style: >
        他會用沉默逼近和巨大咒力拳壓碎掩體，攻擊不像花俏術式，更像家族武力的重量。
      technique_details: >
        巨大拳頭可由咒力推進，配合自身揮拳形成多點重擊；需要記錄拳數、射程、能否轉向與維持消耗。
      range_and_positioning: >
        中距離和破壞性室內場景最佳，可用牆、柱、宅邸建築讓攻擊有重量。
      counters_and_limits: >
        高機動、視線干擾、近身貼打、術式成形前的打斷會削弱他。
      scene_usage: >
        適合寫家族會議後的武力鎮壓，或讓原創角色感受到禪院家不是只有嘴上保守。
    current_status: >
      可作禪院家武力高層與繼承權協商 NPC。
    progressions: []
    goals:
      - 維持禪院家的整體利益。
      - 在內鬥中選擇最能保住家族地位的一方。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：禪院家高階成員、炳成員、甚爾之兄、巨大咒力拳術式。

  - id: chojuro-zenin
    name: 禪院長寿郎
    aliases:
      - Zenin Chojuro
      - 長寿郎
    role: 禪院家炳成員 NPC
    canon_role: 禪院家精銳部隊炳的成員，至少具備準1級以上水準。
    usable_as_npc: true
    age: 成人
    occupation: 咒術師 / 炳成員
    appearance_public: >
      矮小年長男性，髮型像短莫霍克，常閉著眼露出固定笑容；
      表情看似滑稽，實際帶著老派家族精銳的自信與輕敵。
    appearance_current: >
      可作禪院家精銳小隊成員、拘束術式支援或家族宅邸防衛 NPC。
    personality:
      - 自信、少話，常以固定笑容表現對敵人的輕視。
      - 對家族任務服從度高，不會浪費情緒解釋動機。
      - 適合寫成「不顯眼但難纏」的老術師。
    speech_style:
      baseline: 簡短、含笑、帶老人口吻。
      under_stress: 笑意可能不變，但語句更少，行動更快。
      humor: 乾瘦、陰陰的玩笑感。
    abilities:
      - 土石或巨手拘束型術式參考。
      - 禪院家炳等級近身戰與協作能力。
    combat_profile:
      battle_role: >
        控場支援型炳成員。長寿郎適合和甚壱、蘭太等家族術師組隊，讓敵人被拘束後遭重擊。
      combat_style: >
        他會在隊友施壓時從側面發動拘束，讓地面或牆面生出巨大手掌，把目標固定在原地。
      technique_details: >
        建議設定成以地形為媒介的巨手拘束；需明確媒介材質、手掌數量、強度與能否同時攻擊。
      range_and_positioning: >
        中距離最適合，宅邸庭院、石牆、地下通路、倉庫都能讓術式有抓握媒介。
      counters_and_limits: >
        飛行、高機動、地面破壞、術式媒介不足或隊友配合被切斷會削弱他。
      scene_usage: >
        適合作家族精銳小隊的一枚齒輪，不必讓他單獨承擔大反派位置。
    current_status: >
      可作禪院宅邸防衛、炳小隊任務或家族內部鎮壓 NPC。
    progressions: []
    goals:
      - 完成炳的任務。
      - 維持禪院家精銳的威信。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：禪院家炳成員、外觀、準1級以上精銳定位。

  - id: ranta-zenin
    name: 禪院蘭太
    aliases:
      - Zenin Ranta
      - 蘭太
    role: 禪院家炳成員 NPC
    canon_role: 禪院家精銳部隊炳的年輕成員，使用視線拘束型術式。
    usable_as_npc: true
    age: 成人
    occupation: 咒術師 / 炳成員
    appearance_public: >
      身形纖細，比直哉與甚壱矮小，淺色大眼、長眉，黑髮凌亂束成低馬尾；
      穿白色和服與深色袴，整體比其他禪院男性少幾分張狂。
    appearance_current: >
      可作炳中較年輕、較恭敬但仍受家族價值束縛的 NPC。
    personality:
      - 比多數禪院族人收斂、禮貌，但對家族仍有強烈忠誠。
      - 能承認甚爾級肉體的可怕，不像部分族人只會輕視無咒力者。
      - 會為家族未來承擔高代價。
    speech_style:
      baseline: 謹慎、恭敬，稱呼前輩時有家族階序感。
      under_stress: 語速變急，但仍努力維持術式和隊形。
      humor: 很少，偏尷尬或低聲附和。
    abilities:
      - 視線拘束型術式，可用凝視展開壓制靈光並短暫限制目標動作。
      - 炳成員級咒力與協作戰術。
    combat_profile:
      battle_role: >
        高代價拘束支援。蘭太適合用來展現禪院家精銳隊伍中的輔助位置，以及術式反噬的身體代價。
      combat_style: >
        他會先保持距離，以視線鎖定目標，替甚壱或長寿郎創造重擊窗口。
        一旦目標力量過高，反噬會集中在眼部和神經壓力上。
      technique_details: >
        視線是核心媒介；需定義視線接觸時間、可鎖定人數、拘束強度、眼部反噬和失明風險。
      range_and_positioning: >
        中距離最佳，需要清楚視線；煙霧、閃光、遮蔽物和多目標混戰會干擾術式。
      counters_and_limits: >
        切斷視線、反向精神壓迫、超越拘束強度的肉體力量、長時間維持都會傷害他。
      scene_usage: >
        適合寫隊伍協作，讓原創角色理解「輔助術式也能致命」。
    current_status: >
      可作炳小隊支援、禪院家年輕精銳或家族忠誠與恐懼並存的 NPC。
    progressions: []
    goals:
      - 守住禪院家未來。
      - 得到高層承認而不被同族輕視。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：禪院家炳成員、視線拘束術式、反噬集中於眼部。

  - id: nobuaki-zenin
    name: 禪院信朗
    aliases:
      - Zenin Nobuaki
      - 信朗
    role: 躯俱留隊隊長 NPC
    canon_role: 禪院家躯俱留隊隊長，代表沒有生得術式者在家族軍事階層中的下位分支。
    usable_as_npc: true
    age: 成人
    occupation: 咒術師 / 躯俱留隊隊長
    appearance_public: >
      中年男性，深色飛機頭與鬢角醒目，服裝比一般隊員更正式淺色；
      外表講究，像把虛榮心穿成盔甲的家族小隊長。
    appearance_current: >
      可作禪院家低階武力隊長、無術式男性訓練體系代表或小型家族壓迫 NPC。
    personality:
      - 虛榮、自戀，喜歡把功勞收回自己名下。
      - 對沒有達到家族標準的人同樣輕蔑，即便自己也處在被上層評價的位置。
      - 負責隊伍行動，但會讓部下先做苦工。
    speech_style:
      baseline: 自滿、擺架子，常用隊長身份壓人。
      under_stress: 先否認對手威脅，再急著挽回面子。
      humor: 對下屬和弱者的挖苦。
    abilities:
      - 躯俱留隊武術訓練、咒具使用與集團戰指揮。
      - 無生得術式者的體術與基礎咒力運用參考。
    combat_profile:
      battle_role: >
        小隊指揮與家族雜兵上層。信朗適合帶出躯俱留隊的集體壓迫，而不是單獨當頂級戰力。
      combat_style: >
        他會命令隊員包圍、消耗，再親自出手收功；若被迫單挑，虛榮會讓他低估對手。
      technique_details: >
        不設定生得術式；以咒具、體術、隊形、家族訓練和權威壓迫作為戰鬥特色。
      range_and_positioning: >
        多人包圍、宅邸走廊、訓練場和倉庫入口最適合。
      counters_and_limits: >
        隊伍被切開、權威失效、咒具被奪、單挑高機動對手時會迅速露出不足。
      scene_usage: >
        適合當原創角色初次看見禪院家軍事化階層的入口敵人。
    current_status: >
      可作禪院家躯俱留隊指揮、家族巡邏與倉庫防衛 NPC。
    progressions: []
    goals:
      - 保住隊長面子與家族內位置。
      - 把任務功勞轉化為自己的評價。
    secrets: []
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：躯俱留隊隊長、外觀、無生得術式分支定位。

  - id: toji-fushiguro
    name: 伏黑甚爾
    aliases:
      - Toji Fushiguro
      - 禪院甚爾
      - 術師殺手
    role: 禪院家出身者 / 天與咒縛案例 / 殺手 NPC
    canon_role: 原姓禪院，因零咒力天與咒縛被家族排斥後離開，後改姓伏黑；伏黑惠之父。
    usable_as_npc: restricted
    age: 成人
    occupation: 殺手 / 前禪院家成員
    appearance_public: >
      高大結實的黑髮男性，嘴角有傷疤，眼神懶散卻像野獸在陰影裡估價獵物；
      衣著常簡單貼身，方便藏武器與快速移動。
    appearance_current: >
      受限 NPC。可作天與咒縛、零咒力、咒具殺手與禪院家排斥制度的參考；使用需避免搬用原作任務線。
    personality:
      - 冷淡、現實，對錢、委託和勝算計算清楚。
      - 對咒術界名門抱有深層厭惡與嘲弄。
      - 情感表現稀薄，但不是沒有牽掛，只是習慣切斷。
    speech_style:
      baseline: 懶散、短句、帶街頭殺手的隨意感。
      under_stress: 反而更安靜，專注於殺路與破綻。
      humor: 黑色、低聲，像順手把咒術師的自尊踩碎。
    abilities:
      - 零咒力天與咒縛，肉體能力、感官、速度、反應與抗性極端強化。
      - 咒具運用、暗殺、反咒術師戰術與結界潛入。
      - 可使用收納型咒靈攜帶大量武器。
    combat_profile:
      battle_role: >
        反咒術師殺手與禪院家陰影。甚爾適合當「咒力系統之外」的壓力，讓術師失去感知優勢。
      combat_style: >
        他會先收集情報、耗弱目標，再以零咒力隱匿穿過結界或感知網。
        戰鬥中不講術式美學，只追求最快、最髒、最有效的殺法。
      technique_details: >
        沒有術式與咒力。所有超常表現來自天與咒縛肉體、五感、咒具選擇和戰術準備。
      range_and_positioning: >
        近距離最可怕，城市屋頂、狹窄走廊、森林、廢樓和被帳包住的任務場都能發揮暗殺優勢。
      counters_and_limits: >
        沒有咒具時無法正常祓除咒靈；情報失準、武器被限制、保護目標拖累或被逼入超大範圍術式會提高風險。
      scene_usage: >
        適合做傳說級壓力或過去陰影，不建議頻繁出場搶走原創主角舞台。
    current_status: >
      可作禪院家支線的歷史陰影、天與咒縛教材、殺手委託或伏黑惠血緣背景參照。
    progressions: []
    goals:
      - 依新故事另定；通常與委託、金錢、名門羞辱或個人牽掛相關。
    secrets:
      - 若安排其與原創角色直接互動，先記錄時空與出場理由，避免牽出原作時間線。
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：原姓禪院、零咒力天與咒縛、術師殺手、伏黑惠之父。

  - id: choso
    name: 脹相
    aliases:
      - Choso
      - 咒胎九相圖一號
    role: 咒胎九相圖 / 受肉體 / 血液術式 NPC
    canon_role: 咒胎九相圖一至三號中的長兄，半人半咒靈性質，受肉後具備特級咒物出身與赤血操術。
    usable_as_npc: true
    age: 不適用
    occupation: 受肉體 / 咒術師級戰力
    appearance_public: >
      長髮深褐至黑色，分成兩束向外翹起，眼神倦怠冷淡；鼻樑橫過臉頰有血色印記，
      穿寬鬆淺色袍服與紫色背心樣式外衣，脖子圍圓形圍巾。
    appearance_current: >
      可作血液術式高手、兄長型保護者、咒胎九相圖支線 NPC；不綁定原作陣營轉折或結局。
    personality:
      - 平常沉默、冷淡，像與周圍世界隔了一層玻璃。
      - 對兄弟與被認作家人的對象有極端保護欲。
      - 不嗜殺，不天然仇視術師；他的敵意通常來自家族傷害與操弄。
    speech_style:
      baseline: 低聲、簡短、反應慢半拍，常像剛從深水裡浮上來。
      under_stress: 一旦牽涉兄弟，語氣會突然變硬，情緒從木然轉為爆烈。
      humor: 幾乎沒有，偶爾因太認真而產生反差。
    abilities:
      - 赤血操術，能操控自身血液進行射擊、切割、強化與追蹤。
      - 咒胎九相圖體質，血液消耗風險與普通人類不同。
      - 高戰術智慧，可把血液術式拆成多種近中遠距應用。
    combat_profile:
      battle_role: >
        血液戰術家與兄長型守衛。脹相適合在戰場上用冷靜計算保護家人，讓血液術式兼具暴力和情感重量。
      combat_style: >
        他會先保持距離，以穿血、血刃、血液散佈與肉體強化讀取對手節奏。
        若保護對象受傷，他的攻擊會從精密轉為不惜代價。
      technique_details: >
        可使用赤血操術系應用：穿血、超新星、赤鱗躍動、血刃與血液陷阱。
        因九相圖體質，可承受比普通血液術師更極端的失血運用，但仍需記錄消耗與恢復條件。
      range_and_positioning: >
        中距離最穩，狹窄走廊利於穿血直線壓迫；開闊地能布置血液軌跡和多點攻擊。
      counters_and_limits: >
        高熱、血液污染、乾燥環境、快速貼身壓制、保護目標被挾持都能逼他犯險。
      scene_usage: >
        適合做非人出身卻比人類更重視親情的 NPC，也能連接加茂家、咒胎九相圖與血液術式設定。
    current_status: >
      可作新故事中咒胎九相圖、加茂家黑歷史、血液術式研究或兄弟保護線 NPC。
    progressions: []
    goals:
      - 保護兄弟與被他認作家人的人。
      - 查明並切斷操弄九相圖的來源。
    secrets:
      - 若牽涉虎杖悠仁或羂索相關設定，需先在 secrets-lockbox 標明是否納入新故事。
    first_appearance: reference_only
    source_notes:
      - Wiki 交叉核對：咒胎九相圖一號、特級咒物出身、半人半咒靈、赤血操術、重視兄弟。
```

---

## bible/location.yaml

<!-- file_path: backend/novel_db/novel_06_zoshiu/bible/location.yaml -->

```yaml
locations:
  - id: tokyo-jujutsu-high
    name: 東京都立咒術高等專門學校
    type: 教育機構 / 任務據點 / 咒術設施
    region: 日本・東京近郊山區
    first_appearance: reference_only
    summary: >
      東京校是日本兩所咒術教育機構之一，負責培育術師、派遣任務、保管部分咒具與咒物，
      同時也是新故事中最穩定的任務起點與情報樞紐。
    atmosphere:
      - 山林深處的古老校地，鳥居、階梯、木造建築與現代教室並存。
      - 表面像偏僻私校，內部則是訓練、封印、醫療與任務調度混合的咒術基地。
    narrative_functions:
      - 新人術師訓練
      - 任務派遣
      - NPC 會面
      - 咒具保管
      - 術式測試
    access_constraints:
      - 校地由結界保護，普通人難以察覺真實用途。
      - 高危設施需要教師、總監部或特定權限許可。
    linked_people_or_factions:
      - 東京校學生
      - 東京校教師
      - 輔助監督
      - 咒術總監部
    continuity_notes:
      - 可作原創主角入學、受訓、接任務的主要據點；不要綁定原作事件。

  - id: mount-mushiro-foothills
    name: 筵山山麓入口
    type: 隱蔽入口 / 結界邊界
    region: 東京校外圍
    first_appearance: reference_only
    summary: >
      東京校入口位於筵山山麓一帶，深林與結界形成天然遮蔽，是普通社會與咒術校地的過渡地帶。
    atmosphere:
      - 潮濕山氣、石階青苔、鳥居朱漆與樹影壓低天光。
    narrative_functions:
      - 入學儀式
      - 追蹤與伏擊
      - 結界異常事件
    access_constraints:
      - 需通過校方結界與路徑辨識。
    linked_people_or_factions:
      - 東京咒術高專
    continuity_notes:
      - 適合寫成新角色第一次踏入咒術世界的門檻場景。

  - id: torii-stairway
    name: 鳥居階梯
    type: 校地通道 / 儀式性地標
    region: 東京校外圍至校地內部
    first_appearance: reference_only
    summary: >
      成排鳥居與長階連接山林入口和高專校地，具有強烈的邊界感與咒術儀式感。
    atmosphere:
      - 風穿過鳥居縫隙，木牌輕響，雨後石階有泥土和濕木味。
    narrative_functions:
      - 迎接新生
      - 夜間巡邏
      - 帳或結界破口
    access_constraints:
      - 受校方結界影響，路徑可被隱藏或改變。
    linked_people_or_factions:
      - 東京咒術高專
    continuity_notes:
      - 可作反覆出現的視覺錨點。

  - id: tokyo-classrooms
    name: 東京校教室群
    type: 教學空間
    region: 東京咒術高專
    first_appearance: reference_only
    summary: >
      小班制教室，用於普通課程、術式理論、任務簡報與戰後檢討。
    atmosphere:
      - 粉筆灰、舊木桌、窗外蟬聲與遠處訓練場的撞擊聲混在一起。
    narrative_functions:
      - 任務說明
      - 術式講解
      - 角色關係建立
    access_constraints:
      - 校內人員可使用，外部術師需報備。
    linked_people_or_factions:
      - 東京校學生
      - 東京校教師
    continuity_notes:
      - 適合承載規則說明，但避免讓角色長篇百科式對話。

  - id: tokyo-dormitory
    name: 東京校學生宿舍
    type: 生活區 / 休息區
    region: 東京咒術高專
    first_appearance: reference_only
    summary: >
      學生搬離原本住處後多住在校內宿舍，房間數量相對寬裕，能反映個人習慣與心理狀態。
    atmosphere:
      - 洗衣粉、泡麵湯味、木地板和訓練後汗水的氣味。
    narrative_functions:
      - 私下談話
      - 角色恢復
      - 任務前後對照
    access_constraints:
      - 學生生活區，外人不應任意進入。
    linked_people_or_factions:
      - 東京校學生
    continuity_notes:
      - 可用來建立原創學生角色的日常質感。

  - id: isolation-chamber
    name: 隔離室
    type: 拘束設施 / 高危封鎖空間
    region: 東京咒術高專
    first_appearance: reference_only
    summary: >
      牆面覆滿符札的封鎖空間，用於拘束高危人物、受詛咒者或待判定個案。
    atmosphere:
      - 紙符乾澀、冷光燈、消毒水與封閉空氣裡的霉味。
    narrative_functions:
      - 審問
      - 保護性隔離
      - 危險咒物反應
    access_constraints:
      - 需要高層或教師權限。
    linked_people_or_factions:
      - 東京咒術高專
      - 咒術總監部
    continuity_notes:
      - 適合處理新故事中的危險主角或原創詛咒案件。

  - id: tokyo-morgue
    name: 東京校停屍間
    type: 醫療後勤 / 遺體處理
    region: 東京咒術高專
    first_appearance: reference_only
    summary: >
      術師任務死亡後可能被送回此處，由校方進行確認、處置與悼念。
    atmosphere:
      - 不鏽鋼冷櫃、漂白水、乳膠手套與低溫機械聲。
    narrative_functions:
      - 任務代價呈現
      - 驗屍與咒力殘穢檢查
      - 情緒轉折
    access_constraints:
      - 醫療人員、教師或指定術師可進入。
    linked_people_or_factions:
      - 家入硝子
      - 東京咒術高專
    continuity_notes:
      - 不綁定原作死亡事件。

  - id: hidden-room
    name: 校內隱藏房間
    type: 隱蔽據點 / 非正式會議室
    region: 東京咒術高專
    first_appearance: reference_only
    summary: >
      校內存在可避開常規監視的隱藏空間，適合訓練、藏匿、密談或臨時避難。
    atmosphere:
      - 老舊榻榻米、甜點包裝紙、積灰櫃子和結界殘留的乾冷感。
    narrative_functions:
      - 秘密訓練
      - 反總監部密談
      - 保護 NPC
    access_constraints:
      - 只有知情者能找到或開啟。
    linked_people_or_factions:
      - 東京校教師
      - 東京校學生
    continuity_notes:
      - 可作原創支線的安全屋。

  - id: cursed-warehouse
    name: 忌庫
    type: 咒具咒物倉庫 / 高危保管設施
    region: 東京咒術高專至薨星宮路徑
    first_appearance: reference_only
    summary: >
      用於存放咒具與咒物的小型倉庫，因保管物危險，適合引發偷竊、封印破損或權限爭議。
    atmosphere:
      - 乾木、鐵鏽、封印紙墨、舊血與冷石地面的氣味。
    narrative_functions:
      - 咒具取得
      - 咒物失竊
      - 封印事故
    access_constraints:
      - 結界保護，需校方或高層許可。
    linked_people_or_factions:
      - 東京咒術高專
      - 咒術總監部
      - 御三家
    continuity_notes:
      - 可放置原創咒物，但需記錄等級與封印條件。

  - id: tombs-of-the-star
    name: 薨星宮
    type: 聖域 / 地下結界設施
    region: 東京咒術高專地下深處
    first_appearance: reference_only
    summary: >
      受複雜結界保護的深層空間，包含通往天元所在區域的通道、室內森林般的中間地帶與地下主廳。
    atmosphere:
      - 無葉巨木、濕土、古建築木香、深井般的空氣壓力。
    narrative_functions:
      - 高階結界設定
      - 聖地防衛
      - 作者層級秘密入口
    access_constraints:
      - 入口、門扉與內部空間受多重結界限制；未被允許者可能無法抵達真實核心。
    linked_people_or_factions:
      - 天元
      - 東京咒術高專
    continuity_notes:
      - 可作新故事深層世界觀舞台，但避免直接搬用原作事件。

  - id: kyoto-jujutsu-high
    name: 京都府立咒術高等專門學校
    type: 教育機構 / 任務據點
    region: 日本・京都
    first_appearance: reference_only
    summary: >
      京都校是東京校的姊妹校，位於被視為咒術聖地的京都，與東京校共同培育術師並承擔任務。
    atmosphere:
      - 古都濕冷、寺社木香、石板路與保守派咒術禮法並存。
    narrative_functions:
      - 姊妹校交流
      - 保守派政治
      - 關西任務
      - 角色競爭
    access_constraints:
      - 校地由天元系結界保護，外部人員需許可。
    linked_people_or_factions:
      - 京都校學生
      - 京都校教師
      - 咒術總監部
    continuity_notes:
      - 適合讓新故事呈現與東京校不同的教育風格與政治氣味。

  - id: kyoto-sacred-land
    name: 京都咒術聖地
    type: 城市 / 咒術文化核心
    region: 日本・京都
    first_appearance: reference_only
    summary: >
      京都承載古老咒術傳統、家系政治與宗教地景，是保守秩序和術師歷史感最強的城市。
    atmosphere:
      - 線香、雨水、檜木、老旅館榻榻米與觀光街甜食味互相交疊。
    narrative_functions:
      - 家族談判
      - 古老咒物調查
      - 儀式與結界研究
    access_constraints:
      - 普通城市與咒術聖地重疊，需要帳與情報管控。
    linked_people_or_factions:
      - 京都咒術高專
      - 御三家
      - 咒術總監部
    continuity_notes:
      - 可作原創古咒術、寺社詛咒與家系衝突舞台。

  - id: tokyo-city
    name: 東京
    type: 都市 / 任務區域
    region: 日本・關東
    first_appearance: reference_only
    summary: >
      大量人口、壓力、慾望與恐懼使東京成為咒靈事件高發地，可承載校園、商辦、地鐵、醫院、住宅與娛樂區任務。
    atmosphere:
      - 便利商店炸物、地鐵熱風、雨傘塑膠味、加班後的廉價酒精。
    narrative_functions:
      - 都市怪談
      - 連續失蹤
      - 大型帳事件
      - 原創咒靈誕生地
    access_constraints:
      - 普通人密度高，任務必須重視遮蔽與疏散。
    linked_people_or_factions:
      - 東京咒術高專
      - 輔助監督
    continuity_notes:
      - 新故事最靈活的現代都市舞台。

  - id: shibuya
    name: 澀谷
    type: 都市核心 / 交通商業區
    region: 東京
    first_appearance: reference_only
    summary: >
      人潮、車站、地下通道、商場與大型螢幕構成高密度都市場域，適合群眾恐懼、帳與多點任務。
    atmosphere:
      - 柏油熱氣、香水、汗味、速食油煙與雨後排水溝味。
    narrative_functions:
      - 人群遮蔽
      - 多咒靈事件
      - 地下空間追逐
    access_constraints:
      - 普通人過多，任何咒術異常都需要快速封鎖。
    linked_people_or_factions:
      - 東京咒術高專
      - 輔助監督
    continuity_notes:
      - 不使用原作同名事件；只作地理錨點。

  - id: shinjuku
    name: 新宿
    type: 都市核心 / 夜間任務區
    region: 東京
    first_appearance: reference_only
    summary: >
      辦公樓、夜生活、車站迷宮與後巷形成複雜任務場，可承載咒靈、咒詛師與情報交易。
    atmosphere:
      - 菸味、霓虹燈熱、拉麵湯頭、酒吧清潔劑與凌晨垃圾袋氣味。
    narrative_functions:
      - 情報交易
      - 咒詛師接觸
      - 高樓戰鬥
    access_constraints:
      - 夜間人流仍高，帳的覆蓋範圍需精準。
    linked_people_or_factions:
      - 自由術師
      - 輔助監督
    continuity_notes:
      - 可作都市黑市或自由術師活動點。

  - id: sendai
    name: 仙台
    type: 地方都市 / 任務區域
    region: 日本・東北
    first_appearance: reference_only
    summary: >
      東北地方城市，可用於遠離高專日常的地方詛咒、醫院、學校、舊宅與災害記憶相關故事。
    atmosphere:
      - 冷雨、牛舌炭香、車站便當、醫院消毒水與海風殘味。
    narrative_functions:
      - 外派任務
      - 地方咒靈
      - 原創角色故鄉
    access_constraints:
      - 高專支援距離較遠，任務需提前安排後勤。
    linked_people_or_factions:
      - 東京咒術高專
      - 地方輔助監督
    continuity_notes:
      - 可作與東京節奏不同的原創篇章舞台。

  - id: kawasaki
    name: 川崎
    type: 工業都市 / 任務區域
    region: 神奈川
    first_appearance: reference_only
    summary: >
      工業地帶、住宅區與通勤帶混雜，適合工廠事故、污染恐懼、勞動壓力與都市邊界感咒靈。
    atmosphere:
      - 機油、金屬粉塵、河風、便當店油煙和夜班咖啡。
    narrative_functions:
      - 工業詛咒
      - 失蹤調查
      - 工廠結界
    access_constraints:
      - 現場可能有監視器、警衛與工安限制。
    linked_people_or_factions:
      - 東京咒術高專
      - 輔助監督
    continuity_notes:
      - 適合硬質、現代、工業感的咒靈案件。

  - id: okinawa
    name: 沖繩
    type: 離島地區 / 任務區域
    region: 日本・沖繩
    first_appearance: reference_only
    summary: >
      海島文化、觀光、人潮與遠離本州高專的距離感，使沖繩適合海洋、祖靈、觀光事故與孤立任務。
    atmosphere:
      - 鹽風、防曬乳、濕熱石牆、海藻與夜市烤肉味。
    narrative_functions:
      - 離島任務
      - 海洋咒靈
      - 後援延遲
    access_constraints:
      - 交通與支援時間較長，帳的設置需考慮觀光人潮。
    linked_people_or_factions:
      - 東京咒術高專
      - 自由術師
    continuity_notes:
      - 可與陀艮類海洋恐懼設定產生主題呼應，但不需搬用原作情節。
```

---

## bible/plot-threads.yaml

<!-- file_path: backend/novel_db/novel_06_zoshiu/bible/plot-threads.yaml -->

```yaml
plot_threads: []

notes:
  - 原作主線、事件與時間線不寫入本檔。
  - 新故事的核心衝突、主角線、咒靈案件、派系線與感情線待後續建立。
  - 若新增伏筆，請標明是否為公開 canon、作者秘密或角色誤解。
```

---

## bible/relationships.yaml

<!-- file_path: backend/novel_db/novel_06_zoshiu/bible/relationships.yaml -->

```yaml
relationships:
  - id: tokyo-vs-kyoto-schools
    parties:
      - 東京咒術高專
      - 京都咒術高專
    type: 姊妹校 / 競爭 / 任務協作
    summary: >
      兩校同為術師培育支柱，但教育風格、教師立場與政治氣味不同。
      新故事可利用兩校差異製造競爭、協作或價值觀衝突。
    continuity_notes:
      - 不綁定原作交流賽事件。

  - id: jujutsu-headquarters-and-schools
    parties:
      - 咒術總監部
      - 東京咒術高專
      - 京都咒術高專
    type: 上層行政 / 任務調度 / 政治壓力
    summary: >
      總監部掌握咒術界行政、裁決與保守秩序；高專則在教育與現場任務中承受其決策壓力。
    continuity_notes:
      - 可作新故事制度壓迫與任務命令來源。

  - id: big-three-families
    parties:
      - 禪院家
      - 五條家
      - 加茂家
    type: 名門家系 / 血統政治
    summary: >
      御三家重視血統、相傳術式與家族權威，是咒術界傳統權力的核心。
    continuity_notes:
      - 原創角色若出身名門，需記錄家族位置與術式繼承規則。

  - id: disaster-curses
    parties:
      - 漏瑚
      - 花御
      - 陀艮
    type: 特級咒靈群 / 災害恐懼意象
    summary: >
      三者皆可作高智慧特級咒靈 NPC，分別承載火山大地、森林自然與海洋恐懼等主題。
    continuity_notes:
      - 真人不建 NPC，只能在咒靈群備註或世界觀中提及。

  - id: freelance-sorcerers
    parties:
      - 七海建人
      - 冥冥
      - 高專
      - 咒術總監部
    type: 自由術師 / 委託關係
    summary: >
      自由術師可接受任務、支援高專或以個人利益判斷行動，是新故事中靈活介入的成人 NPC 類型。
    continuity_notes:
      - 七海偏責任與理性，冥冥偏報酬與收益。
```

---

## bible/timeline.yaml

<!-- file_path: backend/novel_db/novel_06_zoshiu/bible/timeline.yaml -->

```yaml
timeline: []

continuity_notes:
  - 本資料庫不記錄《咒術迴戰》原作劇情時間線、章節事件、角色死亡或戰鬥流程。
  - 後續若建立全新故事，只能在此記錄原創故事自己的日期、任務順序與狀態變化。
  - 若需要引用咒術界歷史，只寫成世界觀背景，不排列成原作事件表。
```

---

## bible/worldbuilding.md

<!-- file_path: backend/novel_db/novel_06_zoshiu/bible/worldbuilding.md -->

```markdown
# Worldbuilding — 咒術世界架構

> [!IMPORTANT]
> 這份檔案只記錄可作新故事底層規則的世界觀資訊。
> 不記原作事件、不排原作時間線、不寫角色死亡或戰鬥流程。
> 具體地點請集中到 `bible/location.yaml`；作者未揭露規劃請放入 `context/secrets-lockbox.md`。

---

## 核心前提

- 人類的恐懼、憤怒、嫉妒、憎恨、悲傷等負面情緒會產生**咒力**。
- 多數普通人會無意識洩漏咒力；洩漏的咒力累積後會形成**咒靈**。
- **咒術師**能感知、控制並運用咒力，主要工作是在普通社會看不見的地方祓除咒靈。
- 咒術世界對普通社會保持隱蔽，重大任務會使用帳、結界、輔助監督與高專體系遮蔽現場。
- 日本是咒力與咒術制度高度集中的地區，高專、總監部與術師家系構成地下秩序。

## 咒力（Cursed Energy）

- 咒力來自負面情緒，但能否使用咒力取決於天賦、訓練與身體條件。
- 咒術師會訓練自己從細微情緒中提煉咒力，避免像普通人一樣無意識外洩。
- 咒力可強化肉體、保護身體、驅動術式、灌注武器、操控式神或維持結界。
- 咒力輸出、總量、精密度與效率是評估戰力的重要面向；總量高不等於控制優秀。
- 普通物理攻擊通常無法有效祓除咒靈；祓除咒靈需要咒力、咒具或其他咒術手段。

## 咒靈（Cursed Spirits）

- 咒靈是人類洩漏咒力凝聚出的靈性存在，通常不可被普通人看見或觸碰。
- 咒靈常依附誕生地、恐懼意象、疾病、自然災害、都市傳說或特定物品活動。
- 弱小咒靈多半依本能傷人；高等咒靈可能具備語言、策略、人格與組織性。
- 特級咒靈可擁有高度智慧、專屬術式、龐大咒力與生得領域。
- 咒靈被祓除後通常會消散；過強或特殊的存在也可能以封印、咒物或束縛方式處理。

## 咒術師與輔助體系

- 咒術師分為學生、在職術師、自由術師、教師、輔助監督與其他相關職能。
- 任務分派通常依等級、經驗、危險度與現場條件決定。
- 輔助監督負責帳、交通、情報、現場封鎖、普通人疏散與術師支援。
- 高專學生會接受普通課程、咒術訓練、實地任務與等級評估。
- 咒術師人數稀少，個體差異極大，教育方式常以個人特性與術式適性調整。

## 術式（Cursed Techniques）

- 術式是咒力經由特定法則輸出的技術，常與血統、天賦或個人內在性質相關。
- **生得術式**通常是個人天生具備的核心能力，後天訓練可提高精度、輸出與應用範圍。
- **非生得術式**包含帳、簡易領域、領域展延等可透過學習與技術掌握的形式。
- 術式有發動條件、代價、射程、媒介、限制與弱點；越強的能力越需要清楚規則。
- 術式可因束縛、咒具、環境、領域或協作戰術而產生額外變化。

## 反轉術式

- 反轉術式是將咒力轉化為正向能量的高難度技術。
- 常見用途是治療身體損傷，也可反制某些咒力或咒靈性質。
- 能替他人治療者更稀少，通常被視為戰略資源。
- 反轉術式消耗大，對精密控制要求高，不應被當成廉價復活或無限恢復工具。

## 領域與生得領域

- 生得領域是個體精神與術式本質的內在領土。
- **領域展開**會用結界構築出術式優勢空間，通常賦予術式必中效果。
- 領域展開消耗極大，結界精度、術式相性與使用者熟練度會決定勝負。
- 簡易領域、領域展延、結界破壞與外部干涉可作為對抗手段。
- 新故事若創造原創領域，必須定義環境、必中規則、弱點、維持代價與解除條件。

## 帳與結界

- **帳**是常用結界術，用來遮蔽普通人視線、隔離現場或限制特定對象出入。
- 結界可依條件設計：阻擋普通人、困住咒靈、限制術師、隱藏設施、保護聖地。
- 結界條件越複雜，越需要設計術式公式、媒介、施術者或維持代價。
- 高專、忌庫、薨星宮與重要咒術設施常以多層結界保護。

## 束縛

- 束縛是以限制換取效果的咒術規則，可作用於自己、他人或雙方約定。
- 對自身的束縛可提高輸出、精度或觸發特殊條件；違背與他人的束縛通常會付出嚴重代價。
- 束縛適合用於原創術式平衡：限制越清楚，能力越能成立。
- 不建議使用模糊束縛當作萬能解釋；必須記錄條件、收益、違約代價。

## 咒具、咒物、咒骸與式神

- **咒具**是灌注咒力或帶有術式效果的武器、器具與裝備，可讓非典型術師補足戰鬥手段。
- **咒物**是含有咒力、詛咒或封印的物件，危險度可從低級到特級不等。
- **咒骸**是被咒力驅動的人造或改造載體，可用於訓練、戰鬥、偵查或防衛。
- **式神**是術師以術式或媒介召喚、役使的靈性存在，通常需要召喚條件與維持咒力。

## 天與咒縛

- 天與咒縛是出生時即存在的身體或咒力限制，會以犧牲某些能力換取異常強化。
- 可能表現為咒力低下但肉體極端強化，或肉體受限但術式範圍、咒力輸出異常擴張。
- 這類角色的限制必須是長期、具體且不可輕易解除，否則會削弱設定重量。

## 等級制度

- 術師與咒靈常以 4 級、3 級、2 級、準 1 級、1 級、特級等級評估。
- 等級代表任務危險度與處理能力，不完全等於單挑勝負。
- 特級表示常規尺度難以衡量，通常牽涉國家級、災害級或制度外威脅。
- 學生可擁有術師等級；晉級需要任務成果、推薦與組織評估。

## 組織與社會結構

- **咒術總監部**是咒術界的上層行政與裁決組織，傾向保守、階級化與秩序維持。
- **東京咒術高專**與**京都咒術高專**是培育術師的兩大教育機構，也承擔任務派遣與咒術資源管理。
- **御三家**是咒術界傳統名門，包含禪院家、五條家、加茂家，重視血統、相傳術式與家族權力。
- 自由術師可脫離學校日常運作接案，但仍受咒術界規則、等級與利益網牽動。

## 新故事使用規則

- 可以創造原創術師、咒靈、詛咒事件、任務地點、術式與派系。
- 不使用原作事件作為主線推進，不要求原作角色照原作命運行動。
- 原作 NPC 的能力與口吻可作參考，但避免讓他們搶走新故事主角位置。
- 每個原創術式需明確記錄：核心概念、發動媒介、限制、代價、可反制方式。
```

---

## chapters/ch001.md

<!-- file_path: backend/novel_db/novel_06_zoshiu/chapters/ch001.md -->

```markdown

```

---

## scripts/consistency-check.md

<!-- file_path: backend/novel_db/novel_06_zoshiu/scripts/consistency-check.md -->

```markdown
﻿# 一致性檢查 (Consistency Check) Prompt

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

<!-- file_path: backend/novel_db/novel_06_zoshiu/scripts/update-bible.md -->

```markdown
﻿# 更新 Bible 指引

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
