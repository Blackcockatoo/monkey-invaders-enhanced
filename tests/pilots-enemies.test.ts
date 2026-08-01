import assert from "node:assert/strict";
import test from "node:test";
import {
  ENEMY_RULES,
  enemyThreat,
  mutationFor,
} from "../client/src/game/enemy-rules.ts";
import {
  PILOT_RULES,
  blastAngles,
  glitchBeat,
  pilotKillMultiplier,
} from "../client/src/game/pilot-rules.ts";
import type { EnemyKind, PilotId } from "../client/src/game/types.ts";

test("the seven existing enemy roles keep unique cues and legal elite mutations", () => {
  const kinds = Object.keys(ENEMY_RULES) as EnemyKind[];
  assert.equal(kinds.length, 7);
  assert.equal(new Set(kinds.map(kind => ENEMY_RULES[kind].telegraph)).size, 7);
  for (const [index, kind] of kinds.entries()) {
    assert.ok(ENEMY_RULES[kind].role.length > 8);
    const mutation = mutationFor(kind, true, index);
    assert.ok(ENEMY_RULES[kind].eliteMutations.includes(mutation));
    assert.ok(enemyThreat(kind, mutation) > enemyThreat(kind));
    assert.equal(mutationFor(kind, false, index), "standard");
  }
});

test("pilots trade strengths without one hidden statistical superior", () => {
  const pilots = Object.keys(PILOT_RULES) as PilotId[];
  for (const pilot of pilots) {
    assert.ok(blastAngles(pilot).length >= 3);
    const a = PILOT_RULES[pilot];
    for (const other of pilots.filter(id => id !== pilot)) {
      const b = PILOT_RULES[other];
      const dominates =
        a.mobility >= b.mobility &&
        a.firepower >= b.firepower &&
        a.control >= b.control &&
        a.risk <= b.risk;
      assert.equal(dominates, false, `${pilot} dominates ${other}`);
    }
  }
  assert.equal(glitchBeat(2.9), "duplicate");
  assert.equal(glitchBeat(5.7), "bend");
  assert.equal(glitchBeat(8.5), "pierce");
});

test("pilot mastery rewards match each advertised risk window", () => {
  const neutral = {
    simultaneous: false,
    closeRange: false,
    glitchUnstable: false,
  };
  assert.equal(pilotKillMultiplier("bolt", neutral), 1);
  assert.ok(
    pilotKillMultiplier("nova", { ...neutral, simultaneous: true }) > 1
  );
  assert.ok(pilotKillMultiplier("rex", { ...neutral, closeRange: true }) > 1);
  assert.ok(
    pilotKillMultiplier("glitch", { ...neutral, glitchUnstable: true }) > 1
  );
  assert.equal(pilotKillMultiplier("nova", neutral), 1);
});
