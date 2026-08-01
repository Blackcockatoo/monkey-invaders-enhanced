import { compatibleEvents } from "./random-events.ts";
import { hashSeed, mulberry32, shuffled } from "./rng.ts";
import { RUN_UPGRADE_IDS } from "./run-upgrades.ts";
import { SECTORS } from "./sector-content.ts";
import type {
  PilotId,
  RandomEventId,
  RunUpgradeId,
  SectorId,
} from "./types.ts";

export const DAILY_SEED_VERSION = 2;

export type DailyChallengePlan = {
  dateKey: string;
  seedVersion: number;
  seed: number;
  pilot: PilotId;
  sectorOrder: SectorId[];
  formations: string[];
  events: (RandomEventId | null)[];
  pickupOffers: RunUpgradeId[][];
  bossOrder: number[];
};

export function utcDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function dailySeed(date: Date, version = DAILY_SEED_VERSION): number {
  return hashSeed(`${utcDateKey(date)}:monkey-invaders:${version}`);
}

export function buildDailyChallenge(
  date: Date,
  version = DAILY_SEED_VERSION
): DailyChallengePlan {
  const seed = dailySeed(date, version);
  const random = mulberry32(seed);
  const pilots: PilotId[] = ["bolt", "nova", "rex", "glitch"];
  const sectorOrder = shuffled(
    SECTORS.map(sector => sector.id),
    random
  );
  const formations: string[] = [];
  const events: (RandomEventId | null)[] = [];
  const pickupOffers: RunUpgradeId[][] = [];
  const bossOrder: number[] = [];
  for (
    let sectorIndex = 0;
    sectorIndex < sectorOrder.length;
    sectorIndex += 1
  ) {
    const sector =
      SECTORS.find(item => item.id === sectorOrder[sectorIndex]) ??
      SECTORS[sectorIndex];
    formations.push(...shuffled(sector.formationOrder, random));
    const valid = compatibleEvents({
      mode: "daily",
      wave: sectorIndex * 6 + 3,
      formationId: sector.formationOrder[2],
    });
    const event = valid[Math.floor(random() * valid.length)] ?? null;
    for (let encounter = 0; encounter < 6; encounter += 1) {
      events.push(encounter === 2 ? event : null);
    }
    pickupOffers.push(shuffled(RUN_UPGRADE_IDS, random).slice(0, 3));
    bossOrder.push((sector.bossIndex + Math.floor(random() * 3)) % 13);
  }
  return {
    dateKey: utcDateKey(date),
    seedVersion: version,
    seed,
    pilot: pilots[Math.floor(random() * pilots.length)],
    sectorOrder,
    formations,
    events,
    pickupOffers,
    bossOrder,
  };
}

export function dailyFormationForWave(
  plan: DailyChallengePlan,
  wave: number
): string | undefined {
  const withinCircuit = (Math.max(1, wave) - 1) % 30;
  const sectorIndex = Math.floor(withinCircuit / 6);
  const encounter = withinCircuit % 6;
  if (encounter >= 5) return undefined;
  return plan.formations[sectorIndex * 5 + encounter];
}
