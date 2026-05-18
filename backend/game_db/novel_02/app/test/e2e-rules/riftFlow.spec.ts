import { beforeAll, describe, expect, it } from "vitest";
import { applyPlayerAction, createBattle, createBattleContext, ensureScriptedRegistered } from "../../src/game/seed";
import { LULU_DECK_IDS } from "../../src/data/decks/starter";
import { applyAction } from "../../src/core/turn/reducer";
import { applyStabilityDelta, applyCorruptionStageEffects } from "../../src/core/resource/stability";
import { openRiftIfNeeded, triggerInfiltration, RIFT_BUFF_DEF_BONUS } from "../../src/core/resource/rift";
import { reapDeadTroops } from "../../src/core/effects/registry";
import type { BattleState, TroopInstance } from "../../src/core/types/battle";
import type { BattleContext } from "../../src/core/types/context";
import { getCard } from "../../src/data/cards";

beforeAll(() => ensureScriptedRegistered());

/**
 * Stage 3 整合測試 — 模擬 UI dispatch 序列觸發的 rift 機制。
 *
 * 對應 UI flow：
 * - 點兵力卡 + 點裂縫位 → PLAY_TROOP_RIFT
 * - 點 S15 → 點手牌兵力 → PLAY_SPELL with riftHandIndex
 * - 點 F08 → PLAY_FIELD（reducer 內部檢查 rift 條件）
 * - 點 S16 → PLAY_SPELL（reducer 內部檢查）
 * - 完整拉鋸戰：跨 50 → 開啟 → 玩家佔據 → 敵方滲透嘗試 → 擊殺 → 重歸 open
 */

function setupBattle(): { state: BattleState; ctx: BattleContext } {
  const state = createBattle({ seed: 42, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
  const ctx = createBattleContext();
  return { state, ctx };
}

/** 強制把 stability 降到指定值並開啟 rift，模擬「跨 50 線」的後果。 */
function forceRiftOpen(state: BattleState, ctx: BattleContext, finalStability = 40): void {
  state.stability = finalStability + 10;
  const delta = finalStability - state.stability;
  const r = applyStabilityDelta(state, delta);
  applyCorruptionStageEffects(state, r.stageJustReached);
  openRiftIfNeeded(state);
}

/** 把 cardId 插入玩家手牌頂端，回傳對應 handIndex。 */
function pushHand(state: BattleState, cardId: string): number {
  state.nextInstanceId++;
  state.player.hand.push({ instanceId: `h_test_${state.nextInstanceId}_${cardId}`, cardId });
  return state.player.hand.length - 1;
}

describe("Stage 3 整合：rift UI flow", () => {
  describe("跨 50 線自動開啟裂縫", () => {
    it("perform stability damage → state.rift 已初始化", () => {
      const { state, ctx } = setupBattle();
      state.stability = 60;
      // 模擬 UI dispatch 一張造穩定度傷害的卡（用既有 F08 嘗試？實際 F08 已重作，改直接呼叫）
      applyStabilityDelta(state, -15); // 60 → 45
      applyCorruptionStageEffects(state, 2);
      openRiftIfNeeded(state);
      expect(state.rift).toBeDefined();
      expect(state.rift?.holder).toBe("open");
      expect(state.rift?.tremorCountdown).toBe(1);
    });
  });

  describe("PLAY_TROOP — 一般兵力欄不受 rift 影響", () => {
    it("rift 開啟時仍可正常 PLAY_TROOP 到兵力欄（不佔據裂縫）", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      const handIdx = pushHand(state, "T01"); // 民兵 1 費
      state.player.manaCurrent = 10;
      // 找空 slot
      const slotIdx = state.player.troopSlots.findIndex((s) => s === null);
      expect(slotIdx).toBeGreaterThanOrEqual(0);
      const r = applyPlayerAction(state, { type: "PLAY_TROOP", handIndex: handIdx, slotIndex: slotIdx }, ctx);
      expect(r.ok).toBe(true);
      expect(state.player.troopSlots[slotIdx]?.cardId).toBe("T01");
      expect(state.rift?.holder).toBe("open"); // 仍 open
    });
  });

  describe("PLAY_TROOP_RIFT — 玩家主動佔據", () => {
    it("rift Open 時可成功佔據，套 ATK×2 DEF+5 加成", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      const handIdx = pushHand(state, "T13"); // 精英禁衛 5 費 22/8/5
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_TROOP_RIFT", handIndex: handIdx }, ctx);
      expect(r.ok).toBe(true);
      expect(state.rift?.holder).toBe("player");
      expect(state.rift?.occupant?.cardId).toBe("T13");
      expect(state.rift?.occupant?.atk).toBe(16); // 8 × 2
      expect(state.rift?.occupant?.def).toBe(5 + RIFT_BUFF_DEF_BONUS); // 5 + 5
    });

    it("rift 非 Open（已被敵方佔據）時 reject", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      // 模擬敵方先滲透
      triggerInfiltration(state, ctx);
      expect(state.rift?.holder).toBe("enemy");
      const handIdx = pushHand(state, "T01");
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_TROOP_RIFT", handIndex: handIdx }, ctx);
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/not open|occupied/);
    });

    it("rift 不存在時 reject", () => {
      const { state, ctx } = setupBattle();
      const handIdx = pushHand(state, "T01");
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_TROOP_RIFT", handIndex: handIdx }, ctx);
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/no rift/);
    });
  });

  describe("S15 裂痕召喚 dispatch flow", () => {
    it("rift Open + 手牌有兵力 → 成功召喚到裂縫位", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      const s15Idx = pushHand(state, "S15");
      const targetIdx = pushHand(state, "T02"); // 傭兵 12/5/2
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_SPELL", handIndex: s15Idx, riftHandIndex: targetIdx }, ctx);
      expect(r.ok).toBe(true);
      expect(state.rift?.holder).toBe("player");
      expect(state.rift?.occupant?.cardId).toBe("T02");
      expect(state.rift?.s15UsesPlayer).toBe(1);
    });

    it("rift 不存在時 reject", () => {
      const { state, ctx } = setupBattle();
      const s15Idx = pushHand(state, "S15");
      const targetIdx = pushHand(state, "T02");
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_SPELL", handIndex: s15Idx, riftHandIndex: targetIdx }, ctx);
      expect(r.ok).toBe(false);
    });

    it("s15UsesPlayer >= 3 時 reject", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      state.rift!.s15UsesPlayer = 3;
      const s15Idx = pushHand(state, "S15");
      const targetIdx = pushHand(state, "T02");
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_SPELL", handIndex: s15Idx, riftHandIndex: targetIdx }, ctx);
      expect(r.ok).toBe(false);
    });
  });

  describe("S16 裂縫共鳴 dispatch flow", () => {
    it("rift 存在時：抽 2 + 鬥志 +20", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      const s16Idx = pushHand(state, "S16");
      // 牌庫塞 2 張供抽
      state.player.deck = [
        { instanceId: "d_t01", cardId: "T01" },
        { instanceId: "d_t02", cardId: "T02" },
        ...state.player.deck,
      ];
      const moraleBefore = state.player.hero.morale;
      const handBefore = state.player.hand.length;
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_SPELL", handIndex: s16Idx }, ctx);
      expect(r.ok).toBe(true);
      expect(state.player.hero.morale).toBe(moraleBefore + 20);
      // handBefore - 1 (S16 自身棄牌) + 2 (抽 2) = handBefore + 1
      expect(state.player.hand.length).toBe(handBefore + 1);
      expect(state.rift?.s16UsedPlayer).toBe(true);
    });

    it("S16 二次施放 reject", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      state.rift!.s16UsedPlayer = true;
      const s16Idx = pushHand(state, "S16");
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_SPELL", handIndex: s16Idx }, ctx);
      expect(r.ok).toBe(false);
    });

    it("無 rift 時 reject", () => {
      const { state, ctx } = setupBattle();
      const s16Idx = pushHand(state, "S16");
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_SPELL", handIndex: s16Idx }, ctx);
      expect(r.ok).toBe(false);
    });
  });

  describe("F08 次元裂縫 dispatch flow", () => {
    it("rift 存在時：enhanced = true", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      const f08Idx = pushHand(state, "F08");
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_FIELD", handIndex: f08Idx }, ctx);
      expect(r.ok).toBe(true);
      expect(state.rift?.enhanced).toBe(true);
    });

    it("rift 不存在時 reject", () => {
      const { state, ctx } = setupBattle();
      const f08Idx = pushHand(state, "F08");
      state.player.manaCurrent = 10;
      const r = applyPlayerAction(state, { type: "PLAY_FIELD", handIndex: f08Idx }, ctx);
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/rift/);
    });
  });

  describe("完整拉鋸戰：跨 50 → 玩家佔據 → 陣亡 → 滲透", () => {
    it("一次完整循環：開啟 → 玩家佔據 → 佔據者陣亡 → 重歸 open", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      expect(state.rift?.holder).toBe("open");

      // 玩家佔據
      const handIdx = pushHand(state, "T02"); // 傭兵 12/5/2
      state.player.manaCurrent = 10;
      applyPlayerAction(state, { type: "PLAY_TROOP_RIFT", handIndex: handIdx }, ctx);
      expect(state.rift?.holder).toBe("player");
      expect(state.rift?.occupant?.cardId).toBe("T02");

      // 模擬佔據者陣亡（直接設 HP=0，再以一個 effect 觸發 reapDeadTroops）
      state.rift!.occupant!.hp = 0;
      // 透過任意 effect 走一次 reapDeadTroops
      reapDeadTroops(state, ctx, "player");

      expect(state.rift?.holder).toBe("open");
      expect(state.rift?.occupant).toBeNull();
      expect(state.rift?.tremorCountdown).toBe(1);
    });

    it("敵方滲透體擊殺給玩家 +10 鬥志（不是 +15）", () => {
      const { state, ctx } = setupBattle();
      forceRiftOpen(state, ctx, 40);
      triggerInfiltration(state, ctx); // 敵方佔據
      expect(state.rift?.holder).toBe("enemy");
      const moraleBefore = state.player.hero.morale;
      state.rift!.occupant!.hp = 0;
      // sourceSide = player（擊殺者）
      reapDeadTroops(state, ctx, "player");
      expect(state.player.hero.morale - moraleBefore).toBe(10);
      expect(state.rift?.holder).toBe("open");
    });
  });
});
