import type { PilotId } from "./types.ts";

export type PilotRule = {
  role: string;
  mobility: number;
  firepower: number;
  control: number;
  risk: number;
  projectileSpeed: number;
  projectileScale: number;
  baseDamage: number;
  acceleration: number;
  moveSpeed: number;
  knockbackResistance: number;
  spreadAngles: number[];
  scoringCue: string;
  blastLabel: string;
};

export const PILOT_RULES: Record<PilotId, PilotRule> = {
  bolt: {
    role: "PRECISION",
    mobility: 3,
    firepower: 4,
    control: 5,
    risk: 2,
    projectileSpeed: 1.18,
    projectileScale: 0.82,
    baseDamage: 1,
    acceleration: 1,
    moveSpeed: 1,
    knockbackResistance: 1,
    spreadAngles: [-0.16, 0, 0.16],
    scoringCue: "Accuracy streaks raise BOLT's clean-hit dividend.",
    blastLabel: "FOCUSED STRIKE",
  },
  nova: {
    role: "MOBILITY",
    mobility: 5,
    firepower: 3,
    control: 4,
    risk: 3,
    projectileSpeed: 1,
    projectileScale: 1,
    baseDamage: 1,
    acceleration: 1.28,
    moveSpeed: 1.12,
    knockbackResistance: 1,
    spreadAngles: [-0.32, 0, 0.32],
    scoringCue: "Fast lane switches and multi-target volleys build rhythm.",
    blastLabel: "OUTWARD ARC",
  },
  rex: {
    role: "HEAVY",
    mobility: 2,
    firepower: 5,
    control: 3,
    risk: 2,
    projectileSpeed: 0.88,
    projectileScale: 1.35,
    baseDamage: 1.35,
    acceleration: 0.82,
    moveSpeed: 0.86,
    knockbackResistance: 0.45,
    spreadAngles: [-0.2, 0, 0.2],
    scoringCue: "Close-range impacts award a heavy-contact bonus.",
    blastLabel: "RIND SHOCKWAVE",
  },
  glitch: {
    role: "RISK / DISRUPTION",
    mobility: 4,
    firepower: 4,
    control: 2,
    risk: 5,
    projectileSpeed: 1.04,
    projectileScale: 0.95,
    baseDamage: 0.9,
    acceleration: 1.08,
    moveSpeed: 1.04,
    knockbackResistance: 0.9,
    spreadAngles: [-0.26, 0, 0.26],
    scoringCue: "Warned unstable beats can bend, copy or pierce bananas.",
    blastLabel: "BEHAVIOUR CORRUPT",
  },
};

export type GlitchBeat = "stable" | "duplicate" | "bend" | "pierce";

export function glitchBeat(runTime: number): GlitchBeat {
  const beat = Math.floor(Math.max(0, runTime) / 1.4) % 8;
  if (beat === 2) return "duplicate";
  if (beat === 4) return "bend";
  if (beat === 6) return "pierce";
  return "stable";
}

export function blastAngles(pilot: PilotId): number[] {
  if (pilot === "bolt") return [-0.035, 0, 0.035];
  if (pilot === "nova") return [-0.62, -0.42, -0.22, 0, 0.22, 0.42, 0.62];
  if (pilot === "rex") return [-0.34, -0.17, 0, 0.17, 0.34];
  return [-0.52, -0.26, 0, 0.26, 0.52];
}

export function pilotAccuracyBonus(
  pilot: PilotId,
  consecutiveHits: number
): number {
  if (pilot === "bolt") return Math.min(2, 1 + consecutiveHits * 0.04);
  if (pilot === "glitch") return Math.min(1.8, 1 + consecutiveHits * 0.025);
  return Math.min(1.5, 1 + consecutiveHits * 0.02);
}

export function pilotKillMultiplier(
  pilot: PilotId,
  context: {
    simultaneous: boolean;
    closeRange: boolean;
    glitchUnstable: boolean;
  }
): number {
  if (pilot === "nova" && context.simultaneous) return 1.35;
  if (pilot === "rex" && context.closeRange) return 1.35;
  if (pilot === "glitch" && context.glitchUnstable) return 1.25;
  return 1;
}
