// Everything the player sees, painted on one canvas: the starfield, the worlds,
// the warp gate, the comet and its trail, the aim preview, the HUD and every
// menu screen. No images anywhere — the art is drawn from the palette.
import { FIELD, PALETTE } from './config.js';
import { createRandom, range } from './random.js';
import { planetPosition } from './physics.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

const FONT_TITLE = '700 84px "Trebuchet MS", Verdana, sans-serif';
const FONT_HEADING = '700 52px "Trebuchet MS", Verdana, sans-serif';
const FONT_SUB = '400 24px "Trebuchet MS", Verdana, sans-serif';
const FONT_HUD = '700 22px "Trebuchet MS", Verdana, sans-serif';
const FONT_BODY = '400 20px "Trebuchet MS", Verdana, sans-serif';

function starShape(ctx, x, y, radius, rotation) {
  ctx.beginPath();
  for (let point = 0; point < 8; point += 1) {
    const angle = rotation + (point * Math.PI) / 4;
    const r = point % 2 === 0 ? radius : radius * 0.38;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (point === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const random = createRandom(20261115);
  const stars = [];
  for (let index = 0; index < 170; index += 1) {
    stars.push({
      x: random() * FIELD.width,
      y: random() * FIELD.height,
      r: range(random, 0.6, 2.1),
      twinkle: range(random, 0.5, 2.2),
      phase: range(random, 0, Math.PI * 2),
    });
  }
  const nebulae = [];
  for (let index = 0; index < 4; index += 1) {
    nebulae.push({
      x: random() * FIELD.width,
      y: random() * FIELD.height,
      r: range(random, 180, 320),
      hue: [220, 280, 190, 320][index],
      alpha: range(random, 0.05, 0.09),
    });
  }

  function drawBackground(time) {
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.spaceTop);
    gradient.addColorStop(1, PALETTE.spaceBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    for (const nebula of nebulae) {
      const glow = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.r);
      glow.addColorStop(0, `hsla(${nebula.hue}, 70%, 60%, ${nebula.alpha})`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(nebula.x - nebula.r, nebula.y - nebula.r, nebula.r * 2, nebula.r * 2);
    }
    for (const star of stars) {
      const alpha = 0.45 + 0.55 * Math.abs(Math.sin(time * star.twinkle + star.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = PALETTE.star;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPlanet(planet, time) {
    const position = planetPosition(planet, time);
    const glow = ctx.createRadialGradient(position.x, position.y, planet.r * 0.4, position.x, position.y, planet.r * 2.1);
    glow.addColorStop(0, `hsla(${planet.hue}, 80%, 60%, 0.28)`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(position.x - planet.r * 2.1, position.y - planet.r * 2.1, planet.r * 4.2, planet.r * 4.2);
    if (planet.ring) {
      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.rotate(-0.45);
      ctx.strokeStyle = 'rgba(220, 230, 255, 0.55)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(0, 0, planet.r * 1.75, planet.r * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const body = ctx.createRadialGradient(
      position.x - planet.r * 0.35, position.y - planet.r * 0.4, planet.r * 0.15,
      position.x, position.y, planet.r,
    );
    body.addColorStop(0, `hsl(${planet.hue}, 75%, 68%)`);
    body.addColorStop(0.55, `hsl(${planet.hue}, 65%, 45%)`);
    body.addColorStop(1, `hsl(${planet.hue}, 70%, 26%)`);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(position.x, position.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // A darker band and a crater or two, so no two worlds look alike.
    ctx.fillStyle = `hsla(${planet.hue}, 60%, 30%, 0.5)`;
    ctx.beginPath();
    ctx.ellipse(position.x, position.y + planet.r * 0.35, planet.r * 0.8, planet.r * 0.22, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawVoid(voidBody, time) {
    const pulse = 1 + 0.08 * Math.sin(time * 2.4);
    const glow = ctx.createRadialGradient(voidBody.x, voidBody.y, 0, voidBody.x, voidBody.y, voidBody.r * 4);
    glow.addColorStop(0, 'rgba(190, 140, 255, 0.5)');
    glow.addColorStop(0.5, 'rgba(120, 60, 200, 0.18)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(voidBody.x - voidBody.r * 4, voidBody.y - voidBody.r * 4, voidBody.r * 8, voidBody.r * 8);
    ctx.save();
    ctx.translate(voidBody.x, voidBody.y);
    ctx.rotate(time * 0.9);
    ctx.strokeStyle = 'rgba(220, 180, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, voidBody.r * 1.9 * pulse, voidBody.r * 0.55 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(voidBody.x, voidBody.y, voidBody.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 160, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawGate(gate, time) {
    const pulse = 1 + 0.06 * Math.sin(time * 3);
    const glow = ctx.createRadialGradient(gate.x, gate.y, 0, gate.x, gate.y, gate.r * 2.4);
    glow.addColorStop(0, PALETTE.gateGlow);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(gate.x - gate.r * 2.4, gate.y - gate.r * 2.4, gate.r * 4.8, gate.r * 4.8);
    ctx.save();
    ctx.translate(gate.x, gate.y);
    ctx.rotate(time * 0.7);
    ctx.strokeStyle = PALETTE.gate;
    ctx.lineWidth = 5;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, gate.r * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.fillStyle = 'rgba(125, 255, 178, 0.16)';
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, gate.r * 0.8 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.gate;
    ctx.font = FONT_HUD;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GATE', gate.x, gate.y);
  }

  function drawShard(shard, time) {
    if (shard.taken) return;
    const pulse = 1 + 0.15 * Math.sin(time * 4 + shard.x);
    const glow = ctx.createRadialGradient(shard.x, shard.y, 0, shard.x, shard.y, 34);
    glow.addColorStop(0, PALETTE.shardGlow);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(shard.x - 34, shard.y - 34, 68, 68);
    ctx.fillStyle = PALETTE.shard;
    starShape(ctx, shard.x, shard.y, 15 * pulse, time * 0.8);
    ctx.fill();
    ctx.fillStyle = '#fff7dd';
    starShape(ctx, shard.x, shard.y, 6 * pulse, time * 0.8);
    ctx.fill();
  }

  function drawPad(pad, time) {
    const bob = Math.sin(time * 2) * 2;
    ctx.strokeStyle = PALETTE.pad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pad.x, pad.y + bob, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(142, 203, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(pad.x, pad.y + bob, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.pad;
    ctx.font = '700 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LAUNCH', pad.x, pad.y + bob + 46);
  }

  function drawComet(flight, trail) {
    if (trail.length > 1) {
      ctx.strokeStyle = PALETTE.trail;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let index = 1; index < trail.length; index += 1) ctx.lineTo(trail[index].x, trail[index].y);
      ctx.stroke();
    }
    const glow = ctx.createRadialGradient(flight.x, flight.y, 0, flight.x, flight.y, 26);
    glow.addColorStop(0, 'rgba(174, 243, 255, 0.9)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(flight.x - 26, flight.y - 26, 52, 52);
    ctx.fillStyle = PALETTE.cometCore;
    ctx.beginPath();
    ctx.arc(flight.x, flight.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.comet;
    ctx.beginPath();
    ctx.arc(flight.x, flight.y, 11, 0, Math.PI * 2);
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawAim(aim) {
    if (!aim.active || aim.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3;
    ctx.setLineDash([2, 12]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(aim.points[0].x, aim.points[0].y);
    for (let index = 1; index < aim.points.length; index += 1) ctx.lineTo(aim.points[index].x, aim.points[index].y);
    ctx.stroke();
    ctx.restore();
    const end = aim.points[aim.points.length - 1];
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
    ctx.fill();
    // Power meter beside the pad.
    const pad = aim.pad;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(pad.x - 60, pad.y + 64, 120, 10);
    ctx.fillStyle = aim.power > 0.85 ? PALETTE.danger : PALETTE.comet;
    ctx.fillRect(pad.x - 60, pad.y + 64, 120 * aim.power, 10);
  }

  function drawHud(state) {
    ctx.fillStyle = 'rgba(5, 8, 22, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, 52);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = FONT_HUD;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LEVEL ${state.levelIndex + 1}/8 · ${state.level.name.toUpperCase()}`, 20, 27);
    ctx.textAlign = 'center';
    let comets = 'COMETS ';
    for (let index = 0; index < state.cometsLeft; index += 1) comets += '● ';
    for (let index = state.cometsLeft; index < 3; index += 1) comets += '○ ';
    ctx.fillText(comets, FIELD.width / 2 - 40, 27);
    ctx.fillStyle = PALETTE.shard;
    ctx.fillText(`◆ ${state.shardsGot}/${state.level.shards.length}`, FIELD.width / 2 + 170, 27);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.hud;
    ctx.fillText(`SCORE ${state.score}   BEST ${state.best}`, FIELD.width - 20, 27);
    if (state.hint && state.screen === SCREEN_PLAY) {
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.hudDim;
      ctx.font = FONT_BODY;
      ctx.fillText(state.hint, FIELD.width / 2, FIELD.height - 24);
    }
  }

  function drawPanel(x, y, width, height) {
    ctx.fillStyle = PALETTE.panel;
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 18);
    ctx.fill();
    ctx.stroke();
  }

  function drawCentred(text, y, font, colour) {
    ctx.font = font;
    ctx.fillStyle = colour;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, FIELD.width / 2, y);
  }

  function drawTitle(state) {
    drawCentred('COMET COURIER', 210, FONT_TITLE, '#ffffff');
    drawCentred('Slingshot your comet around the worlds. Gather the shards. Reach the gate.', 285, FONT_SUB, PALETTE.hud);
    drawCentred('Every launch counts — you carry only three comets per route.', 322, FONT_SUB, PALETTE.hudDim);
    drawPanel(FIELD.width / 2 - 330, 380, 660, 190);
    drawCentred('HOW TO PLAY', 415, FONT_HUD, PALETTE.comet);
    drawCentred('Drag from the comet to aim — release to launch', 455, FONT_BODY, PALETTE.hud);
    drawCentred('Gravity bends your flight · shards are worth 100 · the gate ends the route', 490, FONT_BODY, PALETTE.hud);
    drawCentred('R restart route · P pause · M sound', 528, FONT_BODY, PALETTE.hudDim);
    const blink = 0.55 + 0.45 * Math.sin(state.time * 3);
    ctx.globalAlpha = blink;
    drawCentred('CLICK OR PRESS ENTER TO START', 640, FONT_HUD, PALETTE.shard);
    ctx.globalAlpha = 1;
    if (state.best > 0) drawCentred(`BEST SCORE  ${state.best}`, 690, FONT_BODY, PALETTE.hudDim);
  }

  function drawStars(count, y) {
    ctx.font = '44px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let index = 0; index < 3; index += 1) {
      ctx.fillStyle = index < count ? PALETTE.shard : 'rgba(255, 255, 255, 0.22)';
      ctx.fillText('★', FIELD.width / 2 + (index - 1) * 64, y);
    }
  }

  function drawClear(state) {
    drawPanel(FIELD.width / 2 - 340, 190, 680, 380);
    drawCentred('ROUTE CLEAR!', 260, FONT_HEADING, PALETTE.gate);
    drawStars(state.clearStars, 330);
    drawCentred(`Shards  ${state.shardsGot}/${state.level.shards.length}  ·  +${state.shardsGot * 100}`, 395, FONT_BODY, PALETTE.hud);
    drawCentred(`Route bonus  +${state.clearBonus}`, 432, FONT_BODY, PALETTE.hud);
    drawCentred(`SCORE  ${state.score}`, 480, FONT_HUD, '#ffffff');
    const blink = 0.55 + 0.45 * Math.sin(state.time * 3);
    ctx.globalAlpha = blink;
    drawCentred(state.levelIndex + 1 < 8 ? 'PRESS N OR CLICK FOR THE NEXT ROUTE' : 'PRESS ENTER FOR THE FINAL TALLY', 535, FONT_HUD, PALETTE.shard);
    ctx.globalAlpha = 1;
  }

  function drawOver(state) {
    drawPanel(FIELD.width / 2 - 340, 200, 680, 340);
    drawCentred('OUT OF COMETS', 270, FONT_HEADING, PALETTE.danger);
    drawCentred('The courier is stranded — the shards stay where they fell.', 335, FONT_BODY, PALETTE.hud);
    drawCentred(`You reached route ${state.levelIndex + 1} of 8`, 380, FONT_BODY, PALETTE.hud);
    drawCentred(`SCORE  ${state.score}   ·   BEST  ${state.best}`, 435, FONT_HUD, '#ffffff');
    const blink = 0.55 + 0.45 * Math.sin(state.time * 3);
    ctx.globalAlpha = blink;
    drawCentred('PRESS R OR CLICK TO TRY AGAIN', 505, FONT_HUD, PALETTE.shard);
    ctx.globalAlpha = 1;
  }

  function drawVictory(state) {
    drawPanel(FIELD.width / 2 - 360, 170, 720, 420);
    drawCentred('ALL DELIVERIES MADE!', 240, FONT_HEADING, PALETTE.shard);
    drawCentred('Eight routes, eight gates — the courier never missed a sunset.', 305, FONT_BODY, PALETTE.hud);
    drawCentred(`FINAL SCORE  ${state.score}`, 375, FONT_HUD, '#ffffff');
    drawCentred(`BEST  ${state.best}`, 420, FONT_BODY, PALETTE.hudDim);
    const blink = 0.55 + 0.45 * Math.sin(state.time * 3);
    ctx.globalAlpha = blink;
    drawCentred('PRESS R OR CLICK TO FLY AGAIN', 520, FONT_HUD, PALETTE.shard);
    ctx.globalAlpha = 1;
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(4, 6, 18, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    drawPanel(FIELD.width / 2 - 260, 300, 520, 170);
    drawCentred('PAUSED', 355, FONT_HEADING, '#ffffff');
    drawCentred('Press P or click to keep flying', 415, FONT_BODY, PALETTE.hud);
  }

  /** Paint one frame of `state`. The world is always drawn behind the menus. */
  function draw(state) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawBackground(state.time);
    const level = state.level;
    for (const planet of level.planets) drawPlanet(planet, state.levelTime);
    for (const voidBody of level.voids) drawVoid(voidBody, state.levelTime);
    drawGate(level.gate, state.time);
    for (const shard of level.shards) drawShard(shard, state.time);
    if (state.screen === SCREEN_TITLE || (state.screen === SCREEN_PLAY && state.flight === null)) {
      drawPad(level.pad, state.time);
    }
    if (state.flight !== null) drawComet(state.flight, state.trail);
    if (state.screen === SCREEN_PLAY) drawAim(state.aim);
    if (state.screen !== SCREEN_TITLE) drawHud(state);
    if (state.screen === SCREEN_TITLE) drawTitle(state);
    if (state.screen === SCREEN_CLEAR) drawClear(state);
    if (state.screen === SCREEN_OVER) drawOver(state);
    if (state.screen === SCREEN_VICTORY) drawVictory(state);
    if (state.screen === SCREEN_PAUSED) drawPaused();
    if (state.muted) {
      ctx.fillStyle = PALETTE.hudDim;
      ctx.font = FONT_BODY;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('MUTED', FIELD.width - 20, FIELD.height - 24);
    }
  }

  return { draw };
}
