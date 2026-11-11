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
import { LangMenu } from "@/components/LangMenu";
import {
  CABINET_COPY,
  LANGS,
  LANG_ARIA,
  LANG_ENGLISH,
  LANG_NATIVE,
  detectLang,
  saveLang,
  type Lang,
  type ModeId,
} from "@/game/i18n";

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

const PILOT_NAMES: Record<PilotId, string> = {
  bolt: "BOLT",
  nova: "NOVA",
  rex: "REX",
  glitch: "GLITCH",
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MonkeyInvadersEngine | null>(null);
  const [status, setStatus] = useState<CabinetStatus>(INITIAL_STATUS);
  const [muted, setMuted] = useState(false);
  const [lang, setLang] = useState<Lang>(() => detectLang());
  const t = CABINET_COPY[lang];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new MonkeyInvadersEngine(canvas, setStatus);
    engineRef.current = engine;
    setMuted(engine.isMuted());
    engine.start();
    return () => engine.destroy();
  }, []);

  useEffect(() => {
    engineRef.current?.setLang(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const pickLang = (next: Lang) => {
    setLang(next);
    saveLang(next);
  };
  // Top-right of the rail; at the top of the d-pad column when the rail is
  // hidden on short landscape phones; top-right of the portrait rotate card.
  const langSwitch = (className: string) => (
    <LangMenu lang={lang} langs={LANGS} native={LANG_NATIVE} english={LANG_ENGLISH} label={LANG_ARIA} onPick={pickLang} className={className} />
  );

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
  const pilotLabel = `${t.colors[status.pilot]} / ${PILOT_NAMES[status.pilot]}`;
  const modeLabel = t.modes[status.mode as ModeId] ?? MODE_LABELS[status.mode];

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
          <span>B$S</span> {t.arcade}
        </div>
        <div className="machine-status">
          <i /> TWIN SIGNAL <strong>002</strong>
        </div>
        {langSwitch("lang-switch")}
      </header>

      <section className="cabinet" aria-label={t.cabinetLabel}>
        <div className="cabinet-crown" aria-hidden="true">
          <span>★</span>
          <b>MONKEY INVADERS</b>
          <span>★</span>
        </div>

        <div className="cabinet-data-rail" aria-label="Live cabinet status">
          <span>
            <small>{t.pilotSignal}</small>
            <b>{pilotLabel}</b>
          </span>
          <span>
            <small>{t.missionMode}</small>
            <b>{modeLabel}</b>
          </span>
          <span>
            <small>{t.waveLives}</small>
            <b>
              {String(status.wave).padStart(2, "0")} / {status.lives}
            </b>
          </span>
          <span>
            <small>{t.scoreCredits}</small>
            <b>
              {String(status.score).padStart(7, "0")} / {status.credits}
            </b>
          </span>
        </div>

        <div className="play-layout">
          {langSwitch("lang-switch lang-compact")}
          <div className="screen-bezel">
            <div className="screen-wrap">
              <canvas
                ref={canvasRef}
                width={960}
                height={540}
                aria-label={t.gameLabel}
                tabIndex={0}
              />
              <div className="screen-glass" aria-hidden="true" />
              <div className="scanlines" aria-hidden="true" />
            </div>
          </div>

          <div className="control-deck">
            <div className="dpad" aria-label="Movement controls">
              <button type="button" aria-label={t.moveLeft} {...bind("left")}>
                <span>◀</span>
              </button>
              <button type="button" aria-label={t.moveRight} {...bind("right")}>
                <span>▶</span>
              </button>
            </div>

            <div className="mini-controls">
              <button type="button" onClick={() => press("start")}>
                {t.start}
              </button>
              <button
                type="button"
                className="pilot-switch"
                onClick={cyclePilot}
              >
                {t.pilot}
                <br />
                <strong>{pilotLabel}</strong>
              </button>
              <button
                type="button"
                className="pilot-switch"
                onClick={cycleMode}
              >
                {t.mode}
                <br />
                <strong>{modeLabel}</strong>
              </button>
              <button type="button" onClick={() => press("pause")}>
                {t.archive}
                <br />
                {t.pause}
              </button>
              <button type="button" aria-pressed={muted} onClick={toggleMute}>
                {muted ? t.soundOff : t.soundOn}
              </button>
            </div>

            <div className="action-controls" aria-label="Action controls">
              <button
                className="fire"
                type="button"
                aria-label={t.throwBanana}
                {...bind("fire")}
              >
                <span>🍌</span>
                <small>{t.fire}</small>
              </button>
              <button
                className="blast"
                type="button"
                aria-label={t.bananaBlast}
                {...bind("special")}
              >
                <span>★</span>
                <small>{t.blast}</small>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="pilot-choice" aria-label={t.pilotChoice}>
        <button
          className={status.pilot === "bolt" ? "active" : ""}
          onClick={() => setPilot("bolt")}
          type="button"
        >
          <span className="pilot-dot blue" /> BOLT
        </button>
        <p>{t.pilotNote}</p>
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
          {online ? t.online : t.warming} · {modeLabel} · {t.wave}{" "}
          {status.wave} · {t.hi} {String(status.highScore).padStart(7, "0")}
        </p>
        <p className="desktop-hint">
          {t.desktopHint}
        </p>
        <p className="mobile-hint">
          {t.mobileHint}
        </p>
      </footer>

      <div className="rotate-card" role="note">
        <b>{t.turnTitle}</b>
        <span>{t.turnBody}</span>
        <div className="rotate-icon">↻</div>
        {langSwitch("lang-switch lang-rotate")}
      </div>
    </main>
  );
}
