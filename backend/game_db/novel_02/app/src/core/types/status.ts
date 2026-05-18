export type UnitStatus =
  | "taunt"
  | "marked"
  | "untargetable"
  | "invincible";

export interface ActiveStatusBuff {
  id: string;
  source: string;
  status: UnitStatus;
  remainingTurns: number;
}

export const UNIT_STATUS_LABEL: Record<UnitStatus, string> = {
  taunt: "嘲諷",
  marked: "針對",
  untargetable: "不可選中",
  invincible: "無敵",
};
