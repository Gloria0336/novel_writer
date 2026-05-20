import { registerScripted, type EffectContext } from "../registry";
import { aliveTroops, freeSlotIndex, getSide, otherSide } from "../../selectors/battle";
import { applyTroopDamage } from "../../combat/damage";
import { rngPick } from "../../deck/prng";
import { createTroopInstance } from "../../turn/factories";
import type { BattleState, TroopInstance } from "../../types/battle";
import type { Card, DeviceForm } from "../../types/card";
import type { Side } from "../../types/effect";
import type { BattleContext } from "../../types/context";
import type { Keyword } from "../../types/keyword";

/**
 * 魔導器具系統 scripted handlers — Stage 4
 *
 * 包含：
 *  - DEVICE_REPAIR_SELF      ：onTurnStart 自我回滿 HP
 *  - DEVICE_REPAIR_ALL       ：回滿全體己方器具 HP
 *  - DEVICE_REBUILD          ：從 destroyedDevices 取 1 張，重新部署到空欄位
 *  - DEVICE_UPGRADE_STATS    ：對 source instance 套用升級（永久 +HP/+ATK/+DEF）
 *  - DEVICE_SELF_UPGRADE     ：T_m_06 共鳴增幅器專用 — 對自身執行一次升級
 *  - DEVICE_FORM_TOGGLE      ：切換待機 ↔ 啟動，套用 stat / keyword 差值
 *  - AUTO_TURRET_FIRE        ：T_m_03 砲台射擊（從 raceCards 搬遷集中於 devices）
 *  - SANCTION_MECHANISM_STRIKE：T_m_05 制裁機關啟動形態時對單體傷害 + 暈眩
 */
export function registerDeviceScripted(): void {
  // ── 修復系列 ─────────────────────────────────────────────────────────────
  registerScripted("DEVICE_REPAIR_SELF", (_p, ec) => {
    const id = ec.sourceInstanceId;
    if (!id) return;
    const me = getSide(ec.state, ec.sourceSide);
    const troop = me.troopSlots.find((t) => t && t.instanceId === id);
    if (!troop) return;
    const before = troop.hp;
    troop.hp = troop.maxHp;
    if (troop.hp > before) {
      ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "DEVICE_REPAIR", text: `${troop.cardId} 自我修復至滿 HP（${before} → ${troop.hp}）` });
    }
  });

  registerScripted("DEVICE_REPAIR_ALL", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    let count = 0;
    for (const t of aliveTroops(me)) {
      if (t.isDevice !== true) continue;
      if (t.hp < t.maxHp) {
        t.hp = t.maxHp;
        count++;
      }
    }
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "DEVICE_REPAIR", text: `修復 ${count} 個器具至滿 HP` });
  });

  registerScripted("DEVICE_REBUILD", (_p, ec) => {
    const me = getSide(ec.state, ec.sourceSide);
    if (!me.destroyedDevices || me.destroyedDevices.length === 0) {
      ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "DEVICE_REBUILD_NOOP", text: "無已摧毀器具可復活" });
      return;
    }
    const slotIdx = freeSlotIndex(me);
    if (slotIdx < 0) {
      ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "DEVICE_REBUILD_NOOP", text: "兵力欄位已滿，無法復活器具" });
      return;
    }
    const reborn = me.destroyedDevices.shift();
    if (!reborn) return;
    const card = ec.ctx.getCard(reborn.cardId);
    if (card.type !== "device") return;
    const inst = createTroopInstance(ec.state, card);
    me.troopSlots[slotIdx] = inst;
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "DEVICE_REBUILD", text: `從殘骸復活：${card.name}`, payload: { cardId: card.id, instanceId: inst.instanceId, slotIndex: slotIdx } });
  });

  // ── 升級系列 ─────────────────────────────────────────────────────────────
  registerScripted("DEVICE_UPGRADE_STATS", (payload, ec) => {
    const targetInstanceId = (payload as { instanceId?: string } | undefined)?.instanceId ?? ec.sourceInstanceId;
    if (!targetInstanceId) return;
    upgradeDeviceInstance(ec, targetInstanceId);
  });

  registerScripted("DEVICE_SELF_UPGRADE", (_p, ec) => {
    const id = ec.sourceInstanceId;
    if (!id) return;
    upgradeDeviceInstance(ec, id);
  });

  // ── 型態切換 ────────────────────────────────────────────────────────────
  registerScripted("DEVICE_FORM_TOGGLE", (payload, ec) => {
    const targetInstanceId = (payload as { instanceId?: string } | undefined)?.instanceId ?? ec.sourceInstanceId;
    if (!targetInstanceId) return;
    toggleDeviceForm(ec.state, ec.ctx, ec.sourceSide, targetInstanceId);
  });

  // ── T_m_03 魔導砲台 onTurnStart 攻擊 ────────────────────────────────────────
  registerScripted("AUTO_TURRET_FIRE", (_p, ec) => {
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const targets = aliveTroops(enemy);
    if (targets.length === 0) return;
    const top = [...targets].sort((a, b) => b.atk - a.atk)[0]!;
    applyTroopDamage(top, 8);
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "TURRET_FIRE", text: `魔導砲台射擊 ${top.cardId} 8 傷害`, payload: { instanceId: top.instanceId } });
  });

  // ── T_m_05 制裁機關：啟動形態時對單體攻擊並暈眩 1 回合 ────────────────────
  registerScripted("SANCTION_MECHANISM_STRIKE", (_p, ec) => {
    const id = ec.sourceInstanceId;
    if (!id) return;
    const me = getSide(ec.state, ec.sourceSide);
    const self = me.troopSlots.find((t) => t && t.instanceId === id);
    if (!self || self.deviceForm !== "active") return; // 僅啟動形態觸發
    const enemy = getSide(ec.state, otherSide(ec.sourceSide));
    const targets = aliveTroops(enemy);
    if (targets.length === 0) return;
    const pick = rngPick(ec.state.rngState, targets);
    ec.state.rngState = pick.state;
    const top = pick.value;
    applyTroopDamage(top, self.atk);
    top.frozenTurns = Math.max(top.frozenTurns, 1);
    top.frozenDisplayName = "暈眩";
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "SANCTION_STRIKE", text: `制裁機關擊中 ${top.cardId}，造成 ${self.atk} 傷害並暈眩 1 回合` });
  });
}

function upgradeDeviceInstance(ec: EffectContext, instanceId: string): void {
  const me = getSide(ec.state, ec.sourceSide);
  const troop = me.troopSlots.find((t) => t && t.instanceId === instanceId);
  if (!troop || troop.isDevice !== true) return;

  const card = safeGetCard(ec.ctx, troop.cardId);
  if (!card || card.type !== "device" || !card.upgradeable) return;

  const flags = me.hero.flags;
  flags.deviceUpgrades ??= {};
  const upgrades = flags.deviceUpgrades as Record<string, number>;
  const current = upgrades[instanceId] ?? 0;

  if (current >= card.upgradeable.maxLevel) {
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "DEVICE_UPGRADE_MAX", text: `${troop.cardId} 已達升級封頂 ${card.upgradeable.maxLevel} 層` });
    return;
  }

  const perLevel = card.upgradeable.perLevel;
  const nextLevel = current + 1;
  if (perLevel.atk) troop.atk += perLevel.atk;
  if (perLevel.def) troop.def += perLevel.def;
  if (perLevel.hp) {
    troop.maxHp += perLevel.hp;
    troop.hp = Math.min(troop.maxHp, troop.hp + perLevel.hp);
  }
  troop.buffs.push({
    id: `upgrade_${ec.state.nextInstanceId++}`,
    source: `UPGRADE_LV${nextLevel}`,
    mod: { atk: perLevel.atk ?? 0, def: perLevel.def ?? 0, hp: perLevel.hp ?? 0 },
    remainingTurns: Number.MAX_SAFE_INTEGER,
  });
  upgrades[instanceId] = nextLevel;
  troop.upgradeLevel = nextLevel;
  ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "DEVICE_UPGRADE", text: `${troop.cardId} 升級至 LV${nextLevel}（+${perLevel.atk ?? 0}/+${perLevel.def ?? 0}${perLevel.hp ? `/+${perLevel.hp}HP` : ""}）` });
}

function toggleDeviceForm(state: BattleState, ctx: BattleContext, side: Side, instanceId: string): void {
  const me = getSide(state, side);
  const troop = me.troopSlots.find((t) => t && t.instanceId === instanceId);
  if (!troop || troop.isDevice !== true) return;
  const card = safeGetCard(ctx, troop.cardId);
  if (!card || card.type !== "device" || !card.form) return;

  const currentName: "idle" | "active" = troop.deviceForm ?? "idle";
  const nextName: "idle" | "active" = currentName === "idle" ? "active" : "idle";
  const current = card.form[currentName];
  const next = card.form[nextName];

  applyFormDelta(troop, current, next);
  troop.deviceForm = nextName;
  state.log.push({ turn: state.turn, side, kind: "DEVICE_FORM_TOGGLE", text: `${card.name} 切換為${nextName === "active" ? "啟動" : "待機"}形態` });
}

function applyFormDelta(troop: TroopInstance, from: DeviceForm, to: DeviceForm): void {
  troop.atk += to.atk - from.atk;
  troop.def += to.def - from.def;
  if (from.hp !== undefined || to.hp !== undefined) {
    const fromHp = from.hp ?? 0;
    const toHp = to.hp ?? 0;
    troop.maxHp += toHp - fromHp;
    if (troop.maxHp < 1) troop.maxHp = 1;
    troop.hp = Math.min(troop.maxHp, Math.max(0, troop.hp + (toHp - fromHp)));
  }
  const fromKw = new Set<Keyword>(from.keywords ?? []);
  const toKw = new Set<Keyword>(to.keywords ?? []);
  for (const kw of fromKw) {
    if (!toKw.has(kw)) troop.keywords.delete(kw);
  }
  for (const kw of toKw) {
    if (!fromKw.has(kw)) troop.keywords.add(kw);
  }
}

function safeGetCard(ctx: BattleContext, id: string): Card | null {
  try {
    return ctx.getCard(id);
  } catch {
    return null;
  }
}
