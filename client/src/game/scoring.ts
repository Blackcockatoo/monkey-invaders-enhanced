import type { WaveMedal, WaveResult } from "./types.ts";

export type ComboState = {
  value: number;
  largest: number;
  timer: number;
  consecutiveHits: number;
  kills: number;
  multiKills: number;
  nearMisses: number;
  shots: number;
  hits: number;
};

export const createComboState = (): ComboState => ({
  value: 1,
  largest: 1,
  timer: 0,
  consecutiveHits: 0,
  kills: 0,
  multiKills: 0,
  nearMisses: 0,
  shots: 0,
  hits: 0,
});

export function registerShot(state: ComboState) {
  state.shots += 1;
}

export function registerHit(state: ComboState) {
  state.hits += 1;
  state.consecutiveHits += 1;
  state.timer = Math.max(state.timer, 2.1);
}

export function registerMiss(state: ComboState) {
  state.consecutiveHits = 0;
  state.timer = Math.min(state.timer, 0.8);
}

export function registerKill(state: ComboState, simultaneous = false) {
  state.kills += 1;
  if (simultaneous) state.multiKills += 1;
  state.value = Math.min(12, state.value + (simultaneous ? 1 : 0.45));
  state.largest = Math.max(state.largest, state.value);
  state.timer = 3;
}

export function registerNearMiss(state: ComboState) {
  state.nearMisses += 1;
  state.value = Math.min(12, state.value + 0.18);
  state.largest = Math.max(state.largest, state.value);
  state.timer = Math.max(state.timer, 1.2);
}

export function updateCombo(state: ComboState, dt: number, steady = false) {
  const protectedTime = state.timer;
  state.timer = Math.max(0, state.timer - dt);
  const decayTime = Math.max(0, dt - protectedTime);
  if (decayTime <= 0) return;
  const decay = steady ? 0.32 : 0.62;
  state.value = Math.max(1, state.value - decay * decayTime);
}

export function comboMultiplier(state: ComboState): number {
  return Math.round((1 + (state.value - 1) * 0.12) * 100) / 100;
}

export function calculateWaveResult(options: {
  baseScore: number;
  combo: ComboState;
  duration: number;
  targetDuration: number;
  damageTaken: boolean;
  blastCharge: number;
  targetScore: number;
  formationObjective: boolean;
}): WaveResult {
  const accuracy =
    options.combo.shots === 0 ? 0 : options.combo.hits / options.combo.shots;
  const comboBonus = Math.round(
    options.baseScore * Math.max(0, comboMultiplier(options.combo) - 1)
  );
  const timeBonus = Math.max(
    0,
    Math.round((options.targetDuration - options.duration) * 35)
  );
  const blastBonus = Math.min(500, Math.round(options.blastCharge * 4));
  const score = options.baseScore + comboBonus + timeBonus + blastBonus;
  const medals: WaveMedal[] = ["clear"];
  if (!options.damageTaken) medals.push("noDamage");
  if (score >= options.targetScore) medals.push("targetScore");
  if (options.duration <= options.targetDuration) medals.push("timeTarget");
  if (options.formationObjective) medals.push("formationObjective");
  return {
    score,
    baseScore: options.baseScore,
    comboBonus,
    timeBonus,
    blastBonus,
    medals,
    largestCombo: options.combo.largest,
    accuracy,
    duration: options.duration,
  };
}
