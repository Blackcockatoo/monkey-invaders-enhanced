import type { GameState } from "@/game/types";

export class ArcadeAudio {
  muted = false;
  private context: AudioContext | null = null;
  private musicTimer = 0;
  private musicScale: "classic" | "alt" = "classic";

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

  setMusicScale(scale: "classic" | "alt") {
    this.musicScale = scale;
  }

  blip(
    frequency = 440,
    duration = 0.06,
    gain = 0.035,
    type: OscillatorType = "square"
  ) {
    if (this.muted) return;
    this.unlock();
    const context = this.context;
    if (!context) return;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    volume.gain.setValueAtTime(gain, context.currentTime);
    volume.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + duration
    );
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  chord(root: number) {
    this.blip(root, 0.12, 0.026, "triangle");
    window.setTimeout(() => this.blip(root * 1.25, 0.12, 0.02, "triangle"), 55);
    window.setTimeout(
      () => this.blip(root * 1.5, 0.16, 0.018, "triangle"),
      110
    );
  }

  coinInsert() {
    this.blip(520, 0.05, 0.03, "square");
    window.setTimeout(() => this.blip(880, 0.09, 0.03, "square"), 60);
  }

  siren() {
    if (this.muted) return;
    this.unlock();
    const context = this.context;
    if (!context) return;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = "sawtooth";
    volume.gain.setValueAtTime(0.02, context.currentTime);
    oscillator.frequency.setValueAtTime(220, context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(
      440,
      context.currentTime + 0.4
    );
    oscillator.frequency.linearRampToValueAtTime(
      220,
      context.currentTime + 0.8
    );
    volume.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.9);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.9);
  }

  achievement() {
    this.blip(660, 0.08, 0.02, "triangle");
    window.setTimeout(() => this.blip(880, 0.08, 0.022, "triangle"), 70);
    window.setTimeout(() => this.blip(1100, 0.14, 0.024, "triangle"), 140);
  }

  glitch() {
    for (let index = 0; index < 4; index += 1) {
      window.setTimeout(
        () => this.blip(200 + Math.random() * 900, 0.03, 0.015, "sawtooth"),
        index * 40
      );
    }
  }

  tickMusic(dt: number, state: GameState, wave: number) {
    if (this.muted || state !== "playing") return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    const scale =
      this.musicScale === "classic"
        ? [0, 3, 7, 10, 7, 3]
        : [0, 5, 7, 12, 7, 5, 3];
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
