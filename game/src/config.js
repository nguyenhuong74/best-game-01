// Starlight Routes — shared constants: the field, the physics scale, the
// launch limits, the scoring table and the base palette. Region palettes live
// in regions.js; every other module reads its numbers from here so the flight
// model, the aim preview and the screenshot staging always agree.
export const FIELD = { width: 1280, height: 800 };

/** Fixed simulation step, seconds. The loop, the preview and the solver share it. */
export const STEP = 1 / 120;

/** Gravity strength: acceleration = GRAVITY * mass / distance^2. */
export const GRAVITY = 2_400_000;

/** How fast a comet may leave the pad, pixels per second. */
export const LAUNCH_MAX_SPEED = 720;
export const LAUNCH_MIN_SPEED = 90;

/** Dragging this far from the pad reaches full launch power. */
export const AIM_MAX_DRAG = 260;

/** A comet that drifts this far past an edge is lost to deep space. */
export const LOST_MARGIN = 140;

/** Comets the courier carries into a route, and the most pickups may grant. */
export const COMETS_PER_ROUTE = 3;
export const COMETS_MAX = 5;

/** Hearts for a campaign run: lose them all and the run ends. */
export const HEARTS_PER_RUN = 3;

/** Score table. */
export const SCORE_SHARD = 100;
export const SCORE_CLEAR = 500;
export const SCORE_COMET_BONUS = 200;
export const SCORE_TIME_BONUS_PER_SECOND = 10;

/** localStorage key for the campaign save (progress, stars, best score). */
export const SAVE_KEY = 'comet-courier-starlight-save-v1';

/** Base palette: deep space, warm shards, cool comet, bright gate. */
export const PALETTE = {
  spaceTop: '#070b1e',
  spaceBottom: '#141a38',
  star: '#e8ecff',
  comet: '#aef3ff',
  cometCore: '#ffffff',
  trail: 'rgba(140, 220, 255, 0.55)',
  shard: '#ffd166',
  shardGlow: 'rgba(255, 209, 102, 0.5)',
  gate: '#7dffb2',
  gateGlow: 'rgba(125, 255, 178, 0.45)',
  gateClosed: '#ff8a7a',
  pad: '#8ecbff',
  hud: '#dfe6ff',
  hudDim: '#8b94b8',
  danger: '#ff6b81',
  heart: '#ff5d73',
  panel: 'rgba(10, 14, 34, 0.86)',
  panelEdge: 'rgba(160, 180, 255, 0.35)',
  wormhole: '#c792ff',
  wind: 'rgba(140, 220, 255, 0.16)',
  mine: '#ff9f43',
  pickupComet: '#7dd7ff',
  pickupShield: '#9dffb0',
};
