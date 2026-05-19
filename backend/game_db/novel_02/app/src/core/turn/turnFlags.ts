export interface TurnFlagsState {
  extraActionsThisTurn: number;
  actionDisabledThisTurn: boolean;
  firstAttackDoubleInstanceIds: Set<string>;
  actionCardsPlayedThisTurn: number;
  ignoreGuardThisTurn?: boolean;
  deployDiscount?: number;
  nextSpellDouble?: boolean;
  currentSpellDouble?: boolean;
  nextEquipDiscount?: number;
  packTacticsActive?: boolean;
}

const TURN_FLAGS = new WeakMap<object, TurnFlagsState>();

export function createTurnFlags(): TurnFlagsState {
  return {
    extraActionsThisTurn: 0,
    actionDisabledThisTurn: false,
    firstAttackDoubleInstanceIds: new Set(),
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
