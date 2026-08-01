import { mulberry32, shuffled } from "./rng.ts";
import type { RunUpgradeId } from "./types.ts";

export type RunUpgrade = {
  id: RunUpgradeId;
  family:
    | "firepower"
    | "defence"
    | "control"
    | "mobility"
    | "chaos"
    | "special";
  label: string;
  description: string;
};

export const RUN_UPGRADES: Record<RunUpgradeId, RunUpgrade> = {
  rapidReserve: {
    id: "rapidReserve",
    family: "firepower",
    label: "RAPID RESERVE",
    description: "Rapid Fire lasts 40% longer.",
  },
  shieldLayer: {
    id: "shieldLayer",
    family: "defence",
    label: "SECOND PEEL",
    description: "Shield absorbs one extra hit before it breaks.",
  },
  quickReturn: {
    id: "quickReturn",
    family: "firepower",
    label: "QUICK RETURN",
    description: "Boomerangs turn sooner and return faster.",
  },
  longMagnet: {
    id: "longMagnet",
    family: "mobility",
    label: "WIDE MAGNET",
    description: "Magnet range and pull strength increase.",
  },
  nearMissCharge: {
    id: "nearMissCharge",
    family: "special",
    label: "NERVE CHARGE",
    description: "Readable near misses add Blast charge.",
  },
  frozenDividend: {
    id: "frozenDividend",
    family: "control",
    label: "COLD CASH",
    description: "Enemies defeated while frozen award +35%.",
  },
  piercingSplit: {
    id: "piercingSplit",
    family: "firepower",
    label: "PIERCING WINGS",
    description: "Outer split bananas deal less damage but pierce once.",
  },
  saferMystery: {
    id: "saferMystery",
    family: "chaos",
    label: "LABELLING ERROR",
    description: "Mystery crates cannot roll the shortest-duration reward.",
  },
  goldenContract: {
    id: "goldenContract",
    family: "chaos",
    label: "GOLD CONTRACT",
    description:
      "Golden targets appear more often, shoot faster, and pay +50%.",
  },
  blastBank: {
    id: "blastBank",
    family: "special",
    label: "BLAST BANK",
    description: "Keep 25% Blast charge after firing.",
  },
  steadyCombo: {
    id: "steadyCombo",
    family: "control",
    label: "STEADY HANDS",
    description: "Combo decay starts later and falls more slowly.",
  },
  eventDividend: {
    id: "eventDividend",
    family: "chaos",
    label: "EVENT DIVIDEND",
    description: "Event objectives award +40% score.",
  },
};

export const RUN_UPGRADE_IDS = Object.keys(RUN_UPGRADES) as RunUpgradeId[];

export function offerRunUpgrades(
  seed: number,
  stage: number,
  taken: ReadonlySet<RunUpgradeId>
): RunUpgradeId[] {
  const random = mulberry32(seed ^ Math.imul(stage + 1, 0x45d9f3b));
  const available = RUN_UPGRADE_IDS.filter(id => !taken.has(id));
  const pool = available.length >= 3 ? available : RUN_UPGRADE_IDS;
  return shuffled(pool, random).slice(0, 3);
}

export function hasRunUpgrade(
  upgrades: ReadonlySet<RunUpgradeId>,
  id: RunUpgradeId
): boolean {
  return upgrades.has(id);
}
