import { beforeEach, describe, expect, it } from "vitest";
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import { executeEffects, registerScripted } from "./registry";
import { ALL_CARDS, GENERIC_CARDS, getCard } from "../../data/cards";
import { getRace } from "../../data/races";
import { getClass } from "../../data/classes";
import { HEROES } from "../../data/heroes";
import { registerCoreScripted } from "./handlers/scripted";
import { registerRaceCardScripted } from "./handlers/raceCards";
import { endTurnFor, startTurnFor } from "../turn/phases";
import { applyAction } from "../turn/reducer";

registerCoreScripted();
registerRaceCardScripted();

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

function mkTroop(cardId: string, instanceId = `t_${Math.random()}`): TroopInstance {
  const c = getCard(cardId);
  if (c.type !== "troop") throw new Error("not troop");
  return {
    instanceId, cardId, hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
    keywords: new Set(c.keywords), hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0, buffs: [],
  };
}

function mkState(playerHeroId = "lulu", enemyHeroId = "lulu"): BattleState {
  const ph = HEROES[playerHeroId]!;
  const eh = HEROES[enemyHeroId]!;
  return {
    seed: 1, rngState: 1, nextInstanceId: 100, turn: 1, activeSide: "player", phase: "main",
    player: {
      hero: { defId: ph.id, hp: 80, maxHp: 80, atk: 6, def: 5, cmd: 9, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 10, manaCap: 10, manaCapAbsolute: 10, tempMana: 0, deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null], spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    enemy: {
      hero: { defId: eh.id, hp: 80, maxHp: 80, atk: 6, def: 0, cmd: 9, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 0, manaCap: 0, manaCapAbsolute: 10, tempMana: 0, deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null], spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    field: { player: null, enemy: null }, omen: null, stability: 100, corruptionStage: 0, log: [], result: "ongoing",
  };
}

describe("通用卡資料完整性", () => {
  it("通用卡共 104 張（v4：魔導器具獨立為 device type，新增 T_m_05/T_m_06/T_m_07）", () => {
    expect(GENERIC_CARDS).toHaveLength(109);
  });
  it("通用卡分類正確：14 兵力 + 10 行動 + 17 法術 + 48 裝備 + 8 場地 + 7 魔導器具（v4）", () => {
    const byType = GENERIC_CARDS.reduce<Record<string, number>>((acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1;
      return acc;
    }, {});
    expect(byType.troop).toBe(14);
    expect(byType.action).toBe(10);
    expect(byType.spell).toBe(22);
    expect(byType.equipment).toBe(48);
    expect(byType.field).toBe(8);
    expect(byType.device).toBe(7);
  });
  it("總卡池 = 通用 104 + 升級後種族 68 + 職業 6 + 中立傳說 6 = 184 張（v3.4 M）", () => {
    expect(ALL_CARDS).toHaveLength(193);
  });
  it("每張卡 id 唯一", () => {
    const ids = ALL_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("new generic and elf spells are indexed", () => {
    for (const id of ["S_c_18", "S_c_19", "S_c_20", "S_c_21", "S_c_22", "S_e_08", "S_e_09", "S_e_10", "S_e_11"]) {
      expect(getCard(id).type).toBe("spell");
    }
  });
});

describe("unit status effects", () => {
  it("addStatus can apply and expire a troop status", () => {
    const s = mkState();
    s.player.troopSlots[0] = mkTroop("T_c_01", "ally1");

    executeEffects([{
      kind: "addStatus",
      target: { kind: "single", filter: { side: "player", entity: "troop" }, pickedInstanceId: "ally1" },
      status: "taunt",
      duration: { kind: "thisTurn" },
    }], { state: s, ctx, sourceSide: "player", sourceKind: "skill", sourceCardId: "test" });

    expect(s.player.troopSlots[0]?.statusBuffs?.[0]).toMatchObject({ status: "taunt", remainingTurns: 1 });

    endTurnFor(s, "player", ctx);

    expect(s.player.troopSlots[0]?.statusBuffs).toHaveLength(0);
  });

  it("untargetable blocks single-target enemy damage but not all-target damage", () => {
    const s = mkState();
    s.player.troopSlots[0] = mkTroop("T_c_01", "ally1");
    s.player.troopSlots[0]!.statusBuffs = [{ id: "s1", source: "test", status: "untargetable", remainingTurns: 1 }];

    executeEffects([{ kind: "damage", target: { kind: "single", filter: { side: "player", entity: "troop" }, pickedInstanceId: "ally1" }, amount: { kind: "const", value: 5 } }], {
      state: s, ctx, sourceSide: "enemy", sourceKind: "spell", sourceCardId: "test",
    });
    expect(s.player.troopSlots[0]?.hp).toBe(8);

    executeEffects([{ kind: "damage", target: { kind: "all", filter: { side: "player", entity: "troop" } }, amount: { kind: "const", value: 5 } }], {
      state: s, ctx, sourceSide: "enemy", sourceKind: "spell", sourceCardId: "test",
    });
    expect(s.player.troopSlots[0]?.hp).toBe(4);
  });
});

describe("elf spell-cast troop passives", () => {
  it("T_e_02 gains HP and max HP when its side casts a spell", () => {
    const s = mkState();
    s.player.hand = [{ instanceId: "spell1", cardId: "S_c_01" }];
    s.player.troopSlots[0] = mkTroop("T_e_02", "stellar_guard");
    s.player.troopSlots[1] = mkTroop("T_e_01", "spell_blade");

    expect(applyAction(s, { type: "PLAY_SPELL", handIndex: 0 }, ctx)).toMatchObject({ ok: true });

    expect(s.player.troopSlots[0]?.hp).toBe(17);
    expect(s.player.troopSlots[0]?.maxHp).toBe(17);
    expect(s.player.troopSlots[1]?.atk).toBe(7);
  });
});

describe("S_c_07 烈焰風暴 — 對所有敵兵造 10 傷害", () => {
  it("3 個敵兵各受 10 傷", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T_c_01"); // 8/3/1
    s.enemy.troopSlots[1] = mkTroop("T_c_02"); // 12/5/2
    s.enemy.troopSlots[2] = mkTroop("T_c_03"); // 10/2/5

    executeEffects(getCard("S_c_07").type === "spell" ? (getCard("S_c_07") as { effects: import("../types/effect").Effect[] }).effects : [], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_07",
    });

    // T_c_01: 10 - DEF 1 = 9 傷 → hp 8 - 9 = 0（死）
    expect(s.enemy.troopSlots[0]).toBeNull();
    // T_c_02: 10 - 2 = 8 → 12 - 8 = 4
    expect(s.enemy.troopSlots[1]?.hp).toBe(4);
    // T_c_03: 10 - 5 = 5 → 10 - 5 = 5
    expect(s.enemy.troopSlots[2]?.hp).toBe(5);
  });
});

describe("T_c_06 傳令兵 入場曲：抽 1 張", () => {
  it("入場曲時手牌增加 1 張", () => {
    const s = mkState();
    // 牌庫塞 2 張
    s.player.deck = [{ instanceId: "d1", cardId: "T_c_01" }, { instanceId: "d2", cardId: "T_c_02" }];
    const card = getCard("T_c_06");
    if (card.type !== "troop") throw new Error("expect troop");
    executeEffects(card.onPlay ?? [], { state: s, ctx, sourceSide: "player", sourceKind: "troop_play", sourceCardId: "T_c_06" });
    expect(s.player.hand).toHaveLength(1);
  });
});

describe("T_c_11 戰地牧師 入場曲：恢復英雄 8 HP", () => {
  it("英雄 HP +8（不超過 max）", () => {
    const s = mkState();
    s.player.hero.hp = 50;
    const card = getCard("T_c_11");
    if (card.type !== "troop") throw new Error("expect troop");
    executeEffects(card.onPlay ?? [], { state: s, ctx, sourceSide: "player", sourceKind: "troop_play", sourceCardId: "T_c_11" });
    expect(s.player.hero.hp).toBe(58);
  });
});

describe("S_c_03 治癒之風", () => {
  it("治療我方場上全體兵力 5 HP，不治療英雄或敵方兵力", () => {
    const s = mkState();
    s.player.hero.hp = 50;
    s.player.hero.maxHp = 100;
    s.player.troopSlots[0] = mkTroop("T_c_01", "ally1");
    s.player.troopSlots[1] = mkTroop("T_c_02", "ally2");
    s.enemy.troopSlots[0] = mkTroop("T_c_01", "enemy1");
    s.player.troopSlots[0]!.hp = 2;
    s.player.troopSlots[1]!.hp = 9;
    s.enemy.troopSlots[0]!.hp = 2;
    const c = getCard("S_c_03");
    if (c.type !== "spell") throw new Error("expect spell");
    executeEffects(c.effects, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_03" });
    expect(s.player.troopSlots[0]?.hp).toBe(7);
    expect(s.player.troopSlots[1]?.hp).toBe(12);
    expect(s.enemy.troopSlots[0]?.hp).toBe(2);
    expect(s.player.hero.hp).toBe(50);
  });
});

describe("守護優先制 — S_c_07 群體不受守護限制（ignoreGuard 在卡定義由群體效果繞過）", () => {
  it("烈焰風暴透過 all target，不受守護優先制阻擋", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T_c_03"); // 守護
    s.enemy.troopSlots[1] = mkTroop("T_c_01"); // 普通
    const c = getCard("S_c_07");
    if (c.type !== "spell") throw new Error("expect spell");
    executeEffects(c.effects, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_07" });
    expect(s.enemy.troopSlots[0]?.hp ?? 0).toBe(5);
    expect(s.enemy.troopSlots[1]).toBeNull();
  });
});

describe("new spell cards", () => {
  it("S_c_19 劇毒之霧 damages and weakens all enemy troops", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T_c_02", "enemy1");
    s.enemy.troopSlots[1] = mkTroop("T_c_03", "enemy2");
    const c = getCard("S_c_19");
    if (c.type !== "spell") throw new Error("expect spell");

    executeEffects(c.effects, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_19" });

    expect(s.enemy.troopSlots[0]?.hp).toBe(8);
    expect(s.enemy.troopSlots[0]?.atk).toBe(3);
    expect(s.enemy.troopSlots[0]?.def).toBe(0);
    expect(s.enemy.troopSlots[0]?.buffs[0]).toMatchObject({ source: "S_c_19", mod: { atk: -2, def: -2 }, remainingTurns: 2 });
    expect(s.enemy.troopSlots[1]?.hp).toBe(6);
    expect(s.enemy.troopSlots[1]?.atk).toBe(0);
    expect(s.enemy.troopSlots[1]?.def).toBe(3);
  });

  it("S_e_08 漫天星光 resolves six random fixed-damage hits", () => {
    const s = mkState("elno-honorary-mage");
    s.rngState = 246689;
    s.enemy.troopSlots[0] = mkTroop("T_c_02", "enemy1");
    s.enemy.troopSlots[1] = mkTroop("T_c_03", "enemy2");
    const beforeTotal = s.enemy.hero.hp + s.enemy.troopSlots[0]!.hp + s.enemy.troopSlots[1]!.hp;
    const c = getCard("S_e_08");
    if (c.type !== "spell") throw new Error("expect spell");

    executeEffects(c.effects, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_e_08" });

    const afterTotal = s.enemy.hero.hp + s.enemy.troopSlots[0]!.hp + s.enemy.troopSlots[1]!.hp;
    expect(beforeTotal - afterTotal).toBe(18);
    expect(s.rngState).not.toBe(246689);
    expect(s.log.some((entry) => entry.kind === "ELF_STARRY_SKY" && entry.payload && (entry.payload as { hits?: number }).hits === 6)).toBe(true);
  });

  it("elf resonance still makes a full-resonance spell free and resets gauge", () => {
    const s = mkState("elno-honorary-mage");
    s.player.hero.gaugeValue = 4;
    s.player.manaCurrent = 0;
    s.player.hand = [{ instanceId: "stars", cardId: "S_e_08" }];

    expect(applyAction(s, { type: "PLAY_SPELL", handIndex: 0 }, ctx)).toMatchObject({ ok: true });

    expect(s.player.hero.gaugeValue).toBe(1);
    expect(s.player.manaCurrent).toBe(0);
    expect(s.player.spellsCastThisGame).toBe(1);
  });
});

describe("S_c_12 毀滅射線 — 30 固定傷害（無視 DEF）", () => {
  it("敵方英雄 -30 HP（即使 DEF 5）", () => {
    const s = mkState();
    s.enemy.hero.def = 5;
    const c = getCard("S_c_12");
    if (c.type !== "spell") throw new Error("expect spell");
    const eff = c.effects.map((e) => ({ ...(e as object), target: { kind: "enemyHero" as const } })) as import("../types/effect").Effect[];
    executeEffects(eff, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_12" });
    expect(s.enemy.hero.hp).toBe(50);
  });
});

describe("S_c_08 次元修補 — 穩定度 +15", () => {
  it("穩定度從 80 變 95（封頂 100）", () => {
    const s = mkState();
    s.stability = 80;
    s.corruptionStage = 0;
    const c = getCard("S_c_08");
    if (c.type !== "spell") throw new Error("expect spell");
    executeEffects(c.effects, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_08" });
    expect(s.stability).toBe(95);
  });
});

describe("S_c_14 盟約之誓 — 三選一", () => {
  it("全面恢復：英雄 +30 HP，全兵力 +10 HP", () => {
    const s = mkState();
    s.player.hero.hp = 40;
    s.player.troopSlots[0] = mkTroop("T_c_02");
    s.player.troopSlots[0]!.hp = 3;
    executeEffects([{ kind: "scripted", tag: "OATH_CHOICE", payload: { choice: "restore" } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_14",
    });
    expect(s.player.hero.hp).toBe(70);
    expect(s.player.troopSlots[0]?.hp).toBe(12);
  });

  it("全面強化：全兵力 +5 ATK 並記錄 3 回合 buff", () => {
    const s = mkState();
    s.player.troopSlots[0] = mkTroop("T_c_01");
    executeEffects([{ kind: "scripted", tag: "OATH_CHOICE", payload: { choice: "strengthen" } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_14",
    });
    expect(s.player.troopSlots[0]?.atk).toBe(8);
    expect(s.player.troopSlots[0]?.buffs[0]).toMatchObject({ source: "S_c_14", mod: { atk: 5 }, remainingTurns: 3 });
  });

  it("全面淨化：移除負面 buff 與凍結，並免疫本回合後續負面狀態", () => {
    const s = mkState();
    const troop = mkTroop("T_c_02");
    troop.atk -= 4;
    troop.frozenTurns = 2;
    troop.buffs.push({ id: "debuff", source: "test", mod: { atk: -4 }, remainingTurns: 2 });
    s.player.troopSlots[0] = troop;

    executeEffects([{ kind: "scripted", tag: "OATH_CHOICE", payload: { choice: "purify" } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_14",
    });
    expect(s.player.troopSlots[0]?.atk).toBe(5);
    expect(s.player.troopSlots[0]?.frozenTurns).toBe(0);
    expect(s.player.troopSlots[0]?.buffs).toHaveLength(0);

    executeEffects([{ kind: "freeze", target: { kind: "single", filter: { side: "player", entity: "troop" }, pickedInstanceId: troop.instanceId }, turns: 2 }], {
      state: s, ctx, sourceSide: "enemy", sourceKind: "spell", sourceCardId: "S_c_06",
    });
    expect(s.player.troopSlots[0]?.frozenTurns).toBe(0);
  });
});

describe("T_c_14 傳奇傭兵團 — 入場召喚 2 個傭兵", () => {
  it("召喚 2 個 T_c_02 到場上", () => {
    const s = mkState();
    const c = getCard("T_c_14");
    if (c.type !== "troop") throw new Error("expect troop");
    executeEffects(c.onPlay ?? [], { state: s, ctx, sourceSide: "player", sourceKind: "troop_play", sourceCardId: "T_c_14" });
    const summoned = s.player.troopSlots.filter((t) => t !== null);
    expect(summoned).toHaveLength(2);
    expect(summoned.every((t) => t!.cardId === "T_c_02")).toBe(true);
  });

  it("summon does not spill into the opposite side when source side is full", () => {
    const s = mkState();
    for (let i = 0; i < s.player.troopSlots.length; i++) {
      s.player.troopSlots[i] = mkTroop("T_c_01", `ally${i}`);
    }

    executeEffects([{ kind: "summon", cardId: "T_c_02", count: 1, side: "self" }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "test",
    });

    expect(s.player.troopSlots.every((t) => t?.cardId === "T_c_01")).toBe(true);
    expect(s.enemy.troopSlots.every((t) => t === null)).toBe(true);
  });
});

describe("S_c_06 冰封術 — 凍結敵兵 2 回合", () => {
  it("frozenTurns = 2", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T_c_01");
    const c = getCard("S_c_06");
    if (c.type !== "spell") throw new Error("expect spell");
    const eff = c.effects.map((e) => ({ ...(e as object), target: { kind: "single" as const, filter: { entity: "troop", side: "enemy" }, pickedInstanceId: s.enemy.troopSlots[0]!.instanceId } })) as import("../types/effect").Effect[];
    executeEffects(eff, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_c_06" });
    expect(s.enemy.troopSlots[0]?.frozenTurns).toBe(2);
  });
});

describe("限時 buff / 關鍵字到期", () => {
  it("thisTurn stat buff 到回合結束會回復數值", () => {
    const s = mkState();
    s.player.troopSlots[0] = mkTroop("T_c_01"); // 8 HP / 3 ATK / 1 DEF

    executeEffects([{
      kind: "buff",
      target: { kind: "single", filter: { side: "player", entity: "troop" }, pickedInstanceId: s.player.troopSlots[0]!.instanceId },
      mod: { atk: 5, def: 2, hp: 4 },
      duration: { kind: "thisTurn" },
    }], { state: s, ctx, sourceSide: "player", sourceKind: "skill", sourceCardId: "test" });

    expect(s.player.troopSlots[0]?.atk).toBe(8);
    expect(s.player.troopSlots[0]?.def).toBe(3);
    expect(s.player.troopSlots[0]?.hp).toBe(12);
    expect(s.player.troopSlots[0]?.maxHp).toBe(12);

    endTurnFor(s, "player", ctx);

    expect(s.player.troopSlots[0]?.atk).toBe(3);
    expect(s.player.troopSlots[0]?.def).toBe(1);
    expect(s.player.troopSlots[0]?.hp).toBe(8);
    expect(s.player.troopSlots[0]?.maxHp).toBe(8);
    expect(s.player.troopSlots[0]?.buffs).toHaveLength(0);
  });

  it("thisTurn addKeyword 到回合結束會移除", () => {
    const s = mkState();
    s.player.troopSlots[0] = mkTroop("T_c_01");

    executeEffects([{
      kind: "addKeyword",
      target: { kind: "single", filter: { side: "player", entity: "troop" }, pickedInstanceId: s.player.troopSlots[0]!.instanceId },
      keyword: "guard",
      duration: { kind: "thisTurn" },
    }], { state: s, ctx, sourceSide: "player", sourceKind: "skill", sourceCardId: "test" });

    expect(s.player.troopSlots[0]?.keywords.has("guard")).toBe(true);

    endTurnFor(s, "player", ctx);

    expect(s.player.troopSlots[0]?.keywords.has("guard")).toBe(false);
    expect(s.player.troopSlots[0]?.keywordBuffs).toHaveLength(0);
  });

  it("臨時 addKeyword 到期不會移除卡牌原生關鍵字", () => {
    const s = mkState();
    s.player.troopSlots[0] = mkTroop("T_c_03"); // 原生 guard

    executeEffects([{
      kind: "addKeyword",
      target: { kind: "single", filter: { side: "player", entity: "troop" }, pickedInstanceId: s.player.troopSlots[0]!.instanceId },
      keyword: "guard",
      duration: { kind: "thisTurn" },
    }], { state: s, ctx, sourceSide: "player", sourceKind: "skill", sourceCardId: "test" });

    endTurnFor(s, "player", ctx);

    expect(s.player.troopSlots[0]?.keywords.has("guard")).toBe(true);
    expect(s.player.troopSlots[0]?.keywordBuffs).toHaveLength(0);
  });
});

describe("英雄能力凍結", () => {
  it("freezeHeroAbility 可凍結行動牌、法術牌、兵力牌並在回合結束解除", () => {
    const s = mkState();
    s.player.hand = [
      { instanceId: "a1", cardId: "A_c_04" },
      { instanceId: "s1", cardId: "S_c_01" },
      { instanceId: "t1", cardId: "T_c_01" },
    ];

    executeEffects([{
      kind: "freezeHeroAbility",
      side: "self",
      modes: ["action", "spell", "troop"],
      turns: 1,
    }], { state: s, ctx, sourceSide: "player", sourceKind: "skill", sourceCardId: "test" });

    expect(applyAction(s, { type: "PLAY_ACTION", handIndex: 0 }, ctx)).toMatchObject({ ok: false, reason: "action cards frozen" });
    expect(applyAction(s, { type: "PLAY_SPELL", handIndex: 1 }, ctx)).toMatchObject({ ok: false, reason: "spell cards frozen" });
    expect(applyAction(s, { type: "PLAY_TROOP", handIndex: 2, slotIndex: 0 }, ctx)).toMatchObject({ ok: false, reason: "troop cards frozen" });

    endTurnFor(s, "player", ctx);

    expect(s.player.hero.flags.heroAbilityFreeze).toBeUndefined();
    expect(applyAction(s, { type: "PLAY_SPELL", handIndex: 1 }, ctx)).toMatchObject({ ok: true });
  });

  it("凍結魔力回復時，回合開始不刷新魔力", () => {
    const s = mkState();
    s.turn = 5;
    s.player.manaCap = 2;
    s.player.manaCurrent = 1;
    s.player.tempMana = 3;

    executeEffects([{
      kind: "freezeHeroAbility",
      side: "self",
      modes: ["manaRegen"],
      turns: 1,
    }], { state: s, ctx, sourceSide: "player", sourceKind: "skill", sourceCardId: "test" });

    startTurnFor(s, "player", ctx);

    expect(s.player.manaCap).toBe(2);
    expect(s.player.manaCurrent).toBe(1);
    expect(s.player.tempMana).toBe(0);
    expect(s.log.some((l) => l.kind === "MANA_REGEN_FROZEN")).toBe(true);
  });
});

describe("鬥志累積規則", () => {
  it("行動命中 +10 鬥志", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T_c_01");
    s.player.hero.morale = 0;
    // 模擬行動造傷
    executeEffects([{ kind: "damage", target: { kind: "single", filter: {}, pickedInstanceId: s.enemy.troopSlots[0]!.instanceId }, amount: { kind: "const", value: 5 } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "action", sourceCardId: "test",
    });
    expect(s.player.hero.morale).toBeGreaterThanOrEqual(10);
  });

  it("擊殺敵兵 +15 鬥志", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T_c_01"); // hp 8
    s.player.hero.morale = 0;
    executeEffects([{ kind: "damage", target: { kind: "single", filter: {}, pickedInstanceId: s.enemy.troopSlots[0]!.instanceId }, amount: { kind: "const", value: 100 } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "test",
    });
    // 法術不算「行動」，但擊殺仍給 +15
    expect(s.player.hero.morale).toBeGreaterThanOrEqual(15);
  });
});

describe("scripted passive integrations", () => {
  it("DOUBLE_NEXT_SPELL doubles the next spell effect", () => {
    const s = mkState();
    s.player.hand = [
      { instanceId: "mark", cardId: "S_e_03" },
      { instanceId: "ray", cardId: "S_c_12" },
    ];

    expect(applyAction(s, { type: "PLAY_SPELL", handIndex: 0 }, ctx)).toMatchObject({ ok: true });
    expect(applyAction(s, { type: "PLAY_SPELL", handIndex: 0, targetInstanceId: "H_enemy" }, ctx)).toMatchObject({ ok: true });

    expect(s.enemy.hero.hp).toBe(20);
  });

  it("FIRST_ATTACK_DOUBLE is consumed by the first attack", () => {
    const s = mkState();
    s.player.hand = [{ instanceId: "cav", cardId: "T_c_09" }];

    expect(applyAction(s, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 0 }, ctx)).toMatchObject({ ok: true });
    expect(applyAction(s, { type: "TROOP_ATTACK", attackerInstanceId: s.player.troopSlots[0]!.instanceId, targetInstanceId: "H_enemy" }, ctx)).toMatchObject({ ok: true });

    expect(s.enemy.hero.hp).toBe(66);
  });

  it("ABSORB_HALF_HERO_ACTION_DAMAGE redirects half of action hero damage", () => {
    const s = mkState();
    s.player.troopSlots[0] = mkTroop("T_c_13", "elite_guard");

    executeEffects([{ kind: "damage", target: { kind: "playerHero" }, amount: { kind: "const", value: 20 }, ignoreDef: true }], {
      state: s, ctx, sourceSide: "enemy", sourceKind: "action", sourceCardId: "test",
    });

    expect(s.player.hero.hp).toBe(70);
    expect(s.player.troopSlots[0]?.hp).toBe(12);
  });

  it("equipment passives trigger on deploy and damage threshold", () => {
    const s = mkState();
    s.player.hero.equipment.trinket = "E_c_06";
    s.player.hero.equipment.armor = "E_c_05";
    s.player.hero.def = 10;
    s.player.hand = [{ instanceId: "soldier", cardId: "T_c_01" }];

    expect(applyAction(s, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 0 }, ctx)).toMatchObject({ ok: true });
    expect(s.player.hero.morale).toBe(5);

    executeEffects([{ kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "const", value: 9 }, ignoreDef: true }], {
      state: s, ctx, sourceSide: "enemy", sourceKind: "spell", sourceCardId: "test",
    });
    expect(s.player.hero.hp).toBe(80);
  });

  it("field burn 只燒槽位方並跳過 flame-immune 惡魔", () => {
    const s = mkState();
    // F_c_05 改為「燒槽位方自己」的自損型場地（v3.4 重構）。
    s.field.player = { cardId: "F_c_05" };
    s.player.troopSlots[0] = mkTroop("T_de_05", "flame_guard");
    s.player.troopSlots[1] = mkTroop("T_c_01", "ally_soldier");
    s.enemy.troopSlots[0] = mkTroop("T_c_01", "enemy_soldier");

    startTurnFor(s, "player", ctx);

    // 火免疫不受傷
    expect(s.player.troopSlots[0]?.hp).toBe(22);
    // 同方一般兵力受 3 火傷（9→6）
    expect(s.player.troopSlots[1]?.hp).toBe(6);
    // 對方槽位無 F_c_05，不受影響（T_c_01 base hp 8）
    expect(s.enemy.troopSlots[0]?.hp).toBe(8);
  });

  it("dynamic troop aura updates when allies enter", () => {
    const s = mkState();
    s.player.hand = [
      { instanceId: "commander", cardId: "T_h_04" },
      { instanceId: "soldier", cardId: "T_c_01" },
    ];

    expect(applyAction(s, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 0 }, ctx)).toMatchObject({ ok: true });
    expect(s.player.troopSlots[0]?.atk).toBe(7);
    expect(applyAction(s, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 1 }, ctx)).toMatchObject({ ok: true });

    expect(s.player.troopSlots[0]?.atk).toBe(8);
  });

  it("demon scripted effects are registered and apply corruption spread", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T_c_02", "enemy_big");
    const card = getCard("S_de_05");
    if (card.type !== "spell") throw new Error("expect spell");

    executeEffects(card.effects, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S_de_05" });

    expect(s.log.some((entry) => entry.kind === "SCRIPTED_MISSING")).toBe(false);
    expect(s.enemy.troopSlots[0]?.atk).toBe(3);
    expect(s.enemy.troopSlots[0]?.def).toBe(0);
    expect(s.player.hero.gaugeValue).toBe(15);
  });
});
