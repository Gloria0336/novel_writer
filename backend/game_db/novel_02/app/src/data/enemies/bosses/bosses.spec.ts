import { describe, expect, it } from "vitest";
import { BOSS_LIST, BOSSES } from "./index";
import { ENEMY_PROFILES } from "../../../core/ai/profiles";
import { RACES } from "../../races";
import { CLASSES } from "../../classes";

describe("§E.1 Boss 數值與註冊", () => {
  const expectedStats: Record<string, { hp: number; atk: number; def: number; cmd: number }> = {
    boss_demon_commander: { hp: 130, atk: 14, def: 7, cmd: 5 },
    boss_nightmare_lord:  { hp:  90, atk: 10, def: 4, cmd: 4 },
    boss_elder_demon:     { hp: 180, atk: 16, def: 5, cmd: 6 },
    boss_infernal_demon:  { hp: 160, atk: 18, def: 6, cmd: 3 },
    boss_fey_rebel_king:  { hp: 100, atk: 13, def: 6, cmd: 5 },
    boss_beast_king:      { hp: 140, atk: 20, def: 4, cmd: 4 },
  };

  for (const boss of BOSS_LIST) {
    it(`${boss.name} 數值符合設計表`, () => {
      const inst = boss.createInstance();
      const want = expectedStats[boss.id]!;
      expect(inst.hp).toBe(want.hp);
      expect(inst.maxHp).toBe(want.hp);
      expect(inst.atk).toBe(want.atk);
      expect(inst.def).toBe(want.def);
      expect(inst.cmd).toBe(want.cmd);
    });

    it(`${boss.name} race / class 已註冊`, () => {
      expect(RACES[boss.heroDef.raceId]).toBeDefined();
      expect(CLASSES[boss.heroDef.classId]).toBeDefined();
    });

    it(`${boss.name} AI profile 存在`, () => {
      expect(ENEMY_PROFILES[boss.profileId]).toBeDefined();
    });
  }

  it("6 位 Boss 全部註冊於 BOSSES", () => {
    expect(Object.keys(BOSSES)).toHaveLength(6);
  });

  it("炎魔 onBattleStart 含 FIELD_BURN_APPLY", () => {
    const inferno = BOSSES.boss_infernal_demon!;
    expect(inferno.onBattleStart?.some((e) => e.kind === "scripted" && e.tag === "FIELD_BURN_APPLY")).toBe(true);
  });
});
