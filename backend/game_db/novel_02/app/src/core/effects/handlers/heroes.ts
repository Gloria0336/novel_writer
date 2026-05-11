import { registerScripted } from "../registry";
import { aliveTroops, getSide, otherSide } from "../../selectors/battle";
import { applyHeroDamage } from "../../combat/damage";
import { createTroopInstance } from "../../turn/factories";
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
}
