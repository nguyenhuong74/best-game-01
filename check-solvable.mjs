// Solvability check: for each of the 20 routes, search the launch space for
// a flight that reaches the gate. Reports the best launch's shards and time,
// or UNSOLVABLE. Run with: node check-solvable.mjs (from the entry root).
import { LEVELS, freshLevel, totalShards, totalStars } from './game/src/levels.js';
import { findLaunch } from './game/src/physics.js';

console.log(`routes: ${LEVELS.length}, shards total: ${totalShards()}, stars total: ${totalStars()}`);
let unsolvable = 0;
for (let index = 0; index < LEVELS.length; index += 1) {
  const level = freshLevel(index);
  const launch = findLaunch(level, 1);
  if (launch === null) {
    console.log(`${String(index + 1).padStart(2)} ${LEVELS[index].name}: UNSOLVABLE`);
    unsolvable += 1;
  } else {
    console.log(
      `${String(index + 1).padStart(2)} ${LEVELS[index].name}: ok, ${launch.shards}/${level.shards.length} shards, ${launch.time.toFixed(1)}s, speed ${Math.hypot(launch.vx, launch.vy).toFixed(0)}`,
    );
  }
}
console.log(unsolvable === 0 ? 'ALL ROUTES SOLVABLE' : `${unsolvable} UNSOLVABLE ROUTES`);
process.exit(unsolvable === 0 ? 0 : 1);
