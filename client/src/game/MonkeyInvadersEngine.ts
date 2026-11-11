import type {
  Action,
  AchievementId,
  Boss,
  BossAttackPhase,
  CabinetStatus,
  Enemy,
  EnemyKind,
  GameMode,
  GameState,
  Hazard,
  Particle,
  Pickup,
  PickupKind,
  PilotId,
  Player,
  Projectile,
  ProjectileKind,
  RandomEventId,
  Star,
} from "@/game/types";
import {
  ABSURD_DEATH_EMOJI,
  ACHIEVEMENTS,
  BOSSES,
  BOSS_ENRAGE_LINES,
  CURD_DISCLOSURE_LINES,
  FAKE_HIGH_SCORES,
  FAKE_REVIEWS,
  MODE_LABELS,
  PICKUP_META,
  PILOTS,
  RANDOM_EVENT_META,
  RARE_TICKER_MESSAGES,
  TICKER_MESSAGES,
} from "@/game/content";
import { CABINET_COPY, type CabinetCopy, type Lang, type ModeId } from "@/game/i18n";
import { ArcadeAudio } from "@/game/audio";
import {
  Persistence,
  dailySeedFromDate,
  dateKey,
  mulberry32,
} from "@/game/persistence";

export type {
  Action,
  CabinetStatus,
  GameMode,
  GameState,
  PilotId,
} from "@/game/types";

const W = 960;
const H = 540;
const FIXED = 1 / 60;
const MAX_FRAME_DELTA = 0.1;
const PLAYER_Y = H - 72;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const overlap = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

type DyingAlien = {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  timer: number;
  emoji: string;
};
type AchievementToast = { title: string; desc: string; timer: number };

export class MonkeyInvadersEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly onStatus: (status: CabinetStatus) => void;
  private readonly audio = new ArcadeAudio();
  private frame = 0;
  private alive = true;
  private last = 0;
  private accumulator = 0;
  private renderAlpha = 0;
  private hitStop = 0;
  private state: GameState = "boot";
  private stateTime = 0;
  private held: Record<Action, boolean> = {
    left: false,
    right: false,
    fire: false,
    special: false,
    start: false,
    pause: false,
  };
  private just = new Set<Action>();
  private pilot: PilotId = Persistence.getPilot();
  private unlockedPilots = Persistence.getUnlockedPilots();
  private mode: GameMode = "classic";
  private player = this.makePlayer();
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private pickups: Pickup[] = [];
  private hazards: Hazard[] = [];
  private dyingAliens: DyingAlien[] = [];
  private boss: Boss | null = null;
  private stars: Star[] = [];
  private nextId = 1;
  private score = 0;
  private highScore = 0;
  private wave = 1;
  private waveTimer = 0;
  private waveDamageTaken = false;
  private formationDirection = 1;
  private enemyShotTimer = 1.2;
  private shake = 0;
  private flash = 0;
  private titleClock = 0;
  private message = "";
  private messageTimer = 0;
  private lastStatusKey = "";
  private credits = Persistence.getCredits();
  private cheatUsed = false;
  private kongZapTimer = 0;
  private curdBuffer = "";
  private tapCount = 0;
  private lastTapTime = 0;
  private disclosureOpen = false;
  private bossRushIndex = 0;
  private activeEvent: RandomEventId | null = null;
  private eventTimer = 0;
  private eventTickTimer = 0;
  private eventCooldown = 20;
  private achievementsCache = Persistence.getAchievements();
  private achievementQueue: AchievementToast[] = [];
  private bananaSkin = Persistence.getBananaSkin();
  private copy: CabinetCopy = CABINET_COPY.en;
  private tickerFeed: string;
  private dailyDateKey = dateKey(new Date());
  private dailyModifier: RandomEventId;

  constructor(
    canvas: HTMLCanvasElement,
    onStatus: (status: CabinetStatus) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    this.onStatus = onStatus;
    this.highScore = Persistence.getHighScore(this.mode);
    this.audio.muted = Persistence.getMuted();
    this.audio.setMusicScale(Persistence.getMusicScale());
    const seededRandom = mulberry32(dailySeedFromDate(new Date()));
    const eventIds = Object.keys(RANDOM_EVENT_META) as RandomEventId[];
    this.dailyModifier = eventIds[Math.floor(seededRandom() * eventIds.length)];
    const tickerParts = [...TICKER_MESSAGES, ...FAKE_REVIEWS];
    if (Math.random() < 1 / 6) {
      tickerParts.splice(
        Math.floor(Math.random() * tickerParts.length),
        0,
        RARE_TICKER_MESSAGES[
          Math.floor(Math.random() * RARE_TICKER_MESSAGES.length)
        ]
      );
    }
    this.tickerFeed = tickerParts.join("     ★     ");
    this.stars = Array.from({ length: 100 }, (_, index) => ({
      x: (index * 113.7) % W,
      y: (index * 67.3) % H,
      speed: 12 + (index % 5) * 11,
      size: 1 + (index % 3),
      alpha: 0.25 + (index % 7) * 0.08,
    }));
    this.refreshBananaSkin();
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onCanvasTap = this.onCanvasTap.bind(this);
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
    canvas.addEventListener("pointerdown", this.onCanvasTap);
    this.emitStatus(true);
  }

  start() {
    this.frame = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.frame);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("pointerdown", this.onCanvasTap);
    this.audio.destroy();
  }

  getPilot() {
    return this.pilot;
  }

  /** Switch the canvas menu screens to another language (DOM labels live in Home.tsx). */
  setLang(lang: Lang) {
    this.copy = CABINET_COPY[lang];
  }

  private modeLabel() {
    return this.copy.modes[this.mode as ModeId] ?? MODE_LABELS[this.mode];
  }

  isMuted() {
    return this.audio.muted;
  }

  setMuted(value: boolean) {
    this.audio.setMuted(value);
    Persistence.setMuted(value);
  }

  cyclePilot() {
    const order: PilotId[] = ["bolt", "nova", "rex", "glitch"];
    const unlocked = order.filter(id => this.unlockedPilots.has(id));
    const index = unlocked.indexOf(this.pilot);
    const next = unlocked[(index + 1) % unlocked.length];
    this.selectPilot(next);
  }

  selectPilot(pilot: PilotId) {
    if (!this.unlockedPilots.has(pilot)) return;
    this.pilot = pilot;
    Persistence.setPilot(pilot);
    this.emitStatus(true);
    this.audio.blip(
      pilot === "bolt"
        ? 520
        : pilot === "nova"
          ? 660
          : pilot === "rex"
            ? 440
            : 760,
      0.09,
      0.025,
      "triangle"
    );
  }

  cycleMode() {
    if (this.state !== "title" && this.state !== "gameOver") return;
    const order: GameMode[] = ["classic", "endless", "bossRush", "daily"];
    const index = order.indexOf(this.mode);
    this.mode = order[(index + 1) % order.length];
    this.highScore =
      this.mode === "daily"
        ? Persistence.getDailyRecord(this.dailyDateKey)
        : Persistence.getHighScore(this.mode);
    this.audio.blip(400, 0.05, 0.02, "triangle");
    this.emitStatus(true);
  }

  press(action: Action) {
    this.audio.unlock();
    if (!this.held[action]) this.just.add(action);
    this.held[action] = true;
    if (
      action === "start" &&
      (this.state === "title" || this.state === "gameOver")
    )
      this.startGame();
    if (action === "pause") this.togglePause();
  }

  release(action: Action) {
    this.held[action] = false;
  }

  private makePlayer(): Player {
    return {
      x: W / 2 - 25,
      y: PLAYER_Y,
      px: W / 2 - 25,
      py: PLAYER_Y,
      vx: 0,
      vy: 0,
      w: 50,
      h: 50,
      baseW: 50,
      baseH: 50,
      speed: 410,
      lives: 3,
      invulnerable: 0,
      fireCooldown: 0,
      rapidTimer: 0,
      spreadTimer: 0,
      shield: 0,
      magnetTimer: 0,
      laserTimer: 0,
      boomerangTimer: 0,
      bombTimer: 0,
      rainbowTimer: 0,
      gorillaTimer: 0,
      freezeFieldTimer: 0,
      timeSlowTimer: 0,
      special: 45,
      kongMode: false,
      kongTimer: 0,
      squash: 0,
    };
  }

  private startGame() {
    this.credits = Persistence.addCredit();
    this.audio.coinInsert();
    this.state = "playing";
    this.stateTime = 0;
    this.score = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.player = this.makePlayer();
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.pickups = [];
    this.hazards = [];
    this.dyingAliens = [];
    this.boss = null;
    this.formationDirection = 1;
    this.cheatUsed = false;
    this.waveDamageTaken = false;
    this.bossRushIndex = 0;
    this.activeEvent = null;
    this.eventTimer = 0;
    this.eventTickTimer = 0;
    this.eventCooldown = 18 + Math.random() * 10;
    this.highScore =
      this.mode === "daily"
        ? Persistence.getDailyRecord(this.dailyDateKey)
        : Persistence.getHighScore(this.mode);
    this.message =
      this.mode === "daily"
        ? `DAILY CHALLENGE · ${RANDOM_EVENT_META[this.dailyModifier].label}`
        : "WAVE 1 · BANANAS ARMED";
    this.messageTimer = 1.8;
    this.spawnWave();
    this.audio.chord(220);
    this.emitStatus(true);
  }

  private togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.stateTime = 0;
      this.audio.blip(180, 0.08, 0.025);
    } else if (this.state === "paused") {
      this.state = "playing";
      this.stateTime = 0;
      this.audio.blip(320, 0.08, 0.025);
    }
    this.emitStatus(true);
  }

  private toggleDisclosure() {
    this.disclosureOpen = !this.disclosureOpen;
    if (this.disclosureOpen) {
      this.audio.blip(440, 0.08, 0.02, "triangle");
      if (!Persistence.hasSeenDisclosure()) {
        Persistence.markDisclosureSeen();
        this.unlock("curdDisclosure");
      }
    }
  }

  private activateKongMode() {
    const player = this.player;
    player.kongMode = true;
    player.kongTimer = 26;
    player.lives = Math.max(player.lives, 99);
    player.rapidTimer = Math.max(player.rapidTimer, 26);
    player.spreadTimer = Math.max(player.spreadTimer, 26);
    player.shield = Math.max(player.shield, 26);
    this.cheatUsed = true;
    this.kongZapTimer = 0.4;
    this.message = "🦍 KONG MODE ENGAGED 🦍";
    this.messageTimer = 1.6;
    this.shake = Math.max(this.shake, 14);
    this.spawnBurst(
      player.x + player.w / 2,
      player.y + player.h / 2,
      "#ffb454",
      40,
      40
    );
    this.audio.chord(140);
    this.audio.glitch();
    this.unlock("kongMode");
    if (Persistence.unlockPilot("glitch")) {
      this.unlockedPilots.add("glitch");
      this.toast("PILOT UNLOCKED", "GLITCH joins the roster");
    }
    this.emitStatus(true);
  }

  private gorillaZap() {
    const player = this.player;
    const cx = player.x + player.w / 2;
    let hits = 0;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      if (Math.abs(enemy.x + enemy.w / 2 - cx) < 26) {
        enemy.hp -= player.kongMode ? 3 : 1.5;
        enemy.flash = 1;
        hits += 1;
        if (enemy.hp <= 0) this.killEnemy(enemy);
      }
    }
    if (hits > 0) {
      this.shake = Math.max(this.shake, 4);
      this.audio.blip(880, 0.05, 0.02, "sawtooth");
    }
    this.spawnBurst(cx, player.y - 10, "#ff4d4d", 6, 10);
  }

  private onKeyDown(event: KeyboardEvent) {
    if (!event.repeat) {
      if (event.code === "KeyQ" && this.state === "title") {
        this.cyclePilot();
        return;
      }
      if (
        event.code === "KeyM" &&
        (this.state === "title" || this.state === "gameOver")
      ) {
        this.cycleMode();
        return;
      }
      if (
        event.code === "KeyI" &&
        (this.state === "title" ||
          this.state === "gameOver" ||
          this.state === "paused")
      ) {
        this.toggleDisclosure();
        return;
      }
      if (this.state === "playing" && /^Key[A-Z]$/.test(event.code)) {
        const letter = event.code.slice(3).toLowerCase();
        this.curdBuffer = (this.curdBuffer + letter).slice(-4);
        if (this.curdBuffer === "curd") {
          this.activateKongMode();
          this.curdBuffer = "";
        }
      }
    }
    const action = this.keyAction(event.code);
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) this.press(action);
  }

  private onKeyUp(event: KeyboardEvent) {
    const action = this.keyAction(event.code);
    if (!action) return;
    event.preventDefault();
    this.release(action);
  }

  private onCanvasTap(event: PointerEvent) {
    if (this.state !== "playing") return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    if (x > 230 || y > 48) {
      this.tapCount = 0;
      return;
    }
    const now = performance.now();
    if (now - this.lastTapTime > 600) this.tapCount = 0;
    this.lastTapTime = now;
    this.tapCount += 1;
    if (this.tapCount >= 3) {
      this.tapCount = 0;
      this.activateKongMode();
    }
  }

  private keyAction(code: string): Action | undefined {
    if (code === "ArrowLeft" || code === "KeyA") return "left";
    if (code === "ArrowRight" || code === "KeyD") return "right";
    if (code === "Space" || code === "KeyX" || code === "KeyZ") return "fire";
    if (code === "ArrowUp" || code === "KeyW" || code === "KeyC")
      return "special";
    if (code === "Enter") return "start";
    if (code === "Escape" || code === "KeyP") return "pause";
    return undefined;
  }

  private loop = (time: number) => {
    if (!this.alive) return;
    if (!this.last) this.last = time;
    const delta = Math.min(MAX_FRAME_DELTA, (time - this.last) / 1000);
    this.last = time;
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - delta);
      this.render();
      this.frame = requestAnimationFrame(this.loop);
      return;
    }
    this.accumulator += delta;
    while (this.accumulator >= FIXED) {
      this.update(FIXED);
      this.accumulator -= FIXED;
    }
    this.renderAlpha = this.accumulator / FIXED;
    this.render();
    this.frame = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.stateTime += dt;
    this.titleClock += dt;
    this.shake = Math.max(0, this.shake - dt * 24);
    this.flash = Math.max(0, this.flash - dt * 3.4);
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    this.updateStars(dt);
    this.updateAchievementQueue(dt);

    if (this.state === "boot") {
      if (this.stateTime > 1.6) {
        this.state = "title";
        this.stateTime = 0;
        this.emitStatus(true);
      }
      this.just.clear();
      return;
    }
    if (this.state === "paused") {
      this.just.clear();
      return;
    }
    if (this.state === "title" || this.state === "gameOver") {
      this.updateAttract(dt);
      this.just.clear();
      return;
    }
    if (this.state === "bossIntro") {
      if (this.stateTime > 2.3) {
        this.state = "playing";
        this.stateTime = 0;
        this.emitStatus(true);
      }
      this.updateParticles(dt);
      this.just.clear();
      return;
    }
    if (this.state === "waveClear") {
      this.updateParticles(dt);
      this.updateDyingAliens(dt);
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.wave += 1;
        if (this.wave === 10) this.unlock("wave10");
        if (this.wave === 25) this.unlock("wave25");
        this.state = "playing";
        this.stateTime = 0;
        this.message =
          this.mode === "bossRush"
            ? "NEXT CHALLENGER"
            : this.wave % 5 === 0
              ? `BOSS WAVE ${this.wave}`
              : `WAVE ${this.wave}`;
        this.messageTimer = 1.4;
        this.spawnWave();
        this.emitStatus(true);
      }
      this.just.clear();
      return;
    }

    this.audio.tickMusic(dt, this.state, this.wave);
    this.updateRandomEvents(dt);
    const enemyDt = dt * this.enemyTimeScale();
    this.updatePlayer(dt);
    this.updateEnemies(enemyDt);
    this.updateBoss(enemyDt);
    this.updateHazards(enemyDt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);
    this.updateDyingAliens(dt);
    this.resolveCollisions();
    this.checkWaveClear();
    this.just.clear();
    this.emitStatus();
  }

  private enemyTimeScale(): number {
    if (this.player.freezeFieldTimer > 0) return 0;
    if (this.player.timeSlowTimer > 0) return 0.35;
    return 1;
  }

  private fireCooldownMultiplier(): number {
    return this.activeEvent === "powerSurge" ? 0.55 : 1;
  }

  private specialGainMultiplier(): number {
    return this.activeEvent === "powerSurge" ? 2 : 1;
  }

  private updateStars(dt: number) {
    const multiplier =
      (this.state === "playing" ? 1.4 : 0.55) *
      (this.activeEvent === "glitchedReality" ? 1.8 : 1);
    for (const star of this.stars) {
      star.y += star.speed * multiplier * dt;
      if (star.y > H + 4) {
        star.y = -4;
        star.x = (star.x * 1.73 + 113) % W;
      }
    }
  }

  private updateAttract(dt: number) {
    for (const particle of this.particles) {
      particle.px = particle.x;
      particle.py = particle.y;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter(particle => particle.life > 0);
    if (this.particles.length < 28 && Math.random() < dt * 8) {
      const pilot = PILOTS[this.pilot];
      this.particles.push({
        x: Math.random() * W,
        y: H + 8,
        px: 0,
        py: H + 8,
        vx: (Math.random() - 0.5) * 16,
        vy: -18 - Math.random() * 35,
        life: 3 + Math.random() * 3,
        maxLife: 6,
        size: 1 + Math.random() * 3,
        color: Math.random() > 0.5 ? pilot.primary : pilot.secondary,
        gravity: 0,
      });
    }
  }

  private updateAchievementQueue(dt: number) {
    for (const toast of this.achievementQueue) toast.timer -= dt;
    this.achievementQueue = this.achievementQueue.filter(
      toast => toast.timer > 0
    );
  }

  private updateRandomEvents(dt: number) {
    if (this.mode === "daily" && !this.activeEvent) {
      this.activeEvent = this.dailyModifier;
      this.eventTimer = 999999;
      this.eventTickTimer = 0;
    }
    if (this.activeEvent) {
      this.eventTickTimer -= dt;
      switch (this.activeEvent) {
        case "bananaStorm":
          if (this.eventTickTimer <= 0) {
            this.dropPickup(20 + Math.random() * (W - 40), -20);
            this.eventTickTimer = 0.35;
          }
          break;
        case "meteorShower":
          if (this.eventTickTimer <= 0) {
            this.spawnMeteorHazard(1);
            this.eventTickTimer = 0.5;
          }
          break;
        case "mysteryCrate":
          if (this.eventTickTimer <= 0) {
            this.dropPickup(20 + Math.random() * (W - 40), -20, "mystery");
            this.eventTickTimer = 1.4;
          }
          break;
        default:
          break;
      }
      if (this.mode !== "daily") {
        this.eventTimer -= dt;
        if (this.eventTimer <= 0) {
          this.activeEvent = null;
          if (this.player.lives > 0) this.unlock("eventSurvivor");
          this.eventCooldown = 24 + Math.random() * 20;
        }
      }
      return;
    }
    this.eventCooldown -= dt;
    if (this.eventCooldown <= 0 && this.state === "playing" && !this.boss) {
      this.triggerRandomEvent();
    }
  }

  private triggerRandomEvent(forced?: RandomEventId) {
    const ids = Object.keys(RANDOM_EVENT_META) as RandomEventId[];
    const id = forced ?? ids[Math.floor(Math.random() * ids.length)];
    this.activeEvent = id;
    const meta = RANDOM_EVENT_META[id];
    this.eventTimer = meta.duration;
    this.eventTickTimer = 0;
    this.message = meta.announce;
    this.messageTimer = 1.6;
    this.shake = Math.max(this.shake, 8);
    this.audio.chord(260);
    if (id === "glitchedReality") this.audio.glitch();
    if (id === "goldenWave") {
      for (const enemy of this.enemies) enemy.golden = true;
    }
  }

  private updatePlayer(dt: number) {
    const player = this.player;
    player.px = player.x;
    player.py = player.y;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    player.rapidTimer = Math.max(0, player.rapidTimer - dt);
    player.spreadTimer = Math.max(0, player.spreadTimer - dt);
    player.shield = Math.max(0, player.shield - dt);
    player.magnetTimer = Math.max(0, player.magnetTimer - dt);
    player.laserTimer = Math.max(0, player.laserTimer - dt);
    player.boomerangTimer = Math.max(0, player.boomerangTimer - dt);
    player.bombTimer = Math.max(0, player.bombTimer - dt);
    player.rainbowTimer = Math.max(0, player.rainbowTimer - dt);
    player.gorillaTimer = Math.max(0, player.gorillaTimer - dt);
    player.freezeFieldTimer = Math.max(0, player.freezeFieldTimer - dt);
    player.timeSlowTimer = Math.max(0, player.timeSlowTimer - dt);
    if (player.kongMode) {
      player.kongTimer -= dt;
      if (player.kongTimer <= 0) player.kongMode = false;
    }
    player.squash = Math.max(0, player.squash - dt * 4);

    const direction = Number(this.held.right) - Number(this.held.left);
    const target = direction * player.speed;
    const lowGrav = this.activeEvent === "lowGravity";
    const acceleration = (direction === 0 ? 13 : 18) * (lowGrav ? 0.55 : 1);
    player.vx += (target - player.vx) * clamp(acceleration * dt, 0, 1);
    player.x += player.vx * dt;
    player.x = clamp(player.x, 18, W - player.w - 18);
    if (direction !== 0 && Math.abs(player.vx) > player.speed * 0.7)
      player.squash = Math.max(player.squash, 0.12);

    if (this.held.fire && player.fireCooldown <= 0) this.fireBanana();
    if (
      (this.just.has("special") ||
        (this.held.special && player.special >= 100)) &&
      player.special >= 100
    )
      this.fireSpecial();

    if (player.kongMode || player.gorillaTimer > 0) {
      this.kongZapTimer -= dt;
      if (this.kongZapTimer <= 0) {
        this.gorillaZap();
        this.kongZapTimer = player.kongMode ? 0.85 : 1.2;
      }
    }
  }

  private fireBanana() {
    const player = this.player;
    const rapid = player.rapidTimer > 0;
    const spread = player.spreadTimer > 0;
    const originX = player.x + player.w / 2;
    const originY = player.y + 4;
    const angles = spread ? [-0.24, 0, 0.24] : [0];
    let kind: ProjectileKind = "banana";
    let maxPierce = 0;
    let damage = 1;
    let r = 8;
    let speed = 650;
    let life = 1.5;
    if (player.bombTimer > 0) {
      kind = "bomb";
      r = 11;
      life = 1.7;
    } else if (player.laserTimer > 0) {
      kind = "laser";
      maxPierce = 3;
      r = 6;
      speed = 780;
      life = 1.1;
    } else if (player.boomerangTimer > 0) {
      kind = "boomerang";
      r = 9;
      life = 2.4;
    }
    const rainbow = player.rainbowTimer > 0;
    if (rainbow) damage += 1;
    if (player.kongMode) damage += 2;
    else if (player.gorillaTimer > 0) damage += 1;
    for (const angle of angles) {
      this.projectiles.push({
        x: originX - 7,
        y: originY,
        px: originX - 7,
        py: originY,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        r,
        damage,
        hostile: false,
        life,
        kind,
        pierced: 0,
        maxPierce,
        rainbow,
        returning: false,
        homeY: originY,
      });
    }
    player.fireCooldown =
      (rapid ? 0.085 : 0.16) * this.fireCooldownMultiplier();
    player.squash = Math.max(player.squash, 0.05);
    this.spawnBurst(
      originX,
      originY,
      rainbow ? `hsl(${(this.titleClock * 200) % 360},80%,60%)` : "#ffe774",
      3,
      20
    );
    this.audio.blip(rapid ? 640 : 520, 0.045, 0.018, "square");
  }

  private fireSpecial() {
    const player = this.player;
    player.special = 0;
    const originX = player.x + player.w / 2;
    for (let index = -4; index <= 4; index += 1) {
      const angle = index * 0.12;
      const speed = 740;
      this.projectiles.push({
        x: originX - 14,
        y: player.y - 4,
        px: originX - 14,
        py: player.y - 4,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        r: 14,
        damage: 4,
        hostile: false,
        life: 1.4,
        kind: "banana",
        pierced: 0,
        maxPierce: 0,
        rainbow: false,
        returning: false,
      });
    }
    this.shake = 12;
    this.flash = 0.55;
    this.message = "BANANA NOVA";
    this.messageTimer = 0.75;
    this.audio.chord(this.pilot === "bolt" ? 330 : 392);
  }

  private spawnWave() {
    this.enemies = [];
    this.projectiles = this.projectiles.filter(
      projectile => !projectile.hostile
    );
    this.pickups = [];
    this.hazards = [];
    this.boss = null;
    this.formationDirection = 1;
    this.waveDamageTaken = false;
    this.enemyShotTimer = Math.max(0.38, 1.4 - this.wave * 0.045);
    if (this.mode === "bossRush") {
      this.spawnBoss(true);
      return;
    }
    if (this.wave % 5 === 0) {
      this.spawnBoss(false);
      return;
    }
    const rows = Math.min(4, 2 + Math.floor(this.wave / 3));
    const columns = Math.min(10, 6 + Math.floor(this.wave / 2));
    const gapX = 68;
    const gapY = 54;
    const startX = W / 2 - ((columns - 1) * gapX) / 2 - 22;
    const golden = this.activeEvent === "goldenWave";
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = startX + column * gapX;
        const y = 78 + row * gapY;
        let kind: EnemyKind = "scout";
        if (row === 0 && this.wave > 3) kind = "spinner";
        if (row === rows - 1 && this.wave > 6) kind = "tank";
        if (this.wave > 5 && Math.random() < 0.08) kind = "shield";
        if (this.wave > 7 && Math.random() < 0.07) kind = "splitter";
        if (this.wave > 9 && Math.random() < 0.07) kind = "teleporter";
        if (this.wave > 4 && Math.random() < 0.06) kind = "kamikaze";
        const baseHp =
          kind === "tank"
            ? 3
            : kind === "spinner"
              ? 2
              : kind === "shield"
                ? 2
                : kind === "splitter"
                  ? 2
                  : 1;
        const elite =
          this.wave > 8 &&
          Math.random() < 0.05 + Math.min(0.12, this.wave * 0.002);
        const hp = elite ? baseHp * 2 : baseHp;
        this.enemies.push({
          id: this.nextId++,
          x,
          y,
          px: x,
          py: y,
          vx: 0,
          vy: 0,
          w: 44,
          h: 36,
          hp,
          maxHp: hp,
          kind,
          phase: column * 0.48 + row * 0.72,
          flash: 0,
          elite,
          isChild: false,
          shieldHp: kind === "shield" ? 3 : 0,
          shieldMax: kind === "shield" ? 3 : 0,
          teleportTimer: kind === "teleporter" ? 2 + Math.random() * 2 : 0,
          diving: false,
          diveDelay: 1.5 + Math.random() * 3,
          golden,
        });
      }
    }
  }

  private spawnBoss(rush: boolean) {
    const bossIndex = rush ? this.bossRushIndex : Math.floor(this.wave / 5) - 1;
    const normalized =
      ((bossIndex % BOSSES.length) + BOSSES.length) % BOSSES.length;
    const data = BOSSES[normalized];
    const lap = rush
      ? Math.floor(this.bossRushIndex / BOSSES.length)
      : Math.floor(this.wave / (BOSSES.length * 5));
    const maxHp = 45 + this.wave * 8 + lap * 40;
    this.boss = {
      name: data.name,
      symbol: data.symbol,
      color: data.color,
      tagline: data.tagline,
      x: W / 2 - 82,
      y: -160,
      px: W / 2 - 82,
      py: -160,
      vx: 0,
      vy: 0,
      hp: maxHp,
      maxHp,
      w: 164,
      h: 112,
      phase: 0,
      shotTimer: 1.1,
      flash: 0,
      attackPhase: 0,
      announcedPhase: 0,
      hazardTimer: 3.4,
      entering: true,
      enterProgress: 0,
    };
    this.state = "bossIntro";
    this.stateTime = 0;
    this.message = `${data.name} — ${data.tagline}`;
    this.messageTimer = 2.3;
    this.audio.siren();
    this.emitStatus(true);
  }

  private spawnMeteorHazard(count = 1) {
    for (let index = 0; index < count; index += 1) {
      const x = 40 + Math.random() * (W - 80);
      this.hazards.push({
        x,
        y: -20,
        px: x,
        py: -20,
        vx: 0,
        vy: 0,
        w: 26,
        h: 26,
        kind: "meteor",
        telegraph: 0.6,
        life: 3,
        dealt: false,
      });
    }
  }

  private updateEnemies(dt: number) {
    if (this.enemies.length === 0) return;
    const alive = this.enemies.filter(enemy => enemy.hp > 0);
    if (alive.length === 0) return;
    const speedBase =
      42 +
      this.wave * (this.mode === "endless" ? 6 : 5) +
      (1 - alive.length / Math.max(1, this.enemies.length)) * 75;
    const panic = this.activeEvent === "alienPanic";
    let hitEdge = false;
    const playerBox = {
      x: this.player.x + 8,
      y: this.player.y + 8,
      w: this.player.w - 16,
      h: this.player.h - 10,
    };
    for (const enemy of alive) {
      enemy.px = enemy.x;
      enemy.py = enemy.y;
      enemy.flash = Math.max(0, enemy.flash - dt * 6);
      enemy.phase += dt * (enemy.kind === "spinner" ? 4.2 : 2.1);
      if (enemy.kind === "shield")
        enemy.shieldHp = Math.min(enemy.shieldMax, enemy.shieldHp + dt * 4);
      if (enemy.kind === "teleporter") {
        enemy.teleportTimer -= dt;
        if (enemy.teleportTimer <= 0) {
          this.spawnBurst(
            enemy.x + enemy.w / 2,
            enemy.y + enemy.h / 2,
            "#c9a5ff",
            10,
            30
          );
          enemy.x = clamp(
            enemy.x + (Math.random() - 0.5) * 260,
            18,
            W - enemy.w - 18
          );
          this.spawnBurst(
            enemy.x + enemy.w / 2,
            enemy.y + enemy.h / 2,
            "#c9a5ff",
            10,
            30
          );
          enemy.teleportTimer = 2.6 + Math.random() * 2.2;
        }
      }
      if (enemy.kind === "kamikaze" && !enemy.diving) {
        enemy.diveDelay -= dt;
        if (enemy.diveDelay <= 0 && Math.random() < dt * 0.35)
          enemy.diving = true;
      }
      if (enemy.kind === "kamikaze" && enemy.diving) {
        const targetX = this.player.x + this.player.w / 2;
        const dx = targetX - (enemy.x + enemy.w / 2);
        enemy.x += clamp(dx, -220 * dt, 220 * dt);
        enemy.y += (260 + this.wave * 3) * dt;
        const box = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
        if (overlap(box, playerBox)) {
          this.spawnBurst(
            enemy.x + enemy.w / 2,
            enemy.y + enemy.h / 2,
            this.enemyColor(enemy.kind),
            20,
            60
          );
          this.damagePlayer();
          enemy.hp = 0;
        }
        continue;
      }
      let speed = speedBase;
      let dir = this.formationDirection;
      if (panic) {
        dir *= Math.random() < 0.02 ? -1 : 1;
        speed *= 1.4;
      }
      enemy.x += speed * dir * dt;
      if (panic) enemy.y += Math.sin(enemy.phase * 3) * 24 * dt;
      if (enemy.x < 18 || enemy.x + enemy.w > W - 18) hitEdge = true;
    }
    if (hitEdge) {
      this.formationDirection *= -1;
      const dropAmount = this.activeEvent === "lowGravity" ? 8 : 16;
      for (const enemy of alive) {
        if (enemy.kind === "kamikaze" && enemy.diving) continue;
        enemy.x = clamp(enemy.x, 18, W - enemy.w - 18);
        enemy.y += dropAmount;
      }
    }
    this.enemyShotTimer -= dt;
    if (this.enemyShotTimer <= 0) {
      const shooters = alive.filter(
        enemy => !(enemy.kind === "kamikaze" && enemy.diving)
      );
      if (shooters.length > 0) {
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        const targetX = this.player.x + this.player.w / 2;
        const dx = targetX - (shooter.x + shooter.w / 2);
        const length = Math.max(1, Math.hypot(dx, H - shooter.y));
        const projectileSpeed = 220 + this.wave * 7;
        this.projectiles.push({
          x: shooter.x + shooter.w / 2 - 5,
          y: shooter.y + shooter.h,
          px: shooter.x + shooter.w / 2 - 5,
          py: shooter.y + shooter.h,
          vx: (dx / length) * projectileSpeed,
          vy: ((H - shooter.y) / length) * projectileSpeed,
          r: 6,
          damage: 1,
          hostile: true,
          life: 3,
          kind: "bolt",
          pierced: 0,
          maxPierce: 0,
          rainbow: false,
          returning: false,
        });
        this.audio.blip(150, 0.06, 0.01, "sawtooth");
      }
      this.enemyShotTimer =
        Math.max(0.34, 1.32 - this.wave * 0.035) * (0.75 + Math.random() * 0.6);
    }
    for (const enemy of alive) {
      if (enemy.kind === "kamikaze" && enemy.diving) {
        if (enemy.y > H + 20) enemy.hp = 0;
        continue;
      }
      if (enemy.y + enemy.h > PLAYER_Y + 8) {
        this.damagePlayer();
        enemy.hp = 0;
      }
    }
    this.enemies = this.enemies.filter(enemy => enemy.hp > 0);
  }

  private updateBoss(dt: number) {
    const boss = this.boss;
    if (!boss) return;
    boss.px = boss.x;
    boss.py = boss.y;
    boss.phase += dt;
    boss.flash = Math.max(0, boss.flash - dt * 7);
    const targetX =
      W / 2 -
      boss.w / 2 +
      Math.sin(boss.phase * (0.8 + this.wave * 0.01)) * 280;
    const targetY = 48 + Math.sin(boss.phase * 1.7) * 20;
    if (boss.entering) {
      boss.enterProgress = Math.min(1, boss.enterProgress + dt / 0.8);
      boss.x = targetX;
      boss.y = lerp(-160, targetY, easeOutCubic(boss.enterProgress));
      if (boss.enterProgress >= 1) boss.entering = false;
      return;
    }
    boss.x = targetX;
    boss.y = targetY;

    const ratio = boss.hp / boss.maxHp;
    const newPhase: BossAttackPhase = ratio < 0.34 ? 2 : ratio < 0.67 ? 1 : 0;
    if (newPhase > boss.announcedPhase) {
      boss.announcedPhase = newPhase;
      this.shake = Math.max(this.shake, 16);
      this.flash = Math.max(this.flash, 0.6);
      this.hitStop = Math.max(this.hitStop, 0.07);
      this.message =
        BOSS_ENRAGE_LINES[boss.name] ??
        `${boss.name} ENTERS PHASE ${newPhase + 1}`;
      this.messageTimer = 1.4;
      this.audio.chord(160 + newPhase * 40);
      this.spawnBurst(
        boss.x + boss.w / 2,
        boss.y + boss.h / 2,
        boss.color,
        40,
        60
      );
    }
    boss.attackPhase = newPhase;
    const phaseMul = 1 + boss.attackPhase * 0.35;
    boss.shotTimer -= dt;
    if (boss.shotTimer <= 0) {
      const bursts =
        3 + Math.min(4, Math.floor(this.wave / 10)) + boss.attackPhase;
      for (let index = 0; index < bursts; index += 1) {
        const spread = (index - (bursts - 1) / 2) * 0.18;
        const speed = (250 + this.wave * 4) * phaseMul;
        this.projectiles.push({
          x: boss.x + boss.w / 2 - 6,
          y: boss.y + boss.h - 10,
          px: boss.x + boss.w / 2 - 6,
          py: boss.y + boss.h - 10,
          vx: Math.sin(spread) * speed,
          vy: Math.cos(spread) * speed,
          r: 8,
          damage: 1,
          hostile: true,
          life: 3,
          kind: "bolt",
          pierced: 0,
          maxPierce: 0,
          rainbow: false,
          returning: false,
        });
      }
      boss.shotTimer = Math.max(0.3, (1.08 - this.wave * 0.02) / phaseMul);
      this.audio.blip(92, 0.12, 0.028, "sawtooth");
    }
    boss.hazardTimer -= dt;
    if (boss.hazardTimer <= 0) {
      this.spawnMeteorHazard(2 + boss.attackPhase);
      boss.hazardTimer = Math.max(2.2, 5 - boss.attackPhase * 1.1);
    }
  }

  private updateHazards(dt: number) {
    for (const hazard of this.hazards) {
      hazard.px = hazard.x;
      hazard.py = hazard.y;
      if (hazard.telegraph > 0) {
        hazard.telegraph -= dt;
        continue;
      }
      hazard.vy = Math.min(460, hazard.vy + 900 * dt);
      hazard.y += hazard.vy * dt;
      hazard.life -= dt;
    }
    this.hazards = this.hazards.filter(
      hazard => hazard.life > 0 && hazard.y < H + 50
    );
  }

  private updateProjectiles(dt: number) {
    const slow = this.enemyTimeScale();
    for (const projectile of this.projectiles) {
      projectile.px = projectile.x;
      projectile.py = projectile.y;
      const scale = projectile.hostile ? slow : 1;
      projectile.x += projectile.vx * dt * scale;
      projectile.y += projectile.vy * dt * scale;
      projectile.life -= dt;
      if (
        projectile.kind === "boomerang" &&
        !projectile.returning &&
        projectile.y < H * 0.22
      ) {
        projectile.returning = true;
        projectile.vy = Math.abs(projectile.vy) * 0.9;
        projectile.vx += (Math.random() - 0.5) * 160;
      }
    }
    this.projectiles = this.projectiles.filter(
      projectile =>
        projectile.life > 0 &&
        projectile.x > -40 &&
        projectile.x < W + 40 &&
        projectile.y > -60 &&
        projectile.y < H + 60
    );
  }

  private updatePickups(dt: number) {
    const magnetActive = this.player.magnetTimer > 0;
    const gravMul = this.activeEvent === "lowGravity" ? 0.35 : 1;
    for (const pickup of this.pickups) {
      pickup.px = pickup.x;
      pickup.py = pickup.y;
      if (magnetActive) {
        const dx = this.player.x + this.player.w / 2 - pickup.x;
        const dy = this.player.y + this.player.h / 2 - pickup.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const pull = 420;
        pickup.x += (dx / dist) * pull * dt;
        pickup.y += (dy / dist) * pull * dt;
      } else {
        pickup.y += pickup.vy * gravMul * dt;
        pickup.x += pickup.vx * dt;
      }
      pickup.life -= dt;
    }
    this.pickups = this.pickups.filter(
      pickup => pickup.life > 0 && pickup.y < H + 30
    );
  }

  private updateParticles(dt: number) {
    for (const particle of this.particles) {
      particle.px = particle.x;
      particle.py = particle.y;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter(particle => particle.life > 0);
  }

  private updateDyingAliens(dt: number) {
    for (const alien of this.dyingAliens) {
      alien.vy += 260 * dt;
      alien.y += alien.vy * dt;
      alien.rotation += 6 * dt;
      alien.timer -= dt;
    }
    this.dyingAliens = this.dyingAliens.filter(
      alien => alien.timer > 0 && alien.y < H + 60
    );
  }

  private explodeBomb(x: number, y: number, radius: number, damage: number) {
    this.spawnBurst(x, y, "#ff8a3d", 34, 70);
    this.shake = Math.max(this.shake, 10);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = Math.hypot(
        enemy.x + enemy.w / 2 - x,
        enemy.y + enemy.h / 2 - y
      );
      if (dist > radius) continue;
      if (enemy.kind === "shield" && enemy.shieldHp > 0) {
        enemy.shieldHp -= damage;
        enemy.flash = 1;
        continue;
      }
      enemy.hp -= damage;
      enemy.flash = 1;
      if (enemy.hp <= 0) this.killEnemy(enemy);
    }
    if (this.boss) {
      const dist = Math.hypot(
        this.boss.x + this.boss.w / 2 - x,
        this.boss.y + this.boss.h / 2 - y
      );
      if (dist < radius + 40) {
        this.boss.hp -= damage;
        this.boss.flash = 1;
        this.score += 8 * damage;
        if (this.boss.hp <= 0) this.killBoss();
      }
    }
  }

  private resolveCollisions() {
    const playerBox = {
      x: this.player.x + 8,
      y: this.player.y + 8,
      w: this.player.w - 16,
      h: this.player.h - 10,
    };
    for (const projectile of this.projectiles) {
      if (projectile.life <= 0) continue;
      const projectileBox = {
        x: projectile.x - projectile.r,
        y: projectile.y - projectile.r,
        w: projectile.r * 2,
        h: projectile.r * 2,
      };
      if (projectile.hostile) {
        if (overlap(projectileBox, playerBox)) {
          projectile.life = 0;
          this.damagePlayer();
        }
        continue;
      }
      let hit = false;
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || !overlap(projectileBox, enemy)) continue;
        if (projectile.kind === "bomb") {
          this.explodeBomb(projectile.x, projectile.y, 74, 3);
          projectile.life = 0;
          hit = true;
          break;
        }
        if (enemy.kind === "shield" && enemy.shieldHp > 0) {
          enemy.shieldHp -= projectile.damage;
          enemy.flash = 1;
          this.spawnBurst(projectile.x, projectile.y, "#8fe6ff", 6, 40);
          this.audio.blip(300, 0.03, 0.01, "square");
          if (
            projectile.kind === "laser" &&
            projectile.pierced < projectile.maxPierce
          )
            projectile.pierced += 1;
          else projectile.life = 0;
          hit = true;
          break;
        }
        enemy.hp -= projectile.damage;
        enemy.flash = 1;
        hit = true;
        if (enemy.hp <= 0) this.killEnemy(enemy);
        else this.audio.blip(240, 0.035, 0.012, "square");
        if (
          projectile.kind === "laser" &&
          projectile.pierced < projectile.maxPierce
        )
          projectile.pierced += 1;
        else projectile.life = 0;
        break;
      }
      if (hit) continue;
      const boss = this.boss;
      if (boss && overlap(projectileBox, boss)) {
        if (projectile.kind === "bomb") {
          this.explodeBomb(projectile.x, projectile.y, 90, 6);
          projectile.life = 0;
        } else {
          boss.hp -= projectile.damage;
          boss.flash = 1;
          projectile.life = 0;
          this.score += 8 * projectile.damage;
          this.player.special = clamp(
            this.player.special +
              1.8 * projectile.damage * this.specialGainMultiplier(),
            0,
            100
          );
          this.spawnBurst(projectile.x, projectile.y, boss.color, 4, 40);
          if (
            projectile.kind === "laser" &&
            projectile.pierced < projectile.maxPierce
          ) {
            projectile.pierced += 1;
            projectile.life = Math.max(projectile.life, 0.1);
          }
          if (boss.hp <= 0) this.killBoss();
          else this.audio.blip(128, 0.04, 0.014, "square");
        }
      }
    }

    for (const hazard of this.hazards) {
      if (hazard.dealt || hazard.telegraph > 0) continue;
      const box = {
        x: hazard.x - hazard.w / 2,
        y: hazard.y - hazard.h / 2,
        w: hazard.w,
        h: hazard.h,
      };
      if (overlap(box, playerBox)) {
        hazard.dealt = true;
        hazard.life = 0;
        this.damagePlayer();
        this.spawnBurst(hazard.x, hazard.y, "#ff7f32", 20, 60);
      }
    }

    for (const pickup of this.pickups) {
      const box = {
        x: pickup.x - pickup.r,
        y: pickup.y - pickup.r,
        w: pickup.r * 2,
        h: pickup.r * 2,
      };
      if (!overlap(box, playerBox)) continue;
      pickup.life = 0;
      this.applyPickupEffect(pickup.kind);
      const collected = Persistence.recordPickupCollected(pickup.kind);
      if (collected.size >= Object.keys(PICKUP_META).length)
        this.unlock("collector");
      this.score += 100;
      this.message = `${PICKUP_META[pickup.kind].label} ONLINE`;
      this.messageTimer = 0.9;
      this.audio.chord(440);
      this.spawnBurst(
        pickup.x,
        pickup.y,
        PICKUP_META[pickup.kind].color,
        18,
        55
      );
      this.refreshBananaSkin();
    }
  }

  private applyPickupEffect(kind: PickupKind) {
    const player = this.player;
    switch (kind) {
      case "rapid":
        player.rapidTimer = 9;
        break;
      case "spread":
        player.spreadTimer = 9;
        break;
      case "shield":
        player.shield = 12;
        break;
      case "special":
        player.special = clamp(player.special + 55, 0, 100);
        break;
      case "magnet":
        player.magnetTimer = 10;
        break;
      case "laser":
        player.laserTimer = 8;
        break;
      case "freeze":
        player.freezeFieldTimer = 5;
        break;
      case "boomerang":
        player.boomerangTimer = 10;
        break;
      case "bomb":
        player.bombTimer = 10;
        break;
      case "rainbow":
        player.rainbowTimer = 10;
        break;
      case "gorilla":
        player.gorillaTimer = 8;
        this.kongZapTimer = Math.min(this.kongZapTimer || 1, 0.6);
        break;
      case "timeSlow":
        player.timeSlowTimer = 6;
        break;
      case "mystery": {
        const others = (Object.keys(PICKUP_META) as PickupKind[]).filter(
          candidate => candidate !== "mystery"
        );
        const pick = others[Math.floor(Math.random() * others.length)];
        this.applyPickupEffect(pick);
        break;
      }
      default:
        break;
    }
  }

  private killEnemy(enemy: Enemy) {
    let value =
      enemy.kind === "tank"
        ? 80
        : enemy.kind === "spinner"
          ? 55
          : enemy.kind === "shield"
            ? 70
            : enemy.kind === "splitter"
              ? 65
              : enemy.kind === "teleporter"
                ? 60
                : enemy.kind === "kamikaze"
                  ? 50
                  : 35;
    if (enemy.elite) value *= 2;
    if (enemy.golden) value *= 3;
    this.score += value + this.wave * 3;
    const gain =
      (enemy.kind === "tank" ? 12 : 7) * this.specialGainMultiplier();
    this.player.special = clamp(this.player.special + gain, 0, 100);
    const color = enemy.golden ? "#ffe774" : this.enemyColor(enemy.kind);
    this.spawnBurst(
      enemy.x + enemy.w / 2,
      enemy.y + enemy.h / 2,
      color,
      enemy.elite ? 24 : 15,
      55
    );
    this.shake = Math.max(
      this.shake,
      enemy.kind === "tank" ? 5 : enemy.elite ? 7 : 2.5
    );
    if (enemy.elite || enemy.kind === "tank")
      this.hitStop = Math.max(this.hitStop, 0.045);
    if (!this.achievementsCache.has("firstBlood")) this.unlock("firstBlood");
    if (enemy.kind === "splitter" && !enemy.isChild)
      this.spawnSplitterChildren(enemy);
    if (Math.random() < 0.11)
      this.dropPickup(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    if (Math.random() < 0.4) {
      this.dyingAliens.push({
        x: enemy.x + enemy.w / 2,
        y: enemy.y + enemy.h / 2,
        vy: -90,
        rotation: 0,
        timer: 0.9,
        emoji:
          ABSURD_DEATH_EMOJI[
            Math.floor(Math.random() * ABSURD_DEATH_EMOJI.length)
          ],
      });
    }
    this.checkScoreAchievements();
    this.audio.blip(enemy.kind === "tank" ? 120 : 190, 0.07, 0.026, "square");
  }

  private spawnSplitterChildren(enemy: Enemy) {
    for (const dir of [-1, 1]) {
      const x = clamp(enemy.x + dir * 18, 18, W - 30);
      const y = enemy.y;
      this.enemies.push({
        id: this.nextId++,
        x,
        y,
        px: x,
        py: y,
        vx: 0,
        vy: 0,
        w: 26,
        h: 22,
        hp: 1,
        maxHp: 1,
        kind: "scout",
        phase: Math.random() * Math.PI * 2,
        flash: 0.6,
        elite: false,
        isChild: true,
        shieldHp: 0,
        shieldMax: 0,
        teleportTimer: 0,
        diving: false,
        diveDelay: 0,
        golden: enemy.golden,
      });
    }
    this.spawnBurst(
      enemy.x + enemy.w / 2,
      enemy.y + enemy.h / 2,
      "#b98bff",
      12,
      55
    );
  }

  private dropPickup(x: number, y: number, forceKind?: PickupKind) {
    const kind = forceKind ?? this.weightedPickupKind();
    this.pickups.push({
      x,
      y,
      px: x,
      py: y,
      vx: (Math.random() - 0.5) * 42,
      vy: 78,
      kind,
      r: 14,
      life: 8,
    });
  }

  private weightedPickupKind(): PickupKind {
    const entries = Object.entries(PICKUP_META) as [
      PickupKind,
      { weight: number },
    ][];
    const total = entries.reduce((sum, [, meta]) => sum + meta.weight, 0);
    let roll = Math.random() * total;
    for (const [kind, meta] of entries) {
      roll -= meta.weight;
      if (roll <= 0) return kind;
    }
    return "rapid";
  }

  private killBoss() {
    const boss = this.boss;
    if (!boss) return;
    this.score += 2500 + this.wave * 120;
    this.player.special = 100;
    this.spawnBurst(
      boss.x + boss.w / 2,
      boss.y + boss.h / 2,
      boss.color,
      60,
      60
    );
    this.spawnBurst(
      boss.x + boss.w / 2 - 40,
      boss.y + boss.h / 2,
      "#ffe774",
      30,
      55
    );
    this.spawnBurst(
      boss.x + boss.w / 2 + 40,
      boss.y + boss.h / 2,
      "#ffffff",
      30,
      55
    );
    this.shake = 20;
    this.flash = 0.9;
    this.hitStop = Math.max(this.hitStop, 0.1);
    this.message = `${boss.name} SPLIT OPEN`;
    this.messageTimer = 1.6;
    this.boss = null;
    this.audio.chord(196);
    this.unlock("bossSlayer");
    if (Persistence.unlockPilot("rex")) {
      this.unlockedPilots.add("rex");
      this.toast("PILOT UNLOCKED", "REX joins the roster");
    }
    if (this.mode === "bossRush") {
      this.bossRushIndex += 1;
      if (this.bossRushIndex % BOSSES.length === 0)
        this.unlock("bossRushChampion");
    }
    this.checkScoreAchievements();
    this.refreshBananaSkin();
  }

  private damagePlayer() {
    const player = this.player;
    this.waveDamageTaken = true;
    if (player.invulnerable > 0) return;
    if (player.shield > 0) {
      player.shield = 0;
      player.invulnerable = 0.7;
      player.squash = Math.max(player.squash, 0.2);
      this.message = "SHIELD POP";
      this.messageTimer = 0.7;
      this.spawnBurst(
        player.x + player.w / 2,
        player.y + player.h / 2,
        "#75ffd1",
        24,
        55
      );
      this.audio.blip(700, 0.12, 0.03, "triangle");
      return;
    }
    if (player.kongMode) return;
    player.lives -= 1;
    player.invulnerable = 2;
    player.squash = Math.max(player.squash, 0.32);
    player.x = W / 2 - player.w / 2;
    player.vx = 0;
    this.shake = 14;
    this.flash = 0.65;
    this.hitStop = Math.max(this.hitStop, 0.06);
    this.spawnBurst(
      player.x + player.w / 2,
      player.y + player.h / 2,
      PILOTS[this.pilot].primary,
      28,
      55
    );
    this.audio.blip(78, 0.28, 0.055, "sawtooth");
    if (player.lives <= 0) this.endGame();
    this.emitStatus(true);
  }

  private endGame() {
    this.state = "gameOver";
    this.stateTime = 0;
    this.projectiles = [];
    this.enemies = [];
    this.boss = null;
    this.activeEvent = null;
    const scoreValid = !this.cheatUsed;
    if (scoreValid) {
      if (this.mode === "daily") {
        const record = Persistence.getDailyRecord(this.dailyDateKey);
        if (this.score > record) {
          Persistence.setDailyRecord(this.dailyDateKey, this.score);
          this.highScore = this.score;
        }
      } else if (this.score > this.highScore) {
        this.highScore = this.score;
        Persistence.setHighScore(this.mode, this.highScore);
      }
    }
    if (!scoreValid && this.score > this.highScore) {
      this.message = "CHEAT RUN — SCORE NOT RECORDED";
    } else if (scoreValid && this.score >= this.highScore && this.score > 0) {
      this.message = "NEW CABINET RECORD";
    } else {
      this.message = "THE MOON TOOK THE LAST BANANA";
    }
    if (this.mode === "daily") this.unlock("dailyChallenger");
    this.messageTimer = 99;
    this.audio.chord(82);
    this.refreshBananaSkin();
    this.emitStatus(true);
  }

  private checkWaveClear() {
    if (this.enemies.length > 0 || this.boss) return;
    if (this.state !== "playing") return;
    this.state = "waveClear";
    this.stateTime = 0;
    this.waveTimer = 1.45;
    this.score += 250 + this.wave * 60;
    this.player.special = clamp(this.player.special + 18, 0, 100);
    this.message = "SECTOR CLEAN";
    this.messageTimer = 1.2;
    this.audio.chord(294);
    this.unlock("sectorClean");
    if (!this.waveDamageTaken) this.unlock("noHitWave");
    this.checkScoreAchievements();
    this.emitStatus(true);
  }

  private checkScoreAchievements() {
    if (this.score >= 25000) this.unlock("richMonkey");
    if (this.mode === "endless" && this.score >= 50000)
      this.unlock("endlessLegend");
  }

  private refreshBananaSkin() {
    const collected = Persistence.getCollectedPickups();
    let skin: "classic" | "gold" | "rainbow" = "classic";
    const bestScore = Math.max(
      Persistence.getHighScore("classic"),
      Persistence.getHighScore("endless"),
      Persistence.getHighScore("bossRush"),
      this.score
    );
    if (bestScore >= 15000) skin = "gold";
    if (collected.has("rainbow")) skin = "rainbow";
    if (skin !== this.bananaSkin) {
      this.bananaSkin = skin;
      Persistence.setBananaSkin(skin);
    }
  }

  private unlock(id: AchievementId) {
    if (this.achievementsCache.has(id)) return;
    this.achievementsCache.add(id);
    Persistence.unlockAchievement(id);
    this.toast(ACHIEVEMENTS[id].title, ACHIEVEMENTS[id].desc);
  }

  private toast(title: string, desc: string) {
    this.achievementQueue.push({ title, desc, timer: 3.6 });
    this.audio.achievement();
  }

  private spawnBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    gravity = 55
  ) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 230;
      this.particles.push({
        x,
        y,
        px: x,
        py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.7,
        maxLife: 1.05,
        size: 1.5 + Math.random() * 4.5,
        color,
        gravity,
      });
    }
  }

  private render() {
    const ctx = this.ctx;
    ctx.save();
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    ctx.translate(shakeX, shakeY);
    this.drawBackground();
    if (this.state === "boot") {
      this.drawBoot();
    } else if (this.state === "title") {
      this.drawTitle();
    } else {
      this.drawPlayfield();
      if (this.state === "bossIntro") this.drawBossWarning();
      if (this.state === "paused") this.drawPause();
      if (this.state === "gameOver") this.drawGameOver();
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.28})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.activeEvent === "glitchedReality") this.drawGlitchOverlay();
    this.drawAchievementToasts();
    if (this.disclosureOpen) this.drawDisclosure();
    this.drawFadeTransition();
    ctx.restore();
    this.canvas.dataset.gameState = this.state;
    this.canvas.dataset.pilot = this.pilot;
  }

  private drawBackground() {
    const ctx = this.ctx;
    const pilot = PILOTS[this.pilot];
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#030715");
    gradient.addColorStop(0.55, "#07132a");
    gradient.addColorStop(1, "#06030d");
    ctx.fillStyle = gradient;
    ctx.fillRect(-30, -30, W + 60, H + 60);

    const leftGlow = ctx.createRadialGradient(
      0,
      H * 0.45,
      0,
      0,
      H * 0.45,
      W * 0.72
    );
    leftGlow.addColorStop(0, "rgba(46,184,255,.15)");
    leftGlow.addColorStop(1, "rgba(46,184,255,0)");
    ctx.fillStyle = leftGlow;
    ctx.fillRect(0, 0, W, H);
    const rightGlow = ctx.createRadialGradient(
      W,
      H * 0.45,
      0,
      W,
      H * 0.45,
      W * 0.72
    );
    rightGlow.addColorStop(0, "rgba(255,63,159,.14)");
    rightGlow.addColorStop(1, "rgba(255,63,159,0)");
    ctx.fillStyle = rightGlow;
    ctx.fillRect(0, 0, W, H);

    for (const star of this.stars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = star.size > 2 ? pilot.secondary : "#ffffff";
      ctx.fillRect(
        Math.round(star.x),
        Math.round(star.y),
        star.size,
        star.size
      );
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(92,171,255,.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, H * 0.62);
      ctx.lineTo(W / 2 + (x - W / 2) * 1.9, H);
      ctx.stroke();
    }
    for (let y = H * 0.66; y < H; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    if (this.activeEvent === "goldenWave") {
      ctx.fillStyle = "rgba(255,231,116,.05)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  private drawBoot() {
    const ctx = this.ctx;
    const lines = [
      "B$S ARCADE OS v2.6",
      "LOADING CARTRIDGE...",
      "MONKEY INVADERS READY",
    ];
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "700 17px monospace";
    ctx.fillStyle = "#7cffa0";
    lines.forEach((line, index) => {
      const appear = index * 0.42;
      if (this.stateTime > appear)
        ctx.fillText(line, W / 2, H / 2 - 22 + index * 26);
    });
    ctx.restore();
  }

  private currentReview(): string {
    const period = 4.2;
    const index = Math.floor(this.titleClock / period) % FAKE_REVIEWS.length;
    return FAKE_REVIEWS[index];
  }

  private drawDemoBackground() {
    const ctx = this.ctx;
    const t = this.titleClock;
    ctx.save();
    ctx.globalAlpha = 0.14;
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const baseX = 90 + column * 130;
        const baseY = 46 + row * 66;
        const sway = Math.sin(t * 1.4 + column * 0.6 + row) * 18;
        this.drawAlien(
          baseX + sway,
          baseY,
          38,
          30,
          column % 2 === 0 ? "scout" : "spinner",
          t * 2 + column
        );
      }
    }
    const px = W / 2 + Math.sin(t * 0.8) * 220;
    this.drawMonkey(px, H - 88, 46, 46, this.pilot, Math.sin(t * 2) * 0.1);
    if (Math.sin(t * 6) > 0.85) {
      ctx.strokeStyle = "rgba(255,217,74,.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px + 23, H - 92);
      ctx.lineTo(px + 23, H - 240);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawTitle() {
    const ctx = this.ctx;
    const pilot = PILOTS[this.pilot];
    this.drawDemoBackground();
    const pulse = 1 + Math.sin(this.titleClock * 2.4) * 0.025;
    ctx.save();
    ctx.translate(W / 2, 150);
    ctx.scale(pulse, pulse);
    ctx.textAlign = "center";
    ctx.font = "900 62px monospace";
    ctx.shadowBlur = 24;
    ctx.shadowColor = pilot.primary;
    ctx.fillStyle = "#fff7cc";
    ctx.fillText("MONKEY", 0, 0);
    ctx.fillStyle = pilot.primary;
    ctx.fillText("INVADERS", 0, 60);
    ctx.restore();
    ctx.shadowBlur = 0;

    this.drawMonkey(
      W / 2 - 38,
      240,
      76,
      76,
      this.pilot,
      Math.sin(this.titleClock * 3) * 0.08
    );
    this.drawBanana(W / 2 + 68, 264, 1.2, -0.5);
    this.drawAlien(W / 2 - 138, 260, 58, 44, "spinner", this.titleClock * 2);

    ctx.textAlign = "center";
    ctx.fillStyle = pilot.secondary;
    ctx.font = "800 16px monospace";
    ctx.fillText(`${pilot.name} ${this.copy.channel} · ${pilot.tagline}`, W / 2, 352);
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.font = "700 12px monospace";
    ctx.fillText(this.currentReview(), W / 2, 374);
    ctx.fillStyle = Math.sin(this.titleClock * 4) > 0 ? "#fff" : pilot.primary;
    ctx.font = "900 19px monospace";
    ctx.fillText(this.copy.pressStart, W / 2, 404);
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.font = "700 10px monospace";
    ctx.fillText(
      this.copy.titleHint,
      W / 2,
      422
    );

    this.drawHallOfFame();
    this.drawModeAndCredits();
    this.drawTicker();
  }

  private drawHallOfFame() {
    const ctx = this.ctx;
    const entries = [
      ...FAKE_HIGH_SCORES,
      { initials: "YOU", score: this.highScore },
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const x = 36;
    const y = 118;
    ctx.save();
    ctx.textAlign = "left";
    ctx.font = "800 12px monospace";
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.fillText(this.copy.hallOfFame, x, y);
    entries.forEach((entry, index) => {
      ctx.fillStyle =
        entry.initials === "YOU" ? "#ffe774" : "rgba(255,255,255,.65)";
      ctx.fillText(
        `${index + 1}. ${entry.initials}  ${String(entry.score).padStart(7, "0")}`,
        x,
        y + 18 + index * 16
      );
    });
    ctx.restore();
  }

  private drawModeAndCredits() {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = "right";
    ctx.font = "800 12px monospace";
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.fillText(`${this.copy.credits} ${this.credits}`, W - 24, 118);
    ctx.fillText(`${this.copy.modePrefix} ${this.modeLabel()}`, W - 24, 136);
    if (this.mode === "daily") {
      ctx.fillStyle = "#ffe774";
      ctx.fillText(
        `${this.copy.today} ${RANDOM_EVENT_META[this.dailyModifier].label}`,
        W - 24,
        154
      );
    }
    ctx.restore();
  }

  private drawTicker() {
    const ctx = this.ctx;
    const y = H - 24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y - 14, W, 24);
    ctx.clip();
    ctx.font = "700 13px monospace";
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const speed = 48;
    const totalWidth = ctx.measureText(this.tickerFeed).width + 200;
    const offset = (this.titleClock * speed) % totalWidth;
    ctx.fillText(this.tickerFeed, W - offset, y);
    ctx.fillText(this.tickerFeed, W - offset + totalWidth, y);
    ctx.restore();
  }

  private drawPlayfield() {
    const ctx = this.ctx;
    this.drawHud();
    for (const pickup of this.pickups) this.drawPickup(pickup);
    for (const enemy of this.enemies) {
      const x = lerp(enemy.px, enemy.x, this.renderAlpha);
      const y =
        lerp(enemy.py, enemy.y, this.renderAlpha) +
        Math.sin(enemy.phase) * (enemy.kind === "spinner" ? 5 : 2);
      if (enemy.flash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = enemy.flash;
        ctx.fillStyle = "#fff";
        ctx.fillRect(x - 3, y - 3, enemy.w + 6, enemy.h + 6);
        ctx.restore();
      }
      const shieldRatio =
        enemy.kind === "shield"
          ? enemy.shieldHp / Math.max(1, enemy.shieldMax)
          : 0;
      this.drawAlien(
        x,
        y,
        enemy.w,
        enemy.h,
        enemy.kind,
        enemy.phase,
        enemy.elite,
        enemy.golden,
        shieldRatio,
        enemy.diving
      );
    }
    this.drawHazards();
    if (this.boss) this.drawBoss(this.boss);
    for (const projectile of this.projectiles) this.drawProjectile(projectile);
    for (const alien of this.dyingAliens) {
      ctx.save();
      ctx.globalAlpha = clamp(alien.timer / 0.9, 0, 1);
      ctx.translate(alien.x, alien.y);
      ctx.rotate(alien.rotation);
      ctx.font = "22px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(alien.emoji, 0, 0);
      ctx.restore();
    }
    for (const particle of this.particles) {
      const x = lerp(particle.px, particle.x, this.renderAlpha);
      const y = lerp(particle.py, particle.y, this.renderAlpha);
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(x, y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
    const playerX = lerp(this.player.px, this.player.x, this.renderAlpha);
    const playerY = lerp(this.player.py, this.player.y, this.renderAlpha);
    if (
      this.player.invulnerable <= 0 ||
      Math.floor(this.player.invulnerable * 12) % 2 === 0
    ) {
      const visualScale = this.player.kongMode
        ? 1.5
        : this.player.gorillaTimer > 0
          ? 1.25
          : 1;
      const squashY = 1 - this.player.squash;
      const squashX = 1 + this.player.squash * 0.6;
      ctx.save();
      ctx.translate(playerX + this.player.w / 2, playerY + this.player.h / 2);
      ctx.scale(visualScale * squashX, visualScale * squashY);
      ctx.translate(-this.player.w / 2, -this.player.h / 2);
      this.drawMonkey(
        0,
        0,
        this.player.w,
        this.player.h,
        this.pilot,
        (this.player.vx / this.player.speed) * 0.16
      );
      ctx.restore();
    }
    if (this.player.shield > 0) {
      ctx.strokeStyle = "rgba(117,255,209,.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        playerX + this.player.w / 2,
        playerY + this.player.h / 2,
        38 + Math.sin(this.titleClock * 8) * 2,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    if (this.messageTimer > 0) this.drawMessage(this.message);
    if (this.activeEvent) this.drawEventBanner();
  }

  private drawHazards() {
    const ctx = this.ctx;
    for (const hazard of this.hazards) {
      if (hazard.telegraph > 0) {
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(this.titleClock * 20) * 0.15;
        ctx.strokeStyle = "#ff5f3f";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(hazard.x, 0);
        ctx.lineTo(hazard.x, PLAYER_Y + 20);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        continue;
      }
      const x = lerp(hazard.px, hazard.x, this.renderAlpha);
      const y = lerp(hazard.py, hazard.y, this.renderAlpha);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.titleClock * 4);
      ctx.fillStyle = "#ff7f32";
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#ff5f1f";
      ctx.beginPath();
      ctx.arc(0, 0, hazard.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  private drawEventBanner() {
    if (!this.activeEvent) return;
    const meta = RANDOM_EVENT_META[this.activeEvent];
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.fillRect(W / 2 - 140, 70, 280, 20);
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W / 2 - 140, 70, 280, 20);
    ctx.fillStyle = meta.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 11px monospace";
    ctx.fillText(meta.label, W / 2, 80);
    ctx.restore();
  }

  private drawBossWarning() {
    if (!this.boss) return;
    const ctx = this.ctx;
    const pulse = 1 + Math.sin(this.stateTime * 10) * 0.05;
    ctx.save();
    ctx.translate(W / 2, H / 2 - 40);
    ctx.scale(pulse, pulse);
    ctx.textAlign = "center";
    ctx.font = "900 30px monospace";
    ctx.fillStyle = "#ff3b3b";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff3b3b";
    ctx.fillText("⚠ WARNING ⚠", 0, -30);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "900 34px monospace";
    ctx.fillText(this.boss.name, 0, 6);
    ctx.font = "700 15px monospace";
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.fillText(this.boss.tagline, 0, 34);
    ctx.restore();
  }

  private drawHud() {
    const ctx = this.ctx;
    const pilot = PILOTS[this.pilot];
    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.fillRect(0, 0, W, 48);
    ctx.strokeStyle = `${pilot.primary}66`;
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(W, 48);
    ctx.stroke();
    ctx.font = "900 16px monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffe774";
    ctx.fillText(`SCORE ${String(this.score).padStart(7, "0")}`, 18, 24);
    ctx.textAlign = "center";
    ctx.fillStyle = pilot.secondary;
    ctx.fillText(
      this.boss ? `BOSS ${this.boss.name}` : `WAVE ${this.wave}`,
      W / 2,
      24
    );
    ctx.textAlign = "right";
    ctx.fillStyle = "#ff8ba7";
    ctx.fillText(
      `LIVES ${this.player.lives > 20 ? "∞" : "♥".repeat(Math.max(0, this.player.lives))}`,
      W - 18,
      24
    );

    const meterX = W / 2 - 110;
    const meterY = H - 20;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(meterX, meterY, 220, 8);
    ctx.fillStyle = this.player.special >= 100 ? "#fff36b" : pilot.primary;
    ctx.fillRect(meterX, meterY, 220 * (this.player.special / 100), 8);
    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.strokeRect(meterX, meterY, 220, 8);
    ctx.textAlign = "center";
    ctx.font = "800 10px monospace";
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.fillText(
      this.player.special >= 100 ? "BLAST READY" : "BANANA BLAST",
      W / 2,
      H - 30
    );

    if (this.boss) {
      const width = 360;
      const x = W / 2 - width / 2;
      const y = 55;
      ctx.fillStyle = "rgba(0,0,0,.62)";
      ctx.fillRect(x, y, width, 12);
      ctx.fillStyle = this.boss.color;
      ctx.fillRect(
        x,
        y,
        width * clamp(this.boss.hp / this.boss.maxHp, 0, 1),
        12
      );
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.strokeRect(x, y, width, 12);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.fillRect(x + width * 0.67 - 1, y - 2, 2, 16);
      ctx.fillRect(x + width * 0.34 - 1, y - 2, 2, 16);
      ctx.textAlign = "center";
      ctx.font = "800 11px monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText(`${this.boss.name} · ${this.boss.tagline}`, W / 2, y - 8);
    }

    this.drawBuffRow();
  }

  private drawBuffRow() {
    const ctx = this.ctx;
    const player = this.player;
    const active: { symbol: string; color: string }[] = [];
    const push = (kind: PickupKind, timer: number) => {
      if (timer > 0)
        active.push({
          symbol: PICKUP_META[kind].symbol,
          color: PICKUP_META[kind].color,
        });
    };
    push("rapid", player.rapidTimer);
    push("spread", player.spreadTimer);
    push("shield", player.shield);
    push("magnet", player.magnetTimer);
    push("laser", player.laserTimer);
    push("boomerang", player.boomerangTimer);
    push("bomb", player.bombTimer);
    push("rainbow", player.rainbowTimer);
    push("gorilla", player.gorillaTimer);
    push("timeSlow", player.timeSlowTimer);
    if (player.freezeFieldTimer > 0)
      active.push({ symbol: "❄", color: "#8fe6ff" });
    if (active.length === 0) return;
    active.forEach((buff, index) => {
      const x = 18 + index * 26;
      const y = H - 46;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(x, y, 22, 22);
      ctx.strokeStyle = buff.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, 22, 22);
      ctx.fillStyle = buff.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 11px monospace";
      ctx.fillText(buff.symbol, x + 11, y + 12);
      ctx.restore();
    });
  }

  private drawMonkey(
    x: number,
    y: number,
    w: number,
    h: number,
    pilotId: PilotId,
    tilt: number
  ) {
    const ctx = this.ctx;
    const pilot = PILOTS[pilotId];
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(tilt);
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = pilot.dark;
    ctx.fillRect(w * 0.18, h * 0.34, w * 0.64, h * 0.52);
    ctx.fillStyle = pilot.primary;
    ctx.fillRect(w * 0.24, h * 0.26, w * 0.52, h * 0.42);
    ctx.fillStyle = "#6f3d23";
    ctx.fillRect(w * 0.22, h * 0.11, w * 0.56, h * 0.46);
    ctx.fillStyle = "#d69662";
    ctx.fillRect(w * 0.3, h * 0.22, w * 0.4, h * 0.3);
    ctx.fillStyle = "#fff";
    ctx.fillRect(w * 0.35, h * 0.27, w * 0.1, h * 0.1);
    ctx.fillRect(w * 0.55, h * 0.27, w * 0.1, h * 0.1);
    ctx.fillStyle = "#111";
    ctx.fillRect(w * 0.39, h * 0.29, w * 0.05, h * 0.07);
    ctx.fillRect(w * 0.56, h * 0.29, w * 0.05, h * 0.07);
    ctx.fillStyle = pilot.secondary;
    ctx.fillRect(w * 0.13, h * 0.65, w * 0.22, h * 0.14);
    ctx.fillRect(w * 0.65, h * 0.65, w * 0.22, h * 0.14);
    ctx.fillStyle = "#ffcb49";
    ctx.fillRect(w * 0.43, -h * 0.02, w * 0.14, h * 0.2);
    ctx.restore();
  }

  private drawAlien(
    x: number,
    y: number,
    w: number,
    h: number,
    kind: EnemyKind,
    phase: number,
    elite = false,
    golden = false,
    shieldRatio = 0,
    diving = false
  ) {
    const ctx = this.ctx;
    const color = golden ? "#ffe774" : this.enemyColor(kind);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (kind === "spinner") ctx.rotate(Math.sin(phase) * 0.08);
    if (kind === "teleporter")
      ctx.globalAlpha = 0.5 + Math.sin(phase * 3) * 0.3;
    if (kind === "kamikaze" && diving) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = color;
      ctx.fillRect(w * 0.16, h * 0.04, w * 0.68, h * 0.58);
      ctx.restore();
    }
    ctx.fillStyle = color;
    ctx.fillRect(w * 0.16, h * 0.18, w * 0.68, h * 0.58);
    ctx.fillRect(w * 0.04, h * 0.34, w * 0.92, h * 0.28);
    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.fillRect(w * 0.24, h * 0.22, w * 0.52, h * 0.08);
    ctx.fillStyle = "#07101b";
    ctx.fillRect(w * 0.27, h * 0.38, w * 0.13, h * 0.13);
    ctx.fillRect(w * 0.6, h * 0.38, w * 0.13, h * 0.13);
    ctx.fillStyle = kind === "tank" ? "#fff36b" : "#ff8faf";
    ctx.fillRect(w * 0.31, h * 0.41, w * 0.06, h * 0.06);
    ctx.fillRect(w * 0.63, h * 0.41, w * 0.06, h * 0.06);
    ctx.fillStyle = color;
    ctx.fillRect(w * 0.12, h * 0.74, w * 0.18, h * 0.18);
    ctx.fillRect(w * 0.7, h * 0.74, w * 0.18, h * 0.18);
    if (kind === "shield" && shieldRatio > 0) {
      ctx.strokeStyle = `rgba(143,230,255,${0.4 + shieldRatio * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.max(w, h) * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (kind === "splitter") {
      ctx.strokeStyle = "rgba(255,255,255,.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.1);
      ctx.lineTo(w * 0.5, h * 0.92);
      ctx.stroke();
    }
    if (elite) {
      ctx.strokeStyle = "#ffe774";
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.02, h * 0.02, w * 0.96, h * 0.96);
    }
    ctx.restore();
  }

  private drawBoss(boss: Boss) {
    const ctx = this.ctx;
    const x = lerp(boss.px, boss.x, this.renderAlpha);
    const y = lerp(boss.py, boss.y, this.renderAlpha);
    ctx.save();
    if (boss.entering) ctx.globalAlpha = 0.5 + boss.enterProgress * 0.5;
    ctx.translate(x, y);
    ctx.shadowBlur = 26;
    ctx.shadowColor = boss.color;
    ctx.fillStyle = boss.flash > 0 ? "#fff" : boss.color;
    ctx.fillRect(0, 14, boss.w, boss.h - 28);
    ctx.fillRect(20, 0, boss.w - 40, boss.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(28, 28, boss.w - 56, boss.h - 56);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "52px sans-serif";
    ctx.fillText(boss.symbol, boss.w / 2, boss.h / 2 + 2);
    if (boss.attackPhase > 0) {
      ctx.font = "800 11px monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText(`PHASE ${boss.attackPhase + 1}`, boss.w / 2, boss.h + 14);
    }
    ctx.restore();
  }

  private drawProjectile(projectile: Projectile) {
    const x = lerp(projectile.px, projectile.x, this.renderAlpha);
    const y = lerp(projectile.py, projectile.y, this.renderAlpha);
    if (projectile.kind === "banana" || projectile.kind === "boomerang") {
      this.drawBanana(
        x,
        y,
        projectile.r / 8,
        Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2,
        projectile.rainbow
      );
      return;
    }
    const ctx = this.ctx;
    if (projectile.kind === "laser") {
      ctx.save();
      ctx.strokeStyle = "#ffef6b";
      ctx.lineWidth = 4;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ffef6b";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - projectile.vx * 0.02, y - projectile.vy * 0.02);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (projectile.kind === "bomb") {
      ctx.save();
      ctx.fillStyle = "#ff8a3d";
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#ff5f1f";
      ctx.beginPath();
      ctx.arc(x, y, projectile.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.fillStyle = "#ff4b75";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff245f";
    ctx.beginPath();
    ctx.arc(x, y, projectile.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private bananaSkinColor(): string {
    if (this.bananaSkin === "gold") return "#ffd700";
    if (this.bananaSkin === "rainbow")
      return `hsl(${(this.titleClock * 140) % 360},80%,62%)`;
    return "#ffd94a";
  }

  private drawBanana(
    x: number,
    y: number,
    scale = 1,
    rotation = 0,
    rainbow = false
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation + this.titleClock * 6);
    ctx.scale(scale, scale);
    const color = rainbow
      ? `hsl(${(this.titleClock * 220) % 360},85%,60%)`
      : this.bananaSkinColor();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0.12 * Math.PI, 1.08 * Math.PI);
    ctx.stroke();
    ctx.strokeStyle = "#9d6a16";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 3);
    ctx.lineTo(11, 1);
    ctx.stroke();
    ctx.restore();
  }

  private drawPickup(pickup: Pickup) {
    const ctx = this.ctx;
    const x = lerp(pickup.px, pickup.x, this.renderAlpha);
    const y = lerp(pickup.py, pickup.y, this.renderAlpha);
    const meta = PICKUP_META[pickup.kind];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.titleClock * 1.8);
    ctx.shadowBlur = 16;
    ctx.shadowColor = meta.color;
    ctx.fillStyle = meta.color;
    ctx.fillRect(-12, -12, 24, 24);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#06101d";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 12px monospace";
    ctx.fillText(meta.symbol, 0, 1);
    ctx.restore();
  }

  private drawMessage(text: string) {
    const ctx = this.ctx;
    const pilot = PILOTS[this.pilot];
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 28px monospace";
    ctx.shadowBlur = 18;
    ctx.shadowColor = pilot.primary;
    ctx.fillStyle = "#fff";
    ctx.fillText(text, W / 2, H / 2);
    ctx.restore();
  }

  private drawGlitchOverlay() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "difference";
    ctx.fillStyle = `hsl(${(this.titleClock * 140) % 360},80%,50%)`;
    ctx.globalAlpha = 0.06;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    if (Math.random() < 0.06) {
      const sliceY = Math.random() * H;
      const sliceH = 6 + Math.random() * 22;
      const offset = (Math.random() - 0.5) * 26;
      ctx.save();
      ctx.drawImage(
        this.canvas,
        0,
        sliceY,
        W,
        sliceH,
        offset,
        sliceY,
        W,
        sliceH
      );
      ctx.restore();
    }
  }

  private drawAchievementToasts() {
    const ctx = this.ctx;
    this.achievementQueue.forEach((toast, index) => {
      const alpha = clamp(toast.timer / 3.6, 0, 1);
      const x = W - 240;
      const y = 60 + index * 54;
      ctx.save();
      ctx.globalAlpha = Math.min(alpha, 1);
      ctx.fillStyle = "rgba(6,10,20,.88)";
      ctx.fillRect(x - 4, y - 4, 236, 44);
      ctx.strokeStyle = "#ffe774";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 4, y - 4, 236, 44);
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffe774";
      ctx.font = "900 12px monospace";
      ctx.fillText(`🏆 ${toast.title}`, x + 4, y + 10);
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.font = "700 10px monospace";
      ctx.fillText(toast.desc, x + 4, y + 27);
      ctx.restore();
    });
  }

  private drawDisclosure() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.82)";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#ffe774";
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 70, W - 160, H - 140);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe774";
    ctx.font = "900 20px monospace";
    ctx.fillText(CURD_DISCLOSURE_LINES[0], W / 2, 110);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = "700 13px monospace";
    CURD_DISCLOSURE_LINES.slice(1).forEach((line, index) =>
      ctx.fillText(line, W / 2, 150 + index * 24)
    );
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.font = "800 12px monospace";
    ctx.fillText(this.copy.pressIClose, W / 2, H - 90);
    ctx.restore();
  }

  private drawFadeTransition() {
    const alpha = Math.max(0, 1 - this.stateTime / 0.32);
    if (alpha <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = `rgba(3,4,9,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  private drawPause() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,.68)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = PILOTS[this.pilot].secondary;
    ctx.font = "900 54px monospace";
    ctx.fillText(this.copy.paused, W / 2, H / 2 - 12);
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = "800 15px monospace";
    ctx.fillText(this.copy.pausedHint, W / 2, H / 2 + 32);
  }

  private drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,.76)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff6b83";
    ctx.font = "900 60px monospace";
    ctx.fillText(this.copy.signalLost, W / 2, 172);
    ctx.fillStyle = "#ffe774";
    ctx.font = "900 24px monospace";
    ctx.fillText(`${this.copy.score} ${String(this.score).padStart(7, "0")}`, W / 2, 226);
    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.font = "800 13px monospace";
    ctx.fillText(
      `${this.modeLabel()} · ${this.copy.high} ${String(this.highScore).padStart(7, "0")}`,
      W / 2,
      254
    );
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "800 15px monospace";
    ctx.fillText(this.message, W / 2, 288);
    ctx.fillStyle =
      Math.sin(this.titleClock * 4) > 0 ? "#fff" : PILOTS[this.pilot].primary;
    ctx.font = "900 19px monospace";
    ctx.fillText(this.copy.redeploy, W / 2, 340);
    ctx.fillStyle = "rgba(255,255,255,.45)";
    ctx.font = "700 11px monospace";
    ctx.fillText(this.copy.infoHint, W / 2, 366);
  }

  private enemyColor(kind: EnemyKind) {
    if (kind === "spinner") return "#ff4fc3";
    if (kind === "tank") return "#ff9e3f";
    if (kind === "shield") return "#5fb8ff";
    if (kind === "splitter") return "#b98bff";
    if (kind === "teleporter") return "#c9a5ff";
    if (kind === "kamikaze") return "#ff5f5f";
    return "#54e6ff";
  }

  private emitStatus(force = false) {
    const status: CabinetStatus = {
      state: this.state,
      pilot: this.pilot,
      mode: this.mode,
      score: this.score,
      highScore: this.highScore,
      wave: this.wave,
      lives: this.player.lives,
      credits: this.credits,
    };
    const key = JSON.stringify(status);
    if (!force && key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    this.onStatus(status);
  }
}
