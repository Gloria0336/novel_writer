import type { EnemyProfile } from "../types";

/**
 * 蠻血酋長 Boss 化（魔族 beast / 狂戰士 berserker）。
 * 對應 §7.1 範本：beast 種族（rage 量表）× 「狂血型」變體。
 * 量表政策：>= 0.8 才開大（血怒堆滿才覺醒）；主動技 cost.morale 不受 saveUntilThreshold 影響。
 */
export const BOSS_BLOOD_CHIEF_PROFILE: EnemyProfile = {
  id: "boss_blood_chief",
  kind: "boss",
  personality: {
    aggression: 0.95,
    calculation: 0.4,
    greed: 0.7,
    cunning: 0.2,
    resilience: 0.2,
    recklessness: 0.7,
  },
  raceBias: {
    heroPressure: 0.5,
    gaugeBuildup: 0.3,
    selfSurvival: -0.5, // 不太愛保命
  },
  gaugePolicy: {
    saveUntilThreshold: 0.5,
    spendOnUltimateAt: 0.8,
  },
};
