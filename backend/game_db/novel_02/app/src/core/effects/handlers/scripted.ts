import type { EffectContext } from "../registry";
import { registerScripted } from "../registry";
import { aliveTroops, getSide, otherSide } from "../../selectors/battle";
import { applyHeroDamage } from "../../combat/damage";
import { addMorale } from "../../resource/morale";
import { addTempMana } from "../../resource/mana";

interface FlagsState {
  extraActionsThisTurn: number;
  actionDisabledThisTurn: boolean;
  firstAttackDoubleInstanceIds: Set<string>;
}

const TURN_FLAGS = new WeakMap<object, FlagsState>();

export function getTurnFlags(state: object): FlagsState {
  let f = TURN_FLAGS.get(state);
  if (!f) {
    f = { extraActionsThisTurn: 0, actionDisabledThisTurn: false, firstAttackDoubleInstanceIds: new Set() };
    TURN_FLAGS.set(state, f);
  }
  return f;
}

export function resetTurnFlags(state: object): void {
  TURN_FLAGS.set(state, { extraActionsThisTurn: 0, actionDisabledThisTurn: false, firstAttackDoubleInstanceIds: new Set() });
}

export function registerCoreScripted(): void {
  // 揭示意圖（無操作 — 意圖一律可見於 MVP）
  registerScripted("REVEAL_INTENT", (_p, ec) => {
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "REVEAL_INTENT", text: "揭示敵方意圖" });
  });
  registerScripted("REVEAL_INTENT_ALL", (_p, ec) => {
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "REVEAL_INTENT_ALL", text: "揭示敵方全部意圖" });
  });

  // T05 回合結束治療相鄰兵力
  registerScripted("HEAL_ADJACENT", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 3;
    const id = ec.sourceInstanceId;
    if (!id) return;
    const side = getSide(ec.state, ec.sourceSide);
    const idx = side.troopSlots.findIndex((t) => t && t.instanceId === id);
    if (idx < 0) return;
    for (const adj of [idx - 1, idx + 1]) {
      const t = side.troopSlots[adj];
      if (t) t.hp = Math.min(t.maxHp, t.hp + amount);
    }
  });

  // T09 重裝騎兵：首次攻擊傷害 ×2（簡化：戰鬥前由攻擊端檢查 set）
  registerScripted("FIRST_ATTACK_DOUBLE", (_p, ec) => {
    if (ec.sourceInstanceId) {
      const f = getTurnFlags(ec.state);
      f.firstAttackDoubleInstanceIds.add(ec.sourceInstanceId);
    }
  });

  // T12 老練傭兵隊長：使另一個己方兵力獲得突進
  registerScripted("GIVE_ANOTHER_RUSH", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    const others = aliveTroops(side).filter((t) => t.instanceId !== ec.sourceInstanceId);
    if (others.length === 0) return;
    others[0]!.keywords.add("rush");
  });

  // T13 精英禁衛：英雄受到行動卡傷害時代替承受一半（複雜，MVP 略過 — 標記 passive 即可）
  registerScripted("ABSORB_HALF_HERO_ACTION_DAMAGE", () => { /* MVP 略 */ });

  // A06 致命突刺：若擊殺，鬥志 +20
  registerScripted("MORALE_IF_KILLED", (payload, ec) => {
    // 直接給；嚴格判定要看 last damage 結果，MVP 直接給（reapDeadTroops 已處理擊殺鬥志）
    // 為了精確，這裡略過讓 MORALE_KILL_TROOP 處理
    const amount = (payload as { amount?: number })?.amount ?? 20;
    addMorale(getSide(ec.state, ec.sourceSide).hero, amount - 15); // 額外 +5（已加 15 by reap）
  });

  // A08 奮力一搏：英雄自傷 10（不可減免）
  registerScripted("SELF_DAMAGE_FIXED", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 10;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    applyHeroDamage(hero, amount, { fixed: true });
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "SELF_DAMAGE", text: `自傷 ${amount}` });
  });

  // A09 全力一擊：本回合無法再使用行動卡
  registerScripted("DISABLE_ACTION_THIS_TURN", (_p, ec) => {
    getTurnFlags(ec.state).actionDisabledThisTurn = true;
  });

  // A10 星落之劍
  registerScripted("STARFALL_BLADE", (_p, ec) => {
    const heroAtk = getSide(ec.state, ec.sourceSide).hero.atk;
    let amount = heroAtk * 2 + 20;
    if (ec.state.stability <= 50) amount += 15;
    // 攻擊敵方英雄（無視 DEF 與守護）
    const enemyHero = getSide(ec.state, otherSide(ec.sourceSide)).hero;
    applyHeroDamage(enemyHero, amount, { ignoreDef: true });
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "STARFALL", text: `星落之劍對敵方英雄造 ${amount} 傷害`, payload: { amount } });
  });

  // S10 戰場掃描：若敵方有紅意圖，獲得 8 護甲
  registerScripted("ARMOR_IF_RED_INTENT", (payload, ec) => {
    if (ec.state.enemyIntent === "attack") {
      const amount = (payload as { amount?: number })?.amount ?? 8;
      getSide(ec.state, ec.sourceSide).hero.armor += amount;
    }
  });

  // S11 時間裂隙：本回合可額外使用 2 張行動卡（MVP：標記 flag，不嚴格限制行動次數）
  registerScripted("EXTRA_ACTIONS", (_p, ec) => {
    getTurnFlags(ec.state).extraActionsThisTurn += 2;
  });

  // S14 盟約之誓：MVP 簡化為固定選 1（全面恢復），玩家未來可以補選擇 UI
  registerScripted("OATH_CHOICE", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    side.hero.hp = Math.min(side.hero.maxHp, side.hero.hp + 30);
    for (const t of side.troopSlots) {
      if (t) {
        t.hp = Math.min(t.maxHp, t.hp + 10);
      }
    }
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "OATH", text: "盟約之誓：全面恢復" });
  });

  // E03 幸運墜飾、E04 符文長劍、E05 矮人鍛甲、E06 指揮官戰冠、E07 噬魂戰刃、E08 龍鱗胸甲
  // MVP：passive 已記錄於英雄裝備欄，這些被動效果走「標記」path（具體觸發在對應位置處理）
  registerScripted("LUCKY_DRAW_CHANCE", () => { /* 由 phases 抽牌時讀 equipment 判斷 */ });
  registerScripted("MANA_ON_KILL", () => { /* 由 reapDeadTroops 觸發 */ });
  registerScripted("DEF_THRESHOLD_IMMUNE", () => { /* 由 damage 計算時讀 */ });
  registerScripted("MORALE_ON_DEPLOY", () => { /* 由 PLAY_TROOP 觸發 */ });
  registerScripted("HERO_LIFESTEAL", () => { /* 由行動卡造傷後讀取 */ });
  registerScripted("DRAGONSCALE", () => { /* MVP 略 */ });

  // 場地卡 scripted handlers — MVP 略過具體效果（buff 類已在 effect DSL 中處理）
  registerScripted("FIELD_MANA_NODE", () => {});
  registerScripted("FIELD_BURN", () => {});
  registerScripted("FIELD_RESURRECT", () => {});
  registerScripted("FIELD_STORM", () => {});
  registerScripted("FIELD_DIMENSIONAL_RIFT", () => {});
}
