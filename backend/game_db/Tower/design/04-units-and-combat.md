# 04 — 單位與戰鬥結算

## 單位

- 範本 `UnitTemplate`（人類來自 [`../data/units.yaml`](../data/units.yaml)；魔物由 `MonsterSpecies` 實例化）。
- 在局部隊以 `UnitStack`（`template_id` + `count` + 可選實例化數值）表示，駐於 `MapNode.garrison`。
- 核心數值：`attack`、`defense`、`hp`、`upkeep`（每月維持）、`cost`（招募成本）。

人類單位：少量、高 `attack`/`defense`/`hp`、高成本，可被科技乘算強化。
魔物單位：大量、低數值、低成本，靠 `count` 與特性（`horde`/`split`/...）堆出有效戰力。

## 一支部隊的有效戰力

```
elite_aura_atk = Π(同據點各菁英的 ally_attack_mult)   # 多名菁英倍率連乘，無菁英時 = 1
elite_aura_def = Π(同據點各菁英的 ally_defense_mult)

stack_attack  = count × attack  × (1 + 科技攻擊加成) × 特性修正 × elite_aura_atk
stack_defense = count × defense × (1 + 科技防禦加成) × 特性修正 × elite_aura_def
```

特性修正範例：`horde` 在 count 高時 +攻擊；`split` 提升 `defense`/有效 hp；
`amphibious` 在水 / 沼地形（節點 tag）額外加成。

`elite_aura_*` 為**同據點所有友方菁英光環倍率的連乘**（`EliteInstance` 的有效光環，見下）。
`ally_hp_mult` 類似地乘進守方有效 hp / 傷亡吸收。

## 菁英單位戰力與成長

菁英（`EliteTemplate` → 在局 `EliteInstance`）除了提供上面的光環，**本身也參戰**：其
`attack/defense` 併入所在據點的 `attacker_power` / `defender_power`。菁英的有效數值同時吃
**等級成長**與**科技 / 進化加成**：

```
lvl            = instance.level
eff_attack     = (template.attack + growth.attack_per_level × (lvl-1)) × (1 + 科技 attack_mult)
eff_aura_atk   = template.aura.ally_attack_mult + growth.aura_attack_mult_per_level × (lvl-1)
```

（`eff_defense`、`eff_hp`、其餘 aura 鍵同理。）菁英的特殊能力 `abilities` 在結算前後套修正，
例：`fear` → 該場守方 power ×0.9；`bless` → 同據點友軍有效 hp +x%；`aoe_spell` → 對進攻方
額外傷亡。具體鍵值由引擎效果套用表解讀，係數留待平衡階段。

**經驗值**：菁英參與一場戰鬥後依貢獻（面對的敵方 power / 造成傷亡）累積 `xp`；當
`xp ≥ template.xp_per_level × level` 時升級（最高 `template.max_level`），套用 `growth`。
菁英 `hp` 歸零視為**陣亡**：`EliteInstance.alive=False`、退出本局、計入 `CombatReport`。

## 戰鬥結算公式（確定性種子）

戰鬥發生在**軍事階段部屬完成後的「戰鬥結算」階段**，逐據點處理（見 [06](06-turn-and-phases.md)）。
單場戰鬥用子 seed：`combat_seed = derive_seed(master_seed, "combat", node_id, month)`。

對某個被攻擊的據點：

```
attacker_power = Σ 進攻方各 stack_attack
defender_power = Σ 守方各 stack_defense
              × fortification        # 據點工事倍率（王城最高，體現易守難攻）
              × terrain_defense       # 地形防禦加成 (NodeBonus.TERRAIN_DEFENSE)

roll_modifier  = f(combat_seed) ∈ [-R, +R]   # 由 seed 衍生的擲值波動
power_ratio    = attacker_power / (defender_power × (1 + roll_modifier))
```

判定（寫入 `CombatReport.outcome`，`CombatOutcome`）：

| power_ratio | 結果 | 說明 |
|-------------|------|------|
| ≥ 1.5 | `captured` | 攻方壓倒、佔領，守方重傷 |
| 1.0 ~ 1.5 | `captured` 或 `attrition` | 接近擲值決定；慘勝 |
| 0.6 ~ 1.0 | `attrition` | 攻方受挫但雙方消耗，據點不易主 |
| < 0.6 | `repelled` | 守方擊退，攻方重傷 |
| 雙方戰力都極低 | `stalemate` | 僵持、無顯著傷亡 |

傷亡按 `power_ratio` 與結果分配進 `attacker_casualties`/`defender_casualties`；
`captured` 時 `new_owner` = 攻方，觸發佔領獎勵（[03](03-economy-and-resources.md)）並更新 `MapNode.owner`。

## 過程呈現

戰鬥可拆成數個 `CombatRound`（逐回合 power 與傷亡），供前端 / 戰報「演算過程」呈現，
但最終結果由上面的整體公式決定，回合僅為敘事化拆解。所有數值源自同一 `combat_seed`，可重現。

相關模型：`UnitTemplate`、`UnitStack`、`EliteTemplate`、`EliteInstance`、`CombatReport`、`CombatRound`、`CombatOutcome`、`derive_seed`。
具體係數（R、傷亡比例、特性數值）留待平衡階段，本階段固定形狀與公式骨架。
