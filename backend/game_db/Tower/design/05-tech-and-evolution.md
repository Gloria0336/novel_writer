# 05 — 科技（人類）與進化 / 科研（魔物）

兩方的成長都以 `TechNode`（[`../data/tech_tree.yaml`](../data/tech_tree.yaml)）表示，
以 `side` 與 `category` 區分，`prerequisites` 構成有向無環的解鎖圖，`effects` 為效果鍵值。
在內政階段以 `DomesticAction(type=RESEARCH)` 投入資源解鎖。

## 人類科技樹（`TechCategory`）

| 類別 | 範例節點 | 典型 effects |
|------|----------|--------------|
| `gene` 基因強化 | 強化基因 I/II | `hp_mult`, `attack_mult` |
| `weapon` 武器 | 精煉武器 | `attack_mult` |
| `fortification` 工事 | 城防強化 | `fortification_add` |
| `recon` 偵察 | 斥候網、反偵察 | `intel_clarity`, `concealment` |
| `logistics` 後勤 | 行軍補給 | `movement`, `upkeep_reduction` |
| `engineering` 工程（新增）| 築城術、架橋術、地形工程、攻城器械 | `unlock_build_<kind>`, `build_speed`, `siege_mult` |

效果套用：`*_mult` 乘進單位戰力（[04](04-units-and-combat.md)）；
`fortification_add` 加進 `Structure.fortification`；`intel_clarity` 加進 `Faction.intel_clarity_bonus`；
`unlock_build_<kind>` 解鎖對應建造 / 地形改造動作（[11](11-construction-and-terraform.md)），
`build_speed` 縮短建造佇列工期，`siege_mult` 提升戰場攻城效率。

**菁英也吃科技加成**：`attack_mult` / `hp_mult` 同時乘進菁英本體數值（與菁英等級成長疊加）。

## 流派分支：互斥節點創造玩法多樣性（混合制新增）

為達成「自行發展科技樹創造複雜多變流派」的目標，科技 / 進化樹支援**互斥分支**：

- `TechNode.excludes[]`：解鎖某節點後，其互斥節點本局**永久鎖死**，逼玩家在路線間取捨。
- 範例（人類）：
  - 「**精兵流**」`gene` 深化（少量超強單位）⟂「**設防流**」`fortification`+`engineering`
    （築城鋪路、以地形與工事換戰場優勢）。
  - 「**偵刺流**」`recon`+`logistics`（高機動、情報壓制、繞後）⟂「**攻城流**」`engineering` 攻城器械。
- 範例（魔物）：`evolution` 走質（高階物種）⟂ `monster_research` 走量（群衝強化）的深層節點互斥。

互斥關係全在 YAML（`excludes`），引擎解鎖時檢查；新增 / 調整流派不必改 schema。
這讓同一棵樹依玩家選擇長出不同的「build」，配合連續地圖的建造改造，產生多變戰術。

---

## 魔物成長系統

魔物方有兩條平行的投資路線，皆以 **魔物源** 為主要資源：

| 路線 | TechCategory | 功能 |
|------|--------------|------|
| **進化樹** | `evolution` | 解鎖新物種加入孵化池（`unlock_species_<id>: 1`）|
| **科研列表** | `monster_research` | 全體或特定種族的數值強化，不解鎖新物種 |

### 五大種族群組（`RaceGroup`）

進化只在同 `race_group` 內發生；跨族群需分別解鎖對應 `_init` 節點。

| 種族 | race_group | 物種 | 進化鏈摘要 |
|------|-----------|------|-----------|
| 綠皮種族 | `greenskins` | 哥布林、精英哥布林、哥布林祭司、霍布地精、半獸人、河童、巨魔 | goblin → elite_goblin / goblin_shaman → hobgoblin → orc；kappa → troll |
| 血肉族 | `fleshes` | 史萊姆、元素史萊姆、特化史萊姆、觸手怪、歐布萊克斯、腐者 | slime → elemental_slime / specialized_slime → oblex；tentacle_beast → the_rotten / oblex |
| 獸族 | `fures` | 狼人、大腳怪、牛頭人、雪怪 | werewolf → bigfoot → yeti；werewolf → minotaur |
| 不死族 | `undeads` | 骷髏、殭屍、吸血鬼、木乃伊 | skeleton / zombie → vampire；zombie → mummy |
| 魔族 | `demons` | 惡魔、魅魔、炎魔 | demon → succubus → balrog |

### 進化樹節點範例

| 進化節點 | prerequisites | 主要 effects |
|----------|---------------|-------------|
| `evo_greenskin_init` 綠皮覺醒 | — | 解鎖 goblin、kappa |
| `evo_orc` 半獸人化 | evo_hobgoblin | 解鎖 orc + greenskin_attack_mult |
| `evo_oblex` 歐布萊克斯融合 | evo_tentacle **+** evo_elemental_slime | 解鎖 oblex（雙前置） |
| `evo_vampire` 吸血鬼化 | evo_undead_init | 解鎖 vampire + undead_hp_mult |
| `evo_balrog` 炎魔化 | evo_succubus | 解鎖 balrog + demon_attack_mult |

物種的 `evolves_to` 欄位（見 [`monsters.yaml`](../data/monsters.yaml)）標示進化方向，
與 tech 節點的 `unlock_species_*` 對應：解鎖節點 → 物種進入 `Faction.unlocked_species` → 內政階段可孵化。

### 科研列表節點範例

| 科研節點 | prerequisites | 主要 effects |
|----------|---------------|-------------|
| `res_dark_ritual` 暗黑儀式 | — | 全體 hp_mult +10% |
| `res_hellforge` 地獄熔爐 | res_dark_ritual | 全體 attack_mult + defense_mult |
| `res_horde_surge` 群衝戰術 | res_dark_ritual | 綠皮專屬 horde_bonus + attack_mult |
| `res_predator_fury` 掠奪狂怒 | res_dark_ritual | 獸族專屬 attack_mult + frenzy_threshold |
| `res_soul_harvest` 靈魂收割 | res_hellforge | 全體 attack + hp + upkeep 全面改善 |

種族專屬 effects 使用 `<race_group>_<stat>` 命名，如 `greenskin_horde_bonus`、`undead_hp_mult`，
由引擎套用時依物種的 `race_group` 篩選適用目標。

---

## 為何資料 / 規則解耦

科技節點與其效果全在 YAML。新增一條進化線（例如魔族的「深淵化」）
只需在 `tech_tree.yaml` 加節點、在 `monsters.yaml` 加物種；
新增一條科研線只需加 `monster_research` 節點；
**不必改 schema**（除非需要全新的 effect 語義）。
