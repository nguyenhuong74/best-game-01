// A tiny seeded random generator (mulberry32) so the starfield and the nebulae
// look the same on every visit for a given seed, while the game stays offline.
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a value in [min, max) from a seeded generator. */
export function range(random, min, max) {
  return min + random() * (max - min);
}
