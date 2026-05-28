import { registerScripted, reapDeadTroops } from "../registry";
import { drawCards } from "../../deck/draw";
import { rngPick } from "../../deck/prng";
import { aliveTroops, getSide, otherSide } from "../../selectors/battle";
import { applyHeroDamage, applyTroopDamage } from "../../combat/damage";
import { createTroopInstance } from "../../turn/factories";
import type { TroopInstance } from "../../types/battle";
import type { TroopCard } from "../../types/card";
import { addGauge } from "../../resource/gauge";
import { addHeroAbilityFreeze } from "../heroAbilityFreeze";
import { syncGaugeScalingBuffs } from "../../resource/gaugeScalingBuff";

export function registerHeroScripted(): void {
  // 軍團統帥終極技：帝國總動員
  // 立即部署手牌中所有兵力卡（不消耗魔力，無暈眩）。本回合所有兵力 ATK + 場上兵力數 ×2。
  registerScripted("TOTAL_MOBILIZATION", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    // 找手牌中所有兵力
    const troopHand: { idx: number; cardId: string }[] = [];
    side.hand.forEach((c, i) => {
      if (ec.ctx.getCard(c.cardId).type === "troop") troopHand.push({ idx: i, cardId: c.cardId });
    });
    // 從尾端開始 splice 才不會影響 index
    troopHand.sort((a, b) => b.idx - a.idx);
    for (const { idx, cardId } of troopHand) {
      const slotIdx = side.troopSlots.findIndex((s) => s === null);
      if (slotIdx === -1) break;
      const card = ec.ctx.getCard(cardId);
      if (card.type !== "troop") continue;
      const inst = createTroopInstance(ec.state, card as TroopCard, { suppressSummonSickness: true });
      side.troopSlots[slotIdx] = inst;
      side.hand.splice(idx, 1);
    }
    // 場上兵力數 × 2 加成（持續本回合）
    const bonus = aliveTroops(side).length * 2;
    for (const t of side.troopSlots) {
      if (t) {
        t.atk += bonus;
        t.buffs.push({ id: `mob_${ec.state.nextInstanceId++}`, source: "TOTAL_MOBILIZATION", mod: { atk: bonus }, remainingTurns: 1 });
      }
    }
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "TOTAL_MOBILIZATION", text: `帝國總動員！部署 ${troopHand.length} 兵，全體 +${bonus} ATK` });
  });

  // 蠻血酋長終極技：祖獸覺醒
  // 對敵方英雄造成 (ATK + 血怒×5) ×2 傷害。無視守護。血怒清零，HP +30%。
  registerScripted("PRIMAL_AWAKENING", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    const enemyHero = getSide(ec.state, otherSide(ec.sourceSide)).hero;
    const damage = (side.hero.atk + side.hero.gaugeValue * 5) * 2;
    applyHeroDamage(enemyHero, damage, { ignoreDef: false });
    side.hero.gaugeValue = 0;
    syncGaugeScalingBuffs(ec.state, ec.ctx);
    side.hero.hp = Math.min(side.hero.maxHp, side.hero.hp + Math.floor(side.hero.maxHp * 0.3));
    // 兵力進入狂暴 2 回合（ATK ×1.5，DEF 歸零）
    for (const t of side.troopSlots) {
      if (t) {
        const atkBonus = Math.floor(t.atk * 0.5);
        t.atk += atkBonus;
        const defLoss = -t.def;
        t.def = 0;
        t.buffs.push({ id: `pa_${ec.state.nextInstanceId++}`, source: "PRIMAL_AWAKENING", mod: { atk: atkBonus, def: defLoss }, remainingTurns: 2 });
      }
    }
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "PRIMAL_AWAKENING", text: `祖獸覺醒！對敵方英雄造 ${damage} 傷害`, payload: { damage } });
  });

  // 艾拉·芙萊爾終極技：精準支援導引
  // 敵方所有兵力 DEF 歸零，失去守護與正向增益效果。抽 2 張牌。
  registerScripted("PRECISION_SUPPORT_GUIDANCE", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    let affected = 0;

    for (const troop of enemy.troopSlots) {
      if (!troop) continue;
      removePositiveStatBuffs(troop);
      troop.def = 0;
      troop.keywords.delete("guard");
      affected++;
    }

    const draw = drawCards(side, 2, ec.state.rngState);
    ec.state.rngState = draw.newRngState;
    ec.state.log.push({
      turn: ec.state.turn,
      side: ec.sourceSide,
      kind: "PRECISION_SUPPORT_GUIDANCE",
      text: `精準支援導引！破除 ${affected} 名敵兵防線，抽 ${draw.drawn} 張牌`,
      payload: { affected, drawn: draw.drawn },
    });
  });

  // 幻術師職業關鍵字：每個己方回合開始，若有空欄，自動召喚 1 個幻影。
  registerScripted("ILLUSIONIST_TURN_PHANTOM", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    const slotIdx = side.troopSlots.findIndex((slot) => slot === null);
    if (slotIdx < 0) return;

    const card = ec.ctx.getCard("T_s_31");
    if (card.type !== "troop") return;

    const inst = createTroopInstance(ec.state, card as TroopCard);
    side.troopSlots[slotIdx] = inst;

    const heroDef = ec.ctx.getHero(side.hero.defId);
    const race = ec.ctx.getRace(heroDef.raceId);
    if (heroDef.gauge.onTroopEnter) addGauge(side.hero, race.gauge.max, heroDef.gauge.onTroopEnter);

    ec.state.log.push({
      turn: ec.state.turn,
      side: ec.sourceSide,
      kind: "ILLUSIONIST_TURN_PHANTOM",
      text: "幻術師生成 1 個幻影",
      payload: { cardId: card.id, instanceId: inst.instanceId, slotIdx },
    });
  });

  // 曇被動：每回合第一次由自身技能切換形態時，留下鱗粉記憶。
  registerScripted("TAN_FORM_MEMORY", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    if (side.hero.defId !== "butterfly-yao") return;
    if (side.hero.flags.tanFormMemoryTurn === ec.state.turn) return;

    side.hero.flags.tanFormMemoryTurn = ec.state.turn;
    side.hero.armor += 6;

    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const target = aliveTroops(enemy)[0];
    if (target) {
      target.atk = Math.max(0, target.atk - 2);
      target.buffs.push({
        id: `tan_mem_${ec.state.nextInstanceId++}`,
        source: "TAN_FORM_MEMORY",
        mod: { atk: -2 },
        remainingTurns: 1,
      });
      ec.state.log.push({
        turn: ec.state.turn,
        side: ec.sourceSide,
        kind: "TAN_FORM_MEMORY",
        text: "鱗粉記憶：曇獲得 6 護甲，敵方兵力 ATK -2",
        payload: { targetInstanceId: target.instanceId },
      });
      return;
    }

    const draw = drawCards(side, 1, ec.state.rngState);
    ec.state.rngState = draw.newRngState;
    ec.state.log.push({
      turn: ec.state.turn,
      side: ec.sourceSide,
      kind: "TAN_FORM_MEMORY",
      text: `鱗粉記憶：曇獲得 6 護甲，抽 ${draw.drawn} 張牌`,
      payload: { drawn: draw.drawn },
    });
  });

  // 芙爾卓被動「百年戰場記憶」：每回合開始時，若我方場上有 1+ 兵力，自身獲得 3 護甲。
  // 由 startTurnFor 在 fuldra 為當前 active 英雄時觸發。透過 fuldraVigilTurn 旗標保證一回合只生效一次。
  registerScripted("FULDRA_VIGIL", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    if (side.hero.defId !== "fuldra") return;
    if (side.hero.flags.fuldraVigilTurn === ec.state.turn) return;
    if (aliveTroops(side).length < 1) return;

    side.hero.flags.fuldraVigilTurn = ec.state.turn;
    side.hero.armor += 3;

    ec.state.log.push({
      turn: ec.state.turn,
      side: ec.sourceSide,
      kind: "FULDRA_VIGIL",
      text: "百年戰場記憶：芙爾卓獲得 3 護甲",
      payload: { armorGained: 3 },
    });
  });

  // 露露被動「最低損傷命令」：每回合首次我方兵力被消滅時，自身獲得 4 護甲。
  // 由 reapHandleDeath 在露露為當前英雄且同方兵力陣亡時觸發。
  registerScripted("LULU_MIN_CASUALTY_SHIELD", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    if (side.hero.defId !== "lulu") return;
    if (side.hero.flags.luluCasualtyShieldTurn === ec.state.turn) return;
    side.hero.flags.luluCasualtyShieldTurn = ec.state.turn;
    side.hero.armor += 4;
    ec.state.log.push({
      turn: ec.state.turn,
      side: ec.sourceSide,
      kind: "LULU_MIN_CASUALTY_SHIELD",
      text: "最低損傷命令：友軍陣亡，露露獲得 4 護甲",
      payload: { armorGained: 4 },
    });
  });

  // 山獵人被動「無聲追跡」：回合開始，敵方無兵力→抽1牌；有兵力→本回合 ATK +2。
  // 由 startTurnFor 在山獵人為當前英雄時觸發。
  registerScripted("HUNTER_SILENT_TRACKING", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    if (side.hero.defId !== "mountain-hunter") return;
    if (side.hero.flags.hunterTrackingTurn === ec.state.turn) return;
    side.hero.flags.hunterTrackingTurn = ec.state.turn;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    if (aliveTroops(enemy).length === 0) {
      const draw = drawCards(side, 1, ec.state.rngState);
      ec.state.rngState = draw.newRngState;
      ec.state.log.push({
        turn: ec.state.turn,
        side: ec.sourceSide,
        kind: "HUNTER_SILENT_TRACKING",
        text: `無聲追跡：視野清晰，抽 ${draw.drawn} 張牌`,
        payload: { mode: "draw", drawn: draw.drawn },
      });
    } else {
      side.hero.atk += 2;
      side.hero.buffs.push({ id: `hunter_track_${ec.state.nextInstanceId++}`, source: "HUNTER_SILENT_TRACKING", mod: { atk: 2 }, remainingTurns: 1 });
      ec.state.log.push({
        turn: ec.state.turn,
        side: ec.sourceSide,
        kind: "HUNTER_SILENT_TRACKING",
        text: "無聲追跡：鎖定目標，ATK +2",
        payload: { mode: "atk", bonus: 2 },
      });
    }
  });

  // 芮卡被動「沙漠耐戰」：回合開始，HP≤50%→3護甲；同時血怒≥5→額外回復3HP。
  // 由 startTurnFor 在芮卡為當前英雄時觸發。
  registerScripted("REKA_DESERT_SURGE", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    if (side.hero.defId !== "reka") return;
    if (side.hero.flags.rekaDesertSurgeTurn === ec.state.turn) return;
    if (side.hero.hp / side.hero.maxHp > 0.5) return;
    side.hero.flags.rekaDesertSurgeTurn = ec.state.turn;
    side.hero.armor += 3;
    const healed = side.hero.gaugeValue >= 5 ? 3 : 0;
    if (healed > 0) side.hero.hp = Math.min(side.hero.maxHp, side.hero.hp + healed);
    const text = healed > 0
      ? "沙漠耐戰：HP ≤ 50%，獲得 3 護甲，血怒 ≥ 5，回復 3 HP"
      : "沙漠耐戰：HP ≤ 50%，獲得 3 護甲";
    ec.state.log.push({
      turn: ec.state.turn,
      side: ec.sourceSide,
      kind: "REKA_DESERT_SURGE",
      text,
      payload: { armorGained: 3, healed },
    });
  });

  // 艾爾諾被動「宮廷榮譽法師」：回合開始，若共鳴≥3，抽1張牌。
  // 由 startTurnFor 在共鳴重置前觸發，讀取上一回合積累的共鳴值。
  registerScripted("ELNO_COURT_MANA_BONUS", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    if (side.hero.defId !== "elno-honorary-mage") return;
    if (side.hero.flags.elnoCourtBonusTurn === ec.state.turn) return;
    if (side.hero.gaugeValue < 3) return;
    side.hero.flags.elnoCourtBonusTurn = ec.state.turn;
    const draw = drawCards(side, 1, ec.state.rngState);
    ec.state.rngState = draw.newRngState;
    ec.state.log.push({
      turn: ec.state.turn,
      side: ec.sourceSide,
      kind: "ELNO_COURT_MANA_BONUS",
      text: `宮廷榮譽法師：共鳴 ≥ 3，抽 ${draw.drawn} 張牌`,
      payload: { drawn: draw.drawn, resonance: side.hero.gaugeValue },
    });
  });

  // 艾拉被動「風切預判」：回合開始，敵方兵力≥2→對敵方隨機兵力各自獨立造成2次ATK×0.5傷害。
  // 由 startTurnFor 在艾拉為當前英雄時觸發。
  registerScripted("AELLA_WINDSHEAR_READ", (_p, ec) => {
    const side = getSide(ec.state, ec.sourceSide);
    if (side.hero.defId !== "aella-flair") return;
    if (side.hero.flags.aellaWindshearTurn === ec.state.turn) return;
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    if (aliveTroops(enemy).length < 2) return;
    side.hero.flags.aellaWindshearTurn = ec.state.turn;
    const baseAmount = Math.max(1, Math.floor(side.hero.atk * 0.5));
    for (let i = 0; i < 2; i++) {
      const targets = aliveTroops(enemy);
      if (targets.length === 0) break;
      const pick = rngPick(ec.state.rngState, targets);
      ec.state.rngState = pick.state;
      const target = pick.value;
      const result = applyTroopDamage(target, baseAmount);
      ec.state.log.push({
        turn: ec.state.turn,
        side: ec.sourceSide,
        kind: "AELLA_WINDSHEAR_READ",
        text: `風切預判：${target.cardId} 受到 ${result.finalAmount} 傷害（第 ${i + 1} 擊）`,
        payload: { targetInstanceId: target.instanceId, amount: result.finalAmount, hit: i + 1 },
      });
    }
    reapDeadTroops(ec.state, ec.ctx, ec.sourceSide);
  });

  // 曇終極技：敵方下一回合不恢復魔力，且不能打出/生成兵力。
  registerScripted("TAN_BLANK_BEFORE_PUPATION", (_p, ec) => {
    const targetSide = otherSide(ec.sourceSide);
    const hero = getSide(ec.state, targetSide).hero;
    addHeroAbilityFreeze(hero, ["manaRegen", "troop"], 1, "封鎖");
    ec.state.log.push({
      turn: ec.state.turn,
      side: ec.sourceSide,
      kind: "TAN_BLANK_BEFORE_PUPATION",
      text: `${targetSide === "player" ? "玩家" : "敵方"}下一回合魔力回復與兵力牌被凍結`,
      payload: { targetSide, modes: ["manaRegen", "troop"], turns: 1 },
    });
  });
}

function removePositiveStatBuffs(troop: TroopInstance): void {
  const kept = [];
  for (const buff of troop.buffs) {
    let hasPositive = false;
    const { atk, def, hp, cmd } = buff.mod;
    if (atk && atk > 0) {
      troop.atk = Math.max(0, troop.atk - atk);
      hasPositive = true;
    }
    if (def && def > 0) {
      troop.def = Math.max(0, troop.def - def);
      hasPositive = true;
    }
    if (hp && hp > 0) {
      troop.maxHp = Math.max(1, troop.maxHp - hp);
      troop.hp = Math.min(troop.hp, troop.maxHp);
      hasPositive = true;
    }
    if (cmd && cmd > 0) hasPositive = true;
    if (!hasPositive) kept.push(buff);
  }
  troop.buffs = kept;
}
