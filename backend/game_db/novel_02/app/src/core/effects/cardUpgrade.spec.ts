import { describe, expect, it } from "vitest";
import type { BattleState, SideState } from "../types/battle";
import type { BattleContext } from "../types/context";
import { getCard } from "../../data/cards";
import { getRace } from "../../data/races";
import { getClass } from "../../data/classes";
import { HEROES } from "../../data/heroes";
import { createHeroInstance, createTroopInstance } from "../turn/factories";
import { applyAction } from "../turn/reducer";
import { canTroopAttack } from "../combat/attack";
import { getTurnFlags } from "../turn/turnFlags";
import { registerCoreScripted } from "./handlers/scripted";
import { registerHeroScripted } from "./handlers/heroes";
import { registerRaceCardScripted } from "./handlers/raceCards";
import { registerDeviceScripted } from "./handlers/devices";
import { executeEffects } from "./registry";
import { applyTroopDamageWithPassives } from "./battlePassives";

registerCoreScripted();
registerHeroScripted();
registerRaceCardScripted();
registerDeviceScripted();

const ctx: BattleContext = {
  getCard,
  getHero: (id) => {
    const h = HEROES[id];
    if (!h) throw new Error(`unknown hero: ${id}`);
    return h;
  },
  getRace: (id) => getRace(id as Parameters<typeof getRace>[0]),
  getClass: (id) => getClass(id as Parameters<typeof getClass>[0]),
};

function side(heroId: string): SideState {
  const heroDef = HEROES[heroId]!;
  return {
    hero: createHeroInstance(heroDef, ctx),
    manaCurrent: 10,
    manaCap: 10,
    manaCapAbsolute: 10,
    tempMana: 0,
    deck: [],
    hand: [],
    graveyard: [],
    troopSlots: [null, null, null, null, null],
    spellsCastThisTurn: 0,
    spellsCastThisGame: 0,
    destroyedDevices: [],
  };
}

function state(playerHeroId: string): BattleState {
  return {
    seed: 1,
    rngState: 1,
    nextInstanceId: 100,
    turn: 1,
    activeSide: "player",
    phase: "main",
    player: side(playerHeroId),
    enemy: side("lulu"),
    field: { player: null, enemy: null },
    omen: null,
    stability: 100,
    corruptionStage: 0,
    log: [],
    result: "ongoing",
  };
}

function troop(state: BattleState, cardId: string) {
  const card = getCard(cardId);
  if (card.type !== "troop" && card.type !== "device") throw new Error("not a board unit");
  return createTroopInstance(state, card, { suppressSummonSickness: true });
}

describe("v3.4 M 卡牌升級包", () => {
  it("A_f_09 讓幻影嘲諷，敵方必須優先攻擊幻影", () => {
    const s = state("butterfly-yao");
    s.player.hand = [{ instanceId: "af09", cardId: "A_f_09" }];
    s.player.troopSlots[0] = troop(s, "T_s_31");
    s.player.troopSlots[1] = troop(s, "T_c_01");
    s.enemy.troopSlots[0] = troop(s, "T_c_02");

    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0 }, ctx)).toMatchObject({ ok: true });

    const attacker = s.enemy.troopSlots[0]!;
    expect(canTroopAttack(s, "enemy", attacker, s.player.troopSlots[1]!)).toMatchObject({ ok: false });
    expect(canTroopAttack(s, "enemy", attacker, s.player.troopSlots[0]!)).toMatchObject({ ok: true });
  });

  it("A_h_05 將一般兵力推進到第六格並騰出原欄位", () => {
    const s = state("lulu");
    s.player.hand = [
      { instanceId: "ah05", cardId: "A_h_05" },
      { instanceId: "tc01", cardId: "T_c_01" },
    ];
    for (let i = 0; i < 5; i++) s.player.troopSlots[i] = troop(s, "T_c_01");
    const targetId = s.player.troopSlots[0]!.instanceId;

    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0, targetInstanceId: targetId }, ctx)).toMatchObject({ ok: true });

    expect(s.player.frontlineSlot?.instanceId).toBe(targetId);
    expect(s.player.troopSlots[0]).toBeNull();
    expect(s.player.frontlineSlot?.statusBuffs?.some((buff) => buff.status === "taunt")).toBe(true);
    expect(applyAction(s, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 0 }, ctx)).toMatchObject({ ok: true });
  });

  it("A_h_05 requires an explicit own troop target before spending the card", () => {
    const s = state("lulu");
    s.player.hand = [{ instanceId: "ah05", cardId: "A_h_05" }];
    s.player.troopSlots[0] = troop(s, "T_c_01");

    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0 }, ctx)).toMatchObject({
      ok: false,
      reason: "frontline advance requires target",
    });
    expect(s.player.hand[0]?.cardId).toBe("A_h_05");
    expect(s.player.frontlineSlot).toBeUndefined();
  });

  it("鍛造師 A_o_01/A_o_02 可部署並拆解鋼鐵構裝體", () => {
    const s = state("eldr-thorin");
    s.player.hand = [
      { instanceId: "ao01", cardId: "A_o_01" },
      { instanceId: "ao02", cardId: "A_o_02" },
    ];

    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0 }, ctx)).toMatchObject({ ok: true });
    const construct = s.player.troopSlots[0]!;
    expect(construct.cardId).toBe("T_s_41");
    expect(construct.isConstruct).toBe(true);

    getTurnFlags(s).extraActionsThisTurn = 1;
    const manaBefore = s.player.manaCurrent + s.player.tempMana;
    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0, targetInstanceId: construct.instanceId }, ctx)).toMatchObject({ ok: true });
    expect(s.player.troopSlots[0]).toBeNull();
    expect(s.player.manaCurrent + s.player.tempMana).toBeGreaterThanOrEqual(manaBefore);
  });

  it("A_o_02 沒有己方鋼鐵構裝體時不會扣費或棄牌", () => {
    const s = state("eldr-thorin");
    s.player.hand = [{ instanceId: "ao02", cardId: "A_o_02" }];
    const manaBefore = s.player.manaCurrent + s.player.tempMana;

    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0 }, ctx)).toMatchObject({
      ok: false,
      reason: "emergency disassemble requires construct",
    });
    expect(s.player.hand[0]?.cardId).toBe("A_o_02");
    expect(s.player.manaCurrent + s.player.tempMana).toBe(manaBefore);
  });

  it("A_o_03 沒有己方鋼鐵構裝體或手牌魔導時不會浪費卡牌", () => {
    const s = state("eldr-thorin");
    s.player.hand = [{ instanceId: "ao03", cardId: "A_o_03" }];
    const manaBefore = s.player.manaCurrent + s.player.tempMana;

    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0 }, ctx)).toMatchObject({
      ok: false,
      reason: "construct upgrade requires construct",
    });
    expect(s.player.hand[0]?.cardId).toBe("A_o_03");
    expect(s.player.manaCurrent + s.player.tempMana).toBe(manaBefore);

    s.player.troopSlots[0] = troop(s, "T_s_41");
    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0 }, ctx)).toMatchObject({
      ok: false,
      reason: "construct upgrade requires device in hand",
    });
    expect(s.player.hand[0]?.cardId).toBe("A_o_03");
    expect(s.player.manaCurrent + s.player.tempMana).toBe(manaBefore);
  });

  it("獸族滿格可血祭部署，A_b_03 轉移祭品 ATK", () => {
    const s = state("reka");
    s.player.hand = [
      { instanceId: "ab03", cardId: "A_b_03" },
      { instanceId: "tb03", cardId: "T_b_03" },
    ];
    for (let i = 0; i < 5; i++) s.player.troopSlots[i] = troop(s, "T_b_01");
    const sacrificeAtk = s.player.troopSlots[0]!.atk;

    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0 }, ctx)).toMatchObject({ ok: true });
    expect(applyAction(s, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 0 }, ctx)).toMatchObject({ ok: true });

    const deployed = s.player.troopSlots[0]!;
    expect(deployed.cardId).toBe("T_b_03");
    expect(deployed.atk).toBe(10 + 5 + sacrificeAtk);
    expect(deployed.maxHp).toBe(28 + 5);
    expect(s.player.graveyard.some((card) => card.cardId === "T_b_01")).toBe(true);
  });

  it("S_de_08 永恆契約會讓連結雙方分擔兵力傷害", () => {
    const s = state("lulu");
    s.enemy.troopSlots[0] = troop(s, "T_de_02");
    s.player.troopSlots[0] = troop(s, "T_c_02");

    executeEffects([{ kind: "scripted", tag: "DM_ETERNAL_CONTRACT" }], {
      state: s,
      ctx,
      sourceSide: "enemy",
      sourceKind: "spell",
      sourceCardId: "S_de_08",
    });

    const playerTroop = s.player.troopSlots[0]!;
    const enemyTroop = s.enemy.troopSlots[0]!;
    const enemyHpBefore = enemyTroop.hp;
    applyTroopDamageWithPassives(s, ctx, "player", playerTroop, 10, { sourceKind: "spell" });

    expect(enemyTroop.hp).toBeLessThan(enemyHpBefore);
    expect(s.log.some((entry) => entry.kind === "ETERNAL_CONTRACT_SHARE")).toBe(true);
  });
});
