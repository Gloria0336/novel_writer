"""Tower — 塔防佔點策略遊戲 的資料模型 (canonical schema).

這份檔案是整個遊戲的「資料模型唯一真理來源」。所有設計文件 (../design/*.md)
描述規則，本檔以 Pydantic v2 型別把規則的「資料形狀」固定下來。

本階段只定義 *資料形狀*，不含回合引擎 / 戰鬥演算法 / 地圖生成 / AI 邏輯。
那些演算法之後會以這些模型作為輸入輸出來實作。

設計原則
--------
- 全程確定性：所有隨機都源自 `GameState.master_seed`，再以 `derive_seed()`
  衍生子 seed（地圖生成、每場戰鬥、每次情報擲值、每個突發事件各有獨立子 seed）。
- 資料 / 規則解耦：魔物圖鑑、科技樹、單位、據點加成都來自 YAML（../data/*.yaml），
  以 *Catalog 模型載入後驗證；新增魔物 / 科技只需改 YAML，不必改 schema。
- 非對稱雙方：人類與魔物共用同一組模型，差異以 `enum` 與選填欄位表達。
"""

from __future__ import annotations

import hashlib
from enum import StrEnum

from pydantic import BaseModel, Field, NonNegativeFloat, NonNegativeInt, model_validator


# ---------------------------------------------------------------------------
# 確定性 seed 工具
# ---------------------------------------------------------------------------
def derive_seed(master_seed: str, *parts: str | int) -> str:
    """由 master seed 與一組標記衍生穩定的子 seed (hex)。

    例：derive_seed(gs.master_seed, "combat", node_id, gs.turn.month)
    同樣的輸入永遠得到同樣的輸出，保證整局可重現。
    """
    raw = "::".join([master_seed, *[str(p) for p in parts]])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


# ---------------------------------------------------------------------------
# 列舉
# ---------------------------------------------------------------------------
class Side(StrEnum):
    HUMAN = "human"      # 人類方（玩家）
    MONSTER = "monster"  # 魔物方（AI）


class NodeType(StrEnum):
    CAPITAL = "capital"      # 王城：唯一、易守難攻、被佔即敗
    CITY = "city"            # 城市 A~C：人類次要據點
    MAIN_NEST = "main_nest"  # 魔巢（主巢）：被佔人類即勝
    SUB_NEST = "sub_nest"    # 副巢：隸屬某個巢穴的次級節點
    TRIBE = "tribe"          # 部落：巢穴最外圍、最易被滲透
    NEUTRAL = "neutral"      # 中立地形：可爭奪，提供地圖加成


class TurnPhase(StrEnum):
    DOMESTIC = "domestic"          # 1. 內政階段
    INTELLIGENCE = "intelligence"  # 2. 情報階段
    MILITARY = "military"          # 3. 軍事階段（部屬）
    COMBAT = "combat"              # 4. 戰鬥結算


class ResourceKind(StrEnum):
    # 人類方
    COMBAT_RESOURCE = "combat_resource"  # 戰鬥資源：佔魔巢取得，投入研究 / 招募
    RESEARCH_POINT = "research_point"     # 研究點：內政分配產生，推進科技
    # 魔物方
    SLAVE = "slave"                       # 奴隸：佔人類城取得，可轉兵力或魔物源
    MONSTER_SOURCE = "monster_source"     # 魔物源：驅動孵化與進化


class BonusType(StrEnum):
    RESOURCE_YIELD = "resource_yield"     # 每月產出資源
    RECRUIT_RATE = "recruit_rate"         # 招募 / 孵化加速
    RESEARCH_RATE = "research_rate"       # 研究加速
    VISION = "vision"                     # 情報視野（降低迷霧）
    TERRAIN_DEFENSE = "terrain_defense"   # 地形防禦倍率
    MOVEMENT = "movement"                 # 行軍加成


class DomesticActionType(StrEnum):
    ALLOCATE = "allocate"   # 資源分配（轉換 / 投入）
    RESEARCH = "research"   # 科技研發 / 進化
    RECRUIT = "recruit"     # 產生兵力（招募 / 孵化）
    BUILD = "build"         # 建築


class TechCategory(StrEnum):
    GENE = "gene"                   # 基因強化（人類）
    WEAPON = "weapon"               # 武器
    FORTIFICATION = "fortification" # 工事
    RECON = "recon"                 # 偵察 / 反偵察
    EVOLUTION = "evolution"         # 進化（魔物）
    LOGISTICS = "logistics"         # 後勤 / 行軍


class DeployIntent(StrEnum):
    ATTACK = "attack"        # 沿邊進攻鄰接敵據點
    REINFORCE = "reinforce"  # 增援己方據點
    DEFEND = "defend"        # 留守強化本據點防禦
    HOLD = "hold"            # 駐紮（不動）


class CombatOutcome(StrEnum):
    CAPTURED = "captured"    # 攻方佔領
    REPELLED = "repelled"    # 守方擊退
    ATTRITION = "attrition"  # 雙方消耗、未易主
    STALEMATE = "stalemate"  # 僵持，無顯著傷亡


class RandomEventType(StrEnum):
    REINFORCEMENT = "reinforcement"  # 援軍 / 增援
    PLAGUE = "plague"                # 瘟疫 / 折損
    BETRAYAL = "betrayal"            # 倒戈 / 內亂
    RESOURCE_FIND = "resource_find"  # 資源發現
    TERRAIN_SHIFT = "terrain_shift"  # 地形變動（加成改變）
    MUTATION = "mutation"            # 魔物突變


# ---------------------------------------------------------------------------
# 基礎結構
# ---------------------------------------------------------------------------
class Position(BaseModel):
    """地圖上的座標（供前端佈局與距離計算）。"""
    x: float
    y: float


class NodeBonus(BaseModel):
    """某據點 / 地形提供的加成效果。"""
    type: BonusType
    magnitude: float = Field(description="加成量；倍率類用 1.0=無、1.5=+50%，產出類為絕對值")
    resource: ResourceKind | None = Field(default=None, description="當 type=RESOURCE_YIELD 時指明資源種類")
    description: str = ""


# ---------------------------------------------------------------------------
# 圖鑑（由 YAML 載入後驗證；資料 / 規則解耦）
# ---------------------------------------------------------------------------
class MonsterSpecies(BaseModel):
    """魔物物種定義（../data/monsters.yaml）。"""
    id: str
    name: str
    base_attack: NonNegativeFloat
    base_defense: NonNegativeFloat
    base_hp: NonNegativeFloat
    upkeep: NonNegativeFloat = Field(default=0, description="每月維持成本（魔物源）")
    slave_cost: NonNegativeInt = Field(default=0, description="以奴隸孵化所需數量")
    monster_source_cost: NonNegativeFloat = Field(default=0, description="以魔物源孵化所需數量")
    evolves_to: list[str] = Field(default_factory=list, description="可進化成的物種 id")
    traits: list[str] = Field(default_factory=list, description="特性標籤，如 amphibious / split / horde")
    description: str = ""


class UnitTemplate(BaseModel):
    """單位範本（人類單位來自 ../data/units.yaml；魔物單位由物種實例化）。"""
    id: str
    name: str
    side: Side
    attack: NonNegativeFloat
    defense: NonNegativeFloat
    hp: NonNegativeFloat
    upkeep: NonNegativeFloat = 0
    cost: dict[ResourceKind, float] = Field(default_factory=dict, description="招募成本")
    species_id: str | None = Field(default=None, description="魔物單位對應的物種 id")
    abilities: list[str] = Field(default_factory=list)


class TechNode(BaseModel):
    """科技 / 進化節點（../data/tech_tree.yaml）。"""
    id: str
    name: str
    category: TechCategory
    side: Side
    cost: dict[ResourceKind, float] = Field(default_factory=dict)
    prerequisites: list[str] = Field(default_factory=list, description="需先解鎖的 tech id")
    effects: dict[str, float] = Field(
        default_factory=dict,
        description="效果鍵值，如 {'attack_mult': 1.1, 'intel_clarity': 0.15}",
    )
    description: str = ""


class Catalog(BaseModel):
    """所有 YAML 圖鑑載入後的彙整，作為一局遊戲的靜態規則資料。"""
    monsters: dict[str, MonsterSpecies] = Field(default_factory=dict)
    units: dict[str, UnitTemplate] = Field(default_factory=dict)
    techs: dict[str, TechNode] = Field(default_factory=dict)
    node_bonus_templates: dict[str, list[NodeBonus]] = Field(
        default_factory=dict, description="據點類型 / 地形 → 預設加成組合"
    )


# ---------------------------------------------------------------------------
# 在局實例：兵力、據點、地圖
# ---------------------------------------------------------------------------
class UnitStack(BaseModel):
    """某據點上的一支同類部隊（實例）。"""
    template_id: str
    count: NonNegativeInt
    # 實例化後的當前數值（含科技 / 加成修正後）；None 表示沿用範本基礎值。
    attack: NonNegativeFloat | None = None
    defense: NonNegativeFloat | None = None
    hp: NonNegativeFloat | None = None


class MapNode(BaseModel):
    """地圖上的一個網狀據點。"""
    id: str
    name: str
    node_type: NodeType
    owner: Side | None = Field(default=None, description="None = 中立未佔")
    position: Position
    fortification: float = Field(default=1.0, description="工事倍率，套在守方防禦上；王城最高")
    garrison: list[UnitStack] = Field(default_factory=list, description="駐軍")
    bonuses: list[NodeBonus] = Field(default_factory=list)
    parent_nest_id: str | None = Field(
        default=None, description="副巢 / 部落 所屬的主巢 id，用於『巢穴=部落+副巢叢集』結構"
    )
    tags: list[str] = Field(default_factory=list)


class Edge(BaseModel):
    """無向鄰接邊；攻擊 / 行軍只能沿邊發生。"""
    a: str
    b: str
    travel_cost: float = 1.0

    @model_validator(mode="after")
    def _no_self_loop(self) -> Edge:
        if self.a == self.b:
            raise ValueError(f"edge 不可自連: {self.a}")
        return self


class MapGenConfig(BaseModel):
    """種子碼程序生成地圖的參數（演算法見 design/02-map-generation.md）。"""
    seed: str
    human_cities: int = Field(default=3, ge=0, description="王城以外的城市數")
    monster_nests: int = Field(default=3, ge=1, description="主巢數（含 1 個可勝利的魔巢）")
    sub_nests_per_nest: tuple[int, int] = Field(default=(1, 3), description="每巢副巢數範圍 (min,max)")
    tribes_per_nest: tuple[int, int] = Field(default=(2, 4), description="每巢部落數範圍 (min,max)")
    neutral_nodes: int = Field(default=4, ge=0)
    extra_edge_ratio: float = Field(
        default=0.25, ge=0, description="在生成樹之上額外加邊的比例，決定網狀程度"
    )


# ---------------------------------------------------------------------------
# 階段提交物（同時行動：雙方各自提交，系統收齊後結算）
# ---------------------------------------------------------------------------
class DomesticAction(BaseModel):
    """內政階段的單一動作。"""
    type: DomesticActionType
    target_id: str | None = Field(default=None, description="tech id / unit 範本 id / 建築型別 / 據點 id")
    node_id: str | None = Field(default=None, description="動作發生的據點（招募 / 建築 / 分配）")
    quantity: float = Field(default=1, description="數量 / 投入量")
    payload: dict[str, float] = Field(default_factory=dict, description="補充參數，如資源轉換比例")


class DomesticOrder(BaseModel):
    """某方在內政階段提交的整批動作。"""
    side: Side
    month: int
    actions: list[DomesticAction] = Field(default_factory=list)


class Building(BaseModel):
    """建築實例（內政階段 BUILD 產生）。"""
    id: str
    name: str
    node_id: str
    level: int = 1
    bonuses: list[NodeBonus] = Field(default_factory=list)


class TroopMovement(BaseModel):
    """軍事階段：一支部隊的部屬。"""
    from_node: str
    to_node: str
    intent: DeployIntent
    units: list[UnitStack] = Field(default_factory=list)

    @model_validator(mode="after")
    def _attack_moves(self) -> TroopMovement:
        if self.intent in (DeployIntent.DEFEND, DeployIntent.HOLD) and self.from_node != self.to_node:
            raise ValueError("DEFEND/HOLD 的 from_node 與 to_node 必須相同")
        return self


class Deployment(BaseModel):
    """某方在軍事階段提交的整批部屬。"""
    side: Side
    month: int
    movements: list[TroopMovement] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# 情報（戰爭迷霧）
# ---------------------------------------------------------------------------
class IntelReport(BaseModel):
    """情報階段產出的一份對敵觀測；可能模糊或錯誤。

    清晰度 clarity ∈ [0,1]：由偵察科技 + 視野加成決定。
    - clarity 高 → observed_* 接近真值、is_accurate 多為真、range 區間窄。
    - clarity 低 → 數值被加噪、區間放寬，甚至 is_accurate=False（整份誤導）。
    """
    observer: Side
    target_node_id: str
    month: int
    clarity: float = Field(ge=0, le=1)
    is_accurate: bool = Field(default=True, description="False 表示這份情報整體被誤導")
    observed_owner: Side | None = None
    observed_garrison_range: tuple[int, int] = Field(
        default=(0, 0), description="估計駐軍數量區間；clarity 越低區間越寬"
    )
    observed_intents: list[DeployIntent] = Field(
        default_factory=list, description="推測對方在此據點的意圖（可能含雜訊）"
    )
    seed: str = Field(default="", description="本份情報擲值所用子 seed")
    notes: str = ""


# ---------------------------------------------------------------------------
# 戰鬥結算與突發事件
# ---------------------------------------------------------------------------
class CombatRound(BaseModel):
    """戰鬥過程中的一個回合（供戰報逐步呈現）。"""
    index: int
    attacker_power: float
    defender_power: float
    roll_modifier: float = Field(default=0, description="由 seed 衍生的擲值修正")
    attacker_losses: float = 0
    defender_losses: float = 0
    note: str = ""


class CombatReport(BaseModel):
    """單一據點的一場戰鬥結算結果。"""
    node_id: str
    month: int
    attacker: Side
    defender: Side | None
    attacker_power: float
    defender_power: float
    fortification: float = 1.0
    terrain_defense: float = 1.0
    rounds: list[CombatRound] = Field(default_factory=list)
    outcome: CombatOutcome
    attacker_casualties: int = 0
    defender_casualties: int = 0
    new_owner: Side | None = None
    seed: str = ""


class RandomEvent(BaseModel):
    """戰鬥結算階段觸發的突發事件。"""
    id: str
    type: RandomEventType
    month: int
    affected_nodes: list[str] = Field(default_factory=list)
    affected_side: Side | None = None
    effects: dict[str, float] = Field(default_factory=dict)
    description: str = ""
    seed: str = ""


# ---------------------------------------------------------------------------
# 陣營與整局狀態
# ---------------------------------------------------------------------------
class ResourcePool(BaseModel):
    """某陣營的資源存量；雙方共用同模型，只用到各自相關的鍵。"""
    amounts: dict[ResourceKind, float] = Field(default_factory=dict)

    def get(self, kind: ResourceKind) -> float:
        return self.amounts.get(kind, 0.0)


class Faction(BaseModel):
    side: Side
    name: str
    resources: ResourcePool = Field(default_factory=ResourcePool)
    researched_techs: list[str] = Field(default_factory=list)
    unlocked_species: list[str] = Field(default_factory=list, description="魔物方已解鎖可孵化的物種")
    intel_clarity_bonus: float = Field(default=0.0, description="偵察科技累積的情報清晰度加成")
    is_ai: bool = False


class TurnState(BaseModel):
    month: int = Field(default=1, ge=1, description="第幾個月（每輪=一個月）")
    phase: TurnPhase = TurnPhase.DOMESTIC
    # 同時行動：各方該階段的提交，系統收齊後一次結算。
    domestic_orders: dict[Side, DomesticOrder] = Field(default_factory=dict)
    deployments: dict[Side, Deployment] = Field(default_factory=dict)
    intel_reports: list[IntelReport] = Field(default_factory=list)

    def all_submitted(self, what: dict[Side, object]) -> bool:
        return Side.HUMAN in what and Side.MONSTER in what


class GameState(BaseModel):
    """一局遊戲的完整可序列化狀態。"""
    master_seed: str
    turn: TurnState = Field(default_factory=TurnState)
    factions: dict[Side, Faction] = Field(default_factory=dict)
    nodes: dict[str, MapNode] = Field(default_factory=dict)
    edges: list[Edge] = Field(default_factory=list)
    buildings: dict[str, Building] = Field(default_factory=dict)
    map_config: MapGenConfig | None = None
    combat_log: list[CombatReport] = Field(default_factory=list)
    event_log: list[RandomEvent] = Field(default_factory=list)
    winner: Side | None = Field(default=None, description="None=進行中")

    def neighbors(self, node_id: str) -> list[str]:
        out: list[str] = []
        for e in self.edges:
            if e.a == node_id:
                out.append(e.b)
            elif e.b == node_id:
                out.append(e.a)
        return out
