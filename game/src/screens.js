// The screens: title, the star map (route select), route clear, route
// failed, game over, victory and pause. Each draws its panel and records its
// buttons in `game.buttons` so the input layer can hit-test clicks. The map
// layout is shared with the input layer through layoutMap().
import { FIELD, PALETTE } from './config.js';
import { LEVELS, totalShards, totalStars } from './levels.js';
import { REGIONS, regionOf, routeNumberInRegion } from './regions.js';
import { formatTime } from './scoring.js';

const MAP_COLUMNS = 4;
const MAP_TOP = 210;
const MAP_ROW_GAP = 104;

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
}

function drawButton(ctx, game, id, x, y, w, h, label, accent) {
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.fillStyle = '#0a0e24';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  game.buttons.push({ id, x, y, w, h });
}

function drawStar(ctx, x, y, radius, filled) {
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = -Math.PI / 2 + (point / 10) * Math.PI * 2;
    const r = point % 2 === 0 ? radius : radius * 0.45;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (point === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? PALETTE.shard : 'rgba(139, 148, 184, 0.4)';
  ctx.fill();
  ctx.strokeStyle = filled ? '#fff6d8' : PALETTE.hudDim;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** The star map's route nodes: position, lock state and stars, for drawing and clicks. */
export function layoutMap(save) {
  const nodes = [];
  const columnWidth = (FIELD.width - 80) / MAP_COLUMNS;
  for (let index = 0; index < LEVELS.length; index += 1) {
    const column = Math.floor(index / 5);
    const row = index % 5;
    nodes.push({
      routeIndex: index,
      x: 40 + columnWidth * column + columnWidth / 2,
      y: MAP_TOP + row * MAP_ROW_GAP,
      r: 30,
      locked: index > save.unlocked,
      stars: save.stars[String(index)] || 0,
    });
  }
  return nodes;
}

export function drawTitle(ctx, game) {
  game.buttons = [];
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('COMET COURIER', FIELD.width / 2, 190);
  ctx.fillStyle = '#ffb36b';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('— Starlight Routes —', FIELD.width / 2, 238);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Slingshot your comet around the planets, gather the star shards,', FIELD.width / 2, 292);
  ctx.fillText('and reach the warp gate — across 20 routes in 4 regions.', FIELD.width / 2, 322);

  drawPanel(ctx, FIELD.width / 2 - 330, 360, 660, 150);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Drag from the comet to aim — the dotted line previews your flight.', FIELD.width / 2, 398);
  ctx.fillText('Wormholes fold space · solar wind pushes · mines drift · flare gates blink.', FIELD.width / 2, 430);
  ctx.fillStyle = PALETTE.shard;
  ctx.fillText(`◆ ${totalShards()} shards to find · ★ ${totalStars()} stars to earn · ♥ 3 hearts per run`, FIELD.width / 2, 470);

  const save = game.save;
  const starsEarned = Object.values(save.stars).reduce((sum, value) => sum + value, 0);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(
    `BEST ${save.bestScore}   ·   ★ ${starsEarned}/${totalStars()}   ·   Routes open ${save.unlocked + 1}/20   ·   Victories ${save.victories}`,
    FIELD.width / 2, 560,
  );
  drawButton(ctx, game, 'to-map', FIELD.width / 2 - 150, 600, 300, 56, 'OPEN THE STAR MAP', '#ffb36b');
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('R restart route · P pause · M sound · Esc star map', FIELD.width / 2, 700);
}

export function drawMap(ctx, game) {
  game.buttons = [];
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 38px system-ui, sans-serif';
  ctx.fillText('STAR MAP', FIELD.width / 2, 66);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Pick a route. Clear it to open the next — stars and shards stay in your save.', FIELD.width / 2, 96);

  const columnWidth = (FIELD.width - 80) / MAP_COLUMNS;
  for (let column = 0; column < MAP_COLUMNS; column += 1) {
    const region = REGIONS[column];
    const cx = 40 + columnWidth * column + columnWidth / 2;
    ctx.fillStyle = region.accent;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(region.name.toUpperCase(), cx, 140);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(region.mechanic, cx, 164);
  }

  const nodes = layoutMap(game.save);
  for (const node of nodes) {
    const region = regionOf(node.routeIndex);
    const level = LEVELS[node.routeIndex];
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fillStyle = node.locked ? 'rgba(20, 24, 48, 0.9)' : region.accentDim;
    ctx.fill();
    ctx.strokeStyle = node.locked ? PALETTE.hudDim : region.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = node.locked ? PALETTE.hudDim : '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.locked ? '🔒' : String(routeNumberInRegion(node.routeIndex)), node.x, node.y + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = node.locked ? PALETTE.hudDim : PALETTE.hud;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(level.name, node.x, node.y + 48);
    if (!node.locked) {
      for (let star = 0; star < 3; star += 1) {
        drawStar(ctx, node.x - 22 + star * 22, node.y + 66, 8, star < node.stars);
      }
    }
  }

  const starsEarned = Object.values(game.save.stars).reduce((sum, value) => sum + value, 0);
  const shardsEarned = Object.values(game.save.bestShards).reduce((sum, value) => sum + value, 0);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText(`★ ${starsEarned}/${totalStars()}    ◆ ${shardsEarned}/${totalShards()}    BEST ${game.save.bestScore}`, FIELD.width / 2, 758);
  drawButton(ctx, game, 'to-title', 24, 24, 130, 40, '◀ TITLE', '#8ecbff');
}

function drawEndPanel(ctx, game, title, accent) {
  drawPanel(ctx, FIELD.width / 2 - 320, 130, 640, 520);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(title, FIELD.width / 2, 205);
}

export function drawClear(ctx, game) {
  game.buttons = [];
  const region = regionOf(game.routeIndex);
  drawEndPanel(ctx, game, 'ROUTE CLEAR!', region.accent);
  for (let star = 0; star < 3; star += 1) {
    drawStar(ctx, FIELD.width / 2 - 64 + star * 64, 260, 26, star < game.clearStars);
  }
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(`${region.name} ${routeNumberInRegion(game.routeIndex)} — ${game.level.name}`, FIELD.width / 2, 320);
  ctx.font = '19px system-ui, sans-serif';
  ctx.textAlign = 'left';
  const rows = [
    [`Shards ${game.shardsGot}/${game.level.shards.length}`, `+${game.shardsGot * 100}`],
    ['Clear bonus', `+${game.clearBonus}`],
    [`Time ${formatTime(game.routeTime)}`, game.timeBonus > 0 ? `+${game.timeBonus}` : '—'],
    ['SCORE', String(game.score)],
  ];
  let y = 360;
  for (const [label, value] of rows) {
    ctx.fillStyle = label === 'SCORE' ? PALETTE.shard : PALETTE.hud;
    ctx.fillText(label, FIELD.width / 2 - 200, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, FIELD.width / 2 + 200, y);
    ctx.textAlign = 'left';
    y += 36;
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(`Launches ${game.launches} (par ${game.level.par}) · Comets left ${game.cometsLeft}`, FIELD.width / 2, 530);
  const lastRoute = game.routeIndex + 1 >= LEVELS.length;
  drawButton(ctx, game, 'next', FIELD.width / 2 - 220, 560, 210, 52, lastRoute ? 'FINISH!' : 'NEXT ROUTE ▶', region.accent);
  drawButton(ctx, game, 'to-map', FIELD.width / 2 + 10, 560, 210, 52, 'STAR MAP', '#8ecbff');
}

export function drawFailed(ctx, game) {
  game.buttons = [];
  drawEndPanel(ctx, game, 'ROUTE FAILED', PALETTE.danger);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Out of comets on this route.', FIELD.width / 2, 270);
  ctx.fillStyle = PALETTE.heart;
  ctx.font = 'bold 40px system-ui, sans-serif';
  let hearts = '';
  for (let index = 0; index < 3; index += 1) hearts += index < game.hearts ? '♥ ' : '♡ ';
  ctx.fillText(hearts.trim(), FIELD.width / 2, 330);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText(
    game.hearts > 0 ? `One heart lost — ${game.hearts} left. The route waits for you.` : 'That was the last heart.',
    FIELD.width / 2, 380,
  );
  drawButton(ctx, game, 'retry', FIELD.width / 2 - 220, 560, 210, 52, 'RETRY ROUTE', '#ffb36b');
  drawButton(ctx, game, 'to-map', FIELD.width / 2 + 10, 560, 210, 52, 'STAR MAP', '#8ecbff');
}

export function drawOver(ctx, game) {
  game.buttons = [];
  drawEndPanel(ctx, game, 'OUT OF HEARTS', PALETTE.danger);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('The courier rests. Your stars and shards are kept.', FIELD.width / 2, 270);
  ctx.font = '19px system-ui, sans-serif';
  ctx.textAlign = 'left';
  const rows = [
    ['Score this run', String(game.score)],
    ['Best score', String(game.best)],
    ['Routes cleared', `${game.routesCleared} / 20`],
    ['Shards this run', String(game.shardsRun)],
  ];
  let y = 330;
  for (const [label, value] of rows) {
    ctx.fillText(label, FIELD.width / 2 - 200, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, FIELD.width / 2 + 200, y);
    ctx.textAlign = 'left';
    y += 38;
  }
  drawButton(ctx, game, 'to-map', FIELD.width / 2 - 150, 560, 300, 52, 'BACK TO THE STAR MAP', '#8ecbff');
}

export function drawVictory(ctx, game) {
  game.buttons = [];
  drawEndPanel(ctx, game, 'THE ROUTES ARE OPEN!', '#ffd166');
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Every delivery made. The Starlight Routes shine again.', FIELD.width / 2, 262);
  const starsEarned = Object.values(game.save.stars).reduce((sum, value) => sum + value, 0);
  ctx.font = '19px system-ui, sans-serif';
  ctx.textAlign = 'left';
  const rows = [
    ['Final score', String(game.score)],
    ['Best score', String(game.best)],
    ['Stars', `${starsEarned} / ${totalStars()}`],
    ['Shards', `${game.shardsRun} / ${totalShards()}`],
    ['Time', formatTime(game.runTime)],
    ['Launches', String(game.launchesTotal)],
  ];
  let y = 310;
  for (const [label, value] of rows) {
    ctx.fillStyle = label === 'Final score' ? PALETTE.shard : PALETTE.hud;
    ctx.fillText(label, FIELD.width / 2 - 200, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, FIELD.width / 2 + 200, y);
    ctx.textAlign = 'left';
    y += 36;
  }
  drawButton(ctx, game, 'again', FIELD.width / 2 - 220, 560, 210, 52, 'PLAY AGAIN', '#ffd166');
  drawButton(ctx, game, 'to-map', FIELD.width / 2 + 10, 560, 210, 52, 'STAR MAP', '#8ecbff');
}

export function drawPaused(ctx, game) {
  game.buttons = [];
  ctx.fillStyle = 'rgba(5, 8, 20, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawPanel(ctx, FIELD.width / 2 - 260, 240, 520, 300);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('PAUSED', FIELD.width / 2, 315);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('P or click to resume · R restarts the route', FIELD.width / 2, 360);
  drawButton(ctx, game, 'resume', FIELD.width / 2 - 220, 420, 210, 52, 'RESUME', '#7dffb2');
  drawButton(ctx, game, 'to-map', FIELD.width / 2 + 10, 420, 210, 52, 'STAR MAP', '#8ecbff');
}
