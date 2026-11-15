// The gravity flight model, pure functions with no DOM: the game loop, the
// trajectory preview and the screenshot staging all fly the same physics, so
// what the aim line promises is what the comet does.
//
// A flight is { x, y, vx, vy, time, shards, outcome }. Outcomes: 'flying',
// 'gate' (reached the warp gate), 'crash' (hit a world or a void), 'lost'
// (drifted off the field). Shards are collected when the comet passes close.
import { FIELD, GRAVITY, LAUNCH_MAX_SPEED, AIM_MAX_DRAG, LOST_MARGIN, STEP } from './config.js';

export const OUTCOME_FLYING = 'flying';
export const OUTCOME_GATE = 'gate';
export const OUTCOME_CRASH = 'crash';
export const OUTCOME_LOST = 'lost';

/** Where a planet is at `time` seconds: fixed, or revolving on its orbit. */
export function planetPosition(planet, time) {
  if (!planet.orbit) return { x: planet.x, y: planet.y };
  const angle = planet.orbit.phase + planet.orbit.speed * time;
  return {
    x: planet.orbit.cx + Math.cos(angle) * planet.orbit.radius,
    y: planet.orbit.cy + Math.sin(angle) * planet.orbit.radius,
  };
}

/** Gravity acceleration at a point, from every planet and void, at `time`. */
export function gravityAt(level, x, y, time) {
  let ax = 0;
  let ay = 0;
  const bodies = level.planets.concat(level.voids);
  for (let index = 0; index < bodies.length; index += 1) {
    const body = bodies[index];
    const position = body.orbit ? planetPosition(body, time) : body;
    const dx = position.x - x;
    const dy = position.y - y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared < 1) continue;
    const pull = (GRAVITY * body.mass) / distanceSquared;
    const distance = Math.sqrt(distanceSquared);
    ax += (dx / distance) * pull;
    ay += (dy / distance) * pull;
  }
  return { ax, ay };
}

/** Start a flight from the pad with a velocity, at `startTime` on the level clock. */
export function startFlight(level, vx, vy, startTime = 0) {
  return {
    x: level.pad.x,
    y: level.pad.y,
    vx,
    vy,
    time: startTime,
    shards: 0,
    taken: level.shards.map(() => false),
    outcome: OUTCOME_FLYING,
  };
}

/**
 * Advance one fixed step. Returns 'shard' when a shard was just collected, the
 * flight's outcome otherwise ('flying' while nothing has happened yet).
 */
export function stepFlight(flight, level, dt) {
  if (flight.outcome !== OUTCOME_FLYING) return flight.outcome;
  const { ax, ay } = gravityAt(level, flight.x, flight.y, flight.time);
  flight.vx += ax * dt;
  flight.vy += ay * dt;
  flight.x += flight.vx * dt;
  flight.y += flight.vy * dt;
  flight.time += dt;

  const bodies = level.planets.concat(level.voids);
  for (let index = 0; index < bodies.length; index += 1) {
    const body = bodies[index];
    const position = body.orbit ? planetPosition(body, flight.time) : body;
    const dx = flight.x - position.x;
    const dy = flight.y - position.y;
    if (dx * dx + dy * dy < body.r * body.r) {
      flight.outcome = OUTCOME_CRASH;
      return flight.outcome;
    }
  }
  const gateDx = flight.x - level.gate.x;
  const gateDy = flight.y - level.gate.y;
  if (gateDx * gateDx + gateDy * gateDy < level.gate.r * level.gate.r) {
    flight.outcome = OUTCOME_GATE;
    return flight.outcome;
  }
  for (let index = 0; index < level.shards.length; index += 1) {
    if (flight.taken[index]) continue;
    const shard = level.shards[index];
    const dx = flight.x - shard.x;
    const dy = flight.y - shard.y;
    if (dx * dx + dy * dy < 28 * 28) {
      flight.taken[index] = true;
      flight.shards += 1;
      return 'shard';
    }
  }
  if (
    flight.x < -LOST_MARGIN || flight.x > FIELD.width + LOST_MARGIN ||
    flight.y < -LOST_MARGIN || flight.y > FIELD.height + LOST_MARGIN
  ) {
    flight.outcome = OUTCOME_LOST;
  }
  return flight.outcome;
}

/**
 * Fly a launch to its end. Returns the outcome, shards collected, flight time
 * and a sparse trail of points (every 4th step) for drawing.
 */
export function simulateLaunch(level, vx, vy, maxSeconds = 14, startTime = 0) {
  const flight = startFlight(level, vx, vy, startTime);
  const trail = [{ x: flight.x, y: flight.y }];
  const steps = Math.ceil(maxSeconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    stepFlight(flight, level, STEP);
    if (index % 4 === 0) trail.push({ x: flight.x, y: flight.y });
    if (flight.outcome !== OUTCOME_FLYING) break;
  }
  return { outcome: flight.outcome, shards: flight.shards, time: flight.time, trail, flight };
}

/**
 * The velocity a drag produces: pull back from the pad like a slingshot, the
 * comet flies the opposite way, harder the further you pull.
 */
export function launchVelocityFromDrag(pad, pointer) {
  let vx = (pad.x - pointer.x) * (LAUNCH_MAX_SPEED / AIM_MAX_DRAG);
  let vy = (pad.y - pointer.y) * (LAUNCH_MAX_SPEED / AIM_MAX_DRAG);
  const speed = Math.hypot(vx, vy);
  if (speed > LAUNCH_MAX_SPEED) {
    vx = (vx / speed) * LAUNCH_MAX_SPEED;
    vy = (vy / speed) * LAUNCH_MAX_SPEED;
  }
  return { vx, vy, power: Math.min(1, speed / LAUNCH_MAX_SPEED) };
}

/**
 * Search the launch space for a flight that reaches the gate. Coarse grid over
 * angle and speed; among the winners keep the one that gathers the most shards,
 * then the quickest. Used only to stage deterministic screenshots.
 */
export function findLaunch(level, minShards = 1) {
  let best = null;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 36) {
    for (let speed = 160; speed <= 700; speed += 25) {
      const result = simulateLaunch(level, Math.cos(angle) * speed, Math.sin(angle) * speed);
      if (result.outcome !== OUTCOME_GATE || result.shards < minShards) continue;
      if (
        best === null ||
        result.shards > best.shards ||
        (result.shards === best.shards && result.time < best.time)
      ) {
        best = { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ...result };
      }
    }
  }
  if (best !== null) return best;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 36) {
    for (let speed = 160; speed <= 700; speed += 25) {
      const result = simulateLaunch(level, Math.cos(angle) * speed, Math.sin(angle) * speed);
      if (result.outcome !== OUTCOME_GATE) continue;
      if (best === null || result.time < best.time) {
        best = { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ...result };
      }
    }
  }
  return best;
}
