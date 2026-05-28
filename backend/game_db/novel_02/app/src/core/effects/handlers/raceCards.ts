import type { EffectContext } from "../registry";
import { executeEffects, registerScripted } from "../registry";
import { aliveTroops, findTroopBySide, getSide, otherSide, freeSlotIndex } from "../../selectors/battle";
import { applyHeroDamage, applyTroopDamage } from "../../combat/damage";
import { addGauge } from "../../resource/gauge";
import { syncGaugeScalingBuffs } from "../../resource/gaugeScalingBuff";
import { addTempMana } from "../../resource/mana";
import { drawCards } from "../../deck/draw";
import { rngPick } from "../../deck/prng";
import { createTroopInstance } from "../../turn/factories";
import { applyStabilityDelta, applyCorruptionStageEffects } from "../../resource/stability";
import { getTurnFlags } from "../../turn/turnFlags";
import type { BoardUnitCard, TroopCard } from "../../types/card";
import type { Side } from "../../types/effect";
import type { TroopInstance } from "../../types/battle";

/**
 * 種族卡與中立傳說卡的腳本化效果。
 * MVP：複雜被動以「標記 + 簡化」處理；主動效果盡量做到符合設計。
 */
export function registerRaceCardScripted(): void {
  registerNeutrals();
  registerHuman();
  registerElf();
  registerDwarf();
  registerFey();
  registerBeast();
  registerDemigod();
  registerDemon();
  registerClassCards();
}

function getPayloadTargetId(payload: unknown): string | undefined {
  return (payload as { targetInstanceId?: string } | undefined)?.targetInstanceId;
}

function findOwnTroopByPayload(ec: EffectContext, payload: unknown): TroopInstance | undefined {
  const id = getPayloadTargetId(payload);
  if (!id) return undefined;
  const found = findTroopBySide(ec.state, id);
  return found?.side === ec.sourceSide ? found.troop : undefined;
}

function findOwnTroopSlot(ec: EffectContext, instanceId: string): { side: ReturnType<typeof getSide>; slotIndex: number; frontline: boolean } | null {
  const side = getSide(ec.state, ec.sourceSide);
  const slotIndex = side.troopSlots.findIndex((t) => t?.instanceId === instanceId);
  if (slotIndex >= 0) return { side, slotIndex, frontline: false };
  if (side.frontlineSlot?.instanceId === instanceId) return { side, slotIndex: -1, frontline: true };
  return null;
}

function removeOwnTroopSilently(ec: EffectContext, troop: TroopInstance, kind = "UNIT_REMOVED"): void {
  const loc = findOwnTroopSlot(ec, troop.instanceId);
  if (!loc) return;
  if (loc.frontline) loc.side.frontlineSlot = null;
  else loc.side.troopSlots[loc.slotIndex] = null;
  loc.side.graveyard.push({ instanceId: troop.instanceId, cardId: troop.cardId });
  ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind, text: `${troop.cardId} 離場`, payload: { instanceId: troop.instanceId, cardId: troop.cardId } });
}

function addTaunt(troop: TroopInstance, state: EffectContext["state"], source: string, turns: number): void {
  troop.keywords.delete("menace");
  troop.statusBuffs ??= [];
  troop.statusBuffs.push({ id: `taunt_${state.nextInstanceId++}`, source, status: "taunt", remainingTurns: turns });
}

function addPermanentBuff(troop: TroopInstance, state: EffectContext["state"], source: string, mod: { hp?: number; atk?: number; def?: number }): void {
  if (mod.hp) {
    troop.hp += mod.hp;
    troop.maxHp += mod.hp;
  }
  if (mod.atk) troop.atk += mod.atk;
  if (mod.def) troop.def += mod.def;
  troop.buffs.push({ id: `${source}_${state.nextInstanceId++}`, source, mod, remainingTurns: 9999 });
}

// ============================================================
// 中立傳說 T_l_01-S_l_04
// ============================================================
function registerNeutrals(): void {
  // T_l_01 大陸浮游鯨：法術不可選為目標（passive 標記，MVP 不嚴格實作 spell target 過濾）
  registerScripted("UNTARGETABLE_BY_SPELL", () => { /* MVP 略 */ });

  // S_l_01 命運之輪：雙方各摧毀 ATK 最高的 1 個兵力
  registerScripted("DESTROY_HIGHEST_ATK_BOTH", (_p, ec) => {
    for (const side of ["player", "enemy"] as const) {
      const troops = aliveTroops(getSide(ec.state, side));
      if (troops.length === 0) continue;
      const top = [...troops].sort((a, b) => b.atk - a.atk)[0]!;
      top.hp = 0;
    }
  });

  // S_l_01 敵方抽 N 張
  registerScripted("ENEMY_DRAW", (payload, ec) => {
    const count = (payload as { count?: number })?.count ?? 1;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const r = drawCards(enemy, count, ec.state.rngState);
    ec.state.rngState = r.newRngState;
  });

  // S_l_02 虛空行者的遺書：本回合英雄攻擊與技能無視守護
  registerScripted("GRANT_IGNORE_GUARD_THIS_TURN", (_p, ec) => {
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { ignoreGuardThisTurn?: boolean }).ignoreGuardThisTurn = true;
  });

  // E_l_01 雙月遺物：被動，每回合 +10 量表（在 onTurnStart 處理）
  registerScripted("MOON_RELIC", (_p, ec) => {
    // 這個 handler 由 passive 觸發；在 raceCards.ts 中 hookOnTurnStartScripted 會檢查英雄裝備
    const hero = getSide(ec.state, ec.sourceSide).hero;
    const heroDef = ec.ctx.getHero(hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(hero, race.gauge.max, 10);
  });

  // S_l_03 次元壁碎片
  registerScripted("DIMENSION_SHARD", (_p, ec) => {
    if (ec.state.stability >= 100) {
      // 改為對敵方全體造成 15 傷害
      const enemy = getSide(ec.state, otherSide(ec.sourceSide));
      applyHeroDamage(enemy.hero, 15);
      for (const t of enemy.troopSlots) {
        if (t) applyTroopDamage(t, 15);
      }
    } else {
      const r = applyStabilityDelta(ec.state, 25);
      applyCorruptionStageEffects(ec.state, r.stageJustReached);
    }
    const me = getSide(ec.state, ec.sourceSide);
    const r2 = drawCards(me, 1, ec.state.rngState);
    ec.state.rngState = r2.newRngState;
  });

  // S_l_04 末日倒數啟動
  registerScripted("DOOMSDAY_START", (payload, ec) => {
    const turns = (payload as { turns?: number })?.turns ?? 3;
    const damage = (payload as { damage?: number })?.damage ?? 50;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    hero.flags.doomsdayCountdown = turns;
    hero.flags.doomsdayDamage = damage;
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "DOOMSDAY", text: `末日倒數啟動：${turns} 回合後對敵方全體造成 ${damage} 傷害` });
  });
}

// ============================================================
// 人類 T_h_01-E_h_01
// ============================================================
function registerHuman(): void {
  // T_h_04 聖殿騎士：場上每有 1 個其他己方兵力，此兵力 +1 ATK（dynamic, MVP: passive no-op；改用 onPlay 一次性快照）
  registerScripted("ATK_PER_ALLY", () => { /* dynamic，省略 */ });

  // S_h_03 軍團集結：所有己方兵力 +3/+3 持續 2 回合；場上 ≥ 4 時翻倍
  registerScripted("LEGION_RALLY", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const troops = aliveTroops(me);
    const buffAmt = troops.length >= 4 ? 6 : 3;
    for (const t of troops) {
      t.atk += buffAmt;
      t.def += buffAmt;
      t.buffs.push({ id: `legion_${ec.state.nextInstanceId++}`, source: "S_h_03", mod: { atk: buffAmt, def: buffAmt }, remainingTurns: 2 });
    }
  });

  // S_h_04 帝國動員令：抽 3 張兵力牌
  registerScripted("DRAW_TROOPS", (payload, ec) => {
    const count = (payload as { count?: number })?.count ?? 3;
    const me = getSide(ec.state, ec.sourceSide);
    let drawn = 0;
    for (let i = 0; i < me.deck.length && drawn < count && me.hand.length < 9; ) {
      const c = me.deck[i];
      if (!c) { i++; continue; }
      const card = ec.ctx.getCard(c.cardId);
      if (card.type === "troop") {
        me.deck.splice(i, 1);
        me.hand.push(c);
        drawn++;
      } else {
        i++;
      }
    }
  });

  // S_h_04 本回合所有兵力部署費用 -2
  registerScripted("DEPLOY_DISCOUNT_THIS_TURN", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 2;
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { deployDiscount?: number }).deployDiscount = amount;
  });

  // E_h_01 盟約之劍：被動 — 每次行動卡攻擊後隨機己方兵力 +2 ATK
  registerScripted("OATH_BLADE", () => { /* MVP：在 reducer 內單獨檢查 */ });

  registerScripted("H_FRONTLINE_ADVANCE", (payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    if (me.frontlineSlot) return;
    const uses = (me.hero.flags.frontlineAdvanceUses as number | undefined) ?? 0;
    if (uses >= 2) return;
    const target = findOwnTroopByPayload(ec, payload);
    if (!target || target.isConstruct) return;
    const loc = findOwnTroopSlot(ec, target.instanceId);
    if (!loc || loc.frontline) return;
    loc.side.troopSlots[loc.slotIndex] = null;
    addPermanentBuff(target, ec.state, "A_h_05", { atk: 3, def: -2 });
    addTaunt(target, ec.state, "A_h_05", 9999);
    me.frontlineSlot = target;
    me.hero.flags.frontlineAdvanceUses = uses + 1;
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FRONTLINE_ADVANCE", text: `${target.cardId} 推進到前線第六格`, payload: { instanceId: target.instanceId } });
  });

  registerScripted("H_FRONTLINE_ROTATION", (payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const old = me.frontlineSlot;
    if (!old || me.hand.length >= 9) return;
    me.frontlineSlot = null;
    me.hand.push({ instanceId: `frontline_${ec.state.nextInstanceId++}`, cardId: old.cardId });
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FRONTLINE_RETURN", text: `${old.cardId} 收回手牌`, payload: { cardId: old.cardId } });

    const next = findOwnTroopByPayload(ec, payload);
    if (!next || next.instanceId === old.instanceId || next.isConstruct || me.frontlineSlot) return;
    const loc = findOwnTroopSlot(ec, next.instanceId);
    if (!loc || loc.frontline) return;
    loc.side.troopSlots[loc.slotIndex] = null;
    addPermanentBuff(next, ec.state, "A_h_06", { atk: 3, def: -2 });
    addTaunt(next, ec.state, "A_h_06", 9999);
    me.frontlineSlot = next;
  });
}

// ============================================================
// 精靈 S_e_01-S_e_07
// ============================================================
function registerElf(): void {
  // S_e_02 月光矢：8 傷害，共鳴 ≥ 2 改 12
  registerScripted("MOONLIGHT_ARROW", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const dmg = me.hero.gaugeValue >= 2 ? 12 : 8;
    // 對單一目標——MVP：找第一個敵方兵力，否則打英雄
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const targets = aliveTroops(enemy);
    if (targets.length > 0) {
      const pick = rngPick(ec.state.rngState, targets);
      ec.state.rngState = pick.state;
      const target = pick.value;
      applyTroopDamage(target, dmg);
    } else {
      applyHeroDamage(enemy.hero, dmg);
    }
  });

  // T_e_01 / T_e_02 — 每次施法時觸發（passive，MVP 在 reducer 內單獨檢查）
  registerScripted("ATK_PER_SPELL_CAST", () => { /* MVP 略 */ });
  registerScripted("HP_PER_SPELL_CAST", () => { /* MVP 略 */ });

  // S_e_03 古語銘刻：下張法術翻倍
  registerScripted("DOUBLE_NEXT_SPELL", (_p, ec) => {
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { nextSpellDouble?: boolean }).nextSpellDouble = true;
  });

  // F_e_01 精靈結界場地（MVP 略）
  registerScripted("FIELD_ELVEN_WARD", () => { /* MVP 略：法術 +25%、部署費 +1 */ });

  // S_e_05 萬年詠唱：本回合共鳴不重置
  registerScripted("RESONANCE_NO_RESET", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    (me.hero.flags as { resonanceNoReset?: boolean }).resonanceNoReset = true;
  });

  // S_e_07 艾爾諾禁咒：50 魔法傷害；共鳴 ≥ 4 改 80 對全體
  registerScripted("AENO_FORBIDDEN", (payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    if (me.hero.gaugeValue >= 4) {
      applyHeroDamage(enemy.hero, 70);
      for (const t of enemy.troopSlots) {
        if (t) applyTroopDamage(t, 70);
      }
    } else {
      const targetInstanceId = (payload as { targetInstanceId?: string } | undefined)?.targetInstanceId;
      if (targetInstanceId === `H_${otherSide(ec.sourceSide)}`) {
        applyHeroDamage(enemy.hero, 40);
        return;
      }
      const target = targetInstanceId ? findTroopBySide(ec.state, targetInstanceId) : null;
      if (target?.side === otherSide(ec.sourceSide)) applyTroopDamage(target.troop, 40);
    }
  });

  registerScripted("ELF_STARRY_SKY", (payload, ec) => {
    const hits = (payload as { hits?: number } | undefined)?.hits ?? 6;
    const damage = (payload as { damage?: number } | undefined)?.damage ?? 3;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    let total = 0;

    for (let i = 0; i < hits; i++) {
      const targets = [
        { kind: "hero" as const },
        ...aliveTroops(enemy).map((troop) => ({ kind: "troop" as const, troop })),
      ];
      const pick = rngPick(ec.state.rngState, targets);
      ec.state.rngState = pick.state;

      if (pick.value.kind === "hero") {
        total += applyHeroDamage(enemy.hero, damage, { fixed: true }).finalAmount;
      } else {
        total += applyTroopDamage(pick.value.troop, damage, { fixed: true }).finalAmount;
      }
    }

    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "ELF_STARRY_SKY", text: `漫天星光落下 ${hits} 次，總計 ${total} 傷害`, payload: { hits, damage, total } });
  });

  registerScripted("ELF_STARVEIN_RETURN", (_payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const spells = Math.max(1, me.spellsCastThisGame);
    const heal = Math.min(18, 4 + spells * 2);
    const armor = Math.min(10, Math.floor(spells / 2) * 2);
    me.hero.hp = Math.min(me.hero.maxHp, me.hero.hp + heal);
    me.hero.armor += armor;
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "ELF_STARVEIN_RETURN", text: `星脈回流治療 ${heal} HP，護甲 +${armor}`, payload: { spells, heal, armor } });
  });

  registerScripted("ELF_MOON_PHASE_TUNE", (_payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    for (let i = 0; i < me.deck.length && me.hand.length < 9; i++) {
      const inst = me.deck[i];
      if (!inst) continue;
      if (ec.ctx.getCard(inst.cardId).type !== "spell") continue;
      const [picked] = me.deck.splice(i, 1);
      if (picked) me.hand.push(picked);
      break;
    }
    const heroDef = ec.ctx.getHero(me.hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(me.hero, race.gauge.max, 2);
    syncGaugeScalingBuffs(ec.state, ec.ctx);
  });

  registerScripted("ELF_SILVERLEAF_SEAL", (_payload, ec) => {
    const enemySide = otherSide(ec.sourceSide);
    const enemy = getSide(ec.state, enemySide);
    const targets = aliveTroops(enemy);
    if (targets.length > 0) {
      const pick = rngPick(ec.state.rngState, targets);
      ec.state.rngState = pick.state;
      const target = pick.value;
      const prev = target.frozenTurns;
      target.frozenTurns = Math.max(prev, 2);
      if (2 >= prev) delete target.frozenDisplayName;
    }
    executeEffects([{ kind: "freezeHeroAbility", side: "enemy", modes: ["spell", "action"], turns: 1 }], ec);
  });
}

// ============================================================
// 矮人 S_dw_01 / A_dw_01–S_dw_03 / E_dw_01–T_dw_02 + 通用器具/法術共享 tag
// ============================================================
// 通用器具卡（T_m_01–T_m_04）與通用法術 S_c_17 拆解術也使用以下 scripted tag：
//   T_m_01 修復構裝體：無 scripted（純 onTurnEnd heal）
//   T_m_02 構裝哨兵：HERO_DEF_PLUS_2_WHILE_ALIVE
//   T_m_03 魔導砲台：AUTO_TURRET_FIRE / IMMUNE_SPELL_DAMAGE
//   T_m_04 攻城弩砲：無 scripted（純 siege 兵力）
//   S_c_17 拆解術：SALVAGE
function registerDwarf(): void {
  // S_dw_01 急速鍛造：將 1 張手牌轉化為隨機裝備（與職業關鍵字「改造/製造」共享 forgeUsedThisTurn flag）
  registerScripted("RAPID_FORGE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    if (me.hand.length === 0 || me.hand.length >= 9) return;
    // 棄手牌頂張
    const discarded = me.hand.shift();
    if (discarded) me.graveyard.push(discarded);
    // 加入隨機裝備
    const equipIds = ["E_c_01", "E_c_02", "E_c_03", "E_c_04", "E_c_05", "E_c_06"];
    const pick = equipIds[Math.floor((ec.state.rngState >>> 0) % equipIds.length)] ?? "E_c_01";
    me.hand.push({ instanceId: `forged_${ec.state.nextInstanceId++}`, cardId: pick });
    // 共享職業每回合改造/製造的限額：用過 S_dw_01 就不能再用職業 FORGE_ACTION
    me.hero.flags.forgeUsedThisTurn = true;
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FORGE_EQUIPMENT", text: `急速鍛造：獲得隨機裝備 ${pick}`, payload: { cardId: pick } });
  });

  // S_c_17 拆解術（前 D03 合金回收下放為通用法術）：拆 1 件裝備或 1 個器具，獲得其費用 ×2 的魔力
  registerScripted("SALVAGE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    // 找一件已裝備的裝備
    const slots = me.hero.equipment;
    let cardId: string | undefined;
    if (slots.weapon) { cardId = slots.weapon; slots.weapon = undefined; }
    else if (slots.armor) { cardId = slots.armor; slots.armor = undefined; }
    else if (slots.trinket) { cardId = slots.trinket; slots.trinket = undefined; }
    if (cardId) {
      const card = ec.ctx.getCard(cardId);
      if (cardId === "E_f_01") delete (me.hero.flags as { essenceMaxBonus?: number }).essenceMaxBonus;
      addTempMana(me, card.cost * 2);
      return;
    }
    // 沒裝備就拆一個器具
    const myTroops = aliveTroops(me);
    const device = myTroops.find((t) => t.isDevice === true);
    if (device) {
      const card = ec.ctx.getCard(device.cardId);
      device.hp = 0;
      addTempMana(me, card.cost * 2);
    }
  });

  // T_m_02 構裝哨兵被動：英雄 DEF +2（MVP 略，由 isDeviceTroop 配合滿爐火 buff 處理）
  registerScripted("HERO_DEF_PLUS_2_WHILE_ALIVE", () => { /* MVP 略 */ });

  // T_m_03 AUTO_TURRET_FIRE 已搬到 devices.ts 集中管理。
  // T_m_03 免疫法術傷害（MVP 略）
  registerScripted("IMMUNE_SPELL_DAMAGE", () => { /* MVP 略 */ });

  // A_dw_01 礦脈爆破：敵方全體傷害 = (已裝備裝備數 + 場上器具數 + 升級總層數) × 3
  registerScripted("MINEVEIN_BLAST", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const equipped = [me.hero.equipment.weapon, me.hero.equipment.armor, me.hero.equipment.trinket].filter(Boolean).length;
    const deviceTroops = aliveTroops(me).filter((t) => t.isDevice === true);
    const devices = deviceTroops.length;
    const upgradeLayers = deviceTroops.reduce((sum, t) => sum + (t.upgradeLevel ?? 0), 0);
    const dmg = (equipped + devices + upgradeLayers) * 3;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    applyHeroDamage(enemy.hero, dmg);
    for (const target of aliveTroops(enemy)) applyTroopDamage(target, dmg);
  });

  // S_dw_02 矮人麥酒：恢復英雄 12 HP；裝備 ≥ 2 件時額外 +8
  registerScripted("DWARF_ALE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const equipCount = [me.hero.equipment.weapon, me.hero.equipment.armor, me.hero.equipment.trinket].filter(Boolean).length;
    const heal = equipCount >= 2 ? 20 : 12;
    me.hero.hp = Math.min(me.hero.maxHp, me.hero.hp + heal);
  });

  // S_dw_03 祖傳圖紋：永久所有裝備與器具費用 -1
  registerScripted("ANCESTRAL_BLUEPRINT", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    (me.hero.flags as { equipDiscount?: number }).equipDiscount = ((me.hero.flags as { equipDiscount?: number }).equipDiscount ?? 0) + 1;
  });

  // 通用：固定傷害敵方英雄（保留給 boss / 內部使用）
  registerScripted("DAMAGE_ENEMY_HERO_FIXED", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 10;
    applyHeroDamage(getSide(ec.state, otherSide(ec.sourceSide)).hero, amount, { ignoreDef: true });
  });

  // E_dw_01 氏族戰錘：被動，依裝備/器具數動態 +ATK
  registerScripted("CLAN_WARHAMMER", () => { /* MVP 略 */ });

  // ---- v3.4 新增矮人專屬 ----

  // T_dw_01 山王衛兵被動：場上每件己方裝備 +1 DEF（MVP 略，由 reducer 動態統計）
  registerScripted("MOUNTAIN_KING_GUARD", () => { /* MVP 略 */ });

  // S_dw_04 鍛爐祝禱：本回合下一張裝備卡 cost -2（最低 1）
  registerScripted("FORGE_BENEDICTION", (_p, ec) => {
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { nextEquipDiscount?: number }).nextEquipDiscount = 2;
  });

  // S_dw_05 氏族飲宴：我方英雄回 10 HP；所有己方兵力 +2 ATK 持續 2 回合
  registerScripted("CLAN_FEAST", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    me.hero.hp = Math.min(me.hero.maxHp, me.hero.hp + 10);
    for (const t of aliveTroops(me)) {
      t.atk += 2;
      t.buffs.push({ id: `feast_${ec.state.nextInstanceId++}`, source: "S_dw_05", mod: { atk: 2 }, remainingTurns: 2 });
    }
  });

  // F_dw_01 深山礦坑場地：每回合開始 +10 爐火；裝備卡 cost -1（MVP：標旗，由 onTurnStart / cost reducer 讀取）
  registerScripted("FIELD_DEEP_MINE", (_p, ec) => {
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { deepMineActive?: boolean }).deepMineActive = true;
  });

  // T_dw_02 鋼鬚鍛師入場曲：從牌庫抽 1 張裝備卡
  registerScripted("STEELBEARD_SEARCH", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    for (let i = 0; i < me.deck.length && me.hand.length < 9; i++) {
      const c = me.deck[i];
      if (!c) continue;
      const card = ec.ctx.getCard(c.cardId);
      if (card.type === "equipment") {
        me.deck.splice(i, 1);
        me.hand.push(c);
        return;
      }
    }
  });

  // T_dw_02 鋼鬚鍛師被動：每打出 1 張裝備 +3 ATK（疊到回合結束）（MVP 略，由 reducer 標記）
  registerScripted("STEELBEARD_FURY", () => { /* MVP 略 */ });
}

// ============================================================
// 妖族 S_f_01-S_f_06（含人形/妖形切換）
// ============================================================
function getFeyForm(ec: EffectContext): "human" | "fey" {
  const me = getSide(ec.state, ec.sourceSide);
  return me.hero.flags.feyForm ?? "human";
}

function registerFey(): void {
  // S_f_02 狐火
  registerScripted("Y_FOXFIRE", (_p, ec) => {
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const target = aliveTroops(enemy)[0];
    if (getFeyForm(ec) === "human") {
      // 人形：15 魔法傷害
      if (target) applyTroopDamage(target, 15);
      else applyHeroDamage(enemy.hero, 15);
    } else {
      // 妖形：10 + 灼傷 2 回合（MVP 簡化為立即額外 10 傷）
      if (target) applyTroopDamage(target, 20);
      else applyHeroDamage(enemy.hero, 20);
    }
  });

  // T_f_02 蛇妖衛士被動（MVP 略）
  registerScripted("Y_SERPENT_GUARD", () => { /* MVP 略 */ });

  // E_f_01 千年妖核：靈蘊上限 +50（MVP 略）/ 切換時恢復 5 HP
  registerScripted("Y_ESSENCE_CORE", () => { /* MVP 略 */ });

  // S_f_03 形態切換
  registerScripted("Y_FORM_TOGGLE", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    hero.flags.feyForm = (hero.flags.feyForm ?? "human") === "human" ? "fey" : "human";
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FORM_TOGGLE", text: `切換為${hero.flags.feyForm === "fey" ? "妖形" : "人形"}` });
  });

  // S_f_03 本回合受傷 -50%
  registerScripted("Y_DAMAGE_REDUCE_THIS_TURN", (payload, ec) => {
    const pct = (payload as { pct?: number })?.pct ?? 50;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    (hero.flags as { damageReducePctThisTurn?: number }).damageReducePctThisTurn = pct;
  });

  // S_f_04 百鬼夜行：人形召 2 個幻影；妖形召 1 個妖獸
  registerScripted("Y_HUNDRED_GHOSTS", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const cardId = getFeyForm(ec) === "human" ? "T_s_31" : "T_s_32";
    const count = getFeyForm(ec) === "human" ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const slotIdx = freeSlotIndex(me);
      if (slotIdx < 0) break;
      const card = ec.ctx.getCard(cardId);
      if (card.type !== "troop") break;
      me.troopSlots[slotIdx] = createTroopInstance(ec.state, card as TroopCard);
    }
  });

  // S_f_05 幻境迷陣
  registerScripted("Y_ILLUSION_MAZE", (_p, ec) => {
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    if (getFeyForm(ec) === "human") {
      // 敵方所有兵力 ATK -4 持續 2 回合
      for (const t of aliveTroops(enemy)) {
        t.atk = Math.max(0, t.atk - 4);
        t.buffs.push({ id: `maze_${ec.state.nextInstanceId++}`, source: "S_f_05", mod: { atk: -4 }, remainingTurns: 2 });
      }
    } else {
      // 妖形：控制敵方 1 個兵力 2 回合（MVP 簡化為凍結 2 回合）
      const target = aliveTroops(enemy)[0];
      if (target) {
        const prev = target.frozenTurns;
        target.frozenTurns = Math.max(prev, 2);
        if (2 >= prev) target.frozenDisplayName = "控制";
      }
    }
  });

  // T_f_03 九尾妖狐：人形→威壓；妖形→疾走+汲取
  registerScripted("Y_NINETAILS_KEYWORDS", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const self = aliveTroops(me).find((t) => t.cardId === "T_f_03");
    if (!self) return;
    if (getFeyForm(ec) === "human") {
      self.keywords.add("menace");
    } else {
      self.keywords.add("haste");
      self.keywords.add("lifesteal");
    }
  });

  // S_f_06 始祖之血：進入「始祖妖形」（MVP：給己方所有兵力 +3/+3）
  registerScripted("Y_PRIMORDIAL_BLOOD", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    me.hero.flags.feyForm = "fey";
    me.hero.flags.primordialFey = 2;
    for (const t of aliveTroops(me)) {
      t.atk += 3;
      t.def += 3;
      t.buffs.push({ id: `primord_${ec.state.nextInstanceId++}`, source: "S_f_06", mod: { atk: 3, def: 3 }, remainingTurns: 2 });
    }
  });

  registerScripted("Y_PHANTOM_DETONATION", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const phantoms = aliveTroops(me).filter((t) => t.isPhantom);
    for (const phantom of phantoms) removeOwnTroopSilently(ec, phantom, "PHANTOM_DETONATE");
    const damage = phantoms.length * 3;
    if (damage <= 0) return;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    for (const troop of aliveTroops(enemy)) applyTroopDamage(troop, damage);
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "PHANTOM_DETONATION", text: `幻影殉爆：${phantoms.length} 個幻影造成全體 ${damage} 傷害` });
  });

  registerScripted("Y_PHANTOM_SHIFT", (payload, ec) => {
    const target = findOwnTroopByPayload(ec, payload) ?? aliveTroops(getSide(ec.state, ec.sourceSide)).find((t) => t.isPhantom);
    if (!target?.isPhantom) return;
    removeOwnTroopSilently(ec, target, "PHANTOM_SHIFT");
    getTurnFlags(ec.state).nextDeployDiscount = Math.max(getTurnFlags(ec.state).nextDeployDiscount ?? 0, 2);
  });

  registerScripted("Y_PHANTOM_TAUNT", (_payload, ec) => {
    const phantoms = aliveTroops(getSide(ec.state, ec.sourceSide)).filter((t) => t.isPhantom);
    for (const phantom of phantoms) addTaunt(phantom, ec.state, "A_f_09", 2);
  });

  registerScripted("Y_PHANTOM_REALIZE", (payload, ec) => {
    const target = findOwnTroopByPayload(ec, payload) ?? aliveTroops(getSide(ec.state, ec.sourceSide)).find((t) => t.isPhantom);
    if (!target?.isPhantom) return;
    target.isPhantom = false;
    delete target.phantomTurnsRemaining;
    addPermanentBuff(target, ec.state, "A_f_10", { hp: 5, atk: 3, def: 2 });
  });

  registerScripted("Y_PHANTOM_INFUSION", (payload, ec) => {
    const target = findOwnTroopByPayload(ec, payload) ?? aliveTroops(getSide(ec.state, ec.sourceSide)).find((t) => t.isPhantom);
    if (!target?.isPhantom) return;
    removeOwnTroopSilently(ec, target, "PHANTOM_INFUSION");
    const me = getSide(ec.state, ec.sourceSide);
    me.hero.hp = Math.min(me.hero.maxHp, me.hero.hp + 2);
  });
}

// ============================================================
// 獸族 S_b_01-S_b_04
// ============================================================
function registerBeast(): void {
  // S_b_01 鮮血祭祀：對己方 1 個兵力發動血祭（HP -50%, ATK ×2 持續 2 回合）；額外 ATK +3；血怒 +1
  registerScripted("B_BLOOD_RITE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const target = aliveTroops(me)[0];
    if (!target) return;
    const isSavageFang = target.cardId === "T_b_01";
    const mult = isSavageFang ? 3 : 2;
    target.hp = Math.max(1, Math.floor(target.hp * 0.5));
    target.atk = target.atk * mult + 3;
    target.buffs.push({ id: `bloodrite_${ec.state.nextInstanceId++}`, source: "S_b_01", mod: { atk: target.atk - 3 }, remainingTurns: 2 });
    const heroDef = ec.ctx.getHero(me.hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(me.hero, race.gauge.max, 1);
  });

  // T_b_01 蠻牙戰士被動（S_b_01 已處理）
  registerScripted("B_SAVAGEFANG_BLOODRITE_X3", () => { /* S_b_01 已動態處理 */ });

  // T_b_02 巨角衝鋒獸謝幕：對擊殺者造成 5 傷害（MVP 簡化：對對方任一兵力造 5 傷）
  registerScripted("B_THORNS_TO_KILLER", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 5;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const target = aliveTroops(enemy)[0];
    if (target) applyTroopDamage(target, amount);
  });

  // A_b_01 狼群戰術：每次命中 +1 血怒（MVP：標記）
  registerScripted("B_PACK_TACTICS_MARK", (_p, ec) => {
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { packTacticsActive?: boolean }).packTacticsActive = true;
  });

  // A_b_02 蠻力突進：指定敵方任意單體造成英雄 ATK 傷害；血怒 ≥ 5 時 +10
  registerScripted("B_BRUTE_CHARGE", (payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    let dmg = me.hero.atk;
    if (me.hero.gaugeValue >= 5) dmg += 10;
    const targetInstanceId = (payload as { targetInstanceId?: string } | undefined)?.targetInstanceId;
    if (targetInstanceId === `H_${otherSide(ec.sourceSide)}`) {
      applyHeroDamage(enemy.hero, dmg);
      return;
    }
    const target = targetInstanceId ? findTroopBySide(ec.state, targetInstanceId) : null;
    if (target?.side === otherSide(ec.sourceSide)) applyTroopDamage(target.troop, dmg, { ignoreDef: false });
  });

  // E_b_01 戰痕勳章被動（MVP 略）
  registerScripted("B_BATTLE_SCAR_MEDAL", () => { /* MVP 略 */ });

  // S_b_03 原始狂嚎：所有己方兵力立即進入血祭狀態
  registerScripted("B_PRIMAL_HOWL", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    for (const t of aliveTroops(me)) {
      t.hp = Math.max(1, Math.floor(t.hp * 0.5));
      const origAtk = t.atk;
      t.atk = origAtk * 2;
      t.buffs.push({ id: `primhowl_${ec.state.nextInstanceId++}`, source: "S_b_03", mod: { atk: origAtk }, remainingTurns: 2 });
    }
    const heroDef = ec.ctx.getHero(me.hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(me.hero, race.gauge.max, 3);
  });

  // S_b_04 始祖獸魂：血怒立即疊至 10；3 回合內血怒不因治療降低；所有己方兵力進入血祭但不損 HP
  registerScripted("B_PRIMORDIAL_BEAST_SOUL", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    me.hero.gaugeValue = 10;
    for (const t of aliveTroops(me)) {
      const origAtk = t.atk;
      t.atk = origAtk * 2;
      t.buffs.push({ id: `pbsoul_${ec.state.nextInstanceId++}`, source: "S_b_04", mod: { atk: origAtk }, remainingTurns: 3 });
    }
    (me.hero.flags as { rageLockTurns?: number }).rageLockTurns = 3;
  });

  registerScripted("B_BLOOD_SACRIFICE_RITUAL", (_p, ec) => {
    getTurnFlags(ec.state).bloodSacrificeTransferAtk = true;
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "BLOOD_RITUAL_READY", text: "本回合下次血祭部署將轉移祭品 ATK" });
  });
}

// ============================================================
// 半神族 S_g_01-A_g_04（含透支機制）
// ============================================================
function registerDemigod(): void {
  // S_g_02 殘響共振：移除 2 層透支；透支為 0 時改為恢復英雄 10 HP
  registerScripted("G_ECHO_RESONANCE", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    const overdraft = (hero.flags.overdraft as number | undefined) ?? 0;
    if (overdraft > 0) {
      hero.flags.overdraft = Math.max(0, overdraft - 2);
    } else {
      hero.hp = Math.min(hero.maxHp, hero.hp + 10);
    }
  });

  // T_g_01 信徒被動：英雄受傷時此兵力代替承受 5 傷害（MVP 略）
  registerScripted("G_FOLLOWER_PROXY", () => { /* MVP 略 */ });

  // S_g_03 神域結界：N 回合內英雄受傷 -X%（用 turn flag 簡化）
  registerScripted("G_DIVINE_BARRIER", (payload, ec) => {
    const turns = (payload as { turns?: number })?.turns ?? 2;
    const pct = (payload as { pct?: number })?.pct ?? 30;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    (hero.flags as { divineBarrierTurns?: number; divineBarrierPct?: number }).divineBarrierTurns = turns;
    (hero.flags as { divineBarrierTurns?: number; divineBarrierPct?: number }).divineBarrierPct = pct;
  });

  // A_g_01 超越極限：消耗英雄 10% 當前 HP
  registerScripted("G_TRANSCEND", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    const dmg = Math.max(1, Math.floor(hero.hp * 0.1));
    hero.hp = Math.max(1, hero.hp - dmg);
  });

  // A_g_02 透支 +N
  registerScripted("G_OVERDRAFT_ADD", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 1;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    hero.flags.overdraft = ((hero.flags.overdraft as number | undefined) ?? 0) + amount;
  });

  // T_g_02 透支 -N
  registerScripted("G_OVERDRAFT_REMOVE", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 1;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    hero.flags.overdraft = Math.max(0, ((hero.flags.overdraft as number | undefined) ?? 0) - amount);
  });

  // S_g_04 神隱：本回合英雄受到的下 1 次傷害完全無效
  registerScripted("G_DIVINE_HIDE", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    (hero.flags as { divineHideOnce?: boolean }).divineHideOnce = true;
  });

  // A_g_03 神言：崩壞 — 消耗 40 神力殘響；對全體敵方造成 25 固定傷害；己方兵力也受 10 傷害；透支 +3
  registerScripted("G_DIVINE_WORD_COLLAPSE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    if (me.hero.gaugeValue < 40) return;
    me.hero.gaugeValue -= 40;
    syncGaugeScalingBuffs(ec.state, ec.ctx);
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    applyHeroDamage(enemy.hero, 25, { ignoreDef: true });
    for (const t of enemy.troopSlots) {
      if (t) applyTroopDamage(t, 25, { ignoreDef: true });
    }
    for (const t of aliveTroops(me)) {
      applyTroopDamage(t, 10, { ignoreDef: true });
    }
    me.hero.flags.overdraft = ((me.hero.flags.overdraft as number | undefined) ?? 0) + 3;
  });

  // A_g_04 創世殘章：消耗所有神力殘響（至少 50）；對敵方英雄造成（消耗量 ×1.5）傷害；無視守護；清除所有透支；己方兵力全摧毀
  registerScripted("G_GENESIS_FRAGMENT", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    if (me.hero.gaugeValue < 50) return;
    const consumed = me.hero.gaugeValue;
    me.hero.gaugeValue = 0;
    syncGaugeScalingBuffs(ec.state, ec.ctx);
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const dmg = Math.floor(consumed * 1.5);
    applyHeroDamage(enemy.hero, dmg, { ignoreDef: true });
    me.hero.flags.overdraft = 0;
    for (let i = 0; i < me.troopSlots.length; i++) {
      const t = me.troopSlots[i];
      if (t) t.hp = 0;
    }
  });
}

function registerClassCards(): void {
  registerScripted("O_FORGE_CONSTRUCT", (_payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const slotIdx = freeSlotIndex(me);
    if (slotIdx < 0) return;
    const card = ec.ctx.getCard("T_s_41");
    if (card.type !== "troop") return;
    me.troopSlots[slotIdx] = createTroopInstance(ec.state, card);
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FORGE_CONSTRUCT", text: "部署 1 個鋼鐵構裝體", payload: { slotIdx } });
  });

  registerScripted("O_EMERGENCY_DISASSEMBLE", (payload, ec) => {
    const target = findOwnTroopByPayload(ec, payload) ?? aliveTroops(getSide(ec.state, ec.sourceSide)).find((t) => t.isConstruct);
    if (!target?.isConstruct) return;
    removeOwnTroopSilently(ec, target, "CONSTRUCT_DISASSEMBLE");
    addTempMana(getSide(ec.state, ec.sourceSide), 2);
    const draw = drawCards(getSide(ec.state, ec.sourceSide), 1, ec.state.rngState);
    ec.state.rngState = draw.newRngState;
  });

  registerScripted("O_CONSTRUCT_UPGRADE", (payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const target = findOwnTroopByPayload(ec, payload) ?? aliveTroops(me).find((t) => t.isConstruct);
    if (!target?.isConstruct) return;
    const loc = findOwnTroopSlot(ec, target.instanceId);
    if (!loc || loc.frontline) return;
    const handIdx = me.hand.findIndex((inst) => inst.cardId.startsWith("T_m_"));
    if (handIdx < 0) return;
    const [deviceInst] = me.hand.splice(handIdx, 1);
    if (!deviceInst) return;
    me.graveyard.push(deviceInst);
    const card = ec.ctx.getCard(deviceInst.cardId);
    if (card.type !== "device") return;
    const upgraded = createTroopInstance(ec.state, card as BoardUnitCard);
    addPermanentBuff(upgraded, ec.state, "A_o_03", { hp: 5, atk: 3, def: 3 });
    loc.side.troopSlots[loc.slotIndex] = upgraded;
    if (card.onPlay) {
      executeEffects(card.onPlay, {
        state: ec.state,
        ctx: ec.ctx,
        sourceSide: ec.sourceSide,
        sourceKind: "troop_play",
        sourceInstanceId: upgraded.instanceId,
        sourceCardId: card.id,
      });
    }
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "CONSTRUCT_UPGRADE", text: `構裝升級為 ${card.name}`, payload: { cardId: card.id, instanceId: upgraded.instanceId } });
  });

  registerScripted("O_TACTICAL_RETREAT", (payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    if (me.hand.length >= 9) return;
    const target = findOwnTroopByPayload(ec, payload) ?? aliveTroops(me).find((t) => !t.isConstruct);
    if (!target || target.isConstruct) return;
    const loc = findOwnTroopSlot(ec, target.instanceId);
    if (!loc) return;
    if (loc.frontline) loc.side.frontlineSlot = null;
    else loc.side.troopSlots[loc.slotIndex] = null;
    me.hand.push({ instanceId: `retreat_${ec.state.nextInstanceId++}`, cardId: target.cardId });
    getTurnFlags(ec.state).deployDiscount = Math.max(getTurnFlags(ec.state).deployDiscount ?? 0, 1);
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "TACTICAL_RETREAT", text: `${target.cardId} 撤退回手`, payload: { cardId: target.cardId } });
  });

  registerScripted("O_FULL_LINE_ROTATION", (_payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    for (const troop of [...aliveTroops(me)]) {
      if (troop.isConstruct || me.hand.length >= 9) continue;
      const loc = findOwnTroopSlot(ec, troop.instanceId);
      if (!loc) continue;
      if (loc.frontline) loc.side.frontlineSlot = null;
      else loc.side.troopSlots[loc.slotIndex] = null;
      me.hand.push({ instanceId: `rotation_${ec.state.nextInstanceId++}`, cardId: troop.cardId });
    }
    const draw = drawCards(me, 2, ec.state.rngState);
    ec.state.rngState = draw.newRngState;
    getTurnFlags(ec.state).deployDiscount = Math.max(getTurnFlags(ec.state).deployDiscount ?? 0, 2);
  });

  registerScripted("O_RESERVE_FORMATION", (_payload, ec) => {
    getTurnFlags(ec.state).reserveFormationActive = true;
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "RESERVE_FORMATION_READY", text: "本回合滿格部署將消滅最左側己方兵力騰位" });
  });
}

function registerDemon(): void {
  registerScripted("DM_FLAME_IMMUNE", () => {});
  registerScripted("DM_ENERGY_CORE_PASSIVE", () => {});
  registerScripted("DM_CURSE_GENERAL_AURA", () => {});
  registerScripted("DM_DOOM_GIANT_SPELL_IMMUNE", () => {});
  registerScripted("DM_SCORCHED_FIELD", () => {});

  registerScripted("DM_FREEZE_RANDOM_ENEMY", (payload, ec) => {
    const turns = (payload as { turns?: number } | undefined)?.turns ?? 2;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const target = aliveTroops(enemy)[0];
    if (!target) return;
    const prev = target.frozenTurns;
    target.frozenTurns = Math.max(prev, turns);
    if (turns >= prev) delete target.frozenDisplayName;
  });

  registerScripted("DM_CORRUPTION_SPREAD", (_payload, ec) => {
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    for (const troop of aliveTroops(enemy)) {
      troop.atk = Math.max(0, troop.atk - 2);
      troop.def = Math.max(0, troop.def - 2);
      troop.buffs.push({
        id: `dm_corrupt_${ec.state.nextInstanceId++}`,
        source: "DM_CORRUPTION_SPREAD",
        mod: { atk: -2, def: -2 },
        remainingTurns: 2,
      });
    }
    const me = getSide(ec.state, ec.sourceSide);
    const heroDef = ec.ctx.getHero(me.hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(me.hero, race.gauge.max, 15);
  });

  registerScripted("DM_RIFT_FIELD", (_payload, ec) => {
    const r = applyStabilityDelta(ec.state, -3, ec.ctx);
    applyCorruptionStageEffects(ec.state, r.stageJustReached);
    const me = getSide(ec.state, ec.sourceSide);
    const heroDef = ec.ctx.getHero(me.hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(me.hero, race.gauge.max, 5);
  });

  registerScripted("DM_DARK_DESCENT", (_payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    for (let i = 0; i < 3; i++) {
      const slotIdx = freeSlotIndex(me);
      if (slotIdx < 0) break;
      const card = ec.ctx.getCard("T_s_34");
      if (card.type !== "troop") break;
      me.troopSlots[slotIdx] = createTroopInstance(ec.state, card as TroopCard);
    }
    const heroDef = ec.ctx.getHero(me.hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(me.hero, race.gauge.max, 40);
    applyStabilityDelta(ec.state, -10, ec.ctx);
  });

  registerScripted("DM_DARK_SACRIFICE", (_payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const [a, b] = aliveTroops(me);
    if (!a || !b) return;
    const bonus = a.atk + a.def;
    const hpLoss = a.hp;
    removeOwnTroopSilently(ec, a, "DARK_SACRIFICE");
    b.atk += bonus;
    b.buffs.push({ id: `dark_sac_${ec.state.nextInstanceId++}`, source: "S_de_07", mod: { atk: bonus }, remainingTurns: 9999 });
    b.hp = Math.max(0, b.hp - hpLoss);
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "DARK_SACRIFICE", text: `暗黑獻祭：${b.cardId} ATK +${bonus}，HP -${hpLoss}` });
  });

  registerScripted("DM_ETERNAL_CONTRACT", (_payload, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const a = aliveTroops(me)[0];
    const b = aliveTroops(enemy).sort((x, y) => y.atk - x.atk)[0];
    if (!a || !b) return;
    if (me.hero.flags.eternalContractActive) return;
    me.hero.flags.eternalContractActive = true;
    me.hero.flags.eternalContractA = a.instanceId;
    me.hero.flags.eternalContractB = b.instanceId;
    b.hp = Math.max(0, b.hp - 1);
    b.atk = Math.max(0, b.atk - 3);
    b.buffs.push({ id: `eternal_${ec.state.nextInstanceId++}`, source: "S_de_08", mod: { atk: -3 }, remainingTurns: 9999 });
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "ETERNAL_CONTRACT", text: `${a.cardId} 與 ${b.cardId} 建立永恆契約`, payload: { a: a.instanceId, b: b.instanceId } });
  });
}
