// The game state: one object the renderer reads and the loop mutates. A run
// is a campaign across the star map: score, hearts, shards and launches
// accumulate until the run ends (victory or out of hearts), while the save
// keeps the lasting progress — unlocked routes, stars and best score.
import { COMETS_PER_ROUTE, HEARTS_PER_RUN } from './config.js';
import { freshLevel } from './levels.js';
import { createParticles } from './particles.js';
import { SCREEN_TITLE } from './render.js';

/** A fresh game, on the title screen, with the loaded save attached. */
export function createGame(save, backdrop) {
  return {
    save,
    backdrop,
    particles: createParticles(),
    screen: SCREEN_TITLE,
    routeIndex: 0,
    level: freshLevel(0),
    time: 0,
    routeTime: 0,
    levelTime: 0,
    runTime: 0,
    flight: null,
    trail: [],
    aim: { active: false, points: [], power: 0 },
    score: 0,
    scoreAtRouteStart: 0,
    best: save.bestScore,
    hearts: HEARTS_PER_RUN,
    cometsLeft: COMETS_PER_ROUTE,
    launches: 0,
    launchesTotal: 0,
    shardsGot: 0,
    shardsRun: 0,
    routesCleared: 0,
    shieldArmed: false,
    clearStars: 0,
    clearBonus: 0,
    timeBonus: 0,
    shake: 0,
    muted: save.muted,
    hint: 'Drag from the comet to aim — release to launch',
    buttons: [],
  };
}

/** Start a new campaign run: score, hearts and run totals reset. */
export function startRun(game) {
  game.score = 0;
  game.best = game.save.bestScore;
  game.hearts = HEARTS_PER_RUN;
  game.shardsRun = 0;
  game.routesCleared = 0;
  game.launchesTotal = 0;
  game.runTime = 0;
  game.particles.clear();
}

/** Put the courier at the start of `routeIndex` with a fresh route. */
export function resetRoute(game, routeIndex) {
  game.routeIndex = routeIndex;
  game.level = freshLevel(routeIndex);
  game.routeTime = 0;
  game.levelTime = 0;
  game.flight = null;
  game.trail = [];
  game.aim = { active: false, points: [], power: 0 };
  game.cometsLeft = COMETS_PER_ROUTE;
  game.launches = 0;
  game.shardsGot = 0;
  game.shieldArmed = false;
  game.shake = 0;
  game.scoreAtRouteStart = game.score;
  game.particles.clear();
  game.hint = 'Drag from the comet to aim — release to launch';
}
