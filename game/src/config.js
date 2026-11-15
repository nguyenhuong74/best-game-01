// Comet Courier — shared constants and the palette.
// One place for every number the rest of the game agrees on: the field size, the
// physics scale, the launch limits and the colours of the night sky.
export const FIELD = { width: 1280, height: 800 };

/** Fixed simulation step, seconds. The loop and the trajectory preview share it. */
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

/** Comets the courier carries into every level. */
export const COMETS_PER_LEVEL = 3;

/** Score for one star shard, and for clearing a level. */
export const SCORE_SHARD = 100;
export const SCORE_CLEAR = 500;
export const SCORE_COMET_BONUS = 200;

/** localStorage key for the best total score. */
export const BEST_KEY = 'comet-courier-best';

/** Palette: deep space, warm shards, cool comet, bright gate. */
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
  pad: '#8ecbff',
  hud: '#dfe6ff',
  hudDim: '#8b94b8',
  danger: '#ff6b81',
  panel: 'rgba(10, 14, 34, 0.82)',
  panelEdge: 'rgba(160, 180, 255, 0.35)',
};
