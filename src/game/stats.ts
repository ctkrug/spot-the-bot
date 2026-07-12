import { readNumber, writeNumber } from "../lib/storage";

/** Minimum score (out of a full round) that keeps a streak alive. */
export const STREAK_THRESHOLD = 8;

/** Persisted player stats across rounds. */
export interface Stats {
  bestScore: number;
  streak: number;
  plays: number;
}

export const EMPTY_STATS: Stats = { bestScore: 0, streak: 0, plays: 0 };

/**
 * Fold a finished round's score into the running stats. A round scoring at or
 * above STREAK_THRESHOLD extends the streak; anything below resets it to zero.
 * Pure — takes and returns plain data so it's trivially testable.
 */
export function recordRound(prev: Stats, score: number, threshold = STREAK_THRESHOLD): Stats {
  return {
    bestScore: Math.max(prev.bestScore, score),
    streak: score >= threshold ? prev.streak + 1 : 0,
    plays: prev.plays + 1,
  };
}

const KEY_BEST = "stb.bestScore";
const KEY_STREAK = "stb.streak";
const KEY_PLAYS = "stb.plays";

/** Load stats from localStorage, falling back to zeros. */
export function loadStats(): Stats {
  return {
    bestScore: readNumber(KEY_BEST, 0),
    streak: readNumber(KEY_STREAK, 0),
    plays: readNumber(KEY_PLAYS, 0),
  };
}

/** Persist stats to localStorage (no-ops safely if storage is unavailable). */
export function saveStats(stats: Stats): void {
  writeNumber(KEY_BEST, stats.bestScore);
  writeNumber(KEY_STREAK, stats.streak);
  writeNumber(KEY_PLAYS, stats.plays);
}
