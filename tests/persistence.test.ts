import assert from "node:assert/strict";
import test from "node:test";
import {
  migrateProgressV4,
  type StorageLike,
} from "../client/src/game/persistence.ts";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("v3 scores migrate additively into v4 without deleting legacy data", () => {
  const store = new MemoryStorage();
  store.setItem("monkey-invaders-v3-pilot", "nova");
  store.setItem("monkey-invaders-v3-highscore-classic", "12345");
  store.setItem("monkey-invaders-v3-daily-date", "2026-07-31");
  store.setItem("monkey-invaders-v3-daily-score", "777");
  const progress = migrateProgressV4(store);
  assert.equal(progress.version, 4);
  assert.equal(progress.pilotBestScores.nova.classic, 12345);
  assert.equal(progress.dailyRecords["2026-07-31:legacy"], 777);
  assert.equal(store.getItem("monkey-invaders-v3-highscore-classic"), "12345");
});

test("v4 migration sanitizes scores and medal identifiers", () => {
  const store = new MemoryStorage();
  store.setItem(
    "monkey-invaders-v4-progress",
    JSON.stringify({
      version: 4,
      pilotBestScores: {
        bolt: { classic: -5 },
        nova: { endless: 900 },
        rex: {},
        glitch: {},
      },
      waveMedals: { "classic:1": ["clear", "bogus", "noDamage", "clear"] },
      dailyRecords: { "2026-08-01:v2": 1200, broken: -4 },
      dailySeedVersion: 2,
      cameraShake: false,
    })
  );
  const progress = migrateProgressV4(store);
  assert.equal(progress.pilotBestScores.bolt.classic, undefined);
  assert.equal(progress.pilotBestScores.nova.endless, 900);
  assert.deepEqual(progress.waveMedals["classic:1"], ["clear", "noDamage"]);
  assert.equal(progress.dailyRecords.broken, undefined);
  assert.equal(progress.cameraShake, false);
});

test("legacy cabinet score is assigned once and cannot leak to a later pilot", () => {
  const store = new MemoryStorage();
  store.setItem("monkey-invaders-v3-pilot", "bolt");
  store.setItem("monkey-invaders-v3-highscore-classic", "4200");
  const first = migrateProgressV4(store);
  assert.equal(first.pilotBestScores.bolt.classic, 4200);

  store.setItem("monkey-invaders-v3-pilot", "glitch");
  const second = migrateProgressV4(store);
  assert.equal(second.pilotBestScores.bolt.classic, 4200);
  assert.equal(second.pilotBestScores.glitch.classic, undefined);
});
