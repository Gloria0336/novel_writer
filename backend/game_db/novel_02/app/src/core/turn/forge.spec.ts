import { beforeAll, describe, expect, it } from "vitest";
import { createBattle, createBattleContext, ensureScriptedRegistered } from "../../game/seed";
import { applyAction } from "./reducer";
import { ELDR_THORIN_DECK_IDS } from "../../data/decks/starter";
import { LULU_DECK_IDS } from "../../data/decks/starter";
import { getCard } from "../../data/cards";

beforeAll(() => ensureScriptedRegistered());

describe("Stage 3 — 鍛造師 FORGE_ACTION", () => {
  it("非鍛造師發動 FORGE_ACTION 失敗（露露為指揮官，class=commander）", () => {
    const s = createBattle({ seed: 31, playerHeroId: "lulu", playerDeckIds: LULU_DECK_IDS });
    const ctx = createBattleContext();
    s.player.manaCurrent = 3;
    const r = applyAction(s, { type: "FORGE_ACTION", mode: "device" }, ctx);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("forge");
  });

  it("艾德圖林 FORGE_ACTION mode=device：消耗 1 魔力，手牌新增 T_m_01–T_m_07 任一張", () => {
    const s = createBattle({ seed: 32, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();
    s.player.manaCurrent = 5;
    const handBefore = s.player.hand.length;
    const manaBefore = s.player.manaCurrent;

    const r = applyAction(s, { type: "FORGE_ACTION", mode: "device" }, ctx);
    expect(r.ok).toBe(true);
    expect(s.player.manaCurrent).toBe(manaBefore - 1);
    expect(s.player.hand.length).toBe(handBefore + 1);
    const newCard = s.player.hand[s.player.hand.length - 1]!;
    expect(["T_m_01", "T_m_02", "T_m_03", "T_m_04", "T_m_05", "T_m_06", "T_m_07"]).toContain(newCard.cardId);
    expect(s.player.hero.flags.forgeUsedThisTurn).toBe(true);
  });

  it("FORGE_ACTION mode=equipment：棄手牌頂張，新增 E_c_01–E_c_08 任一張", () => {
    const s = createBattle({ seed: 33, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();
    s.player.manaCurrent = 5;
    expect(s.player.hand.length).toBeGreaterThan(0);
    const handBefore = s.player.hand.length;
    const graveBefore = s.player.graveyard.length;

    const r = applyAction(s, { type: "FORGE_ACTION", mode: "equipment", handIndex: 0 }, ctx);
    expect(r.ok).toBe(true);
    expect(s.player.graveyard.length).toBe(graveBefore + 1);
    expect(s.player.hand.length).toBe(handBefore); // 棄 1、加 1
    const newCard = s.player.hand[s.player.hand.length - 1]!;
    expect(getCard(newCard.cardId).type).toBe("equipment");
  });

  it("每回合限額：發動 1 次後，第 2 次失敗（共享 forgeUsedThisTurn）", () => {
    const s = createBattle({ seed: 34, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();
    s.player.manaCurrent = 5;
    const r1 = applyAction(s, { type: "FORGE_ACTION", mode: "device" }, ctx);
    expect(r1.ok).toBe(true);
    const r2 = applyAction(s, { type: "FORGE_ACTION", mode: "device" }, ctx);
    expect(r2.ok).toBe(false);
    expect(r2.reason).toContain("already");
  });

  it("艾德圖林觸發後爐火 +15（onForge gauge bonus）", () => {
    const s = createBattle({ seed: 35, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();
    s.player.manaCurrent = 5;
    const gaugeBefore = s.player.hero.gaugeValue;
    applyAction(s, { type: "FORGE_ACTION", mode: "device" }, ctx);
    // +15 來自 onForge；可能因為 syncGaugeScalingBuffs 而觸發其他變化，但 gaugeValue 一定有增 15
    expect(s.player.hero.gaugeValue).toBe(gaugeBefore + 15);
  });
});
