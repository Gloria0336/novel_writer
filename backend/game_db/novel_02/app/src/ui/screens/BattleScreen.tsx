import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { BattleProvider, useBattle } from "../../game/BattleProvider";
import { getCard } from "../../data/cards";
import { canTroopAttack, canActionTarget } from "../../core/combat/attack";
import { aliveTroops } from "../../core/selectors/battle";
import { canAffordMana, totalAvailableMana } from "../../core/resource/mana";
import { canAffordMorale } from "../../core/resource/morale";
import { HEROES } from "../../data/heroes";
import { ENEMIES } from "../../data/enemies";
import type { TroopInstance, BattleState, BattleResult, LogEntry } from "../../core/types/battle";
import type { Side } from "../../core/types/effect";
import type { HeroInstance } from "../../core/types/hero";
import type { EnemyScale } from "../../game/seed";
import type { Card } from "../../core/types/card";
import type { HeroDefinition } from "../../core/types/hero";
import type { OathChoice } from "../../core/turn/actions";
import styles from "../styles/battle.module.css";
import { GameIndexOverlay } from "./GameIndexOverlay";
import { buildCardFaceModel } from "../../game/cardPresentation";
import { CardFace } from "../components/CardFace";

interface Props {
  heroId: string;
  enemyId?: string;
  initialPlayerHero?: HeroInstance;
  initialDeckIds?: string[];
  enemyScale?: EnemyScale;
  onExit: () => void;
  onBattleEnd?: (result: Exclude<BattleResult, "ongoing">, finalState: BattleState) => void;
}

export function BattleScreen({ heroId, enemyId, initialPlayerHero, initialDeckIds, enemyScale, onExit, onBattleEnd }: Props): JSX.Element {
  return (
    <BattleProvider
      heroId={heroId}
      enemyId={enemyId}
      initialPlayerHero={initialPlayerHero}
      initialDeckIds={initialDeckIds}
      enemyScale={enemyScale}
      onBattleEnd={onBattleEnd}
    >
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

const RACE_TO_THEME: Record<string, string> = {
  human: "azure",
  elf: "violet",
  dwarf: "amber",
  beast: "crimson",
  orc: "crimson",
  fey: "fey",
  demon: "crimson",
  undead: "fey",
  divine: "divine",
  halfgod: "divine",
};

const FRAME_THEME = "midnight";
const GAUGE_MAX_DEFAULT = 100;
const ATTACK_FX_MS = 760;

interface Point {
  x: number;
  y: number;
}

interface AttackFx {
  id: number;
  attackerSide: Side;
  attackerCardId: string;
  targetSide: Side;
  targetKind: "troop" | "hero";
  from: Point;
  mid: Point;
  to: Point;
  strike: Point;
  tilt: string;
  slashAngle: string;
}

function BattleView({ onExit }: { onExit: () => void }): JSX.Element {
  const { state, dispatch, reset } = useBattle();
  const [select, setSelect] = useState<SelectMode>({ kind: "none" });
  const [indexOpen, setIndexOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [oathPrompt, setOathPrompt] = useState<{ handIndex: number } | null>(null);
  const [placementPulse, setPlacementPulse] = useState<{ slotIndex: number; nonce: number } | null>(null);
  const [attackFx, setAttackFx] = useState<AttackFx | null>(null);
  const [attackFxQueue, setAttackFxQueue] = useState<AttackFx[]>([]);
  const scaleRef = useRef<HTMLDivElement | null>(null);
  const seenLogCountRef = useRef(state.log.length);

  useEffect(() => {
    function fit(): void {
      const el = scaleRef.current;
      if (!el) return;
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const sx = width / 1920;
      const sy = height / 1080;
      const raw = Math.min(sx, sy);
      // Keep the snap fine-grained and never above the actual fit scale.
      const dpr = window.devicePixelRatio || 1;
      const snapUnit = dpr * 1000;
      const snapped = Math.round(raw * snapUnit) / snapUnit;
      const s = Math.min(raw, snapped);
      el.style.transform = `scale(${s})`;
    }
    fit();
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        setSelect({ kind: "none" });
        setPreviewCard(null);
        setOathPrompt(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!placementPulse) return;
    const timeout = window.setTimeout(() => setPlacementPulse(null), 700);
    return () => window.clearTimeout(timeout);
  }, [placementPulse]);

  useEffect(() => {
    if (state.log.length < seenLogCountRef.current) {
      seenLogCountRef.current = state.log.length;
      return;
    }
    const newLogs = state.log.slice(seenLogCountRef.current);
    seenLogCountRef.current = state.log.length;
    const nextFx = newLogs
      .map((entry, index) => buildAttackFx(entry, Date.now() + index))
      .filter((fx): fx is AttackFx => fx !== null);
    if (nextFx.length > 0) setAttackFxQueue((queue) => [...queue, ...nextFx]);
  }, [state.log]);

  useEffect(() => {
    if (attackFx || attackFxQueue.length === 0) return;
    const [nextFx] = attackFxQueue;
    if (!nextFx) return;
    setAttackFx(nextFx);
    setAttackFxQueue((queue) => queue.slice(1));
  }, [attackFx, attackFxQueue]);

  useEffect(() => {
    if (!attackFx) return;
    const timeout = window.setTimeout(() => setAttackFx(null), ATTACK_FX_MS);
    return () => window.clearTimeout(timeout);
  }, [attackFx]);

  const playerHero = state.player.hero;
  const enemyHero = state.enemy.hero;
  const heroDef = ENEMIES[playerHero.defId]?.heroDef ?? HEROES[playerHero.defId]!;
  const enemyDef = ENEMIES[enemyHero.defId]?.heroDef ?? HEROES[enemyHero.defId]!;
  const heroTheme = RACE_TO_THEME[heroDef.raceId] ?? "azure";

  const isPlayerTurn = state.activeSide === "player" && state.result === "ongoing";
  const mana = totalAvailableMana(state.player);
  const manaCap = state.player.manaCap;

  function clickHandCard(idx: number): void {
    const inst = state.player.hand[idx];
    if (!inst) return;
    const card = getCard(inst.cardId);
    if (!canPlayCardCheck(state, card)) return;

    if (card.type === "troop") {
      setSelect({ kind: "playCard", handIndex: idx, needsTarget: false, needsSlot: true });
    } else if (card.type === "spell" || card.type === "action") {
      if (card.id === "S14" && card.type === "spell") {
        setOathPrompt({ handIndex: idx });
        setSelect({ kind: "none" });
        return;
      }
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
        setPlacementPulse({ slotIndex: idx, nonce: Date.now() });
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
    setOathPrompt(null);
  }

  function chooseOath(choice: OathChoice): void {
    if (!oathPrompt) return;
    dispatch({ type: "PLAY_SPELL", handIndex: oathPrompt.handIndex, oathChoice: choice });
    setOathPrompt(null);
    setSelect({ kind: "none" });
  }

  const stability = state.stability;
  const stabilityTone: "gold" | "green" | "red" = stability >= 75 ? "gold" : stability >= 50 ? "green" : "red";
  const stabilityScale = Math.max(0, Math.min(100, stability)) / 100;
  const phase = isPlayerTurn ? "主要" : "結束";

  const enemyTargetable =
    isPlayerTurn && (
      select.kind === "attackWithTroop" ||
      (select.kind === "playCard" && select.needsTarget) ||
      select.kind === "useUltimate" ||
      (select.kind === "useSkill" && select.needsTarget)
    );

  const ultReady = playerHero.morale >= 100 && !playerHero.flags.ultimateUsed;
  const lastLog = state.log.slice(-1)[0];
  const recentLogs = state.log.slice(-3).reverse();

  function toggleCardPreview(cardId: string): void {
    setPreviewCard((current) => (current?.id === cardId ? null : getCard(cardId)));
  }

  return (
    <div className={styles.stage}>
      <div className={styles.scale} ref={scaleRef}>
        <div className={styles.root} data-frame={FRAME_THEME} data-hero={heroTheme}>
          {/* Top bar */}
          <div className={styles.topBar}>
            <span className={styles.cornerEmb} data-pos="tl" />
            <span className={styles.cornerEmb} data-pos="tr" />
            <span className={styles.cornerEmb} data-pos="bl" />
            <span className={styles.cornerEmb} data-pos="br" />

            <div className={styles.turn} data-side={state.activeSide}>
              <div className={styles.turnPip} />
              <div>
                <div className={styles.turnLabel}>{state.activeSide === "player" ? "我方回合" : "敵方回合"}</div>
              </div>
              <div className={styles.turnRound}>第 {state.turn} 回合</div>
            </div>

            <div className={styles.divider} />

            {state.field && (
              <>
                <div className={styles.fieldStatus}>
                  <div className={styles.fieldStatusCard}>場地：{getCard(state.field.cardId).name}</div>
                </div>

                <div className={styles.divider} />
              </>
            )}

            <div className={styles.phase}>
              {["抽牌", "主要", "結束"].map((p) => (
                <div key={p} className={`${styles.phaseChip} ${p === phase ? styles.phaseChipActive : ""}`}>{p}</div>
              ))}
            </div>

            <div className={styles.divider} />

            <div className={styles.topBtns}>
              <button className={styles.topBtn} onClick={() => setIndexOpen(true)}>索引</button>
              <button className={styles.topBtn} onClick={onExit}>退出</button>
            </div>
          </div>

          {indexOpen && <GameIndexOverlay onClose={() => setIndexOpen(false)} />}
          {previewCard && <CardPreviewOverlay card={previewCard} onClose={() => setPreviewCard(null)} />}
          {oathPrompt && (
            <OathChoiceOverlay
              onChoose={chooseOath}
              onClose={() => setOathPrompt(null)}
            />
          )}

          {/* Action log */}
          <div className={styles.log}>
            {recentLogs.map((l, i) => (
              <div
                key={`${l.turn}-${i}-${l.text.slice(0, 8)}`}
                className={styles.logItem}
                data-kind={l.kind === "VICTORY" ? "victory" : l.kind === "DEFEAT" ? "defeat" : l.kind.startsWith("CORRUPTION") ? "hint" : undefined}
              >
                T{l.turn}·{l.side === "player" ? "我" : "敵"}：{l.text}
              </div>
            ))}
          </div>

          {/* Left side — enemy + player hero cards */}
          <div className={`${styles.side} ${styles.sideLeft}`}>
            <MiniHeroCard
              side="enemy"
              def={enemyDef}
              hero={enemyHero}
              targetable={enemyTargetable}
              onClick={clickEnemyHero}
            />
            <MiniHeroCard
              side="player"
              def={heroDef}
              hero={playerHero}
            />
          </div>

          {/* Right side — resources + skills + end turn */}
          <div className={`${styles.side} ${styles.sideRight}`}>
            <div className={styles.resources}>
              <h4>魔力</h4>
              <div className={styles.mana}>
                {Array.from({ length: Math.max(10, manaCap) }).map((_, i) => {
                  const empty = i >= manaCap || i >= mana;
                  return <div key={i} className={styles.manaOrb} data-empty={empty ? "true" : "false"} />;
                })}
              </div>

              <div className={styles.morale}>
                <div className={styles.row}>
                  <div className={styles.lbl}>鬥志</div>
                  <div className={styles.v}>{playerHero.morale} / 100</div>
                </div>
                <div className={styles.track}>
                  <div className={`${styles.fill} ${ultReady ? styles.fillReady : ""}`} style={{ width: `${Math.min(100, playerHero.morale)}%` }} />
                </div>
              </div>

              <div className={styles.gauge}>
                <div className={styles.row}>
                  <div className={styles.lbl}>量表 · {heroDef.name}</div>
                  <div className={styles.v}>{playerHero.gaugeValue}</div>
                </div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${Math.min(100, (playerHero.gaugeValue / GAUGE_MAX_DEFAULT) * 100)}%` }} />
                </div>
                <div className={styles.gaugeDesc}>{heroDef.gauge.description}</div>
              </div>

              <div className={styles.skillsList}>
                {heroDef.actives.map((skill) => {
                  const moraleOk = !skill.cost.morale || canAffordMorale(playerHero, skill.cost.morale);
                  const disabled = !isPlayerTurn || !moraleOk;
                  return (
                    <button
                      key={skill.id}
                      className={styles.skillBtn}
                      onClick={() => clickSkill(skill.id)}
                      disabled={disabled}
                      title={skill.description}
                    >
                      <div>{skill.name}</div>
                      <div className={styles.skillCost}>{skill.cost.morale ?? 0} 鬥志</div>
                    </button>
                  );
                })}
                <button
                  className={styles.skillBtn}
                  data-ult="true"
                  data-ready={ultReady ? "true" : "false"}
                  onClick={clickUltimate}
                  disabled={!isPlayerTurn || !ultReady}
                  title={heroDef.ultimate.description}
                >
                  <div>✦ {heroDef.ultimate.name}</div>
                  <div className={styles.skillCost}>100 鬥志</div>
                </button>
              </div>
            </div>

            <button
              className={styles.endTurn}
              data-disabled={!isPlayerTurn ? "true" : "false"}
              onClick={endTurn}
              disabled={!isPlayerTurn}
            >
              結束回合
            </button>
          </div>

          {/* Battlefield */}
          <div className={styles.field}>
            <div className={styles.fieldFrame}>
              <div className={styles.fieldFloor} data-persp="on">
                <div className={styles.lanes}>
                  <div className={styles.lane} data-side="enemy">
                    {state.enemy.troopSlots.map((t, i) => (
                      <TroopSlotView
                        key={i}
                        slot={t}
                        side="enemy"
                        isTargetable={
                          isPlayerTurn && t !== null && (
                            select.kind === "attackWithTroop" ||
                            (select.kind === "playCard" && select.needsTarget) ||
                            (select.kind === "useSkill" && select.needsTarget) ||
                            (select.kind === "useUltimate" && select.needsTarget)
                          )
                        }
                        canAttack={false}
                        onClick={() => clickSlot("enemy", i)}
                        onPreview={t ? () => toggleCardPreview(t.cardId) : undefined}
                      />
                    ))}
                  </div>
                  <div className={styles.laneDivider} data-tone={stabilityTone}>
                    <div className={styles.laneStabilityNum}>{stability}</div>
                    <div
                      className={styles.laneStabilityFill}
                      style={{ transform: `scaleX(${stabilityScale})` }}
                    />
                  </div>
                  <div className={styles.lane} data-side="player">
                    {state.player.troopSlots.map((t, i) => {
                      const canAttack =
                        isPlayerTurn && t !== null && select.kind === "none" && (
                          aliveTroops(state.enemy).some((e) => canTroopAttack(state, "player", t, e).ok) ||
                          canTroopAttack(state, "player", t, "hero").ok
                        );
                      const isSelected = select.kind === "attackWithTroop" && t?.instanceId === select.instanceId;
                      const isTargetable = isPlayerTurn && !t && select.kind === "playCard" && select.needsSlot;
                      return (
                        <TroopSlotView
                          key={i}
                          slot={t}
                          side="player"
                          isTargetable={isTargetable}
                          canAttack={canAttack}
                          isSelected={isSelected}
                          placementPulse={placementPulse?.slotIndex === i ? placementPulse.nonce : undefined}
                          onClick={() => clickSlot("player", i)}
                          onPreview={t ? () => toggleCardPreview(t.cardId) : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {attackFx && <AttackEffectOverlay fx={attackFx} />}

          {/* Race gauge strip (mirrors right-panel gauge along bottom) */}
          <div className={styles.cmdStrip}>
            <div className={styles.cmdLabel}>{heroDef.name}·量表</div>
            <div className={styles.segTrack}>
              {Array.from({ length: 20 }).map((_, i) => {
                const lit = i < Math.round((playerHero.gaugeValue / GAUGE_MAX_DEFAULT) * 20);
                return <div key={i} className={`${styles.seg} ${lit ? styles.segLit : ""}`} />;
              })}
            </div>
            <div className={styles.cmdNum}>{playerHero.gaugeValue} / {GAUGE_MAX_DEFAULT}</div>
          </div>

          {/* Deck pile (left) & discard (right) */}
          <PileView kind="deck" count={state.player.deck.length} label="牌庫" />
          <PileView kind="discard" count={state.player.graveyard.length} label="棄牌" />

          {/* Hand fan */}
          <div className={styles.hand}>
            <div className={styles.handZone}>
              {state.player.hand.map((inst, i) => {
                const card = getCard(inst.cardId);
                const playable = isPlayerTurn && canPlayCardCheck(state, card);
                const selected = select.kind === "playCard" && select.handIndex === i;
                const total = state.player.hand.length;
                const spread = Math.min(60, total * 11);
                const step = total > 1 ? spread / (total - 1) : 0;
                const angle = -spread / 2 + i * step;
                const rad = (angle * Math.PI) / 180;
                const x = Math.sin(rad) * 320;
                const y = -Math.cos(rad) * 60 + 60;
                const rot = angle;
                const baseTransform = `translate(calc(-50% + ${x}px), ${y}px) rotate(${rot}deg)`;
                const hoverTransform = `translate(calc(-50% + ${x}px), -155px) rotate(0deg) scale(1.42)`;
                const style = {
                  transform: baseTransform,
                  zIndex: i,
                  ["--hover-transform" as string]: hoverTransform,
                } as CSSProperties;
                return (
                  <div
                    key={inst.instanceId}
                    className={styles.handCard}
                    data-playable={playable ? "true" : "false"}
                    data-selected={selected ? "true" : "false"}
                    style={style}
                    onClick={() => playable && clickHandCard(i)}
                  >
                    <CardFace
                      model={buildCardFaceModel(card)}
                      variant="hand"
                      playable={playable}
                      selected={selected}
                      disabled={!playable}
                      onPreview={() => toggleCardPreview(inst.cardId)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selection hint */}
          {select.kind !== "none" && (
            <div className={styles.selectHint}>選取中：{describeSelect(select)}（按 Esc 取消）</div>
          )}

          {/* Game over overlay */}
          {state.result !== "ongoing" && (
            <div className={styles.gameover}>
              <div className={styles.gameoverPanel}>
                <h2 className={state.result === "playerWin" ? styles.win : styles.lose}>
                  {state.result === "playerWin" ? "勝利" : "敗北"}
                </h2>
                <p>{state.endgameReason ?? ""}</p>
                <button className={styles.gameoverBtn} onClick={reset}>再戰一場</button>
                <button className={styles.gameoverBtn} onClick={onExit}>選英雄</button>
              </div>
            </div>
          )}
        </div>
      </div>
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

function canPlayCardCheck(state: BattleState, card: Card): boolean {
  if (state.activeSide !== "player") return false;
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
  return true;
}

function findTroopAnywhere(state: BattleState, instanceId: string): TroopInstance | null {
  for (const side of ["player", "enemy"] as const) {
    const slots = (side === "player" ? state.player : state.enemy).troopSlots;
    for (const t of slots) if (t && t.instanceId === instanceId) return t;
  }
  return null;
}

function buildAttackFx(entry: LogEntry, id: number): AttackFx | null {
  if (entry.kind !== "TROOP_VS_TROOP" && entry.kind !== "TROOP_VS_HERO") return null;
  const payload = entry.payload ?? {};
  const attackerSide = readSide(payload.attackerSide);
  const targetSide = readSide(payload.targetSide);
  const attackerCardId = typeof payload.attackerCardId === "string" ? payload.attackerCardId : undefined;
  if (!attackerSide || !targetSide || !attackerCardId) return null;

  const attackerSlotIndex = readNumber(payload.attackerSlotIndex, -1);
  if (attackerSlotIndex < 0) return null;

  const attackerSlotCount = readNumber(payload.attackerSlotCount, 5);
  const targetKind = payload.targetKind === "hero" ? "hero" : "troop";
  const from = troopSlotCenter(attackerSide, attackerSlotIndex, attackerSlotCount);
  const to = targetKind === "hero"
    ? heroCenter(targetSide)
    : troopSlotCenter(targetSide, readNumber(payload.targetSlotIndex, 0), readNumber(payload.targetSlotCount, 5));
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mid = {
    x: from.x + dx * 0.48,
    y: from.y + dy * 0.48 - 92,
  };
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    id,
    attackerSide,
    attackerCardId,
    targetSide,
    targetKind,
    from,
    mid,
    to,
    strike: {
      x: to.x - Math.sign(dx || 1) * 24,
      y: to.y - Math.sign(dy || 1) * 10,
    },
    tilt: dx >= 0 ? "7deg" : "-7deg",
    slashAngle: `${angle + 38}deg`,
  };
}

function readSide(value: unknown): Side | null {
  return value === "player" || value === "enemy" ? value : null;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function troopSlotCenter(side: Side, slotIndex: number, slotCount: number): Point {
  const fieldLeft = 290;
  const fieldTop = 84;
  const fieldWidth = 1340;
  const fieldHeight = 716;
  const slotWidth = 132;
  const slotHeight = 174;
  const slotGap = 14;
  const count = Math.max(1, slotCount);
  const totalWidth = count * slotWidth + Math.max(0, count - 1) * slotGap;
  const firstCenterX = fieldLeft + (fieldWidth - totalWidth) / 2 + slotWidth / 2;

  return {
    x: firstCenterX + Math.max(0, Math.min(slotIndex, count - 1)) * (slotWidth + slotGap),
    y: side === "enemy"
      ? fieldTop + fieldHeight / 2 - 18 - slotHeight / 2
      : fieldTop + fieldHeight / 2 + 18 + slotHeight / 2,
  };
}

function heroCenter(side: Side): Point {
  return side === "enemy" ? { x: 146, y: 274 } : { x: 146, y: 806 };
}

function AttackEffectOverlay({ fx }: { fx: AttackFx }): JSX.Element {
  let card: Card | null = null;
  try {
    card = getCard(fx.attackerCardId);
  } catch {
    card = null;
  }
  const style = {
    "--fx-from-x": `${fx.from.x}px`,
    "--fx-from-y": `${fx.from.y}px`,
    "--fx-mid-x": `${fx.mid.x}px`,
    "--fx-mid-y": `${fx.mid.y}px`,
    "--fx-to-x": `${fx.to.x}px`,
    "--fx-to-y": `${fx.to.y}px`,
    "--fx-strike-x": `${fx.strike.x}px`,
    "--fx-strike-y": `${fx.strike.y}px`,
    "--fx-tilt": fx.tilt,
    "--fx-slash-angle": fx.slashAngle,
  } as CSSProperties;

  return (
    <div key={fx.id} className={styles.attackFxLayer} style={style} aria-hidden="true">
      <div className={styles.attackGhostCard} data-side={fx.attackerSide}>
        <div className={styles.attackGhostCost}>{card?.cost ?? ""}</div>
        <div className={styles.attackGhostArt}>
          <div className={styles.attackGhostGlow} />
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="#000" strokeWidth=".35">
            <path d="M12 3l2.6 6 6.4.6-4.8 4.3 1.4 6.5L12 17l-5.6 3.4 1.4-6.5L3 9.6 9.4 9z" />
          </svg>
        </div>
        <div className={styles.attackGhostName}>{card?.name ?? fx.attackerCardId}</div>
      </div>

      <div className={styles.slashImpact} data-side={fx.attackerSide} data-target={fx.targetKind}>
        <span className={styles.slashRing} />
        <span className={styles.slashSpark} />
      </div>
    </div>
  );
}

function CardPreviewOverlay({ card, onClose }: { card: Card; onClose: () => void }): JSX.Element {
  function closeOnContextMenu(event: MouseEvent<HTMLDivElement>): void {
    event.preventDefault();
    onClose();
  }

  return (
    <div
      className={styles.cardPreviewBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} full preview`}
      onContextMenu={closeOnContextMenu}
    >
      <div className={styles.cardPreviewFrame}>
        <CardFace model={buildCardFaceModel(card)} variant="preview" />
      </div>
    </div>
  );
}

const OATH_CHOICES: Array<{ id: OathChoice; name: string; text: string }> = [
  { id: "restore", name: "全面恢復", text: "英雄 +30 HP，全兵力 +10 HP" },
  { id: "strengthen", name: "全面強化", text: "全兵力 +5 ATK，持續 3 回合" },
  { id: "purify", name: "全面淨化", text: "移除所有負面狀態，免疫 1 回合" },
];

function OathChoiceOverlay({ onChoose, onClose }: { onChoose: (choice: OathChoice) => void; onClose: () => void }): JSX.Element {
  return (
    <div className={styles.oathBackdrop} role="dialog" aria-modal="true" aria-label="盟約之誓選擇">
      <div className={styles.oathPanel}>
        <div className={styles.oathHeader}>
          <div className={styles.oathKicker}>S14 · 傳奇法術</div>
          <h2>盟約之誓</h2>
        </div>
        <div className={styles.oathOptions}>
          {OATH_CHOICES.map((choice) => (
            <button key={choice.id} className={styles.oathOption} onClick={() => onChoose(choice.id)}>
              <span className={styles.oathOptionName}>{choice.name}</span>
              <span className={styles.oathOptionText}>{choice.text}</span>
            </button>
          ))}
        </div>
        <button className={styles.oathCancel} onClick={onClose}>取消</button>
      </div>
    </div>
  );
}

interface MiniHeroCardProps {
  side: "player" | "enemy";
  def: HeroDefinition;
  hero: HeroInstance;
  targetable?: boolean;
  onClick?: () => void;
}

function MiniHeroCard({ side, def, hero, targetable, onClick }: MiniHeroCardProps): JSX.Element {
  const [heroArtFailed, setHeroArtFailed] = useState(false);
  const isEnemy = side === "enemy";
  const skills = [
    def.passives[0] ? { kind: "被動", name: def.passives[0].name, desc: def.passives[0].description, ult: false } : null,
    { kind: "終極", name: def.ultimate.name, desc: def.ultimate.description, ult: true },
  ].filter(Boolean) as Array<{ kind: string; name: string; desc: string; ult: boolean }>;
  const raceLabel = raceName(def.raceId);
  const classLabel = className(def.classId);
  const costId = `mhCostBody-${side}`;
  const costRingId = `mhCostRing-${side}`;
  const bannerId = `mhBM-${side}`;
  const rarityBodyId = `mhRB-${side}`;
  const rarityRingId = `mhRR-${side}`;
  const bgId = `mhBg-${side}`;
  const fgId = `mhFg-${side}`;
  const heroArtSrc = `/card-art/heroes/${def.id}.webp`;

  useEffect(() => {
    setHeroArtFailed(false);
  }, [def.id]);

  return (
    <div
      className={styles.hero}
      data-side={side}
      data-targetable={targetable ? "true" : undefined}
      onClick={onClick}
    >
      <div className={styles.heroFrame} />
      <div className={styles.heroFrameIn} />
      <CornerOrn pos="tl" />
      <CornerOrn pos="tr" />
      <CornerOrn pos="bl" />
      <CornerOrn pos="br" />

      <div className={styles.mhHeader}>
        <div className={styles.mhCost}>
          <svg viewBox="0 0 100 100">
            <defs>
              <radialGradient id={costId} cx=".4" cy=".35" r=".8">
                <stop offset="0" stopColor={isEnemy ? "#ffb0a8" : "var(--hero-glow)"} stopOpacity=".95" />
                <stop offset=".4" stopColor={isEnemy ? "#b83236" : "var(--hero-a)"} />
                <stop offset="1" stopColor={isEnemy ? "#5c1517" : "var(--hero-b)"} />
              </radialGradient>
              <linearGradient id={costRingId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--metal-b)" />
                <stop offset=".5" stopColor="var(--metal-c)" />
                <stop offset="1" stopColor="var(--metal-b)" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill={`url(#${costRingId})`} />
            <circle cx="50" cy="50" r="40" fill={`url(#${costId})`} />
            <ellipse cx="42" cy="36" rx="22" ry="14" fill="#fff" opacity=".35" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="#0006" strokeWidth=".6" />
          </svg>
          <div className={styles.mhCostNum}>{hero.cmd}</div>
        </div>

        <div className={styles.mhBanner}>
          <svg viewBox="0 0 280 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id={bannerId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--metal-b)" />
                <stop offset=".5" stopColor="var(--metal-c)" />
                <stop offset="1" stopColor="var(--metal-a)" />
              </linearGradient>
            </defs>
            <polygon points="10,3 270,3 277,25 270,47 10,47 3,25" fill={`url(#${bannerId})`} />
            <polygon points="14,7 266,7 272,25 266,43 14,43 8,25" fill="var(--bg-deep)" />
          </svg>
          <div className={styles.mhBannerName}>{def.name}</div>
        </div>

        <div className={styles.mhRarity}>
          <svg viewBox="0 0 100 100">
            <defs>
              <linearGradient id={rarityBodyId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff0bf" />
                <stop offset="1" stopColor="#d0982c" />
              </linearGradient>
              <linearGradient id={rarityRingId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--metal-b)" />
                <stop offset=".5" stopColor="var(--metal-c)" />
                <stop offset="1" stopColor="var(--metal-b)" />
              </linearGradient>
            </defs>
            <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill={`url(#${rarityRingId})`} />
            <polygon points="50,11 86,31 86,69 50,89 14,69 14,31" fill={`url(#${rarityBodyId})`} />
          </svg>
          <div className={styles.mhRarityT}>{def.rarity}</div>
        </div>
      </div>

      <div className={styles.mhArt}>
        {!heroArtFailed && (
          <img
            className={styles.mhArtImage}
            src={heroArtSrc}
            alt={def.name}
            draggable={false}
            onError={() => setHeroArtFailed(true)}
          />
        )}
        {heroArtFailed && (
          <svg className={styles.silhouette} viewBox="0 0 200 210" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id={bgId} cx=".5" cy=".4" r=".7">
                <stop offset="0" stopColor={isEnemy ? "#3a0d10" : "var(--hero-a)"} stopOpacity=".55" />
                <stop offset="1" stopColor="var(--bg-deep)" />
              </radialGradient>
              <linearGradient id={fgId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={isEnemy ? "#6a1a1f" : "var(--hero-a)"} />
                <stop offset="1" stopColor="#0a0a12" />
              </linearGradient>
            </defs>
            <rect width="200" height="210" fill={`url(#${bgId})`} />
            <ellipse cx="100" cy="180" rx="80" ry="14" fill="#000" opacity=".55" />
            <g fill={`url(#${fgId})`} stroke="#000" strokeWidth=".4">
              <path d="M40 200 Q 60 130 100 95 Q 140 130 160 200 Z" />
              <path d="M60 130 Q 80 110 100 108 Q 120 110 140 130 L 140 145 Q 100 130 60 145 Z" fill="#0a0a12" />
              <ellipse cx="100" cy="85" rx="18" ry="22" />
              <path d="M82 82 Q 100 70 118 82 L 118 92 Q 100 86 82 92 Z" fill="#000" opacity=".6" />
              <path d="M100 70 L 100 110" stroke="#000" strokeWidth="1" opacity=".5" />
            </g>
            {isEnemy ? (
              <g fill="#5a0c10" stroke="#000" strokeWidth=".5">
                <rect x="155" y="60" width="3" height="120" />
                <path d="M158 60 L 178 65 L 175 90 L 158 85 Z" />
              </g>
            ) : (
              <g fill="var(--hero-b)" stroke="#000" strokeWidth=".5">
                <rect x="40" y="60" width="3" height="120" />
                <path d="M40 60 L 20 65 L 23 90 L 40 85 Z" />
                <circle cx="41" cy="58" r="4" fill="var(--metal-c)" />
              </g>
            )}
            <g opacity=".18"><path d="M100 0 L 80 105 L 120 105 Z" fill="#fff" /></g>
          </svg>
        )}
        <div className={styles.vignette} />
      </div>

      <div className={styles.mhTags}>
        {[raceLabel, classLabel].map((tag, i) => (
          <div key={i} className={styles.mhTag}>{tag}<i /></div>
        ))}
      </div>

      <div className={styles.mhSkills}>
        {skills.slice(0, 2).map((s, i) => (
          <div key={i} className={styles.mhSkillRow}>
            <div className={styles.mhSkillIco}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3l2.6 6 6.4.6-4.8 4.3 1.4 6.5L12 17l-5.6 3.4 1.4-6.5L3 9.6 9.4 9z" />
              </svg>
            </div>
            <div className={styles.mhSkillTxt}>
              <span className={`${styles.kind} ${s.ult ? styles.kindUlt : ""}`}>{s.kind}</span>
              <span className={styles.sep}>│</span>
              <span className={`${styles.nm} ${s.ult ? styles.nmUlt : ""}`}>{s.name}</span>：{s.desc}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mhStats}>
        <div className={styles.mhStatCell} data-kind="hp">
          <div className={styles.statL}>HP</div>
          <div className={styles.statV}>{hero.hp}<span className={styles.vSub}>/{hero.maxHp}</span></div>
        </div>
        <div className={styles.mhStatCell} data-kind="atk">
          <div className={styles.statL}>ATK</div>
          <div className={styles.statV}>{hero.atk}</div>
        </div>
        <div className={styles.mhStatCell} data-kind="def">
          <div className={styles.statL}>DEF</div>
          <div className={styles.statV}>{hero.def}{hero.armor > 0 ? <span className={styles.vSub}>+{hero.armor}</span> : null}</div>
        </div>
        <div className={styles.mhStatCell} data-kind="cmd">
          <div className={styles.statL}>CMD</div>
          <div className={styles.statV}>{hero.cmd}</div>
        </div>
      </div>
    </div>
  );
}

function PileView({ kind, count, label }: { kind: "deck" | "discard"; count: number; label: string }): JSX.Element {
  return (
    <div className={styles.pile} data-kind={kind}>
      <div className={styles.pileStack}>
        <div className={styles.layer} />
        <div className={styles.layer} />
        <div className={`${styles.layer} ${styles.layerTop}`}>
          <div className={styles.pileOrn} />
          <div className={styles.pileSigil}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z" /></svg>
          </div>
        </div>
      </div>
      <div className={styles.pileCount}>
        <span className={styles.pileCountNum}>{count}</span> {label}
      </div>
    </div>
  );
}

function CornerOrn({ pos }: { pos: "tl" | "tr" | "bl" | "br" }): JSX.Element {
  return (
    <svg className={styles.cornerOrn} data-pos={pos} viewBox="0 0 28 28">
      <defs>
        <linearGradient id={`co-grad-${pos}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--metal-b)" />
          <stop offset=".5" stopColor="var(--metal-c)" />
          <stop offset="1" stopColor="var(--metal-a)" />
        </linearGradient>
      </defs>
      <g fill={`url(#co-grad-${pos})`} stroke="#0007" strokeWidth=".4">
        <path d="M0 0 H14 V2 H2 V14 H0 Z" />
        <path d="M5 5 H10 V6 H6 V10 H5 Z" />
      </g>
      <circle cx="7" cy="7" r="1.4" fill="var(--metal-c)" stroke="#0007" strokeWidth=".3" />
    </svg>
  );
}

interface TroopSlotProps {
  slot: TroopInstance | null;
  side: "player" | "enemy";
  isTargetable: boolean;
  canAttack: boolean;
  isSelected?: boolean;
  placementPulse?: number;
  onClick: () => void;
  onPreview?: () => void;
}

function TroopSlotView({ slot, side, isTargetable, canAttack, isSelected, placementPulse, onClick, onPreview }: TroopSlotProps): ReactNode {
  if (!slot) {
    return (
      <div
        className={styles.unitSlot}
        data-empty="true"
        data-targetable={isTargetable ? "true" : undefined}
        onClick={onClick}
      />
    );
  }
  const card = getCard(slot.cardId);
  const hurtTone: "hurt" | "crit" | undefined =
    slot.hp < slot.maxHp / 2 ? "crit" : slot.hp < slot.maxHp ? "hurt" : undefined;
  const kws = Array.from(slot.keywords);
  const guard = kws.includes("guard");

  function handlePreview(event: MouseEvent<HTMLDivElement>): void {
    if (!onPreview) return;
    event.preventDefault();
    onPreview();
  }

  return (
    <div
      className={styles.unitSlot}
      data-targetable={isTargetable ? "true" : undefined}
      data-attackable={canAttack ? "true" : undefined}
      data-selected={isSelected ? "true" : undefined}
      data-placement={placementPulse !== undefined ? "true" : undefined}
      onClick={onClick}
      onContextMenu={onPreview ? handlePreview : undefined}
    >
      <div
        className={`${styles.unit} ${slot.frozenTurns > 0 ? styles.unitStunned : ""} ${guard ? styles.unitGuard : ""}`}
        data-faction={side}
      >
        <div className={styles.unitCost}>{card.cost}</div>
        <div className={styles.unitArt}>
          <div className={styles.unitGlow} />
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="#000" strokeWidth=".3">
            <path d="M12 3l2.6 6 6.4.6-4.8 4.3 1.4 6.5L12 17l-5.6 3.4 1.4-6.5L3 9.6 9.4 9z" />
          </svg>
        </div>
        <div className={styles.unitName}>{card.name}</div>
        <div className={styles.unitStats}>
          <div className={styles.unitStat} data-kind="atk">⚔ {slot.atk}</div>
          {slot.def > 0 && <div className={styles.unitStat} data-kind="def">🛡 {slot.def}</div>}
          <div className={styles.unitStat} data-kind="hp" data-tone={hurtTone}>
            ♥ {slot.hp}{slot.hp !== slot.maxHp && <span className={styles.unitStatSub}>/{slot.maxHp}</span>}
          </div>
        </div>
        {kws.length > 0 && (
          <div className={styles.unitKeywords}>
            {kws.map((k) => <span key={k} className={styles.unitKw} data-kw={k}>{keywordTag(k)}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function keywordTag(k: string): string {
  const map: Record<string, string> = { guard: "守護", rush: "突進", haste: "疾走", lethal: "必殺", lifesteal: "汲取", menace: "威壓", pierce: "穿透" };
  return map[k] ?? k;
}

function raceName(id: string): string {
  const map: Record<string, string> = {
    human: "人類", elf: "精靈", dwarf: "矮人", beast: "獸族", orc: "獸族",
    fey: "妖族", demon: "惡魔", undead: "亡靈", divine: "半神族", halfgod: "半神族",
  };
  return map[id] ?? id;
}

function className(id: string): string {
  const map: Record<string, string> = {
    commander: "指揮官", mage: "法師", smith: "鍛造師", illusionist: "幻術師",
    berserker: "狂戰士", priest: "神官", adventurer: "冒險家", warrior: "戰士", rogue: "盜賊",
  };
  return map[id] ?? id;
}
