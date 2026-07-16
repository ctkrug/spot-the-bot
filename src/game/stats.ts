import { readString, writeString } from "../lib/storage";
import { previousDateStr } from "./daily";
import type { RoundResult } from "./scoring";

/** Minimum score (out of a full round) that keeps the round streak alive. */
export const STREAK_THRESHOLD = 8;

/** Daily-case progress: calendar-day streak of completed dailies. */
export interface DailyStats {
  /** Local date (YYYY-MM-DD) of the last completed daily, or null. */
  lastDate: string | null;
  streak: number;
  best: number;
}

/** Persisted player stats across rounds (v2, JSON blob). */
export interface Stats {
  plays: number;
  bestScore: number;
  /** Consecutive rounds scoring >= STREAK_THRESHOLD (the legacy streak). */
  roundStreak: number;
  /** Count of finished rounds by score, index 0..10. */
  dist: number[];
  fooledByAi: number;
  wronglyAccused: number;
  bestCombo: number;
  daily: DailyStats;
}

export const EMPTY_STATS: Stats = {
  plays: 0,
  bestScore: 0,
  roundStreak: 0,
  dist: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  fooledByAi: 0,
  wronglyAccused: 0,
  bestCombo: 0,
  daily: { lastDate: null, streak: 0, best: 0 },
};

/**
 * Fold a finished round into the running stats. Pure — takes and returns
 * plain data. `dailyDate` is the local date string when the round was the
 * Daily Case (drives the calendar-day streak); null for practice rounds.
 */
export function recordRound(
  prev: Stats,
  result: Pick<RoundResult, "score" | "fooledByAiCount" | "wronglyAccusedCount" | "maxCombo">,
  dailyDate: string | null = null,
  threshold = STREAK_THRESHOLD,
): Stats {
  const dist = prev.dist.slice();
  const bucket = Math.max(0, Math.min(dist.length - 1, result.score));
  dist[bucket] += 1;

  let daily = prev.daily;
  if (dailyDate !== null && prev.daily.lastDate !== dailyDate) {
    const continues = prev.daily.lastDate === previousDateStr(dailyDate);
    const streak = continues ? prev.daily.streak + 1 : 1;
    daily = { lastDate: dailyDate, streak, best: Math.max(prev.daily.best, streak) };
  }

  return {
    plays: prev.plays + 1,
    bestScore: Math.max(prev.bestScore, result.score),
    roundStreak: result.score >= threshold ? prev.roundStreak + 1 : 0,
    dist,
    fooledByAi: prev.fooledByAi + result.fooledByAiCount,
    wronglyAccused: prev.wronglyAccused + result.wronglyAccusedCount,
    bestCombo: Math.max(prev.bestCombo, result.maxCombo),
    daily,
  };
}

const KEY_V2 = "stb.stats.v2";
// Legacy v1 numeric keys, migrated on first load.
const KEY_BEST = "stb.bestScore";
const KEY_STREAK = "stb.streak";
const KEY_PLAYS = "stb.plays";

function readLegacy(): Stats | null {
  const best = Number(readString(KEY_BEST, ""));
  const streak = Number(readString(KEY_STREAK, ""));
  const plays = Number(readString(KEY_PLAYS, ""));
  if (![best, streak, plays].some((n) => Number.isFinite(n) && n > 0)) return null;
  return {
    ...EMPTY_STATS,
    bestScore: Number.isFinite(best) ? best : 0,
    roundStreak: Number.isFinite(streak) ? streak : 0,
    plays: Number.isFinite(plays) ? plays : 0,
  };
}

/** Load stats: v2 blob, else migrated legacy keys, else zeros. */
export function loadStats(): Stats {
  const raw = readString(KEY_V2, "");
  if (raw !== "") {
    try {
      const parsed = JSON.parse(raw) as Partial<Stats>;
      return {
        ...EMPTY_STATS,
        ...parsed,
        dist:
          Array.isArray(parsed.dist) && parsed.dist.length === 11
            ? parsed.dist.map((n) => (Number.isFinite(n) ? Number(n) : 0))
            : EMPTY_STATS.dist.slice(),
        daily: { ...EMPTY_STATS.daily, ...(parsed.daily ?? {}) },
      };
    } catch {
      // Corrupt blob — fall through to legacy/zeros rather than crash.
    }
  }
  return readLegacy() ?? { ...EMPTY_STATS, dist: EMPTY_STATS.dist.slice() };
}

/** Persist stats to localStorage (no-ops safely if storage is unavailable). */
export function saveStats(stats: Stats): void {
  writeString(KEY_V2, JSON.stringify(stats));
}

// ——— Daily-round persistence: today's guesses, so a reload (or a return
// visit) reconstructs the finished case instead of allowing a replay. ———

const KEY_DAILY = "stb.dailyRound.v1";

export interface StoredDailyRound {
  date: string;
  guesses: ("human" | "ai")[];
  /** Passage ids the guesses were cast against — a redeploy can change the
   * day's deal, and replaying stored guesses onto different passages would
   * fabricate a result. Older records without ids stay accepted. */
  ids?: string[];
}

export function loadDailyRound(date: string): StoredDailyRound | null {
  const raw = readString(KEY_DAILY, "");
  if (raw === "") return null;
  try {
    const parsed = JSON.parse(raw) as StoredDailyRound;
    if (parsed.date !== date || !Array.isArray(parsed.guesses)) return null;
    if (!parsed.guesses.every((g) => g === "human" || g === "ai")) return null;
    if (parsed.ids !== undefined && !Array.isArray(parsed.ids)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDailyRound(round: StoredDailyRound): void {
  writeString(KEY_DAILY, JSON.stringify(round));
}
