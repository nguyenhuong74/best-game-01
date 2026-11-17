// Particles: the sparkle when a shard is gathered, the burst when a comet
// crashes, the swirl when it reaches the gate, the shimmer of a warp. One
// pool, capped, updated in the loop and drawn under the comet; a burst that
// runs past its life is dropped, never kept.
const MAX_PARTICLES = 400;

export function createParticles() {
  const list = [];

  function spawn(x, y, vx, vy, life, size, color) {
    if (list.length >= MAX_PARTICLES) list.splice(0, list.length - MAX_PARTICLES + 1);
    list.push({ x, y, vx, vy, life, maxLife: life, size, color });
  }

  return {
    /** A ring of sparks flying out from a point. */
    burst(x, y, color, count = 18, speed = 180) {
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2 + Math.random() * 0.4;
        const power = speed * (0.4 + Math.random() * 0.8);
        spawn(x, y, Math.cos(angle) * power, Math.sin(angle) * power, 0.5 + Math.random() * 0.4, 2 + Math.random() * 3, color);
      }
    },
    /** A soft puff that rises and fades, for warps and shields. */
    puff(x, y, color, count = 10) {
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const power = 30 + Math.random() * 70;
        spawn(x, y, Math.cos(angle) * power, Math.sin(angle) * power - 20, 0.6 + Math.random() * 0.5, 3 + Math.random() * 4, color);
      }
    },
    /** One ember of a comet's trail, fading fast. */
    ember(x, y, color) {
      spawn(x, y, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 0.35, 2.5, color);
    },
    update(dt) {
      for (let index = list.length - 1; index >= 0; index -= 1) {
        const particle = list[index];
        particle.life -= dt;
        if (particle.life <= 0) {
          list.splice(index, 1);
          continue;
        }
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      }
    },
    draw(ctx) {
      for (const particle of list) {
        const alpha = Math.max(0, particle.life / particle.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    clear() {
      list.length = 0;
    },
  };
}
