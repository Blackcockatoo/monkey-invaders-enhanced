import type {
  AchievementId,
  PickupKind,
  PilotId,
  RandomEventId,
} from "@/game/types";

export const PILOTS: Record<
  PilotId,
  {
    name: string;
    primary: string;
    secondary: string;
    dark: string;
    tagline: string;
    unlock: string | null;
  }
> = {
  bolt: {
    name: "BOLT",
    primary: "#2eb8ff",
    secondary: "#7af4ff",
    dark: "#0a4278",
    tagline: "COOL HEAD · CLEAN SHOT",
    unlock: null,
  },
  nova: {
    name: "NOVA",
    primary: "#ff3f9f",
    secondary: "#ffd0ea",
    dark: "#731b55",
    tagline: "FAST HEART · WILD ARC",
    unlock: null,
  },
  rex: {
    name: "REX",
    primary: "#ff9e3f",
    secondary: "#ffe0b0",
    dark: "#7a3a0a",
    tagline: "OLD SCHOOL · NO FEAR",
    unlock: "Defeat your first boss",
  },
  glitch: {
    name: "GLITCH",
    primary: "#7cff67",
    secondary: "#e2ffd8",
    dark: "#1e5a13",
    tagline: "404 · PILOT NOT FOUND",
    unlock: "Enter the CURD code",
  },
};

export const BOSSES = [
  {
    name: "ZORG",
    symbol: "👹",
    color: "#ff4d4d",
    tagline: "FIRST OF THE FALLEN MOONS",
  },
  {
    name: "KRELL",
    symbol: "👾",
    color: "#7cff67",
    tagline: "THE PIXEL PARASITE",
  },
  {
    name: "VEX",
    symbol: "🤖",
    color: "#5fe9ff",
    tagline: "BUILT FROM SPARE BANANAS",
  },
  {
    name: "NEXUS",
    symbol: "👽",
    color: "#ff4fd8",
    tagline: "SIGNAL FROM THE DEEP RIND",
  },
  {
    name: "VOID",
    symbol: "💀",
    color: "#f6c34d",
    tagline: "EATS LIGHT, HATES FRUIT",
  },
  {
    name: "CHAOS",
    symbol: "⚡",
    color: "#ff7f32",
    tagline: "STATIC WEARING A CROWN",
  },
  {
    name: "TITAN",
    symbol: "🦾",
    color: "#ff386c",
    tagline: "FORGED IN A VENDING MACHINE",
  },
  {
    name: "SPECTER",
    symbol: "👻",
    color: "#75ffd1",
    tagline: "HAUNTS UNPLUGGED CABINETS",
  },
  {
    name: "INFERNO",
    symbol: "🔥",
    color: "#ff3d27",
    tagline: "PEELS BACK ON CONTACT",
  },
  {
    name: "LEVIATHAN",
    symbol: "🐙",
    color: "#4b8dff",
    tagline: "EIGHT ARMS, ZERO CHILL",
  },
  {
    name: "PHANTOM",
    symbol: "✨",
    color: "#c26bff",
    tagline: "RUMORED, NOT CONFIRMED",
  },
  {
    name: "OMEGA",
    symbol: "⚔",
    color: "#fff35b",
    tagline: "THE LAST LETTER, FIRST FIGHT",
  },
  {
    name: "APOCALYPSE",
    symbol: "💥",
    color: "#ff2139",
    tagline: "BRING YOUR OWN ENDING",
  },
] as const;

export const PICKUP_META: Record<
  PickupKind,
  { label: string; symbol: string; color: string; weight: number }
> = {
  rapid: { label: "RAPID FIRE", symbol: "R", color: "#54e6ff", weight: 16 },
  spread: { label: "TRIPLE SHOT", symbol: "3", color: "#ff4fc3", weight: 14 },
  shield: { label: "SHIELD", symbol: "S", color: "#75ffd1", weight: 12 },
  special: { label: "BLAST CHARGE", symbol: "★", color: "#fff36b", weight: 10 },
  magnet: { label: "MAGNET", symbol: "◎", color: "#c9a5ff", weight: 9 },
  laser: { label: "LASER BANANA", symbol: "⚡", color: "#ffef6b", weight: 8 },
  freeze: { label: "FREEZE", symbol: "❄", color: "#8fe6ff", weight: 7 },
  boomerang: {
    label: "BOOMERANG BANANA",
    symbol: "↺",
    color: "#ffcf4a",
    weight: 8,
  },
  bomb: { label: "BANANA BOMB", symbol: "●", color: "#ff8a3d", weight: 6 },
  rainbow: {
    label: "RAINBOW BANANA",
    symbol: "◆",
    color: "#ff7ad9",
    weight: 6,
  },
  gorilla: { label: "GORILLA RAGE", symbol: "🦍", color: "#ffb454", weight: 5 },
  timeSlow: { label: "TIME SLOW", symbol: "⧗", color: "#9ad3ff", weight: 6 },
  mystery: { label: "MYSTERY BOX", symbol: "?", color: "#ffffff", weight: 7 },
};

export const RANDOM_EVENT_META: Record<
  RandomEventId,
  { label: string; announce: string; duration: number; color: string }
> = {
  bananaStorm: {
    label: "BANANA STORM",
    announce: "🍌 BANANA STORM INCOMING 🍌",
    duration: 9,
    color: "#ffd94a",
  },
  lowGravity: {
    label: "LOW GRAVITY",
    announce: "🌙 LOW GRAVITY DRIFT 🌙",
    duration: 8,
    color: "#8fe6ff",
  },
  alienPanic: {
    label: "ALIEN PANIC",
    announce: "😱 ALIEN PANIC 😱",
    duration: 7,
    color: "#ff69b4",
  },
  goldenWave: {
    label: "GOLDEN WAVE",
    announce: "✨ GOLDEN WAVE ✨",
    duration: 10,
    color: "#ffe774",
  },
  powerSurge: {
    label: "POWER SURGE",
    announce: "⚡ POWER SURGE ⚡",
    duration: 8,
    color: "#54e6ff",
  },
  meteorShower: {
    label: "METEOR SHOWER",
    announce: "☄ METEOR SHOWER ☄",
    duration: 9,
    color: "#ff7f32",
  },
  mysteryCrate: {
    label: "MYSTERY CRATE DROP",
    announce: "📦 MYSTERY CRATES 📦",
    duration: 6,
    color: "#c9a5ff",
  },
  glitchedReality: {
    label: "GLITCHED REALITY",
    announce: "▓▒░ GLITCHED REALITY ░▒▓",
    duration: 7,
    color: "#7cff67",
  },
};

export const ACHIEVEMENTS: Record<
  AchievementId,
  { title: string; desc: string }
> = {
  firstBlood: { title: "FIRST BLOOD", desc: "Destroy your first alien" },
  sectorClean: { title: "SECTOR CLEAN", desc: "Clear your first wave" },
  bossSlayer: { title: "BOSS SLAYER", desc: "Defeat a boss" },
  wave10: { title: "DEEP SIGNAL", desc: "Reach wave 10" },
  wave25: { title: "TRUE BELIEVER", desc: "Reach wave 25" },
  noHitWave: {
    title: "UNTOUCHABLE",
    desc: "Clear a wave without taking damage",
  },
  kongMode: { title: "BIG MONKEY ENERGY", desc: "Enter the CURD code" },
  collector: {
    title: "POCKET FULL OF BANANAS",
    desc: "Collect every pickup type",
  },
  eventSurvivor: {
    title: "WEATHERED THE STORM",
    desc: "Survive a random cabinet event",
  },
  endlessLegend: {
    title: "ENDLESS LEGEND",
    desc: "Score 50,000 in Endless Mode",
  },
  bossRushChampion: { title: "RUSH CHAMPION", desc: "Clear Boss Rush mode" },
  richMonkey: { title: "RICH MONKEY", desc: "Score 25,000 in a single run" },
  curdDisclosure: {
    title: "OFFICIAL RECORD",
    desc: "Read the cabinet disclosure",
  },
  dailyChallenger: {
    title: "DAILY CHALLENGER",
    desc: "Complete a daily challenge run",
  },
};

export const TICKER_MESSAGES = [
  "BLUE $NAKE STUDIOS PRESENTS · MONKEY INVADERS",
  "TWIN CABINET NETWORK · SEE ALSO: BUBBLE HEX, NEXT MACHINE OVER",
  "HIGH SCORE TABLE RESETS WHEN THE MOON IS FULL (PROBABLY NOT TRUE)",
  "NEW PILOT SIGNAL DETECTED — TRY REX AFTER YOUR FIRST BOSS KILL",
  "TIP: BANANAS DO NOT GROW ON ALIENS. THROW YOUR OWN.",
  "OPERATOR NOTE: CABINET RUNS ON VIBES AND ARCADE ENERGY",
  "RUMOR: THERE IS A CODE. NOBODY WILL CONFIRM WHAT IT SPELLS.",
  "B$S ARCADE NETWORK · SIGNAL STRENGTH: BANANA-CLEAR",
  "DID YOU KNOW: SPINNERS GET DIZZY BEFORE YOU DO",
  "WARNING: BOSS ROSTER CONTAINS TRACE AMOUNTS OF CHAOS",
  "ACHIEVEMENT UNLOCKED ELSEWHERE: SOMEONE JUST BEAT YOUR SCORE",
  "PRO TIP: SHIELD ENEMIES BLUSH BEFORE THEY BREAK",
];

export const RARE_TICKER_MESSAGES = [
  "...IS THAT A GORILLA IN THE VENTS?...",
  "CABINET LOG: UNEXPLAINED BANANA SURPLUS IN SECTOR 7",
  "A DEVELOPER WALKED PAST THIS MACHINE AND SMILED. TAKE THAT AS YOU WILL.",
  "SOMEWHERE, MURPH IS PROUD OF THIS ONE.",
];

export const FAKE_REVIEWS = [
  '★★★★★ "Bananas have never felt this good." — Arcade Weekly',
  '★★★★★ "I threw a fruit at a robot and cried tears of joy." — Cabinet Quarterly',
  '★★★★☆ "Would recommend to primates of all ages." — Jungle Gazette',
  '★★★★★ "The blast meter alone is worth the quarter." — Retro Rind',
  '★★★★★ "Ten out of ten, my high score haunts me." — Pixel & Peel',
  '★★★★☆ "Surprisingly emotional for a game about throwing bananas." — The Daily Cabinet',
];

export const FAKE_HIGH_SCORES: { initials: string; score: number }[] = [
  { initials: "MRF", score: 184200 },
  { initials: "CRD", score: 156700 },
  { initials: "B$S", score: 121000 },
  { initials: "KNG", score: 98400 },
  { initials: "KLR", score: 76300 },
];

export const CURD_DISCLOSURE_LINES = [
  "🎮 CABINET DISCLOSURE 🎮",
  "This machine was assembled entirely from the brains of Murphy and Clark Curd.",
  "More Murph than Clark, but that is not relevant to the arcade record.",
  "In case of any bets, misunderstandings, or underestimating the awesomeness of",
  "the Curd family, this disclosure serves as official proof of creative genius.",
  "The legacy lives on in every banana thrown and every alien that cries about it.",
];

export const ABSURD_DEATH_EMOJI = [
  "🍕",
  "🚽",
  "🚗",
  "🦆",
  "🍦",
  "🗿",
  "🥑",
  "🛸",
  "🎷",
  "🧦",
  "😭",
];

export const BOSS_ENRAGE_LINES: Record<string, string> = {
  ZORG: "ZORG IS FURIOUS",
  KRELL: "KRELL DESTABILIZES",
  VEX: "VEX OVERCLOCKS",
  NEXUS: "NEXUS SCREAMS STATIC",
  VOID: "VOID HUNGERS",
  CHAOS: "CHAOS EMBRACES CHAOS",
  TITAN: "TITAN REDLINES",
  SPECTER: "SPECTER TEARS THROUGH",
  INFERNO: "INFERNO BOILS OVER",
  LEVIATHAN: "LEVIATHAN SURFACES",
  PHANTOM: "PHANTOM MANIFESTS",
  OMEGA: "OMEGA REWRITES THE RULES",
  APOCALYPSE: "APOCALYPSE STOPS HOLDING BACK",
};

export const MODE_LABELS: Record<string, string> = {
  classic: "CLASSIC",
  endless: "ENDLESS",
  bossRush: "BOSS RUSH",
  daily: "DAILY CHALLENGE",
};
