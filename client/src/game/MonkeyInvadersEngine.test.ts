import { beforeEach, describe, expect, it } from "vitest";

import { MonkeyInvadersEngine } from "@/game/MonkeyInvadersEngine";

/**
 * The engine talks to the DOM, localStorage and WebAudio. None of that matters
 * for the wave/state machine, so we hand it inert stand-ins and drive the
 * fixed-step update directly.
 */
function installBrowserStubs() {
  const store = new Map<string, string>();
  const localStorageStub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  const noop = () => {};
  const windowStub = {
    addEventListener: noop,
    removeEventListener: noop,
    setTimeout: noop,
  };
  Object.assign(globalThis, {
    localStorage: localStorageStub,
    window: windowStub,
    AudioContext: class {
      state = "running";
      resume() {}
      suspend() {}
    },
  });
}

function makeCanvas() {
  const ctx = new Proxy(
    {},
    {
      get: () => () => undefined,
      set: () => true,
    }
  );
  return {
    width: 960,
    height: 640,
    getContext: () => ctx,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLCanvasElement;
}

/** Field access the public API deliberately hides — fine for a state-machine test. */
type EngineInternals = {
  state: string;
  wave: number;
  enemies: { hp: number }[];
  update(dt: number): void;
  startGame(): void;
  setMuted(value: boolean): void;
};

function createEngine() {
  const engine = new MonkeyInvadersEngine(makeCanvas(), () => {});
  const internals = engine as unknown as EngineInternals;
  internals.setMuted(true); // keeps WebAudio out of the test entirely
  return internals;
}

const FIXED = 1 / 60;

function step(engine: EngineInternals, frames: number) {
  for (let i = 0; i < frames; i += 1) engine.update(FIXED);
}

describe("MonkeyInvadersEngine wave clearing", () => {
  beforeEach(() => {
    installBrowserStubs();
  });

  it("clears the wave when the final alien dies", () => {
    const engine = createEngine();
    engine.startGame();
    expect(engine.enemies.length).toBeGreaterThan(0);

    // Shooting an enemy only zeroes its hp; removal is the engine's job.
    for (const enemy of engine.enemies) enemy.hp = 0;
    step(engine, 2);

    expect(engine.enemies).toHaveLength(0);
    expect(engine.state).toBe("waveClear");
  });

  it("does not strand a dead alien when it is the last one alive", () => {
    const engine = createEngine();
    engine.startGame();

    // Kill everything except one, let the engine settle, then kill the last.
    const [last, ...rest] = engine.enemies;
    for (const enemy of rest) enemy.hp = 0;
    step(engine, 2);
    expect(engine.enemies).toHaveLength(1);
    expect(engine.state).toBe("playing");

    last.hp = 0;
    step(engine, 1);

    expect(engine.enemies).toHaveLength(0);
    expect(engine.state).toBe("waveClear");
  });

  it("advances to the next wave instead of soft-locking", () => {
    const engine = createEngine();
    engine.startGame();
    const startWave = engine.wave;

    for (const enemy of engine.enemies) enemy.hp = 0;
    // Long enough to run out the waveClear timer and spawn the next wave.
    step(engine, 150);

    expect(engine.state).toBe("playing");
    expect(engine.wave).toBe(startWave + 1);
    expect(engine.enemies.length).toBeGreaterThan(0);
  });

  it("keeps playing while any alien is still alive", () => {
    const engine = createEngine();
    engine.startGame();

    const survivors = engine.enemies.slice(0, 1);
    for (const enemy of engine.enemies) {
      if (!survivors.includes(enemy)) enemy.hp = 0;
    }
    step(engine, 30);

    expect(engine.state).toBe("playing");
  });
});
