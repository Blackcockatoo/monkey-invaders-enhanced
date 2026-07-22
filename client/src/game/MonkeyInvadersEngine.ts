export type Action = "left" | "right" | "fire" | "special" | "start" | "pause";
export type PilotId = "bolt" | "nova";
export type GameState = "title" | "playing" | "waveClear" | "paused" | "gameOver";

export type CabinetStatus = {
  state: GameState;
  pilot: PilotId;
  score: number;
  highScore: number;
  wave: number;
  lives: number;
};

type Moving = { x: number; y: number; px: number; py: number; vx: number; vy: number };
type Player = Moving & {
  w: number;
  h: number;
  speed: number;
  lives: number;
  invulnerable: number;
  fireCooldown: number;
  rapidTimer: number;
  spreadTimer: number;
  shield: number;
  special: number;
};
type Enemy = Moving & {
  id: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  kind: "scout" | "spinner" | "tank";
  phase: number;
  flash: number;
};
type Projectile = Moving & {
  r: number;
  damage: number;
  hostile: boolean;
  life: number;
  banana: boolean;
};
type Particle = Moving & { life: number; maxLife: number; size: number; color: string };
type Pickup = Moving & {
  kind: "rapid" | "spread" | "shield" | "special";
  r: number;
  life: number;
};
type Boss = Moving & {
  name: string;
  symbol: string;
  color: string;
  hp: number;
  maxHp: number;
  w: number;
  h: number;
  phase: number;
  shotTimer: number;
  flash: number;
};
type Star = { x: number; y: number; speed: number; size: number; alpha: number };

const W = 960;
const H = 540;
const FIXED = 1 / 60;
const MAX_FRAME_DELTA = 0.1;
const PLAYER_Y = H - 72;
const HIGH_SCORE_KEY = "monkey-invaders-high-score-v2";
const PILOT_KEY = "monkey-invaders-pilot-v2";
const MUTED_KEY = "monkey-invaders-muted-v2";
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const PILOTS = {
  bolt: {
    name: "BOLT",
    primary: "#2eb8ff",
    secondary: "#7af4ff",
    dark: "#0a4278",
    tagline: "COOL HEAD · CLEAN SHOT",
  },
  nova: {
    name: "NOVA",
    primary: "#ff3f9f",
    secondary: "#ffd0ea",
    dark: "#731b55",
    tagline: "FAST HEART · WILD ARC",
  },
} as const;

const BOSSES = [
  ["ZORG", "👹", "#ff4d4d"],
  ["KRELL", "👾", "#7cff67"],
  ["VEX", "🤖", "#5fe9ff"],
  ["NEXUS", "👽", "#ff4fd8"],
  ["VOID", "💀", "#f6c34d"],
  ["CHAOS", "⚡", "#ff7f32"],
  ["TITAN", "🦾", "#ff386c"],
  ["SPECTER", "👻", "#75ffd1"],
  ["INFERNO", "🔥", "#ff3d27"],
  ["LEVIATHAN", "🐙", "#4b8dff"],
  ["PHANTOM", "✨", "#c26bff"],
  ["OMEGA", "⚔", "#fff35b"],
  ["APOCALYPSE", "💥", "#ff2139"],
] as const;

class ArcadeAudio {
  muted = false;
  private context: AudioContext | null = null;
  private musicTimer = 0;

  unlock() {
    if (this.muted) return;
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") void this.context.resume();
  }

  setMuted(value: boolean) {
    this.muted = value;
    if (value && this.context) void this.context.suspend();
    if (!value) this.unlock();
  }

  blip(frequency = 440, duration = 0.06, gain = 0.035, type: OscillatorType = "square") {
    if (this.muted) return;
    this.unlock();
    const context = this.context;
    if (!context) return;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    volume.gain.setValueAtTime(gain, context.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  chord(root: number) {
    this.blip(root, 0.12, 0.026, "triangle");
    window.setTimeout(() => this.blip(root * 1.25, 0.12, 0.02, "triangle"), 55);
    window.setTimeout(() => this.blip(root * 1.5, 0.16, 0.018, "triangle"), 110);
  }

  tickMusic(dt: number, state: GameState, wave: number) {
    if (this.muted || state !== "playing") return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    const scale = [0, 3, 7, 10, 7, 3];
    const step = Math.floor(performance.now() / 180) % scale.length;
    const root = 110 * Math.pow(2, (scale[step] + Math.min(12, wave)) / 12);
    this.blip(root, 0.045, 0.009, "square");
    this.musicTimer = 0.18;
  }

  destroy() {
    if (this.context) void this.context.close();
    this.context = null;
  }
}

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
  private state: GameState = "title";
  private stateTime = 0;
  private held: Record<Action, boolean> = { left: false, right: false, fire: false, special: false, start: false, pause: false };
  private just = new Set<Action>();
  private pilot: PilotId = "bolt";
  private player = this.makePlayer();
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private pickups: Pickup[] = [];
  private boss: Boss | null = null;
  private stars: Star[] = [];
  private nextId = 1;
  private score = 0;
  private highScore = 0;
  private wave = 1;
  private waveTimer = 0;
  private formationDirection = 1;
  private enemyShotTimer = 1.2;
  private shake = 0;
  private flash = 0;
  private titleClock = 0;
  private message = "";
  private messageTimer = 0;
  private lastStatusKey = "";

  constructor(canvas: HTMLCanvasElement, onStatus: (status: CabinetStatus) => void) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    this.onStatus = onStatus;
    this.highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0) || 0;
    const savedPilot = localStorage.getItem(PILOT_KEY);
    if (savedPilot === "nova" || savedPilot === "bolt") this.pilot = savedPilot;
    this.audio.muted = localStorage.getItem(MUTED_KEY) === "true";
    this.stars = Array.from({ length: 100 }, (_, index) => ({
      x: (index * 113.7) % W,
      y: (index * 67.3) % H,
      speed: 12 + (index % 5) * 11,
      size: 1 + (index % 3),
      alpha: 0.25 + (index % 7) * 0.08,
    }));
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
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
    this.audio.destroy();
  }

  getPilot() {
    return this.pilot;
  }

  isMuted() {
    return this.audio.muted;
  }

  setMuted(value: boolean) {
    this.audio.setMuted(value);
    localStorage.setItem(MUTED_KEY, String(value));
  }

  cyclePilot() {
    this.selectPilot(this.pilot === "bolt" ? "nova" : "bolt");
  }

  selectPilot(pilot: PilotId) {
    this.pilot = pilot;
    localStorage.setItem(PILOT_KEY, pilot);
    this.emitStatus(true);
    this.audio.blip(pilot === "bolt" ? 520 : 660, 0.09, 0.025, "triangle");
  }

  press(action: Action) {
    this.audio.unlock();
    if (!this.held[action]) this.just.add(action);
    this.held[action] = true;
    if (action === "start" && (this.state === "title" || this.state === "gameOver")) this.startGame();
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
      speed: 410,
      lives: 3,
      invulnerable: 0,
      fireCooldown: 0,
      rapidTimer: 0,
      spreadTimer: 0,
      shield: 0,
      special: 45,
    };
  }

  private startGame() {
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
    this.boss = null;
    this.formationDirection = 1;
    this.message = "WAVE 1 · BANANAS ARMED";
    this.messageTimer = 1.5;
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

  private onKeyDown(event: KeyboardEvent) {
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

  private keyAction(code: string): Action | undefined {
    if (code === "ArrowLeft" || code === "KeyA") return "left";
    if (code === "ArrowRight" || code === "KeyD") return "right";
    if (code === "Space" || code === "KeyX" || code === "KeyZ") return "fire";
    if (code === "ArrowUp" || code === "KeyW" || code === "KeyC") return "special";
    if (code === "Enter") return "start";
    if (code === "Escape" || code === "KeyP") return "pause";
    if (code === "KeyQ" && this.state === "title") {
      this.cyclePilot();
      return undefined;
    }
    return undefined;
  }

  private loop = (time: number) => {
    if (!this.alive) return;
    if (!this.last) this.last = time;
    const delta = Math.min(MAX_FRAME_DELTA, (time - this.last) / 1000);
    this.last = time;
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
    if (this.state === "paused") {
      this.just.clear();
      return;
    }
    if (this.state === "title" || this.state === "gameOver") {
      this.updateAttract(dt);
      this.just.clear();
      return;
    }
    if (this.state === "waveClear") {
      this.updateParticles(dt);
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.wave += 1;
        this.state = "playing";
        this.stateTime = 0;
        this.message = this.wave % 5 === 0 ? `BOSS WAVE ${this.wave}` : `WAVE ${this.wave}`;
        this.messageTimer = 1.4;
        this.spawnWave();
        this.emitStatus(true);
      }
      this.just.clear();
      return;
    }

    this.audio.tickMusic(dt, this.state, this.wave);
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);
    this.resolveCollisions();
    this.checkWaveClear();
    this.just.clear();
    this.emitStatus();
  }

  private updateStars(dt: number) {
    const multiplier = this.state === "playing" ? 1.4 : 0.55;
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
    this.particles = this.particles.filter((particle) => particle.life > 0);
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
      });
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
    const direction = Number(this.held.right) - Number(this.held.left);
    const target = direction * player.speed;
    const acceleration = direction === 0 ? 13 : 18;
    player.vx += (target - player.vx) * clamp(acceleration * dt, 0, 1);
    player.x += player.vx * dt;
    player.x = clamp(player.x, 18, W - player.w - 18);

    if (this.held.fire && player.fireCooldown <= 0) this.fireBanana();
    if ((this.just.has("special") || (this.held.special && player.special >= 100)) && player.special >= 100) this.fireSpecial();
  }

  private fireBanana() {
    const player = this.player;
    const rapid = player.rapidTimer > 0;
    const spread = player.spreadTimer > 0;
    const originX = player.x + player.w / 2;
    const originY = player.y + 4;
    const shots = spread ? [-0.24, 0, 0.24] : [0];
    for (const angle of shots) {
      const speed = 650;
      this.projectiles.push({
        x: originX - 7,
        y: originY,
        px: originX - 7,
        py: originY,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        r: 8,
        damage: 1,
        hostile: false,
        life: 1.5,
        banana: true,
      });
    }
    player.fireCooldown = rapid ? 0.085 : 0.16;
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
        banana: true,
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
    this.projectiles = this.projectiles.filter((projectile) => !projectile.hostile);
    this.pickups = [];
    this.boss = null;
    this.formationDirection = 1;
    this.enemyShotTimer = Math.max(0.38, 1.4 - this.wave * 0.045);
    if (this.wave % 5 === 0) {
      this.spawnBoss();
      return;
    }
    const rows = Math.min(4, 2 + Math.floor(this.wave / 3));
    const columns = Math.min(10, 6 + Math.floor(this.wave / 2));
    const gapX = 68;
    const gapY = 54;
    const startX = W / 2 - ((columns - 1) * gapX) / 2 - 22;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = startX + column * gapX;
        const y = 78 + row * gapY;
        const kind: Enemy["kind"] = row === 0 && this.wave > 3 ? "spinner" : row === rows - 1 && this.wave > 6 ? "tank" : "scout";
        const hp = kind === "tank" ? 3 : kind === "spinner" ? 2 : 1;
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
        });
      }
    }
  }

  private spawnBoss() {
    const data = BOSSES[(Math.floor(this.wave / 5) - 1) % BOSSES.length];
    const maxHp = 45 + this.wave * 8;
    this.boss = {
      name: data[0],
      symbol: data[1],
      color: data[2],
      x: W / 2 - 82,
      y: 52,
      px: W / 2 - 82,
      py: 52,
      vx: 0,
      vy: 0,
      hp: maxHp,
      maxHp,
      w: 164,
      h: 112,
      phase: 0,
      shotTimer: 0.8,
      flash: 0,
    };
    this.audio.chord(98);
  }

  private updateEnemies(dt: number) {
    if (this.enemies.length === 0) return;
    const alive = this.enemies.filter((enemy) => enemy.hp > 0);
    if (alive.length === 0) return;
    const speed = 42 + this.wave * 5 + (1 - alive.length / Math.max(1, this.enemies.length)) * 75;
    let hitEdge = false;
    for (const enemy of alive) {
      enemy.px = enemy.x;
      enemy.py = enemy.y;
      enemy.flash = Math.max(0, enemy.flash - dt * 6);
      enemy.phase += dt * (enemy.kind === "spinner" ? 4.2 : 2.1);
      enemy.x += speed * this.formationDirection * dt;
      if (enemy.x < 18 || enemy.x + enemy.w > W - 18) hitEdge = true;
    }
    if (hitEdge) {
      this.formationDirection *= -1;
      for (const enemy of alive) {
        enemy.x = clamp(enemy.x, 18, W - enemy.w - 18);
        enemy.y += 16;
      }
    }
    this.enemyShotTimer -= dt;
    if (this.enemyShotTimer <= 0 && alive.length > 0) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
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
        banana: false,
      });
      this.enemyShotTimer = Math.max(0.34, 1.32 - this.wave * 0.035) * (0.75 + Math.random() * 0.6);
      this.audio.blip(150, 0.06, 0.01, "sawtooth");
    }
    for (const enemy of alive) {
      if (enemy.y + enemy.h > PLAYER_Y + 8) {
        this.damagePlayer();
        enemy.hp = 0;
      }
    }
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
  }

  private updateBoss(dt: number) {
    const boss = this.boss;
    if (!boss) return;
    boss.px = boss.x;
    boss.py = boss.y;
    boss.phase += dt;
    boss.flash = Math.max(0, boss.flash - dt * 7);
    boss.x = W / 2 - boss.w / 2 + Math.sin(boss.phase * (0.8 + this.wave * 0.01)) * 280;
    boss.y = 48 + Math.sin(boss.phase * 1.7) * 20;
    boss.shotTimer -= dt;
    if (boss.shotTimer <= 0) {
      const bursts = 3 + Math.min(4, Math.floor(this.wave / 10));
      for (let index = 0; index < bursts; index += 1) {
        const spread = (index - (bursts - 1) / 2) * 0.18;
        const speed = 250 + this.wave * 4;
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
          banana: false,
        });
      }
      boss.shotTimer = Math.max(0.42, 1.08 - this.wave * 0.02);
      this.audio.blip(92, 0.12, 0.028, "sawtooth");
    }
  }

  private updateProjectiles(dt: number) {
    for (const projectile of this.projectiles) {
      projectile.px = projectile.x;
      projectile.py = projectile.y;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
    }
    this.projectiles = this.projectiles.filter(
      (projectile) => projectile.life > 0 && projectile.x > -40 && projectile.x < W + 40 && projectile.y > -60 && projectile.y < H + 60,
    );
  }

  private updatePickups(dt: number) {
    for (const pickup of this.pickups) {
      pickup.px = pickup.x;
      pickup.py = pickup.y;
      pickup.y += pickup.vy * dt;
      pickup.x += pickup.vx * dt;
      pickup.life -= dt;
    }
    this.pickups = this.pickups.filter((pickup) => pickup.life > 0 && pickup.y < H + 30);
  }

  private updateParticles(dt: number) {
    for (const particle of this.particles) {
      particle.px = particle.x;
      particle.py = particle.y;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 55 * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  private resolveCollisions() {
    const playerBox = { x: this.player.x + 8, y: this.player.y + 8, w: this.player.w - 16, h: this.player.h - 10 };
    for (const projectile of this.projectiles) {
      if (projectile.life <= 0) continue;
      const projectileBox = { x: projectile.x - projectile.r, y: projectile.y - projectile.r, w: projectile.r * 2, h: projectile.r * 2 };
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
        enemy.hp -= projectile.damage;
        enemy.flash = 1;
        projectile.life = 0;
        hit = true;
        if (enemy.hp <= 0) this.killEnemy(enemy);
        else this.audio.blip(240, 0.035, 0.012, "square");
        break;
      }
      if (hit) continue;
      const boss = this.boss;
      if (boss && overlap(projectileBox, boss)) {
        boss.hp -= projectile.damage;
        boss.flash = 1;
        projectile.life = 0;
        this.score += 8 * projectile.damage;
        this.player.special = clamp(this.player.special + 1.8 * projectile.damage, 0, 100);
        this.spawnBurst(projectile.x, projectile.y, boss.color, 4);
        if (boss.hp <= 0) this.killBoss();
        else this.audio.blip(128, 0.04, 0.014, "square");
      }
    }

    for (const pickup of this.pickups) {
      const box = { x: pickup.x - pickup.r, y: pickup.y - pickup.r, w: pickup.r * 2, h: pickup.r * 2 };
      if (!overlap(box, playerBox)) continue;
      pickup.life = 0;
      if (pickup.kind === "rapid") this.player.rapidTimer = 9;
      if (pickup.kind === "spread") this.player.spreadTimer = 9;
      if (pickup.kind === "shield") this.player.shield = 12;
      if (pickup.kind === "special") this.player.special = clamp(this.player.special + 55, 0, 100);
      this.score += 100;
      this.message = `${pickup.kind.toUpperCase()} ONLINE`;
      this.messageTimer = 0.9;
      this.audio.chord(440);
      this.spawnBurst(pickup.x, pickup.y, this.pickupColor(pickup.kind), 18);
    }
  }

  private killEnemy(enemy: Enemy) {
    const value = enemy.kind === "tank" ? 80 : enemy.kind === "spinner" ? 55 : 35;
    this.score += value + this.wave * 3;
    this.player.special = clamp(this.player.special + (enemy.kind === "tank" ? 12 : 7), 0, 100);
    this.spawnBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, this.enemyColor(enemy.kind), 15);
    this.shake = Math.max(this.shake, enemy.kind === "tank" ? 5 : 2.5);
    if (Math.random() < 0.11) this.dropPickup(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    this.audio.blip(enemy.kind === "tank" ? 120 : 190, 0.07, 0.026, "square");
  }

  private killBoss() {
    const boss = this.boss;
    if (!boss) return;
    this.score += 2500 + this.wave * 120;
    this.player.special = 100;
    this.spawnBurst(boss.x + boss.w / 2, boss.y + boss.h / 2, boss.color, 90);
    this.shake = 18;
    this.flash = 0.85;
    this.message = `${boss.name} SPLIT OPEN`;
    this.messageTimer = 1.4;
    this.boss = null;
    this.audio.chord(196);
  }

  private damagePlayer() {
    const player = this.player;
    if (player.invulnerable > 0) return;
    if (player.shield > 0) {
      player.shield = 0;
      player.invulnerable = 0.7;
      this.message = "SHIELD POP";
      this.messageTimer = 0.7;
      this.spawnBurst(player.x + player.w / 2, player.y + player.h / 2, "#75ffd1", 24);
      this.audio.blip(700, 0.12, 0.03, "triangle");
      return;
    }
    player.lives -= 1;
    player.invulnerable = 2;
    player.x = W / 2 - player.w / 2;
    player.vx = 0;
    this.shake = 14;
    this.flash = 0.65;
    this.spawnBurst(player.x + player.w / 2, player.y + player.h / 2, PILOTS[this.pilot].primary, 28);
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
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
      this.message = "NEW CABINET RECORD";
    } else {
      this.message = "THE MOON TOOK THE LAST BANANA";
    }
    this.messageTimer = 99;
    this.audio.chord(82);
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
    this.emitStatus(true);
  }

  private dropPickup(x: number, y: number) {
    const kinds: Pickup["kind"][] = ["rapid", "spread", "shield", "special"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.pickups.push({ x, y, px: x, py: y, vx: (Math.random() - 0.5) * 42, vy: 78, kind, r: 14, life: 8 });
  }

  private spawnBurst(x: number, y: number, color: string, count: number) {
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
    if (this.state === "title") this.drawTitle();
    else {
      this.drawPlayfield();
      if (this.state === "paused") this.drawPause();
      if (this.state === "gameOver") this.drawGameOver();
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.28})`;
      ctx.fillRect(0, 0, W, H);
    }
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

    const leftGlow = ctx.createRadialGradient(0, H * 0.45, 0, 0, H * 0.45, W * 0.72);
    leftGlow.addColorStop(0, "rgba(46,184,255,.15)");
    leftGlow.addColorStop(1, "rgba(46,184,255,0)");
    ctx.fillStyle = leftGlow;
    ctx.fillRect(0, 0, W, H);
    const rightGlow = ctx.createRadialGradient(W, H * 0.45, 0, W, H * 0.45, W * 0.72);
    rightGlow.addColorStop(0, "rgba(255,63,159,.14)");
    rightGlow.addColorStop(1, "rgba(255,63,159,0)");
    ctx.fillStyle = rightGlow;
    ctx.fillRect(0, 0, W, H);

    for (const star of this.stars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = star.size > 2 ? pilot.secondary : "#ffffff";
      ctx.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
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
  }

  private drawTitle() {
    const ctx = this.ctx;
    const pilot = PILOTS[this.pilot];
    const pulse = 1 + Math.sin(this.titleClock * 2.4) * 0.025;
    ctx.save();
    ctx.translate(W / 2, 164);
    ctx.scale(pulse, pulse);
    ctx.textAlign = "center";
    ctx.font = "900 70px monospace";
    ctx.shadowBlur = 24;
    ctx.shadowColor = pilot.primary;
    ctx.fillStyle = "#fff7cc";
    ctx.fillText("MONKEY", 0, 0);
    ctx.fillStyle = pilot.primary;
    ctx.fillText("INVADERS", 0, 67);
    ctx.restore();
    ctx.shadowBlur = 0;

    this.drawMonkey(W / 2 - 38, 262, 76, 76, this.pilot, Math.sin(this.titleClock * 3) * 0.08);
    this.drawBanana(W / 2 + 68, 287, 1.2, -0.5);
    this.drawAlien(W / 2 - 138, 282, 58, 44, "spinner", this.titleClock * 2);

    ctx.textAlign = "center";
    ctx.fillStyle = pilot.secondary;
    ctx.font = "800 17px monospace";
    ctx.fillText(`${pilot.name} CHANNEL · ${pilot.tagline}`, W / 2, 382);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "700 14px monospace";
    ctx.fillText("CHOOSE THE SIGNAL, NOT THE LABEL", W / 2, 410);
    ctx.fillStyle = Math.sin(this.titleClock * 4) > 0 ? "#fff" : pilot.primary;
    ctx.font = "900 20px monospace";
    ctx.fillText("PRESS START", W / 2, 460);
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.font = "700 11px monospace";
    ctx.fillText("MOVE A/D OR ←/→ · FIRE X/Z/SPACE · BLAST C/W/↑ · Q PILOT", W / 2, 493);
  }

  private drawPlayfield() {
    const ctx = this.ctx;
    this.drawHud();
    for (const pickup of this.pickups) this.drawPickup(pickup);
    for (const enemy of this.enemies) {
      const x = lerp(enemy.px, enemy.x, this.renderAlpha);
      const y = lerp(enemy.py, enemy.y, this.renderAlpha) + Math.sin(enemy.phase) * (enemy.kind === "spinner" ? 5 : 2);
      if (enemy.flash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = enemy.flash;
        ctx.fillStyle = "#fff";
        ctx.fillRect(x - 3, y - 3, enemy.w + 6, enemy.h + 6);
        ctx.restore();
      }
      this.drawAlien(x, y, enemy.w, enemy.h, enemy.kind, enemy.phase);
    }
    if (this.boss) this.drawBoss(this.boss);
    for (const projectile of this.projectiles) this.drawProjectile(projectile);
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
    if (this.player.invulnerable <= 0 || Math.floor(this.player.invulnerable * 12) % 2 === 0) {
      this.drawMonkey(playerX, playerY, this.player.w, this.player.h, this.pilot, this.player.vx / this.player.speed * 0.16);
    }
    if (this.player.shield > 0) {
      ctx.strokeStyle = "rgba(117,255,209,.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerX + this.player.w / 2, playerY + this.player.h / 2, 38 + Math.sin(this.titleClock * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.messageTimer > 0) this.drawMessage(this.message);
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
    ctx.fillText(this.boss ? `BOSS ${this.boss.name}` : `WAVE ${this.wave}`, W / 2, 24);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ff8ba7";
    ctx.fillText(`LIVES ${"♥".repeat(Math.max(0, this.player.lives))}`, W - 18, 24);

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
    ctx.fillText(this.player.special >= 100 ? "BLAST READY" : "BANANA BLAST", W / 2, H - 30);

    if (this.boss) {
      const width = 360;
      const x = W / 2 - width / 2;
      const y = 55;
      ctx.fillStyle = "rgba(0,0,0,.62)";
      ctx.fillRect(x, y, width, 12);
      ctx.fillStyle = this.boss.color;
      ctx.fillRect(x, y, width * clamp(this.boss.hp / this.boss.maxHp, 0, 1), 12);
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.strokeRect(x, y, width, 12);
    }
  }

  private drawMonkey(x: number, y: number, w: number, h: number, pilotId: PilotId, tilt: number) {
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
    ctx.fillRect(w * 0.3, h * 0.22, w * 0.4, h * 0.30);
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
    ctx.fillRect(w * 0.43, -h * 0.02, w * 0.14, h * 0.20);
    ctx.restore();
  }

  private drawAlien(x: number, y: number, w: number, h: number, kind: Enemy["kind"], phase: number) {
    const ctx = this.ctx;
    const color = this.enemyColor(kind);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (kind === "spinner") ctx.rotate(Math.sin(phase) * 0.08);
    ctx.fillStyle = color;
    ctx.fillRect(w * 0.16, h * 0.18, w * 0.68, h * 0.58);
    ctx.fillRect(w * 0.04, h * 0.34, w * 0.92, h * 0.28);
    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.fillRect(w * 0.24, h * 0.22, w * 0.52, h * 0.08);
    ctx.fillStyle = "#07101b";
    ctx.fillRect(w * 0.27, h * 0.38, w * 0.13, h * 0.13);
    ctx.fillRect(w * 0.60, h * 0.38, w * 0.13, h * 0.13);
    ctx.fillStyle = kind === "tank" ? "#fff36b" : "#ff8faf";
    ctx.fillRect(w * 0.31, h * 0.41, w * 0.06, h * 0.06);
    ctx.fillRect(w * 0.63, h * 0.41, w * 0.06, h * 0.06);
    ctx.fillStyle = color;
    ctx.fillRect(w * 0.12, h * 0.74, w * 0.18, h * 0.18);
    ctx.fillRect(w * 0.70, h * 0.74, w * 0.18, h * 0.18);
    ctx.restore();
  }

  private drawBoss(boss: Boss) {
    const ctx = this.ctx;
    const x = lerp(boss.px, boss.x, this.renderAlpha);
    const y = lerp(boss.py, boss.y, this.renderAlpha);
    ctx.save();
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
    ctx.restore();
  }

  private drawProjectile(projectile: Projectile) {
    const x = lerp(projectile.px, projectile.x, this.renderAlpha);
    const y = lerp(projectile.py, projectile.y, this.renderAlpha);
    if (projectile.banana) {
      this.drawBanana(x, y, projectile.r / 8, Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2);
      return;
    }
    const ctx = this.ctx;
    ctx.fillStyle = "#ff4b75";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff245f";
    ctx.beginPath();
    ctx.arc(x, y, projectile.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawBanana(x: number, y: number, scale = 1, rotation = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation + this.titleClock * 6);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "#ffd94a";
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
    const color = this.pickupColor(pickup.kind);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.titleClock * 1.8);
    ctx.shadowBlur = 16;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillRect(-12, -12, 24, 24);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#06101d";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 12px monospace";
    ctx.fillText(pickup.kind === "rapid" ? "R" : pickup.kind === "spread" ? "3" : pickup.kind === "shield" ? "S" : "★", 0, 1);
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

  private drawPause() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,.68)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = PILOTS[this.pilot].secondary;
    ctx.font = "900 54px monospace";
    ctx.fillText("ARCHIVE PAUSED", W / 2, H / 2 - 12);
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = "800 15px monospace";
    ctx.fillText("PRESS P OR PAUSE TO RETURN TO THE SIGNAL", W / 2, H / 2 + 32);
  }

  private drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,.76)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff6b83";
    ctx.font = "900 64px monospace";
    ctx.fillText("SIGNAL LOST", W / 2, 190);
    ctx.fillStyle = "#ffe774";
    ctx.font = "900 26px monospace";
    ctx.fillText(`SCORE ${String(this.score).padStart(7, "0")}`, W / 2, 248);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "800 16px monospace";
    ctx.fillText(this.message, W / 2, 286);
    ctx.fillStyle = Math.sin(this.titleClock * 4) > 0 ? "#fff" : PILOTS[this.pilot].primary;
    ctx.font = "900 20px monospace";
    ctx.fillText("PRESS START TO REDEPLOY", W / 2, 350);
  }

  private enemyColor(kind: Enemy["kind"]) {
    if (kind === "spinner") return "#ff4fc3";
    if (kind === "tank") return "#ff9e3f";
    return "#54e6ff";
  }

  private pickupColor(kind: Pickup["kind"]) {
    if (kind === "rapid") return "#54e6ff";
    if (kind === "spread") return "#ff4fc3";
    if (kind === "shield") return "#75ffd1";
    return "#fff36b";
  }

  private emitStatus(force = false) {
    const status: CabinetStatus = {
      state: this.state,
      pilot: this.pilot,
      score: this.score,
      highScore: this.highScore,
      wave: this.wave,
      lives: this.player.lives,
    };
    const key = JSON.stringify(status);
    if (!force && key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    this.onStatus(status);
  }
}
