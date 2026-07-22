import type {
  AchievementId,
  GameMode,
  PickupKind,
  PilotId,
} from "@/game/types";

const NS = "monkey-invaders-v3";

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
  getDailyRecord(dateKey: string): number {
    if (localStorage.getItem(keys.dailyDate) !== dateKey) return 0;
    return readNumber(keys.dailyScore, 0);
  },
  setDailyRecord(dateKey: string, score: number) {
    localStorage.setItem(keys.dailyDate, dateKey);
    localStorage.setItem(keys.dailyScore, String(score));
  },
  hasSeenDisclosure(): boolean {
    return localStorage.getItem(keys.disclosureSeen) === "true";
  },
  markDisclosureSeen() {
    localStorage.setItem(keys.disclosureSeen, "true");
  },
};

export function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailySeedFromDate(date: Date): number {
  const key = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) | 0;
  }
  return hash;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
