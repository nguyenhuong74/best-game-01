// The heads-up display: hearts, comets, the shard count against the
// campaign total, score and best, the route name and region, the clock, and
// the hint line. Drawn over the field on the play and pause screens, and
// kept readable at a glance when the screenshot is shrunk.
import { FIELD, PALETTE } from './config.js';
import { formatTime } from './scoring.js';
import { totalShards } from './levels.js';
import { regionOf, routeNumberInRegion } from './regions.js';

export function drawHud(ctx, game) {
  const region = regionOf(game.routeIndex);
  const shardTotal = totalShards();
  ctx.textBaseline = 'alphabetic';

  // Top bar: route and region on the left, score on the right.
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${region.name} ${routeNumberInRegion(game.routeIndex)} — ${game.level.name}`, 24, 38);
  ctx.font = '20px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${game.score}`, FIELD.width - 24, 36);

  // Second row: hearts, comets, shards, shield, clock on the left; best on the right.
  ctx.textAlign = 'left';
  ctx.font = '22px system-ui, sans-serif';
  let hearts = '';
  for (let index = 0; index < 3; index += 1) hearts += index < game.hearts ? '♥ ' : '♡ ';
  ctx.fillStyle = PALETTE.heart;
  ctx.fillText(hearts.trim(), 24, 72);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`☄ ${game.cometsLeft}`, 130, 72);
  ctx.fillStyle = PALETTE.shard;
  ctx.fillText(`◆ ${game.shardsRun}/${shardTotal}`, 210, 72);
  ctx.fillStyle = game.shieldArmed ? PALETTE.pickupShield : PALETTE.hudDim;
  ctx.fillText(game.shieldArmed ? '🛡 SHIELD' : '', 330, 72);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText(`⏱ ${formatTime(game.routeTime)}`, 480, 72);
  ctx.textAlign = 'right';
  ctx.fillText(`BEST ${game.best}`, FIELD.width - 24, 72);

  // Hint line along the bottom.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(game.hint, FIELD.width / 2, FIELD.height - 18);
  ctx.textAlign = 'right';
  ctx.fillText('R restart · P pause · M sound · Esc map', FIELD.width - 24, FIELD.height - 18);
}
