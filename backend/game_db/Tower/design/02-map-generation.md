# 02 — 地圖：連續地塊地圖與種子碼程序生成

> 混合制改造（見 [09](09-hybrid-redesign-plan.md)）：地圖由舊「網狀節點圖」改為**連續六角地塊地圖**。
> 一張地圖同時服務戰略層（全局回合）與戰術層（從地塊切出戰場）。

## 資料模型

地圖是一張 **hex 六角地塊網格**（axial 座標 `(q, r)`）。地形、結構物、道路、橋、軍團
全部疊在地塊上；同一張地圖在戰略視圖看全局，在戰術視圖切出局部當戰場。

- `TileMap`：`width, height, tiles[]`、`master_seed`。
- `Tile`：`coord(q,r)`、`terrain_type`、`elevation`、`features[]`（`TileFeature`）、
  `passable`、`movement_cost`、`owner`、`structure_id?`、`bonuses[]`。
- `Structure`（取代舊 `MapNode`）：`id, name, structure_type, owner, footprint[coord], control_radius,
  fortification, garrison, bonuses, parent_nest_id?, tags`。佔據一或多塊地塊，並**控制**周邊
  `control_radius` 內的地塊（取代舊「節點擁有權」）。
- `Army`：戰略層可移動實體，`id, owner, position(coord), movement_points, units[], elite_ids[]`。
- 鄰接 / 可達性：以**地塊六鄰接 + 尋路**取代舊 `Edge`；`GameState.hex_neighbors(coord)` 取六鄰格。

### 地形區（`TerrainType`，沿用六種，落到每塊地塊）

| 類型 | 地塊互動 | 移動成本 |
|------|----------|----------|
| `plain` 平原 | 補給穩定、利於築城與佈署 | 低，利大軍通過 |
| `forest` 森林 | 隱蔽 / 伏擊 / 木材；可被 `TERRAFORM` 清除 | 較高，偵查/伏擊效果強 |
| `swamp` 沼澤 | 防守高、產能低；非適應部隊受阻 | 高 |
| `desert` 沙漠 | 補給壓力高，特定資源 / 遺跡較常見 | 高，長距行軍懲罰 |
| `mountain` 山地 | 隘口 / 礦脈 / 要塞加成；高 `elevation` | 很高，防守價值高 |
| `water` 水域 / 河川 | 港口 / 渡口；**需 `bridge` feature 才低成本通行** | 極高 / 不可通行（無橋）|

### 地塊特徵（`TileFeature`，取代舊 `PathType` 與點綴物）

| feature | 來源 | 效果 |
|---------|------|------|
| `road` 道路 | 生成 / `BUILD_ROAD` | 大幅降 `movement_cost`，利快速調兵 |
| `bridge` 橋 | 生成 / `BUILD_BRIDGE` | 使 water 地塊可低成本通行；戰場上呈現為橋 |
| `secret_path` 密道 | 生成（魔族）| 降魔族移動成本、降人類預設可見度 |
| `wall` / `moat` 牆 / 壕 | `FORTIFY` | 提升該地塊 / 結構工事，**戰場上呈現為防禦工事** |
| `mine` / `ruin` / `ford` 礦脈 / 遺跡 / 淺灘 | 生成 | 掛資源 / 特殊加成 |

道路 / 橋 / 密道**不再限制可達性**（連續地圖可自由走位），只影響移動成本與視野；
山 / 水 / 沼澤的高成本地塊天然形成隘口與走廊，重現舊「沿網路推進」的張力。

### 結構物類型（`StructureType`，取代舊 `NodeType`）

| 類型 | 陣營 | 數量 | 工事倍率（典型） |
|------|------|------|------------------|
| `capital` 王城 | 人類 | 恰 1 | 高（2.0~3.0） |
| `city` 城市 | 人類 | `human_cities`（預設 3） | 中（1.4~1.8） |
| `main_nest` 魔巢 | 魔物 | 1（勝利目標） | 中（1.3~1.6） |
| `sub_nest` 副巢 | 魔物 | 每巢 1~3 | 低中（1.1~1.3） |
| `tribe` 部落 | 魔物 | 每巢 2~4 | 低（1.0~1.1） |
| 玩家自建（塔 / 兵營 / 哨站…）| 雙方 | 由 `BUILD` 動態增加 | 由範本定 |

「巢穴 = 部落 + 副巢叢集」仍以 `parent_nest_id` 表達。攻打主巢通常得先穿過外圍部落 / 副巢
所控制的地塊——以**地塊控制範圍重疊**體現「易入侵但地形複雜」。

## 種子碼生成演算法（地塊級）

由 `MapGenConfig`（含 `seed`）決定，全程 `derive_seed(seed, ...)` 衍生子 seed，同一 seed 永遠
生成同一張圖（可重現）。步驟：

1. **生成地形圖**：seeded noise / Voronoi / cellular 在六角網格上寫入每塊地塊的 `terrain_type`
   與 `elevation`，使六種地形範圍彼此嵌合並完整覆蓋地圖。
2. **拆分勢力範圍**：依地圖長軸 / 戰線曲線切分人類方、魔族方與中間爭奪帶。
3. **放置主結構**：王城置於人類核心、主巢置於魔族核心，含 `footprint` 與不適地形時的重採樣。
4. **放置副結構**：人類城市於人類範圍；魔族副巢 / 部落圍繞主巢成叢集，`parent_nest_id` 指向主巢。
5. **散佈中立 / 資源地塊**：中間帶與邊界放遺跡 / 礦脈 / 淺灘等 feature；各地塊取其 `terrain_type`
   派生互動（如城市落沼澤 → 沼澤城）。
6. **生成初始道路**：以 hex 尋路串聯己方結構，沿路徑地塊加 `road` feature（骨幹交通網）。
7. **生成初始橋 / 密道**：河流要衝放 `bridge`；魔族範圍額外鋪 `secret_path` 連接副巢與部落，
   使魔族外圍更複雜、包抄路線更多。
8. **指派加成**：依地塊地形、結構類型、feature，從 `Catalog.node_bonus_templates`
   （[`../data/node_bonuses.yaml`](../data/node_bonuses.yaml)）套上 `NodeBonus`（鍵改為對地塊 / 結構生效）。
9. **初始駐軍 / 工事**：王城高工事高駐軍；部落低工事低駐軍。

## 移動成本與行軍

戰略層移動以**軍團移動點**進行：軍團每月重置 `movement_points`，沿地塊累計成本前進。

```text
tile_cost(tile, faction) = terrain_cost(terrain, elevation)
                         × feature_mult(road / bridge / secret_path / wall…)
                         / faction_speed(faction, terrain, features)
```

- 有 `road` 的地塊成本大降；`water` 無 `bridge` 時極高 / 不可通行。
- 密道對魔族成本更低、對人類更高（魔族特權路徑）。
- 移動結束後，敵對軍團落同地塊 / 控制範圍重疊 / 圍攻結構 → 觸發一場戰術戰鬥（[06](06-turn-and-phases.md)、[10](10-tactical-combat.md)）。

## 地圖加成（`NodeBonus` / `BonusType`，沿用）

佔領不同地塊 / 結構帶來不同戰略價值，鼓勵爭奪而非死守：

| BonusType | 效果 | 範例 |
|-----------|------|------|
| `resource_yield` | 每月產出指定資源 | 礦脈地塊、奴隸市場 |
| `recruit_rate` | 招募 / 孵化加速 | 兵營、孵化池 |
| `research_rate` | 研究加速 | 學院 |
| `vision` | 擴大視野半徑 / 降迷霧（[08](08-intelligence-and-fog.md)）| 瞭望塔、高地 |
| `terrain_defense` | 守方戰場防禦倍率 | 隘口、沼澤、水域、`wall`/`moat` |
| `movement` | 行軍加成 | 道路樞紐 |

加成乘算進經濟（[03](03-economy-and-resources.md)）、戰術戰鬥（[04](04-units-and-combat.md)、[10](10-tactical-combat.md)）、
情報（[08](08-intelligence-and-fog.md)）。玩家可透過 `BUILD` / `BUILD_ROAD` / `FORTIFY` / `TERRAFORM`
（[11](11-construction-and-terraform.md)）**主動改造地塊**，改變移動、加成與未來戰場地形。
