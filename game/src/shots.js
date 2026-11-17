// The screenshot scenes behind ?shot=title|map|play|victory. Each one stages
// a real state of the game — the play scene flies a genuine winning launch
// and freezes it mid-flight — so every shot is what a short game really looks
// like, and the same seed always gives the same frame.
//
// The map scene stages a campaign in progress (Ember Belt and Frost Drift
// cleared, Storm Reef half open, Void Crown locked); the victory scene stages
// a finished run with its final stats. Both write to the in-memory save
// only, never to localStorage.
import { COMETS_PER_ROUTE } from './config.js';
import { freshLevel } from './levels.js';
import { findLaunch, startFlight, stepFlight } from './physics.js';
import { SCREEN_MAP, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';
import { clearBonus, starsForClear } from './scoring.js';

/** The route the play shot flies: Gale Crossing, wind, wormhole and mine in view. */
const PLAY_ROUTE = 11;

/** A campaign in progress: Ember Belt and Frost Drift cleared, Storm Reef half open. */
function stageProgress(game) {
  game.save.unlocked = 12;
  game.save.stars = { 0: 3, 1: 3, 2: 2, 3: 3, 4: 2, 5: 3, 6: 2, 7: 3, 8: 2, 9: 3, 10: 3, 11: 1 };
  game.save.bestShards = { 0: 3, 1: 4, 2: 4, 3: 4, 4: 5, 5: 4, 6: 4, 7: 5, 8: 4, 9: 5, 10: 4, 11: 2 };
  game.save.bestScore = 12450;
  game.best = 12450;
}

export function stageShot(name, game, controls) {
  game.time = 4;
  game.buttons = [];
  if (name === 'map') {
    stageProgress(game);
    game.screen = SCREEN_MAP;
    return;
  }
  if (name === 'victory') {
    game.save.stars = {
      0: 3, 1: 3, 2: 2, 3: 3, 4: 3, 5: 3, 6: 2, 7: 3, 8: 3, 9: 2,
      10: 3, 11: 3, 12: 2, 13: 3, 14: 3, 15: 2, 16: 3, 17: 2, 18: 3, 19: 2,
    };
    game.save.unlocked = 19;
    game.score = 18740;
    game.best = 18740;
    game.shardsRun = 79;
    game.runTime = 1247;
    game.launchesTotal = 31;
    game.routesCleared = 20;
    game.screen = SCREEN_VICTORY;
    return;
  }
  if (name !== 'play') {
    stageProgress(game);
    game.screen = SCREEN_TITLE;
    return;
  }

  // Play: fly a winning launch on Gale Crossing and freeze it once it has
  // gathered its first shard (or at 80% of the flight), trail and HUD in view.
  controls.resetRoute(PLAY_ROUTE);
  game.score = 8420;
  game.best = 12450;
  game.hearts = 3;
  game.shardsRun = 46;
  game.routesCleared = 11;
  const launch = findLaunch(game.level, 1);
  if (launch === null) {
    game.screen = SCREEN_PLAY;
    return;
  }
  const level = freshLevel(PLAY_ROUTE);
  const flight = startFlight(level, launch.vx, launch.vy, 0);
  const trail = [{ x: flight.x, y: flight.y }];
  const latestFreeze = launch.time * 0.9;
  const earliestFreeze = launch.time * 0.7;
  const steps = Math.ceil(latestFreeze / (1 / 120));
  for (let index = 0; index < steps; index += 1) {
    stepFlight(flight, level, 1 / 120);
    if (index % 2 === 0) trail.push({ x: flight.x, y: flight.y });
    if (flight.outcome !== 'flying') break;
    if (flight.time >= earliestFreeze && flight.shards >= 1) break;
  }
  game.level = level;
  game.flight = flight;
  game.trail = trail;
  game.shardsGot = flight.shards;
  game.score += flight.shards * 100;
  game.cometsLeft = COMETS_PER_ROUTE - 1;
  game.launches = 1;
  game.launchesTotal = 24;
  game.routeTime = flight.time;
  game.levelTime = flight.time;
  game.hint = 'Flying…';
  game.clearStars = starsForClear(flight.shards, level.shards.length, 1, level.par);
  game.clearBonus = clearBonus(game.cometsLeft, flight.time, level.parTime);
  game.screen = SCREEN_PLAY;
}
