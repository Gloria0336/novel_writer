# 06 — 回合結構：每月四階段（戰略回合）+ 即時戰術戰鬥

> 混合制（[09](09-hybrid-redesign-plan.md)）：戰略層維持每月四階段、同時提交制；`COMBAT` 階段
> 內嵌**即時戰術戰鬥**（[10](10-tactical-combat.md)）。一個月仍是一輪，戰術戰鬥內嵌在該輪的 COMBAT 內。

每一輪代表**一個月**，依序跑四個階段。關鍵特性是**同時行動（simultaneous）**：每階段雙方各自
「提交」命令（人類玩家手動、魔物 AI 自動），系統**收齊雙方**後一次性結算，任一方都看不到對方
該階段的明文命令——只能在情報階段取得受迷霧影響的近似資訊。

`TurnState.phase`（`TurnPhase`）記錄當前階段；`month` 記錄第幾個月。

## 開局步驟：菁英選角 `DRAFT`（每局一次，先於 month 1）

四階段循環開始前，雙方各從己方英雄池（[`../data/elites.yaml`](../data/elites.yaml)）選 **5–8 名**
菁英組成 roster：

- 數量上下限由 `MapGenConfig.elite_roster_size`（預設 `(5, 8)`）界定。
- 玩家手選、魔物 AI 依盤面評估選，各方選定的 `EliteTemplate.id` 寫入 `Faction.elite_roster`。
- 選定的菁英以 `EliteInstance`（`level=1, xp=0, alive=True`）初始化，部署於己方核心結構
  （王城 / 主巢）所在地塊，之後可隨 `Army` 移動。
- 此步驟只在開局執行一次，**不屬於任何月份的四階段**。

## 階段 1：內政階段 `DOMESTIC`

雙方各自進行：資源分配 / 科技研發 / 產生兵力 / **建築與地形改造**。

- 玩家 / AI 各提交一份 `DomesticOrder`（內含多個 `DomesticAction`，`type` ∈
  `ALLOCATE / RESEARCH / RECRUIT / BUILD / BUILD_ROAD / BUILD_BRIDGE / FORTIFY / TERRAFORM`），
  存入 `TurnState.domestic_orders[side]`。
- **雙方都提交後**，系統結算：先計每月資源產出（[03](03-economy-and-resources.md)），再依序套用
  分配 / 研究 / 招募；建築與地形改造類動作**進建造佇列**（`ConstructionProject`，跨月完成，
  見 [11](11-construction-and-terraform.md)），完工時才改寫地塊 / 結構。
- 結算完才進入下一階段。

## 階段 2：情報階段 `INTELLIGENCE`

雙方各自探查對方的部分行動，產出 `IntelReport` 存入 `TurnState.intel_reports`。

- 情報**可能模糊或錯誤**：清晰度 `clarity` 由偵察科技 + 視野半徑（`vision` 加成）決定。
- 連續地圖下，視野以**地塊視野半徑**揭露；詳細迷霧 / 加噪 / 誤導見 [08](08-intelligence-and-fog.md)。
- 探查目標由各方選定（玩家點選地塊 / 結構 / 軍團；AI 依威脅評估）。

## 階段 3：軍事階段 `MILITARY`

雙方部署兵力。各提交一份 `Deployment`，內含多個 `ArmyMove`（軍團移動）與駐防意圖。

- 軍團在**連續地塊地圖**上移動，沿地塊累計 `movement_cost`，受 `movement_points` 限制
  （[02](02-map-generation.md)）；不再「只能沿邊」，但無路 / 過河成本高。
- 意圖 `intent` ∈ `ATTACK / REINFORCE / DEFEND / HOLD`：`ATTACK` 指向敵 / 中立結構或敵軍團所在地塊；
  `DEFEND/HOLD` 留守原地。
- **菁英隨軍移動**：`ArmyMove.elite_ids` 列出隨軍的菁英 instance id。
- **雙方都部署完成後**才進入下一階段。

## 階段 4：戰鬥結算 `COMBAT`（即時戰術戰鬥）

移動結束後，引擎找出所有**接戰點**（敵對軍團同地塊 / 控制範圍重疊 / 圍攻結構），逐一處理：

1. 從接戰地點周邊**切出 `BattleMap`**（含地形、河、道路、被攻結構的工事 / 牆 / 橋）。
2. 把雙方參戰 `UnitStack` / 菁英展開為 `TacticalUnit` 群（[04](04-units-and-combat.md)）。
3. 跑**即時戰術模擬**（固定步長 + `battle_seed`，[10](10-tactical-combat.md)）：
   - 玩家方戰鬥可 `INTERACTIVE`（陣型半自動微操）；其餘 `AUTO_RESOLVE`（AI 在同引擎下令）。
   - 解算移動 / 交戰 / 技能 / 士氣 / 潰逃，記錄 `BattleEvent` 供重播。
4. 戰鬥輸出 `BattleResult`：存活折回 `UnitStack.count`、菁英 hp / 陣亡 / xp、結構是否易主。
5. `captured` → 更新 `Structure.owner` 與其控制地塊，發佔領獎勵（[03](03-economy-and-resources.md)）。
6. **突發事件**：以 `derive_seed(master_seed, "event", month, ...)` 判定是否觸發 `RandomEvent`
   （援軍 / 瘟疫 / 倒戈 / 資源發現 / 地形變動 / 突變），套用其 `effects`。
7. 寫入 `combat_log` / `event_log`，並可存 `BattleReplay`。

## RESOLVE：月末結算

收齊全部戰鬥結果後：

- **完成本月到期的建造**：`ConstructionProject.turns_remaining` 歸零者套用到地圖（[11](11-construction-and-terraform.md)）。
- **檢查全域勝負**（[01](01-world-and-factions.md)）：若王城或主巢易主，設 `GameState.winner`；
  否則 `month += 1`，回到內政階段，開始下一個月。

## 同時行動的提交 / 結算骨架

```
for phase in [DOMESTIC, INTELLIGENCE, MILITARY, COMBAT]:
    collect_submission(HUMAN, phase)     # 玩家手動
    collect_submission(MONSTER, phase)   # AI 自動 (07-ai-opponent)
    resolve(phase)                       # 收齊後一次性結算
                                         #   COMBAT：逐場進入即時戰術引擎 (10)
finish_construction()                    # 完成到期建造 (11)
advance_month_or_set_winner()
```

相關模型：`TurnState`、`TurnPhase`、`DomesticOrder`、`ConstructionProject`、`Deployment`、
`ArmyMove`、`Army`、`IntelReport`、`TacticalBattle`、`BattleResult`、`RandomEvent`
（見 [`../schema/models.py`](../schema/models.py)）。
