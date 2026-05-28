export interface TurnFlagsState {
  extraActionsThisTurn: number;
  actionDisabledThisTurn: boolean;
  firstAttackDoubleInstanceIds: Set<string>;
  troopCounteredThisTurnInstanceIds: Set<string>;
  actionCardsPlayedThisTurn: number;
  ignoreGuardThisTurn?: boolean;
  deployDiscount?: number;
  nextDeployDiscount?: number;
  nextSpellDouble?: boolean;
  currentSpellDouble?: boolean;
  nextEquipDiscount?: number;
  packTacticsActive?: boolean;
  bloodSacrificeTransferAtk?: boolean;
  reserveFormationActive?: boolean;
}

const TURN_FLAGS = new WeakMap<object, TurnFlagsState>();

export function createTurnFlags(): TurnFlagsState {
  return {
    extraActionsThisTurn: 0,
    actionDisabledThisTurn: false,
    firstAttackDoubleInstanceIds: new Set(),
    troopCounteredThisTurnInstanceIds: new Set(),
    actionCardsPlayedThisTurn: 0,
  };
}

export function getTurnFlags(state: object): TurnFlagsState {
  let flags = TURN_FLAGS.get(state);
  if (!flags) {
    flags = createTurnFlags();
    TURN_FLAGS.set(state, flags);
  }
  return flags;
}

export function resetTurnFlags(state: object): void {
  TURN_FLAGS.set(state, createTurnFlags());
}

export function cloneTurnFlags(from: object, to: object): void {
  const flags = TURN_FLAGS.get(from);
  if (!flags) return;
  TURN_FLAGS.set(to, {
    ...flags,
    firstAttackDoubleInstanceIds: new Set(flags.firstAttackDoubleInstanceIds),
    troopCounteredThisTurnInstanceIds: new Set(flags.troopCounteredThisTurnInstanceIds),
  });
}
