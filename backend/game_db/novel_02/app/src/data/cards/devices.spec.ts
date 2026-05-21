import { beforeAll, describe, expect, it } from "vitest";
import { createBattle, createBattleContext, ensureScriptedRegistered } from "../../game/seed";
import { createTroopInstance } from "../../core/turn/factories";
import { applyAction } from "../../core/turn/reducer";
import { startTurnFor } from "../../core/turn/phases";
import { executeEffects } from "../../core/effects/registry";
import { triggerReactionsBySide } from "../../core/effects/reactions";
import { ELDR_THORIN_DECK_IDS } from "../decks/starter";
import { getCard } from "./index";
import { DEVICES } from "./devices";
import type { DeviceCard } from "../../core/types/card";

beforeAll(() => ensureScriptedRegistered());

describe("魔導器具系統 — Stage 1~6 機制驗證", () => {
  it("T_m_01–T_m_07 全部為 device 型別，且設置 occupiesTroopSlot=true", () => {
    expect(DEVICES.length).toBe(7);
    for (const d of DEVICES) {
      expect(d.type).toBe("device");
      expect(d.occupiesTroopSlot).toBe(true);
    }
  });

  it("T_m_01–T_m_07 都可透過 PLAY_TROOP 放進兵力欄", () => {
    const ctx = createBattleContext();
    for (const device of DEVICES) {
      const s = createBattle({ seed: 120, playerHeroId: "eldr-thorin", playerDeckIds: [] });
      s.player.manaCurrent = 10;
      s.player.hand = [{ instanceId: `hand_${device.id}`, cardId: device.id }];

      expect(applyAction(s, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 0 }, ctx)).toMatchObject({ ok: true });
      expect(s.player.troopSlots[0]?.cardId).toBe(device.id);
      expect(s.player.troopSlots[0]?.isDevice).toBe(true);
      expect(s.player.hand).toHaveLength(0);
    }
  });

  it("T_m_03 onTurnStart 自動射擊敵方最強兵力 8 傷害（修復 onTurnEnd 失效 bug）", () => {
    const s = createBattle({ seed: 21, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();
    // 部署 T_m_03 到我方欄位 0
    const k03 = getCard("T_m_03");
    if (k03.type !== "device") throw new Error("T_m_03 should be device");
    const inst = createTroopInstance(s, k03);
    s.player.troopSlots[0] = inst;
    // 敵方放 1 個目標
    const t02 = getCard("T_c_02");
    if (t02.type !== "troop") throw new Error();
    const enemy = createTroopInstance(s, t02);
    s.enemy.troopSlots[0] = enemy;
    const hpBefore = enemy.hp;
    // 強制觸發我方回合開始 hook
    startTurnFor(s, "player", ctx);
    expect(enemy.hp).toBeLessThan(hpBefore);
  });

  it("T_m_04 攻城弩砲：idle form 預設為 guard/高 DEF，DEVICE_FORM_TOGGLE 切換到啟動高 ATK siege", () => {
    const s = createBattle({ seed: 22, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const k04 = getCard("T_m_04") as DeviceCard;
    const inst = createTroopInstance(s, k04);
    s.player.troopSlots[0] = inst;

    expect(inst.deviceForm).toBe("idle");
    expect(inst.def).toBe(12);
    expect(inst.atk).toBe(6);
    expect(inst.keywords.has("guard")).toBe(true);
    expect(inst.keywords.has("siege")).toBe(false);

    const ctx = createBattleContext();
    executeEffects(
      [{ kind: "scripted", tag: "DEVICE_FORM_TOGGLE", payload: { instanceId: inst.instanceId } }],
      { state: s, ctx, sourceSide: "player", sourceKind: "skill", sourceInstanceId: inst.instanceId, sourceCardId: inst.cardId },
    );
    expect(inst.deviceForm).toBe("active");
    expect(inst.atk).toBe(14);
    expect(inst.def).toBe(6);
    expect(inst.keywords.has("guard")).toBe(false);
    expect(inst.keywords.has("siege")).toBe(true);
  });

  it("T_m_06 共鳴增幅器 onTurnStart 自我升級 +1/+1，封頂 5 層", () => {
    const s = createBattle({ seed: 23, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();
    const k06 = getCard("T_m_06") as DeviceCard;
    const inst = createTroopInstance(s, k06);
    s.player.troopSlots[0] = inst;
    const atk0 = inst.atk, def0 = inst.def;

    for (let i = 0; i < 6; i++) {
      startTurnFor(s, "player", ctx);
    }
    // 5 層封頂：atk += 5, def += 5
    expect(inst.atk).toBe(atk0 + 5);
    expect(inst.def).toBe(def0 + 5);
    expect(inst.upgradeLevel).toBe(5);
  });

  it("T_m_02 構裝哨兵：onReaction(enemyHeroAttacked) 觸發後敵方兵力被暈眩 1 回合", () => {
    const s = createBattle({ seed: 24, playerHeroId: "eldr-thorin", playerDeckIds: ELDR_THORIN_DECK_IDS });
    const ctx = createBattleContext();
    const k02 = getCard("T_m_02") as DeviceCard;
    const inst = createTroopInstance(s, k02);
    s.player.troopSlots[0] = inst;

    // 部署敵方兵力（reaction 會把所有敵方兵力暈眩）
    const t02 = getCard("T_c_02");
    if (t02.type !== "troop") throw new Error();
    const attacker = createTroopInstance(s, t02, { suppressSummonSickness: true });
    s.enemy.troopSlots[0] = attacker;

    // 模擬「敵方攻擊我方英雄」事件 — actorSide = "enemy"
    triggerReactionsBySide(s, ctx, "enemyHeroAttacked", "enemy");

    expect(attacker.frozenTurns).toBeGreaterThanOrEqual(1);
    expect(attacker.frozenDisplayName).toBe("暈眩");
  });
});
