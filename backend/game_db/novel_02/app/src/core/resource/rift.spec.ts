import { describe, expect, it, beforeEach } from "vitest";
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import {
  openRiftIfNeeded,
  tickRiftTremor,
  triggerInfiltration,
  vacateRiftIfOccupantDead,
  selectInfiltratorPool,
  applyRiftBuff,
  removeRiftBuff,
  tryPlayerOccupy,
  RIFT_BUFF_DEF_BONUS,
  MORALE_KILL_RIFT_INFILTRATOR,
} from "./rift";
import { applyStabilityDelta } from "./stability";
import { getCard } from "../../data/cards";
import { getRace } from "../../data/races";
import { getClass } from "../../data/classes";
import { HEROES } from "../../data/heroes";
import { registerCoreScripted } from "../effects/handlers/scripted";

registerCoreScripted();

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

function mkState(opts: { turn?: number; stability?: number } = {}): BattleState {
  const ph = HEROES["lulu"]!;
  return {
    seed: 1, rngState: 1, nextInstanceId: 100,
    turn: opts.turn ?? 1, activeSide: "player", phase: "main",
    player: {
      hero: { defId: ph.id, hp: 80, maxHp: 80, atk: 6, def: 5, cmd: 9, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 10, manaCap: 10, manaCapAbsolute: 10, tempMana: 0, deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null], spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    enemy: {
      hero: { defId: ph.id, hp: 80, maxHp: 80, atk: 6, def: 0, cmd: 9, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 0, manaCap: 0, manaCapAbsolute: 10, tempMana: 0, deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null], spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    field: null,
    stability: opts.stability ?? 100,
    corruptionStage: 0,
    log: [],
    result: "ongoing",
  };
}

describe("openRiftIfNeeded — 穩定度首次跨 50 線時開啟，不可逆", () => {
  it("stability 49 開啟裂縫（首次跨 50）", () => {
    const s = mkState({ stability: 49 });
    const opened = openRiftIfNeeded(s);
    expect(opened).toBe(true);
    expect(s.rift).toBeDefined();
    expect(s.rift?.holder).toBe("open");
    expect(s.rift?.tremorCountdown).toBe(1);
    expect(s.rift?.enhanced).toBe(false);
  });

  it("stability 51 不觸發", () => {
    const s = mkState({ stability: 51 });
    const opened = openRiftIfNeeded(s);
    expect(opened).toBe(false);
    expect(s.rift).toBeUndefined();
  });

  it("已開啟（不可逆）— 再次呼叫不重複開啟", () => {
    const s = mkState({ stability: 30 });
    openRiftIfNeeded(s);
    const firstRift = s.rift;
    expect(firstRift).toBeDefined();
    // 假設穩定度回升到 80，再呼叫
    s.stability = 80;
    const opened2 = openRiftIfNeeded(s);
    expect(opened2).toBe(false);
    expect(s.rift).toBe(firstRift); // 同一物件實例，不被替換
  });

  it("applyStabilityDelta 整合：跨閾值後手動呼叫 openRiftIfNeeded", () => {
    const s = mkState({ stability: 55 });
    applyStabilityDelta(s, -10); // 55 → 45
    openRiftIfNeeded(s);
    expect(s.rift).toBeDefined();
    expect(s.rift?.holder).toBe("open");
  });
});

describe("tickRiftTremor — 倒數至 0 自動滲透", () => {
  it("holder=open 且 tremorCountdown=1 → tick 後觸發滲透", () => {
    const s = mkState({ turn: 1, stability: 40 });
    openRiftIfNeeded(s);
    expect(s.rift?.tremorCountdown).toBe(1);
    tickRiftTremor(s, ctx);
    // tick 後 → 倒數 0 → 觸發滲透 → 倒數重設為 1
    expect(s.rift?.holder).toBe("enemy");
    expect(s.rift?.occupant).not.toBeNull();
    expect(s.rift?.tremorCountdown).toBe(1);
  });

  it("holder=player 時不 tick（佔據暫停倒數）", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    // 模擬玩家佔據
    s.rift!.holder = "player";
    s.rift!.tremorCountdown = 5;
    tickRiftTremor(s, ctx);
    expect(s.rift?.tremorCountdown).toBe(5); // 不變
  });

  it("holder=enemy 時不 tick", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    s.rift!.holder = "enemy";
    s.rift!.tremorCountdown = 1;
    tickRiftTremor(s, ctx);
    expect(s.rift?.tremorCountdown).toBe(1);
  });

  it("無 rift 時 no-op", () => {
    const s = mkState({ stability: 100 });
    expect(() => tickRiftTremor(s, ctx)).not.toThrow();
    expect(s.rift).toBeUndefined();
  });
});

describe("selectInfiltratorPool — 依回合與 enhanced 分階段", () => {
  it("回合 1–4 選 M01–M02", () => {
    const s = mkState({ turn: 3 });
    s.rift = { holder: "open", occupant: null, tremorCountdown: 1, enhanced: false, infiltrationsByCard: {}, s15UsesPlayer: 0, s16UsedPlayer: false };
    expect(selectInfiltratorPool(s)).toEqual(["M01", "M02"]);
  });

  it("回合 5–8 選 M01–M04", () => {
    const s = mkState({ turn: 6 });
    s.rift = { holder: "open", occupant: null, tremorCountdown: 1, enhanced: false, infiltrationsByCard: {}, s15UsesPlayer: 0, s16UsedPlayer: false };
    expect(selectInfiltratorPool(s)).toEqual(["M01", "M02", "M03", "M04"]);
  });

  it("回合 9+ 選 M01–M06", () => {
    const s = mkState({ turn: 12 });
    s.rift = { holder: "open", occupant: null, tremorCountdown: 1, enhanced: false, infiltrationsByCard: {}, s15UsesPlayer: 0, s16UsedPlayer: false };
    expect(selectInfiltratorPool(s)).toEqual(["M01", "M02", "M03", "M04", "M05", "M06"]);
  });

  it("enhanced 池往上一階：回合 3 + enhanced → M01–M04", () => {
    const s = mkState({ turn: 3 });
    s.rift = { holder: "open", occupant: null, tremorCountdown: 1, enhanced: true, infiltrationsByCard: {}, s15UsesPlayer: 0, s16UsedPlayer: false };
    expect(selectInfiltratorPool(s)).toEqual(["M01", "M02", "M03", "M04"]);
  });

  it("enhanced 在最高階仍是全池（不超出）", () => {
    const s = mkState({ turn: 15 });
    s.rift = { holder: "open", occupant: null, tremorCountdown: 1, enhanced: true, infiltrationsByCard: {}, s15UsesPlayer: 0, s16UsedPlayer: false };
    expect(selectInfiltratorPool(s)).toEqual(["M01", "M02", "M03", "M04", "M05", "M06"]);
  });
});

describe("triggerInfiltration — 滲透體佔據 rift 並標記 fromRift", () => {
  it("回合 1 滲透 M01 或 M02", () => {
    const s = mkState({ turn: 1, stability: 40 });
    openRiftIfNeeded(s);
    triggerInfiltration(s, ctx);
    expect(s.rift?.holder).toBe("enemy");
    expect(s.rift?.occupant).not.toBeNull();
    expect(["M01", "M02"]).toContain(s.rift?.occupant?.cardId);
    expect(s.rift?.occupant?.fromRift).toBe(true);
  });

  it("滲透體進入時自動套用 ATK ×2、DEF +5 加成", () => {
    const s = mkState({ turn: 1, stability: 40 });
    openRiftIfNeeded(s);
    triggerInfiltration(s, ctx);
    const occ = s.rift!.occupant!;
    const card = getCard(occ.cardId);
    if (card.type !== "troop") throw new Error("not troop");
    expect(occ.atk).toBe(card.atk * 2);
    expect(occ.def).toBe(card.def + RIFT_BUFF_DEF_BONUS);
    expect(occ.hp).toBe(card.hp); // HP 不變
  });

  it("infiltrationsByCard 計數 + 同卡上限 2 次", () => {
    const s = mkState({ turn: 1, stability: 40 });
    openRiftIfNeeded(s);
    // 第 1 次
    triggerInfiltration(s, ctx);
    const firstCardId = s.rift!.occupant!.cardId;
    expect(s.rift?.infiltrationsByCard[firstCardId]).toBe(1);
    // 模擬陣亡並重置（強制 holder=open）以再次滲透
    s.rift!.occupant!.hp = 0;
    vacateRiftIfOccupantDead(s);
    triggerInfiltration(s, ctx);
    const secondCardId = s.rift!.occupant!.cardId;
    expect((s.rift!.infiltrationsByCard[firstCardId] ?? 0) + (s.rift!.infiltrationsByCard[secondCardId] ?? 0)).toBeGreaterThanOrEqual(2);
  });
});

describe("vacateRiftIfOccupantDead — 佔據者陣亡重歸 Open + 倒數重設", () => {
  it("佔據者 HP <= 0 觸發 vacate，holder 回 open、occupant=null、倒數重設為 1", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    triggerInfiltration(s, ctx);
    expect(s.rift?.holder).toBe("enemy");
    s.rift!.occupant!.hp = 0;
    const vacated = vacateRiftIfOccupantDead(s);
    expect(vacated).toBe(true);
    expect(s.rift?.holder).toBe("open");
    expect(s.rift?.occupant).toBeNull();
    expect(s.rift?.tremorCountdown).toBe(1);
  });

  it("佔據者仍存活時不 vacate", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    triggerInfiltration(s, ctx);
    const occBefore = s.rift!.occupant;
    const vacated = vacateRiftIfOccupantDead(s);
    expect(vacated).toBe(false);
    expect(s.rift?.occupant).toBe(occBefore);
  });

  it("無 rift 時 no-op", () => {
    const s = mkState();
    expect(vacateRiftIfOccupantDead(s)).toBe(false);
  });
});

describe("applyRiftBuff / removeRiftBuff — modifier 對稱", () => {
  function mkTroop(cardId: string): TroopInstance {
    const c = getCard(cardId);
    if (c.type !== "troop") throw new Error("not troop");
    return {
      instanceId: "test_t1", cardId,
      hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
      keywords: new Set(c.keywords),
      hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0, buffs: [],
    };
  }

  it("applyRiftBuff：ATK ×2、DEF +5、HP 不變", () => {
    const t = mkTroop("T02"); // 12/5/2
    applyRiftBuff(t);
    expect(t.atk).toBe(10); // 5 × 2
    expect(t.def).toBe(7); // 2 + 5
    expect(t.hp).toBe(12);
    expect(t.buffs.find((b) => b.source === "RIFT_BUFF")).toBeDefined();
  });

  it("applyRiftBuff 不重複套用", () => {
    const t = mkTroop("T02");
    applyRiftBuff(t);
    applyRiftBuff(t); // 第二次應 no-op
    expect(t.atk).toBe(10);
    expect(t.def).toBe(7);
    expect(t.buffs.filter((b) => b.source === "RIFT_BUFF")).toHaveLength(1);
  });

  it("removeRiftBuff：還原 stat", () => {
    const t = mkTroop("T02");
    applyRiftBuff(t);
    removeRiftBuff(t);
    expect(t.atk).toBe(5);
    expect(t.def).toBe(2);
    expect(t.buffs.find((b) => b.source === "RIFT_BUFF")).toBeUndefined();
  });
});

describe("tryPlayerOccupy — 玩家佔據成功與 buff", () => {
  it("Open 時可佔據 → holder=player + buff 生效", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    const c = getCard("T02");
    if (c.type !== "troop") throw new Error("not troop");
    const inst: TroopInstance = {
      instanceId: "t99", cardId: "T02",
      hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
      keywords: new Set(c.keywords),
      hasAttackedThisTurn: false, summonedThisTurn: true, frozenTurns: 0, buffs: [],
    };
    const ok = tryPlayerOccupy(s, inst);
    expect(ok).toBe(true);
    expect(s.rift?.holder).toBe("player");
    expect(s.rift?.occupant).toBe(inst);
    expect(inst.atk).toBe(10); // 5 × 2
    expect(inst.def).toBe(7); // 2 + 5
  });

  it("非 Open 時 reject", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    triggerInfiltration(s, ctx); // → enemy 佔據
    const c = getCard("T02");
    if (c.type !== "troop") throw new Error("not troop");
    const inst: TroopInstance = {
      instanceId: "t99", cardId: "T02",
      hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
      keywords: new Set(c.keywords),
      hasAttackedThisTurn: false, summonedThisTurn: true, frozenTurns: 0, buffs: [],
    };
    const ok = tryPlayerOccupy(s, inst);
    expect(ok).toBe(false);
  });
});

describe("MORALE_KILL_RIFT_INFILTRATOR 常數正確", () => {
  it("擊殺滲透體 = +10 鬥志（一般擊殺是 +15）", () => {
    expect(MORALE_KILL_RIFT_INFILTRATOR).toBe(10);
  });
});
