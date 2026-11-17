// Scoring: stars, clear bonuses and the clock. Stars are the campaign's
// lasting measure — three per route, kept in the save — while the score is
// the run's: shards, the clear bonus, a bonus per comet left, and a time
// bonus for beating the route's par time.
import { SCORE_CLEAR, SCORE_COMET_BONUS, SCORE_TIME_BONUS_PER_SECOND } from './config.js';

/**
 * Stars for a cleared route: 3 for every shard within par launches, 2 for
 * every shard, 1 for a clear. A route cleared with no shards still earns 1.
 */
export function starsForClear(shardsGot, shardTotal, launches, par) {
  const allShards = shardsGot >= shardTotal;
  if (allShards && launches <= par) return 3;
  if (allShards) return 2;
  return 1;
}

/** The bonus for clearing a route: base, per comet left, and per second under par. */
export function clearBonus(cometsLeft, routeTime, parTime) {
  const timeBonus = Math.max(0, Math.floor((parTime - routeTime) * SCORE_TIME_BONUS_PER_SECOND));
  return SCORE_CLEAR + SCORE_COMET_BONUS * cometsLeft + timeBonus;
}

/** Seconds as m:ss, for the HUD and the victory screen. */
export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}
