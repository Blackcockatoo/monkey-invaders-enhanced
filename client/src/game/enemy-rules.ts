import type { EnemyKind, EnemyMutation } from "./types.ts";

export type EnemyRule = {
  role: string;
  threat: number;
  telegraph: string;
  audioFrequency: number;
  eliteMutations: EnemyMutation[];
};

export const ENEMY_RULES: Record<EnemyKind, EnemyRule> = {
  scout: {
    role: "formation filler and movement teacher",
    threat: 1,
    telegraph: "single square eye blink",
    audioFrequency: 190,
    eliteMutations: ["overclocked"],
  },
  spinner: {
    role: "rhythmic aimed pressure",
    threat: 2,
    telegraph: "three spoke rotation",
    audioFrequency: 240,
    eliteMutations: ["overclocked", "volatile"],
  },
  tank: {
    role: "slow lane anchor with exposed firing pause",
    threat: 4,
    telegraph: "wide hatch opens",
    audioFrequency: 120,
    eliteMutations: ["volatile"],
  },
  shield: {
    role: "lane protection with a break window",
    threat: 3,
    telegraph: "segmented ring empties",
    audioFrequency: 300,
    eliteMutations: ["overclocked"],
  },
  splitter: {
    role: "destruction-timing decision",
    threat: 3,
    telegraph: "centre seam separates",
    audioFrequency: 210,
    eliteMutations: ["volatile"],
  },
  teleporter: {
    role: "marked positional threat",
    threat: 4,
    telegraph: "destination brackets appear",
    audioFrequency: 520,
    eliteMutations: ["overclocked"],
  },
  kamikaze: {
    role: "formation-breaking direct attack",
    threat: 4,
    telegraph: "down arrow and three-count",
    audioFrequency: 90,
    eliteMutations: ["volatile"],
  },
};

export function mutationFor(
  kind: EnemyKind,
  elite: boolean,
  seed: number
): EnemyMutation {
  if (!elite) return "standard";
  const mutations = ENEMY_RULES[kind].eliteMutations;
  return mutations[Math.abs(seed) % mutations.length] ?? "overclocked";
}

export function enemyThreat(
  kind: EnemyKind,
  mutation: EnemyMutation = "standard"
): number {
  const base = ENEMY_RULES[kind].threat;
  return mutation === "standard"
    ? base
    : mutation === "overclocked"
      ? base + 1
      : base + 2;
}
