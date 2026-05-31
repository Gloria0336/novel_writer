# 11 — 建造與地形改造規格

> 混合制（[09](09-hybrid-redesign-plan.md)）核心樂趣之一：在回合內**建設城池、鋪路造橋、改造地形**，
> 改變移動 / 加成，並在下一場戰術戰鬥（[10](10-tactical-combat.md)）化為實際戰場優勢。
> 全部以內政階段動作（[06](06-turn-and-phases.md)）+ 跨月建造佇列實現。

## 1. 動作型別（`DomesticActionType` 擴充）

| type | payload | 完工效果 |
|------|---------|----------|
| `BUILD` | `structure_type, footprint[coord]` | 在己方控制地塊蓋新結構（塔 / 兵營 / 哨站 / 城…），帶 `bonuses` |
| `BUILD_ROAD` | `path[coord]` | 沿路徑地塊加 `road` feature → 大降 `movement_cost` |
| `BUILD_BRIDGE` | `water_tiles[coord]` | 在 water 地塊加 `bridge` → 變可低成本通行；戰場呈現為橋 |
| `FORTIFY` | `target(tile/structure), kind(wall/moat)` | 加 `wall`/`moat` feature + 提升 `fortification` / `terrain_defense` |
| `TERRAFORM` | `tiles[coord], op` | `op ∈ clear_forest / dig_canal / level_ground / raise_dyke`：改 `terrain_type` / `elevation` / `features` |

- 動作可被科技門檻限制：`engineering` 類科技的 `unlock_build_<kind>` 解鎖對應動作（[05](05-tech-and-evolution.md)）。
- 目標地塊須為己方**控制範圍**內（或前線可施工地塊，依規則）；非法目標於提交時被 validator 拒絕。

## 2. 成本與建造佇列

```
DOMESTIC 提交：
  檢查科技解鎖 + 目標合法 + 資源足夠
  扣 cost（人類 combat_resource / 魔物 monster_source）
  建立 ConstructionProject(kind, target, cost, turns_remaining = base_turns / (1 + build_speed))
每月 RESOLVE：
  for proj in construction:
      proj.turns_remaining -= 1
      if proj.turns_remaining <= 0: apply(proj) → 改寫地塊 / 結構；移出佇列
```

- `ConstructionProject`：`id, owner, kind, target_tiles[], cost, turns_remaining, status`。
- 工期 / 成本範本放 `data`（如 `construction.yaml` 或併入既有資料），具體數值待平衡。
- 建造與招募 / 研究 / 進化**競爭同一資源預算**，形成「擴張 vs 軍備 vs 科技」取捨。
- 可被打斷：施工地塊若被敵方佔領，對應 `ConstructionProject` 取消 / 凍結（規則待定，列為 M3 細節）。

## 3. 對三大系統的影響

| 系統 | 影響 |
|------|------|
| **移動**（[02](02-map-generation.md)）| `road` 降成本加速調兵；`bridge` 開通水路 / 新進攻軸線；`TERRAFORM` 改地形成本 |
| **加成 / 經濟**（[03](03-economy-and-resources.md)）| 新結構帶 `resource_yield` / `recruit_rate` / `research_rate` / `vision` 等 `NodeBonus` |
| **戰術戰場**（[10](10-tactical-combat.md)）| `wall`/`moat` 成為戰場防禦工事；`bridge` 成橋頭瓶頸；清森林去隱蔽；挖渠 / 築堤造天險 |

**設計迴圈**：內政建設 → 改寫地塊 → 改變下一場 `BattleMap` → 開創新戰術。這是「改造環境
創造戰爭策略」目標的落點。

## 4. 與隨機事件協調

舊 `RandomEvent` 的 `TERRAIN_SHIFT`（[06](06-turn-and-phases.md) COMBAT 突發事件）保留為**被動天災 /
地形變動**，與玩家主動 `TERRAFORM` 並存：前者隨機、後者可規劃。

## 5. 範例

- **守橋流**：人類在唯一過河點 `FORTIFY` 築 `wall` + 上游 `TERRAFORM` 挖渠拓寬河面（封死徒涉），
  逼魔物只能擠橋頭 → 戰術戰場以寡擊眾。
- **開路奇襲**：魔物 `BUILD_BRIDGE` 在無人防守的上游架橋，下回合偏師包抄人類城後方。
- **去蔽推進**：人類 `TERRAFORM clear_forest` 清掉魔物伏擊用的森林，降低被偷襲風險再推進。

相關模型：`DomesticAction`、`DomesticActionType`、`ConstructionProject`、`Tile`、`TileFeature`、
`Structure`、`NodeBonus`（見 [`../schema/models.py`](../schema/models.py)）。
具體工期 / 成本 / 解鎖門檻留待平衡階段（[09](09-hybrid-redesign-plan.md) 里程碑 M3）。
