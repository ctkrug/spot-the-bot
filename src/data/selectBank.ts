/**
 * Bank-selection logic, kept pure so it's testable without the filesystem or
 * Vite's import glob. Bank files are named by ISO date (e.g. "2026-07-06.json")
 * and the app plays the most recent one, never a hardcoded filename.
 */

const DATE_RE = /(\d{4}-\d{2}-\d{2})\.json$/;

/** Extract the YYYY-MM-DD date embedded in a bank filename/path, or null. */
export function bankDate(pathOrName: string): string | null {
  const m = DATE_RE.exec(pathOrName);
  return m ? m[1] : null;
}

/**
 * Given bank file keys (paths or names), return the key with the newest ISO
 * date. Keys without a parseable date are ignored. Returns null if none match.
 * ISO dates sort lexicographically, so a string compare is date order.
 */
export function pickLatestBankKey(keys: readonly string[]): string | null {
  let best: string | null = null;
  let bestDate = "";
  for (const key of keys) {
    const date = bankDate(key);
    if (date === null) continue;
    if (best === null || date > bestDate) {
      best = key;
      bestDate = date;
    }
  }
  return best;
}
