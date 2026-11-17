// Pickups: the two things a comet can gather besides shards. A 'comet'
// pickup grants one more comet for the route (up to the cap); a 'shield'
// pickup arms one free crash — the next world or mine bounces the comet off
// instead of swallowing it. This file names them and applies them; the flight
// model in physics.js decides when one is collected.
import { COMETS_MAX } from './config.js';

export const PICKUP_COMET = 'comet';
export const PICKUP_SHIELD = 'shield';

/** What the pickup does, and the line the HUD shows when it is gathered. */
export function pickupLabel(kind) {
  return kind === PICKUP_SHIELD ? 'Shield armed — one crash forgiven' : 'Extra comet +1';
}

/**
 * Apply a collected pickup to the run state. Returns the HUD line to show.
 * `game` carries cometsLeft and shieldArmed; the flight carries its own
 * shield flag, set when the next comet launches.
 */
export function applyPickup(game, kind) {
  if (kind === PICKUP_SHIELD) {
    game.shieldArmed = true;
    if (game.flight !== null) game.flight.shield = true;
    return pickupLabel(kind);
  }
  game.cometsLeft = Math.min(COMETS_MAX, game.cometsLeft + 1);
  return pickupLabel(kind);
}
