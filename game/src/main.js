// Boot and the one loop: input is read every frame, the flight advances in
// fixed 1/120 s steps, and the renderer paints what is there. The game moves
// between eight screens: title, star map, play, paused, route clear, route
// failed, out of hearts, and victory.
//
// ?seed=N fixes the starfield. ?shot=title|map|play|victory (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { FIELD, SCORE_SHARD, STEP } from './config.js';
import { createRandom } from './random.js';
import { loadSave, recordClear, recordRunEnd, storeSave } from './save.js';
import { LEVELS } from './levels.js';
import { regionOf } from './regions.js';
import {
  EVENT_PICKUP_COMET, EVENT_PICKUP_SHIELD, EVENT_SHARD, EVENT_SHIELD_SAVE, EVENT_WARP,
  OUTCOME_CRASH, OUTCOME_GATE, OUTCOME_LOST, launchVelocityFromDrag, simulateLaunch,
  startFlight, stepFlight,
} from './physics.js';
import { applyPickup } from './pickups.js';
import { createBackdrop } from './backdrop.js';
import { clearBonus, formatTime, starsForClear } from './scoring.js';
import { createGame, resetRoute, startRun } from './state.js';
import { ACTION_KEY, ACTION_PRESS, ACTION_RELEASE, buttonAt, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createMusic } from './music.js';
import {
  SCREEN_CLEAR, SCREEN_FAILED, SCREEN_MAP, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY,
  SCREEN_TITLE, SCREEN_VICTORY, createRenderer,
} from './render.js';
import { drawHud } from './hud.js';
import {
  drawClear, drawFailed, drawMap, drawOver, drawPaused, drawTitle, drawVictory, layoutMap,
} from './screens.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;
/** A drag weaker than this is a click, not a launch. */
const MIN_LAUNCH_POWER = 0.08;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
void createRandom(seed);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const audio = createAudio();
const music = createMusic(audio);
const save = loadSave();
audio.setMuted(save.muted);
const backdrop = createBackdrop(seed);
const game = createGame(save, backdrop);
game.runActive = false;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const input = createInput(canvas, (dx, dy, rectWidth, rectHeight) => ({
  x: (dx * FIELD.width) / rectWidth,
  y: (dy * FIELD.height) / rectHeight,
}));

function setStatus(text) {
  status.textContent = text;
}

function toggleMute() {
  game.muted = audio.toggleMute();
  save.muted = game.muted;
  storeSave(save);
}

function toMap() {
  game.screen = SCREEN_MAP;
  setStatus('Star map. Pick a route.');
}

function playRoute(routeIndex) {
  if (!game.runActive) {
    startRun(game);
    game.runActive = true;
  }
  resetRoute(game, routeIndex);
  game.screen = SCREEN_PLAY;
  setStatus(`Route ${routeIndex + 1}: ${game.level.name}. Drag from the comet to aim, release to launch.`);
}

function launchComet(pointer) {
  const velocity = launchVelocityFromDrag(game.level.pad, pointer);
  if (velocity.power < MIN_LAUNCH_POWER) return;
  game.flight = startFlight(game.level, velocity.vx, velocity.vy, game.levelTime, game.shieldArmed);
  game.trail = [{ x: game.flight.x, y: game.flight.y }];
  game.launches += 1;
  game.launchesTotal += 1;
  game.cometsLeft -= 1;
  game.aim = { active: false, points: [], power: 0 };
  game.hint = 'Flying…';
  audio.launch();
}

function collectShard() {
  game.shardsGot += 1;
  game.shardsRun += 1;
  game.score += SCORE_SHARD;
  game.particles.burst(game.flight.x, game.flight.y, '#ffd166', 12, 120);
  audio.shard();
}

function clearRoute() {
  const timeBonus = Math.max(0, Math.floor((game.level.parTime - game.routeTime) * 10));
  game.clearBonus = clearBonus(game.cometsLeft, game.routeTime, game.level.parTime);
  game.timeBonus = timeBonus;
  game.clearStars = starsForClear(game.shardsGot, game.level.shards.length, game.launches, game.level.par);
  game.score += game.clearBonus;
  game.routesCleared += 1;
  recordClear(save, game.routeIndex, game.clearStars, game.shardsGot);
  game.particles.burst(game.level.gate.x, game.level.gate.y, '#7dffb2', 30, 220);
  const lastRoute = game.routeIndex + 1 >= LEVELS.length;
  game.flight = null;
  game.screen = SCREEN_CLEAR;
  if (game.score > game.best) game.best = game.score;
  audio.win();
  if (lastRoute) audio.unlock();
  setStatus(`Route clear! ${game.clearStars} stars, score ${game.score}.`);
}

function finishRun(victory) {
  game.runActive = false;
  recordRunEnd(save, game.score, victory ? game.runTime : null);
  if (game.score > game.best) game.best = game.score;
}

function loseComet(outcome) {
  game.particles.burst(game.flight.x, game.flight.y, '#ff6b81', 24, 200);
  game.flight = null;
  game.trail = [];
  game.shake = 10;
  audio.crash();
  if (game.cometsLeft > 0) {
    game.hint = outcome === OUTCOME_CRASH
      ? `Comet lost to a world — ${game.cometsLeft} left. Aim again.`
      : `Comet drifted away — ${game.cometsLeft} left. Aim again.`;
    setStatus(game.hint);
    return;
  }
  game.hearts -= 1;
  if (game.hearts > 0) {
    game.screen = SCREEN_FAILED;
    audio.heart();
    setStatus(`Out of comets. One heart lost — ${game.hearts} left.`);
    return;
  }
  finishRun(false);
  game.screen = SCREEN_OVER;
  audio.lose();
  setStatus(`Out of hearts. Score ${game.score}.`);
}

function nextRoute() {
  if (game.routeIndex + 1 >= LEVELS.length) {
    finishRun(true);
    game.screen = SCREEN_VICTORY;
    setStatus(`All deliveries made! Final score ${game.score} in ${formatTime(game.runTime)}.`);
    return;
  }
  resetRoute(game, game.routeIndex + 1);
  game.screen = SCREEN_PLAY;
  setStatus(`Route ${game.routeIndex + 1}: ${game.level.name}.`);
}

function retryRoute() {
  game.score = game.scoreAtRouteStart;
  game.shardsRun -= game.shardsGot;
  resetRoute(game, game.routeIndex);
  game.screen = SCREEN_PLAY;
}

function restartRoute() {
  game.score = game.scoreAtRouteStart;
  game.shardsRun -= game.shardsGot;
  resetRoute(game, game.routeIndex);
}

function abandonToMap() {
  game.score = game.scoreAtRouteStart;
  game.shardsRun -= game.shardsGot;
  game.flight = null;
  toMap();
}

function stepFlightOnce() {
  const event = stepFlight(game.flight, game.level, STEP);
  game.routeTime += STEP;
  game.runTime += STEP;
  game.levelTime += STEP;
  game.trail.push({ x: game.flight.x, y: game.flight.y });
  if (game.trail.length > 600) game.trail.splice(0, game.trail.length - 600);
  if (Math.random() < 0.5) game.particles.ember(game.flight.x, game.flight.y, '#aef3ff');
  if (event === EVENT_SHARD) collectShard();
  else if (event === EVENT_PICKUP_COMET || event === EVENT_PICKUP_SHIELD) {
    game.hint = applyPickup(game, event === EVENT_PICKUP_SHIELD ? 'shield' : 'comet');
    game.particles.puff(game.flight.x, game.flight.y, event === EVENT_PICKUP_SHIELD ? '#9dffb0' : '#7dd7ff', 12);
    audio.pickup();
  } else if (event === EVENT_WARP) {
    game.particles.puff(game.flight.x, game.flight.y, '#c792ff', 14);
    audio.warp();
  } else if (event === EVENT_SHIELD_SAVE) {
    game.shieldArmed = false;
    game.shake = 6;
    game.hint = 'Shield saved the comet!';
    game.particles.puff(game.flight.x, game.flight.y, '#9dffb0', 16);
    audio.shieldSave();
  }
  if (game.flight.outcome === OUTCOME_GATE) clearRoute();
  else if (game.flight.outcome === OUTCOME_CRASH || game.flight.outcome === OUTCOME_LOST) {
    loseComet(game.flight.outcome);
  }
}

function updateAim() {
  const pointer = input.pointer();
  if (game.screen !== SCREEN_PLAY || game.flight !== null || !pointer.down) {
    game.aim.active = false;
    game.aim.points = [];
    return;
  }
  const velocity = launchVelocityFromDrag(game.level.pad, pointer);
  game.aim.power = velocity.power;
  if (velocity.power < MIN_LAUNCH_POWER) {
    game.aim.active = false;
    game.aim.points = [];
    return;
  }
  const preview = simulateLaunch(game.level, velocity.vx, velocity.vy, 6, game.levelTime, game.shieldArmed);
  game.aim = {
    active: true,
    points: preview.trail.filter((_, index) => index % 2 === 0),
    power: velocity.power,
  };
}

function handleButton(id) {
  if (id === 'to-map') {
    audio.click();
    toMap();
  } else if (id === 'to-title') {
    audio.click();
    game.screen = SCREEN_TITLE;
  } else if (id === 'next') {
    audio.click();
    nextRoute();
  } else if (id === 'retry') {
    audio.click();
    retryRoute();
  } else if (id === 'resume') {
    audio.click();
    game.screen = SCREEN_PLAY;
  } else if (id === 'again') {
    audio.click();
    game.runActive = false;
    toMap();
  }
}

function handlePress(action) {
  const button = buttonAt(game.buttons, action.x, action.y);
  if (button !== null) {
    handleButton(button.id);
    return;
  }
  if (game.screen === SCREEN_TITLE) {
    audio.click();
    toMap();
  } else if (game.screen === SCREEN_MAP) {
    for (const node of layoutMap(save)) {
      const dx = action.x - node.x;
      const dy = action.y - node.y;
      if (dx * dx + dy * dy <= node.r * node.r && !node.locked) {
        audio.click();
        playRoute(node.routeIndex);
        return;
      }
    }
  } else if (game.screen === SCREEN_PAUSED) {
    game.screen = SCREEN_PLAY;
  } else if (game.screen === SCREEN_CLEAR) {
    audio.click();
    nextRoute();
  } else if (game.screen === SCREEN_FAILED) {
    audio.click();
    retryRoute();
  } else if (game.screen === SCREEN_OVER) {
    audio.click();
    toMap();
  }
}

function handleKey(key) {
  if (key === 'm') {
    toggleMute();
    return;
  }
  if (game.screen === SCREEN_TITLE) {
    if (key === 'enter' || key === ' ') {
      audio.click();
      toMap();
    }
    return;
  }
  if (game.screen === SCREEN_MAP) {
    if (key === 'enter') {
      const target = save.unlocked;
      audio.click();
      playRoute(target);
    } else if (key === 'escape') {
      game.screen = SCREEN_TITLE;
    }
    return;
  }
  if (game.screen === SCREEN_PLAY) {
    if (key === 'p') game.screen = SCREEN_PAUSED;
    else if (key === 'r') restartRoute();
    else if (key === 'escape') abandonToMap();
    return;
  }
  if (game.screen === SCREEN_PAUSED) {
    if (key === 'p' || key === 'escape') game.screen = SCREEN_PLAY;
    else if (key === 'r') {
      restartRoute();
      game.screen = SCREEN_PLAY;
    }
    return;
  }
  if (game.screen === SCREEN_CLEAR) {
    if (key === 'n' || key === 'enter') {
      audio.click();
      nextRoute();
    }
    return;
  }
  if (game.screen === SCREEN_FAILED) {
    if (key === 'r' || key === 'enter') {
      audio.click();
      retryRoute();
    }
    return;
  }
  if (game.screen === SCREEN_OVER) {
    if (key === 'enter') {
      audio.click();
      toMap();
    }
    return;
  }
  if (game.screen === SCREEN_VICTORY) {
    if (key === 'r') {
      audio.click();
      game.runActive = false;
      toMap();
    } else if (key === 'enter') {
      audio.click();
      toMap();
    }
  }
}

function handleAction(action) {
  if (action.type === ACTION_PRESS || action.type === ACTION_KEY) music.start();
  if (action.type === ACTION_KEY) {
    handleKey(action.key);
    return;
  }
  if (action.type === ACTION_PRESS) {
    handlePress(action);
    return;
  }
  if (action.type === ACTION_RELEASE && game.screen === SCREEN_PLAY) {
    launchComet({ x: action.x, y: action.y });
  }
}

function draw() {
  const ctx = renderer.context();
  const region = regionOf(game.routeIndex);
  if (game.screen === SCREEN_TITLE) {
    renderer.drawSky(backdrop, regionOf(0), game.time);
    drawTitle(ctx, game);
    return;
  }
  if (game.screen === SCREEN_MAP) {
    renderer.drawSky(backdrop, regionOf(save.unlocked), game.time);
    drawMap(ctx, game);
    return;
  }
  renderer.drawField(game, backdrop, region);
  if (game.screen === SCREEN_PLAY || game.screen === SCREEN_PAUSED) drawHud(ctx, game);
  if (game.screen === SCREEN_PAUSED) drawPaused(ctx, game);
  else if (game.screen === SCREEN_CLEAR) drawClear(ctx, game);
  else if (game.screen === SCREEN_FAILED) drawFailed(ctx, game);
  else if (game.screen === SCREEN_OVER) drawOver(ctx, game);
  else if (game.screen === SCREEN_VICTORY) drawVictory(ctx, game);
}

function runShot(name) {
  stageShot(name, game, { resetRoute: (index) => resetRoute(game, index) });
  let painted = 0;
  function paint() {
    draw();
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    game.time += elapsed;
    if (game.shake > 0.3) game.shake *= 0.88;
    else game.shake = 0;
    for (const action of input.drainActions()) handleAction(action);
    if (game.screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        if (game.flight !== null) stepFlightOnce();
        else {
          game.routeTime += STEP;
          game.runTime += STEP;
          game.levelTime += STEP;
        }
        if (game.screen !== SCREEN_PLAY) {
          accumulator = 0;
          break;
        }
      }
      updateAim();
    }
    game.particles.update(elapsed);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
