import { registerScripted } from "../registry";
import { drawCards } from "../../deck/draw";
import { aliveTroops, getSide, otherSide } from "../../selectors/battle";
import { applyHeroDamage } from "../../combat/damage";
import { createTroopInstance } from "../../turn/factories";
import type { TroopInstance } from "../../types/battle";
import type { TroopCard } from "../../types/card";

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
