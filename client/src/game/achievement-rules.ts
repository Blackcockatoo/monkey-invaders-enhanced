import type { AchievementId, GameMode } from "./types.ts";

export type AchievementSnapshot = {
  score: number;
  wave: number;
  mode: GameMode;
  bossDefeated?: boolean;
  waveCleared?: boolean;
  waveDamageTaken?: boolean;
  bossRushComplete?: boolean;
  dailyComplete?: boolean;
};

export function achievementsFor(
  snapshot: AchievementSnapshot
): AchievementId[] {
  const result: AchievementId[] = [];
  if (snapshot.waveCleared) result.push("sectorClean");
  if (snapshot.bossDefeated) result.push("bossSlayer");
  if (snapshot.wave >= 10) result.push("wave10");
  if (snapshot.wave >= 25) result.push("wave25");
  if (snapshot.waveCleared && !snapshot.waveDamageTaken)
    result.push("noHitWave");
  if (snapshot.score >= 25000) result.push("richMonkey");
  if (snapshot.mode === "endless" && snapshot.score >= 50000)
    result.push("endlessLegend");
  if (snapshot.bossRushComplete) result.push("bossRushChampion");
  if (snapshot.dailyComplete) result.push("dailyChallenger");
  return result;
}
