# Monkey Invaders Enhanced

An absurd fixed-step canvas shooter built for keyboard, multitouch and gamepad
play. Move horizontally, throw bananas, preserve readable lanes, build combo and
Blast charge, and survive the B$S cabinet's pilots, events and bosses.

## Controls

- Move: `A/D`, `←/→`, D-pad/left stick, or the cabinet touch arrows.
- Fire: `Space`, `X`, `Z`, gamepad south button, or the banana button.
- Blast: `C`, `W`, `↑`, gamepad east button, or the Blast button.
- Start / pause: `Enter` / `P` (gamepad Start / Back).
- Title shortcuts: `Q` pilot, `M` mode, `I` cabinet disclosure.

The cabinet keeps its original CURD code, Kong Mode, pilots, achievements,
credits, pickups, high scores and modes. Camera shake is optional and render
motion is restrained automatically when reduced motion is requested.

## Gameplay structure

- Classic: five authored sectors, each with four combat encounters, an
  escalation and a boss; circuit two continues with mutations without resetting
  score.
- Endless: constrained threat-budget director and recovery encounters.
- Boss Rush: all thirteen bosses with controlled recovery and cumulative score.
- Daily Challenge: versioned UTC seed for pilot, sectors, formations, events,
  upgrade offers and bosses.

Focused systems live in `client/src/game/`; the canvas engine remains the owner
of fixed-step simulation and interpolation. See:

- [`docs/gameplay-schema.md`](docs/gameplay-schema.md)
- [`docs/balancing-guide.md`](docs/balancing-guide.md)
- [`docs/validation.md`](docs/validation.md)

## Quality commands

```sh
npm run check
npm test
npm run lint
npm run build
```
