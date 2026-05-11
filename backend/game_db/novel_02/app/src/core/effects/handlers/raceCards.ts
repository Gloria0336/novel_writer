import type { EffectContext } from "../registry";
import { registerScripted } from "../registry";
import { aliveTroops, getSide, otherSide, freeSlotIndex } from "../../selectors/battle";
import { applyHeroDamage, applyTroopDamage } from "../../combat/damage";
import { addGauge } from "../../resource/gauge";
import { addTempMana } from "../../resource/mana";
import { drawCards } from "../../deck/draw";
import { createTroopInstance } from "../../turn/factories";
import { applyStabilityDelta, applyCorruptionStageEffects } from "../../resource/stability";
import { getTurnFlags } from "./scripted";
import type { TroopCard } from "../../types/card";

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
}

// ============================================================
// 中立傳說 N01-N06
// ============================================================
function registerNeutrals(): void {
  // N01 大陸浮游鯨：法術不可選為目標（passive 標記，MVP 不嚴格實作 spell target 過濾）
  registerScripted("UNTARGETABLE_BY_SPELL", () => { /* MVP 略 */ });

  // N02 命運之輪：雙方各摧毀 ATK 最高的 1 個兵力
  registerScripted("DESTROY_HIGHEST_ATK_BOTH", (_p, ec) => {
    for (const side of ["player", "enemy"] as const) {
      const troops = aliveTroops(getSide(ec.state, side));
      if (troops.length === 0) continue;
      const top = [...troops].sort((a, b) => b.atk - a.atk)[0]!;
      top.hp = 0;
    }
  });

  // N02 敵方抽 N 張
  registerScripted("ENEMY_DRAW", (payload, ec) => {
    const count = (payload as { count?: number })?.count ?? 1;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const r = drawCards(enemy, count, ec.state.rngState);
    ec.state.rngState = r.newRngState;
  });

  // N03 虛空行者的遺書：本回合英雄攻擊與技能無視守護
  registerScripted("GRANT_IGNORE_GUARD_THIS_TURN", (_p, ec) => {
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { ignoreGuardThisTurn?: boolean }).ignoreGuardThisTurn = true;
  });

  // N04 雙月遺物：被動，每回合 +10 量表（在 onTurnStart 處理）
  registerScripted("MOON_RELIC", (_p, ec) => {
    // 這個 handler 由 passive 觸發；在 raceCards.ts 中 hookOnTurnStartScripted 會檢查英雄裝備
    const hero = getSide(ec.state, ec.sourceSide).hero;
    const heroDef = ec.ctx.getHero(hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(hero, race.gauge.max, 10);
  });

  // N05 次元壁碎片
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

  // N06 末日倒數啟動
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
// 人類 H01-H10
// ============================================================
function registerHuman(): void {
  // H04 聖殿騎士：場上每有 1 個其他己方兵力，此兵力 +1 ATK（dynamic, MVP: passive no-op；改用 onPlay 一次性快照）
  registerScripted("ATK_PER_ALLY", () => { /* dynamic，省略 */ });

  // H07 軍團集結：所有己方兵力 +3/+3 持續 2 回合；場上 ≥ 4 時翻倍
  registerScripted("LEGION_RALLY", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const troops = aliveTroops(me);
    const buffAmt = troops.length >= 4 ? 6 : 3;
    for (const t of troops) {
      t.atk += buffAmt;
      t.def += buffAmt;
      t.buffs.push({ id: `legion_${ec.state.nextInstanceId++}`, source: "H07", mod: { atk: buffAmt, def: buffAmt }, remainingTurns: 2 });
    }
  });

  // H08 帝國動員令：抽 3 張兵力牌
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

  // H08 本回合所有兵力部署費用 -2
  registerScripted("DEPLOY_DISCOUNT_THIS_TURN", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 2;
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { deployDiscount?: number }).deployDiscount = amount;
  });

  // H10 盟約之劍：被動 — 每次行動卡攻擊後隨機己方兵力 +2 ATK
  registerScripted("OATH_BLADE", () => { /* MVP：在 reducer 內單獨檢查 */ });
}

// ============================================================
// 精靈 EL01-EL10
// ============================================================
function registerElf(): void {
  // EL02 月光矢：8 傷害，共鳴 ≥ 2 改 12
  registerScripted("MOONLIGHT_ARROW", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const dmg = me.hero.gaugeValue >= 2 ? 12 : 8;
    // 對單一目標——MVP：找第一個敵方兵力，否則打英雄
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const target = aliveTroops(enemy)[0];
    if (target) {
      applyTroopDamage(target, dmg);
    } else {
      applyHeroDamage(enemy.hero, dmg);
    }
  });

  // EL03 / EL07 — 每次施法時觸發（passive，MVP 在 reducer 內單獨檢查）
  registerScripted("ATK_PER_SPELL_CAST", () => { /* MVP 略 */ });
  registerScripted("HP_PER_SPELL_CAST", () => { /* MVP 略 */ });

  // EL04 古語銘刻：下張法術翻倍
  registerScripted("DOUBLE_NEXT_SPELL", (_p, ec) => {
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { nextSpellDouble?: boolean }).nextSpellDouble = true;
  });

  // EL06 精靈結界場地（MVP 略）
  registerScripted("FIELD_ELVEN_WARD", () => { /* MVP 略：法術 +25%、部署費 +1 */ });

  // EL08 萬年詠唱：本回合共鳴不重置
  registerScripted("RESONANCE_NO_RESET", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    (me.hero.flags as { resonanceNoReset?: boolean }).resonanceNoReset = true;
  });

  // EL10 艾爾諾禁咒：50 魔法傷害；共鳴 ≥ 4 改 80 對全體
  registerScripted("AENO_FORBIDDEN", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    if (me.hero.gaugeValue >= 4) {
      applyHeroDamage(enemy.hero, 80);
      for (const t of enemy.troopSlots) {
        if (t) applyTroopDamage(t, 80);
      }
    } else {
      const target = aliveTroops(enemy)[0];
      if (target) applyTroopDamage(target, 50);
      else applyHeroDamage(enemy.hero, 50);
    }
  });
}

// ============================================================
// 矮人 D01-D10
// ============================================================
function registerDwarf(): void {
  // D02 急速鍛造：將 1 張手牌轉化為隨機裝備（MVP 簡化：隨機抽 1 件 E01-E08 加入手牌）
  registerScripted("RAPID_FORGE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    if (me.hand.length === 0 || me.hand.length >= 9) return;
    // 棄手牌頂張
    const discarded = me.hand.shift();
    if (discarded) me.graveyard.push(discarded);
    // 加入隨機裝備
    const equipIds = ["E01", "E02", "E03", "E04", "E05", "E06"];
    const pick = equipIds[Math.floor((ec.state.rngState >>> 0) % equipIds.length)] ?? "E01";
    me.hand.push({ instanceId: `forged_${ec.state.nextInstanceId++}`, cardId: pick });
  });

  // D03 合金回收：拆 1 件裝備或 1 個器具，獲得其費用 ×2 的魔力
  registerScripted("ALLOY_RECYCLE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    // 找一件已裝備的裝備
    const slots = me.hero.equipment;
    let cardId: string | undefined;
    if (slots.weapon) { cardId = slots.weapon; slots.weapon = undefined; }
    else if (slots.armor) { cardId = slots.armor; slots.armor = undefined; }
    else if (slots.trinket) { cardId = slots.trinket; slots.trinket = undefined; }
    if (cardId) {
      const card = ec.ctx.getCard(cardId);
      addTempMana(me, card.cost * 2);
      return;
    }
    // 沒裝備就拆一個器具（MVP：拆 D01/D04/D05/D09 之類的）
    const myTroops = aliveTroops(me);
    const device = myTroops.find((t) => ["D01", "D04", "D05", "D09"].includes(t.cardId));
    if (device) {
      const card = ec.ctx.getCard(device.cardId);
      device.hp = 0;
      addTempMana(me, card.cost * 2);
    }
  });

  // D04 自動哨兵被動：英雄 DEF +2（MVP：onPlay 給 +2，onDestroy -2 — 簡化為靜態加成）
  registerScripted("HERO_DEF_PLUS_2_WHILE_ALIVE", () => { /* MVP 略，已由 D04 onPlay 處理可省 */ });

  // D05 魔導砲台：每回合自動攻擊 ATK 最高的敵方兵力
  registerScripted("AUTO_TURRET_FIRE", (_p, ec) => {
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const targets = aliveTroops(enemy);
    if (targets.length === 0) return;
    const top = [...targets].sort((a, b) => b.atk - a.atk)[0]!;
    applyTroopDamage(top, 8);
  });

  // D05 免疫法術傷害（MVP 略）
  registerScripted("IMMUNE_SPELL_DAMAGE", () => { /* MVP 略 */ });

  // D06 礦脈爆破：傷害 = (已裝備裝備數 + 場上器具數) × 8
  registerScripted("MINEVEIN_BLAST", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const equipped = [me.hero.equipment.weapon, me.hero.equipment.armor, me.hero.equipment.trinket].filter(Boolean).length;
    const devices = aliveTroops(me).filter((t) => ["D01", "D04", "D05", "D09"].includes(t.cardId)).length;
    const dmg = (equipped + devices) * 8;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const target = aliveTroops(enemy)[0];
    if (target) applyTroopDamage(target, dmg);
    else applyHeroDamage(enemy.hero, dmg);
  });

  // D07 矮人麥酒：恢復英雄 12 HP；裝備 ≥ 2 件時額外 +8
  registerScripted("DWARF_ALE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const equipCount = [me.hero.equipment.weapon, me.hero.equipment.armor, me.hero.equipment.trinket].filter(Boolean).length;
    const heal = equipCount >= 2 ? 20 : 12;
    me.hero.hp = Math.min(me.hero.maxHp, me.hero.hp + heal);
  });

  // D08 祖傳圖紋：永久所有裝備與器具費用 -1
  registerScripted("ANCESTRAL_BLUEPRINT", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    (me.hero.flags as { equipDiscount?: number }).equipDiscount = ((me.hero.flags as { equipDiscount?: number }).equipDiscount ?? 0) + 1;
  });

  // D09 攻城巨砲：對敵方英雄造 N 固定傷害
  registerScripted("DAMAGE_ENEMY_HERO_FIXED", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 10;
    applyHeroDamage(getSide(ec.state, otherSide(ec.sourceSide)).hero, amount, { ignoreDef: true });
  });

  // D10 氏族戰錘：被動，依裝備/器具數動態 +ATK
  registerScripted("CLAN_WARHAMMER", () => { /* MVP 略 */ });
}

// ============================================================
// 妖族 Y01-Y10（含人形/妖形切換）
// ============================================================
function getFeyForm(ec: EffectContext): "human" | "fey" {
  const me = getSide(ec.state, ec.sourceSide);
  return me.hero.flags.feyForm ?? "human";
}

function registerFey(): void {
  // Y03 狐火
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

  // Y04 蛇妖衛士被動（MVP 略）
  registerScripted("Y_SERPENT_GUARD", () => { /* MVP 略 */ });

  // Y05 千年妖核：靈蘊上限 +50（MVP 略）/ 切換時恢復 5 HP
  registerScripted("Y_ESSENCE_CORE", () => { /* MVP 略 */ });

  // Y06 形態切換
  registerScripted("Y_FORM_TOGGLE", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    hero.flags.feyForm = (hero.flags.feyForm ?? "human") === "human" ? "fey" : "human";
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FORM_TOGGLE", text: `切換為${hero.flags.feyForm === "fey" ? "妖形" : "人形"}` });
  });

  // Y06 本回合受傷 -50%
  registerScripted("Y_DAMAGE_REDUCE_THIS_TURN", (payload, ec) => {
    const pct = (payload as { pct?: number })?.pct ?? 50;
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { damageReducePct?: number }).damageReducePct = pct;
  });

  // Y07 百鬼夜行：人形召 2 個幻影；妖形召 1 個妖獸
  registerScripted("Y_HUNDRED_GHOSTS", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const cardId = getFeyForm(ec) === "human" ? "I_PHANTOM" : "I_YOUKAI_BEAST";
    const count = getFeyForm(ec) === "human" ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const slotIdx = freeSlotIndex(me);
      if (slotIdx < 0) break;
      const card = ec.ctx.getCard(cardId);
      if (card.type !== "troop") break;
      me.troopSlots[slotIdx] = createTroopInstance(ec.state, card as TroopCard);
    }
  });

  // Y08 幻境迷陣
  registerScripted("Y_ILLUSION_MAZE", (_p, ec) => {
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    if (getFeyForm(ec) === "human") {
      // 敵方所有兵力 ATK -4 持續 2 回合
      for (const t of aliveTroops(enemy)) {
        t.atk = Math.max(0, t.atk - 4);
        t.buffs.push({ id: `maze_${ec.state.nextInstanceId++}`, source: "Y08", mod: { atk: -4 }, remainingTurns: 2 });
      }
    } else {
      // 妖形：控制敵方 1 個兵力 2 回合（MVP 簡化為凍結 2 回合）
      const target = aliveTroops(enemy)[0];
      if (target) target.frozenTurns = Math.max(target.frozenTurns, 2);
    }
  });

  // Y09 九尾妖狐：人形→威壓；妖形→疾走+汲取
  registerScripted("Y_NINETAILS_KEYWORDS", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const self = aliveTroops(me).find((t) => t.cardId === "Y09");
    if (!self) return;
    if (getFeyForm(ec) === "human") {
      self.keywords.add("menace");
    } else {
      self.keywords.add("haste");
      self.keywords.add("lifesteal");
    }
  });

  // Y10 始祖之血：進入「始祖妖形」（MVP：給己方所有兵力 +3/+3）
  registerScripted("Y_PRIMORDIAL_BLOOD", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    me.hero.flags.feyForm = "fey";
    me.hero.flags.primordialFey = 2;
    for (const t of aliveTroops(me)) {
      t.atk += 3;
      t.def += 3;
      t.buffs.push({ id: `primord_${ec.state.nextInstanceId++}`, source: "Y10", mod: { atk: 3, def: 3 }, remainingTurns: 2 });
    }
  });
}

// ============================================================
// 獸族 B01-B10
// ============================================================
function registerBeast(): void {
  // B01 鮮血祭祀：對己方 1 個兵力發動血祭（HP -50%, ATK ×2 持續 2 回合）；額外 ATK +3；血怒 +1
  registerScripted("B_BLOOD_RITE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const target = aliveTroops(me)[0];
    if (!target) return;
    const isSavageFang = target.cardId === "B02";
    const mult = isSavageFang ? 3 : 2;
    target.hp = Math.max(1, Math.floor(target.hp * 0.5));
    target.atk = target.atk * mult + 3;
    target.buffs.push({ id: `bloodrite_${ec.state.nextInstanceId++}`, source: "B01", mod: { atk: target.atk - 3 }, remainingTurns: 2 });
    const heroDef = ec.ctx.getHero(me.hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(me.hero, race.gauge.max, 1);
  });

  // B02 蠻牙戰士被動（B01 已處理）
  registerScripted("B_SAVAGEFANG_BLOODRITE_X3", () => { /* B01 已動態處理 */ });

  // B04 巨角衝鋒獸謝幕：對擊殺者造成 5 傷害（MVP 簡化：對對方任一兵力造 5 傷）
  registerScripted("B_THORNS_TO_KILLER", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 5;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const target = aliveTroops(enemy)[0];
    if (target) applyTroopDamage(target, amount);
  });

  // B05 狼群戰術：每次命中 +1 血怒（MVP：標記）
  registerScripted("B_PACK_TACTICS_MARK", (_p, ec) => {
    const flags = getTurnFlags(ec.state);
    (flags as unknown as { packTacticsActive?: boolean }).packTacticsActive = true;
  });

  // B06 蠻力突進：英雄 ATK 傷害無視護甲與守護；血怒 ≥ 5 時 +10
  registerScripted("B_BRUTE_CHARGE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    let dmg = me.hero.atk;
    if (me.hero.gaugeValue >= 5) dmg += 10;
    const target = aliveTroops(enemy)[0];
    if (target) applyTroopDamage(target, dmg, { ignoreDef: false });
    else applyHeroDamage(enemy.hero, dmg);
  });

  // B07 戰痕勳章被動（MVP 略）
  registerScripted("B_BATTLE_SCAR_MEDAL", () => { /* MVP 略 */ });

  // B08 原始狂嚎：所有己方兵力立即進入血祭狀態
  registerScripted("B_PRIMAL_HOWL", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    for (const t of aliveTroops(me)) {
      t.hp = Math.max(1, Math.floor(t.hp * 0.5));
      const origAtk = t.atk;
      t.atk = origAtk * 2;
      t.buffs.push({ id: `primhowl_${ec.state.nextInstanceId++}`, source: "B08", mod: { atk: origAtk }, remainingTurns: 2 });
    }
    const heroDef = ec.ctx.getHero(me.hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    addGauge(me.hero, race.gauge.max, 3);
  });

  // B10 始祖獸魂：血怒立即疊至 10；3 回合內血怒不因治療降低；所有己方兵力進入血祭但不損 HP
  registerScripted("B_PRIMORDIAL_BEAST_SOUL", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    me.hero.gaugeValue = 10;
    for (const t of aliveTroops(me)) {
      const origAtk = t.atk;
      t.atk = origAtk * 2;
      t.buffs.push({ id: `pbsoul_${ec.state.nextInstanceId++}`, source: "B10", mod: { atk: origAtk }, remainingTurns: 3 });
    }
    (me.hero.flags as { rageLockTurns?: number }).rageLockTurns = 3;
  });
}

// ============================================================
// 半神族 G01-G10（含透支機制）
// ============================================================
function registerDemigod(): void {
  // G02 殘響共振：移除 2 層透支；透支為 0 時改為恢復英雄 10 HP
  registerScripted("G_ECHO_RESONANCE", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    const overdraft = (hero.flags.overdraft as number | undefined) ?? 0;
    if (overdraft > 0) {
      hero.flags.overdraft = Math.max(0, overdraft - 2);
    } else {
      hero.hp = Math.min(hero.maxHp, hero.hp + 10);
    }
  });

  // G03 信徒被動：英雄受傷時此兵力代替承受 5 傷害（MVP 略）
  registerScripted("G_FOLLOWER_PROXY", () => { /* MVP 略 */ });

  // G04 神域結界：N 回合內英雄受傷 -X%（用 turn flag 簡化）
  registerScripted("G_DIVINE_BARRIER", (payload, ec) => {
    const turns = (payload as { turns?: number })?.turns ?? 2;
    const pct = (payload as { pct?: number })?.pct ?? 30;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    (hero.flags as { divineBarrierTurns?: number; divineBarrierPct?: number }).divineBarrierTurns = turns;
    (hero.flags as { divineBarrierTurns?: number; divineBarrierPct?: number }).divineBarrierPct = pct;
  });

  // G05 超越極限：消耗英雄 10% 當前 HP
  registerScripted("G_TRANSCEND", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    const dmg = Math.max(1, Math.floor(hero.hp * 0.1));
    hero.hp = Math.max(1, hero.hp - dmg);
  });

  // G06 透支 +N
  registerScripted("G_OVERDRAFT_ADD", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 1;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    hero.flags.overdraft = ((hero.flags.overdraft as number | undefined) ?? 0) + amount;
  });

  // G09 透支 -N
  registerScripted("G_OVERDRAFT_REMOVE", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 1;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    hero.flags.overdraft = Math.max(0, ((hero.flags.overdraft as number | undefined) ?? 0) - amount);
  });

  // G07 神隱：本回合英雄受到的下 1 次傷害完全無效
  registerScripted("G_DIVINE_HIDE", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    (hero.flags as { divineHideOnce?: boolean }).divineHideOnce = true;
  });

  // G08 神言：崩壞 — 消耗 40 神力殘響；對全體敵方造成 25 固定傷害；己方兵力也受 10 傷害；透支 +3
  registerScripted("G_DIVINE_WORD_COLLAPSE", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    if (me.hero.gaugeValue < 40) return;
    me.hero.gaugeValue -= 40;
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

  // G10 創世殘章：消耗所有神力殘響（至少 50）；對敵方英雄造成（消耗量 ×1.5）傷害；無視守護；清除所有透支；己方兵力全摧毀
  registerScripted("G_GENESIS_FRAGMENT", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    if (me.hero.gaugeValue < 50) return;
    const consumed = me.hero.gaugeValue;
    me.hero.gaugeValue = 0;
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
