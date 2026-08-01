import { FORMATIONS, getFormation } from "./formations.ts";
import { mulberry32 } from "./rng.ts";
import { campaignPosition } from "./sector-content.ts";
import type {
  FormationDefinition,
  GameMode,
  RandomEventId,
  SectorId,
} from "./types.ts";

export type DirectedWave = {
  formation: FormationDefinition;
  threatBudget: number;
  recovery: boolean;
  safeLane: { from: number; to: number };
};

export function threatBudgetForWave(wave: number, mode: GameMode): number {
  const safeWave = Math.max(1, wave);
  const base =
    mode === "endless" ? 12 + Math.sqrt(safeWave) * 7.5 : 12 + safeWave * 0.9;
  return Math.round(Math.min(48, base));
}

function allowedFor(
  formation: FormationDefinition,
  sector: SectorId,
  wave: number,
  event?: RandomEventId | null
) {
  return (
    formation.allowedSectors.includes(sector) &&
    formation.minimumWave <= wave &&
    (!event || formation.compatibleEvents.includes(event))
  );
}

export function directWave(options: {
  mode: GameMode;
  wave: number;
  seed: number;
  sector?: SectorId;
  event?: RandomEventId | null;
  forcedFormationId?: string;
}): DirectedWave {
  const position = campaignPosition(options.wave);
  const sector = options.sector ?? position.sector;
  const budget = threatBudgetForWave(options.wave, options.mode);
  const recovery = options.mode === "endless" && options.wave % 7 === 0;
  if (options.forcedFormationId) {
    const forced = getFormation(options.forcedFormationId);
    return {
      formation: forced,
      threatBudget: budget,
      recovery,
      safeLane: forced.safeLanes[0],
    };
  }
  if (recovery) {
    const formation = getFormation("goldenTarget");
    return {
      formation,
      threatBudget: budget,
      recovery,
      safeLane: formation.safeLanes[0],
    };
  }
  const compatible = FORMATIONS.filter(item =>
    allowedFor(item, sector, options.wave, options.event)
  );
  const candidates = compatible.filter(item => item.threat <= budget + 4);
  const pool =
    candidates.length > 0
      ? candidates
      : compatible.length > 0
        ? compatible
        : [getFormation("horizontalRows")];
  const random = mulberry32(options.seed ^ Math.imul(options.wave, 0x9e3779b1));
  const ranked = [...pool].sort((a, b) => {
    const distance = Math.abs(budget - a.threat) - Math.abs(budget - b.threat);
    return distance || a.id.localeCompare(b.id);
  });
  const shortlist = ranked.slice(0, Math.min(4, ranked.length));
  const formation = shortlist[Math.floor(random() * shortlist.length)];
  const lane =
    formation.safeLanes[Math.floor(random() * formation.safeLanes.length)];
  return { formation, threatBudget: budget, recovery, safeLane: lane };
}

export function safeLaneWidth(
  lane: { from: number; to: number },
  width: number
): number {
  return Math.max(0, lane.to - lane.from) * width;
}

export function hasSafeLane(
  wave: DirectedWave,
  minimumNormalizedWidth = 0.12
): boolean {
  return wave.safeLane.to - wave.safeLane.from >= minimumNormalizedWidth;
}
