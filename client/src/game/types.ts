export type Action = "left" | "right" | "fire" | "special" | "start" | "pause";
export type PilotId = "bolt" | "nova" | "rex" | "glitch";
export type GameMode = "classic" | "endless" | "bossRush" | "daily";
export type SectorId =
  | "neonOrbit"
  | "rindMines"
  | "staticJungle"
  | "curdLaboratory"
  | "endSignal";
export type GameState =
  | "boot"
  | "title"
  | "playing"
  | "waveClear"
  | "bossIntro"
  | "upgradeChoice"
  | "paused"
  | "gameOver";

export type CabinetStatus = {
  state: GameState;
  pilot: PilotId;
  mode: GameMode;
  score: number;
  highScore: number;
  wave: number;
  lives: number;
  credits: number;
  sector: SectorId;
  encounter: number;
  circuit: number;
  combo: number;
  shakeEnabled: boolean;
  unlockedPilots: PilotId[];
};

export type Moving = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
};

export type PlayerBuffs = {
  rapidTimer: number;
  spreadTimer: number;
  shield: number;
  magnetTimer: number;
  laserTimer: number;
  boomerangTimer: number;
  bombTimer: number;
  rainbowTimer: number;
  gorillaTimer: number;
  freezeFieldTimer: number;
  timeSlowTimer: number;
};

export type Player = Moving &
  PlayerBuffs & {
    w: number;
    h: number;
    baseW: number;
    baseH: number;
    speed: number;
    lives: number;
    invulnerable: number;
    fireCooldown: number;
    special: number;
    kongMode: boolean;
    kongTimer: number;
    squash: number;
  };

export type EnemyKind =
  | "scout"
  | "spinner"
  | "tank"
  | "shield"
  | "splitter"
  | "teleporter"
  | "kamikaze";

export type Enemy = Moving & {
  id: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  kind: EnemyKind;
  phase: number;
  flash: number;
  elite: boolean;
  isChild: boolean;
  shieldHp: number;
  shieldMax: number;
  teleportTimer: number;
  diving: boolean;
  diveDelay: number;
  golden: boolean;
  mutation?: EnemyMutation;
  entryDelay?: number;
  targetX?: number;
  targetY?: number;
  teleportTargetX?: number;
  teleportWarning?: number;
  shieldBrokenTimer?: number;
  cueTimer?: number;
  corruptTimer?: number;
};

export type EnemyMutation = "standard" | "overclocked" | "volatile";

export type ProjectileKind = "banana" | "bolt" | "laser" | "bomb" | "boomerang";

export type Projectile = Moving & {
  r: number;
  damage: number;
  hostile: boolean;
  life: number;
  kind: ProjectileKind;
  pierced: number;
  maxPierce: number;
  rainbow: boolean;
  returning: boolean;
  homeY?: number;
  countedMiss?: boolean;
  nearMissed?: boolean;
  hitSomething?: boolean;
};

export type Particle = Moving & {
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
};

export type PickupKind =
  | "rapid"
  | "spread"
  | "shield"
  | "special"
  | "magnet"
  | "laser"
  | "freeze"
  | "boomerang"
  | "bomb"
  | "rainbow"
  | "gorilla"
  | "timeSlow"
  | "mystery";

export type Pickup = Moving & {
  kind: PickupKind;
  r: number;
  life: number;
};

export type HazardKind =
  | "meteor"
  | "beam"
  | "heat"
  | "tentacle"
  | "gate"
  | "parasite";

export type Hazard = Moving & {
  w: number;
  h: number;
  kind: HazardKind;
  telegraph: number;
  life: number;
  dealt: boolean;
  warningLabel?: string;
  safeGap?: number;
};

export type BossAttackPhase = 0 | 1 | 2;

export type Boss = Moving & {
  name: string;
  symbol: string;
  color: string;
  tagline: string;
  hp: number;
  maxHp: number;
  w: number;
  h: number;
  phase: number;
  shotTimer: number;
  flash: number;
  attackPhase: BossAttackPhase;
  announcedPhase: BossAttackPhase;
  hazardTimer: number;
  entering: boolean;
  enterProgress: number;
  vulnerable?: boolean;
  quietTimer?: number;
  patternStep?: number;
};

export type FormationMovement =
  | "march"
  | "sway"
  | "arc"
  | "spiral"
  | "columns"
  | "ring"
  | "glitch";

export type FormationSlot = {
  x: number;
  y: number;
  kind: EnemyKind;
  entryDelay: number;
  elite?: boolean;
  golden?: boolean;
};

export type FormationDefinition = {
  id: string;
  label: string;
  allowedSectors: SectorId[];
  minimumWave: number;
  slots: FormationSlot[];
  entryTiming: string;
  movement: FormationMovement;
  threat: number;
  safeLanes: { from: number; to: number }[];
  compatibleEvents: RandomEventId[];
  incompatibleEnemyCombinations: [EnemyKind, EnemyKind][];
  expectedDuration: number;
  objective: string;
};

export type EncounterKind = "combat" | "escalation" | "boss" | "recovery";

export type CampaignPosition = {
  sector: SectorId;
  sectorIndex: number;
  encounter: number;
  circuit: number;
  kind: EncounterKind;
  formationId?: string;
  bossIndex?: number;
};

export type RunUpgradeId =
  | "rapidReserve"
  | "shieldLayer"
  | "quickReturn"
  | "longMagnet"
  | "nearMissCharge"
  | "frozenDividend"
  | "piercingSplit"
  | "saferMystery"
  | "goldenContract"
  | "blastBank"
  | "steadyCombo"
  | "eventDividend";

export type WaveMedal =
  | "clear"
  | "noDamage"
  | "targetScore"
  | "timeTarget"
  | "formationObjective";

export type WaveResult = {
  score: number;
  baseScore: number;
  comboBonus: number;
  timeBonus: number;
  blastBonus: number;
  medals: WaveMedal[];
  largestCombo: number;
  accuracy: number;
  duration: number;
};

export type Star = {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
};

export type RandomEventId =
  | "bananaStorm"
  | "lowGravity"
  | "alienPanic"
  | "goldenWave"
  | "powerSurge"
  | "meteorShower"
  | "mysteryCrate"
  | "glitchedReality";

export type AchievementId =
  | "firstBlood"
  | "sectorClean"
  | "bossSlayer"
  | "wave10"
  | "wave25"
  | "noHitWave"
  | "kongMode"
  | "collector"
  | "eventSurvivor"
  | "endlessLegend"
  | "bossRushChampion"
  | "richMonkey"
  | "curdDisclosure"
  | "dailyChallenger";

export type DemoActor = {
  x: number;
  y: number;
  w: number;
  h: number;
  dir: number;
  kind: EnemyKind;
};
