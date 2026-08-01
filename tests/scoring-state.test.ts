import assert from "node:assert/strict";
import test from "node:test";
import { achievementsFor } from "../client/src/game/achievement-rules.ts";
import {
  canAcceptCombatInput,
  canRestart,
  nextIntermissionState,
  togglePauseState,
} from "../client/src/game/game-state.ts";
import {
  calculateWaveResult,
  comboMultiplier,
  createComboState,
  registerHit,
  registerKill,
  registerMiss,
  registerNearMiss,
  registerShot,
  updateCombo,
} from "../client/src/game/scoring.ts";

test("combo rewards mastery and decays gradually instead of disappearing", () => {
  const combo = createComboState();
  registerShot(combo);
  registerHit(combo);
  registerKill(combo);
  registerKill(combo, true);
  registerNearMiss(combo);
  assert.ok(comboMultiplier(combo) > 1);
  const before = combo.value;
  updateCombo(combo, 3.2);
  updateCombo(combo, 0.5);
  assert.ok(combo.value < before && combo.value > 1);
  registerMiss(combo);
  assert.equal(combo.consecutiveHits, 0);
});

test("wave results expose score sources and five medal objectives", () => {
  const combo = createComboState();
  for (let index = 0; index < 8; index += 1) {
    registerShot(combo);
    registerHit(combo);
    registerKill(combo, index > 3);
  }
  const result = calculateWaveResult({
    baseScore: 2000,
    combo,
    duration: 25,
    targetDuration: 40,
    damageTaken: false,
    blastCharge: 80,
    targetScore: 2200,
    formationObjective: true,
  });
  assert.ok(result.score > result.baseScore);
  assert.deepEqual(result.medals, [
    "clear",
    "noDamage",
    "targetScore",
    "timeTarget",
    "formationObjective",
  ]);
});

test("pause, restart, upgrade and achievement transitions remain explicit", () => {
  assert.equal(togglePauseState("playing"), "paused");
  assert.equal(togglePauseState("paused"), "playing");
  assert.equal(togglePauseState("bossIntro"), "bossIntro");
  assert.equal(canRestart("gameOver"), true);
  assert.equal(canRestart("playing"), false);
  assert.equal(canAcceptCombatInput("playing"), true);
  assert.equal(canAcceptCombatInput("upgradeChoice"), false);
  assert.equal(nextIntermissionState(true), "upgradeChoice");
  assert.deepEqual(
    achievementsFor({
      score: 51000,
      wave: 25,
      mode: "endless",
      waveCleared: true,
      waveDamageTaken: false,
    }),
    [
      "sectorClean",
      "wave10",
      "wave25",
      "noHitWave",
      "richMonkey",
      "endlessLegend",
    ]
  );
});
