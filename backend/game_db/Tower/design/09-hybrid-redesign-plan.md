# 09 — 混合制改造計畫：回合戰略 + 即時戰術 + 連續地圖

> 本文件是把現有「回合制網狀佔點」設計（[00](00-overview.md)–[08](08-intelligence-and-fog.md)）
> 改造為**混合制**的路線圖：保留每月四階段的戰略框架，但 (1) 把地圖從網狀節點圖改為**連續地塊地圖**、
> (2) 把「戰鬥結算」階段改為**即時小規模戰術戰鬥**、(3) 允許在回合內**改造地形 / 建築 / 鋪路造橋**。
> 參考典範：《全面戰爭》（戰略回合 + 戰術即時）的雙層結構。

---

## 0. 核心架構：雙層 + 一張共用地圖

```
┌─────────────────────────── 戰略層（回合制，每月一輪）────────────────────────────┐
│  DOMESTIC → INTELLIGENCE → MILITARY → (進入戰術層) → 回填結果 → 下個月          │
│  經濟 / 科技 / 招募 / 建築 / 改地形 / 軍團在連續地圖上移動                       │
└──────────────────────────────────┬────────────────────────────────────────────┘
                                    │ 當兩軍在同一地點接戰
                          ┌─────────▼──────────┐
                          │  戰術層（即時）     │  從連續地圖切出「戰場地圖」
                          │  單位實時走位 / 交戰 │  玩家微操或一鍵自動結算
                          └─────────┬──────────┘
                                    │ 戰鬥結果（存活 / 傷亡 / 誰佔領）
                                    ▼ 回填戰略層
```

- **一張地圖、兩種視圖**：連續地塊地圖是唯一真實地圖。戰略視圖看全局（迷霧、軍團、據點、建設）；
  戰術視圖在開打時，從接戰地點周邊「切」一塊地形當戰場。
- **戰略層仍是回合制**（保住現有四階段 / 同時提交 / `derive_seed` 確定性）。
- **戰術層是即時**，但**內嵌在一個回合的 COMBAT 階段內**——不是全程即時，避免重寫整個引擎核心。

---

## 1. 時間模型改造

### 1.1 戰略層（不變的部分）
維持 [06](06-turn-and-phases.md) 的 `DOMESTIC / INTELLIGENCE / MILITARY` 三階段與同時提交制。
`TurnPhase.COMBAT` 語義改變：不再是「一條公式逐據點算」，而是「**逐場戰術戰鬥**」。

### 1.2 戰術層（新增）
- 每一場接戰是一個 `TacticalBattle`，有自己的**即時時間軸**：固定步長 tick（建議 `dt = 1/20 秒`邏輯幀），
  與畫面更新解耦。
- **確定性即時**：戰術戰鬥仍用 `battle_seed = derive_seed(master_seed, "battle", node_or_pos, month, battle_index)`，
  搭配固定步長 + seeded RNG，使「同樣輸入 + 同樣操作序列」可重現（重播 / AI 對戰 / 回放戰報）。
- **結算模式（皆走同一套即時引擎，無整體公式備援）**：
  - `INTERACTIVE` 玩家即時下令（**陣型半自動**，見 3.2）；
  - `AUTO_RESOLVE` 由戰術 AI 在**同一套即時模擬**上下令跑完（差別只在誰下令，不是另一條公式路徑）。
  玩家不想微操時選 AUTO，魔物 AI 永遠走 AUTO。**不保留舊整體戰力公式作快速結算**（決策 5）。

### 1.3 一個月的新流程
```
DOMESTIC      雙方提交內政（含改地形 / 建設 / 鋪路造橋 → 進建造佇列）
INTELLIGENCE  迷霧探查（沿用 08，視野改為連續地圖的視野半徑）
MILITARY      雙方提交軍團移動意圖（在連續地圖上移動，消耗移動點）
COMBAT        引擎找出所有「接戰點」，逐一進入戰術層即時戰鬥；
              玩家方戰鬥可 INTERACTIVE，其餘 AUTO；收齊全部戰鬥結果
RESOLVE       回填傷亡 / 佔領 / 完成本月到期的建造；檢查勝負；month += 1
```

---

## 2. 空間模型改造：網狀圖 → 連續地塊地圖

### 2.1 地圖基礎
- 採用 **hex 六角格**（決策 1）：走位 / 鄰接 / 視野公式乾淨、無對角線歧義。座標用 axial `(q, r)`。
- `TileMap`：`width, height, tiles[]`。每個 `Tile`：
  `coord(q,r)`、`terrain_type`、`elevation`、`features[]`（森林 / 礦脈 / 河 / 道路 / 橋 / 廢墟…）、
  `passable`、`movement_cost`、`owner`、`structure_id?`。
- **保留地形語義**：[02](02-map-generation.md) 的六種 `TerrainType` 與其互動全部沿用，只是從「節點所在地形」
  變成「每塊地塊的地形」。

### 2.2 據點 → 結構物
- 舊 `MapNode`（王城 / 城市 / 巢 / 部落）改為 `Structure`：佔據一塊或多塊地塊（`footprint`），
  有 `control_radius`（控制周邊地塊 → 取代舊「節點擁有權」）。
- `node_type` → `structure_type`，工事 `fortification`、駐軍 `garrison`、加成 `bonuses` 全部沿用，
  掛在 Structure 上。
- **勝負目標不變**：佔領敵方王城 / 主巢（[01](01-world-and-factions.md)）。

### 2.3 道路 / 橋 / 密道 → 地塊特徵
- 舊 `Edge` / `PathType`（road/trail/secret）取消「只能沿邊移動」的限制。
- `road` / `bridge` / `secret_path` 變成**地塊上的 feature**，只影響 `movement_cost` 與視野，
  不再限制可達性（連續地圖可自由走位，但無路 / 過河成本高）。
- 移動仍可重現舊「沿網路推進」的感覺：山 / 水 / 沼澤的高成本地塊天然形成隘口與走廊。

### 2.4 軍團與移動
- 新增 `Army`（軍團）：戰略層上可移動的實體，`position(coord)`、`movement_points`（每月重置）、
  攜帶的 `UnitStack[]` 與 `elite_ids[]`。
- MILITARY 階段提交 `ArmyMove`（目的地 + 路徑），消耗移動點；移動由地塊 `movement_cost` 累計。
- 接戰判定：移動結束後，敵對軍團落在同地塊 / 控制範圍重疊 / 圍攻某結構 → 產生一場 `TacticalBattle`。

### 2.5 地圖生成
- 改寫 [02](02-map-generation.md) 的生成演算法為**地塊級**：
  1. seeded noise / Voronoi 生成地形區 → 寫入每塊地塊 `terrain_type` / `elevation`。
  2. 切分人類 / 魔族 / 爭奪帶。
  3. 放置王城 / 主巢 / 城市 / 巢 / 部落結構物（含 footprint 與重採樣）。
  4. 生成初始道路 feature（連接己方結構）、河上初始橋。
  5. 指派地塊 / 結構加成（沿用 `node_bonuses.yaml`，鍵改為對地塊 / 結構生效）。
- `master_seed` / `derive_seed` 確定性完全保留。前端 `frontend/src/map/generator.ts` 需重寫為地塊生成。

---

## 3. 戰術層即時戰鬥設計

### 3.1 戰場地圖
- 開打時，從連續地圖**接戰地點周邊**切出一塊矩形 / 六角區域作 `BattleMap`（含地形、河、道路、
  被攻結構的工事與牆）。攻 / 守初始佈署位置依進攻方向決定。
- **建設會影響戰場**：玩家先前在該地塊造的城牆 / 壕溝 / 橋直接出現在戰場 → 這就是「改造環境創造戰術」的回收點。

### 3.2 戰術單位
- 戰略層的一個 `UnitStack(count=N)` 在戰術層展開為 N（或縮放比例）個 `TacticalUnit`：
  `pos, hp, attack, defense, range, move_speed, state(idle/move/attack/flee)`、所屬 stack、特性 `traits`。
- 菁英展開為單一強力 `TacticalUnit` + 光環範圍效果（沿用 [04](04-units-and-combat.md) 的 aura / abilities，
  改為**範圍 / 即時觸發**：`fear` = 周邊敵單位攻速降、`aoe_spell` = 範圍即時傷害…）。
- 數值來源沿用：科技 `*_mult`、菁英等級成長、特性修正全部乘進戰術單位初始數值。

### 3.3 操控模型：陣型半自動（決策 1）
玩家**不逐單位微操**，而是下「**單位群（unit group）**」層級的指令——指派陣型、移動目標、
攻擊目標、技能時機；群內各 `TacticalUnit` 由引擎半自動執行（保持陣型、自動索敵、自動接戰）。
- 指令型別：`SET_FORMATION`（陣型 / 朝向）、`MOVE_TO(coord)`、`ATTACK(target_group / structure)`、
  `USE_ABILITY`、`HOLD / RETREAT`。
- 這大幅降低操作與 AI 複雜度，且契合「小規模戰鬥」定位；`AUTO_RESOLVE` 的 AI 下的是**同一組群指令**。

### 3.4 即時模擬迴圈（固定步長、確定性，決策 2）
```
for tick in battle:                       # dt 固定（如 1/20s），與畫面解耦
    套用本 tick 的群指令（玩家 INTERACTIVE 或 AI AUTO_RESOLVE，型別相同）
    更新每個 TacticalUnit：依群指令移動（hex 尋路）、保持陣型、索敵、攻擊冷卻、技能
    解算傷害（命中 / 暴擊 / 波動皆由 battle_seed 衍生 → 可重現）、士氣 / 潰逃
    記錄 BattleEvent（事件序列 = 重播基礎）
    判定結束：一方全滅 / 潰逃 / 攻方攻破結構 / 達時限
```
- **確定性**：固定步長 + seeded RNG + 記錄群指令序列 → 同輸入可完全重現；`BattleReplay` 存
  `battle_seed` + 指令序列即可重播（決策 2）。
- **效能**：小規模（建議單場上限數百個 TacticalUnit）。大會戰用「stack 縮放 + 群體單位」控制數量。

### 3.5 結果回填
- 戰鬥結束輸出 `BattleResult`：各 stack 存活數 → 折回 `UnitStack.count`；菁英 hp / 陣亡 / xp；
  結構是否被攻破 → `Structure.owner` 易主 + 佔領獎勵（[03](03-economy-and-resources.md)）。
- 寫入 `combat_log`，並可存完整 `BattleReplay`（事件序列 + battle_seed）供前端重播。

---

## 4. 回合內改造地形 / 建築 / 鋪路造橋

把「主動改造環境」做成 DOMESTIC 階段的動作，經**建造佇列**跨月完成，完工後改寫地塊狀態。

### 4.1 擴充 DomesticAction
新增 / 擴充 `type`：
| type | payload | 效果（完工時套用） |
|------|---------|--------------------|
| `BUILD` | structure_type, tiles | 在控制地塊上蓋新結構（城 / 塔 / 兵營…）|
| `BUILD_ROAD` | tile path | 沿路徑把地塊加 `road` feature → 降移動成本 |
| `BUILD_BRIDGE` | water tiles | 在水域地塊加 `bridge` → 變可通行 + 戰場出現橋 |
| `FORTIFY` | tile / structure | 加城牆 / 壕溝 / 提升 `fortification`（影響戰場工事）|
| `TERRAFORM` | tiles, op | 清森林 / 挖渠引水 / 夷平高地 / 築堤 → 改 `terrain_type` / `elevation` |

### 4.2 建造佇列
- 新增 `ConstructionProject`：`id, kind, target_tiles, cost, turns_remaining, owner`。
- DOMESTIC 提交時扣資源、入佇列；每月 RESOLVE 時 `turns_remaining -= 1`，歸零則套用到地圖。
- **戰略價值**：鋪路加速調兵、造橋開新進攻軸線、清森林去隱蔽、挖渠造天險——全都會在下一場
  戰術戰鬥的 BattleMap 上實際呈現，形成「建設 → 改變戰場 → 開創戰術」的迴圈（正是你的核心目標）。

### 4.3 與隨機事件協調
舊 `TERRAIN_SHIFT` 隨機事件保留為「被動天災」，與玩家主動 `TERRAFORM` 並存。

---

## 5. 資料模型（schema/models.py）改動清單

> `models.py` 是唯一真理來源；以下為增 / 改 / 棄。

**新增**
- `TileMap`, `Tile`, `TileFeature(enum)`
- `Structure`（取代 `MapNode` 的據點語義）、`StructureType(enum)`（原 `NodeType`）
- `Army`, `ArmyMove`
- `ConstructionProject`, 擴充 `DomesticActionType`（BUILD_ROAD / BUILD_BRIDGE / FORTIFY / TERRAFORM）
- 戰術層：`TacticalBattle`, `TacticalUnit`, `BattleMap`, `BattleEvent`, `BattleResult`, `BattleReplay`,
  `ResolveMode(enum: INTERACTIVE / AUTO_RESOLVE)`

**修改**
- `TurnPhase`：保留四階段，`COMBAT` 註解改為「逐場戰術戰鬥」
- `Deployment / TroopMovement`：from/to 從節點 id 改為地塊 coord / Army 參照；移除「只能沿邊」validator，
  改為移動點 / 可達性檢查
- `MapNode` → 併入 `Structure`；`position` 從抽象座標改為地塊 coord
- `GameState`：以 `tile_map` + `structures` + `armies` + `construction` 取代 `nodes` + `edges`
- `NodeBonus` 套用對象從節點改為地塊 / 結構（型別不大改）

**淘汰**
- `Edge`, `PathType`（降級為 `TileFeature`）, `GameState.neighbors()`（改地塊鄰接 / 尋路）

**保留（幾乎不動）**
- `ResourcePool`, `ResourceKind`, `UnitTemplate`, `UnitStack`, `EliteTemplate`, `EliteInstance`,
  `TechNode`, 進化 / 科研系統, `IntelReport`（視野改連續地圖）, `derive_seed`

---

## 6. 設計文件改動清單（design/）

| 文件 | 動作 |
|------|------|
| 00-overview | 改願景為「混合制」、更新核心迴圈圖與技術棧 |
| 01-world-and-factions | 勝負目標改用 Structure 語義（小改）|
| 02-map-generation | **重寫**為連續地塊地圖生成 |
| 03-economy-and-resources | 加「建造成本 / 佇列」段落（小改）|
| 04-units-and-combat | **重寫**戰鬥段：保留單位數值，戰鬥改即時戰術（無公式備援），指向 10 |
| 05-tech-and-evolution | 加「解鎖建造 / 地形改造科技」、互斥流派分支（中改）|
| 06-turn-and-phases | 改 COMBAT 階段為「進入戰術層」流程（中改）|
| 07-ai-opponent | 加戰術層 AI（行為樹 / utility）與建設決策（中改）|
| 08-intelligence-and-fog | 視野改連續地圖視野半徑（小改）|
| **09（本文件）** | 改造路線圖 |
| **10（新增）** | 戰術即時戰鬥規格（單位狀態機 / 傷害 / 士氣 / 確定性）|
| **11（新增）** | 建造與地形改造規格（佇列 / 成本 / 對戰場的影響）|

---

## 7. 前端改動（frontend/）

- `src/map/`：generator / cartography / routing **重寫**為地塊地圖（hex 渲染、尋路、視野）。
- 新增 `src/battle/`：戰術戰鬥即時渲染與操控（建議 canvas / WebGL；單位、選取、指令）。
- `src/tech/`：大致可沿用，擴充流派分支 UI。
- 新增建造 UI：選地塊 → 鋪路 / 造橋 / 改地形 → 顯示佇列進度。

---

## 8. 分期里程碑（建議順序，逐期可玩 / 可測）

1. **M1 連續地圖地基**：`TileMap` / `Tile` / `Structure` 模型 + 地塊地圖生成（取代網狀圖），
   前端 hex 渲染。戰鬥暫以「直接判存活」的開發占位（**僅 dev scaffold，非保留的公式備援**），M4 換成即時引擎。
2. **M2 軍團與戰略移動**：`Army` / 移動點 / 接戰判定，MILITARY 階段改用地塊移動。
3. **M3 建造與地形改造**：建造佇列 + BUILD_ROAD / BRIDGE / FORTIFY / TERRAFORM，改寫地塊狀態。
4. **M4 戰術即時戰鬥（核心）**：`TacticalBattle` 引擎（固定步長 + 確定性）、單位狀態機、
   AUTO_RESOLVE 先行，再加 INTERACTIVE 微操與前端戰場。
5. **M5 戰場吃地形 / 建設**：BattleMap 真實反映城牆 / 橋 / 地形改造，完成「建設→戰術」迴圈。
6. **M6 戰術 AI + 流派深化**：戰術行為樹、互斥科技分支、平衡係數。

每期都先動 `schema/models.py`（型別先行），再補 `data/*.yaml` 與設計文件，最後前端。

---

## 9. 決策記錄（已定案）

| # | 決策 | 結論 |
|---|------|------|
| 1 | 地塊形狀 | **Hex 六角格**（axial `q,r`）|
| 2 | 戰術微操程度 | **陣型半自動**（unit group 指令，非逐單位微操；見 3.3）|
| 3 | 確定性 | **保留可重現 / 可重播**（固定步長 + seeded + 指令序列）|
| 4 | 整體公式備援 | **不保留**；所有戰鬥皆走即時引擎，AUTO_RESOLVE = AI 在同引擎下令 |

### 尚待後續里程碑定案
- **戰術規模上限**：單場最多多少 `TacticalUnit`？（影響效能與 stack 縮放比例）— 留待 M4 壓測決定。

---

*本文件為計畫骨架；各「重寫 / 新增」項的具體公式與數值留待對應里程碑展開。*
