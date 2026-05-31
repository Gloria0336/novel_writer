# 03 — 經濟與資源

雙方資源以 `ResourcePool.amounts`（鍵為 `ResourceKind`）表示，但**各用各的**——
非對稱經濟是兩種玩法風格的根源。

## 人類經濟：質

| 資源 (`ResourceKind`) | 取得 | 用途 |
|-----------------------|------|------|
| `combat_resource` 戰鬥資源 | **佔領魔巢 / 巢穴節點**、`resource_yield` 據點每月產出 | 招募精兵、推進科技 |
| `research_point` 研究點 | 內政階段以戰鬥資源 / 據點加成轉換產生 | 解鎖科技樹節點 |

人類資源稀缺、單位昂貴：玩法是**精打細算地把有限資源投到關鍵科技與少量精兵**。

## 魔物經濟：量

| 資源 (`ResourceKind`) | 取得 | 用途 |
|-----------------------|------|------|
| `slave` 奴隸 | **佔領人類城 / 王城** | 二選一轉換（見下） |
| `monster_source` 魔物源 | 由奴隸轉換、`resource_yield` 巢穴每月產出 | 孵化單位、解鎖進化 |

### 奴隸轉換（魔物方核心抉擇）

佔領人類城取得奴隸後，內政階段 `ALLOCATE` 動作二選一：

1. **奴隸 → 兵力**：直接孵化大量低階雜兵（走量、即戰力）。
2. **奴隸 → 魔物源**：轉成魔物源，投入進化 / 高階孵化（走質、長線）。

這讓魔物 AI 有「滾雪球壓制」與「升級質變」兩種路線（見 [07-ai-opponent](07-ai-opponent.md)）。

## 佔領獎勵總表

| 佔領者 | 佔領目標 | 立即獎勵 |
|--------|----------|----------|
| 人類 | 魔巢 / 副巢 / 部落 | 戰鬥資源（主巢 > 副巢 > 部落） |
| 魔物 | 王城 / 城市 | 奴隸（王城 >> 城市） |

## 每月產出（內政階段結算）

每月在內政階段，依**己方控制的據點**累加 `resource_yield` 加成，
再乘上相關 `recruit_rate` / `research_rate` 加成。產出公式：

```
本月某資源產出 = Σ(己方據點該資源的 resource_yield.magnitude)
              × (1 + Σ 相關 rate 加成)
```

## 建造成本與佇列（混合制新增）

[11](11-construction-and-terraform.md) 的建築 / 鋪路 / 造橋 / 設防 / 地形改造動作，於內政階段
提交時**先扣資源**（人類用 `combat_resource`、魔物用 `monster_source`），並進**建造佇列**
`ConstructionProject`（`cost / turns_remaining`），跨月完成：

```
提交（DOMESTIC）：扣 cost → 入佇列（turns_remaining = 範本工期）
每月 RESOLVE：    turns_remaining -= 1；歸零 → 套用到地塊 / 結構
```

- 建造佔用資源預算，與招募 / 研究競爭，形成「擴張 vs 軍備 vs 科技」的取捨。
- 完工的道路 / 橋 / 城牆 / 地形改造會改變移動、加成與**未來戰場地形**（回收於戰術層）。
- 工期 / 成本表由 `data` 範本定，具體數值留待平衡階段。

相關模型：`ResourcePool`、`ResourceKind`、`NodeBonus`、`DomesticAction`、`ConstructionProject`
（見 [`../schema/models.py`](../schema/models.py)）。轉換 / 成本比例放在 `DomesticAction.payload`，
具體數值表待平衡階段填入，本階段只固定資料形狀。
