import assert from "node:assert/strict";
import test from "node:test";
import {
  DAILY_SEED_VERSION,
  buildDailyChallenge,
  dailyFormationForWave,
  dailySeed,
  utcDateKey,
} from "../client/src/game/daily-challenge.ts";

test("a calendar day and seed version produce one complete deterministic challenge", () => {
  const date = new Date("2026-08-01T23:55:00Z");
  const first = buildDailyChallenge(date);
  const second = buildDailyChallenge(new Date("2026-08-01T01:00:00Z"));
  assert.deepEqual(first, second);
  assert.equal(first.seedVersion, DAILY_SEED_VERSION);
  assert.equal(first.sectorOrder.length, 5);
  assert.equal(new Set(first.sectorOrder).size, 5);
  assert.equal(first.formations.length, 25);
  assert.equal(first.events.length, 30);
  assert.equal(first.pickupOffers.length, 5);
  assert.ok(
    first.pickupOffers.every(
      offer => offer.length === 3 && new Set(offer).size === 3
    )
  );
  assert.equal(first.bossOrder.length, 5);
  assert.equal(dailyFormationForWave(first, 6), undefined);
  assert.equal(dailyFormationForWave(first, 1), first.formations[0]);
});

test("UTC date and seed version protect historical Daily content", () => {
  const day = new Date("2026-08-01T22:00:00-02:00");
  assert.equal(utcDateKey(day), "2026-08-02");
  assert.notEqual(dailySeed(day, 1), dailySeed(day, 2));
  assert.notEqual(dailySeed(day), dailySeed(new Date("2026-08-03T00:00:00Z")));
});
