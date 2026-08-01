# Changelog

## Gameplay Evolution (draft)

### Why

The cabinet presentation was complete, but combat waves were increasingly large
random rectangles, all thirteen bosses shared the same sine movement, fan volley
and meteor loop, pilot selection did not explain mechanics, and Daily only
seeded one permanent event while formations and rewards still used ambient
randomness. The engine had no automated gameplay suite.

### Changed

- Built Classic around five themed sectors and thirty authored encounters,
  followed by score-preserving circuits.
- Added twenty validated formation templates and a constrained Endless threat
  director with explicit safe lanes, compatibility rules and recovery waves.
- Preserved all seven enemy classes while adding role rules, destination/dive
  warnings, shield break windows and selective, labelled elite mutations.
- Gave BOLT, NOVA, REX and GLITCH visible, balanced movement, weapon, Blast and
  scoring identities without changing their controls or unlock routes.
- Grouped all thirteen pickups into six visible families and added twelve
  temporary run modifiers offered three at a time after sector bosses.
- Rebuilt all thirteen original bosses around distinct movement, projectile,
  hazard, opening, phase, scoring and defeat contracts. Boss Rush now completes
  after all thirteen with controlled recovery.
- Added constrained random-event rules, readable safe corridors and score/fail
  objectives. Events cannot start during intros, respawn invulnerability or
  transitions.
- Added gradual combo, accuracy, multi-kill, elite/golden, near-miss, event,
  risky-pickup, fast-clear, no-damage, phase-break and Blast-retention scoring.
- Added compact major-wave results and five persisted wave medals.
- Versioned Daily content now precomputes UTC pilot, sectors, formations, events,
  upgrade offers and bosses. Seed version prevents historical rewrites.
- Added optional camera shake, reduced-motion effect caps, pilot muzzle flashes,
  enemy destruction shapes, non-colour cues and a hard particle budget.
- Split gameplay content into focused formation, director, sector, boss, pilot,
  upgrade, event, enemy, score, Daily and persistence modules.
- Added targeted pure tests and real-engine headless circuit smoke tests.

### Persistence

All existing `monkey-invaders-v3-*` keys remain authoritative and untouched. The
additive `monkey-invaders-v4-progress` migration stores pilot bests, medals,
versioned Daily records and camera-shake preference. Existing scores, pilots,
achievements, collected pickups, skins, credits, settings and disclosure state
continue to load.

### Preserved

The 60 Hz fixed step, interpolation, canvas identity, keyboard/touch controls,
landscape cabinet, pilots, modes, seven enemies, thirteen bosses, thirteen
pickups, events, achievements, credits, CURD/Kong secrets and deployment files
remain in place. No production URL or hosting configuration changed.

### Baseline before editing

- `npm ci`: passed.
- `npm run check`: passed.
- `npm run build`: passed.
- The repository had no test or lint script.
