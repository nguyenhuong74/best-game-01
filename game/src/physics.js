// The flight model, pure functions with no DOM: the game loop, the trajectory
// preview, the screenshot staging and the solvability check all fly the same
// physics, so what the aim line promises is what the comet does.
//
// A flight is { x, y, vx, vy, time, shards, outcome, shield, warpCooldown,
// taken[], pickupsTaken[] }. Outcomes: 'flying', 'gate' (reached an open warp
// gate), 'crash' (hit a world, a void or a mine), 'lost' (drifted off the
// field). One step returns at most one event: a pickup or shard code, 'warp',
// 'shield-save', or the flight's outcome.
import { FIELD, GRAVITY, LAUNCH_MAX_SPEED, AIM_MAX_DRAG, LOST_MARGIN, STEP } from './config.js';

export const OUTCOME_FLYING = 'flying';
export const OUTCOME_GATE = 'gate';
export const OUTCOME_CRASH = 'crash';
export const OUTCOME_LOST = 'lost';

export const EVENT_SHARD = 'shard';
export const EVENT_PICKUP_COMET = 'pickup-comet';
export const EVENT_PICKUP_SHIELD = 'pickup-shield';
export const EVENT_WARP = 'warp';
export const EVENT_SHIELD_SAVE = 'shield-save';

/** Seconds a wormhole refuses to fire again after a jump, so a comet cannot loop. */
const WARP_COOLDOWN = 0.6;
/** How close a comet must pass to gather a shard or a pickup. */
const COLLECT_RADIUS = 28;

/** Where a planet is at `time` seconds: fixed, or revolving on its orbit. */
export function planetPosition(planet, time) {
  if (!planet.orbit) return { x: planet.x, y: planet.y };
  const angle = planet.orbit.phase + planet.orbit.speed * time;
  return {
    x: planet.orbit.cx + Math.cos(angle) * planet.orbit.radius,
    y: planet.orbit.cy + Math.sin(angle) * planet.orbit.radius,
  };
}

/** Where a mine is at `time` seconds: it drifts back and forth on its line. */
export function minePosition(mine, time) {
  const offset = Math.sin(time * mine.speed + mine.phase) * mine.range;
  return { x: mine.x + mine.dx * offset, y: mine.y + mine.dy * offset };
}

/** Whether the gate catches a comet at `time`: always, unless it is a flare gate. */
export function gateOpenAt(gate, time) {
  if (!gate.flare) return true;
  const phase = (time + gate.flare.phase) % gate.flare.period;
  return phase < gate.flare.open;
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

/** Solar-wind acceleration at a point: the sum of every wind zone covering it. */
export function windAt(level, x, y) {
  let ax = 0;
  let ay = 0;
  for (const wind of level.winds) {
    if (x >= wind.x && x <= wind.x + wind.w && y >= wind.y && y <= wind.y + wind.h) {
      ax += wind.ax;
      ay += wind.ay;
    }
  }
  return { ax, ay };
}

/** Start a flight from the pad with a velocity, at `startTime` on the route clock. */
export function startFlight(level, vx, vy, startTime = 0, shield = false) {
  return {
    x: level.pad.x,
    y: level.pad.y,
    vx,
    vy,
    time: startTime,
    shards: 0,
    pickups: 0,
    taken: level.shards.map(() => false),
    pickupsTaken: level.pickups.map(() => false),
    outcome: OUTCOME_FLYING,
    shield,
    warpCooldown: 0,
  };
}

/**
 * Advance one fixed step. Returns one event: 'shard', 'pickup-comet',
 * 'pickup-shield', 'warp', 'shield-save', or the flight's outcome.
 */
export function stepFlight(flight, level, dt) {
  if (flight.outcome !== OUTCOME_FLYING) return flight.outcome;
  const gravity = gravityAt(level, flight.x, flight.y, flight.time);
  const wind = windAt(level, flight.x, flight.y);
  flight.vx += (gravity.ax + wind.ax) * dt;
  flight.vy += (gravity.ay + wind.ay) * dt;
  flight.x += flight.vx * dt;
  flight.y += flight.vy * dt;
  flight.time += dt;
  if (flight.warpCooldown > 0) flight.warpCooldown -= dt;

  // Wormholes: step into a mouth and come out of the other, velocity kept.
  if (flight.warpCooldown <= 0) {
    for (const hole of level.wormholes) {
      const toA = (flight.x - hole.a.x) ** 2 + (flight.y - hole.a.y) ** 2;
      const toB = (flight.x - hole.b.x) ** 2 + (flight.y - hole.b.y) ** 2;
      const mouth = toA < hole.r * hole.r ? hole.b : toB < hole.r * hole.r ? hole.a : null;
      if (mouth !== null) {
        const speed = Math.hypot(flight.vx, flight.vy) || 1;
        flight.x = mouth.x + (flight.vx / speed) * (hole.r + 6);
        flight.y = mouth.y + (flight.vy / speed) * (hole.r + 6);
        flight.warpCooldown = WARP_COOLDOWN;
        return EVENT_WARP;
      }
    }
  }

  // Bodies: a planet or void swallows the comet — unless a shield bounces it off.
  const bodies = level.planets.concat(level.voids);
  for (let index = 0; index < bodies.length; index += 1) {
    const body = bodies[index];
    const position = body.orbit ? planetPosition(body, flight.time) : body;
    const dx = flight.x - position.x;
    const dy = flight.y - position.y;
    const radius = body.r + 2;
    if (dx * dx + dy * dy < radius * radius) {
      if (flight.shield) {
        flight.shield = false;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / distance;
        const ny = dy / distance;
        const dot = flight.vx * nx + flight.vy * ny;
        flight.vx -= 2 * dot * nx;
        flight.vy -= 2 * dot * ny;
        flight.x = position.x + nx * (radius + 4);
        flight.y = position.y + ny * (radius + 4);
        return EVENT_SHIELD_SAVE;
      }
      flight.outcome = OUTCOME_CRASH;
      return flight.outcome;
    }
  }

  // Mines: drifting hazards. A shield bounces off them the same way.
  for (const mine of level.mines) {
    const position = minePosition(mine, flight.time);
    const dx = flight.x - position.x;
    const dy = flight.y - position.y;
    const radius = mine.r + 8;
    if (dx * dx + dy * dy < radius * radius) {
      if (flight.shield) {
        flight.shield = false;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / distance;
        const ny = dy / distance;
        const dot = flight.vx * nx + flight.vy * ny;
        flight.vx -= 2 * dot * nx;
        flight.vy -= 2 * dot * ny;
        flight.x = position.x + nx * (radius + 4);
        flight.y = position.y + ny * (radius + 4);
        return EVENT_SHIELD_SAVE;
      }
      flight.outcome = OUTCOME_CRASH;
      return flight.outcome;
    }
  }

  // The gate catches a comet only while it is open (a flare gate blinks).
  const gateDx = flight.x - level.gate.x;
  const gateDy = flight.y - level.gate.y;
  if (
    gateDx * gateDx + gateDy * gateDy < level.gate.r * level.gate.r &&
    gateOpenAt(level.gate, flight.time)
  ) {
    flight.outcome = OUTCOME_GATE;
    return flight.outcome;
  }

  for (let index = 0; index < level.shards.length; index += 1) {
    if (flight.taken[index]) continue;
    const shard = level.shards[index];
    const dx = flight.x - shard.x;
    const dy = flight.y - shard.y;
    if (dx * dx + dy * dy < COLLECT_RADIUS * COLLECT_RADIUS) {
      flight.taken[index] = true;
      flight.shards += 1;
      return EVENT_SHARD;
    }
  }

  for (let index = 0; index < level.pickups.length; index += 1) {
    if (flight.pickupsTaken[index]) continue;
    const pickup = level.pickups[index];
    const dx = flight.x - pickup.x;
    const dy = flight.y - pickup.y;
    if (dx * dx + dy * dy < COLLECT_RADIUS * COLLECT_RADIUS) {
      flight.pickupsTaken[index] = true;
      flight.pickups += 1;
      return pickup.kind === 'shield' ? EVENT_PICKUP_SHIELD : EVENT_PICKUP_COMET;
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
 * Fly a launch to its end. Returns the outcome, shards and pickups collected,
 * flight time and a sparse trail of points (every 4th step) for drawing.
 */
export function simulateLaunch(level, vx, vy, maxSeconds = 14, startTime = 0, shield = false) {
  const flight = startFlight(level, vx, vy, startTime, shield);
  const trail = [{ x: flight.x, y: flight.y }];
  const steps = Math.ceil(maxSeconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    stepFlight(flight, level, STEP);
    if (index % 4 === 0) trail.push({ x: flight.x, y: flight.y });
    if (flight.outcome !== OUTCOME_FLYING) break;
  }
  return { outcome: flight.outcome, shards: flight.shards, pickups: flight.pickups, time: flight.time, trail, flight };
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
 * then the quickest. Used by the solvability check and to stage screenshots.
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
