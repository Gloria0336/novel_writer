import { beforeAll, describe, expect, it } from "vitest";
import { BOSS_LIST } from "../../data/enemies/bosses";
import { LULU_DECK_IDS } from "../../data/decks/starter";
import { createBattle, createBattleContext, ensureScriptedRegistered } from "../../game/seed";
import { addBossGaugeRaw, notifyBossGauge, triggerBossBurst } from "./bossGauge";

beforeAll(() => ensureScriptedRegistered());

describe("BossGauge 初始化", () => {
  for (const boss of BOSS_LIST) {
    it(`${boss.id} 戰鬥開始時 state.bossGauge 被初始化`, () => {
      const state = createBattle({
        seed: 1,
        playerHeroId: "lulu",
        playerDeckIds: LULU_DECK_IDS,
        enemyId: boss.id,
      });
      expect(state.bossGauge).toBeDefined();
      expect(state.bossGauge!.value).toBe(0);
      expect(state.bossGauge!.spec.id).toBe(boss.bossGauge.id);
      expect(state.bossGauge!.spec.max).toBe(100);
      expect(state.bossGauge!.burstCount).toBe(0);
    });
  }

  it("非 Boss 戰（lair）無 bossGauge", () => {
    const state = createBattle({
      seed: 1,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "putrefactive_lair",
    });
    expect(state.bossGauge).toBeUndefined();
  });
});

describe("BossGauge 累積與 burst", () => {
  it("addBossGaugeRaw 累積到 max 觸發 burst 並歸零", () => {
    const state = createBattle({
      seed: 2,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "boss_demon_commander",
    });
    const ctx = createBattleContext();
    expect(state.bossGauge!.value).toBe(0);
    addBossGaugeRaw(state, ctx, 100, "test");
    expect(state.bossGauge!.value).toBe(0);
    expect(state.bossGauge!.burstCount).toBe(1);
    expect(state.bossGauge!.lastBurstTurn).toBe(state.turn);
    expect(state.log.some((l) => l.kind === "BOSS_BURST")).toBe(true);
  });

  it("可重複觸發 burst（多次累積）", () => {
    const state = createBattle({
      seed: 3,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "boss_beast_king",
    });
    const ctx = createBattleContext();
    addBossGaugeRaw(state, ctx, 100, "first");
    addBossGaugeRaw(state, ctx, 100, "second");
    expect(state.bossGauge!.burstCount).toBe(2);
  });

  it("notifyBossGauge onSpellCast 對符合 spec 的 Boss 才累積", () => {
    // 夢魔宗主：onSpellCast +8
    const nm = createBattle({
      seed: 4,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "boss_nightmare_lord",
    });
    const ctx = createBattleContext();
    notifyBossGauge(nm, ctx, { kind: "onSpellCast" });
    expect(nm.bossGauge!.value).toBe(8);

    // 獸王：無 onSpellCast trigger
    const beast = createBattle({
      seed: 5,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "boss_beast_king",
    });
    notifyBossGauge(beast, ctx, { kind: "onSpellCast" });
    expect(beast.bossGauge!.value).toBe(0);
  });

  it("惡魔將領：onSummon +8, onAttackHit +3, onTroopSurvivePerTurn +5/個", () => {
    const state = createBattle({
      seed: 6,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "boss_demon_commander",
    });
    const ctx = createBattleContext();
    notifyBossGauge(state, ctx, { kind: "onSummon", cardId: "T_de_01" });
    expect(state.bossGauge!.value).toBe(8);
    notifyBossGauge(state, ctx, { kind: "onAttackHit", toHero: true });
    expect(state.bossGauge!.value).toBe(11);
    notifyBossGauge(state, ctx, {
      kind: "onTroopSurvivePerTurn",
      aliveCount: 3,
      berserkerCount: 0,
      feyCount: 0,
      phantomCount: 0,
    });
    expect(state.bossGauge!.value).toBe(26); // 11 + 3*5
  });

  it("獸王：onPlayerTroopKilled +18, onHeroDamaged per1Hp=1, berserker 兵力存活 +7/個", () => {
    const state = createBattle({
      seed: 7,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "boss_beast_king",
    });
    const ctx = createBattleContext();
    notifyBossGauge(state, ctx, { kind: "onPlayerTroopKilled" });
    expect(state.bossGauge!.value).toBe(18);
    notifyBossGauge(state, ctx, { kind: "onHeroDamaged", amount: 10, lostHpPct: 7.1 });
    expect(state.bossGauge!.value).toBe(28); // +10
    notifyBossGauge(state, ctx, {
      kind: "onTroopSurvivePerTurn",
      aliveCount: 3,
      berserkerCount: 2,
      feyCount: 0,
      phantomCount: 0,
    });
    expect(state.bossGauge!.value).toBe(42); // 28 + 2*7
  });

  it("古魔：onStabilityDelta 每 5 點負向 +3", () => {
    const state = createBattle({
      seed: 8,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "boss_elder_demon",
    });
    const ctx = createBattleContext();
    notifyBossGauge(state, ctx, { kind: "onStabilityDelta", delta: -10 });
    expect(state.bossGauge!.value).toBe(6); // 2*3
    notifyBossGauge(state, ctx, { kind: "onStabilityDelta", delta: -3 });
    expect(state.bossGauge!.value).toBe(6); // < 5 不累積
  });

  it("妖族叛王：onFormSwitch +20, onSummon{fey} +10, onActionPlay +7", () => {
    const state = createBattle({
      seed: 9,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "boss_fey_rebel_king",
    });
    const ctx = createBattleContext();
    notifyBossGauge(state, ctx, { kind: "onFormSwitch" });
    expect(state.bossGauge!.value).toBe(20);
    notifyBossGauge(state, ctx, { kind: "onSummon", cardId: "T_f_01" });
    expect(state.bossGauge!.value).toBe(30);
    notifyBossGauge(state, ctx, { kind: "onSummon", cardId: "T_s_31" }); // 幻影 phantom tag
    expect(state.bossGauge!.value).toBe(40);
    notifyBossGauge(state, ctx, { kind: "onSummon", cardId: "T_de_01" }); // 非 fey/phantom，不命中
    expect(state.bossGauge!.value).toBe(40);
    notifyBossGauge(state, ctx, { kind: "onActionPlay" });
    expect(state.bossGauge!.value).toBe(47);
  });
});

describe("triggerBossBurst 釋放 burst effects", () => {
  it("惡魔將領 burst：玩家全兵力受傷 + 穩定度 -3", () => {
    const state = createBattle({
      seed: 10,
      playerHeroId: "lulu",
      playerDeckIds: LULU_DECK_IDS,
      enemyId: "boss_demon_commander",
    });
    const ctx = createBattleContext();
    const prevStability = state.stability;
    triggerBossBurst(state, ctx);
    expect(state.stability).toBe(prevStability - 3);
    expect(state.bossGauge!.burstCount).toBe(1);
    expect(state.log.some((l) => l.kind === "BOSS_BURST")).toBe(true);
  });
});
