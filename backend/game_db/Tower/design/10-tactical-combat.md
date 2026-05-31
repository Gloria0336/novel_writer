# 10 — 戰術即時戰鬥規格

> 混合制（[09](09-hybrid-redesign-plan.md)）戰術層的完整規格。戰鬥內嵌在戰略回合的 COMBAT 階段
> （[06](06-turn-and-phases.md)），單位數值來源見 [04](04-units-and-combat.md)。
> 設計定案：**hex 地塊、陣型半自動操控、保留確定性、無整體公式備援**。

## 1. 觸發與戰場切割

COMBAT 階段，引擎找出每個**接戰點**（敵對軍團同地塊 / 控制範圍重疊 / 圍攻結構），各生成一場
`TacticalBattle`：

- 從接戰地點周邊切出 `BattleMap`：一塊 hex 子網格，承接該區的 `terrain_type` / `elevation` /
  `features`（含 `road` / `bridge` / `wall` / `moat` 與被攻結構的工事）。
- 攻 / 守初始佈署區依進攻方向決定；守方靠近被攻結構，攻方從進軍邊緣進入。
- `battle_seed = derive_seed(master_seed, "battle", coord, month, battle_index)`。

## 2. 單位與群（group）

- 戰略 `UnitStack(count=N)` → N（或依 `max_battle_units` 縮放）個 `TacticalUnit`，編成一個 **group**。
- 菁英 → 單一強力 `TacticalUnit` + 範圍光環。
- `TacticalUnit`：`id, group_id, pos(hex/連續座標), hp, attack, defense, range, move_speed,
  state(idle/move/attack/use_ability/flee), facing, traits[]`。
- 初始數值套用科技 / 特性 / 菁英光環（[04](04-units-and-combat.md) 的展開公式）。

## 3. 操控模型：陣型半自動

玩家 / AI 都下 **group 層級指令**，群內單位由引擎半自動執行（保持陣型、自動索敵接戰）：

| 指令 | 參數 | 行為 |
|------|------|------|
| `SET_FORMATION` | shape, facing, spacing | 設定群陣型與朝向（線陣 / 楔形 / 散開…）|
| `MOVE_TO` | coord | 全群保持陣型移動到目標（hex 尋路）|
| `ATTACK` | target group / structure | 接近並攻擊目標，自動分配火力 |
| `USE_ABILITY` | ability_id, target | 施放菁英 / 群技能（受冷卻）|
| `HOLD` | — | 原地戍守、只反擊 |
| `RETREAT` | edge | 向己方邊緣撤退（保存兵力）|

- `INTERACTIVE`：玩家即時下這些指令。
- `AUTO_RESOLVE`：戰術 AI（[07](07-ai-opponent.md)）下**相同型別**指令；無另一條公式路徑。

## 4. 模擬迴圈（固定步長、確定性）

```
init：佈署兩方 group、套初始數值、reset battle_seed RNG
loop tick (dt 固定，如 1/20s)：
  1. apply_commands(tick)         # 玩家或 AI 在此 tick 下達 / 變更的 group 指令
  2. for unit in units:
       - 依 group 指令更新 state（移動 / 索敵 / 進入攻擊距離 / 施技 / 潰逃）
       - 移動：hex 尋路 + 陣型維持 + 地形 move_speed 修正
  3. resolve_combat(tick)：
       - 在攻擊距離內的單位依 attack 冷卻造成傷害
       - 命中 / 暴擊 / 傷害波動由 battle_seed 衍生（確定性）
       - 套地形 / 工事修正（守 wall/moat/高 elevation → defense↑；橋頭瓶頸限展開）
       - 套菁英 abilities 範圍效果（fear 降敵攻速、bless 回友軍、aoe_spell 範圍傷害）
       - 特性：horde（密集 +攻）、split（受擊分裂）、amphibious（水/沼 +）、regen（回血）
  4. morale(tick)：傷亡比 / 失去菁英 / 被包夾 → 士氣下降，過閾值 group 進 flee
  5. record BattleEvent[]（位置 / 傷害 / 死亡 / 施技 / 潰逃）
  6. check_end()
```

### 結束條件
一方全滅 / 全員潰逃 / 攻方攻破被攻結構（守軍清空或工事歸零）/ 達 `max_ticks` 時限。
時限到時依場上殘存戰力與佔位判定 `attrition` / `stalemate` / `captured`。

## 5. 結果回填（`BattleResult`）

- 各 group 存活單位數 → 折回對應 `UnitStack.count`（按比例；歸零則該 stack 消滅）。
- 菁英：更新 `EliteInstance.hp`、`alive`、依貢獻累積 `xp`（可能升級）。
- 結構：被攻破 → `Structure.owner` = 攻方 + 其控制地塊易主 → 佔領獎勵（[03](03-economy-and-resources.md)）。
- 輸出 `outcome ∈ {captured, attrition, repelled, stalemate}`、傷亡明細、是否易主。
- 存 `BattleReplay`（`battle_seed` + 指令序列 + 可選 BattleEvent 摘要）供前端重播與戰報。

## 6. 確定性保證

- **固定步長**：邏輯幀與畫面解耦，模擬只依 tick 推進。
- **單一亂數源**：所有命中 / 暴擊 / 波動皆 `derive_seed(battle_seed, ...)` 衍生，不用系統時間 / 浮點不確定運算（或約定固定運算順序）。
- **可重現**：相同 `battle_seed` + 相同指令序列 → 相同結果。AUTO 與 INTERACTIVE 共用同引擎，
  差別只在指令來源。

## 7. 效能與規模

- `max_battle_units`（單場上限，建議數百）控制規模；超出時 `UnitStack` 以縮放比例展開
  （1 個 TacticalUnit 代表 k 個戰略單位，傷亡按比例折算）。
- 數值留待 M4 壓測定案（[09](09-hybrid-redesign-plan.md) §9）。

相關模型：`TacticalBattle`、`BattleMap`、`TacticalUnit`、`UnitGroup`、`BattleCommand`、
`BattleEvent`、`BattleResult`、`BattleReplay`、`ResolveMode`、`derive_seed`。
