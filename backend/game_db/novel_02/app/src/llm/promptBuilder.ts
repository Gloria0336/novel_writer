import type { BattleState, TroopInstance, SideState } from "../core/types/battle";
import type { BattleContext } from "../core/types/context";
import type { GameAction } from "../core/turn/actions";
import { buildCardFaceModel } from "../game/cardPresentation";
import { describeAction } from "./playerEnumerate";

export interface BuiltPrompt {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = [
  "你正在扮演卡牌遊戲《星落戰紀》的玩家方。",
  "你會收到當前戰場 JSON 與一份合法動作清單，你必須從清單中挑選一個動作執行。",
  "目標：在敵方擊敗你之前，將敵方英雄 HP 打到 0；或維持穩定度（stability）避免崩潰。",
  "決策原則：",
  "  1. 優先使用兵力優先制，留意 guard / taunt / menace 等關鍵字。",
  "  2. 充分使用 mana：每回合若仍有 mana 未用且有可用動作，避免直接 END_TURN。",
  "  3. 攻擊敵方時優先擊殺低 HP 的兵力，避免讓敵方兵力滾大。",
  "  4. 終極技與技能應在能造成關鍵變化（斬殺、解場、保人）時施放。",
  "  5. 若無有效動作或仍須等敵方回合，再選 END_TURN。",
  "",
  "輸出格式（嚴格 JSON，不可有 Markdown、不可有額外文字）：",
  '{ "reasoning": "<簡短中文推理，120 字內>", "actionIndex": <legalActions 清單中的 0-based index>, "action": <該動作的逐字 JSON 物件，需與 legalActions[actionIndex] 完全一致> }',
  "",
  "若 reasoning 與 action 不一致，以 actionIndex 為準。",
  "如果你判斷無事可做，請挑選最後一個 END_TURN。",
].join("\n");

interface CompactCardView {
  handIndex: number;
  cardId: string;
  name: string;
  type: string;
  cost: number;
  effect: string;
  stats?: { hp: number; atk: number; def: number };
}

interface CompactTroopView {
  slot: number | "frontline";
  instanceId: string;
  cardId: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  keywords: string[];
  frozenTurns?: number;
  hasAttackedThisTurn?: boolean;
  summonedThisTurn?: boolean;
  isPhantom?: boolean;
  isConstruct?: boolean;
}

function compactHand(state: BattleState, ctx: BattleContext): CompactCardView[] {
  return state.player.hand.map((inst, idx) => {
    let name = inst.cardId;
    let type = "unknown";
    let cost = 0;
    let effect = "";
    let stats: CompactCardView["stats"];
    try {
      const card = ctx.getCard(inst.cardId);
      name = card.name;
      type = card.type;
      cost = card.cost;
      const face = buildCardFaceModel(card);
      effect = face.effectLines.join("；").slice(0, 200);
      if (face.stats) {
        stats = { hp: face.stats.hp, atk: face.stats.atk, def: face.stats.def };
      }
    } catch {
      // unknown card
    }
    const out: CompactCardView = { handIndex: idx, cardId: inst.cardId, name, type, cost, effect };
    if (stats) out.stats = stats;
    return out;
  });
}

function compactTroops(side: SideState, ctx: BattleContext): CompactTroopView[] {
  const out: CompactTroopView[] = [];
  side.troopSlots.forEach((t, i) => {
    if (t) out.push(viewTroop(t, i, ctx));
  });
  if (side.frontlineSlot) out.push(viewTroop(side.frontlineSlot, "frontline", ctx));
  return out;
}

function viewTroop(t: TroopInstance, slot: number | "frontline", ctx: BattleContext): CompactTroopView {
  let name = t.cardId;
  try {
    name = ctx.getCard(t.cardId).name;
  } catch {
    // ignore
  }
  const v: CompactTroopView = {
    slot,
    instanceId: t.instanceId,
    cardId: t.cardId,
    name,
    hp: t.hp,
    maxHp: t.maxHp,
    atk: t.atk,
    def: t.def,
    keywords: Array.from(t.keywords),
  };
  if (t.frozenTurns > 0) v.frozenTurns = t.frozenTurns;
  if (t.hasAttackedThisTurn) v.hasAttackedThisTurn = true;
  if (t.summonedThisTurn) v.summonedThisTurn = true;
  if (t.isPhantom) v.isPhantom = true;
  if (t.isConstruct) v.isConstruct = true;
  return v;
}

function compactHero(side: SideState): Record<string, unknown> {
  const h = side.hero;
  return {
    defId: h.defId,
    hp: h.hp,
    maxHp: h.maxHp,
    atk: h.atk,
    def: h.def,
    morale: h.morale,
    gaugeValue: h.gaugeValue,
    armor: h.armor,
    manaCurrent: side.manaCurrent,
    manaCap: side.manaCap,
    tempMana: side.tempMana,
    ultimateUsed: h.flags.ultimateUsed,
    equipment: h.equipment,
    statusBuffs: (h.statusBuffs ?? []).map((b) => ({ status: b.status, turns: b.remainingTurns })),
  };
}

function compactRift(state: BattleState): Record<string, unknown> | undefined {
  if (!state.rift) return undefined;
  return {
    holder: state.rift.holder,
    occupant: state.rift.occupant ? { instanceId: state.rift.occupant.instanceId, cardId: state.rift.occupant.cardId, hp: state.rift.occupant.hp, atk: state.rift.occupant.atk } : null,
    s15UsesPlayer: state.rift.s15UsesPlayer,
    s16UsedPlayer: state.rift.s16UsedPlayer,
  };
}

function compactState(state: BattleState, ctx: BattleContext): Record<string, unknown> {
  return {
    turn: state.turn,
    activeSide: state.activeSide,
    phase: state.phase,
    stability: state.stability,
    corruptionStage: state.corruptionStage,
    omen: state.omen ? { id: state.omen.id, remainingTurns: state.omen.remainingTurns } : null,
    field: {
      player: state.field.player?.cardId ?? null,
      enemy: state.field.enemy?.cardId ?? null,
    },
    rift: compactRift(state),
    player: {
      hero: compactHero(state.player),
      hand: compactHand(state, ctx),
      troops: compactTroops(state.player, ctx),
      deckCount: state.player.deck.length,
      graveyardCount: state.player.graveyard.length,
    },
    enemy: {
      hero: compactHero(state.enemy),
      handCount: state.enemy.hand.length,
      troops: compactTroops(state.enemy, ctx),
      deckCount: state.enemy.deck.length,
      graveyardCount: state.enemy.graveyard.length,
    },
  };
}

function compactLogTail(state: BattleState, n = 12): Array<{ turn: number; side: string; kind: string; text: string }> {
  return state.log.slice(-n).map((l) => ({ turn: l.turn, side: l.side, kind: l.kind, text: l.text }));
}

function formatLegalActions(actions: GameAction[], state: BattleState, ctx: BattleContext): string {
  return actions
    .map((a, i) => `[${i}] ${describeAction(a, state, ctx)}    ${JSON.stringify(a)}`)
    .join("\n");
}

export function buildPrompt(
  state: BattleState,
  ctx: BattleContext,
  legalActions: GameAction[],
  correctionHint?: string,
): BuiltPrompt {
  const snapshot = compactState(state, ctx);
  const logTail = compactLogTail(state, 12);

  const userParts: string[] = [];
  if (correctionHint) {
    userParts.push(`[CORRECTION] ${correctionHint}`);
    userParts.push("");
  }
  userParts.push("# 戰場狀態");
  userParts.push("```json");
  userParts.push(JSON.stringify(snapshot, null, 2));
  userParts.push("```");
  userParts.push("");
  userParts.push("# 最近 log（舊→新）");
  userParts.push("```json");
  userParts.push(JSON.stringify(logTail, null, 2));
  userParts.push("```");
  userParts.push("");
  userParts.push(`# 合法動作清單（共 ${legalActions.length} 個，請選一個）`);
  userParts.push(formatLegalActions(legalActions, state, ctx));
  userParts.push("");
  userParts.push('請以 { "reasoning": ..., "actionIndex": ..., "action": ... } JSON 回應，不要包含其他文字。');

  return { system: SYSTEM_PROMPT, user: userParts.join("\n") };
}
