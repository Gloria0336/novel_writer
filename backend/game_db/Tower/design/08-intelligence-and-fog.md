# 08 — 情報與戰爭迷霧

同時行動的核心張力來自**資訊不對稱**：雙方在內政 / 軍事階段的命令彼此不可見，
唯一的窺探管道是**情報階段**，而情報**會模糊、會出錯**。

> 混合制（[09](09-hybrid-redesign-plan.md)）：連續地圖下，視野以**地塊視野半徑**揭露——己方結構 /
> 軍團 / `vision` 加成地塊各有半徑，半徑內地塊解除迷霧；半徑外只能靠情報階段探查。
> 探查目標由「節點」改為「地塊 / 結構 / 敵軍團」，其餘 clarity / 加噪 / 誤導規則不變。

## 清晰度 clarity

每份 `IntelReport` 有 `clarity ∈ [0,1]`，決定情報品質。由探查方的能力與目標環境共同決定：

```
clarity = clamp(
    base_recon                       # 基礎偵察值
  + faction.intel_clarity_bonus      # 偵察科技累積 (recon 科技, effects.intel_clarity)
  + observer_vision_bonus            # 己方視野半徑內結構 / VISION 加成地塊的覆蓋程度
  - distance_falloff                 # 目標距己方視野源越遠，clarity 越低
  - target_concealment               # 目標地形隱蔽（森林 / 密道）/ 對方反偵察科技
  , 0, 1)
```

- `clarity` 高 → 觀測值接近真值、區間窄、`is_accurate` 多為真。
- `clarity` 低 → 數值被加噪、`observed_garrison_range` 放寬，甚至 `is_accurate=False`（整份誤導）。

## 情報如何生成（確定性）

用子 seed：`intel_seed = derive_seed(master_seed, "intel", observer, target_node_id, month)`，
保證可重現。流程：

1. 取目標真值（守軍數、擁有者、推測意圖）。
2. **是否誤導**：以 `intel_seed` 擲值，機率隨 `(1 - clarity)` 上升；命中則 `is_accurate=False`，
   產出一份系統性偏離真值的假報告（例：低報守軍、誤判意圖）。
3. **加噪 / 模糊**：即使 accurate，也對守軍數套上 ±噪聲後給出 `observed_garrison_range`
   區間，寬度隨 `(1 - clarity)` 放大；`observed_intents` 可能漏列或多列。
4. 寫入 `clarity / is_accurate / observed_* / seed` 到 `IntelReport`。

## 對玩家與 AI 的意義

- 玩家看到的是**區間與機率**，不是確值——要在不確定下決定軍事階段如何部署。
- 提升偵察科技（[05](05-tech-and-evolution.md)）、佔領 / 建造 `VISION` 加成地塊（瞭望塔、高地，
  [02](02-map-generation.md)）擴大視野半徑，可系統性提高 clarity，是一條有意義的投資路線。
- AI 同樣受此限制（[07](07-ai-opponent.md)），會依（可能錯誤的）情報部署，因此會犯可被玩家利用的錯。

## 反偵察

`recon` 科技與某些地形 / 加成提供 `target_concealment`，降低敵方對己方的 clarity——
攻守雙方都能投資情報戰。

相關模型：`IntelReport`、`BonusType.VISION`、`Faction.intel_clarity_bonus`、
`TechCategory.RECON`、`derive_seed`（見 [`../schema/models.py`](../schema/models.py)）。
具體 base/noise/誤導機率曲線留待平衡階段。
