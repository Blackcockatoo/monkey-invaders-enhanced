# Gameplay content schema

The evolution pass keeps the canvas engine as the simulation owner and moves
authored decisions into pure modules. Data modules may depend on `types.ts` and
`rng.ts`; the engine consumes them. They must not import the engine.

## Sectors and encounters

`sector-content.ts` defines five `SectorDefinition` records. Each has exactly
five formation IDs: indices 0–3 are authored combat waves, index 4 is the
escalation, and encounter 6 is the boss. `campaignPosition(wave)` maps the first
30 encounters and then preserves score while increasing `circuit`.

| Sector          | Combat 1–4                                                             | Escalation      | Boss       |
| --------------- | ---------------------------------------------------------------------- | --------------- | ---------- |
| Neon Orbit      | Horizontal Rows, V Formation, Arrowhead, Golden Target                 | Shield Wall     | ZORG       |
| Rind Mines      | Descending Staircase, Tank Escort, Alternating Columns, Pickup Bait    | Meteor Corridor | NEXUS      |
| Static Jungle   | Empty-Centre Trap, Low-Gravity Arc, Teleporter Cross, Kamikaze Reserve | Twin Spirals    | TITAN      |
| Curd Laboratory | Shield Wall, Splitter Swarm, Glitched Mirror, Golden Target            | Mixed Elite     | LEVIATHAN  |
| End Signal      | Rotating Ring, Boss Support, Meteor Corridor, Glitched Mirror          | Mixed Elite     | APOCALYPSE |

## Formation definition

Every `FormationDefinition` in `formations.ts` contains:

- stable `id` and display `label`;
- allowed sectors and minimum wave;
- normalized enemy slots with role, entry delay and optional elite/golden flags;
- described entry timing and a movement grammar;
- total threat value;
- one or more normalized safe lanes at least 12% of the playfield wide;
- compatible events and explicitly incompatible role pairs;
- expected duration and one score objective.

`validateFormation` rejects missing slots, bad bounds, invalid timing, unsafe
lanes and incompatible role combinations. The wave director never invents
arbitrary role mixtures: it selects a compatible authored template within four
points of its constrained budget.

## Boss patterns

`boss-patterns.ts` contains one complete contract per original boss: signature
movement, volley, hazard, second phase, enrage, opening, scoring challenge,
defeat sequence and quiet-beat duration. Pure pose, volley and hazard functions
feed the engine. Hazard plans name their open gap; solid hazards use outline and
glyph as well as colour.

## Events, pilots and upgrades

- `random-events.ts` records modes, minimum wave, duration, telegraph, effect,
  score objective, failure, cooldown and incompatibilities for all eight events.
- `pilot-rules.ts` exposes visible four-axis attributes and firing/Blast rules for
  BOLT, NOVA, REX and GLITCH. GLITCH instability follows warned fixed beats, not
  a hidden per-shot roll.
- `run-upgrades.ts` defines twelve temporary run modifiers across Firepower,
  Defence, Control, Mobility, Chaos and Special families. Three deterministic,
  distinct offers appear after sector bosses (and at controlled Boss Rush
  recoveries).
- `content.ts` assigns all thirteen existing pickups to a visible family.

## Scoring and persistence

`scoring.ts` owns hit streaks, gradual combo decay, near misses and compact wave
results. Results expose base, combo, time and retained-Blast score plus Clear,
No Damage, Target Score, Time Target and Formation Objective medals.

`persistence.ts` retains every `monkey-invaders-v3-*` key and adds the single
`monkey-invaders-v4-progress` record. Migration copies legacy cabinet scores
into the selected pilot's bests, preserves historical Daily records, validates
medals, and stores the Daily seed version and camera-shake preference.

Daily seed version 2 uses a UTC date and precomputes pilot, sector order,
formation order, events, upgrade offers and boss modifiers. Changing authored
Daily content requires incrementing `DAILY_SEED_VERSION`; never silently change
the meaning of a stored historical seed.
