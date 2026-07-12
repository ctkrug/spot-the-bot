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
 * Assemble AI-origin passages from the content pool, stamping each with a
 * topical model. In a live pipeline these strings would come from prompting
 * that model; here they come from the pool. Round-robins the topical models
 * so the week's bank features whichever models are current.
 */
export function buildAiPassages(pool, models) {
  return pool.map((p, i) => ({ ...p, origin: "ai", model: models[i % models.length] }));
}

export function buildHumanPassages(pool) {
  return pool.map((p) => ({ ...p, origin: "human" }));
}

/** Parse CLI args; throws on an unknown flag so the caller can fail loudly. */
export function parseArgs(argv) {
  const args = { force: false, week: null };
  for (const a of argv) {
    if (a === "--force") args.force = true;
    else if (a.startsWith("--week=")) args.week = a.slice("--week=".length);
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}
