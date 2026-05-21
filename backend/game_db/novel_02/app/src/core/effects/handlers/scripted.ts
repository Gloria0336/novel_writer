import type { EffectContext } from "../registry";
import { registerScripted } from "../registry";
import { aliveTroops, getSide, otherSide } from "../../selectors/battle";
import { applyHeroDamage, applyTroopDamage } from "../../combat/damage";
import { addMorale } from "../../resource/morale";
import { addTempMana } from "../../resource/mana";
import { applyStabilityDelta, applyCorruptionStageEffects } from "../../resource/stability";
import { notifyBossGauge } from "../../resource/bossGauge";
import { openRiftIfNeeded, applyRiftBuff } from "../../resource/rift";
import { drawCards } from "../../deck/draw";
import { createTroopInstance } from "../../turn/factories";
import type { TroopInstance } from "../../types/battle";
import type { StatModifier } from "../../types/effect";
import type { ActiveBuff, HeroInstance } from "../../types/hero";
import type { TroopCard } from "../../types/card";
import { syncFullGaugeBuffs } from "../../resource/fullGaugeBuff";
import { getTurnFlags } from "../../turn/turnFlags";

export { getTurnFlags, resetTurnFlags } from "../../turn/turnFlags";

export function registerCoreScripted(): void {
  // T_c_05 回合結束治療相鄰兵力
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

  // T_c_09 重裝騎兵：首次攻擊傷害 ×2（簡化：戰鬥前由攻擊端檢查 set）
  registerScripted("FIRST_ATTACK_DOUBLE", (_p, ec) => {
    if (ec.sourceInstanceId) {
      const f = getTurnFlags(ec.state);
      f.firstAttackDoubleInstanceIds.add(ec.sourceInstanceId);
    }
  });

  // T_c_12 老練傭兵隊長：使另一個己方兵力獲得突進
  registerScripted("GIVE_ANOTHER_RUSH", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    const others = aliveTroops(side).filter((t) => t.instanceId !== ec.sourceInstanceId);
    if (others.length === 0) return;
    others[0]!.keywords.add("rush");
  });

  // T_c_13 精英禁衛：英雄受到行動卡傷害時代替承受一半（複雜，MVP 略過 — 標記 passive 即可）
  registerScripted("ABSORB_HALF_HERO_ACTION_DAMAGE", () => { /* MVP 略 */ });

  // A_c_06 致命突刺：若擊殺，鬥志 +20
  registerScripted("MORALE_IF_KILLED", (payload, ec) => {
    // 直接給；嚴格判定要看 last damage 結果，MVP 直接給（reapDeadTroops 已處理擊殺鬥志）
    // 為了精確，這裡略過讓 MORALE_KILL_TROOP 處理
    const amount = (payload as { amount?: number })?.amount ?? 20;
    addMorale(getSide(ec.state, ec.sourceSide).hero, amount - 15); // 額外 +5（已加 15 by reap）
  });

  // A_c_08 奮力一搏：英雄自傷 10（不可減免）
  registerScripted("SELF_DAMAGE_FIXED", (payload, ec) => {
    const amount = (payload as { amount?: number })?.amount ?? 10;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    applyHeroDamage(hero, amount, { fixed: true });
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "SELF_DAMAGE", text: `自傷 ${amount}` });
  });

  // A_c_09 全力一擊：本回合無法再使用行動卡
  registerScripted("DISABLE_ACTION_THIS_TURN", (_p, ec) => {
    getTurnFlags(ec.state).actionDisabledThisTurn = true;
  });

  // A_c_10 星落之劍
  registerScripted("STARFALL_BLADE", (_p, ec) => {
    const heroAtk = getSide(ec.state, ec.sourceSide).hero.atk;
    let amount = heroAtk * 2 + 20;
    if (ec.state.stability <= 50) amount += 15;
    // 攻擊敵方英雄（無視 DEF 與守護）
    const enemyHero = getSide(ec.state, otherSide(ec.sourceSide)).hero;
    applyHeroDamage(enemyHero, amount, { ignoreDef: true });
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "STARFALL", text: `星落之劍對敵方英雄造 ${amount} 傷害`, payload: { amount } });
  });

  // S_c_11/A_b_01 等：本回合可額外使用 N 張行動卡（MVP：標記 flag，不嚴格限制行動次數）
  registerScripted("EXTRA_ACTIONS", (payload, ec) => {
    const count = (payload as { count?: number } | undefined)?.count ?? 2;
    getTurnFlags(ec.state).extraActionsThisTurn += count;
  });

  // S_c_14 盟約之誓：三選一。未傳選項時保留舊行為，預設全面恢復。
  registerScripted("OATH_CHOICE", (payload, ec) => {
    const choice = readOathChoice(payload);
    const side = getSide(ec.state, ec.sourceSide);

    if (choice === "strengthen") {
      for (const t of aliveTroops(side)) {
        t.atk += 5;
        t.buffs.push({ id: `oath_atk_${ec.state.nextInstanceId++}`, source: "S_c_14", mod: { atk: 5 }, remainingTurns: 3 });
      }
      ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "OATH", text: "盟約之誓：全面強化" });
      return;
    }

    if (choice === "purify") {
      const removed = purifySide(side);
      side.hero.flags.oathDebuffImmuneUntilTurn = ec.state.turn;
      ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "OATH", text: `盟約之誓：全面淨化（移除 ${removed} 個負面狀態）` });
      return;
    }

    side.hero.hp = Math.min(side.hero.maxHp, side.hero.hp + 30);
    for (const t of aliveTroops(side)) {
      t.hp = Math.min(t.maxHp, t.hp + 10);
    }
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "OATH", text: "盟約之誓：全面恢復" });
  });

  // E_c_03 幸運墜飾、E_c_04 符文長劍、E_c_05 矮人鍛甲、E_c_06 指揮官戰冠、E_c_07 噬魂戰刃、E_c_08 龍鱗胸甲
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

  // v3.3 F_c_08 次元裂縫【重作】：升級已開啟裂縫為「加強裂縫」狀態
  // ① 玩家佔據者獲〔穿透〕 ② 敵方滲透體抽取池往上一階（由 selectInfiltratorPool 處理）
  // ③ 法術行動傷害 +50%（場地系統整合留 Stage 3；本 Stage 只設 enhanced flag）
  registerScripted("FIELD_DIMENSIONAL_RIFT", (_p, ec) => {
    const rift = ec.state.rift;
    if (!rift) {
      ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FIELD_RIFT_NOOP", text: "F_c_08 次元裂縫：無裂縫可加強，效果無作用。" });
      return;
    }
    rift.enhanced = true;
    // 對玩家當前佔據者加〔穿透〕關鍵字
    if (rift.holder === "player" && rift.occupant) {
      rift.occupant.keywords.add("pierce");
    }
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FIELD_RIFT_ENHANCE", text: "次元裂縫升級為加強裂縫！滲透池升階，佔據者獲〔穿透〕。" });
  });

  // v3.3 S_l_03 次元壁碎片：滿穩定度時改為全體 15 傷害；否則 +25 穩定度 + 抽 1
  registerScripted("DIMENSION_SHARD", (_p, ec) => {
    const state = ec.state;
    if (state.stability >= 100) {
      // 對敵方全體（英雄 + 兵力）造成 15 傷害
      const enemySide = getSide(state, otherSide(ec.sourceSide));
      applyHeroDamage(enemySide.hero, 15, {});
      for (const t of aliveTroops(enemySide)) {
        applyTroopDamage(t, 15, {});
      }
      state.log.push({ turn: state.turn, side: ec.sourceSide, kind: "DIMENSION_SHARD_BURST", text: "次元壁碎片：穩定度滿值轉化為對敵方全體 15 傷害" });
      return;
    }
    // 否則：穩定度 +25 + 抽 1
    const r = applyStabilityDelta(state, 25);
    applyCorruptionStageEffects(state, r.stageJustReached);
    // +25 不會觸發開裂縫（只有跌破才會），仍呼叫 openRiftIfNeeded 為防禦性 no-op
    openRiftIfNeeded(state);
    const draw = drawCards(getSide(state, ec.sourceSide), 1, state.rngState);
    state.rngState = draw.newRngState;
    state.log.push({ turn: state.turn, side: ec.sourceSide, kind: "DIMENSION_SHARD", text: `次元壁碎片：穩定度 +25 → ${r.newValue}，抽 1 張` });
  });

  // v3.3 S_c_15 裂痕召喚：免費把指定手牌兵力部署到裂縫位
  // payload: { handCardInstanceId: string } — 由 reducer playSpell 注入
  registerScripted("RIFT_CALL", (payload, ec) => {
    const state = ec.state;
    const rift = state.rift;
    if (!rift || rift.holder !== "open") {
      state.log.push({ turn: state.turn, side: ec.sourceSide, kind: "RIFT_CALL_NOOP", text: "S_c_15 裂痕召喚：裂縫不可佔據" });
      return;
    }
    const instId = (payload as { handCardInstanceId?: string } | undefined)?.handCardInstanceId;
    if (!instId) return;
    const side = getSide(state, ec.sourceSide);
    const handIdx = side.hand.findIndex((c) => c.instanceId === instId);
    if (handIdx < 0) {
      state.log.push({ turn: state.turn, side: ec.sourceSide, kind: "RIFT_CALL_NOOP", text: "S_c_15 裂痕召喚：手牌目標已不存在" });
      return;
    }
    const handCard = side.hand[handIdx]!;
    const card = ec.ctx.getCard(handCard.cardId);
    if (card.type !== "troop") return;
    // 移除手牌、放入棄牌堆
    side.hand.splice(handIdx, 1);
    side.graveyard.push(handCard);
    // 建立 instance 並佔據裂縫
    const inst = createTroopInstance(state, card as TroopCard);
    applyRiftBuff(inst);
    rift.occupant = inst;
    rift.holder = "player";
    rift.s15UsesPlayer += 1;
    state.log.push({ turn: state.turn, side: ec.sourceSide, kind: "RIFT_CALL", text: `S_c_15 裂痕召喚：${card.name} 免費部署到次元裂縫`, payload: { cardId: card.id, instanceId: inst.instanceId, atk: inst.atk, def: inst.def } });
    // 觸發入場曲
    if (card.onPlay) {
      for (const eff of card.onPlay) {
        if (eff.kind === "scripted") {
          // 套用入場曲（scripted 經由 registry）— 簡化：直接呼叫 registerCoreScripted handler？
          // MVP：先記日誌，複雜入場曲在 Stage 3 完整處理
        }
      }
    }
  });

  // v3.3 S_c_16 裂縫共鳴：抽 2 + 鬥志 +20；玩家佔據時佔據者疾走（清 hasAttackedThisTurn）
  registerScripted("RIFT_RESONANCE", (_p, ec) => {
    const state = ec.state;
    const rift = state.rift;
    if (!rift) {
      state.log.push({ turn: state.turn, side: ec.sourceSide, kind: "RIFT_RESONANCE_NOOP", text: "S_c_16 裂縫共鳴：場上無裂縫" });
      return;
    }
    const side = getSide(state, ec.sourceSide);
    // 抽 2 張
    const draw = drawCards(side, 2, state.rngState);
    state.rngState = draw.newRngState;
    // 鬥志 +20
    addMorale(side.hero, 20);
    rift.s16UsedPlayer = true;
    state.log.push({ turn: state.turn, side: ec.sourceSide, kind: "RIFT_RESONANCE", text: `S_c_16 裂縫共鳴：抽 ${draw.drawn} 張、鬥志 +20` });
    // 玩家佔據時佔據者疾走（清 hasAttackedThisTurn 並 suppress summoningSickness）
    if (rift.holder === "player" && rift.occupant) {
      rift.occupant.hasAttackedThisTurn = false;
      rift.occupant.summonedThisTurn = false;
      state.log.push({ turn: state.turn, side: ec.sourceSide, kind: "RIFT_RESONANCE_HASTE", text: `S_c_16 追加：佔據者 ${rift.occupant.cardId} 立即可再行動` });
    }
  });

  // §E.1/§E.2 — Boss / 巢穴專屬機制
  registerScripted("FIELD_BURN_APPLY", (_p, ec) => {
    // F_s_01 placement: enemy — Boss 將獄火寫入「對手槽位」，每回合燒槽位方兵力。
    const victimSide = ec.sourceSide === "player" ? "enemy" : "player";
    ec.state.field[victimSide] = { cardId: "F_s_01" };
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FIELD_SET", text: "獄火場地已籠罩戰場！" });
  });

  // §E.2 蟲族窩巢：場上 ≥5 蟲母幼體合併為蟲后。
  registerScripted("INSECT_MERGE", (_p, ec) => {
    const enemy = ec.state.enemy;
    const larvae: { slotIdx: number; troop: TroopInstance }[] = [];
    for (let i = 0; i < enemy.troopSlots.length; i++) {
      const t = enemy.troopSlots[i];
      if (t && t.cardId === "T_s_08") larvae.push({ slotIdx: i, troop: t });
    }
    if (larvae.length < 5) return;
    const consume = larvae.slice(0, 5);
    const targetSlot = consume[0]!.slotIdx;
    for (let i = 1; i < 5; i++) enemy.troopSlots[consume[i]!.slotIdx] = null;
    const queenCard = ec.ctx.getCard("T_s_09");
    if (queenCard.type !== "troop") return;
    ec.state.nextInstanceId++;
    enemy.troopSlots[targetSlot] = {
      instanceId: `t${ec.state.nextInstanceId}`,
      cardId: "T_s_09",
      hp: queenCard.hp, maxHp: queenCard.hp,
      atk: queenCard.atk, def: queenCard.def,
      keywords: new Set(queenCard.keywords),
      hasAttackedThisTurn: true, summonedThisTurn: true, frozenTurns: 0,
      buffs: [],
    };
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "INSECT_MERGE", text: "5 隻蟲母幼體合併為蟲后！" });
  });

  // §E.2 晶體礦脈：3 個晶體碎片合併為晶體魔像。
  registerScripted("CRYSTAL_MERGE", (_p, ec) => {
    const enemy = ec.state.enemy;
    const shards: { slotIdx: number; troop: TroopInstance }[] = [];
    for (let i = 0; i < enemy.troopSlots.length; i++) {
      const t = enemy.troopSlots[i];
      if (t && t.cardId === "T_s_20") shards.push({ slotIdx: i, troop: t });
    }
    if (shards.length < 3) return;
    const consume = shards.slice(0, 3);
    const targetSlot = consume[0]!.slotIdx;
    for (let i = 1; i < 3; i++) enemy.troopSlots[consume[i]!.slotIdx] = null;
    const golemCard = ec.ctx.getCard("T_s_22");
    if (golemCard.type !== "troop") return;
    ec.state.nextInstanceId++;
    enemy.troopSlots[targetSlot] = {
      instanceId: `t${ec.state.nextInstanceId}`,
      cardId: "T_s_22",
      hp: golemCard.hp, maxHp: golemCard.hp,
      atk: golemCard.atk, def: golemCard.def,
      keywords: new Set(golemCard.keywords),
      hasAttackedThisTurn: true, summonedThisTurn: true, frozenTurns: 0,
      buffs: [],
    };
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "CRYSTAL_MERGE", text: "3 片晶體合併為晶體魔像！" });
  });

  // §E.2 腐化神殿：祭司存活時巢穴 +5 HP / 回合。
  registerScripted("TEMPLE_PRIEST_HEAL", (_p, ec) => {
    const enemy = ec.state.enemy;
    const hasPriest = aliveTroops(enemy).some((t) => t.cardId === "T_s_24");
    if (!hasPriest) return;
    const before = enemy.hero.hp;
    enemy.hero.hp = Math.min(enemy.hero.maxHp, enemy.hero.hp + 5);
    if (enemy.hero.hp !== before) {
      ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "LAIR_HEAL", text: `腐化神殿：祭司誦經 +${enemy.hero.hp - before} HP` });
    }
  });

  // §E.2 魔獸洞穴：HP ≤ 50% 時，所有友方兵力 ATK ×2（補上一次性 buff）。
  registerScripted("BEAST_HALFHP_DOUBLE_ATK", (_p, ec) => {
    const enemy = ec.state.enemy;
    const halfhp = enemy.hero.hp <= enemy.hero.maxHp * 0.5;
    const flagApplied = enemy.hero.flags.beastFrenzyApplied === true;
    if (halfhp && !flagApplied) {
      for (const t of aliveTroops(enemy)) {
        const bonus = t.atk;
        t.atk += bonus;
        t.buffs.push({ id: `beast_frenzy_${ec.state.nextInstanceId++}`, source: "BEAST_HALFHP", mod: { atk: bonus }, remainingTurns: 999 });
      }
      enemy.hero.flags.beastFrenzyApplied = true;
      ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "BEAST_FRENZY", text: "魔獸洞穴：獸群暴怒！所有友方兵力 ATK 翻倍。" });
    }
  });

  // §E.2 暗影門戶：每回合穩定度 -3。
  registerScripted("SHADOW_TICK", (_p, ec) => {
    ec.state.stability = Math.max(0, ec.state.stability - 3);
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "SHADOW_TICK", text: "暗影門戶滲漏：穩定度 -3" });
  });

  // §E.1 古魔兵力：攻擊命中時穩定度 -1（簡化：被觸發時固定 -1）。
  registerScripted("ELDER_TOUCH", (_p, ec) => {
    ec.state.stability = Math.max(0, ec.state.stability - 1);
  });

  // §E.1 妖族叛王：形態切換（人形 ↔ 妖形）+ 數值套用。
  registerScripted("FEY_FORM_SWITCH", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    const next: "fey" | "human" = hero.flags.feyForm === "fey" ? "human" : "fey";
    hero.flags.feyForm = next;
    if (next === "fey") {
      hero.atk += 6; hero.def += 4;
      hero.buffs.push({ id: `fey_form_${ec.state.nextInstanceId++}`, source: "FEY_FORM", mod: { atk: 6, def: 4 }, remainingTurns: 999 });
    } else {
      // 切回人形：撤銷 fey 增益（簡化：找最近的 FEY_FORM buff 移除）
      const idx = hero.buffs.findIndex((b) => b.source === "FEY_FORM");
      if (idx >= 0) {
        const b = hero.buffs[idx]!;
        hero.atk = Math.max(0, hero.atk - (b.mod.atk ?? 0));
        hero.def = Math.max(0, hero.def - (b.mod.def ?? 0));
        hero.buffs.splice(idx, 1);
      }
    }
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FEY_FORM", text: `妖族叛王切換為${next === "fey" ? "妖形" : "人形"}。` });
    // BossGauge：形態切換（妖族叛王雙形共鳴）
    if (ec.sourceSide === "enemy") notifyBossGauge(ec.state, ec.ctx, { kind: "onFormSwitch" });
  });

  // §E.1 妖族叛王 ult：祖靈降臨（3 回合內同享雙形態）— MVP 加雙形態 buff。
  registerScripted("FEY_ANCESTOR_FORM", (payload, ec) => {
    const turns = (payload as { turns?: number })?.turns ?? 3;
    const hero = getSide(ec.state, ec.sourceSide).hero;
    hero.atk += 6; hero.def += 4;
    hero.buffs.push({ id: `fey_anc_${ec.state.nextInstanceId++}`, source: "FEY_ANCESTOR", mod: { atk: 6, def: 4 }, remainingTurns: turns });
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FEY_ANCESTOR", text: "祖靈降臨 — 妖族叛王同享雙形態加成！" });
  });

  // §C.5 軍團統帥 ultimate：帝國總動員（玩家側 / boss 共用）— MVP 全部兵力 ATK +5。
  registerScripted("TOTAL_MOBILIZATION", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    for (const t of aliveTroops(side)) {
      t.atk += 5;
      t.buffs.push({ id: `mobilize_${ec.state.nextInstanceId++}`, source: "MOBILIZE", mod: { atk: 5 }, remainingTurns: 1 });
    }
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "MOBILIZE", text: "帝國總動員：本回合兵力 ATK +5" });
  });

  // §C.5 蠻血酋長/獸王 ultimate：祖獸覺醒。
  registerScripted("PRIMAL_AWAKENING", (_p, ec) => {
    const hero = getSide(ec.state, ec.sourceSide).hero;
    const rage = hero.gaugeValue;
    const amount = (hero.atk + rage * 5) * 2;
    const enemyHero = getSide(ec.state, otherSide(ec.sourceSide)).hero;
    applyHeroDamage(enemyHero, amount, { ignoreDef: false });
    hero.gaugeValue = 0;
    syncFullGaugeBuffs(ec.state, ec.ctx);
    hero.hp = Math.min(hero.maxHp, hero.hp + Math.round(hero.maxHp * 0.3));
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "PRIMAL", text: `祖獸覺醒：對敵方英雄造 ${amount} 傷害，HP +30%。`, payload: { amount } });
  });
}

  // ── 腐植巢穴 ──────────────────────────────────────────────────────────────

  // 腐植觸手：onTurnEnd 對玩家英雄造成 1 傷害，最多持續 3 回合後停止。
  // 使用 troop.buffs 追蹤已觸發次數（buff id = "drain_count"）。
  registerScripted("PUTREFACTIVE_DRAIN_3", (_p, ec) => {
    const id = ec.sourceInstanceId;
    if (!id) return;
    const enemy = ec.state.enemy;
    const troop = enemy.troopSlots.find((t) => t && t.instanceId === id);
    if (!troop) return;
    let counter = troop.buffs.find((b) => b.source === "DRAIN_COUNT");
    if (!counter) {
      counter = { id: `drain_${ec.state.nextInstanceId++}`, source: "DRAIN_COUNT", mod: { atk: 0 }, remainingTurns: 999 };
      (counter as unknown as { count: number }).count = 0;
      troop.buffs.push(counter);
    }
    const c = counter as unknown as { count: number };
    if (c.count >= 3) return;
    c.count += 1;
    const playerHero = ec.state.player.hero;
    applyHeroDamage(playerHero, 1, {});
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "PUTREFACTIVE_DRAIN", text: `腐植觸手侵蝕（第 ${c.count}/3 回合）：玩家英雄 -1 HP` });
  });

  // 腐植膿瘤：onDestroy 爆發腐液，對所有玩家兵力造成 2 傷害。
  registerScripted("PUSS_BURST", (_p, ec) => {
    const player = ec.state.player;
    let hit = 0;
    for (const t of aliveTroops(player)) {
      applyTroopDamage(t, 2, {});
      hit++;
    }
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "PUSS_BURST", text: `腐植膿瘤爆裂：對 ${hit} 隻玩家兵力各造成 2 傷害` });
  });

  // 腐植巢穴 aura：每回合結束時擴散（目前為 log 佔位，Stage 3 可加強化邏輯）。
  registerScripted("PUTREFACTIVE_SPREAD", (_p, ec) => {
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "PUTREFACTIVE_SPREAD", text: "腐植蔓延…" });
  });

  // ── 蟲族窩巢 ──────────────────────────────────────────────────────────────

  // 蟲后光環 aura（onStart）：蟲后在場時，所有敵方兵力 ATK +1（一次性 flag 控制；蟲后死亡後撤銷）。
  registerScripted("QUEEN_AURA", (_p, ec) => {
    const enemy = ec.state.enemy;
    const queenAlive = aliveTroops(enemy).some((t) => t.cardId === "T_s_09");
    const auraApplied = enemy.hero.flags.queenAuraApplied === true;
    if (queenAlive && !auraApplied) {
      for (const t of aliveTroops(enemy)) {
        t.atk += 1;
        t.buffs.push({ id: `queen_aura_${ec.state.nextInstanceId++}`, source: "QUEEN_AURA", mod: { atk: 1 }, remainingTurns: 999 });
      }
      enemy.hero.flags.queenAuraApplied = true;
      ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "QUEEN_AURA", text: "蟲后光環：所有蟲族兵力 ATK +1" });
    } else if (!queenAlive && auraApplied) {
      for (const t of aliveTroops(enemy)) {
        const buffIdx = t.buffs.findIndex((b) => b.source === "QUEEN_AURA");
        if (buffIdx >= 0) {
          t.atk = Math.max(0, t.atk - 1);
          t.buffs.splice(buffIdx, 1);
        }
      }
      enemy.hero.flags.queenAuraApplied = false;
      ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "QUEEN_AURA_FADE", text: "蟲后已死，ATK 光環消退" });
    }
  });

  // 甲蟲衛士光環 aura（onStart）：甲蟲衛士在場時，所有敵方兵力 DEF +1。
  registerScripted("BEETLE_SHELL_AURA", (_p, ec) => {
    const enemy = ec.state.enemy;
    const beetleAlive = aliveTroops(enemy).some((t) => t.cardId === "T_s_11");
    const auraApplied = enemy.hero.flags.beetleShellApplied === true;
    if (beetleAlive && !auraApplied) {
      for (const t of aliveTroops(enemy)) {
        t.def += 1;
        t.buffs.push({ id: `beetle_shell_${ec.state.nextInstanceId++}`, source: "BEETLE_SHELL", mod: { def: 1 }, remainingTurns: 999 });
      }
      enemy.hero.flags.beetleShellApplied = true;
      ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "BEETLE_SHELL", text: "甲蟲衛士：所有蟲族兵力 DEF +1" });
    } else if (!beetleAlive && auraApplied) {
      for (const t of aliveTroops(enemy)) {
        const buffIdx = t.buffs.findIndex((b) => b.source === "BEETLE_SHELL");
        if (buffIdx >= 0) {
          t.def = Math.max(0, t.def - 1);
          t.buffs.splice(buffIdx, 1);
        }
      }
      enemy.hero.flags.beetleShellApplied = false;
      ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "BEETLE_SHELL_FADE", text: "甲蟲衛士已死，DEF 光環消退" });
    }
  });

  // 甲蟲衛士 passive 標記（passive 欄位用，實際邏輯由 BEETLE_SHELL_AURA 驅動）。
  registerScripted("BEETLE_SHELL", () => { /* 由 BEETLE_SHELL_AURA 光環驅動 */ });

  // 糧蟲 onTurnEnd：回復全場友方（英雄+兵力）1 HP。
  registerScripted("FOOD_BUG_HEAL_TICK", (_p, ec) => {
    const enemy = ec.state.enemy;
    enemy.hero.hp = Math.min(enemy.hero.maxHp, enemy.hero.hp + 1);
    for (const t of aliveTroops(enemy)) {
      t.hp = Math.min(t.maxHp, t.hp + 1);
    }
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "FOOD_BUG_TICK", text: "糧蟲滋養：全場友方 +1 HP" });
  });

  // 糧蟲 onDestroy：回復全場友方（英雄+兵力）2 HP。
  registerScripted("FOOD_BUG_HEAL_BURST", (_p, ec) => {
    const enemy = ec.state.enemy;
    enemy.hero.hp = Math.min(enemy.hero.maxHp, enemy.hero.hp + 2);
    for (const t of aliveTroops(enemy)) {
      t.hp = Math.min(t.maxHp, t.hp + 2);
    }
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "FOOD_BUG_BURST", text: "糧蟲死亡爆發：全場友方 +2 HP" });
  });

  // ── 魔獸洞穴 ──────────────────────────────────────────────────────────────

  // 野性魔獸 onTurnEnd：積累憤怒，每回合 ATK +1，最多疊加 3 層。
  registerScripted("BEAST_RAGE_TICK", (_p, ec) => {
    const id = ec.sourceInstanceId;
    if (!id) return;
    const troop = ec.state.enemy.troopSlots.find((t) => t && t.instanceId === id);
    if (!troop) return;
    const stacks = troop.buffs.filter((b) => b.source === "BEAST_RAGE").length;
    if (stacks >= 3) return;
    troop.atk += 1;
    troop.buffs.push({ id: `beast_rage_${ec.state.nextInstanceId++}`, source: "BEAST_RAGE", mod: { atk: 1 }, remainingTurns: 999 });
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "BEAST_RAGE", text: `野性魔獸憤怒積累（${stacks + 1}/3）：ATK +1` });
  });

  // 獸群之王光環 aura（onStart）：在場時所有獸族友方兵力 ATK +2。
  registerScripted("ALPHA_AURA", (_p, ec) => {
    const enemy = ec.state.enemy;
    const alphaAlive = aliveTroops(enemy).some((t) => t.cardId === "T_s_14");
    const auraApplied = enemy.hero.flags.alphaAuraApplied === true;
    if (alphaAlive && !auraApplied) {
      for (const t of aliveTroops(enemy).filter((t) => t.cardId !== "T_s_14")) {
        t.atk += 2;
        t.buffs.push({ id: `alpha_aura_${ec.state.nextInstanceId++}`, source: "ALPHA_AURA", mod: { atk: 2 }, remainingTurns: 999 });
      }
      enemy.hero.flags.alphaAuraApplied = true;
      ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "ALPHA_AURA", text: "獸群之王：所有友方獸族兵力 ATK +2" });
    } else if (!alphaAlive && auraApplied) {
      for (const t of aliveTroops(enemy)) {
        const buffIdx = t.buffs.findIndex((b) => b.source === "ALPHA_AURA");
        if (buffIdx >= 0) {
          t.atk = Math.max(0, t.atk - 2);
          t.buffs.splice(buffIdx, 1);
        }
      }
      enemy.hero.flags.alphaAuraApplied = false;
      ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "ALPHA_AURA_FADE", text: "獸群之王已死，ATK 光環消退" });
    }
  });

  // 魔獸洞穴 aura（onEnd）：每 3 回合所有獸族兵力 ATK +1（臨時加成）。
  registerScripted("BEAST_HOWL", (_p, ec) => {
    if (ec.state.turn % 3 !== 0) return;
    const enemy = ec.state.enemy;
    for (const t of aliveTroops(enemy)) {
      t.atk += 1;
      t.buffs.push({ id: `howl_${ec.state.nextInstanceId++}`, source: "BEAST_HOWL", mod: { atk: 1 }, remainingTurns: 1 });
    }
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "BEAST_HOWL", text: "獸嚎響徹：所有獸族兵力本回合 ATK +1" });
  });

  // ── 暗影門戶 ──────────────────────────────────────────────────────────────

  // 暗影帷幕 aura（onStart）：場上 3+ 暗影兵力時，玩家本回合施法費用 +1（freezeHeroAbility 替代：mana -1）。
  registerScripted("SHADOW_VEIL", (_p, ec) => {
    const enemy = ec.state.enemy;
    const shadowCount = aliveTroops(enemy).filter((t) =>
      ["T_s_16", "T_s_17", "T_s_18", "T_s_19"].includes(t.cardId),
    ).length;
    if (shadowCount >= 3) {
      addTempMana(ec.state.player, -1);
      ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "SHADOW_VEIL", text: `暗影帷幕（${shadowCount} 暗影）：玩家本回合魔力 -1` });
    }
  });

  // ── 晶體礦脈 ──────────────────────────────────────────────────────────────

  // 晶體衛兵 onTurnEnd：每回合 DEF +1，最多疊加 3 層。
  registerScripted("CRYSTAL_FORTIFY", (_p, ec) => {
    const id = ec.sourceInstanceId;
    if (!id) return;
    const troop = ec.state.enemy.troopSlots.find((t) => t && t.instanceId === id);
    if (!troop) return;
    const stacks = troop.buffs.filter((b) => b.source === "CRYSTAL_FORTIFY").length;
    if (stacks >= 3) return;
    troop.def += 1;
    troop.buffs.push({ id: `crystal_def_${ec.state.nextInstanceId++}`, source: "CRYSTAL_FORTIFY", mod: { def: 1 }, remainingTurns: 999 });
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "CRYSTAL_FORTIFY", text: `晶體衛兵強化（${stacks + 1}/3）：DEF +1` });
  });

  // 晶體礦脈 aura（onEnd）：每 2 回合，礦脈自身 DEF +1（最多 +5）。
  registerScripted("CRYSTAL_REINFORCE", (_p, ec) => {
    if (ec.state.turn % 2 !== 0) return;
    const enemy = ec.state.enemy;
    const bonusStacks = (enemy.hero.flags.crystalReinforceStacks as number | undefined) ?? 0;
    if (bonusStacks >= 5) return;
    enemy.hero.def += 1;
    enemy.hero.flags.crystalReinforceStacks = bonusStacks + 1;
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "CRYSTAL_REINFORCE", text: `晶體礦脈強化（${bonusStacks + 1}/5）：巢穴 DEF +1` });
  });

  // ── 腐化神殿 ──────────────────────────────────────────────────────────────

  // 腐化神殿 aura（onEnd）：每次有任意兵力死亡累積獻祭計數；滿 5 次召喚腐化魔神。
  registerScripted("TEMPLE_SACRIFICE", (_p, ec) => {
    const enemy = ec.state.enemy;
    const count = (enemy.hero.flags.sacrificeCount as number | undefined) ?? 0;
    if (count < 5) return;
    // 重置計數
    enemy.hero.flags.sacrificeCount = 0;
    // 召喚腐化魔神（若有空格）
    const emptySlot = enemy.troopSlots.findIndex((s) => s === null);
    if (emptySlot < 0) return;
    const demonCard = ec.ctx.getCard("T_s_27");
    if (demonCard.type !== "troop") return;
    ec.state.nextInstanceId++;
    enemy.troopSlots[emptySlot] = {
      instanceId: `t${ec.state.nextInstanceId}`,
      cardId: "T_s_27",
      hp: demonCard.hp, maxHp: demonCard.hp,
      atk: demonCard.atk, def: demonCard.def,
      keywords: new Set(demonCard.keywords),
      hasAttackedThisTurn: true, summonedThisTurn: true, frozenTurns: 0,
      buffs: [],
    };
    ec.state.log.push({ turn: ec.state.turn, side: "enemy", kind: "TEMPLE_SACRIFICE", text: "腐化神殿：五次獻祭完成，腐化魔神降臨！" });
  });

type OathChoice = "restore" | "strengthen" | "purify";

function readOathChoice(payload: unknown): OathChoice {
  const raw = typeof payload === "string" ? payload : (payload as { choice?: unknown } | undefined)?.choice;
  return raw === "strengthen" || raw === "purify" || raw === "restore" ? raw : "restore";
}

function purifySide(side: ReturnType<typeof getSide>): number {
  let removed = removeNegativeBuffsFromHero(side.hero);
  for (const t of aliveTroops(side)) {
    if (t.frozenTurns > 0) {
      t.frozenTurns = 0;
      delete t.frozenDisplayName;
      removed++;
    }
    removed += removeNegativeBuffsFromTroop(t);
  }
  return removed;
}

function removeNegativeBuffsFromHero(hero: HeroInstance): number {
  let removed = 0;
  const kept: ActiveBuff[] = [];
  for (const buff of hero.buffs) {
    if (isNegativeMod(buff.mod)) {
      revertHeroMod(hero, buff.mod);
      removed++;
    } else {
      kept.push(buff);
    }
  }
  hero.buffs = kept;
  return removed;
}

function removeNegativeBuffsFromTroop(troop: TroopInstance): number {
  let removed = 0;
  const kept: ActiveBuff[] = [];
  for (const buff of troop.buffs) {
    if (isNegativeMod(buff.mod)) {
      revertTroopMod(troop, buff.mod);
      removed++;
    } else {
      kept.push(buff);
    }
  }
  troop.buffs = kept;
  return removed;
}

function isNegativeMod(mod: StatModifier): boolean {
  return [mod.hp, mod.atk, mod.def, mod.cmd].some((value) => value !== undefined && value < 0);
}

function revertHeroMod(hero: HeroInstance, mod: StatModifier): void {
  if (mod.atk) hero.atk = Math.max(0, hero.atk - mod.atk);
  if (mod.def) hero.def = Math.max(0, hero.def - mod.def);
  if (mod.hp) {
    hero.maxHp = Math.max(1, hero.maxHp - mod.hp);
    hero.hp = Math.min(hero.maxHp, Math.max(1, hero.hp - mod.hp));
  }
  if (mod.cmd) hero.cmd = Math.max(0, hero.cmd - mod.cmd);
}

function revertTroopMod(troop: TroopInstance, mod: StatModifier): void {
  if (mod.atk) troop.atk = Math.max(0, troop.atk - mod.atk);
  if (mod.def) troop.def = Math.max(0, troop.def - mod.def);
  if (mod.hp) {
    troop.maxHp = Math.max(1, troop.maxHp - mod.hp);
    troop.hp = Math.min(troop.maxHp, Math.max(1, troop.hp - mod.hp));
  }
}
