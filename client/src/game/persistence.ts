import type {
  AchievementId,
  GameMode,
  PickupKind,
  PilotId,
  WaveMedal,
} from "./types.ts";
import { hashSeed, mulberry32 } from "./rng.ts";

const NS = "monkey-invaders-v3";
const V4_KEY = "monkey-invaders-v4-progress";
const SAVE_VERSION = 4;

const keys = {
  highScore: (mode: GameMode) => `${NS}-highscore-${mode}`,
  pilot: `${NS}-pilot`,
  muted: `${NS}-muted`,
  credits: `${NS}-credits`,
  achievements: `${NS}-achievements`,
  unlockedPilots: `${NS}-unlocked-pilots`,
  collectedPickups: `${NS}-collected-pickups`,
  bananaSkin: `${NS}-banana-skin`,
  musicScale: `${NS}-music-scale`,
  dailyDate: `${NS}-daily-date`,
  dailyScore: `${NS}-daily-score`,
  disclosureSeen: `${NS}-disclosure-seen`,
};

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type ProgressV4 = {
  version: 4;
  pilotBestScores: Record<PilotId, Partial<Record<GameMode, number>>>;
  waveMedals: Record<string, WaveMedal[]>;
  dailyRecords: Record<string, number>;
  dailySeedVersion: number;
  cameraShake: boolean;
};

const emptyProgress = (): ProgressV4 => ({
  version: SAVE_VERSION,
  pilotBestScores: { bolt: {}, nova: {}, rex: {}, glitch: {} },
  waveMedals: {},
  dailyRecords: {},
  dailySeedVersion: 2,
  cameraShake: true,
});

const validMedals = new Set<WaveMedal>([
  "clear",
  "noDamage",
  "targetScore",
  "timeTarget",
  "formationObjective",
]);

function safeScore(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

export function migrateProgressV4(store: StorageLike): ProgressV4 {
  const fallback = emptyProgress();
  const raw = store.getItem(V4_KEY);
  let hasValidV4 = false;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ProgressV4>;
      hasValidV4 = parsed.version === SAVE_VERSION;
      const pilots: PilotId[] = ["bolt", "nova", "rex", "glitch"];
      const modes: GameMode[] = ["classic", "endless", "bossRush", "daily"];
      for (const pilot of pilots) {
        for (const mode of modes) {
          const score = safeScore(parsed.pilotBestScores?.[pilot]?.[mode]);
          if (score > 0) fallback.pilotBestScores[pilot][mode] = score;
        }
      }
      if (parsed.waveMedals && typeof parsed.waveMedals === "object") {
        for (const [key, medals] of Object.entries(parsed.waveMedals)) {
          if (!Array.isArray(medals)) continue;
          fallback.waveMedals[key] = Array.from(
            new Set(
              medals.filter((medal): medal is WaveMedal =>
                validMedals.has(medal as WaveMedal)
              )
            )
          );
        }
      }
      if (parsed.dailyRecords && typeof parsed.dailyRecords === "object") {
        for (const [key, value] of Object.entries(parsed.dailyRecords)) {
          const score = safeScore(value);
          if (score > 0) fallback.dailyRecords[key] = score;
        }
      }
      fallback.dailySeedVersion = Math.max(
        1,
        safeScore(parsed.dailySeedVersion) || 2
      );
      fallback.cameraShake = parsed.cameraShake !== false;
    } catch {
      // Preserve the old v3 keys and rebuild only the additive v4 record.
    }
  }
  if (!hasValidV4) {
    const savedPilot = store.getItem(keys.pilot);
    const pilot: PilotId =
      savedPilot === "nova" || savedPilot === "rex" || savedPilot === "glitch"
        ? savedPilot
        : "bolt";
    for (const mode of ["classic", "endless", "bossRush"] as GameMode[]) {
      const legacy = safeScore(Number(store.getItem(keys.highScore(mode))));
      if (legacy > (fallback.pilotBestScores[pilot][mode] ?? 0))
        fallback.pilotBestScores[pilot][mode] = legacy;
    }
    const legacyDate = store.getItem(keys.dailyDate);
    const legacyDaily = safeScore(Number(store.getItem(keys.dailyScore)));
    if (legacyDate && legacyDaily > 0)
      fallback.dailyRecords[`${legacyDate}:legacy`] = legacyDaily;
  }
  store.setItem(V4_KEY, JSON.stringify(fallback));
  return fallback;
}

function getProgress(): ProgressV4 {
  return migrateProgressV4(localStorage);
}

function setProgress(progress: ProgressV4) {
  localStorage.setItem(V4_KEY, JSON.stringify(progress));
}

function readNumber(key: string, fallback = 0): number {
  const raw = localStorage.getItem(key);
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readSet(key: string): Set<string> {
  const raw = localStorage.getItem(key);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, value: Set<string>) {
  localStorage.setItem(key, JSON.stringify(Array.from(value)));
}

export const Persistence = {
  getHighScore(mode: GameMode): number {
    return readNumber(keys.highScore(mode), 0);
  },
  setHighScore(mode: GameMode, value: number) {
    localStorage.setItem(keys.highScore(mode), String(value));
  },
  getPilot(): PilotId {
    const saved = localStorage.getItem(keys.pilot);
    if (
      saved === "nova" ||
      saved === "bolt" ||
      saved === "rex" ||
      saved === "glitch"
    )
      return saved;
    return "bolt";
  },
  setPilot(pilot: PilotId) {
    localStorage.setItem(keys.pilot, pilot);
  },
  getMuted(): boolean {
    return localStorage.getItem(keys.muted) === "true";
  },
  setMuted(value: boolean) {
    localStorage.setItem(keys.muted, String(value));
  },
  getCredits(): number {
    return readNumber(keys.credits, 0);
  },
  addCredit(): number {
    const next = this.getCredits() + 1;
    localStorage.setItem(keys.credits, String(next));
    return next;
  },
  getAchievements(): Set<AchievementId> {
    return readSet(keys.achievements) as Set<AchievementId>;
  },
  unlockAchievement(id: AchievementId): boolean {
    const set = this.getAchievements();
    if (set.has(id)) return false;
    set.add(id);
    writeSet(keys.achievements, set);
    return true;
  },
  getUnlockedPilots(): Set<PilotId> {
    const set = readSet(keys.unlockedPilots) as Set<PilotId>;
    set.add("bolt");
    set.add("nova");
    return set;
  },
  unlockPilot(pilot: PilotId): boolean {
    const set = this.getUnlockedPilots();
    if (set.has(pilot)) return false;
    set.add(pilot);
    writeSet(keys.unlockedPilots, set);
    return true;
  },
  getCollectedPickups(): Set<PickupKind> {
    return readSet(keys.collectedPickups) as Set<PickupKind>;
  },
  recordPickupCollected(kind: PickupKind): Set<PickupKind> {
    const set = this.getCollectedPickups();
    set.add(kind);
    writeSet(keys.collectedPickups, set);
    return set;
  },
  getBananaSkin(): "classic" | "gold" | "rainbow" {
    const saved = localStorage.getItem(keys.bananaSkin);
    if (saved === "gold" || saved === "rainbow") return saved;
    return "classic";
  },
  setBananaSkin(skin: "classic" | "gold" | "rainbow") {
    localStorage.setItem(keys.bananaSkin, skin);
  },
  getMusicScale(): "classic" | "alt" {
    return localStorage.getItem(keys.musicScale) === "alt" ? "alt" : "classic";
  },
  setMusicScale(scale: "classic" | "alt") {
    localStorage.setItem(keys.musicScale, scale);
  },
  getDailyRecord(dateKey: string, seedVersion = 2): number {
    const progress = getProgress();
    const current = progress.dailyRecords[`${dateKey}:v${seedVersion}`];
    if (current !== undefined) return current;
    if (localStorage.getItem(keys.dailyDate) !== dateKey) return 0;
    return readNumber(keys.dailyScore, 0);
  },
  setDailyRecord(dateKey: string, score: number, seedVersion = 2) {
    localStorage.setItem(keys.dailyDate, dateKey);
    localStorage.setItem(keys.dailyScore, String(score));
    const progress = getProgress();
    progress.dailyRecords[`${dateKey}:v${seedVersion}`] = safeScore(score);
    progress.dailySeedVersion = seedVersion;
    setProgress(progress);
  },
  hasSeenDisclosure(): boolean {
    return localStorage.getItem(keys.disclosureSeen) === "true";
  },
  markDisclosureSeen() {
    localStorage.setItem(keys.disclosureSeen, "true");
  },
  getPilotBestScore(pilot: PilotId, mode: GameMode): number {
    return getProgress().pilotBestScores[pilot][mode] ?? 0;
  },
  setPilotBestScore(pilot: PilotId, mode: GameMode, value: number) {
    const progress = getProgress();
    progress.pilotBestScores[pilot][mode] = Math.max(
      progress.pilotBestScores[pilot][mode] ?? 0,
      safeScore(value)
    );
    setProgress(progress);
  },
  recordWaveMedals(mode: GameMode, wave: number, medals: WaveMedal[]) {
    const progress = getProgress();
    const key = `${mode}:${Math.max(1, Math.floor(wave))}`;
    const previous = progress.waveMedals[key] ?? [];
    progress.waveMedals[key] = Array.from(
      new Set([...previous, ...medals.filter(medal => validMedals.has(medal))])
    );
    setProgress(progress);
  },
  getWaveMedals(mode: GameMode, wave: number): WaveMedal[] {
    return (
      getProgress().waveMedals[`${mode}:${Math.max(1, Math.floor(wave))}`] ?? []
    );
  },
  getCameraShake(): boolean {
    return getProgress().cameraShake;
  },
  setCameraShake(enabled: boolean) {
    const progress = getProgress();
    progress.cameraShake = enabled;
    setProgress(progress);
  },
  getSaveVersion(): number {
    return getProgress().version;
  },
};

export { mulberry32 };

export function dailySeedFromDate(date: Date, version = 2): number {
  return hashSeed(`${dateKey(date)}:monkey-invaders:${version}`);
}

export function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
