// The backdrop: a vertical gradient in the region's colours, three parallax
// layers of stars that drift with time, and soft nebula blobs in the
// region's hues. Seeded, so the same seed always paints the same sky — the
// screenshots depend on it.
import { FIELD } from './config.js';
import { createRandom } from './random.js';

export function createBackdrop(seed) {
  const random = createRandom(seed);
  const layers = [];
  for (let layer = 0; layer < 3; layer += 1) {
    const stars = [];
    const count = 70 + layer * 50;
    for (let index = 0; index < count; index += 1) {
      stars.push({
        x: random() * FIELD.width,
        y: random() * FIELD.height,
        size: 0.6 + random() * (1.1 + layer * 0.5),
        twinkle: random() * Math.PI * 2,
      });
    }
    layers.push({ stars, drift: 2 + layer * 4 });
  }
  const nebulae = [];
  for (let index = 0; index < 5; index += 1) {
    nebulae.push({
      x: random() * FIELD.width,
      y: random() * FIELD.height,
      radius: 140 + random() * 220,
      hue: 0, // filled per region at draw time
      alpha: 0.05 + random() * 0.05,
    });
  }
  return { layers, nebulae };
}

/** Paint the sky for `region` at `time` seconds. */
export function drawBackdrop(ctx, backdrop, region, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  gradient.addColorStop(0, region.spaceTop);
  gradient.addColorStop(1, region.spaceBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  for (let index = 0; index < backdrop.nebulae.length; index += 1) {
    const nebula = backdrop.nebulae[index];
    const hue = region.nebula[index % region.nebula.length];
    const radial = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
    radial.addColorStop(0, `hsla(${hue}, 70%, 55%, ${nebula.alpha})`);
    radial.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const layer of backdrop.layers) {
    for (const star of layer.stars) {
      const x = (((star.x + time * layer.drift) % FIELD.width) + FIELD.width) % FIELD.width;
      const alpha = 0.45 + 0.55 * Math.abs(Math.sin(time * 0.8 + star.twinkle));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#e8ecff';
      ctx.beginPath();
      ctx.arc(x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
