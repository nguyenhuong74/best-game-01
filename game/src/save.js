// The campaign save: which routes are unlocked, the stars and best shard haul
// per route, the best score and the run history. One JSON object in
// localStorage, read once at boot and written after every clear, heart loss
// and run end. A missing or broken save starts a fresh campaign.
import { SAVE_KEY } from './config.js';
import { LEVELS } from './levels.js';

/** A fresh campaign: only route 0 unlocked, nothing earned yet. */
export function defaultSave() {
  return {
    unlocked: 0,
    stars: {},
    bestShards: {},
    bestScore: 0,
    bestTime: null,
    runs: 0,
    victories: 0,
    muted: false,
  };
}

/** Load the save, or a fresh one when storage is empty, off or corrupt. */
export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaultSave();
    const save = defaultSave();
    if (Number.isInteger(parsed.unlocked)) save.unlocked = Math.max(0, Math.min(LEVELS.length - 1, parsed.unlocked));
    if (parsed.stars && typeof parsed.stars === 'object') save.stars = parsed.stars;
    if (parsed.bestShards && typeof parsed.bestShards === 'object') save.bestShards = parsed.bestShards;
    if (Number.isFinite(parsed.bestScore)) save.bestScore = parsed.bestScore;
    if (Number.isFinite(parsed.bestTime)) save.bestTime = parsed.bestTime;
    if (Number.isInteger(parsed.runs)) save.runs = parsed.runs;
    if (Number.isInteger(parsed.victories)) save.victories = parsed.victories;
    if (typeof parsed.muted === 'boolean') save.muted = parsed.muted;
    return save;
  } catch {
    return defaultSave();
  }
}

/** Persist the save. Storage can be off: the campaign then lasts one visit. */
export function storeSave(save) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Nothing to do: the game plays on without persistence.
  }
}

/** Record a cleared route: its stars, its shard haul and the next unlock. */
export function recordClear(save, routeIndex, stars, shardsGot) {
  const key = String(routeIndex);
  save.stars[key] = Math.max(save.stars[key] || 0, stars);
  save.bestShards[key] = Math.max(save.bestShards[key] || 0, shardsGot);
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length - 1, routeIndex + 1));
  storeSave(save);
}

/** Record a finished run: best score, best victory time, run count. */
export function recordRunEnd(save, score, victoryTime) {
  save.bestScore = Math.max(save.bestScore, score);
  if (victoryTime !== null) {
    save.bestTime = save.bestTime === null ? victoryTime : Math.min(save.bestTime, victoryTime);
    save.victories += 1;
  }
  save.runs += 1;
  storeSave(save);
}
