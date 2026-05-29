# Tower — 塔防佔點策略遊戲｜設計總覽

## 願景

一款**回合制、數值化的佔點 / 塔防策略遊戲**。異世界劍與魔法：只有女性、天賦強大的
**人類**（玩家），對抗數量龐大、棲於複雜巢穴的**魔物**（AI）。雙方在一張**種子碼程序生成
的網狀據點地圖**上爭奪據點——人類少而堅、魔物多而脆，是一場質與量的非對稱戰爭。

> 本遊戲為獨立專案，與 `novel_db` / opera 無關，不讀寫小說資料。

## 核心迴圈：每輪一個月、四階段同時行動

每一輪 = 一個月，依序四階段，**雙方同時提交、系統收齊後結算**（細節見 [06](06-turn-and-phases.md)）：

1. **內政** `DOMESTIC` — 資源分配 / 科技研發 / 產生兵力 / 建築。雙方提交後系統蒐集資料再進下一階段。
2. **情報** `INTELLIGENCE` — 各自探查對方部分行動；情報可能模糊或錯誤，依科技而異（[08](08-intelligence-and-fog.md)）。
3. **軍事** `MILITARY` — 部屬兵力；雙方都部屬完成後才進下一階段。
4. **戰鬥結算** `COMBAT` — 依雙方部屬演算過程與結果，判定勝負 / 更新地圖 / 處理突發事件。

→ 結算後檢查全域勝負，否則進入下一個月。

## 勝負

- 人類勝：佔領魔物**主巢**或殲滅全部巢穴。人類敗：**王城**被佔。魔物方反之。

## 技術棧（推薦）

- **模擬引擎：Python 3.14 + Pydantic v2** — 數值 / 規則模擬與 AI 盤面評估清晰；Pydantic 模型
  同時是「資料模型 schema」與未來引擎型別基礎。
- **確定性**：單一 `GameState.master_seed`，以 `derive_seed()` 衍生地圖生成 / 每場戰鬥 /
  每次情報 / 每個突發事件的獨立子 seed，全局可重現。
- **設定資料：YAML**（`../data/*.yaml`）— 魔物 / 科技 / 單位 / 加成皆資料化，新增內容不必改程式。
- **未來介面（本階段不做）**：React + Vite + TypeScript，圖形化渲染網狀地圖與戰報，只消費引擎 JSON。

## 檔案地圖

```
Tower/
├─ design/                     設計文件（本資料夾）
│  ├─ 00-overview.md           ← 你在這
│  ├─ 01-world-and-factions.md 世界觀、非對稱雙方、魔物圖鑑、菁英單位、勝負
│  ├─ 02-map-generation.md     網狀圖模型、種子碼生成、據點類型、加成
│  ├─ 03-economy-and-resources.md 人類戰鬥資源 / 魔物奴隸·魔物源、佔領獎勵
│  ├─ 04-units-and-combat.md   單位數值、確定性戰鬥公式、工事 / 地形倍率
│  ├─ 05-tech-and-evolution.md 人類科技樹、魔物進化
│  ├─ 06-turn-and-phases.md    四階段同時行動制的提交 / 結算流程
│  ├─ 07-ai-opponent.md        魔物 AI 各階段決策框架
│  └─ 08-intelligence-and-fog.md 戰爭迷霧、情報清晰度 / 加噪 / 誤導
├─ schema/
│  └─ models.py                Pydantic 資料模型（唯一真理來源）
└─ data/
   ├─ monsters.yaml            魔物物種圖鑑
   ├─ tech_tree.yaml           科技 / 進化節點
   ├─ node_bonuses.yaml        據點類型 → 加成組合
   ├─ units.yaml               人類單位範本
   └─ elites.yaml              雙方菁英單位（英雄 / 首領）範本
```

## 本階段範圍

只交付**設計文件 + 資料模型 + 範例資料**。不實作回合引擎 / 戰鬥 / 地圖生成 / AI 程式，
不做 UI。所有公式只到「骨架與形狀」，平衡用的具體係數待後續階段。

---

## 一個月四階段走查範例（文字版）

用以驗證四階段流程、同時行動結算、迷霧情報、戰鬥規則彼此自洽。
假設 `master_seed="demo"`，已生成一張小地圖，時值 `month=3`。

**起始局面**（節錄）：
- 人類：王城 `cap`（工事 2.5，駐軍 80 戰力）、城市 `cityA`（工事 1.5，駐軍 30）。`cityA` 與魔物部落 `tribeX` 鄰接。
- 魔物：主巢 `nest`、副巢 `subA`、部落 `tribeX`（工事 1.0，駐軍 50，鄰接 `cityA`）。魔物 AI 想吃下 `cityA` 拿奴隸。

**① 內政階段**
- 人類提交 `DomesticOrder`：`RESEARCH` 偵察科技「斥候網」（+0.2 clarity）、`RECRUIT` 2 隊精兵到 `cityA`。
- 魔物提交：`ALLOCATE` 把上月奴隸轉成兵力、`RECRUIT` 大批哥布林到 `tribeX`。
- 收齊後結算：人類 `intel_clarity_bonus` +0.2、`cityA` 駐軍 30→55；`tribeX` 駐軍 50→90。

**② 情報階段**
- 人類探查 `tribeX`：`intel_seed=derive_seed("demo","intel","human","tribeX",3)`。clarity 因新科技升到 0.7。
  → `is_accurate=True`，但仍加噪：真值 90 → `observed_garrison_range=(78, 102)`。玩家「大致」知道 tribeX 變強了。
- 魔物探查 `cityA`：clarity 僅 0.3 → 擲值命中誤導，`is_accurate=False`，低報為 `(20, 35)`。
  **AI 誤以為 cityA 仍虛弱**——這個錯誤稍後會害到它。

**③ 軍事階段**
- 人類（已知 tribeX 變強）保守部署：`cityA` 留守 `DEFEND`，另從王城 `REINFORCE` 1 隊精兵到 `cityA`。
- 魔物（誤信情報）大膽部署：`tribeX` 的哥布林沿邊 `ATTACK` → `cityA`。
- 雙方都提交後進入結算。

**④ 戰鬥結算**
- `cityA` 結算，`combat_seed=derive_seed("demo","combat","cityA",3)`：
  - `attacker_power`（魔物哥布林）≈ 70。
  - `defender_power` = 守軍(精兵約 75) × fortification 1.5 × terrain_defense 1.0 ≈ 112，再受 roll_modifier 微調。
  - `power_ratio = 70 / 112 ≈ 0.63` → `outcome=repelled`：魔物被擊退、重傷，`cityA` 仍屬人類。
- 突發事件擲值 `derive_seed("demo","event",3,...)`：觸發 `reinforcement`，魔物主巢獲少量補員（緩衝損失）。
- 寫入 `combat_log` / `event_log`；王城與主巢都未易主 → `winner=None`，`month` → 4，進入下一個月。

**驗證重點**：偵察投資讓人類看清真值、魔物的低 clarity 導致誤判並付出代價、工事 / 地形倍率
讓守方以寡擊眾、所有亂數都來自 `derive_seed` 可重現——四個系統如設計般串起來。
