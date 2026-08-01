import assert from "node:assert/strict";
import test from "node:test";
import type {
  GameMode,
  PickupKind,
  PilotId,
  RandomEventId,
} from "../client/src/game/types.ts";

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const storage = new MemoryStorage();
storage.setItem("monkey-invaders-v3-muted", "true");

Object.defineProperties(globalThis, {
  localStorage: { configurable: true, value: storage },
  navigator: { configurable: true, value: { getGamepads: () => [] } },
  window: {
    configurable: true,
    value: {
      addEventListener() {},
      removeEventListener() {},
      setTimeout,
      matchMedia: () => ({ matches: true }),
    },
  },
  cancelAnimationFrame: { configurable: true, value: () => undefined },
});

const { MonkeyInvadersEngine } =
  await import("../client/src/game/MonkeyInvadersEngine.ts");

function canvasMock() {
  const gradient = { addColorStop() {} };
  const context = new Proxy(
    {
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      measureText: (text: string) => ({ width: text.length * 8 }),
    } as Record<string, unknown>,
    {
      get(target, property: string) {
        if (property in target) return target[property];
        return () => undefined;
      },
      set(target, property: string, value) {
        target[property] = value;
        return true;
      },
    }
  );
  return {
    dataset: {},
    getContext: () => context,
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
  };
}

function makeEngine(mode: GameMode, pilot: PilotId = "bolt") {
  const statuses: unknown[] = [];
  const engine = new MonkeyInvadersEngine(
    canvasMock() as unknown as HTMLCanvasElement,
    status => statuses.push(status)
  ) as any;
  engine.mode = mode;
  engine.pilot = pilot;
  engine.startGame();
  return { engine, statuses };
}

function clearEncounter(engine: any) {
  if (engine.boss) {
    engine.state = "playing";
    engine.boss.entering = false;
    engine.boss.vulnerable = true;
    engine.killBoss();
  } else {
    engine.enemies = [];
    engine.checkWaveClear();
  }
  if (engine.state === "upgradeChoice") engine.chooseRunUpgrade();
}

function advanceIntermission(engine: any) {
  assert.equal(engine.state, "waveClear");
  engine.waveTimer = 0;
  engine.update(1 / 60);
}

test("a headless Classic circuit traverses thirty authored encounters and loops scores forward", () => {
  const { engine } = makeEngine("classic", "bolt");
  const seen = new Set<string>();
  for (let encounter = 1; encounter <= 30; encounter += 1) {
    seen.add(`${engine.currentSector}:${engine.currentEncounter}`);
    assert.equal(engine.wave, encounter);
    clearEncounter(engine);
    advanceIntermission(engine);
  }
  assert.equal(seen.size, 30);
  assert.equal(engine.wave, 31);
  assert.equal(engine.currentCircuit, 2);
  assert.equal(engine.currentSector, "neonOrbit");
  engine.destroy();
});

test("Boss Rush visits all thirteen bosses with controlled upgrade/recovery stops", () => {
  const { engine } = makeEngine("bossRush", "nova");
  const names: string[] = [];
  while (engine.state !== "gameOver") {
    assert.ok(engine.boss);
    names.push(engine.boss.name);
    clearEncounter(engine);
    if (engine.state === "waveClear") advanceIntermission(engine);
  }
  assert.equal(names.length, 13);
  assert.equal(new Set(names).size, 13);
  assert.equal(engine.message, "ALL THIRTEEN SIGNALS CLEARED");
  engine.destroy();
});

test("an extended Endless run crosses forty-five budgeted encounters and recovery waves", () => {
  const { engine } = makeEngine("endless", "rex");
  const formations = new Set<string>();
  for (let encounter = 1; encounter <= 45; encounter += 1) {
    if (!engine.boss) formations.add(engine.currentFormationId);
    clearEncounter(engine);
    advanceIntermission(engine);
  }
  assert.equal(engine.wave, 46);
  assert.ok(formations.size >= 8);
  assert.ok(engine.currentCircuit >= 2);
  engine.destroy();
});

test("Daily completes the same thirty-encounter seeded run and records seed version", () => {
  const { engine } = makeEngine("daily");
  const seed = engine.dailyPlan.seed;
  while (engine.state !== "gameOver") {
    clearEncounter(engine);
    if (engine.state === "waveClear") advanceIntermission(engine);
  }
  assert.equal(engine.dailyPlan.seed, seed);
  assert.equal(engine.dailyPlan.seedVersion, 2);
  assert.equal(engine.message, "DAILY SIGNAL COMPLETE");
  engine.destroy();
});

test("every pilot, pickup and event path enters the fixed-step engine", () => {
  const pilots: PilotId[] = ["bolt", "nova", "rex", "glitch"];
  const widths = new Set<number>();
  for (const pilot of pilots) {
    const { engine } = makeEngine("classic", pilot);
    widths.add(engine.player.speed);
    engine.fireBanana();
    engine.player.special = 100;
    engine.fireSpecial();
    engine.destroy();
  }
  assert.ok(widths.size >= 3);

  const { engine } = makeEngine("classic", "bolt");
  engine.wave = 30;
  const pickups: PickupKind[] = [
    "rapid",
    "spread",
    "shield",
    "special",
    "magnet",
    "laser",
    "freeze",
    "boomerang",
    "bomb",
    "rainbow",
    "gorilla",
    "timeSlow",
    "mystery",
  ];
  for (const pickup of pickups) engine.applyPickupEffect(pickup);
  assert.equal(engine.player.special, 100);
  const events: RandomEventId[] = [
    "bananaStorm",
    "lowGravity",
    "alienPanic",
    "goldenWave",
    "powerSurge",
    "meteorShower",
    "mysteryCrate",
    "glitchedReality",
  ];
  for (const event of events) {
    engine.activeEvent = null;
    engine.triggerRandomEvent(event);
    assert.equal(engine.activeEvent, event);
  }
  (globalThis.navigator as any).getGamepads = () => [
    {
      axes: [0.9],
      buttons: Array.from({ length: 16 }, (_, index) => ({
        pressed: index === 0,
      })),
    },
  ];
  engine.updateGamepad();
  assert.equal(engine.gamepadHeld.right, true);
  assert.equal(engine.gamepadHeld.fire, true);
  (globalThis.navigator as any).getGamepads = () => [];
  engine.togglePause();
  assert.equal(engine.state, "paused");
  engine.togglePause();
  assert.equal(engine.state, "playing");
  engine.destroy();
});
