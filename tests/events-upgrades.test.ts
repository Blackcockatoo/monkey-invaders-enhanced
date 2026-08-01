import assert from "node:assert/strict";
import test from "node:test";
import { PICKUP_META, RANDOM_EVENT_META } from "../client/src/game/content.ts";
import { pickupDuration, shieldHits } from "../client/src/game/pickup-rules.ts";
import {
  RANDOM_EVENT_RULES,
  eventCompatible,
} from "../client/src/game/random-events.ts";
import {
  RUN_UPGRADES,
  offerRunUpgrades,
} from "../client/src/game/run-upgrades.ts";
import type {
  PickupKind,
  RandomEventId,
  RunUpgradeId,
} from "../client/src/game/types.ts";

test("events define modes, warning, decision, score, failure and cooldown", () => {
  const ids = Object.keys(RANDOM_EVENT_RULES) as RandomEventId[];
  assert.equal(ids.length, 8);
  for (const id of ids) {
    const event = RANDOM_EVENT_RULES[id];
    assert.equal(event.duration, RANDOM_EVENT_META[id].duration);
    assert.ok(event.validModes.length > 0 && event.minimumWave >= 1);
    assert.ok(event.telegraph && event.effect && event.scoringOpportunity);
    assert.ok(event.failureCondition && event.cooldown >= event.duration);
  }
  assert.equal(
    eventCompatible({
      id: "meteorShower",
      mode: "classic",
      wave: 8,
      bossName: "INFERNO",
    }),
    false
  );
  assert.equal(
    eventCompatible({ id: "bananaStorm", mode: "bossRush", wave: 8 }),
    false
  );
});

test("pickup families remain complete and run offers are deterministic decisions", () => {
  const pickupIds = Object.keys(PICKUP_META) as PickupKind[];
  assert.equal(pickupIds.length, 13);
  assert.deepEqual(
    new Set(pickupIds.map(id => PICKUP_META[id].family)),
    new Set(["firepower", "defence", "control", "mobility", "chaos", "special"])
  );
  const taken = new Set<RunUpgradeId>();
  const first = offerRunUpgrades(42, 6, taken);
  assert.deepEqual(first, offerRunUpgrades(42, 6, taken));
  assert.equal(first.length, 3);
  assert.equal(new Set(first).size, 3);
  assert.ok(first.every(id => RUN_UPGRADES[id].description.length > 12));
  assert.equal(pickupDuration("rapid", new Set(["rapidReserve"])), 12.6);
  assert.equal(shieldHits(new Set(["shieldLayer"])), 2);
});
