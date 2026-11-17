// The twenty delivery routes, five per region. Each route is a hand-placed
// scene: where the comet starts, which worlds bend its path, where the star
// shards wait, and where the warp gate opens. `par` is the launch count a
// three-star clear needs; `parTime` is the seconds a time bonus needs.
//
// A planet: { x, y, r, mass, hue, ring? } — gravity and a surface that
// swallows a comet. An orbiting planet adds { orbit: { cx, cy, radius, speed,
// phase } } and revolves around that centre, deterministically, so the
// trajectory preview and the real flight always agree. A void is a black
// hole: small, very heavy, just as deadly to touch.
//
// A wormhole: { a: {x, y}, b: {x, y}, r } — fly into one mouth and come out
// of the other with your velocity kept. A wind: { x, y, w, h, ax, ay } —
// inside the rectangle the comet is pushed by (ax, ay). A mine:
// { x, y, r, dx, dy, range, speed, phase } — drifts back and forth along
// (dx, dy) and destroys a comet it touches. A pickup:
// { x, y, kind } — 'comet' grants one more comet, 'shield' one free crash.
// A flare gate adds { flare: { period, open, phase } } to the gate: it only
// catches a comet while it is open.
export const LEVELS = [
  // ---- Ember Belt: gravity ----
  {
    name: 'First Light',
    pad: { x: 130, y: 640 },
    gate: { x: 1140, y: 150, r: 36 },
    planets: [{ x: 640, y: 420, r: 58, mass: 1.6, hue: 25 }],
    voids: [],
    wormholes: [],
    winds: [],
    mines: [],
    pickups: [],
    shards: [{ x: 420, y: 300 }, { x: 640, y: 200 }, { x: 900, y: 300 }],
    par: 1,
    parTime: 12,
  },
  {
    name: 'Twin Pull',
    pad: { x: 130, y: 150 },
    gate: { x: 1150, y: 660, r: 36 },
    planets: [
      { x: 520, y: 300, r: 50, mass: 1.5, hue: 10 },
      { x: 800, y: 520, r: 55, mass: 1.7, hue: 40 },
    ],
    voids: [],
    wormholes: [],
    winds: [],
    mines: [],
    pickups: [],
    shards: [{ x: 350, y: 480 }, { x: 640, y: 400 }, { x: 950, y: 280 }, { x: 1080, y: 480 }],
    par: 2,
    parTime: 14,
  },
  {
    name: 'The Ringed Giant',
    pad: { x: 640, y: 700 },
    gate: { x: 640, y: 110, r: 36 },
    planets: [{ x: 640, y: 400, r: 82, mass: 2.6, hue: 30, ring: true }],
    voids: [],
    wormholes: [],
    winds: [],
    mines: [],
    pickups: [],
    shards: [{ x: 380, y: 400 }, { x: 900, y: 400 }, { x: 640, y: 620 }, { x: 500, y: 220 }],
    par: 2,
    parTime: 14,
  },
  {
    name: 'Ember Cross',
    pad: { x: 120, y: 400 },
    gate: { x: 1160, y: 400, r: 36 },
    planets: [
      { x: 430, y: 210, r: 46, mass: 1.4, hue: 15 },
      { x: 850, y: 590, r: 46, mass: 1.4, hue: 45 },
    ],
    voids: [],
    wormholes: [],
    winds: [],
    mines: [],
    pickups: [{ x: 640, y: 400, kind: 'comet' }],
    shards: [{ x: 300, y: 620 }, { x: 640, y: 180 }, { x: 980, y: 180 }, { x: 640, y: 640 }],
    par: 2,
    parTime: 14,
  },
  {
    name: 'Three Suns',
    pad: { x: 640, y: 720 },
    gate: { x: 640, y: 90, r: 36 },
    planets: [
      { x: 350, y: 380, r: 52, mass: 1.6, hue: 35 },
      { x: 930, y: 380, r: 52, mass: 1.6, hue: 190 },
      { x: 640, y: 500, r: 44, mass: 1.3, hue: 290 },
    ],
    voids: [],
    wormholes: [],
    winds: [],
    mines: [],
    pickups: [],
    shards: [{ x: 200, y: 200 }, { x: 1080, y: 200 }, { x: 640, y: 300 }, { x: 480, y: 620 }, { x: 800, y: 620 }],
    par: 2,
    parTime: 16,
  },
  // ---- Frost Drift: wormholes ----
  {
    name: 'First Fold',
    pad: { x: 120, y: 660 },
    gate: { x: 1150, y: 140, r: 36 },
    planets: [{ x: 640, y: 400, r: 50, mass: 1.4, hue: 200 }],
    voids: [],
    wormholes: [{ a: { x: 430, y: 500 }, b: { x: 850, y: 260 }, r: 30 }],
    winds: [],
    mines: [],
    pickups: [],
    shards: [{ x: 300, y: 300 }, { x: 640, y: 620 }, { x: 880, y: 300 }, { x: 1080, y: 420 }],
    par: 2,
    parTime: 16,
  },
  {
    name: 'Cold Passage',
    pad: { x: 120, y: 140 },
    gate: { x: 1160, y: 660, r: 36 },
    planets: [{ x: 640, y: 400, r: 60, mass: 1.8, hue: 220 }],
    voids: [],
    wormholes: [{ a: { x: 400, y: 300 }, b: { x: 900, y: 520 }, r: 30 }],
    winds: [],
    mines: [],
    pickups: [],
    shards: [{ x: 300, y: 500 }, { x: 640, y: 200 }, { x: 940, y: 300 }, { x: 1080, y: 480 }],
    par: 2,
    parTime: 16,
  },
  {
    name: 'Mirror Lane',
    pad: { x: 640, y: 720 },
    gate: { x: 640, y: 100, r: 36 },
    planets: [{ x: 640, y: 400, r: 70, mass: 2.2, hue: 260 }],
    voids: [],
    wormholes: [{ a: { x: 300, y: 400 }, b: { x: 980, y: 400 }, r: 30 }],
    winds: [],
    mines: [],
    pickups: [{ x: 640, y: 250, kind: 'shield' }],
    shards: [{ x: 300, y: 200 }, { x: 980, y: 200 }, { x: 400, y: 510 }, { x: 980, y: 600 }, { x: 490, y: 590 }],
    par: 2,
    parTime: 16,
  },
  {
    name: 'Frostbite',
    pad: { x: 130, y: 400 },
    gate: { x: 1150, y: 400, r: 36 },
    planets: [
      { x: 640, y: 400, r: 46, mass: 1.5, hue: 210 },
      { x: 300, y: 600, r: 40, mass: 1.2, hue: 180 },
    ],
    voids: [],
    wormholes: [{ a: { x: 450, y: 200 }, b: { x: 850, y: 600 }, r: 30 }],
    winds: [],
    mines: [],
    pickups: [{ x: 640, y: 250, kind: 'shield' }],
    shards: [{ x: 300, y: 200 }, { x: 640, y: 640 }, { x: 980, y: 200 }, { x: 1080, y: 580 }],
    par: 3,
    parTime: 18,
  },
  {
    name: 'The Long Way Home',
    pad: { x: 110, y: 110 },
    gate: { x: 1170, y: 690, r: 36 },
    planets: [
      { x: 640, y: 250, r: 48, mass: 1.5, hue: 230 },
      { x: 640, y: 560, r: 48, mass: 1.5, hue: 200 },
    ],
    voids: [],
    wormholes: [{ a: { x: 350, y: 350 }, b: { x: 950, y: 450 }, r: 30 }],
    winds: [],
    mines: [],
    pickups: [],
    shards: [{ x: 300, y: 600 }, { x: 640, y: 400 }, { x: 980, y: 200 }, { x: 1080, y: 480 }, { x: 500, y: 150 }],
    par: 3,
    parTime: 18,
  },
  // ---- Storm Reef: wind and mines ----
  {
    name: 'Tailwind',
    pad: { x: 130, y: 640 },
    gate: { x: 1140, y: 160, r: 36 },
    planets: [{ x: 640, y: 480, r: 55, mass: 1.6, hue: 150 }],
    voids: [],
    wormholes: [],
    winds: [{ x: 500, y: 80, w: 300, h: 320, ax: 0, ay: -260 }],
    mines: [],
    pickups: [],
    shards: [{ x: 400, y: 300 }, { x: 650, y: 180 }, { x: 900, y: 320 }, { x: 1080, y: 420 }],
    par: 2,
    parTime: 16,
  },
  {
    name: 'Gale Crossing',
    pad: { x: 120, y: 150 },
    gate: { x: 1160, y: 650, r: 36 },
    planets: [
      { x: 520, y: 520, r: 50, mass: 1.5, hue: 170 },
      { x: 900, y: 300, r: 46, mass: 1.4, hue: 90 },
    ],
    voids: [],
    wormholes: [{ a: { x: 350, y: 600 }, b: { x: 1000, y: 250 }, r: 30 }],
    winds: [{ x: 300, y: 250, w: 260, h: 200, ax: 220, ay: 0 }],
    mines: [{ x: 700, y: 300, r: 16, dx: 0, dy: 1, range: 90, speed: 0.5, phase: 0 }],
    pickups: [{ x: 640, y: 400, kind: 'comet' }],
    shards: [{ x: 300, y: 480 }, { x: 640, y: 200 }, { x: 880, y: 520 }, { x: 1080, y: 400 }, { x: 500, y: 650 }],
    par: 2,
    parTime: 18,
  },
  {
    name: 'Minefield',
    pad: { x: 640, y: 720 },
    gate: { x: 640, y: 100, r: 36 },
    planets: [
      { x: 350, y: 400, r: 48, mass: 1.5, hue: 160 },
      { x: 930, y: 400, r: 48, mass: 1.5, hue: 120 },
    ],
    voids: [],
    wormholes: [],
    winds: [],
    mines: [
      { x: 480, y: 300, r: 15, dx: 1, dy: 0, range: 80, speed: 0.6, phase: 0 },
      { x: 800, y: 300, r: 15, dx: 1, dy: 0, range: 80, speed: 0.6, phase: 1.6 },
      { x: 640, y: 520, r: 15, dx: 1, dy: 0, range: 110, speed: 0.45, phase: 3.1 },
    ],
    pickups: [{ x: 640, y: 480, kind: 'shield' }],
    shards: [{ x: 300, y: 200 }, { x: 980, y: 200 }, { x: 300, y: 600 }, { x: 980, y: 600 }, { x: 640, y: 350 }],
    par: 3,
    parTime: 18,
  },
  {
    name: 'Crosswinds',
    pad: { x: 120, y: 400 },
    gate: { x: 1160, y: 400, r: 36 },
    planets: [{ x: 640, y: 400, r: 60, mass: 1.8, hue: 140 }],
    voids: [],
    wormholes: [],
    winds: [
      { x: 220, y: 120, w: 280, h: 260, ax: 0, ay: -240 },
      { x: 780, y: 420, w: 280, h: 260, ax: 0, ay: 240 },
    ],
    mines: [],
    pickups: [],
    shards: [{ x: 350, y: 440 }, { x: 640, y: 180 }, { x: 850, y: 440 }, { x: 1080, y: 560 }],
    par: 2,
    parTime: 16,
  },
  {
    name: "Storm's Eye",
    pad: { x: 110, y: 690 },
    gate: { x: 1170, y: 110, r: 36 },
    planets: [{ x: 640, y: 400, r: 55, mass: 1.7, hue: 100 }],
    voids: [],
    wormholes: [{ a: { x: 400, y: 300 }, b: { x: 900, y: 500 }, r: 30 }],
    winds: [{ x: 480, y: 500, w: 320, h: 220, ax: 200, ay: -120 }],
    mines: [
      { x: 820, y: 220, r: 15, dx: 0, dy: 1, range: 80, speed: 0.55, phase: 0.8 },
      { x: 460, y: 560, r: 15, dx: 1, dy: 0, range: 90, speed: 0.5, phase: 2.2 },
    ],
    pickups: [{ x: 640, y: 250, kind: 'shield' }],
    shards: [{ x: 300, y: 300 }, { x: 640, y: 640 }, { x: 980, y: 300 }, { x: 1080, y: 480 }, { x: 500, y: 150 }, { x: 800, y: 650 }],
    par: 3,
    parTime: 20,
  },
  // ---- Void Crown: voids, orbiters, flare gates ----
  {
    name: 'Event Horizon',
    pad: { x: 120, y: 400 },
    gate: { x: 1160, y: 400, r: 36, flare: { period: 8, open: 5, phase: 0 } },
    planets: [
      { x: 400, y: 200, r: 42, mass: 1.2, hue: 290 },
      { x: 880, y: 600, r: 42, mass: 1.2, hue: 260 },
    ],
    voids: [{ x: 640, y: 400, r: 26, mass: 3.2 }],
    wormholes: [],
    winds: [],
    mines: [],
    pickups: [],
    shards: [{ x: 300, y: 620 }, { x: 640, y: 180 }, { x: 980, y: 180 }, { x: 640, y: 640 }],
    par: 2,
    parTime: 18,
  },
  {
    name: 'The Dancer',
    pad: { x: 120, y: 660 },
    gate: { x: 1160, y: 140, r: 36, flare: { period: 10, open: 6, phase: 2 } },
    planets: [
      {
        x: 820, y: 400, r: 50, mass: 1.8, hue: 280,
        orbit: { cx: 640, cy: 400, radius: 180, speed: 0.25, phase: 0 },
      },
      { x: 1050, y: 180, r: 40, mass: 1.2, hue: 320 },
    ],
    voids: [],
    wormholes: [],
    winds: [],
    mines: [],
    pickups: [{ x: 640, y: 640, kind: 'comet' }],
    shards: [{ x: 300, y: 250 }, { x: 640, y: 640 }, { x: 900, y: 500 }, { x: 1100, y: 400 }],
    par: 3,
    parTime: 20,
  },
  {
    name: 'Twin Voids',
    pad: { x: 640, y: 720 },
    gate: { x: 640, y: 90, r: 36 },
    planets: [{ x: 640, y: 520, r: 44, mass: 1.4, hue: 300 }],
    voids: [
      { x: 480, y: 380, r: 22, mass: 2.8 },
      { x: 800, y: 380, r: 22, mass: 2.8 },
    ],
    wormholes: [],
    winds: [],
    mines: [],
    pickups: [{ x: 640, y: 300, kind: 'shield' }],
    shards: [{ x: 300, y: 200 }, { x: 980, y: 200 }, { x: 640, y: 380 }, { x: 400, y: 620 }, { x: 880, y: 620 }],
    par: 3,
    parTime: 20,
  },
  {
    name: 'Crown of Night',
    pad: { x: 110, y: 110 },
    gate: { x: 1170, y: 690, r: 36, flare: { period: 8, open: 4, phase: 1 } },
    planets: [
      {
        x: 840, y: 400, r: 46, mass: 1.6, hue: 270,
        orbit: { cx: 640, cy: 400, radius: 200, speed: -0.3, phase: 0 },
      },
    ],
    voids: [{ x: 640, y: 400, r: 24, mass: 3.0 }],
    wormholes: [{ a: { x: 300, y: 600 }, b: { x: 1000, y: 200 }, r: 30 }],
    winds: [],
    mines: [{ x: 640, y: 180, r: 15, dx: 1, dy: 0, range: 120, speed: 0.5, phase: 0 }],
    pickups: [],
    shards: [{ x: 300, y: 300 }, { x: 640, y: 640 }, { x: 980, y: 400 }, { x: 1080, y: 250 }, { x: 500, y: 550 }],
    par: 3,
    parTime: 22,
  },
  {
    name: 'Grand Route',
    pad: { x: 110, y: 400 },
    gate: { x: 1170, y: 400, r: 36 },
    planets: [
      { x: 380, y: 240, r: 48, mass: 1.6, hue: 210 },
      { x: 380, y: 560, r: 48, mass: 1.6, hue: 20 },
      { x: 900, y: 240, r: 48, mass: 1.6, hue: 280 },
      { x: 900, y: 560, r: 48, mass: 1.6, hue: 160 },
    ],
    voids: [{ x: 640, y: 400, r: 24, mass: 2.6 }],
    wormholes: [{ a: { x: 250, y: 150 }, b: { x: 1030, y: 650 }, r: 28 }],
    winds: [{ x: 560, y: 80, w: 160, h: 200, ax: 0, ay: -220 }],
    mines: [
      { x: 640, y: 180, r: 15, dx: 1, dy: 0, range: 100, speed: 0.5, phase: 0 },
      { x: 640, y: 620, r: 15, dx: 1, dy: 0, range: 100, speed: 0.5, phase: 1.6 },
    ],
    pickups: [{ x: 640, y: 120, kind: 'comet' }],
    shards: [
      { x: 250, y: 400 },
      { x: 640, y: 120 },
      { x: 640, y: 680 },
      { x: 1050, y: 400 },
      { x: 520, y: 400 },
      { x: 770, y: 400 },
    ],
    par: 3,
    parTime: 24,
  },
];

/** A fresh, mutable copy of a route: collection must not mark the original. */
export function freshLevel(index) {
  const level = LEVELS[index % LEVELS.length];
  return {
    name: level.name,
    pad: { ...level.pad },
    gate: { ...level.gate, flare: level.gate.flare ? { ...level.gate.flare } : undefined },
    planets: level.planets.map((planet) => ({ ...planet, orbit: planet.orbit ? { ...planet.orbit } : undefined })),
    voids: level.voids.map((voidBody) => ({ ...voidBody })),
    wormholes: level.wormholes.map((hole) => ({ a: { ...hole.a }, b: { ...hole.b }, r: hole.r })),
    winds: level.winds.map((wind) => ({ ...wind })),
    mines: level.mines.map((mine) => ({ ...mine })),
    pickups: level.pickups.map((pickup) => ({ ...pickup, taken: false })),
    shards: level.shards.map((shard) => ({ ...shard, taken: false })),
    par: level.par,
    parTime: level.parTime,
  };
}

/** How many star shards the whole campaign holds. */
export function totalShards() {
  return LEVELS.reduce((sum, level) => sum + level.shards.length, 0);
}

/** How many stars the whole campaign holds (3 per route). */
export function totalStars() {
  return LEVELS.length * 3;
}
