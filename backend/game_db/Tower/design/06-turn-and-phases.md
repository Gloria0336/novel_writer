# 06 — 回合結構：每輪一個月、四階段同時行動

每一輪代表**一個月**，依序跑四個階段。關鍵特性是**同時行動（simultaneous）**：
每階段雙方各自「提交」命令（人類玩家手動、魔物 AI 自動），系統**收齊雙方**後一次性結算，
任一方都看不到對方該階段的明文命令——只能在情報階段取得受迷霧影響的近似資訊。

`TurnState.phase`（`TurnPhase`）記錄當前階段；`month` 記錄第幾個月。

## 階段 1：內政階段 `DOMESTIC`

雙方各自進行：資源分配 / 科技研發 / 產生兵力 / 建築。

- 玩家 / AI 各提交一份 `DomesticOrder`（內含多個 `DomesticAction`，`type` ∈
  `ALLOCATE / RESEARCH / RECRUIT / BUILD`），存入 `TurnState.domestic_orders[side]`。
- **雙方都提交後**，系統結算：先計每月資源產出（[03](03-economy-and-resources.md)），
  再依序套用分配 / 研究 / 招募 / 建築，更新 `Faction` 與 `MapNode.garrison` / `GameState.buildings`。
- 結算完才進入下一階段（「系統蒐集各自行動資料再進入下一階段」）。

## 階段 2：情報階段 `INTELLIGENCE`

雙方各自探查對方的部分行動，產出 `IntelReport` 存入 `TurnState.intel_reports`。

- 情報**可能模糊或錯誤**：清晰度 `clarity` 由偵察科技 + `vision` 加成決定。
- 詳細迷霧 / 加噪 / 誤導規則見 [08-intelligence-and-fog](08-intelligence-and-fog.md)。
- 探查目標由各方在本階段選定（玩家點選 / AI 依威脅評估）。

## 階段 3：軍事階段 `MILITARY`

雙方部屬兵力，各提交一份 `Deployment`（多個 `TroopMovement`，`intent` ∈
`ATTACK / REINFORCE / DEFEND / HOLD`），存入 `TurnState.deployments[side]`。

- 進攻只能沿邊指向鄰接敵 / 中立據點；`DEFEND/HOLD` 的 from/to 必須同一據點（見模型 validator）。
- **雙方都部屬完成後**才進入下一階段（玩家提交後等 AI，或反之）。

## 階段 4：戰鬥結算 `COMBAT`

依雙方部屬演算戰鬥過程與結果。系統逐據點處理：

1. 蒐集每個據點的進攻方部隊（沿邊而來、`intent=ATTACK`）與守方（駐軍 + `REINFORCE/DEFEND`）。
2. 套戰鬥公式（[04](04-units-and-combat.md)）算出 `CombatReport`：過程 `rounds`、結果 `outcome`、傷亡、是否易主。
3. `captured` → 更新 `MapNode.owner`、發佔領獎勵（[03](03-economy-and-resources.md)）。
4. **突發事件**：以 `derive_seed(master_seed, "event", month, ...)` 判定是否觸發 `RandomEvent`
   （援軍 / 瘟疫 / 倒戈 / 資源發現 / 地形變動 / 突變），套用其 `effects`。
5. 寫入 `combat_log` / `event_log`。

結算後**檢查全域勝負**（[01](01-world-and-factions.md)）：若王城或主巢易主，設 `GameState.winner`；
否則 `month += 1`，回到內政階段，開始下一個月。

## 同時行動的提交 / 結算骨架

```
for phase in [DOMESTIC, INTELLIGENCE, MILITARY, COMBAT]:
    collect_submission(HUMAN, phase)     # 玩家手動
    collect_submission(MONSTER, phase)   # AI 自動 (07-ai-opponent)
    resolve(phase)                       # 收齊後一次性結算
advance_month_or_set_winner()
```

相關模型：`TurnState`、`TurnPhase`、`DomesticOrder`、`Deployment`、`IntelReport`、
`CombatReport`、`RandomEvent`（見 [`../schema/models.py`](../schema/models.py)）。
