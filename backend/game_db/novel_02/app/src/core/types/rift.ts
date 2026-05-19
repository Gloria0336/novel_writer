import type { TroopInstance } from "./battle";

/**
 * 次元滲透裂縫（Rift Slot）— v3.3 雙刃資源機制。
 *
 * 設計規格詳見 `backend/game_db/novel_02/rift_slot_design_v1.md`。
 * 摘要：
 *   - 穩定度首次跌破 50 時開啟，不可逆，場上至多 1 個
 *   - 三態：open / player / enemy
 *   - Open 時倒數至 0 自動滲透（從 T_s_35–T_s_40 抽取，依回合數分階段池）
 *   - 佔據加成（敵我對稱）：ATK ×2、DEF +5、HP 不變
 *   - 佔據者陣亡 → 重歸 Open、倒數重設
 *   - 內戰模式停用
 */
export type RiftHolder = "open" | "player" | "enemy";

export interface RiftState {
  /** 三態：open / player / enemy。 */
  holder: RiftHolder;
  /** 佔據兵力實例；open 時為 null。 */
  occupant: TroopInstance | null;
  /** 倒數至下次滲透（open 時 ≥ 0，被佔據時暫停 / 不 tick）。 */
  tremorCountdown: number;
  /** F_c_08「加強裂縫」狀態；true 時敵方滲透體抽取池往上一階、玩家佔據者獲〔穿透〕。 */
  enhanced: boolean;
  /** 同卡 T_s_35–T_s_40 在本場戰鬥的滲透次數（上限 2）。 */
  infiltrationsByCard: Record<string, number>;
  /** S_c_15「裂痕召喚」玩家使用次數（上限 3）。 */
  s15UsesPlayer: number;
  /** S_c_16「裂縫共鳴」玩家已用標記（上限 1）。 */
  s16UsedPlayer: boolean;
}

/** 預設初始狀態：剛跨 50 線開啟時使用。 */
export function createInitialRift(): RiftState {
  return {
    holder: "open",
    occupant: null,
    tremorCountdown: 1, // 開啟當回合震動告示，下一回合結束滲透
    enhanced: false,
    infiltrationsByCard: {},
    s15UsesPlayer: 0,
    s16UsedPlayer: false,
  };
}
