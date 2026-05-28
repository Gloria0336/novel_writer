# 05 — 科技（人類）與進化（魔物）

兩方的成長都以 `TechNode`（[`../data/tech_tree.yaml`](../data/tech_tree.yaml)）表示，
以 `side` 與 `category` 區分，`prerequisites` 構成有向無環的解鎖圖，`effects` 為效果鍵值。
在內政階段以 `DomesticAction(type=RESEARCH)` 投入資源解鎖。

## 人類科技樹（`TechCategory`）

| 類別 | 範例節點 | 典型 effects |
|------|----------|--------------|
| `gene` 基因強化 | 強化基因 I/II | `hp_mult`, `attack_mult` |
| `weapon` 武器 | 精煉武器、魔法兵裝 | `attack_mult` |
| `fortification` 工事 | 城防強化 | `fortification_add`（提升己方據點工事倍率） |
| `recon` 偵察 | 斥候網、反偵察 | `intel_clarity`（提升情報清晰度，見 [08](08-intelligence-and-fog.md)） |
| `logistics` 後勤 | 行軍補給 | `movement`, `upkeep_reduction` |

效果如何套用：`*_mult` 乘進單位戰力（[04](04-units-and-combat.md)）；
`fortification_add` 加進 `MapNode.fortification`；`intel_clarity` 加進 `Faction.intel_clarity_bonus`。

## 魔物進化（`TechCategory.EVOLUTION`）

魔物方不走武器科技，而以 **魔物源** 解鎖進化節點，效果是**把新物種加入孵化池**
（`Faction.unlocked_species`）或強化既有物種：

| 進化節點 | prerequisites | effects |
|----------|---------------|---------|
| 哥布林群化 | — | 解鎖 `goblin`、`horde` 強化 |
| 半獸人化 | 哥布林群化 | 解鎖 `orc` |
| 召喚惡魔 | 半獸人化 | 解鎖 `demon` |
| 變異強化 | — | 全物種 `hp_mult` / `attack_mult` |

物種的 `evolves_to`（見 [`monsters.yaml`](../data/monsters.yaml)）與進化節點對應：
解鎖節點 → 該物種進入 `unlocked_species` → 內政階段可孵化。

## 為何資料 / 規則解耦

科技節點與其效果全在 YAML。要新增一條科技線（例如人類「煉金術」或魔物「不死化」），
只需在 `tech_tree.yaml` 增節點、在 `effects` 用既有鍵值；引擎讀 `effects` 套用，**不必改 schema**。
未知效果鍵值在平衡階段補進「效果套用表」即可。
