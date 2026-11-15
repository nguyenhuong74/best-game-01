// The eight delivery routes. Each level is a hand-placed scene: where the comet
// starts, which worlds bend its path, where the star shards wait, and where the
// warp gate opens. `par` is the launch count a three-star clear needs.
//
// A planet: { x, y, r, mass, hue, ring? } — a world with gravity and a surface
// that swallows a comet. An orbiting planet adds { orbit: { cx, cy, radius,
// speed, phase } } and revolves around that centre, deterministically, so the
// trajectory preview and the real flight always agree. A void is a black hole:
// small, very heavy, and just as deadly to touch as a planet.
export const LEVELS = [
  {
    name: 'First Delivery',
    pad: { x: 130, y: 640 },
    gate: { x: 1140, y: 150, r: 34 },
    planets: [{ x: 640, y: 420, r: 58, mass: 1.6, hue: 210 }],
    voids: [],
    shards: [
      { x: 420, y: 300 },
      { x: 640, y: 200 },
      { x: 900, y: 300 },
    ],
    par: 1,
  },
  {
    name: 'Twin Pull',
    pad: { x: 130, y: 150 },
    gate: { x: 1150, y: 660, r: 34 },
    planets: [
      { x: 520, y: 300, r: 50, mass: 1.5, hue: 20 },
      { x: 800, y: 520, r: 55, mass: 1.7, hue: 280 },
    ],
    voids: [],
    shards: [
      { x: 350, y: 480 },
      { x: 640, y: 400 },
      { x: 950, y: 280 },
      { x: 1080, y: 480 },
    ],
    par: 2,
  },
  {
    name: 'The Ringed Giant',
    pad: { x: 640, y: 700 },
    gate: { x: 640, y: 110, r: 34 },
    planets: [{ x: 640, y: 400, r: 82, mass: 2.6, hue: 160, ring: true }],
    voids: [],
    shards: [
      { x: 380, y: 400 },
      { x: 900, y: 400 },
      { x: 640, y: 620 },
      { x: 500, y: 220 },
    ],
    par: 2,
  },
  {
    name: 'Into the Void',
    pad: { x: 120, y: 400 },
    gate: { x: 1160, y: 400, r: 34 },
    planets: [
      { x: 400, y: 200, r: 42, mass: 1.2, hue: 45 },
      { x: 880, y: 600, r: 42, mass: 1.2, hue: 330 },
    ],
    voids: [{ x: 640, y: 400, r: 26, mass: 3.2 }],
    shards: [
      { x: 300, y: 620 },
      { x: 640, y: 180 },
      { x: 980, y: 180 },
      { x: 640, y: 640 },
    ],
    par: 2,
  },
  {
    name: 'Shard Alley',
    pad: { x: 120, y: 120 },
    gate: { x: 1160, y: 680, r: 34 },
    planets: [
      { x: 420, y: 380, r: 48, mass: 1.5, hue: 200 },
      { x: 860, y: 420, r: 48, mass: 1.5, hue: 0 },
    ],
    voids: [],
    shards: [
      { x: 300, y: 300 },
      { x: 520, y: 560 },
      { x: 700, y: 260 },
      { x: 880, y: 580 },
      { x: 1050, y: 400 },
    ],
    par: 2,
  },
  {
    name: 'Three Suns',
    pad: { x: 640, y: 720 },
    gate: { x: 640, y: 90, r: 34 },
    planets: [
      { x: 350, y: 380, r: 52, mass: 1.6, hue: 35 },
      { x: 930, y: 380, r: 52, mass: 1.6, hue: 190 },
      { x: 640, y: 480, r: 46, mass: 1.4, hue: 290 },
    ],
    voids: [],
    shards: [
      { x: 200, y: 200 },
      { x: 1080, y: 200 },
      { x: 640, y: 300 },
      { x: 480, y: 620 },
      { x: 800, y: 620 },
    ],
    par: 2,
  },
  {
    name: 'The Dancer',
    pad: { x: 120, y: 660 },
    gate: { x: 1160, y: 140, r: 34 },
    planets: [
      {
        x: 820, y: 400, r: 50, mass: 1.8, hue: 150,
        orbit: { cx: 640, cy: 400, radius: 180, speed: 0.25, phase: 0 },
      },
      { x: 1050, y: 180, r: 40, mass: 1.2, hue: 260 },
    ],
    voids: [],
    shards: [
      { x: 300, y: 250 },
      { x: 640, y: 640 },
      { x: 900, y: 500 },
      { x: 1100, y: 400 },
    ],
    par: 3,
  },
  {
    name: 'Grand Route',
    pad: { x: 110, y: 400 },
    gate: { x: 1170, y: 400, r: 34 },
    planets: [
      { x: 380, y: 240, r: 48, mass: 1.6, hue: 210 },
      { x: 380, y: 560, r: 48, mass: 1.6, hue: 20 },
      { x: 900, y: 240, r: 48, mass: 1.6, hue: 280 },
      { x: 900, y: 560, r: 48, mass: 1.6, hue: 160 },
    ],
    voids: [{ x: 640, y: 400, r: 24, mass: 2.6 }],
    shards: [
      { x: 250, y: 400 },
      { x: 640, y: 120 },
      { x: 640, y: 680 },
      { x: 1050, y: 400 },
      { x: 520, y: 400 },
      { x: 770, y: 400 },
    ],
    par: 3,
  },
];

/** A fresh, mutable copy of a level: shard collection must not mark the original. */
export function freshLevel(index) {
  const level = LEVELS[index % LEVELS.length];
  return {
    name: level.name,
    pad: { ...level.pad },
    gate: { ...level.gate },
    planets: level.planets.map((planet) => ({ ...planet, orbit: planet.orbit ? { ...planet.orbit } : undefined })),
    voids: level.voids.map((voidBody) => ({ ...voidBody })),
    shards: level.shards.map((shard) => ({ ...shard, taken: false })),
    par: level.par,
  };
}
