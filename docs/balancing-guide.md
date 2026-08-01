# Balancing guide

## Formation authoring

Start with the decision, not enemy count. A formation should ask the player to
hold a lane, cross on a count, break protection, bait a dive, time a split, or
take a dangerous reward. If its objective cannot be described in one sentence,
split the encounter.

- Keep slots within normalized `x 0.04–0.96` and `y 0.06–0.42`.
- Preserve at least one 0.12-wide safe lane; 0.16–0.22 is preferred for early
  sectors and touch play.
- Telegraph every delayed entry. Do not place an active enemy below the upper
  42% of the screen.
- One pressure role plus support is usually enough. Teleporter + Kamikaze is
  forbidden unless an authored future mechanic gives them separate beats.
- Use 30–40 seconds for teaching, 40–50 for combination waves, and 45–55 for
  escalations. Longer encounters should add an opening, not health.
- Keep at least one full quiet firing interval after a dense volley or hazard.

Threat is a routing aid, not a difficulty slider. Scouts cost 1; rhythmic roles
cost 2–3; direct positional threats cost 4. Endless selects near its capped
budget and inserts a recovery wave every seventh encounter. Later circuits add
sparse, signposted mutations before considering small timing changes.

## Projectiles and hazards

The normal hostile cap is 14 and boss cap is 16. A pattern that reaches the cap
must wait rather than queue invisible pressure. Test safe lanes at 960×540 and a
real landscape touch viewport. Meteors must be generated outside the director's
safe corridor. Colour may reinforce a warning but label, outline, glyph or motion
must carry the same information.

## Boss tuning

Tune an opening around a readable loop:

1. 0.65–1.2 seconds of quiet/read time.
2. One signature attack or hazard.
3. A 0.8–1.1 second punish window.
4. A reset without residual bullet walls.

Phase two changes the route or timing decision. Phase three combines two learned
beats sequentially. Do not add attack families and projectile density at the
same breakpoint. A no-damage phase break and first-opening punish should remain
possible for every pilot.

## Pilots and run modifiers

Balance pilots around routes, not aggregate damage per second. BOLT converts
accuracy into score, NOVA changes lanes quickly, REX earns close-impact value,
and GLITCH exposes higher-risk fixed instability beats. When tuning one pilot,
run the no-dominance test and compare boss opening access, pickup routes and
safe-lane recovery.

Run upgrades may strengthen one decision but cannot remove it. Avoid stacking
duration, radius and damage on the same family. Any future modifier that affects
Daily offers requires a seed-version increment.

## Score targets

Set Target Score after five clean internal runs: use roughly the median clean
score, not the best. Set Time Target around the 60th percentile clean time.
Remaining Blast awards at most 500 points, so hoarding never beats a valuable
phase break. Event and risky-pickup bonuses should tempt a route change without
being required for Clear.
