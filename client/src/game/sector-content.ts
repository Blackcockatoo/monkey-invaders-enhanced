import type { CampaignPosition, SectorId } from "./types.ts";

export type SectorDefinition = {
  id: SectorId;
  name: string;
  purpose: string;
  formationOrder: [string, string, string, string, string];
  bossIndex: number;
  palette: string;
  recoveryNote: string;
};

export const SECTORS: SectorDefinition[] = [
  {
    id: "neonOrbit",
    name: "NEON ORBIT",
    purpose: "Formation reading, dodging and power-up fundamentals",
    formationOrder: [
      "horizontalRows",
      "vFormation",
      "arrowhead",
      "goldenTarget",
      "shieldWall",
    ],
    bossIndex: 0,
    palette: "#54e6ff",
    recoveryNote: "Wide lanes and slow count-ins leave room to reset.",
  },
  {
    id: "rindMines",
    name: "RIND MINES",
    purpose: "Lane denial, meteor corridors and dangerous rewards",
    formationOrder: [
      "descendingStaircase",
      "tankEscort",
      "alternatingColumns",
      "pickupBait",
      "meteorCorridor",
    ],
    bossIndex: 3,
    palette: "#ff9e3f",
    recoveryNote:
      "The empty central corridor is always previewed before pressure.",
  },
  {
    id: "staticJungle",
    name: "STATIC JUNGLE",
    purpose: "Pursuit, unusual entries and formation disruption",
    formationOrder: [
      "emptyCentreTrap",
      "lowGravityArc",
      "teleporterCross",
      "kamikazeReserve",
      "twinSpirals",
    ],
    bossIndex: 6,
    palette: "#7cff67",
    recoveryNote: "Every dive and transfer exposes a destination marker.",
  },
  {
    id: "curdLaboratory",
    name: "CURD LABORATORY",
    purpose: "Experimental combinations, shields and high-value targets",
    formationOrder: [
      "shieldWall",
      "splitterSwarm",
      "glitchedMirror",
      "goldenTarget",
      "mixedElite",
    ],
    bossIndex: 9,
    palette: "#c9a5ff",
    recoveryNote:
      "Elite waves alternate attack beats rather than stacking them.",
  },
  {
    id: "endSignal",
    name: "END SIGNAL",
    purpose: "Structured mastery of the complete combat language",
    formationOrder: [
      "rotatingRing",
      "bossSupport",
      "meteorCorridor",
      "glitchedMirror",
      "mixedElite",
    ],
    bossIndex: 12,
    palette: "#ff4d6d",
    recoveryNote: "Brief quiet beats divide every high-intensity sequence.",
  },
];

export const SECTOR_BY_ID = new Map(SECTORS.map(sector => [sector.id, sector]));

export function campaignPosition(
  wave: number,
  sectorOrder: SectorId[] = SECTORS.map(sector => sector.id)
): CampaignPosition {
  const safeWave = Math.max(1, Math.floor(wave));
  const zeroBased = safeWave - 1;
  const circuit = Math.floor(zeroBased / 30) + 1;
  const withinCircuit = zeroBased % 30;
  const sectorIndex = Math.floor(withinCircuit / 6);
  const encounter = (withinCircuit % 6) + 1;
  const sectorId = sectorOrder[sectorIndex] ?? SECTORS[sectorIndex].id;
  const sector = SECTOR_BY_ID.get(sectorId) ?? SECTORS[sectorIndex];
  return {
    sector: sector.id,
    sectorIndex,
    encounter,
    circuit,
    kind: encounter === 6 ? "boss" : encounter === 5 ? "escalation" : "combat",
    formationId:
      encounter < 6 ? sector.formationOrder[encounter - 1] : undefined,
    bossIndex: encounter === 6 ? sector.bossIndex : undefined,
  };
}

export function sectorLabel(id: SectorId): string {
  return SECTOR_BY_ID.get(id)?.name ?? "UNKNOWN SECTOR";
}
