// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh route, so the frame is what a short game really
// looks like and the same seed always gives the same frame.
//
// The play and end scenes search level 1 for a launch that reaches the gate
// (the same search the aim preview could run), then fly it: the play scene
// freezes it mid-flight with its trail and HUD, the end scene flies it home
// and shows the route-clear screen with its score and stars.
import { COMETS_PER_LEVEL, SCORE_CLEAR, SCORE_COMET_BONUS, SCORE_SHARD } from './config.js';
import { freshLevel } from './levels.js';
import { findLaunch, simulateLaunch, startFlight, stepFlight } from './physics.js';
import { SCREEN_CLEAR, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/**
 * Stage the named scene on `game` (the state object main.js owns) and return
 * the screen to draw. `controls` carries the level-reset helpers.
 */
export function stageShot(name, game, controls) {
  controls.resetLevel(0);
  game.score = 0;
  game.best = 0;
  game.levelTime = 0;
  game.time = 0;
  if (name !== 'play' && name !== 'end') {
    game.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE };
  }

  const launch = findLaunch(game.level, 1);
  if (launch === null) {
    // No winning launch found: show the route with the comet on the pad.
    game.screen = SCREEN_PLAY;
    return { screen: SCREEN_PLAY };
  }

  if (name === 'play') {
    // Fly the winning launch and freeze it once it has gathered its first
    // shard (or at 80% of the flight, whichever comes first), trail and all,
    // so the shot shows a comet in flight with shards and score on the HUD.
    const level = freshLevel(0);
    const flight = startFlight(level, launch.vx, launch.vy, 0);
    const trail = [{ x: flight.x, y: flight.y }];
    const latestFreeze = launch.time * 0.8;
    const earliestFreeze = launch.time * 0.55;
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
    game.score = flight.shards * SCORE_SHARD;
    game.cometsLeft = COMETS_PER_LEVEL - 1;
    game.launches = 1;
    game.levelTime = flight.time;
    game.hint = 'Flying…';
    game.screen = SCREEN_PLAY;
    return { screen: SCREEN_PLAY };
  }

  // End scene: fly the winning launch all the way to the gate, then show the
  // route-clear screen exactly as the game shows it after a real win.
  const result = simulateLaunch(game.level, launch.vx, launch.vy, 14, 0);
  const level = freshLevel(0);
  const flight = startFlight(level, launch.vx, launch.vy, 0);
  const steps = Math.ceil(result.time / (1 / 120));
  for (let index = 0; index < steps; index += 1) {
    stepFlight(flight, level, 1 / 120);
    if (flight.outcome !== 'flying') break;
  }
  game.level = level;
  game.flight = null;
  game.trail = [];
  game.shardsGot = flight.shards;
  game.cometsLeft = COMETS_PER_LEVEL - 1;
  game.launches = 1;
  game.clearBonus = SCORE_CLEAR + SCORE_COMET_BONUS * game.cometsLeft;
  game.score = flight.shards * SCORE_SHARD + game.clearBonus;
  game.best = game.score;
  const allShards = flight.shards === level.shards.length;
  game.clearStars = allShards && game.launches <= level.par ? 3 : allShards ? 2 : 1;
  game.levelTime = flight.time;
  game.screen = SCREEN_CLEAR;
  return { screen: SCREEN_CLEAR };
}
