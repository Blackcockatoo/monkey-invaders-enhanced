import type {
  EnemyKind,
  FormationDefinition,
  FormationSlot,
  RandomEventId,
  SectorId,
} from "./types.ts";

const ALL_EVENTS: RandomEventId[] = [
  "bananaStorm",
  "lowGravity",
  "alienPanic",
  "goldenWave",
  "powerSurge",
  "meteorShower",
  "mysteryCrate",
  "glitchedReality",
];

const slot = (
  x: number,
  y: number,
  kind: EnemyKind,
  entryDelay = 0,
  elite = false,
  golden = false
): FormationSlot => ({ x, y, kind, entryDelay, elite, golden });

const row = (
  count: number,
  y: number,
  kind: EnemyKind,
  delay = 0,
  inset = 0.12
) =>
  Array.from({ length: count }, (_, index) =>
    slot(
      count === 1 ? 0.5 : inset + (index / (count - 1)) * (1 - inset * 2),
      y,
      kind,
      delay + index * 0.06
    )
  );

const definition = (
  data: Omit<
    FormationDefinition,
    "compatibleEvents" | "incompatibleEnemyCombinations"
  > & {
    compatibleEvents?: RandomEventId[];
    incompatibleEnemyCombinations?: [EnemyKind, EnemyKind][];
  }
): FormationDefinition => ({
  ...data,
  compatibleEvents: data.compatibleEvents ?? ALL_EVENTS,
  incompatibleEnemyCombinations: data.incompatibleEnemyCombinations ?? [
    ["teleporter", "kamikaze"],
  ],
});

const N: SectorId = "neonOrbit";
const R: SectorId = "rindMines";
const S: SectorId = "staticJungle";
const C: SectorId = "curdLaboratory";
const E: SectorId = "endSignal";

export const FORMATIONS: FormationDefinition[] = [
  definition({
    id: "horizontalRows",
    label: "Horizontal Rows",
    allowedSectors: [N, R, E],
    minimumWave: 1,
    slots: [...row(6, 0.16, "scout"), ...row(5, 0.28, "scout", 0.3, 0.18)],
    entryTiming: "left-to-right count-in",
    movement: "march",
    threat: 11,
    safeLanes: [{ from: 0.42, to: 0.58 }],
    expectedDuration: 32,
    objective: "Clear either row before it changes direction twice",
  }),
  definition({
    id: "vFormation",
    label: "V Formation",
    allowedSectors: [N, S, E],
    minimumWave: 1,
    slots: Array.from({ length: 9 }, (_, index) => {
      const offset = index - 4;
      return slot(
        0.5 + offset * 0.075,
        0.13 + Math.abs(offset) * 0.04,
        index % 3 === 0 ? "spinner" : "scout",
        Math.abs(offset) * 0.08
      );
    }),
    entryTiming: "tip first, wings follow",
    movement: "sway",
    threat: 13,
    safeLanes: [{ from: 0.06, to: 0.26 }],
    expectedDuration: 34,
    objective: "Break both wings within four seconds",
  }),
  definition({
    id: "arrowhead",
    label: "Arrowhead",
    allowedSectors: [N, S, E],
    minimumWave: 2,
    slots: [
      slot(0.5, 0.1, "spinner"),
      slot(0.42, 0.18, "scout", 0.12),
      slot(0.58, 0.18, "scout", 0.12),
      slot(0.34, 0.26, "scout", 0.24),
      slot(0.66, 0.26, "scout", 0.24),
      slot(0.26, 0.34, "shield", 0.36),
      slot(0.74, 0.34, "shield", 0.36),
    ],
    entryTiming: "three paired beats",
    movement: "arc",
    threat: 14,
    safeLanes: [{ from: 0.43, to: 0.57 }],
    expectedDuration: 36,
    objective: "Destroy the point before either shield closes",
  }),
  definition({
    id: "twinSpirals",
    label: "Twin Spirals",
    allowedSectors: [S, C, E],
    minimumWave: 9,
    slots: Array.from({ length: 12 }, (_, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const step = Math.floor(index / 2);
      return slot(
        0.5 + side * (0.12 + step * 0.045),
        0.12 + step * 0.045,
        step % 2 ? "spinner" : "scout",
        step * 0.1
      );
    }),
    entryTiming: "alternating spiral arms",
    movement: "spiral",
    threat: 25,
    safeLanes: [{ from: 0.43, to: 0.57 }],
    compatibleEvents: [
      "lowGravity",
      "alienPanic",
      "goldenWave",
      "mysteryCrate",
    ],
    expectedDuration: 43,
    objective: "Collapse both arms without missing",
  }),
  definition({
    id: "descendingStaircase",
    label: "Descending Staircase",
    allowedSectors: [R, S, E],
    minimumWave: 7,
    slots: Array.from({ length: 10 }, (_, index) =>
      slot(
        0.15 + index * 0.072,
        0.1 + index * 0.027,
        index > 6 ? "tank" : "scout",
        index * 0.08
      )
    ),
    entryTiming: "high step to low step",
    movement: "columns",
    threat: 22,
    safeLanes: [{ from: 0.05, to: 0.2 }],
    expectedDuration: 40,
    objective: "Remove the lowest three steps first",
  }),
  definition({
    id: "shieldWall",
    label: "Shield Wall",
    allowedSectors: [N, R, C, E],
    minimumWave: 4,
    slots: [
      ...row(5, 0.19, "shield", 0, 0.18),
      ...row(4, 0.3, "scout", 0.45, 0.23),
    ],
    entryTiming: "protectors first, cargo second",
    movement: "march",
    threat: 21,
    safeLanes: [{ from: 0.04, to: 0.22 }],
    compatibleEvents: [
      "bananaStorm",
      "goldenWave",
      "powerSurge",
      "mysteryCrate",
    ],
    expectedDuration: 44,
    objective: "Use one shield break to clear the protected row",
  }),
  definition({
    id: "tankEscort",
    label: "Tank Escort",
    allowedSectors: [R, C, E],
    minimumWave: 8,
    slots: [
      slot(0.5, 0.21, "tank"),
      slot(0.36, 0.18, "shield", 0.1),
      slot(0.64, 0.18, "shield", 0.1),
      ...row(6, 0.32, "scout", 0.35),
    ],
    entryTiming: "anchor, shields, escort",
    movement: "sway",
    threat: 26,
    safeLanes: [{ from: 0.07, to: 0.25 }],
    compatibleEvents: [
      "goldenWave",
      "powerSurge",
      "mysteryCrate",
      "bananaStorm",
    ],
    expectedDuration: 48,
    objective: "Expose the tank before the escort crosses twice",
  }),
  definition({
    id: "splitterSwarm",
    label: "Splitter Swarm",
    allowedSectors: [R, C, E],
    minimumWave: 8,
    slots: [
      ...row(5, 0.17, "splitter", 0, 0.16),
      ...row(4, 0.3, "scout", 0.5, 0.22),
    ],
    entryTiming: "splitters together, cleanup late",
    movement: "arc",
    threat: 27,
    safeLanes: [{ from: 0.43, to: 0.57 }],
    compatibleEvents: [
      "lowGravity",
      "goldenWave",
      "powerSurge",
      "mysteryCrate",
    ],
    expectedDuration: 46,
    objective: "Destroy no two splitters on the same beat",
  }),
  definition({
    id: "teleporterCross",
    label: "Teleporter Cross",
    allowedSectors: [S, C, E],
    minimumWave: 13,
    slots: [
      ...row(5, 0.21, "teleporter", 0, 0.2),
      slot(0.5, 0.1, "scout", 0.5),
      slot(0.5, 0.31, "scout", 0.6),
    ],
    entryTiming: "horizontal bar then vertical cap",
    movement: "glitch",
    threat: 29,
    safeLanes: [{ from: 0.06, to: 0.22 }],
    compatibleEvents: [
      "lowGravity",
      "goldenWave",
      "glitchedReality",
      "mysteryCrate",
    ],
    incompatibleEnemyCombinations: [["teleporter", "kamikaze"]],
    expectedDuration: 45,
    objective: "Destroy both cap scouts before the first transfer",
  }),
  definition({
    id: "kamikazeReserve",
    label: "Kamikaze Reserve",
    allowedSectors: [S, E],
    minimumWave: 14,
    slots: [...row(6, 0.16, "scout"), ...row(4, 0.29, "kamikaze", 1, 0.22)],
    entryTiming: "formation first, warned reserve at one second",
    movement: "sway",
    threat: 30,
    safeLanes: [{ from: 0.42, to: 0.58 }],
    compatibleEvents: ["alienPanic", "goldenWave", "powerSurge", "bananaStorm"],
    incompatibleEnemyCombinations: [["kamikaze", "teleporter"]],
    expectedDuration: 42,
    objective: "Bait two reserves into opposite lanes",
  }),
  definition({
    id: "emptyCentreTrap",
    label: "Empty-Centre Trap",
    allowedSectors: [R, S, E],
    minimumWave: 6,
    slots: [
      ...row(4, 0.15, "spinner", 0, 0.08),
      ...row(4, 0.15, "spinner", 0.25, 0.62),
      slot(0.12, 0.29, "scout", 0.5),
      slot(0.88, 0.29, "scout", 0.5),
    ],
    entryTiming: "outer brackets close inward",
    movement: "arc",
    threat: 24,
    safeLanes: [{ from: 0.42, to: 0.58 }],
    expectedDuration: 39,
    objective: "Hold the centre until the brackets cross",
  }),
  definition({
    id: "rotatingRing",
    label: "Rotating Ring",
    allowedSectors: [S, C, E],
    minimumWave: 15,
    slots: Array.from({ length: 12 }, (_, index) => {
      const angle = (index / 12) * Math.PI * 2;
      return slot(
        0.5 + Math.cos(angle) * 0.25,
        0.23 + Math.sin(angle) * 0.13,
        index % 3 === 0 ? "spinner" : "scout",
        index * 0.05
      );
    }),
    entryTiming: "clockwise count-in",
    movement: "ring",
    threat: 31,
    safeLanes: [{ from: 0.05, to: 0.21 }],
    compatibleEvents: [
      "lowGravity",
      "goldenWave",
      "powerSurge",
      "glitchedReality",
    ],
    expectedDuration: 47,
    objective: "Break the ring before one full rotation",
  }),
  definition({
    id: "alternatingColumns",
    label: "Alternating Columns",
    allowedSectors: [R, C, E],
    minimumWave: 8,
    slots: Array.from({ length: 12 }, (_, index) => {
      const column = index % 6;
      const rowIndex = Math.floor(index / 6);
      return slot(
        0.14 + column * 0.144,
        0.13 + rowIndex * 0.16,
        rowIndex ? "tank" : "scout",
        (column % 2) * 0.4 + column * 0.05
      );
    }),
    entryTiming: "odd columns, then even columns",
    movement: "columns",
    threat: 28,
    safeLanes: [{ from: 0.44, to: 0.56 }],
    compatibleEvents: [
      "bananaStorm",
      "lowGravity",
      "goldenWave",
      "mysteryCrate",
    ],
    expectedDuration: 46,
    objective: "Clear one full column during its opening",
  }),
  definition({
    id: "bossSupport",
    label: "Boss-Support Formation",
    allowedSectors: [E],
    minimumWave: 25,
    slots: [
      slot(0.5, 0.13, "tank", 0, true),
      slot(0.32, 0.2, "shield", 0.2),
      slot(0.68, 0.2, "shield", 0.2),
      ...row(6, 0.33, "spinner", 0.6),
    ],
    entryTiming: "elite anchor, shields, support guns",
    movement: "sway",
    threat: 39,
    safeLanes: [{ from: 0.05, to: 0.2 }],
    compatibleEvents: ["bananaStorm", "goldenWave", "powerSurge"],
    expectedDuration: 52,
    objective: "Break the anchor during a support pause",
  }),
  definition({
    id: "goldenTarget",
    label: "Golden Target Formation",
    allowedSectors: [N, R, C, E],
    minimumWave: 4,
    slots: [
      ...row(7, 0.19, "scout"),
      slot(0.5, 0.31, "spinner", 0.55, false, true),
    ],
    entryTiming: "screen, then high-value target",
    movement: "sway",
    threat: 18,
    safeLanes: [{ from: 0.05, to: 0.23 }],
    compatibleEvents: [
      "goldenWave",
      "powerSurge",
      "mysteryCrate",
      "bananaStorm",
    ],
    expectedDuration: 34,
    objective: "Destroy the golden target before the screen",
  }),
  definition({
    id: "glitchedMirror",
    label: "Glitched Mirrored Formation",
    allowedSectors: [C, E],
    minimumWave: 20,
    slots: Array.from({ length: 10 }, (_, index) => {
      const pair = Math.floor(index / 2);
      const side = index % 2 ? 1 : -1;
      return slot(
        0.5 + side * (0.08 + pair * 0.07),
        0.12 + pair * 0.055,
        pair % 2 ? "shield" : "spinner",
        pair * 0.1
      );
    }),
    entryTiming: "mirrored pairs with visible desync",
    movement: "glitch",
    threat: 34,
    safeLanes: [{ from: 0.43, to: 0.57 }],
    compatibleEvents: ["glitchedReality", "goldenWave", "mysteryCrate"],
    expectedDuration: 49,
    objective: "Clear each mirrored pair within one second",
  }),
  definition({
    id: "lowGravityArc",
    label: "Low-Gravity Arc",
    allowedSectors: [S, E],
    minimumWave: 13,
    slots: Array.from({ length: 11 }, (_, index) => {
      const t = index / 10;
      return slot(
        0.1 + t * 0.8,
        0.29 - Math.sin(t * Math.PI) * 0.18,
        index % 4 === 0 ? "teleporter" : "scout",
        index * 0.07
      );
    }),
    entryTiming: "left-to-right floating arc",
    movement: "arc",
    threat: 27,
    safeLanes: [{ from: 0.42, to: 0.58 }],
    compatibleEvents: ["lowGravity", "alienPanic", "goldenWave"],
    expectedDuration: 43,
    objective: "Keep a projectile airborne through three targets",
  }),
  definition({
    id: "meteorCorridor",
    label: "Meteor Corridor",
    allowedSectors: [R, E],
    minimumWave: 9,
    slots: [
      ...row(4, 0.14, "tank", 0, 0.12),
      ...row(5, 0.29, "scout", 0.5, 0.2),
    ],
    entryTiming: "anchors reveal the corridor first",
    movement: "columns",
    threat: 32,
    safeLanes: [{ from: 0.41, to: 0.59 }],
    compatibleEvents: ["meteorShower", "goldenWave", "powerSurge"],
    expectedDuration: 48,
    objective: "Remain inside the previewed corridor for five seconds",
  }),
  definition({
    id: "pickupBait",
    label: "Pickup Bait Formation",
    allowedSectors: [R, C, E],
    minimumWave: 10,
    slots: [
      slot(0.12, 0.18, "tank"),
      slot(0.88, 0.18, "tank"),
      ...row(6, 0.15, "scout", 0.2, 0.22),
      slot(0.5, 0.3, "spinner", 0.8, false, true),
    ],
    entryTiming: "edge anchors, screen, bait",
    movement: "sway",
    threat: 29,
    safeLanes: [{ from: 0.43, to: 0.57 }],
    compatibleEvents: ["mysteryCrate", "bananaStorm", "goldenWave"],
    expectedDuration: 46,
    objective: "Collect the bait pickup before clearing the screen",
  }),
  definition({
    id: "mixedElite",
    label: "Mixed Elite Formation",
    allowedSectors: [C, E],
    minimumWave: 22,
    slots: [
      slot(0.22, 0.15, "spinner", 0, true),
      slot(0.78, 0.15, "spinner", 0, true),
      slot(0.36, 0.25, "shield", 0.25, true),
      slot(0.64, 0.25, "shield", 0.25, true),
      slot(0.5, 0.13, "tank", 0.5, true),
      ...row(5, 0.35, "scout", 0.75, 0.2),
    ],
    entryTiming: "paired elites, anchor, cleanup lane",
    movement: "glitch",
    threat: 42,
    safeLanes: [{ from: 0.05, to: 0.2 }],
    compatibleEvents: ["powerSurge", "goldenWave", "glitchedReality"],
    expectedDuration: 54,
    objective: "Defeat all elites before any scout",
  }),
];

export const FORMATION_BY_ID = new Map(FORMATIONS.map(item => [item.id, item]));

export function getFormation(id: string): FormationDefinition {
  const formation = FORMATION_BY_ID.get(id);
  if (!formation) throw new Error(`Unknown formation: ${id}`);
  return formation;
}

export function validateFormation(formation: FormationDefinition): string[] {
  const errors: string[] = [];
  if (formation.slots.length === 0) errors.push("formation has no enemy slots");
  if (formation.threat <= 0) errors.push("threat must be positive");
  if (formation.expectedDuration < 10 || formation.expectedDuration > 90)
    errors.push("expected duration must stay inside arcade bounds");
  if (formation.safeLanes.length === 0)
    errors.push("at least one safe lane is required");
  for (const lane of formation.safeLanes) {
    if (lane.from < 0 || lane.to > 1 || lane.to - lane.from < 0.12)
      errors.push("safe lane must be normalized and at least 12% wide");
  }
  for (const enemy of formation.slots) {
    if (enemy.x < 0.04 || enemy.x > 0.96 || enemy.y < 0.06 || enemy.y > 0.42)
      errors.push("enemy slot is outside authored play bounds");
    if (enemy.entryDelay < 0) errors.push("entry delay cannot be negative");
  }
  const kinds = new Set(formation.slots.map(item => item.kind));
  for (const [a, b] of formation.incompatibleEnemyCombinations) {
    if (kinds.has(a) && kinds.has(b))
      errors.push(`incompatible roles: ${a}/${b}`);
  }
  return Array.from(new Set(errors));
}
