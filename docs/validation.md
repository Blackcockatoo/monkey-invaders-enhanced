# Gameplay validation matrix

## Baseline on `main`

Audited at commit `97239fe` before gameplay edits.

- `npm ci`, `npm run check`, and `npm run build`: passed.
- The repository had no automated test or lint script; those reproducible gates are part of this branch.
- The 60 Hz fixed-step loop, render interpolation, keyboard and multitouch controls, local-storage keys, responsive cabinet layout, reduced-motion behavior, and production/preview server configuration were inspected before editing.
- BOLT, NOVA, REX, GLITCH, all four modes, seven enemy classes, thirteen named/phased bosses, thirteen pickups, random events, achievements, credits, high scores, CURD, and Kong Mode already existed and remain preserved.
- Bosses largely shared movement and attack machinery despite their existing names, symbols, and phases; wave spawning had no authored sector schema; and pilot differences were not exposed clearly on selection. These were expansion points, not new-feature claims.

## Post-change coverage

Automated engine smoke tests use the real fixed-step engine with a no-op canvas
and muted audio. They advance authored clear/boss transitions rather than
pretending to reproduce human dodge skill.

| Acceptance path      | Automated coverage                                                        |
| -------------------- | ------------------------------------------------------------------------- |
| Full Classic circuit | All 30 authored encounters, five upgrade stops, circuit-two loop          |
| Extended Endless     | 45 threat-budgeted encounters, bosses, mutations and recovery waves       |
| Boss Rush            | All 13 unique bosses, controlled upgrade/recovery stops, completion state |
| Daily Challenge      | Full 30-encounter version-2 run with stable seed and completion record    |
| Pilots               | All four standard fire and signature Blast paths                          |
| Pickups              | All 13 pickup effect paths and all six visible families                   |
| Events               | All eight compatibility and activation paths                              |
| Persistence          | v3 legacy score/Daily migration and v4 sanitization                       |
| Input states         | Playing/pause/restart/upgrade transitions plus gamepad mappings in engine |

Pure tests additionally validate formations, bounds, safe-lane width, threat
budgets, enemy mutations, boss phases/volleys/hazards, run offers, event
compatibility, UTC Daily determinism, achievements, medals and score arithmetic.

Manual balance remains an ongoing cabinet task: target scores, boss punish-window
lengths and late-circuit mutation frequency should be reviewed with keyboard and
physical touch devices after deployment telemetry or playtest feedback.

Run the complete gate with `npm run check`, `npm test`, `npm run lint`, and
`npm run build`. Browser automation was unavailable in the implementation
environment because no compatible browser binary could be installed, so visual
density and physical-device feel remain explicit PR review items.
