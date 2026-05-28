# 02 — 地圖：網狀據點與種子碼程序生成

## 資料模型

地圖是一張**無向圖**：節點 = 據點（`MapNode`），邊 = 鄰接（`Edge`）。
**攻擊與行軍只能沿邊發生**——這把「佔點」變成沿網路推進的爭奪。

- `MapNode`：`id, name, node_type, owner, position, fortification, garrison, bonuses, parent_nest_id, tags`
- `Edge`：`a, b, travel_cost`（無自連，見模型 validator）
- `GameState.neighbors(node_id)` 取鄰接節點。

### 據點類型（`NodeType`）

| 類型 | 陣營 | 數量 | 工事倍率（典型） |
|------|------|------|------------------|
| `capital` 王城 | 人類 | 恰 1 | 高（2.0~3.0） |
| `city` 城市 | 人類 | `human_cities`（預設 3） | 中（1.4~1.8） |
| `main_nest` 魔巢 | 魔物 | 1（勝利目標） | 中（1.3~1.6） |
| `sub_nest` 副巢 | 魔物 | 每巢 1~3 | 低中（1.1~1.3） |
| `tribe` 部落 | 魔物 | 每巢 2~4 | 低（1.0~1.1） |
| `neutral` 中立地形 | 無 | `neutral_nodes`（預設 4） | 由地形定 |

「巢穴 = 部落 + 副巢叢集」以 `parent_nest_id` 表達：副巢與部落都指向所屬主巢。
攻打主巢通常得先穿過外圍部落 / 副巢——體現「易入侵但地形複雜」。

## 種子碼生成演算法

由 `MapGenConfig`（含 `seed`）決定。全程用 `derive_seed(seed, ...)` 衍生子 seed，
同一 seed 永遠生成同一張圖（可重現）。步驟：

1. **决定規模**：依 config 抽 `monster_nests`、每巢的副巢 / 部落數（落在範圍內）。
2. **放置核心**：王城置中一側，主巢群置對側；各巢周圍生成其副巢 / 部落叢集，設 `parent_nest_id`。
3. **散佈次要節點**：人類城市與中立地形以 seeded 亂數佈在中間地帶（`Position`）。
4. **連邊（兩步）**：
   - 先建**生成樹**確保全圖連通（任意據點可達）。
   - 再依 `extra_edge_ratio` 加額外邊形成**網狀**（多路徑、可包抄）。傾向連接地理相近節點。
5. **指派加成**：依節點類型 / 地形，從 `Catalog.node_bonus_templates`
   （[`../data/node_bonuses.yaml`](../data/node_bonuses.yaml)）套上 `NodeBonus` 組合。
6. **初始駐軍 / 工事**：王城高工事高駐軍；部落低工事低駐軍。

## 地圖加成（`NodeBonus` / `BonusType`）

佔領不同據點帶來不同戰略價值，鼓勵爭奪而非死守：

| BonusType | 效果 | 範例據點 |
|-----------|------|----------|
| `resource_yield` | 每月產出指定資源 | 礦脈、奴隸市場 |
| `recruit_rate` | 招募 / 孵化加速 | 兵營、孵化池 |
| `research_rate` | 研究加速 | 學院 |
| `vision` | 降低情報迷霧（見 [08](08-intelligence-and-fog.md)） | 瞭望塔、高地 |
| `terrain_defense` | 守方防禦倍率 | 隘口、沼澤、水域 |
| `movement` | 行軍加成 | 道路樞紐 |

加成乘算進經濟（[03](03-economy-and-resources.md)）、戰鬥（[04](04-units-and-combat.md)）、
情報（[08](08-intelligence-and-fog.md)）各系統。
