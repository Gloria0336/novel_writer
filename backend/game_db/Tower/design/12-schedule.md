# 12 — 開發期程表（混合制 Tower）

> 本文件把 [00](00-overview.md)–[11](11-construction-and-terraform.md) 的設計整理成**可執行的分階段期程**。
> 每階段標明：目標、前置依賴、具體交付物、驗收標準、注意事項、本階段不做。
> 階段刻意切細，**每個階段結束時專案都應可建置 / 可測試**，不破壞連續性。

---

## A. 如何使用本文件（給任何接手者，含未來的我 / 其他 AI）

1. **先讀這 4 份建立全局認知**：[00-overview](00-overview.md)（願景與核心迴圈）、
   [09-hybrid-redesign-plan](09-hybrid-redesign-plan.md)（為何改混合制、四項決策）、本文件、
   再依當前階段讀對應細節文件。
2. **唯一真理來源**：`schema/models.py`（Pydantic v2 資料模型）。任何規則 / 欄位以它為準；
   設計文件描述意圖，models.py 描述形狀。改規則先改 models.py。
3. **判斷「現在做到哪」**：看 §D 進度勾稽表 + git log + `schema/models.py` 已存在哪些模型。
   每個階段交付物清單即「驗收清單」。
4. **動工順序鐵律**：**型別先行 → 資料 / 演算法 → 前端**。先讓 models.py 與 data/*.yaml 對齊、
   能載入驗證，再寫引擎邏輯，最後接前端。
5. 不確定時，**寧可拆更細**也不要一次跨多個階段，以保持每步可建置可回滾。

---

## B. 全域約束與注意事項（每階段都適用）

- **與 novel_db / opera 完全無關**：本專案不讀寫小說資料庫，不引用 opera。
- **技術棧**：戰略引擎 Python **3.14** + **Pydantic v2**；前端 **React + Vite + TypeScript**
  （現有 `frontend/`）。戰術引擎為 Python 固定步長模擬（同 3.14）。
- **四項已定案決策**（見 [09 §9](09-hybrid-redesign-plan.md)，不可擅自更動）：
  1. 地塊 = **Hex 六角格**（axial `q,r`）。
  2. 戰術操控 = **陣型半自動**（unit-group 指令，非逐單位微操）。
  3. **保留確定性 / 可重播**（固定步長 + seeded RNG + 指令序列）。
  4. **無整體公式備援**；所有戰鬥走即時引擎，AUTO_RESOLVE = AI 在同引擎下令。
- **確定性鐵律**（影響所有亂數）：所有隨機皆由 `derive_seed(master_seed, ...)` 衍生子 seed；
  **禁用**系統時間 / 未播種亂數 / 不確定的浮點累加順序。每階段涉及亂數時，加一個
  「相同 seed → 相同輸出」的 golden test。
- **資料 / 規則解耦**：魔物 / 科技 / 單位 / 加成 / 建造範本放 `data/*.yaml`；新增內容不改 schema。
- **版本控制**：每階段（或子任務）一個 commit；commit message 標明階段編號（如 `P1.3:`）。
  分支作業，勿直接在大改動中混入無關變更。
- **每階段「完成判定」未過，不進下一階段**。占位 / scaffold 必須在註解標 `TODO(Px.y)` 指向何時移除。

---

## C. 階段總覽（對應 [09 §8](09-hybrid-redesign-plan.md) 的 M1–M6，再細分）

| 里程碑 | 階段 | 標題 | 一句話 |
|--------|------|------|--------|
| M1 連續地圖地基 | P1.1 | 幾何與地塊模型 | Hex 座標 + Tile + 列舉 |
| | P1.2 | 結構物模型 | Structure 取代 MapNode |
| | P1.3 | GameState 重構 | 換掉 nodes/edges，保留經濟/科技/單位/菁英 |
| | P1.4 | 地塊地圖生成器 | seeded hex 地形 + 結構 + 道路/橋 |
| | P1.5 | 資料層對齊 | data/*.yaml 改新 schema + 載入驗證 |
| | P1.6 | 前端 hex 渲染 | 重寫 frontend/src/map |
| | P1.7 | 戰鬥占位 + 端到端 smoke | 直接判存活，跑通一個月 |
| M2 軍團與移動 | P2.1 | 軍團與尋路 | Army + 移動點 + 地塊成本 + hex 尋路 |
| | P2.2 | 軍事階段結算 | ArmyMove 提交與移動結算 |
| | P2.3 | 接戰判定 | 找出接戰點 |
| | P2.4 | 前端軍團 UI | 選軍團、下移動、顯示路徑/成本 |
| M3 建造與地形 | P3.1 | 建造模型 | ConstructionProject + 動作型別擴充 |
| | P3.2 | 佇列機制 | 扣資源入佇列 + 每月完工 |
| | P3.3 | 各動作套用 | BUILD/ROAD/BRIDGE/FORTIFY/TERRAFORM 改寫地塊 |
| | P3.4 | 科技門檻 | engineering 解鎖建造動作 |
| | P3.5 | 前端建造 UI | 選地塊 → 建造 → 佇列進度 |
| M4 戰術即時戰鬥 | P4.1 | 戰術模型 | TacticalBattle/Unit/Group/Command/Result/Replay |
| | P4.2 | 戰場切割 | 從連續地圖切 BattleMap |
| | P4.3 | 戰略→戰術展開 | UnitStack→TacticalUnit + 數值套用 |
| | P4.4 | 模擬迴圈核心 | 固定步長 + 移動/索敵/傷害 + 確定性 |
| | P4.5 | 士氣/特性/菁英 | 潰逃、horde/split、abilities 範圍效果 |
| | P4.6 | 戰術 AI（AUTO） | 取代占位，AI 在同引擎下群指令 |
| | P4.7 | 結果回填 + 回放 | BattleResult 折回戰略層 + BattleReplay |
| | P4.8 | 前端戰場 | 戰場渲染 + INTERACTIVE 群指令操控 |
| M5 戰場吃建設 | P5.1 | 戰場承接地物 | wall/moat/bridge/terraform 進 BattleMap |
| | P5.2 | 戰術規則套用 | 工事/瓶頸/地形修正在戰鬥中生效 |
| | P5.3 | 迴圈驗證 | 建設→改戰場→戰術 端到端驗證 |
| M6 AI 與流派深化 | P6.1 | 戰術 AI 深化 | 行為樹/utility 多行為 |
| | P6.2 | 互斥流派 | excludes 分支 + engineering 流派 |
| | P6.3 | 平衡係數 | 填數值、壓測規模上限 |
| | P6.4 | 戰報/回放呈現 | 前端重播與戰報 |

---

# 里程碑 M1：連續地圖地基

> 出口狀態：網狀圖完全被連續 hex 地塊地圖取代，能生成 / 載入 / 渲染地圖，並用占位戰鬥跑通一個月。

## P1.1 幾何與地塊模型
- **目標**：建立 hex 幾何與地塊的資料形狀。
- **前置**：無（起點）。
- **交付物**（`schema/models.py` + 新 `schema/hexgeo.py`）：
  - `HexCoord`（axial `q,r`）；工具函式：`hex_neighbors`、`hex_distance`、`hex_line`、`axial↔pixel`。
  - 列舉：`TerrainType`（plain/forest/swamp/desert/mountain/water）、
    `TileFeature`（road/bridge/secret_path/wall/moat/mine/ruin/ford）。
  - `Tile`：`coord, terrain_type, elevation, features[], passable, movement_cost, owner, structure_id?, bonuses[]`。
  - `TileMap`：`width, height, tiles[], master_seed`；存取器 `tile_at(coord)`、`neighbors(coord)`。
- **驗收**：pytest 通過 hexgeo 單元測試（鄰接 / 距離 / 座標轉換對稱性）；`Tile`/`TileMap` 可建構並 `model_validate`。
- **注意事項**：座標系一律 axial `(q,r)`，文件 / 程式 / 前端三處統一，避免 offset/cube 混用。
- **本階段不做**：地圖生成、結構、前端。

## P1.2 結構物模型
- **目標**：以 `Structure` 取代舊 `MapNode`。
- **前置**：P1.1。
- **交付物**：
  - `StructureType`（capital/city/main_nest/sub_nest/tribe + 玩家自建 tower/barracks/outpost…）。
  - `Structure`：`id, name, structure_type, owner, footprint[HexCoord], control_radius,
    fortification, garrison(list[UnitStack]), bonuses[], parent_nest_id?, tags`。
  - `NodeBonus` / `BonusType` 套用對象改為「對 Tile 或 Structure 生效」（型別微調，保留鍵）。
  - 控制範圍工具：`controlled_tiles(structure)` = footprint + `control_radius` 內地塊。
- **驗收**：能建構王城 / 城市 / 巢 / 部落各一；`controlled_tiles` 正確；舊 `MapNode` / `NodeType` 刪除後無引用殘留。
- **注意事項**：`garrison` 沿用 `UnitStack`（不改單位模型）。`fortification` 語義不變（戰場工事倍率）。
- **本階段不做**：軍團、建造、戰鬥。

## P1.3 GameState 重構
- **目標**：把 `GameState` 從 nodes/edges 改為 tile_map/structures/armies/construction，保留其餘子系統。
- **前置**：P1.2。
- **交付物**：
  - `GameState`：以 `tile_map: TileMap`、`structures: dict[str, Structure]`、`armies: dict[str, Army]`（先空殼，
    Army 真正在 P2.1 補欄位）、`construction: list[ConstructionProject]`（先空殼，P3.1 補）取代 `nodes`/`edges`。
  - **保留不動**：`ResourcePool/ResourceKind`、`Faction`、`TechNode` 體系、`UnitTemplate/UnitStack`、
    `EliteTemplate/EliteInstance`、`IntelReport`、`derive_seed`、`TurnState/TurnPhase`、`RandomEvent`。
  - 移除 / 降級：`Edge`、`PathType`（→ `TileFeature`）、`GameState.neighbors()`（→ 地塊鄰接）。
  - `Deployment/TroopMovement` 暫時保留但標 `TODO(P2.2)`：from/to 之後改 coord/Army。
- **驗收**：`GameState.model_validate` 可載入一個最小盤面；全專案 `grep MapNode|NodeType|Edge` 僅剩遷移註解；
  既有單元測試（若有）更新後通過。
- **注意事項**：這是一次「破壞性 schema 遷移」——務必同一 commit 內把 models.py、data 載入碼、測試一起改到綠。
  Army/Construction 先放空殼以維持可建置，欄位待後續階段補（標 TODO）。
- **本階段不做**：補全 Army/Construction 行為。

## P1.4 地塊地圖生成器
- **目標**：實作 [02](02-map-generation.md) 的地塊級 seeded 生成。
- **前置**：P1.3。
- **交付物**（新 `engine/mapgen.py`）：
  - `generate_map(config: MapGenConfig) -> TileMap`，步驟 1–9（見 [02](02-map-generation.md)）：
    地形 noise/Voronoi → 勢力切分 → 放主結構 → 放副結構 → 散資源地塊 → 初始 road → 初始 bridge/secret_path
    → 指派加成 → 初始駐軍/工事。全程 `derive_seed`。
  - `MapGenConfig`（seed, width, height, human_cities, neutral 等；含 `elite_roster_size`）。
- **驗收**：同一 seed 兩次生成 byte-完全相同（golden test）；地圖連通（任兩己方結構間存在有限成本路徑）；
  王城/主巢各 1、城市/巢/部落數量符合 config。
- **注意事項**：連通性檢查要考慮 water 需 bridge；生成時保證至少有可通行路線，否則重採樣。
- **本階段不做**：前端渲染、移動結算。

## P1.5 資料層對齊
- **目標**：`data/*.yaml` 與新 schema 對齊、能載入驗證。
- **前置**：P1.3。
- **交付物**：
  - `node_bonuses.yaml` 改為對 Tile/Structure 生效的鍵；`units.yaml` 補 `range`/`move_speed`（預設值）；
    `monsters.yaml`/`elites.yaml`/`tech_tree.yaml` 視欄位調整（多半不變）。
  - `engine/catalog.py`（或既有載入碼）：載入並 `model_validate` 全部 YAML，失敗即報錯。
- **驗收**：載入全部 YAML 無驗證錯誤；缺欄位 / 型別錯誤有清楚訊息。
- **注意事項**：**data 內容由作者掌握**——調整 schema 時若需改 YAML，先確認不丟失既有設計內容；
  新增欄位給安全預設值，避免破壞作者既有資料。
- **本階段不做**：新增大量平衡數值（留 M6）。

## P1.6 前端 hex 渲染
- **目標**：重寫 `frontend/src/map` 為 hex 地塊渲染。
- **前置**：P1.4（能產出 TileMap JSON）。
- **交付物**：
  - 重寫 `generator.ts`/`cartography.ts`/`routing.ts` 或改為**消費引擎 JSON**（建議：前端不再自行生成，
    改吃 Python 引擎輸出的 TileMap，減少雙實作不一致）。
  - hex 渲染：地形上色、結構圖示、道路/橋/feature、控制範圍、迷霧占位。
  - 更新 `MapView.tsx`/`MapCanvas.tsx`/相關 spec 與 e2e smoke。
- **驗收**：`npm run build` 通過；`vitest`/`playwright` smoke 綠；畫面正確渲染一張生成地圖。
- **注意事項**：決定「前端是否還自行生成地圖」——建議**改為消費引擎 JSON**，避免 TS/Python 兩套生成邏輯漂移。
  若暫時保留 TS 生成，必須與 Python 同 seed 同輸出（成本高，不推薦）。
- **本階段不做**：軍團 / 建造 / 戰場 UI。

## P1.7 戰鬥占位 + 端到端 smoke
- **目標**：用最簡占位戰鬥跑通「一個月四階段」，建立端到端骨架。
- **前置**：P1.3–P1.6。
- **交付物**（`engine/turn.py`）：
  - 四階段提交/結算骨架（[06](06-turn-and-phases.md) 的 for-loop），COMBAT 用 **dev-scaffold**：
    比雙方 `stack_power` 直接判存活（**僅占位，標 `TODO(P4.6)` 將被即時引擎取代**）。
  - 能從生成地圖跑完 month 3→4 並輸出 GameState JSON。
- **驗收**：一場 demo（固定 seed）可重現跑完一個月、輸出穩定 JSON；勝負檢查可觸發。
- **注意事項**：占位戰鬥**不是**保留的公式備援（決策 4）——它只是 scaffold，M4 必整段替換。註解寫清楚。
- **本階段不做**：真正戰鬥、軍團移動（先用簡化部署占位）。

---

# 里程碑 M2：軍團與戰略移動

> 出口狀態：軍事階段改用軍團在連續地圖移動，能正確判定接戰點。

## P2.1 軍團與尋路
- **目標**：`Army` 模型 + 移動點 + 地塊成本 + hex 尋路。
- **前置**：M1。
- **交付物**：
  - `Army` 補全：`id, owner, position(HexCoord), movement_points, units[UnitStack], elite_ids[]`。
  - `engine/movement.py`：`tile_cost(tile, faction)`（[02](02-map-generation.md) 公式）、A*/Dijkstra hex 尋路、
    `reachable(army)`（移動點內可達地塊集）。
- **驗收**：尋路在 road/水/無橋/密道各情境成本正確；`reachable` 與手算一致；確定性（無亂數或已播種）。
- **注意事項**：water 無 bridge → 不可達或極高成本；密道對魔族/人類成本不同。movement_points 每月重置規則寫清楚。
- **本階段不做**：接戰、戰鬥。

## P2.2 軍事階段結算
- **目標**：MILITARY 階段以 `ArmyMove` 提交與結算移動。
- **前置**：P2.1。
- **交付物**：
  - `ArmyMove`：`army_id, path[HexCoord] 或 dest, intent(ATTACK/REINFORCE/DEFEND/HOLD), elite_ids[]`。
  - `Deployment` 改用 `ArmyMove`；移除 TroopMovement 的「只能沿邊」validator，改移動點/可達性檢查。
  - 結算：扣移動點、更新 `Army.position`、合流 / 進駐結構。
- **驗收**：非法移動（超移動點 / 不可達 / 跨陣營進駐）被拒；合法移動正確更新位置與駐軍。
- **注意事項**：同時行動制——雙方移動收齊後一次結算；移動衝突（兩軍搶同地塊）規則要定義（→ 接戰）。
- **本階段不做**：接戰判定細節（P2.3）。

## P2.3 接戰判定
- **目標**：移動後找出所有接戰點。
- **前置**：P2.2。
- **交付物**：`engine/engagement.py`：`find_engagements(state) -> list[Engagement]`，
  條件 = 敵對軍團同地塊 / 控制範圍重疊 / `intent=ATTACK` 指向敵結構或敵軍團。每個 `Engagement` 記攻守雙方參戰部隊與地點。
- **驗收**：多種佈局下接戰點數量 / 歸屬正確；無重複 / 無遺漏。
- **注意事項**：一個地點可能多方捲入——定義合流規則；接戰點將餵給 COMBAT（M4 前先餵占位戰鬥）。
- **本階段不做**：即時戰鬥。

## P2.4 前端軍團 UI
- **目標**：選軍團、下移動、顯示路徑與成本。
- **前置**：P2.1–P2.3 引擎 JSON。
- **交付物**：軍團圖示與選取、移動範圍高亮、路徑預覽與成本、意圖設定 UI。
- **驗收**：`npm run build` + smoke 綠；可在畫面下達一次合法軍團移動並送出。
- **注意事項**：UI 只送意圖給引擎，結算仍在 Python。
- **本階段不做**：戰場操控。

---

# 里程碑 M3：建造與地形改造

> 出口狀態：可在內政階段下建造 / 鋪路 / 造橋 / 設防 / 改地形，跨月完工並改寫地圖。

## P3.1 建造模型
- **目標**：`ConstructionProject` + `DomesticActionType` 擴充。
- **前置**：M1（M2 不強制，但建議先有移動以驗證道路效果）。
- **交付物**：
  - `DomesticActionType` 增 `BUILD_ROAD/BUILD_BRIDGE/FORTIFY/TERRAFORM`（`BUILD` 既有，擴 payload）。
  - `ConstructionProject`：`id, owner, kind, target_tiles[], cost, turns_remaining, status`。
  - `GameState.construction` 補全。
- **驗收**：各動作 payload 可建構驗證；非法 payload 被拒。
- **注意事項**：payload schema 要能表達 [11](11-construction-and-terraform.md) 表格全部動作。
- **本階段不做**：套用邏輯（P3.2/3.3）。

## P3.2 佇列機制
- **目標**：內政結算扣資源入佇列 + 每月完工。
- **前置**：P3.1。
- **交付物**：內政結算中：檢查資源足 → 扣 cost → 入佇列（`turns_remaining = base/(1+build_speed)`）；
  月末 RESOLVE：`turns_remaining -= 1`，歸零呼叫 `apply(proj)`。
- **驗收**：跨月工期正確遞減 / 完工；資源不足被拒；走查範例（[00](00-overview.md)）的「未完工牆」行為可重現。
- **注意事項**：施工地塊被佔領 → 取消/凍結規則（[11 §2](11-construction-and-terraform.md)）此階段定義並實作。
- **本階段不做**：`apply` 的地塊改寫細節（P3.3）。

## P3.3 各動作套用
- **目標**：完工時改寫地塊 / 結構。
- **前置**：P3.2。
- **交付物**：`engine/construction.py`：`apply(proj)` 對五種 kind 分別改 Tile.features / terrain_type /
  elevation / 新增 Structure / 提升 fortification。
- **驗收**：完工後地圖狀態正確（road 降成本、bridge 通水路、wall/moat 提工事、terraform 改地形）；
  移動成本（P2.1）隨之改變。
- **注意事項**：改寫後需同步刷新受影響地塊的 `movement_cost` 與加成快取（若有）。
- **本階段不做**：戰場呈現（M5）。

## P3.4 科技門檻
- **目標**：`engineering` 科技解鎖建造動作。
- **前置**：P3.1–P3.3。
- **交付物**：`tech_tree.yaml` 加 `engineering` 類節點與 `unlock_build_<kind>` / `build_speed` / `siege_mult`；
  內政提交時檢查解鎖。
- **驗收**：未解鎖時對應動作被拒；解鎖後可用；`build_speed` 影響工期。
- **注意事項**：與 [05](05-tech-and-evolution.md) 一致；互斥分支留 P6.2。
- **本階段不做**：流派互斥。

## P3.5 前端建造 UI
- **目標**：選地塊 → 建造 → 顯示佇列進度。
- **前置**：P3.1–P3.4。
- **交付物**：地塊選取、建造選單（受科技解鎖過濾）、佇列進度顯示、預估完工月。
- **驗收**：build + smoke 綠；可下一次建造並看到佇列。
- **本階段不做**：戰場。

---

# 里程碑 M4：戰術即時戰鬥（核心）

> 出口狀態：接戰進入固定步長即時戰術引擎，玩家陣型半自動微操或 AI 自動，結果回填戰略層；占位戰鬥被移除。
> 規格全文見 [10-tactical-combat](10-tactical-combat.md)。

## P4.1 戰術模型
- **目標**：戰術層資料形狀。
- **前置**：M1（建議 M2 完成以有真實接戰輸入）。
- **交付物**：`TacticalBattle, BattleMap, TacticalUnit, UnitGroup, BattleCommand(SET_FORMATION/MOVE_TO/
  ATTACK/USE_ABILITY/HOLD/RETREAT), BattleEvent, BattleResult, BattleReplay, ResolveMode(INTERACTIVE/AUTO_RESOLVE)`。
- **驗收**：可建構一場空戰鬥；指令型別可序列化（為了 replay）。
- **注意事項**：`BattleReplay` 必須足以重現整場（battle_seed + 指令序列）。
- **本階段不做**：邏輯。

## P4.2 戰場切割
- **目標**：從連續地圖切 `BattleMap`。
- **前置**：P4.1。
- **交付物**：`engine/battle/map_slice.py`：依接戰地點 + 進攻方向切子網格，承接 terrain/elevation/features。
- **驗收**：切出的戰場含正確地形與地物；攻守佈署區依方向正確。
- **注意事項**：此階段先承接地形與 road/water；wall/moat/bridge 的戰術效果留 M5（但欄位先帶上）。
- **本階段不做**：工事戰術效果。

## P4.3 戰略→戰術展開
- **目標**：UnitStack/菁英 → TacticalUnit，套用數值。
- **前置**：P4.1。
- **交付物**：展開器：`UnitStack(count=N)` → group of TacticalUnit（含 `max_battle_units` 縮放），
  套科技 / 特性 / 菁英光環（[04](04-units-and-combat.md) 公式）。
- **驗收**：展開後單位數值符合公式；縮放比例正確、可逆（折回時不丟失）。
- **注意事項**：縮放 `max_battle_units` 先設保守值，M6 壓測再定。
- **本階段不做**：模擬。

## P4.4 模擬迴圈核心
- **目標**：固定步長 + 移動/索敵/傷害 + 確定性。
- **前置**：P4.2、P4.3。
- **交付物**：`engine/battle/sim.py`：tick 迴圈（[10 §4](10-tactical-combat.md)）：apply_commands → 移動(hex 尋路+陣型)
  → 索敵 → 傷害(battle_seed 衍生命中/暴擊) → 記錄 BattleEvent → check_end。
- **驗收**：**確定性 golden test**：同 battle_seed + 同指令序列 → 完全相同 BattleEvent 序列與結果。
- **注意事項**：固定 dt；嚴禁系統時間 / 未播種亂數；約定運算順序避免浮點不確定。這是全專案最關鍵的確定性測試點。
- **本階段不做**：士氣 / 特性 / abilities（P4.5）。

## P4.5 士氣 / 特性 / 菁英
- **目標**：補上潰逃、特性、菁英能力。
- **前置**：P4.4。
- **交付物**：morale（傷亡比 / 失菁英 / 被包夾 → flee）；特性 horde/split/amphibious/regen；
  菁英 abilities 範圍效果（fear/bless/aoe_spell）。
- **驗收**：各特性 / 能力在受控場景產生預期效果；確定性仍成立。
- **注意事項**：所有觸發機率走 battle_seed。
- **本階段不做**：AI 行為深化（P6.1）。

## P4.6 戰術 AI（AUTO_RESOLVE）
- **目標**：用 AI 下群指令取代占位戰鬥。
- **前置**：P4.4、P4.5。
- **交付物**：`engine/battle/ai.py`：基礎戰術 AI（集火最脆、護菁英、守瓶頸、潰逃保存）下 `BattleCommand`；
  **移除 P1.7 的 dev-scaffold**，COMBAT 改呼叫真實 sim（AI vs AI 或玩家 vs AI）。
- **驗收**：整月 demo 改走即時引擎且可重現；占位戰鬥碼已刪除（grep 無 `TODO(P4.6)`）。
- **注意事項**：此階段 AI 求「能打完且合理」即可，深化留 P6.1。
- **本階段不做**：前端戰場、AI 進階。

## P4.7 結果回填 + 回放
- **目標**：BattleResult 折回戰略層 + 存 BattleReplay。
- **前置**：P4.6。
- **交付物**：存活折回 UnitStack.count、菁英 hp/alive/xp、結構易主→佔領獎勵；產出 BattleReplay；寫 combat_log。
- **驗收**：戰後戰略狀態正確；replay 重跑得到相同結果。
- **注意事項**：xp / 升級規則依 [04](04-units-and-combat.md)。
- **本階段不做**：前端重播 UI（P6.4）。

## P4.8 前端戰場
- **目標**：戰場渲染 + INTERACTIVE 群指令操控。
- **前置**：P4.1–P4.7。
- **交付物**：新 `frontend/src/battle/`：戰場 hex 渲染、群選取、陣型 / 移動 / 攻擊 / 技能指令、即時播放。
- **驗收**：build + smoke 綠；玩家可在戰場下群指令並看到模擬結果與戰略層回填。
- **注意事項**：前端只發指令給引擎、播放引擎輸出的事件序列；不在前端重算戰鬥（保確定性單一真相）。
- **本階段不做**：AUTO/INTERACTIVE 之外的模式。

---

# 里程碑 M5：戰場吃地形 / 建設

> 出口狀態：先前的建設 / 地形改造在戰場上實際生效，完成「建設 → 改戰場 → 戰術」迴圈。

## P5.1 戰場承接地物
- **目標**：wall/moat/bridge/terraform 進 BattleMap。
- **前置**：M3、M4。
- **交付物**：擴 P4.2 切割：把施工完成的 wall/moat/bridge 與 terraform 後地形帶入戰場佈局。
- **驗收**：有牆 / 有橋 / 清過森林的地塊，戰場呈現對應地物。
- **本階段不做**：規則效果（P5.2）。

## P5.2 戰術規則套用
- **目標**：工事 / 瓶頸 / 地形在戰鬥中生效。
- **前置**：P5.1。
- **交付物**：守 wall/moat/高 elevation → defense / terrain_defense↑；橋頭 / 隘口限制展開（陣型受地形約束）；
  amphibious 在水/沼 +。
- **驗收**：受控場景中工事與瓶頸明顯改變戰果；確定性成立。
- **注意事項**：陣型展開受地形阻擋的判定要明確、可重現。
- **本階段不做**：平衡數值微調（M6）。

## P5.3 迴圈驗證
- **目標**：建設→改戰場→戰術 端到端驗證。
- **前置**：P5.2。
- **交付物**：一個固定 seed 的整合測試 / demo，重現 [00](00-overview.md) 走查範例的「守橋流」勝負差異
  （有牆 / 無牆、有橋包抄 / 無橋）。
- **驗收**：建設與否導致可觀測且可重現的戰術結果差異。
- **本階段不做**：流派 / 平衡（M6）。

---

# 里程碑 M6：戰術 AI 深化 + 流派 + 平衡

> 出口狀態：AI 會用地形與建設、科技長出多樣流派、數值大致平衡、戰報可回放。

## P6.1 戰術 AI 深化
- **交付物**：行為樹 / utility 擴充（守城牆 / 守橋 / horde 包夾 / 保護首領 / 階段性撤退）；難度旋鈕（[07](07-ai-opponent.md)）。
- **驗收**：AI 在有建設的戰場明顯改變打法；難度參數可調。

## P6.2 互斥流派
- **交付物**：`TechNode.excludes[]` 實作 + `tech_tree.yaml` 加人類（精兵流⟂設防流、偵刺流⟂攻城流）
  與魔物（走質⟂走量深層節點）互斥分支（[05](05-tech-and-evolution.md)）；前端科技樹顯示鎖定。
- **驗收**：解鎖一節點即鎖死互斥節點；不同流派導向可玩的不同 build。

## P6.3 平衡係數
- **交付物**：填入 [04](04-units-and-combat.md) / [10](10-tactical-combat.md) 的傷害 / 命中 / 士氣 / 特性數值、
  建造工期成本、`max_battle_units` 壓測定案。
- **驗收**：基準對局不出現一面倒 / 卡死；效能在目標規模內可接受。

## P6.4 戰報 / 回放呈現
- **交付物**：前端讀 `BattleReplay` 重播戰鬥、戰略戰報時間軸。
- **驗收**：任一過往戰鬥可重播且與當時結果一致。

---

## D. 進度勾稽表（接手者更新此處）

> 接手時先更新此表，再動工。狀態：⬜ 未開始 / 🟦 進行中 / ✅ 完成。

| 階段 | 狀態 | 完成 commit | 備註 |
|------|------|-------------|------|
| P1.1 幾何與地塊模型 | ⬜ | | |
| P1.2 結構物模型 | ⬜ | | |
| P1.3 GameState 重構 | ⬜ | | 破壞性遷移，需一次到綠 |
| P1.4 地塊地圖生成器 | ⬜ | | |
| P1.5 資料層對齊 | ⬜ | | 勿丟失作者既有 data |
| P1.6 前端 hex 渲染 | ⬜ | | 建議改吃引擎 JSON |
| P1.7 戰鬥占位 + smoke | ⬜ | | 占位非備援，M4 移除 |
| P2.1 軍團與尋路 | ⬜ | | |
| P2.2 軍事階段結算 | ⬜ | | |
| P2.3 接戰判定 | ⬜ | | |
| P2.4 前端軍團 UI | ⬜ | | |
| P3.1 建造模型 | ⬜ | | |
| P3.2 佇列機制 | ⬜ | | |
| P3.3 各動作套用 | ⬜ | | |
| P3.4 科技門檻 | ⬜ | | |
| P3.5 前端建造 UI | ⬜ | | |
| P4.1 戰術模型 | ⬜ | | |
| P4.2 戰場切割 | ⬜ | | |
| P4.3 戰略→戰術展開 | ⬜ | | |
| P4.4 模擬迴圈核心 | ⬜ | | 確定性關鍵測試 |
| P4.5 士氣/特性/菁英 | ⬜ | | |
| P4.6 戰術 AI（AUTO） | ⬜ | | 移除占位戰鬥 |
| P4.7 結果回填 + 回放 | ⬜ | | |
| P4.8 前端戰場 | ⬜ | | |
| P5.1 戰場承接地物 | ⬜ | | |
| P5.2 戰術規則套用 | ⬜ | | |
| P5.3 迴圈驗證 | ⬜ | | |
| P6.1 戰術 AI 深化 | ⬜ | | |
| P6.2 互斥流派 | ⬜ | | |
| P6.3 平衡係數 | ⬜ | | |
| P6.4 戰報/回放呈現 | ⬜ | | |

---

## E. 風險與依賴備忘

- **P1.3 是最大風險點**（破壞性 schema 遷移）：models.py + data 載入 + 既有測試必須同一波改到綠，否則後續全卡。
- **確定性貫穿全程**：每個含亂數的階段都要留 golden test；P4.4 是確定性的試金石。
- **前端雙實作風險**：建議 P1.6 起前端改「消費引擎 JSON」，避免 TS/Python 兩套地圖 / 戰鬥邏輯漂移。
- **占位戰鬥**（P1.7）僅為連續性 scaffold，**P4.6 必須整段移除**並換成即時引擎（決策 4：無公式備援）。
- **data 屬作者內容**：調 schema 時給安全預設、不破壞既有 YAML 設計；不確定先問作者。
- **規模上限未定**：`max_battle_units` 等到 P6.3 壓測才定案，前面用保守值。
