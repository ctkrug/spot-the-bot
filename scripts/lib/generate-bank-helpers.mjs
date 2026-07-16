// Pure helpers for the weekly bank generator, split out so they're testable
// without touching the filesystem or process.argv/exit.

/** Monday of the ISO week containing `date`, as YYYY-MM-DD. */
export function isoWeekMonday(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // Sunday(0) -> 7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Assemble AI-origin passages from the content pool. Every pool entry must
 * carry its own honest `model` (the model that actually produced the text) —
 * stamping a passage with a model that didn't write it is a labeling bug, so
 * a missing model throws rather than being papered over.
 */
export function buildAiPassages(pool) {
  return pool.map((p) => {
    if (typeof p.model !== "string" || p.model.length === 0) {
      throw new Error(`ai pool entry ${p.id ?? "(no id)"} is missing its model attribution`);
    }
    return { ...p, origin: "ai" };
  });
}

/** Human passages pass through with origin stamped; `source` (attribution) rides along. */
export function buildHumanPassages(pool) {
  return pool.map((p) => ({ ...p, origin: "human" }));
}

/** Parse CLI args; throws on an unknown flag so the caller can fail loudly. */
export function parseArgs(argv) {
  const args = { force: false, week: null, live: false };
  for (const a of argv) {
    if (a === "--force") args.force = true;
    else if (a === "--live") args.live = true;
    else if (a.startsWith("--week=")) args.week = a.slice("--week=".length);
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}
