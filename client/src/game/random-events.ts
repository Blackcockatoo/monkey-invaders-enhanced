import type { GameMode, RandomEventId } from "./types.ts";

export type RandomEventRule = {
  id: RandomEventId;
  validModes: GameMode[];
  minimumWave: number;
  duration: number;
  telegraph: string;
  effect: string;
  scoringOpportunity: string;
  failureCondition: string;
  cooldown: number;
  incompatibleBosses: string[];
  incompatibleFormations: string[];
};

const modes: GameMode[] = ["classic", "endless", "daily"];

export const RANDOM_EVENT_RULES: Record<RandomEventId, RandomEventRule> = {
  bananaStorm: {
    id: "bananaStorm",
    validModes: modes,
    minimumWave: 2,
    duration: 9,
    telegraph: "three collectible banana outlines descend before the storm",
    effect: "collectible fruit falls through existing safe lanes",
    scoringOpportunity: "collect five storm bananas without dropping combo",
    failureCondition: "three storm bananas leave the screen",
    cooldown: 28,
    incompatibleBosses: ["APOCALYPSE"],
    incompatibleFormations: ["mixedElite"],
  },
  lowGravity: {
    id: "lowGravity",
    validModes: modes,
    minimumWave: 3,
    duration: 8,
    telegraph: "moon icon and dotted projectile arcs",
    effect:
      "player acceleration, pickups and projectile arcs drift consistently",
    scoringOpportunity: "hit three enemies with one airborne volley",
    failureCondition: "take damage while changing lanes",
    cooldown: 30,
    incompatibleBosses: ["LEVIATHAN"],
    incompatibleFormations: ["shieldWall"],
  },
  alienPanic: {
    id: "alienPanic",
    validModes: modes,
    minimumWave: 4,
    duration: 7,
    telegraph: "formation arrows alternate twice before disruption",
    effect:
      "enemies follow a predictable sine retreat and stop aimed fire briefly",
    scoringOpportunity: "destroy enemies while their formation is displaced",
    failureCondition: "allow the formation to complete two retreats",
    cooldown: 32,
    incompatibleBosses: ["CHAOS"],
    incompatibleFormations: ["glitchedMirror"],
  },
  goldenWave: {
    id: "goldenWave",
    validModes: modes,
    minimumWave: 4,
    duration: 10,
    telegraph: "target brackets and a gold-value label",
    effect:
      "marked enemies pay triple but use a faster, still rhythmic firing beat",
    scoringOpportunity: "clear all golden targets before the timer expires",
    failureCondition: "a golden target survives the event",
    cooldown: 36,
    incompatibleBosses: [],
    incompatibleFormations: [],
  },
  powerSurge: {
    id: "powerSurge",
    validModes: modes,
    minimumWave: 5,
    duration: 8,
    telegraph: "paired player/enemy lightning meters fill for one second",
    effect:
      "player fire and Blast charge improve while Spinners gain one warned shot",
    scoringOpportunity: "break an elite during the shared surge",
    failureCondition: "miss three consecutive shots",
    cooldown: 34,
    incompatibleBosses: ["INFERNO", "APOCALYPSE"],
    incompatibleFormations: ["kamikazeReserve"],
  },
  meteorShower: {
    id: "meteorShower",
    validModes: modes,
    minimumWave: 6,
    duration: 9,
    telegraph: "striped impact columns leave one labelled open corridor",
    effect: "meteors fall outside the director's preserved safe lane",
    scoringOpportunity: "destroy enemies while remaining in the corridor",
    failureCondition: "leave the safe corridor during an active impact",
    cooldown: 38,
    incompatibleBosses: ["INFERNO", "LEVIATHAN"],
    incompatibleFormations: ["twinSpirals"],
  },
  mysteryCrate: {
    id: "mysteryCrate",
    validModes: modes,
    minimumWave: 3,
    duration: 6,
    telegraph: "question-mark landing brackets appear in the risky lane",
    effect:
      "crates fall outside the safe lane and remain mechanically ordinary pickups",
    scoringOpportunity: "collect two crates before clearing the wave",
    failureCondition: "a crate expires unattended",
    cooldown: 27,
    incompatibleBosses: ["VOID"],
    incompatibleFormations: ["meteorCorridor"],
  },
  glitchedReality: {
    id: "glitchedReality",
    validModes: modes,
    minimumWave: 10,
    duration: 7,
    telegraph:
      "stable collision boxes remain outlined while the grid desynchronizes",
    effect:
      "formation visuals mirror on a fixed beat without changing collision rules",
    scoringOpportunity: "score a multi-kill on a mirrored beat",
    failureCondition: "take damage during a mirror beat",
    cooldown: 42,
    incompatibleBosses: ["KRELL", "PHANTOM", "CHAOS"],
    incompatibleFormations: ["glitchedMirror", "teleporterCross"],
  },
};

export function eventCompatible(options: {
  id: RandomEventId;
  mode: GameMode;
  wave: number;
  bossName?: string | null;
  formationId?: string | null;
}): boolean {
  const rule = RANDOM_EVENT_RULES[options.id];
  return (
    rule.validModes.includes(options.mode) &&
    options.wave >= rule.minimumWave &&
    (!options.bossName ||
      !rule.incompatibleBosses.includes(options.bossName)) &&
    (!options.formationId ||
      !rule.incompatibleFormations.includes(options.formationId))
  );
}

export function compatibleEvents(
  options: Omit<Parameters<typeof eventCompatible>[0], "id">
): RandomEventId[] {
  return (Object.keys(RANDOM_EVENT_RULES) as RandomEventId[]).filter(id =>
    eventCompatible({ ...options, id })
  );
}
