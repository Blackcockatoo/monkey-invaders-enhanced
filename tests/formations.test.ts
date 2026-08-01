import assert from "node:assert/strict";
import test from "node:test";
import {
  FORMATIONS,
  getFormation,
  validateFormation,
} from "../client/src/game/formations.ts";
import {
  SECTORS,
  campaignPosition,
} from "../client/src/game/sector-content.ts";
import {
  directWave,
  hasSafeLane,
  safeLaneWidth,
  threatBudgetForWave,
} from "../client/src/game/wave-director.ts";

test("the authored grammar contains twenty valid, readable formations", () => {
  assert.equal(FORMATIONS.length, 20);
  assert.equal(new Set(FORMATIONS.map(item => item.id)).size, 20);
  for (const formation of FORMATIONS) {
    assert.deepEqual(validateFormation(formation), [], formation.id);
    assert.ok(formation.entryTiming.length > 5);
    assert.ok(formation.objective.length > 5);
    assert.ok(
      formation.safeLanes.every(lane => safeLaneWidth(lane, 960) >= 115)
    );
  }
});

test("Classic is five sectors of four combat waves, escalation, then boss", () => {
  assert.equal(SECTORS.length, 5);
  for (let sectorIndex = 0; sectorIndex < 5; sectorIndex += 1) {
    const sector = SECTORS[sectorIndex];
    assert.equal(sector.formationOrder.length, 5);
    for (const id of sector.formationOrder)
      assert.ok(
        getFormation(id).allowedSectors.includes(sector.id),
        `${sector.id}/${id}`
      );
    const boss = campaignPosition(sectorIndex * 6 + 6);
    assert.equal(boss.kind, "boss");
    assert.equal(boss.sector, sector.id);
  }
  assert.deepEqual(campaignPosition(30), {
    sector: "endSignal",
    sectorIndex: 4,
    encounter: 6,
    circuit: 1,
    kind: "boss",
    formationId: undefined,
    bossIndex: 12,
  });
  assert.equal(campaignPosition(31).circuit, 2);
  assert.equal(campaignPosition(31).sector, "neonOrbit");
});

test("the threat director is deterministic, budgeted and preserves recovery lanes", () => {
  const first = directWave({
    mode: "endless",
    wave: 18,
    seed: 12345,
    sector: "staticJungle",
  });
  const second = directWave({
    mode: "endless",
    wave: 18,
    seed: 12345,
    sector: "staticJungle",
  });
  assert.equal(first.formation.id, second.formation.id);
  assert.deepEqual(first.safeLane, second.safeLane);
  assert.ok(first.formation.threat <= first.threatBudget + 4);
  assert.ok(hasSafeLane(first));
  const recovery = directWave({
    mode: "endless",
    wave: 21,
    seed: 3,
    sector: "curdLaboratory",
  });
  assert.equal(recovery.recovery, true);
  assert.equal(recovery.formation.id, "goldenTarget");
  assert.ok(threatBudgetForWave(40, "endless") <= 48);
});
