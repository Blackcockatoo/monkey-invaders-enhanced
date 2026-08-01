import assert from "node:assert/strict";
import test from "node:test";
import {
  BOSS_PATTERNS,
  bossHazardPlan,
  bossPattern,
  bossPhaseFromHealth,
  bossPose,
  bossVolley,
} from "../client/src/game/boss-patterns.ts";

test("all thirteen bosses have complete signature contracts", () => {
  const bosses = Object.values(BOSS_PATTERNS);
  assert.equal(bosses.length, 13);
  assert.equal(new Set(bosses.map(item => item.movement)).size, 13);
  assert.equal(new Set(bosses.map(item => item.projectile)).size, 13);
  for (const boss of bosses) {
    assert.ok(boss.hazard && boss.phaseTwo && boss.enrage);
    assert.ok(boss.opening && boss.scoringChallenge && boss.defeat);
    assert.equal(bossPattern(boss.name), boss);
  }
});

test("bosses transition through three phases and every attack keeps a gap", () => {
  assert.equal(bossPhaseFromHealth(100, 100), 0);
  assert.equal(bossPhaseFromHealth(66, 100), 1);
  assert.equal(bossPhaseFromHealth(33, 100), 2);
  for (const name of Object.keys(BOSS_PATTERNS)) {
    for (const phase of [0, 1, 2] as const) {
      const pose = bossPose(name, phase, 3.1);
      assert.ok(Number.isFinite(pose.x) && pose.x >= 0 && pose.x <= 1, name);
      assert.ok(Number.isFinite(pose.y) && pose.y >= 0 && pose.y <= 1, name);
      const volley = bossVolley(name, phase, 2);
      assert.ok(volley.angles.length > 0 && volley.angles.length <= 6, name);
      const hazard = bossHazardPlan(name, phase, 2);
      assert.ok(hazard.safeGap >= 0.1 && hazard.safeGap <= 0.9, name);
      assert.ok(
        hazard.lanes.every(
          lane => Math.abs(lane - hazard.safeGap) >= hazard.width
        ),
        name
      );
    }
  }
});
