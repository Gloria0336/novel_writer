# 04 — 單位與戰鬥

> 混合制改造（[09](09-hybrid-redesign-plan.md)）：單位數值模型沿用，但**戰鬥從「逐據點一條公式」
> 改為即時戰術戰鬥**。本文件定義單位數值與戰力構成；即時戰鬥的完整規格見 [10](10-tactical-combat.md)。
> **不保留整體戰力公式作快速結算**——所有戰鬥皆走即時引擎（玩家陣型半自動，或 AI 自動）。

## 單位

- 範本 `UnitTemplate`（人類來自 [`../data/units.yaml`](../data/units.yaml)；魔物由 `MonsterSpecies` 實例化）。
- 戰略層以 `UnitStack`（`template_id` + `count` + 可選實例化數值）表示，駐於 `Structure.garrison`
  或隨 `Army` 移動。
- 核心數值：`attack`、`defense`、`hp`、`range`、`move_speed`、`upkeep`（每月維持）、`cost`（招募成本）。
  （`range` / `move_speed` 為即時戰術新增欄位；舊存檔預設近戰 / 標準速。）

人類單位：少量、高 `attack`/`defense`/`hp`、高成本，可被科技乘算強化。
魔物單位：大量、低數值、低成本，靠 `count` 與特性（`horde`/`split`/`amphibious`/...）堆出有效戰力。

## 戰略層 → 戰術層的展開

戰鬥在 COMBAT 階段於接戰地點發生（[06](06-turn-and-phases.md)）。引擎把參戰的戰略單位展開為戰術實體：

- 一個 `UnitStack(count=N)` 展開為 N（或依規模上限縮放）個 `TacticalUnit`，編成一個 **unit group**。
- 菁英展開為單一強力 `TacticalUnit` + 範圍光環效果。
- 各 `TacticalUnit` 的**初始數值**承接以下所有加成（與舊公式相同的乘算來源，只是套在單位身上）：

```
科技修正      = (1 + 科技 attack_mult) 等，依 side / race_group 篩選（05）
特性修正      = horde / split / amphibious… 依地形 tag 與 count 觸發（見下）
菁英光環      = 同群 / 範圍內友方菁英 aura 連乘（ally_attack_mult / ally_defense_mult / ally_hp_mult）
unit.attack   = template.attack  × 科技修正 × 特性修正 × elite_aura_atk
unit.defense  = template.defense × 科技修正 × 特性修正 × elite_aura_def
unit.hp       = template.hp      × 科技修正 × 特性修正 × elite_aura_hp
```

特性修正範例：`horde` 在同群數量高時 +攻擊；`split` 受擊時分裂 / 提升有效 hp；
`amphibious` 在 water / swamp 地塊（戰場地形）額外加成。

## 菁英單位戰力與成長

菁英（`EliteTemplate` → 在局 `EliteInstance`）在戰場上是**單一強力單位**，並對範圍內友軍提供光環：

```
lvl            = instance.level
eff_attack     = (template.attack + growth.attack_per_level × (lvl-1)) × (1 + 科技 attack_mult)
eff_aura_atk   = template.aura.ally_attack_mult + growth.aura_attack_mult_per_level × (lvl-1)
```

（`eff_defense`、`eff_hp`、其餘 aura 鍵同理。）菁英 `abilities` 在戰場上**即時觸發 / 範圍作用**，例：
`fear` → 範圍內敵單位攻速 / 攻擊降；`bless` → 範圍內友軍回復 / 有效 hp +x%；`aoe_spell` → 範圍即時傷害。
具體鍵值由戰術引擎效果套用表解讀（[10](10-tactical-combat.md)），係數留待平衡階段。

**經驗值**：菁英參與一場戰鬥後依貢獻（造成傷亡 / 面對敵方規模）累積 `xp`；當
`xp ≥ template.xp_per_level × level` 時升級（最高 `template.max_level`），套用 `growth`。
菁英 `hp` 在戰場歸零視為**陣亡**：`EliteInstance.alive=False`、退出本局、計入 `BattleResult`。

## 戰鬥：即時戰術（取代舊整體公式）

戰鬥發生在 COMBAT 階段、接戰地點切出的 `BattleMap` 上，採**固定步長 + seeded 確定性**模擬
（`battle_seed = derive_seed(master_seed, "battle", coord, month, battle_index)`）。完整規格見
[10-tactical-combat](10-tactical-combat.md)，要點：

- **操控**：玩家下 unit-group 層級指令（陣型 / 移動 / 攻擊 / 技能），單位半自動執行；
  `AUTO_RESOLVE` 由戰術 AI 在**同一引擎**下令（不想微操時用）。
- **戰場吃地形與建設**：先前 `FORTIFY` 的 `wall`/`moat`、`BUILD_BRIDGE` 的橋、`TERRAFORM` 改過的
  地形，都會出現在 `BattleMap` 上，直接影響戰術（[11](11-construction-and-terraform.md)）。
- **結束與回填**：一方全滅 / 潰逃 / 攻方攻破結構 / 達時限 → 輸出 `BattleResult`：各 group 存活數
  折回 `UnitStack.count`、菁英 hp / 陣亡 / xp、結構是否易主（→ 佔領獎勵，[03](03-economy-and-resources.md)）。
- **確定性**：`battle_seed` + 指令序列 → 可完整重播（`BattleReplay`），供戰報 / AI 對戰。

相關模型：`UnitTemplate`、`UnitStack`、`EliteTemplate`、`EliteInstance`、`TacticalUnit`、
`TacticalBattle`、`BattleMap`、`BattleResult`、`BattleReplay`、`derive_seed`。
具體係數（傷害 / 命中 / 士氣 / 特性數值）留待平衡階段，本階段固定形狀與規格骨架。
