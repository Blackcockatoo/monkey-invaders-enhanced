import type { PickupKind, RunUpgradeId } from "./types.ts";

export const PICKUP_DURATIONS: Partial<Record<PickupKind, number>> = {
  rapid: 9,
  spread: 9,
  shield: 12,
  magnet: 10,
  laser: 8,
  freeze: 5,
  boomerang: 10,
  bomb: 10,
  rainbow: 10,
  gorilla: 8,
  timeSlow: 6,
};

export function pickupDuration(
  kind: PickupKind,
  upgrades: ReadonlySet<RunUpgradeId>
): number {
  const base = PICKUP_DURATIONS[kind] ?? 0;
  if (kind === "rapid" && upgrades.has("rapidReserve")) return base * 1.4;
  return base;
}

export function shieldHits(upgrades: ReadonlySet<RunUpgradeId>): number {
  return upgrades.has("shieldLayer") ? 2 : 1;
}
