/**
 * The Daily Case: one shared, deterministic round per calendar day. Everyone
 * who opens the game on the same local date gets the same ten passages in the
 * same order (given the same bank), so scores are comparable and shareable —
 * the Wordle loop. Practice rounds use a random seed instead.
 */

/** Launch date — Case #1. */
export const DAILY_EPOCH = "2026-07-12";

const DAY_MS = 86_400_000;

/** Today's date in the player's local timezone, as YYYY-MM-DD. */
export function localDateStr(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string to a UTC-noon Date (DST-safe day arithmetic). */
function atNoonUtc(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00Z`);
}

/** Case number for a local date: days since launch + 1. Minimum 1. */
export function caseNumber(dateStr: string): number {
  const days = Math.round((atNoonUtc(dateStr).getTime() - atNoonUtc(DAILY_EPOCH).getTime()) / DAY_MS);
  return Math.max(1, days + 1);
}

/** The local date one day before `dateStr`, as YYYY-MM-DD. */
export function previousDateStr(dateStr: string): string {
  return new Date(atNoonUtc(dateStr).getTime() - DAY_MS).toISOString().slice(0, 10);
}

/**
 * Deterministic 32-bit seed for a date (FNV-1a over a namespaced string), so
 * every player deals the same daily round from the same bank.
 */
export function dailySeed(dateStr: string): number {
  const input = `spot-the-bot:${dateStr}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Milliseconds until the next local midnight — the next case. */
export function msUntilNextCase(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}

/** Format a countdown as H:MM:SS. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
