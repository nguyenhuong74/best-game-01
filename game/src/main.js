// Boot and the one loop: input is read every frame, the flight advances in fixed
// 1/120 s steps, and the renderer paints what is there. The game moves between
// six screens: title, play, paused, route clear, out of comets, and victory.
//
// ?seed=N fixes the starfield. ?shot=start|play|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, COMETS_PER_LEVEL, FIELD, SCORE_CLEAR, SCORE_COMET_BONUS, SCORE_SHARD, STEP } from './config.js';
import { createRandom } from './random.js';
import { freshLevel, LEVELS } from './levels.js';
import { launchVelocityFromDrag, OUTCOME_CRASH, OUTCOME_GATE, OUTCOME_LOST, simulateLaunch, startFlight, stepFlight } from './physics.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_NEXT, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';
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

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

/** The whole game state, in one object the renderer reads. */
const game = {
  screen: SCREEN_TITLE,
  levelIndex: 0,
  level: freshLevel(0),
  levelTime: 0,
  time: 0,
  flight: null,
  trail: [],
  aim: { active: false, points: [], power: 0, pad: { x: 0, y: 0 } },
  score: 0,
  scoreAtLevelStart: 0,
  best: readBest(),
  cometsLeft: COMETS_PER_LEVEL,
  launches: 0,
  shardsGot: 0,
  clearStars: 0,
  clearBonus: 0,
  muted: false,
  hint: 'Drag from the comet to aim — release to launch',
};

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

/** Put the courier at the start of `index` with a fresh route and full comets. */
function resetLevel(index) {
  game.levelIndex = index;
  game.level = freshLevel(index);
  game.levelTime = 0;
  game.flight = null;
  game.trail = [];
  game.aim = { active: false, points: [], power: 0, pad: { ...game.level.pad } };
  game.cometsLeft = COMETS_PER_LEVEL;
  game.launches = 0;
  game.shardsGot = 0;
  game.scoreAtLevelStart = game.score;
  game.hint = 'Drag from the comet to aim — release to launch';
}

function startRun() {
  game.score = 0;
  game.best = readBest();
  resetLevel(0);
  game.screen = SCREEN_PLAY;
  setStatus('Route 1: First Delivery. Drag from the comet to aim, release to launch.');
}

function launchComet(pointer) {
  const velocity = launchVelocityFromDrag(game.level.pad, pointer);
  if (velocity.power < MIN_LAUNCH_POWER) return;
  game.flight = startFlight(game.level, velocity.vx, velocity.vy, game.levelTime);
  game.trail = [{ x: game.flight.x, y: game.flight.y }];
  game.launches += 1;
  game.cometsLeft -= 1;
  game.aim = { active: false, points: [], power: 0, pad: { ...game.level.pad } };
  game.hint = 'Flying…';
  audio.launch();
}

function collectShard() {
  game.shardsGot += 1;
  game.score += SCORE_SHARD;
  audio.shard();
}

function clearLevel() {
  game.clearBonus = SCORE_CLEAR + SCORE_COMET_BONUS * game.cometsLeft;
  game.score += game.clearBonus;
  const allShards = game.shardsGot === game.level.shards.length;
  game.clearStars = allShards && game.launches <= game.level.par ? 3 : allShards ? 2 : 1;
  game.flight = null;
  game.screen = SCREEN_CLEAR;
  if (game.score > game.best) {
    game.best = game.score;
    saveBest(game.best);
  }
  audio.win();
  setStatus(`Route clear! ${game.clearStars} stars, score ${game.score}.`);
}

function loseComet(outcome) {
  game.flight = null;
  game.trail = [];
  audio.crash();
  if (game.cometsLeft > 0) {
    game.hint = outcome === OUTCOME_CRASH
      ? `Comet lost to a world — ${game.cometsLeft} left. Aim again.`
      : `Comet drifted away — ${game.cometsLeft} left. Aim again.`;
    setStatus(game.hint);
    return;
  }
  game.screen = SCREEN_OVER;
  if (game.score > game.best) {
    game.best = game.score;
    saveBest(game.best);
  }
  audio.lose();
  setStatus(`Out of comets. Score ${game.score}.`);
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = SCREEN_VICTORY;
    setStatus(`All deliveries made! Final score ${game.score}.`);
    return;
  }
  resetLevel(game.levelIndex + 1);
  game.screen = SCREEN_PLAY;
  setStatus(`Route ${game.levelIndex + 1}: ${game.level.name}.`);
}

function stepFlightOnce() {
  const event = stepFlight(game.flight, game.level, STEP);
  game.levelTime += STEP;
  game.trail.push({ x: game.flight.x, y: game.flight.y });
  if (game.trail.length > 600) game.trail.splice(0, game.trail.length - 600);
  if (event === 'shard') collectShard();
  if (game.flight.outcome === OUTCOME_GATE) clearLevel();
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
  const preview = simulateLaunch(game.level, velocity.vx, velocity.vy, 6, game.levelTime);
  game.aim = {
    active: true,
    points: preview.trail.filter((_, index) => index % 2 === 0),
    power: velocity.power,
    pad: { ...game.level.pad },
  };
}

function handleAction(action) {
  if (action.type === ACTION_MUTE) {
    game.muted = audio.toggleMute();
    return;
  }
  if (game.screen === SCREEN_TITLE) {
    if (action.type === ACTION_CONFIRM || action.type === 'release') {
      audio.click();
      startRun();
    }
    return;
  }
  if (game.screen === SCREEN_PAUSED) {
    if (action.type === ACTION_PAUSE || action.type === ACTION_CONFIRM || action.type === 'release') {
      game.screen = SCREEN_PLAY;
      audio.click();
    }
    return;
  }
  if (game.screen === SCREEN_PLAY) {
    if (action.type === ACTION_PAUSE) {
      game.screen = SCREEN_PAUSED;
      return;
    }
    if (action.type === ACTION_RESTART) {
      game.score = game.scoreAtLevelStart;
      resetLevel(game.levelIndex);
      return;
    }
    if (action.type === 'release') launchComet({ x: action.x, y: action.y });
    return;
  }
  if (game.screen === SCREEN_CLEAR) {
    if (action.type === ACTION_NEXT || action.type === ACTION_CONFIRM || action.type === 'release') {
      audio.click();
      nextLevel();
    }
    return;
  }
  if (game.screen === SCREEN_OVER || game.screen === SCREEN_VICTORY) {
    if (action.type === ACTION_RESTART || action.type === ACTION_CONFIRM || action.type === 'release') {
      audio.click();
      startRun();
    }
  }
}

function runShot(name) {
  const scene = stageShot(name, game, { resetLevel, startRun });
  let painted = 0;
  function paint() {
    renderer.draw(game);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  void scene;
  requestAnimationFrame(paint);
}

function runGame() {
  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    game.time += elapsed;
    for (const action of input.drainActions()) handleAction(action);
    if (game.screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        if (game.flight !== null) stepFlightOnce();
        else game.levelTime += STEP;
        if (game.screen !== SCREEN_PLAY) {
          accumulator = 0;
          break;
        }
      }
      updateAim();
    }
    renderer.draw(game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
