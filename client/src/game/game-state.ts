import type { GameState } from "./types.ts";

export function togglePauseState(state: GameState): GameState {
  if (state === "playing") return "paused";
  if (state === "paused") return "playing";
  return state;
}

export function canRestart(state: GameState): boolean {
  return state === "title" || state === "gameOver";
}

export function canAcceptCombatInput(state: GameState): boolean {
  return state === "playing";
}

export function nextIntermissionState(hasUpgradeChoice: boolean): GameState {
  return hasUpgradeChoice ? "upgradeChoice" : "waveClear";
}
