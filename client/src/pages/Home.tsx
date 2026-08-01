import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  MonkeyInvadersEngine,
  type Action,
  type CabinetStatus,
  type PilotId,
} from "@/game/MonkeyInvadersEngine";
import { MODE_LABELS } from "@/game/content";

const HOLD_ACTIONS = new Set<Action>(["left", "right", "fire"]);
const INITIAL_STATUS: CabinetStatus = {
  state: "boot",
  pilot: "bolt",
  mode: "classic",
  score: 0,
  highScore: 0,
  wave: 1,
  lives: 3,
  credits: 0,
};

const PILOT_LABELS: Record<PilotId, string> = {
  bolt: "BLUE / BOLT",
  nova: "PINK / NOVA",
  rex: "AMBER / REX",
  glitch: "GREEN / GLITCH",
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MonkeyInvadersEngine | null>(null);
  const [status, setStatus] = useState<CabinetStatus>(INITIAL_STATUS);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new MonkeyInvadersEngine(canvas, setStatus);
    engineRef.current = engine;
    setMuted(engine.isMuted());
    engine.start();
    return () => engine.destroy();
  }, []);

  const press = useCallback(
    (action: Action) => engineRef.current?.press(action),
    []
  );
  const release = useCallback(
    (action: Action) => engineRef.current?.release(action),
    []
  );
  const bind = (action: Action) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      press(action);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      release(action);
    },
    onPointerCancel: () => release(action),
    onPointerLeave: () => HOLD_ACTIONS.has(action) && release(action),
    onContextMenu: (event: ReactMouseEvent<HTMLButtonElement>) =>
      event.preventDefault(),
  });

  const cyclePilot = () => engineRef.current?.cyclePilot();
  const cycleMode = () => engineRef.current?.cycleMode();
  const setPilot = (pilot: PilotId) => engineRef.current?.selectPilot(pilot);
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    engineRef.current?.setMuted(next);
  };

  const online = status.state !== "title" && status.state !== "boot";
  const pilotLabel = PILOT_LABELS[status.pilot];
  const modeLabel = MODE_LABELS[status.mode];

  return (
    <main
      className={`arcade-page pilot-${status.pilot}`}
      data-state={status.state}
      data-mode={status.mode}
    >
      <div className="arcade-room" aria-hidden="true">
        <i className="room-glow room-glow-blue" />
        <i className="room-glow room-glow-pink" />
        <i className="room-grid" />
        <i className="ghost-cabinet ghost-one" />
        <i className="ghost-cabinet ghost-two" />
      </div>

      <header className="top-rail">
        <div className="studio-mark">
          <span>B$S</span> BLUE $NAKE ARCADE
        </div>
        <div className="machine-status">
          <i /> TWIN SIGNAL <strong>002</strong>
        </div>
      </header>

      <section className="cabinet" aria-label="Monkey Invaders arcade cabinet">
        <div className="cabinet-crown" aria-hidden="true">
          <span>★</span>
          <b>MONKEY INVADERS</b>
          <span>★</span>
        </div>

        <div className="cabinet-data-rail" aria-label="Live cabinet status">
          <span>
            <small>PILOT SIGNAL</small>
            <b>{pilotLabel}</b>
          </span>
          <span>
            <small>MISSION MODE</small>
            <b>{modeLabel}</b>
          </span>
          <span>
            <small>WAVE / LIVES</small>
            <b>
              {String(status.wave).padStart(2, "0")} / {status.lives}
            </b>
          </span>
          <span>
            <small>SCORE / CREDITS</small>
            <b>
              {String(status.score).padStart(7, "0")} / {status.credits}
            </b>
          </span>
        </div>

        <div className="play-layout">
          <div className="screen-bezel">
            <div className="screen-wrap">
              <canvas
                ref={canvasRef}
                width={960}
                height={540}
                aria-label="Playable Monkey Invaders game"
                tabIndex={0}
              />
              <div className="screen-glass" aria-hidden="true" />
              <div className="scanlines" aria-hidden="true" />
            </div>
          </div>

          <div className="control-deck">
            <div className="dpad" aria-label="Movement controls">
              <button type="button" aria-label="Move left" {...bind("left")}>
                <span>◀</span>
              </button>
              <button type="button" aria-label="Move right" {...bind("right")}>
                <span>▶</span>
              </button>
            </div>

            <div className="mini-controls">
              <button type="button" onClick={() => press("start")}>
                START
              </button>
              <button
                type="button"
                className="pilot-switch"
                onClick={cyclePilot}
              >
                PILOT
                <br />
                <strong>{pilotLabel}</strong>
              </button>
              <button
                type="button"
                className="pilot-switch"
                onClick={cycleMode}
              >
                MODE
                <br />
                <strong>{modeLabel}</strong>
              </button>
              <button type="button" onClick={() => press("pause")}>
                ARCHIVE
                <br />
                PAUSE
              </button>
              <button type="button" aria-pressed={muted} onClick={toggleMute}>
                {muted ? "SOUND OFF" : "SOUND ON"}
              </button>
            </div>

            <div className="action-controls" aria-label="Action controls">
              <button
                className="fire"
                type="button"
                aria-label="Throw banana"
                {...bind("fire")}
              >
                <span>🍌</span>
                <small>FIRE</small>
              </button>
              <button
                className="blast"
                type="button"
                aria-label="Banana blast"
                {...bind("special")}
              >
                <span>★</span>
                <small>BLAST</small>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="pilot-choice" aria-label="Pilot channel selection">
        <button
          className={status.pilot === "bolt" ? "active" : ""}
          onClick={() => setPilot("bolt")}
          type="button"
        >
          <span className="pilot-dot blue" /> BOLT
        </button>
        <p>Two core signals. More pilots unlock inside the cabinet.</p>
        <button
          className={status.pilot === "nova" ? "active" : ""}
          onClick={() => setPilot("nova")}
          type="button"
        >
          NOVA <span className="pilot-dot pink" />
        </button>
      </div>

      <footer className="machine-footer">
        <p>
          {online ? "CABINET ONLINE" : "WARMING TUBES"} · {modeLabel} · WAVE{" "}
          {status.wave} · HI {String(status.highScore).padStart(7, "0")}
        </p>
        <p className="desktop-hint">
          MOVE A/D OR ←/→ · FIRE SPACE/X/Z · BLAST C/W/↑ · ENTER START · P PAUSE
          · Q PILOT · M MODE · I INFO
        </p>
        <p className="mobile-hint">
          MULTI-TOUCH READY · TURN LANDSCAPE FOR THE FULL CABINET
        </p>
      </footer>

      <div className="rotate-card" role="note">
        <b>TURN THE CABINET</b>
        <span>Monkey Invaders is made for comfortable landscape play.</span>
        <div>↻</div>
      </div>
    </main>
  );
}
