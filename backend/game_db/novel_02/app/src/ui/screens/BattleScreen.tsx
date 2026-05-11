import { useState } from "react";
import { BattleProvider, useBattle } from "../../game/BattleProvider";
import { getCard } from "../../data/cards";
import { canTroopAttack, canActionTarget } from "../../core/combat/attack";
import { hasGuardTroop, aliveTroops, getSide } from "../../core/selectors/battle";
import { canAffordMana, totalAvailableMana } from "../../core/resource/mana";
import { canAffordMorale } from "../../core/resource/morale";
import { HEROES } from "../../data/heroes";
import { LAIR_HERO_DEF, LAIR_HERO_ID } from "../../data/enemies/putrefactiveLair";
import type { TroopInstance } from "../../core/types/battle";
import type { Card, TroopCard } from "../../core/types/card";
import styles from "../styles/battle.module.css";
import { cardTypeColor, cardTypeLabel } from "../../game/useCardInfo";

interface Props {
  heroId: string;
  onExit: () => void;
}

export function BattleScreen({ heroId, onExit }: Props): JSX.Element {
  return (
    <BattleProvider heroId={heroId}>
      <BattleView onExit={onExit} />
    </BattleProvider>
  );
}

type SelectMode =
  | { kind: "none" }
  | { kind: "playCard"; handIndex: number; needsTarget: boolean; needsSlot: boolean }
  | { kind: "attackWithTroop"; instanceId: string }
  | { kind: "useSkill"; skillId: string; needsTarget: boolean }
  | { kind: "useUltimate"; needsTarget: boolean };

function BattleView({ onExit }: { onExit: () => void }): JSX.Element {
  const { state, dispatch, reset } = useBattle();
  const [select, setSelect] = useState<SelectMode>({ kind: "none" });

  const playerHero = state.player.hero;
  const enemyHero = state.enemy.hero;
  const heroDef = playerHero.defId === LAIR_HERO_ID ? LAIR_HERO_DEF : HEROES[playerHero.defId]!;
  const enemyDef = enemyHero.defId === LAIR_HERO_ID ? LAIR_HERO_DEF : HEROES[enemyHero.defId]!;

  function clickHandCard(idx: number): void {
    const inst = state.player.hand[idx];
    if (!inst) return;
    const card = getCard(inst.cardId);
    if (!canPlayCardCheck(state, card)) return;

    if (card.type === "troop") {
      setSelect({ kind: "playCard", handIndex: idx, needsTarget: false, needsSlot: true });
    } else if (card.type === "spell" || card.type === "action") {
      const needsTarget = (card.effects ?? []).some((e) => "target" in e && (e.target as { kind?: string }).kind === "single");
      if (!needsTarget) {
        dispatch({ type: card.type === "spell" ? "PLAY_SPELL" : "PLAY_ACTION", handIndex: idx });
        setSelect({ kind: "none" });
      } else {
        setSelect({ kind: "playCard", handIndex: idx, needsTarget: true, needsSlot: false });
      }
    } else if (card.type === "equipment") {
      dispatch({ type: "PLAY_EQUIPMENT", handIndex: idx });
      setSelect({ kind: "none" });
    } else if (card.type === "field") {
      dispatch({ type: "PLAY_FIELD", handIndex: idx });
      setSelect({ kind: "none" });
    }
  }

  function clickSlot(side: "player" | "enemy", idx: number): void {
    if (state.activeSide !== "player") return;
    const slot = (side === "player" ? state.player : state.enemy).troopSlots[idx];

    if (select.kind === "playCard" && select.needsSlot && side === "player") {
      if (!slot) {
        dispatch({ type: "PLAY_TROOP", handIndex: select.handIndex, slotIndex: idx });
        setSelect({ kind: "none" });
      }
      return;
    }
    if (select.kind === "playCard" && select.needsTarget && slot) {
      const inst = state.player.hand[select.handIndex];
      if (!inst) return;
      const card = getCard(inst.cardId);
      dispatch({
        type: card.type === "spell" ? "PLAY_SPELL" : "PLAY_ACTION",
        handIndex: select.handIndex,
        targetInstanceId: slot.instanceId,
      });
      setSelect({ kind: "none" });
      return;
    }
    if (select.kind === "useSkill" && select.needsTarget && slot) {
      dispatch({ type: "USE_SKILL", skillId: select.skillId, targetInstanceId: slot.instanceId });
      setSelect({ kind: "none" });
      return;
    }
    if (select.kind === "attackWithTroop" && side === "enemy" && slot) {
      const me = findTroopAnywhere(state, select.instanceId);
      if (!me) return setSelect({ kind: "none" });
      const check = canTroopAttack(state, "player", me, slot);
      if (!check.ok) return;
      dispatch({ type: "TROOP_ATTACK", attackerInstanceId: select.instanceId, targetInstanceId: slot.instanceId });
      setSelect({ kind: "none" });
      return;
    }
    // 點選自己兵力 → 進入攻擊模式
    if (select.kind === "none" && side === "player" && slot) {
      const heroCheck = canTroopAttack(state, "player", slot, "hero");
      const anyValid = aliveTroops(state.enemy).some((t) => canTroopAttack(state, "player", slot, t).ok) || heroCheck.ok;
      if (anyValid) setSelect({ kind: "attackWithTroop", instanceId: slot.instanceId });
    }
  }

  function clickEnemyHero(): void {
    if (state.activeSide !== "player") return;
    if (select.kind === "attackWithTroop") {
      const me = findTroopAnywhere(state, select.instanceId);
      if (!me) return;
      const check = canTroopAttack(state, "player", me, "hero");
      if (!check.ok) return;
      dispatch({ type: "TROOP_ATTACK", attackerInstanceId: select.instanceId, targetInstanceId: "H_enemy" });
      setSelect({ kind: "none" });
      return;
    }
    if (select.kind === "playCard" && select.needsTarget) {
      const inst = state.player.hand[select.handIndex];
      if (!inst) return;
      const card = getCard(inst.cardId);
      const ignoreGuard = (card.type === "spell" || card.type === "action") && (card.effects ?? []).some((e) => "ignoreGuard" in e && (e as { ignoreGuard?: boolean }).ignoreGuard);
      const guardCheck = canActionTarget(state, "player", "hero", ignoreGuard);
      if (!guardCheck.ok) return;
      dispatch({
        type: card.type === "spell" ? "PLAY_SPELL" : "PLAY_ACTION",
        handIndex: select.handIndex,
        targetInstanceId: "H_enemy",
      });
      setSelect({ kind: "none" });
      return;
    }
    if (select.kind === "useUltimate") {
      dispatch({ type: "USE_ULTIMATE", targetInstanceId: "H_enemy" });
      setSelect({ kind: "none" });
      return;
    }
    if (select.kind === "useSkill" && select.needsTarget) {
      dispatch({ type: "USE_SKILL", skillId: select.skillId, targetInstanceId: "H_enemy" });
      setSelect({ kind: "none" });
    }
  }

  function clickSkill(skillId: string): void {
    if (state.activeSide !== "player") return;
    const skill = heroDef.actives.find((s) => s.id === skillId);
    if (!skill) return;
    if (skill.cost.morale && !canAffordMorale(playerHero, skill.cost.morale)) return;
    const needsTarget = skill.effects.some((e) => "target" in e && (e.target as { kind?: string }).kind === "single");
    if (!needsTarget) {
      dispatch({ type: "USE_SKILL", skillId });
      setSelect({ kind: "none" });
    } else {
      setSelect({ kind: "useSkill", skillId, needsTarget: true });
    }
  }

  function clickUltimate(): void {
    if (state.activeSide !== "player") return;
    if (playerHero.flags.ultimateUsed) return;
    if (playerHero.morale < 100) return;
    const ult = heroDef.ultimate;
    const needsTarget = ult.effects.some((e) => "target" in e && (e.target as { kind?: string }).kind === "single");
    if (!needsTarget) {
      dispatch({ type: "USE_ULTIMATE" });
      setSelect({ kind: "none" });
    } else {
      setSelect({ kind: "useUltimate", needsTarget: true });
    }
  }

  function endTurn(): void {
    dispatch({ type: "END_TURN" });
    setSelect({ kind: "none" });
  }

  const isPlayerTurn = state.activeSide === "player" && state.result === "ongoing";

  // ==== 渲染 ====
  return (
    <div className={styles.root}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.stab}>
          穩定度 {state.stability}/100
          <span className={state.stability <= 50 ? `${styles.bar} ${styles.barWarn}` : styles.bar}>
            <span style={{ width: `${state.stability}%` }} />
          </span>
          {state.corruptionStage > 0 && <span style={{ marginLeft: 8, color: "#fa3" }}>腐化階段 {state.corruptionStage}</span>}
        </div>
        <div>回合 {state.turn} · {isPlayerTurn ? "玩家" : "敵方"}</div>
        <button onClick={onExit}>退出</button>
      </div>

      {/* Enemy zone */}
      <div className={styles.enemy}>
        <div className={styles.heroRow}>
          <div
            className={`${styles.heroBlock} ${select.kind === "attackWithTroop" || (select.kind === "playCard" && select.needsTarget) || select.kind === "useUltimate" || (select.kind === "useSkill" && select.needsTarget) ? styles.targetable : ""}`}
            onClick={clickEnemyHero}
          >
            <h4>{enemyDef.name}</h4>
            <div className={styles.stats}>HP {enemyHero.hp}/{enemyHero.maxHp} · DEF {enemyHero.def}</div>
          </div>
        </div>
        <div className={styles.troopRow}>
          {state.enemy.troopSlots.map((t, i) => (
            <TroopSlotView
              key={i}
              slot={t}
              side="enemy"
              activeSide={state.activeSide}
              isTargetable={isPlayerTurn && t !== null && (
                (select.kind === "attackWithTroop") ||
                (select.kind === "playCard" && select.needsTarget) ||
                (select.kind === "useSkill" && select.needsTarget) ||
                (select.kind === "useUltimate" && select.needsTarget)
              )}
              canAttack={false}
              onClick={() => clickSlot("enemy", i)}
            />
          ))}
        </div>
      </div>

      {/* Field */}
      <div className={styles.field}>
        {state.field ? `場地：${getCard(state.field.cardId).name}` : "（無場地）"}
      </div>

      <div className={styles.mid}>{select.kind !== "none" && <span>選取中：{describeSelect(select)}（按 ESC 取消）</span>}</div>

      {/* Player zone */}
      <div className={styles.player}>
        <div className={styles.troopRow}>
          {state.player.troopSlots.map((t, i) => {
            const canAttack = isPlayerTurn && t !== null && select.kind === "none" && (
              aliveTroops(state.enemy).some((e) => canTroopAttack(state, "player", t!, e).ok) ||
              canTroopAttack(state, "player", t!, "hero").ok
            );
            const isSelected = select.kind === "attackWithTroop" && t?.instanceId === select.instanceId;
            return (
              <TroopSlotView
                key={i}
                slot={t}
                side="player"
                activeSide={state.activeSide}
                isTargetable={isPlayerTurn && !t && select.kind === "playCard" && select.needsSlot}
                canAttack={canAttack}
                isSelected={isSelected}
                onClick={() => clickSlot("player", i)}
              />
            );
          })}
        </div>
        <div className={styles.heroRow}>
          <div className={styles.heroBlock}>
            <h4>{heroDef.name}</h4>
            <div className={styles.stats}>HP {playerHero.hp}/{playerHero.maxHp} · ATK {playerHero.atk} · DEF {playerHero.def}{playerHero.armor > 0 ? ` (+護甲 ${playerHero.armor})` : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
            <ResourceTag label="魔力" value={`${totalAvailableMana(state.player)}/${state.player.manaCap}`} />
            <ResourceTag label="鬥志" value={`${playerHero.morale}/100`} highlight={playerHero.morale >= 100} />
            <ResourceTag label="量表" value={`${playerHero.gaugeValue}`} />
          </div>
        </div>
      </div>

      {/* Action bar (skills + end turn) */}
      <div className={styles.actionBar}>
        {heroDef.actives.map((skill) => {
          const moraleOk = !skill.cost.morale || canAffordMorale(playerHero, skill.cost.morale);
          return (
            <button
              key={skill.id}
              className={styles.skillBtn}
              onClick={() => clickSkill(skill.id)}
              disabled={!isPlayerTurn || !moraleOk}
              title={skill.description}
            >
              {skill.name} ({skill.cost.morale ?? 0} 鬥志)
            </button>
          );
        })}
        <button
          className={styles.skillBtn}
          onClick={clickUltimate}
          disabled={!isPlayerTurn || playerHero.morale < 100 || playerHero.flags.ultimateUsed}
          title={heroDef.ultimate.description}
          style={{ background: playerHero.morale >= 100 ? "#a40" : undefined, fontWeight: "bold" }}
        >
          ✦ {heroDef.ultimate.name}
        </button>
        <button className={styles.endTurnBtn} onClick={endTurn} disabled={!isPlayerTurn}>結束回合 →</button>
      </div>

      {/* Hand */}
      <div className={styles.hand}>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>手牌（{state.player.hand.length}/9）· 牌庫剩 {state.player.deck.length}</div>
        <div className={styles.handCards}>
          {state.player.hand.map((inst, i) => {
            const card = getCard(inst.cardId);
            const playable = isPlayerTurn && canPlayCardCheck(state, card);
            const selected = select.kind === "playCard" && select.handIndex === i;
            return (
              <CardView
                key={inst.instanceId}
                card={card}
                playable={playable}
                selected={selected}
                onClick={() => playable && clickHandCard(i)}
              />
            );
          })}
        </div>
      </div>

      {/* Log */}
      <div className={styles.log}>
        {state.log.slice(-12).map((entry, i) => (
          <div key={i} className={`${styles.entry} ${entry.kind === "VICTORY" ? styles.victory : entry.kind === "DEFEAT" ? styles.defeat : entry.kind.startsWith("CORRUPTION") ? styles.hint : ""}`}>
            T{entry.turn}·{entry.side === "player" ? "我" : "敵"}: {entry.text}
          </div>
        ))}
      </div>

      {state.result !== "ongoing" && (
        <div className={styles.gameover}>
          <div className={styles.panel}>
            <h2 className={state.result === "playerWin" ? styles.win : styles.lose}>
              {state.result === "playerWin" ? "勝利！" : "敗北"}
            </h2>
            <p style={{ marginBottom: 16, color: "#aaa" }}>{state.endgameReason ?? ""}</p>
            <button onClick={reset}>再戰一場</button>
            <button onClick={onExit}>選英雄</button>
          </div>
        </div>
      )}
    </div>
  );
}

function describeSelect(s: SelectMode): string {
  switch (s.kind) {
    case "playCard": return s.needsSlot ? "選擇空槽位" : "選擇目標";
    case "attackWithTroop": return "選擇攻擊目標";
    case "useSkill": return "選擇技能目標";
    case "useUltimate": return "選擇終極技目標";
    case "none": return "";
  }
}

function canPlayCardCheck(state: import("../../core/types/battle").BattleState, card: Card): boolean {
  if (state.activeSide !== "player") return false;
  // 共鳴詠唱完成 → 法術 0 費
  let cost = card.cost;
  const heroDef = HEROES[state.player.hero.defId];
  if (heroDef && card.type === "spell") {
    const race = (heroDef as { raceId: string }).raceId;
    if (race === "elf" && state.player.hero.gaugeValue >= 4) cost = 0;
  }
  if (!canAffordMana(state.player, cost)) return false;
  if (card.type === "troop") {
    const free = state.player.troopSlots.some((s) => s === null);
    if (!free) return false;
  }
  if (card.type === "spell" || card.type === "action") {
    // 對 single 目標：必須有合法目標
    const needs = (card.effects ?? []).some((e) => "target" in e && (e.target as { kind?: string }).kind === "single");
    if (needs) {
      const enemyTroops = aliveTroops(state.enemy);
      if (enemyTroops.length === 0) return true; // 仍可選敵方英雄
    }
  }
  return true;
}

function findTroopAnywhere(state: import("../../core/types/battle").BattleState, instanceId: string): TroopInstance | null {
  for (const side of ["player", "enemy"] as const) {
    const slots = (side === "player" ? state.player : state.enemy).troopSlots;
    for (const t of slots) if (t && t.instanceId === instanceId) return t;
  }
  return null;
}

function ResourceTag({ label, value, highlight }: { label: string; value: string; highlight?: boolean }): JSX.Element {
  return (
    <div style={{ background: highlight ? "#a40" : "#2a2c36", padding: "4px 8px", borderRadius: 3 }}>
      <span style={{ color: "#888", marginRight: 4 }}>{label}</span>
      <span style={{ fontFamily: "Consolas, monospace", fontWeight: "bold" }}>{value}</span>
    </div>
  );
}

interface TroopSlotProps {
  slot: TroopInstance | null;
  side: "player" | "enemy";
  activeSide: "player" | "enemy";
  isTargetable: boolean;
  canAttack: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

function TroopSlotView({ slot, isTargetable, canAttack, isSelected, onClick }: TroopSlotProps): JSX.Element {
  const cls = `${styles.troopSlot} ${slot === null ? styles.empty : ""} ${canAttack ? styles.canAttack : ""} ${isTargetable ? styles.targetable : ""} ${isSelected ? styles.selected : ""}`;
  return (
    <div className={cls} onClick={onClick}>
      {slot && (
        <>
          <div className={styles.name}>{slot.cardId}</div>
          <div className={styles.keywords}>
            {Array.from(slot.keywords).map((k) => keywordTag(k)).join(" ")}
            {slot.frozenTurns > 0 && <span className={styles.frozen}> ❄</span>}
          </div>
          <div className={styles.stats}>
            <span>♥{slot.hp}/{slot.maxHp}</span>
            <span>⚔{slot.atk}</span>
            <span>🛡{slot.def}</span>
          </div>
        </>
      )}
    </div>
  );
}

function keywordTag(k: string): string {
  const map: Record<string, string> = { guard: "守", rush: "突", haste: "疾", lethal: "必", lifesteal: "汲", menace: "威", pierce: "穿" };
  return map[k] ?? k;
}

function CardView({ card, playable, selected, onClick }: { card: Card; playable: boolean; selected?: boolean; onClick: () => void }): JSX.Element {
  return (
    <div
      className={`${styles.card} ${playable ? styles.playable : styles.unplayable} ${selected ? styles.selected : ""}`}
      onClick={onClick}
    >
      <div className={styles.head}>
        <span className={styles.name}>{card.name}</span>
        <span className={styles.cost}>{card.cost}</span>
      </div>
      <span className={styles.typeBadge} style={{ background: cardTypeColor(card.type) }}>{cardTypeLabel(card.type)}</span>
      <div className={styles.desc}>{describeCardEffect(card)}</div>
      {card.type === "troop" && (
        <div className={styles.stats}>
          <span>HP {(card as TroopCard).hp}</span>
          <span>ATK {(card as TroopCard).atk}</span>
          <span>DEF {(card as TroopCard).def}</span>
        </div>
      )}
    </div>
  );
}

function describeCardEffect(card: Card): string {
  if (card.type === "troop") {
    const kw = (card as TroopCard).keywords.map((k) => keywordTag(k)).join(" ");
    return kw + (kw ? " · " : "") + (card.flavor ?? "");
  }
  if (card.flavor) return card.flavor;
  if (card.type === "action" || card.type === "spell" || card.type === "field") {
    return card.effects.map((e) => e.kind).join(", ");
  }
  if (card.type === "equipment") return `${card.slot} · ${JSON.stringify(card.modifiers)}`;
  return "";
}
