export type GameAction =
  | { type: "PLAY_TROOP"; handIndex: number; slotIndex: number }
  | { type: "PLAY_SPELL"; handIndex: number; targetInstanceId?: string }
  | { type: "PLAY_ACTION"; handIndex: number; targetInstanceId?: string }
  | { type: "PLAY_EQUIPMENT"; handIndex: number }
  | { type: "PLAY_FIELD"; handIndex: number }
  | { type: "TROOP_ATTACK"; attackerInstanceId: string; targetInstanceId: string }
  | { type: "USE_SKILL"; skillId: string; targetInstanceId?: string }
  | { type: "USE_ULTIMATE"; targetInstanceId?: string }
  | { type: "END_TURN" };
