export type OathChoice = "restore" | "strengthen" | "purify";

/** 鍛造師「改造/製造」職業動作的兩種模式。 */
export type ForgeMode = "equipment" | "device";

export type GameAction =
  | { type: "PLAY_TROOP"; handIndex: number; slotIndex: number }
  | { type: "PLAY_TROOP_RIFT"; handIndex: number }
  | { type: "PLAY_SPELL"; handIndex: number; targetInstanceId?: string; oathChoice?: OathChoice; riftHandIndex?: number }
  | { type: "PLAY_ACTION"; handIndex: number; targetInstanceId?: string }
  | { type: "PLAY_EQUIPMENT"; handIndex: number }
  | { type: "PLAY_FIELD"; handIndex: number }
  | { type: "TROOP_ATTACK"; attackerInstanceId: string; targetInstanceId: string }
  | { type: "USE_SKILL"; skillId: string; targetInstanceId?: string }
  | { type: "USE_ULTIMATE"; targetInstanceId?: string }
  | { type: "FORGE_ACTION"; mode: ForgeMode; handIndex?: number }
  | { type: "END_TURN" };
