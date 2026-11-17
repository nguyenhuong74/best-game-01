// The play-field renderer: everything on the field during a route — wind
// zones, wormholes, planets and voids, mines, shards, pickups, the gate, the
// pad, the comet with its trail, and the dotted aim preview. Screens and the
// HUD live in their own files; this one paints the world.
import { FIELD, PALETTE } from './config.js';
import { drawBackdrop } from './backdrop.js';
import { gateOpenAt, minePosition, planetPosition } from './physics.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_MAP = 'map';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_FAILED = 'failed';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawPlanet(planet, time) {
    const position = planetPosition(planet, time);
    const gradient = ctx.createRadialGradient(
      position.x - planet.r * 0.35, position.y - planet.r * 0.35, planet.r * 0.1,
      position.x, position.y, planet.r,
    );
    gradient.addColorStop(0, `hsl(${planet.hue}, 65%, 62%)`);
    gradient.addColorStop(0.6, `hsl(${planet.hue}, 55%, 38%)`);
    gradient.addColorStop(1, `hsl(${planet.hue}, 60%, 20%)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // A darker cap on the night side, so the world reads as a sphere.
    ctx.fillStyle = 'rgba(0, 0, 10, 0.25)';
    ctx.beginPath();
    ctx.arc(position.x + planet.r * 0.3, position.y + planet.r * 0.3, planet.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    if (planet.ring) {
      ctx.strokeStyle = `hsla(${planet.hue}, 70%, 75%, 0.8)`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(position.x, position.y, planet.r * 1.6, planet.r * 0.45, -0.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawVoid(voidBody, time) {
    const glow = ctx.createRadialGradient(voidBody.x, voidBody.y, 0, voidBody.x, voidBody.y, voidBody.r * 2.4);
    glow.addColorStop(0, 'rgba(180, 120, 255, 0.55)');
    glow.addColorStop(0.5, 'rgba(120, 60, 220, 0.18)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(voidBody.x, voidBody.y, voidBody.r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#050208';
    ctx.beginPath();
    ctx.arc(voidBody.x, voidBody.y, voidBody.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c792ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(voidBody.x, voidBody.y, voidBody.r * 1.7, voidBody.r * 0.6, time * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawWormhole(hole, time) {
    for (const mouth of [hole.a, hole.b]) {
      const pulse = 1 + 0.08 * Math.sin(time * 3);
      const glow = ctx.createRadialGradient(mouth.x, mouth.y, 0, mouth.x, mouth.y, hole.r * 1.8);
      glow.addColorStop(0, 'rgba(199, 146, 255, 0.7)');
      glow.addColorStop(0.5, 'rgba(150, 90, 255, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(mouth.x, mouth.y, hole.r * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.wormhole;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(mouth.x, mouth.y, hole.r * pulse, time * 1.5, time * 1.5 + Math.PI * 1.5);
      ctx.stroke();
      ctx.fillStyle = '#1a0b2e';
      ctx.beginPath();
      ctx.arc(mouth.x, mouth.y, hole.r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWind(wind, time) {
    ctx.fillStyle = PALETTE.wind;
    ctx.fillRect(wind.x, wind.y, wind.w, wind.h);
    ctx.strokeStyle = 'rgba(140, 220, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wind.x, wind.y, wind.w, wind.h);
    // Flowing chevrons show the push direction.
    const speed = Math.hypot(wind.ax, wind.ay) || 1;
    const ux = wind.ax / speed;
    const uy = wind.ay / speed;
    ctx.strokeStyle = 'rgba(174, 243, 255, 0.6)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const baseX = wind.x + wind.w * (0.2 + col * 0.3);
        const baseY = wind.y + wind.h * (0.3 + row * 0.4);
        const slide = ((time * 60 + col * 40 + row * 70) % 60) - 30;
        const x = baseX + ux * slide;
        const y = baseY + uy * slide;
        ctx.beginPath();
        ctx.moveTo(x - ux * 10 - uy * 6, y - uy * 10 + ux * 6);
        ctx.lineTo(x, y);
        ctx.lineTo(x - ux * 10 + uy * 6, y - uy * 10 - ux * 6);
        ctx.stroke();
      }
    }
  }

  function drawMine(mine, time) {
    const position = minePosition(mine, time);
    const blink = 0.6 + 0.4 * Math.sin(time * 5);
    ctx.fillStyle = `rgba(255, 159, 67, ${0.25 * blink})`;
    ctx.beginPath();
    ctx.arc(position.x, position.y, mine.r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b1a08';
    ctx.beginPath();
    ctx.arc(position.x, position.y, mine.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.mine;
    ctx.lineWidth = 2;
    for (let spike = 0; spike < 8; spike += 1) {
      const angle = (spike / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(position.x + Math.cos(angle) * mine.r * 0.7, position.y + Math.sin(angle) * mine.r * 0.7);
      ctx.lineTo(position.x + Math.cos(angle) * mine.r * 1.25, position.y + Math.sin(angle) * mine.r * 1.25);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255, 80, 80, ${blink})`;
    ctx.beginPath();
    ctx.arc(position.x, position.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawShard(shard, time) {
    const bob = Math.sin(time * 2 + shard.x * 0.01) * 3;
    const glow = ctx.createRadialGradient(shard.x, shard.y + bob, 0, shard.x, shard.y + bob, 26);
    glow.addColorStop(0, PALETTE.shardGlow);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(shard.x, shard.y + bob, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.shard;
    ctx.save();
    ctx.translate(shard.x, shard.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
    ctx.fillStyle = '#fff6d8';
    ctx.save();
    ctx.translate(shard.x, shard.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-2.5, -2.5, 5, 5);
    ctx.restore();
  }

  function drawPickup(pickup, time) {
    const bob = Math.sin(time * 2.4 + pickup.x * 0.02) * 4;
    const color = pickup.kind === 'shield' ? PALETTE.pickupShield : PALETTE.pickupComet;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y + bob, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pickup.kind === 'shield' ? 'S' : '+1', pickup.x, pickup.y + bob + 1);
  }

  function drawGate(gate, time) {
    const open = gateOpenAt(gate, time);
    const color = open ? PALETTE.gate : PALETTE.gateClosed;
    const glowColor = open ? PALETTE.gateGlow : 'rgba(255, 138, 122, 0.4)';
    const pulse = open ? 1 + 0.06 * Math.sin(time * 4) : 1;
    const glow = ctx.createRadialGradient(gate.x, gate.y, 0, gate.x, gate.y, gate.r * 2);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, gate.r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, gate.r * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, gate.r * 0.6, time * 1.2, time * 1.2 + Math.PI * 1.4);
    ctx.stroke();
    if (gate.flare) {
      // The flare ring shows how long the gate stays open or shut.
      const phase = (time + gate.flare.phase) % gate.flare.period;
      const fraction = open ? phase / gate.flare.open : (phase - gate.flare.open) / (gate.flare.period - gate.flare.open);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(gate.x, gate.y, gate.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - fraction));
      ctx.stroke();
    }
  }

  function drawPad(level, time) {
    const pad = level.pad;
    ctx.strokeStyle = PALETTE.pad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pad.x, pad.y, 22 + 3 * Math.sin(time * 2), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(142, 203, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(pad.x, pad.y, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawComet(x, y, shield, time) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
    glow.addColorStop(0, 'rgba(174, 243, 255, 0.8)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.cometCore;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.comet;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
    if (shield) {
      ctx.strokeStyle = PALETTE.pickupShield;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(x, y, 20 + 2 * Math.sin(time * 5), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  return {
    /** Paint the whole field for the current game state. */
    drawField(game, backdrop, region) {
      ctx.save();
      if (game.shake > 0) {
        ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
      }
      const time = game.time;
      drawBackdrop(ctx, backdrop, region, time);
      const level = game.level;
      for (const wind of level.winds) drawWind(wind, time);
      for (const hole of level.wormholes) drawWormhole(hole, time);
      for (const planet of level.planets) drawPlanet(planet, game.levelTime);
      for (const voidBody of level.voids) drawVoid(voidBody, time);
      for (const mine of level.mines) drawMine(mine, game.levelTime);
      drawGate(level.gate, game.levelTime);
      drawPad(level, time);
      for (let index = 0; index < level.shards.length; index += 1) {
        if (!level.shards[index].taken) drawShard(level.shards[index], time);
      }
      for (const pickup of level.pickups) {
        if (!pickup.taken) drawPickup(pickup, time);
      }
      // The dotted aim preview, then the flight trail, then the comet itself.
      if (game.aim.active && game.aim.points.length > 1) {
        ctx.fillStyle = 'rgba(223, 230, 255, 0.75)';
        for (let index = 0; index < game.aim.points.length; index += 3) {
          const point = game.aim.points[index];
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (game.trail.length > 1) {
        ctx.strokeStyle = PALETTE.trail;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(game.trail[0].x, game.trail[0].y);
        for (let index = 1; index < game.trail.length; index += 1) ctx.lineTo(game.trail[index].x, game.trail[index].y);
        ctx.stroke();
      }
      game.particles.draw(ctx);
      if (game.flight !== null) {
        drawComet(game.flight.x, game.flight.y, game.flight.shield, time);
      } else if (game.screen === SCREEN_PLAY || game.screen === SCREEN_PAUSED) {
        drawComet(level.pad.x, level.pad.y, game.shieldArmed, time);
      }
      ctx.restore();
    },
    /** Paint the backdrop alone, for the title and map screens. */
    drawSky(backdrop, region, time) {
      drawBackdrop(ctx, backdrop, region, time);
    },
    context() {
      return ctx;
    },
  };
}
