import type { EffectContext } from "../registry";
import { registerScripted } from "../registry";
import { aliveTroops, getSide, otherSide } from "../../selectors/battle";
import { applyHeroDamage } from "../../combat/damage";
import { addMorale } from "../../resource/morale";
import { addTempMana } from "../../resource/mana";
import type { TroopInstance } from "../../types/battle";
import type { StatModifier } from "../../types/effect";
import type { ActiveBuff, HeroInstance } from "../../types/hero";

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

  // S11/B05 等：本回合可額外使用 N 張行動卡（MVP：標記 flag，不嚴格限制行動次數）
  registerScripted("EXTRA_ACTIONS", (payload, ec) => {
    const count = (payload as { count?: number } | undefined)?.count ?? 2;
    getTurnFlags(ec.state).extraActionsThisTurn += count;
  });

  // S14 盟約之誓：三選一。未傳選項時保留舊行為，預設全面恢復。
  registerScripted("OATH_CHOICE", (payload, ec) => {
    const choice = readOathChoice(payload);
    const side = getSide(ec.state, ec.sourceSide);

    if (choice === "strengthen") {
      for (const t of aliveTroops(side)) {
        t.atk += 5;
        t.buffs.push({ id: `oath_atk_${ec.state.nextInstanceId++}`, source: "S14", mod: { atk: 5 }, remainingTurns: 3 });
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

  // §E.1/§E.2 — Boss / 巢穴專屬機制
  registerScripted("FIELD_BURN_APPLY", (_p, ec) => {
    ec.state.field = { cardId: "F_BURN_INFERNO", ownerSide: ec.sourceSide };
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "FIELD_SET", text: "獄火場地已籠罩戰場！" });
  });

  // §E.2 蟲族窩巢：場上 ≥5 蟲母幼體合併為蟲后。
  registerScripted("INSECT_MERGE", (_p, ec) => {
    const enemy = ec.state.enemy;
    const larvae: { slotIdx: number; troop: TroopInstance }[] = [];
    for (let i = 0; i < enemy.troopSlots.length; i++) {
      const t = enemy.troopSlots[i];
      if (t && t.cardId === "I_QUEEN_LARVA") larvae.push({ slotIdx: i, troop: t });
    }
    if (larvae.length < 5) return;
    const consume = larvae.slice(0, 5);
    const targetSlot = consume[0]!.slotIdx;
    for (let i = 1; i < 5; i++) enemy.troopSlots[consume[i]!.slotIdx] = null;
    const queenCard = ec.ctx.getCard("I_INSECT_QUEEN");
    if (queenCard.type !== "troop") return;
    ec.state.nextInstanceId++;
    enemy.troopSlots[targetSlot] = {
      instanceId: `t${ec.state.nextInstanceId}`,
      cardId: "I_INSECT_QUEEN",
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
      if (t && t.cardId === "I_CRYSTAL_SHARD") shards.push({ slotIdx: i, troop: t });
    }
    if (shards.length < 3) return;
    const consume = shards.slice(0, 3);
    const targetSlot = consume[0]!.slotIdx;
    for (let i = 1; i < 3; i++) enemy.troopSlots[consume[i]!.slotIdx] = null;
    const golemCard = ec.ctx.getCard("I_CRYSTAL_GOLEM");
    if (golemCard.type !== "troop") return;
    ec.state.nextInstanceId++;
    enemy.troopSlots[targetSlot] = {
      instanceId: `t${ec.state.nextInstanceId}`,
      cardId: "I_CRYSTAL_GOLEM",
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
    const hasPriest = aliveTroops(enemy).some((t) => t.cardId === "I_TEMPLE_PRIEST");
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
    hero.hp = Math.min(hero.maxHp, hero.hp + Math.round(hero.maxHp * 0.3));
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "PRIMAL", text: `祖獸覺醒：對敵方英雄造 ${amount} 傷害，HP +30%。`, payload: { amount } });
  });
}

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
