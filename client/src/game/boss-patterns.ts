import type { BossAttackPhase, HazardKind } from "./types.ts";

export type BossPattern = {
  name: string;
  movement: string;
  projectile: string;
  hazard: string;
  phaseTwo: string;
  enrage: string;
  opening: string;
  scoringChallenge: string;
  defeat: string;
  quietBeat: number;
};

export const BOSS_PATTERNS: Record<string, BossPattern> = {
  ZORG: {
    name: "ZORG",
    movement: "disciplined horizontal sweeps",
    projectile: "even five-shot comb with a moving gap",
    hazard: "one previewed sweep lane",
    phaseTwo: "sweep reverses after each volley",
    enrage: "two short sweeps separated by a full quiet beat",
    opening: "centre crest opens after every sweep",
    scoringChallenge: "cross the gap and break the crest before the return",
    defeat: "ZORG SALUTES, THEN LOSES THE MOON",
    quietBeat: 0.7,
  },
  KRELL: {
    name: "KRELL",
    movement: "pixel-step corners",
    projectile: "parasite pairs descend on alternating columns",
    hazard: "temporary infected grid strip",
    phaseTwo: "infection changes side on the count",
    enrage: "three strips replay in their announced order",
    opening: "core resolves while parasites change columns",
    scoringChallenge: "clear a parasite strip before it expires",
    defeat: "KRELL DEFRAGMENTS INTO POLITE SQUARES",
    quietBeat: 0.8,
  },
  VEX: {
    name: "VEX",
    movement: "assembly-line figure eight",
    projectile: "destroyed-shot drones return in paired arcs",
    hazard: "drone assembly brackets",
    phaseTwo: "two drone brackets alternate",
    enrage: "drones launch from both edges with a centre gap",
    opening: "assembly hatch is exposed while drones dock",
    scoringChallenge: "destroy both docking drones in one volley",
    defeat: "VEX FILES A WARRANTY CLAIM",
    quietBeat: 0.65,
  },
  NEXUS: {
    name: "NEXUS",
    movement: "marked signal-gate jumps",
    projectile: "three gate-aligned bolts",
    hazard: "paired destination gates",
    phaseTwo: "gate order reverses",
    enrage: "three gates preview before one rapid traversal",
    opening: "arrival antenna glows with a notch symbol",
    scoringChallenge: "hit the antenna at two consecutive arrivals",
    defeat: "NEXUS MISSES THE LAST CONNECTION",
    quietBeat: 0.85,
  },
  VOID: {
    name: "VOID",
    movement: "slow portal orbit",
    projectile:
      "stored bananas return through side portals with one empty angle",
    hazard: "absorption ring",
    phaseTwo: "portals trade vertical positions",
    enrage: "two stored volleys release in mirrored order",
    opening: "mouth closes and underside sigil opens after release",
    scoringChallenge: "stop firing during absorption, then punish the release",
    defeat: "VOID COUGHS UP EVERY MISSING SOCK",
    quietBeat: 1,
  },
  CHAOS: {
    name: "CHAOS",
    movement: "four-point shuffled route",
    projectile: "announced symbols fire in reordered sequence",
    hazard: "order tiles",
    phaseTwo: "four-symbol order replaces three",
    enrage: "order accelerates but symbols keep their meanings",
    opening: "crown is exposed on the final announced symbol",
    scoringChallenge:
      "complete an attack order without moving twice in one direction",
    defeat: "CHAOS ORGANISES ITS DESK AND LEAVES",
    quietBeat: 0.75,
  },
  TITAN: {
    name: "TITAN",
    movement: "heavy centre anchor with short shoulder shifts",
    projectile: "arm cannons alternate wide and narrow lanes",
    hazard: "falling armour plates",
    phaseTwo: "broken shoulder exposes the opposite cannon",
    enrage: "core beam follows two plate drops",
    opening: "core opens after both armoured beats",
    scoringChallenge: "break each armour beat with a different firing lane",
    defeat: "TITAN BECOMES A VERY EXPENSIVE TOASTER",
    quietBeat: 0.9,
  },
  SPECTER: {
    name: "SPECTER",
    movement: "visible-to-ghost pendulum",
    projectile: "visible shots leave delayed outlined echoes",
    hazard: "ghost crossing",
    phaseTwo: "ghost interval lengthens",
    enrage: "two harmless echoes precede each real shot",
    opening: "solid bell symbol appears before materialising",
    scoringChallenge: "hit only on solid beats for an accuracy bonus",
    defeat: "SPECTER REMEMBERS ANOTHER APPOINTMENT",
    quietBeat: 0.8,
  },
  INFERNO: {
    name: "INFERNO",
    movement: "rising heat sawtooth",
    projectile: "descending heat fans with a cooling notch",
    hazard: "heat lanes and labelled cooling gap",
    phaseTwo: "cooling gap crosses the screen",
    enrage: "two fans descend with an extra quiet beat between",
    opening: "furnace door opens during the cooling beat",
    scoringChallenge: "stay in the cooling gap and land five hits",
    defeat: "INFERNO IS SERVED WITH ICE",
    quietBeat: 1.05,
  },
  LEVIATHAN: {
    name: "LEVIATHAN",
    movement: "slow tidal lateral rolls",
    projectile: "tentacle-tip pairs squeeze an open channel",
    hazard: "shifting tentacle channels",
    phaseTwo: "channel shifts after a visible wave line",
    enrage: "three channels appear, middle remains safe last",
    opening: "eye rises between channel shifts",
    scoringChallenge: "change channel only after the wave line passes",
    defeat: "LEVIATHAN TIES ITSELF IN A BOW",
    quietBeat: 1,
  },
  PHANTOM: {
    name: "PHANTOM",
    movement: "three-copy triangular orbit",
    projectile: "only the copy with a diamond pulse produces solid shots",
    hazard: "harmless copy lanes",
    phaseTwo: "true copy changes after its attack",
    enrage: "copies cross before the diamond pulse",
    opening: "true copy casts a ground reflection and diamond",
    scoringChallenge: "hit the true copy without striking a false one",
    defeat: "PHANTOM ADMITS THE RUMOUR WAS TRUE",
    quietBeat: 0.9,
  },
  OMEGA: {
    name: "OMEGA",
    movement: "structured replay of sweep, gate and channel",
    projectile: "earlier patterns return one at a time",
    hazard: "one legacy hazard per phase",
    phaseTwo: "NEXUS gate follows ZORG sweep",
    enrage: "LEVIATHAN channel follows both with full pauses",
    opening: "omega glyph opens between recalled patterns",
    scoringChallenge: "break every phase on its first opening",
    defeat: "OMEGA RUNS OUT OF ALPHABET",
    quietBeat: 1.1,
  },
  APOCALYPSE: {
    name: "APOCALYPSE",
    movement: "three-act centre, edges, final descent",
    projectile: "act-specific comb, ring and mastery fan",
    hazard: "act-specific warning frames",
    phaseTwo: "the arena opens into two edge routes",
    enrage: "final descent recombines two patterns, never simultaneously",
    opening: "END glyph cracks after each completed act",
    scoringChallenge:
      "finish all three acts without spending the recovery Blast",
    defeat: "APOCALYPSE CANCELLED — CABINET STILL OPEN",
    quietBeat: 1.2,
  },
};

export type BossPose = {
  x: number;
  y: number;
  vulnerable: boolean;
  quiet: boolean;
  trueCopy: number;
};

export function bossPhaseFromHealth(
  hp: number,
  maxHp: number
): BossAttackPhase {
  const ratio = maxHp <= 0 ? 0 : hp / maxHp;
  return ratio < 0.34 ? 2 : ratio < 0.67 ? 1 : 0;
}

const cycle = (time: number, seconds: number) =>
  ((time % seconds) + seconds) % seconds;

export function bossPose(
  name: string,
  phase: BossAttackPhase,
  time: number
): BossPose {
  const p = phase + 1;
  const beat = cycle(time, 4.8 - phase * 0.35);
  const quiet = beat > 3.5 && beat < 4.15;
  const vulnerable = beat > 2.55 && beat < 3.5;
  let x = 0.5;
  let y = 0.12;
  switch (name) {
    case "ZORG":
      x = 0.5 + Math.sin(time * (0.75 + p * 0.08)) * 0.32;
      break;
    case "KRELL":
      x = 0.18 + ((Math.floor(time * 1.2) % 4) / 3) * 0.64;
      y = 0.1 + (Math.floor(time * 1.2) % 2) * 0.07;
      break;
    case "VEX":
      x = 0.5 + Math.sin(time * 0.9) * 0.28;
      y = 0.13 + Math.sin(time * 1.8) * 0.055;
      break;
    case "NEXUS":
      x = [0.18, 0.5, 0.82][Math.floor(time / 1.6) % 3];
      break;
    case "VOID":
      x = 0.5 + Math.cos(time * 0.6) * 0.23;
      y = 0.13 + Math.sin(time * 0.6) * 0.06;
      break;
    case "CHAOS":
      x = [0.22, 0.76, 0.36, 0.64][Math.floor(time / 1.1) % 4];
      y = 0.09 + (Math.floor(time / 1.1) % 2) * 0.09;
      break;
    case "TITAN":
      x = 0.5 + Math.sign(Math.sin(time * 0.55)) * 0.09;
      y = 0.1;
      break;
    case "SPECTER":
      x = 0.5 + Math.sin(time * 0.72) * 0.3;
      y = 0.12 + Math.cos(time * 1.44) * 0.035;
      break;
    case "INFERNO":
      x = 0.2 + cycle(time * 0.12, 1) * 0.6;
      y = 0.08 + cycle(time * 0.09, 0.1);
      break;
    case "LEVIATHAN":
      x = 0.5 + Math.sin(time * 0.46) * 0.2;
      y = 0.16 + Math.sin(time * 0.92) * 0.035;
      break;
    case "PHANTOM":
      x = 0.5 + Math.cos(time * 0.72) * 0.24;
      y = 0.14 + Math.sin(time * 0.72) * 0.06;
      break;
    case "OMEGA":
      x =
        phase === 0
          ? 0.5 + Math.sin(time * 0.8) * 0.3
          : phase === 1
            ? [0.2, 0.8][Math.floor(time / 1.4) % 2]
            : 0.5 + Math.sin(time * 0.45) * 0.18;
      break;
    case "APOCALYPSE":
      x =
        phase === 0
          ? 0.5
          : phase === 1
            ? 0.5 + Math.sin(time * 0.8) * 0.34
            : 0.5 + Math.sin(time * 1.05) * 0.22;
      y = phase === 2 ? 0.18 : 0.1;
      break;
    default:
      x = 0.5 + Math.sin(time * 0.7) * 0.25;
  }
  const trueCopy = Math.floor(time / 2.4) % 3;
  return { x, y, vulnerable, quiet, trueCopy };
}

export type BossVolley = {
  angles: number[];
  speed: number;
  label: string;
};

export function bossVolley(
  name: string,
  phase: BossAttackPhase,
  step: number
): BossVolley {
  const p = phase + 1;
  const alternate = step % 2 === 0 ? 1 : -1;
  switch (name) {
    case "ZORG":
      return {
        angles: [-0.48, -0.24, 0, 0.24, 0.48].filter((_, i) => i !== step % 5),
        speed: 230 + p * 20,
        label: "SWEEP GAP",
      };
    case "KRELL":
      return {
        angles: [-0.34 * alternate, 0.34 * alternate],
        speed: 225 + p * 22,
        label: "PARASITE PAIR",
      };
    case "VEX":
      return {
        angles: [-0.52, -0.18, 0.18, 0.52].map(a => a * alternate),
        speed: 210 + p * 24,
        label: "DRONE RETURN",
      };
    case "NEXUS":
      return {
        angles: [-0.22, 0, 0.22],
        speed: 270 + p * 20,
        label: "GATE VOLLEY",
      };
    case "VOID":
      return {
        angles: [-0.7, -0.46, -0.22, 0.22, 0.46, 0.7].filter(
          (_, i) => i % 3 !== step % 3
        ),
        speed: 205 + p * 18,
        label: "PORTAL RELEASE",
      };
    case "CHAOS":
      return {
        angles: [[0], [-0.48, 0.48], [-0.3, 0, 0.3]][step % 3],
        speed: 245 + p * 20,
        label: `${(step % 3) + 1} ORDER`,
      };
    case "TITAN":
      return {
        angles: step % 2 ? [-0.62, -0.42, 0.42, 0.62] : [-0.14, 0.14],
        speed: 235 + p * 18,
        label: "ARM CANNON",
      };
    case "SPECTER":
      return {
        angles: [alternate * 0.28],
        speed: 195 + p * 22,
        label: "SOLID ECHO",
      };
    case "INFERNO":
      return {
        angles: [-0.64, -0.4, -0.16, 0.16, 0.4, 0.64].filter(
          (_, i) => i !== (step % 2 ? 1 : 4)
        ),
        speed: 215 + p * 22,
        label: "COOLING NOTCH",
      };
    case "LEVIATHAN":
      return {
        angles: [-0.58, -0.42, 0.42, 0.58].map(a => a + Math.sin(step) * 0.08),
        speed: 220 + p * 20,
        label: "OPEN CHANNEL",
      };
    case "PHANTOM":
      return {
        angles: [-0.32, 0, 0.32].filter((_, i) => i === step % 3),
        speed: 255 + p * 18,
        label: "DIAMOND COPY",
      };
    case "OMEGA":
      return phase === 0
        ? bossVolley("ZORG", phase, step)
        : phase === 1
          ? bossVolley("NEXUS", phase, step)
          : bossVolley("LEVIATHAN", phase, step);
    case "APOCALYPSE":
      return phase === 0
        ? bossVolley("TITAN", phase, step)
        : phase === 1
          ? bossVolley("VOID", phase, step)
          : bossVolley("INFERNO", phase, step);
    default:
      return { angles: [-0.3, 0, 0.3], speed: 240, label: "BOSS VOLLEY" };
  }
}

export type BossHazardPlan = {
  kind: HazardKind;
  lanes: number[];
  width: number;
  safeGap: number;
  label: string;
};

export function bossHazardPlan(
  name: string,
  phase: BossAttackPhase,
  step: number
): BossHazardPlan {
  const shift = (step + phase) % 3;
  const plans: Record<string, BossHazardPlan> = {
    ZORG: {
      kind: "beam",
      lanes: [shift === 0 ? 0.2 : 0.8],
      width: 0.12,
      safeGap: shift === 0 ? 0.72 : 0.28,
      label: "SWEEP",
    },
    KRELL: {
      kind: "parasite",
      lanes: [0.18 + shift * 0.3],
      width: 0.18,
      safeGap: shift === 0 ? 0.82 : 0.16,
      label: "INFECTED",
    },
    VEX: {
      kind: "gate",
      lanes: [0.12, 0.88],
      width: 0.1,
      safeGap: 0.5,
      label: "DRONE DOCK",
    },
    NEXUS: {
      kind: "gate",
      lanes: [0.2 + shift * 0.3],
      width: 0.12,
      safeGap: shift === 1 ? 0.82 : 0.5,
      label: "SIGNAL GATE",
    },
    VOID: {
      kind: "beam",
      lanes: [0.28, 0.72],
      width: 0.1,
      safeGap: 0.5,
      label: "ABSORB",
    },
    CHAOS: {
      kind: "gate",
      lanes: shift === 0 ? [0.2, 0.5] : [0.5, 0.8],
      width: 0.1,
      safeGap: shift === 0 ? 0.82 : 0.18,
      label: `${shift + 1} ORDER`,
    },
    TITAN: {
      kind: "meteor",
      lanes: [shift === 0 ? 0.25 : 0.75],
      width: 0.13,
      safeGap: shift === 0 ? 0.72 : 0.28,
      label: "ARMOUR DROP",
    },
    SPECTER: {
      kind: "gate",
      lanes: [0.18 + shift * 0.31],
      width: 0.08,
      safeGap: shift === 0 ? 0.82 : 0.18,
      label: "GHOST / OUTLINE",
    },
    INFERNO: {
      kind: "heat",
      lanes: shift === 0 ? [0.18, 0.5] : [0.5, 0.82],
      width: 0.18,
      safeGap: shift === 0 ? 0.82 : 0.18,
      label: "COOL GAP",
    },
    LEVIATHAN: {
      kind: "tentacle",
      lanes: [0.15 + shift * 0.34],
      width: 0.2,
      safeGap: shift === 0 ? 0.88 : 0.12,
      label: "OPEN CHANNEL",
    },
    PHANTOM: {
      kind: "gate",
      lanes: [0.25, 0.75],
      width: 0.08,
      safeGap: 0.5,
      label: "FALSE / HARMLESS",
    },
    OMEGA:
      phase === 0
        ? {
            kind: "beam",
            lanes: [0.2],
            width: 0.12,
            safeGap: 0.75,
            label: "RECALL: SWEEP",
          }
        : phase === 1
          ? {
              kind: "gate",
              lanes: [0.75],
              width: 0.12,
              safeGap: 0.25,
              label: "RECALL: GATE",
            }
          : {
              kind: "tentacle",
              lanes: [0.5],
              width: 0.17,
              safeGap: 0.15,
              label: "RECALL: CHANNEL",
            },
    APOCALYPSE:
      phase === 0
        ? {
            kind: "meteor",
            lanes: [0.2, 0.8],
            width: 0.1,
            safeGap: 0.5,
            label: "ACT I",
          }
        : phase === 1
          ? {
              kind: "beam",
              lanes: [0.5],
              width: 0.16,
              safeGap: step % 2 ? 0.18 : 0.82,
              label: "ACT II",
            }
          : {
              kind: "heat",
              lanes: step % 2 ? [0.18, 0.5] : [0.5, 0.82],
              width: 0.16,
              safeGap: step % 2 ? 0.82 : 0.18,
              label: "ACT III",
            },
  };
  return (
    plans[name] ?? {
      kind: "meteor",
      lanes: [0.25, 0.75],
      width: 0.1,
      safeGap: 0.5,
      label: "OPEN LANE",
    }
  );
}

export function bossPattern(name: string): BossPattern {
  const pattern = BOSS_PATTERNS[name];
  if (!pattern) throw new Error(`Missing boss pattern: ${name}`);
  return pattern;
}
