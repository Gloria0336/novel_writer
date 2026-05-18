import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { TroopCard } from "../types/card";
import { createInitialRift } from "../types/rift";
import { createTroopInstance } from "../turn/factories";

/**
 * 次元滲透裂縫（Rift）生命週期管理。
 *
 * 觸發點：
 *   - openRiftIfNeeded：在 case "stability" effect 結算後呼叫
 *   - tickRiftTremor：在 endTurnFor 末尾呼叫
 *   - vacateRiftIfOccupantDead：在 reapDeadTroops 末尾呼叫
 *   - tryPlayerOccupy：在 playTroopRift reducer action 內部呼叫
 */

/** 滲透體白名單（依回合數分階段池）。 */
export const RIFT_INFILTRATORS = ["M01", "M02", "M03", "M04", "M05", "M06"] as const;

/** 同卡上限。 */
export const RIFT_SAME_CARD_LIMIT = 2;

/** 佔據加成：ATK ×2、DEF +5、HP 不變。 */
export const RIFT_BUFF_ATK_MULTIPLIER = 2;
export const RIFT_BUFF_DEF_BONUS = 5;

/** 擊殺敵方滲透體獲得的鬥志（與一般 +15 互斥）。 */
export const MORALE_KILL_RIFT_INFILTRATOR = 10;

/**
 * 穩定度首次跌破 50 時開啟裂縫。
 * 已開啟（rift !== undefined）則 no-op，符合「永遠至多 1 個裂縫」「不可逆」原則。
 */
export function openRiftIfNeeded(state: BattleState): boolean {
  if (state.rift) return false; // 已開啟，no-op
  if (state.stability >= 50) return false; // 未跨閾值
  state.rift = createInitialRift();
  state.log.push({
    turn: state.turn,
    side: state.activeSide,
    kind: "RIFT_OPEN",
    text: "次元滲透裂縫開啟！場上中央出現裂痕，準備滲透。",
  });
  return true;
}

/**
 * 回合結束時 tick 倒數；歸 0 時觸發滲透。
 * 僅在 holder === "open" 且 tremorCountdown > 0 時遞減。
 */
export function tickRiftTremor(state: BattleState, ctx: BattleContext): void {
  const rift = state.rift;
  if (!rift) return;
  if (rift.holder !== "open") return;
  if (rift.tremorCountdown <= 0) return;

  rift.tremorCountdown -= 1;
  if (rift.tremorCountdown <= 0) {
    triggerInfiltration(state, ctx);
  }
}

/**
 * 從白名單依回合數選池並滲透 1 個敵方魔族單位到裂縫位。
 * 池規則：1–4 回合 [M01,M02] / 5–8 [M01–M04] / 9+ [M01–M06]
 * F08 enhanced 狀態：池往上一階。
 * 同卡上限 2 次。
 */
export function triggerInfiltration(state: BattleState, ctx: BattleContext): void {
  const rift = state.rift;
  if (!rift) return;
  if (rift.holder !== "open") return;

  const pool = selectInfiltratorPool(state);
  const candidates = pool.filter((id) => (rift.infiltrationsByCard[id] ?? 0) < RIFT_SAME_CARD_LIMIT);
  if (candidates.length === 0) {
    // 全部達上限，倒數歸 0 後不滲透，但也不重設（避免無限循環）
    state.log.push({
      turn: state.turn,
      side: "enemy",
      kind: "RIFT_INFILTRATE_SKIP",
      text: "次元裂縫震動，但同階滲透體已耗盡。",
    });
    rift.tremorCountdown = 1;
    return;
  }

  // 從 candidates 選 1 個（依 rngState 確定性選擇）— 使用 turn-based 簡易選擇
  const idx = state.turn % candidates.length;
  const cardId = candidates[idx]!;
  const card = ctx.getCard(cardId);
  if (card.type !== "troop") return;

  // 建立 troop instance 並標記 fromRift
  const inst = createTroopInstance(state, card as TroopCard, { suppressSummonSickness: true });
  inst.fromRift = true;
  applyRiftBuff(inst);

  rift.occupant = inst;
  rift.holder = "enemy";
  rift.tremorCountdown = 1;
  rift.infiltrationsByCard[cardId] = (rift.infiltrationsByCard[cardId] ?? 0) + 1;

  state.log.push({
    turn: state.turn,
    side: "enemy",
    kind: "RIFT_INFILTRATE",
    text: `滲透體 ${card.name} 從次元裂縫現身！`,
    payload: { cardId, instanceId: inst.instanceId, atk: inst.atk, def: inst.def, hp: inst.hp },
  });
}

/**
 * 依 turn 選擇可用池；enhanced 時池往上一階。
 */
export function selectInfiltratorPool(state: BattleState): string[] {
  const rift = state.rift;
  const enhanced = rift?.enhanced ?? false;
  const turn = state.turn;
  let tier: 0 | 1 | 2;
  if (turn <= 4) tier = 0;
  else if (turn <= 8) tier = 1;
  else tier = 2;
  if (enhanced && tier < 2) tier = (tier + 1) as 0 | 1 | 2;
  switch (tier) {
    case 0: return ["M01", "M02"];
    case 1: return ["M01", "M02", "M03", "M04"];
    case 2: return ["M01", "M02", "M03", "M04", "M05", "M06"];
  }
}

/**
 * 玩家透過 PLAY_TROOP_RIFT 主動佔據裂縫。
 * 呼叫端負責付費 / 棄手牌 / 建 instance；本函式只負責掛 buff 與更新 rift state。
 */
export function tryPlayerOccupy(state: BattleState, inst: TroopInstance): boolean {
  const rift = state.rift;
  if (!rift) return false;
  if (rift.holder !== "open") return false;
  applyRiftBuff(inst);
  rift.occupant = inst;
  rift.holder = "player";
  // 玩家佔據期間 tremorCountdown 暫停（不歸零，不 tick）
  state.log.push({
    turn: state.turn,
    side: "player",
    kind: "RIFT_OCCUPY",
    text: `玩家以 ${inst.cardId} 佔據次元裂縫！`,
    payload: { cardId: inst.cardId, instanceId: inst.instanceId, atk: inst.atk, def: inst.def },
  });
  return true;
}

/**
 * 佔據者陣亡時清空裂縫並重新開放滲透。
 * 在 reapDeadTroops 末尾呼叫（佔據者不在 troopSlots 內，需獨立清掃）。
 */
export function vacateRiftIfOccupantDead(state: BattleState): boolean {
  const rift = state.rift;
  if (!rift) return false;
  if (!rift.occupant) return false;
  if (rift.occupant.hp > 0) return false;

  const fallen = rift.occupant;
  rift.occupant = null;
  rift.holder = "open";
  rift.tremorCountdown = 1;
  state.log.push({
    turn: state.turn,
    side: state.activeSide,
    kind: "RIFT_VACATE",
    text: `${fallen.cardId} 在裂縫中陣亡，裂縫重歸 Open。`,
    payload: { cardId: fallen.cardId, instanceId: fallen.instanceId, fromRift: fallen.fromRift === true },
  });
  return true;
}

/** 套用裂縫加成（ATK ×2、DEF +5）— 進入裂縫時呼叫。 */
export function applyRiftBuff(inst: TroopInstance): void {
  // 確認尚未有 rift buff（避免重複套用）
  const existing = inst.buffs.find((b) => b.source === "RIFT_BUFF");
  if (existing) return;
  const atkDelta = inst.atk * (RIFT_BUFF_ATK_MULTIPLIER - 1);
  const defDelta = RIFT_BUFF_DEF_BONUS;
  inst.atk += atkDelta;
  inst.def += defDelta;
  inst.buffs.push({
    id: `rift_buff_${inst.instanceId}`,
    source: "RIFT_BUFF",
    mod: { atk: atkDelta, def: defDelta },
    remainingTurns: 9999,
  });
}

/** 移除裂縫加成（離開裂縫時呼叫）— 目前佔據者陣亡即移除實例，故此函式為防禦性 API。 */
export function removeRiftBuff(inst: TroopInstance): void {
  const idx = inst.buffs.findIndex((b) => b.source === "RIFT_BUFF");
  if (idx < 0) return;
  const buff = inst.buffs[idx]!;
  inst.atk = Math.max(0, inst.atk - (buff.mod.atk ?? 0));
  inst.def = Math.max(0, inst.def - (buff.mod.def ?? 0));
  inst.buffs.splice(idx, 1);
}
