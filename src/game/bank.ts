import type { Passage, PassageBank } from "../types/passage";
import { shuffle, type Rng } from "./rng";

/** Number of passages dealt into a single round. */
export const ROUND_SIZE = 10;

/**
 * Type guard: a raw JSON value is a well-formed Passage. Guards the input
 * boundary so malformed generated content never reaches the game loop.
 */
export function isValidPassage(value: unknown): value is Passage {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  if (typeof p.id !== "string" || p.id.length === 0) return false;
  if (typeof p.text !== "string" || p.text.trim().length === 0) return false;
  if (typeof p.style !== "string" || p.style.length === 0) return false;
  if (p.origin !== "human" && p.origin !== "ai") return false;
  // AI passages must name a model; human passages must not claim one.
  if (p.origin === "ai" && (typeof p.model !== "string" || p.model.length === 0)) {
    return false;
  }
  return true;
}

/**
 * Filter a raw passage list to the valid entries, warning (not throwing) on
 * each dropped entry so a single bad record can't blank the whole game.
 */
export function sanitizePassages(
  raw: readonly unknown[],
  warn: (message: string) => void = console.warn,
): Passage[] {
  const valid: Passage[] = [];
  raw.forEach((entry, index) => {
    if (isValidPassage(entry)) {
      valid.push(entry);
    } else {
      warn(`Spot the Bot: dropping malformed passage at index ${index}`);
    }
  });
  return valid;
}

/**
 * Load and validate a raw bank object. Returns a bank whose passages are all
 * valid. Throws only when the top-level shape is unusable (not an object /
 * missing a passages array) — that's a build error, not runtime input.
 */
export function loadBank(
  raw: unknown,
  warn: (message: string) => void = console.warn,
): PassageBank {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Spot the Bot: bank is not an object");
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.passages)) {
    throw new Error("Spot the Bot: bank.passages is not an array");
  }
  const weekOf = typeof obj.weekOf === "string" ? obj.weekOf : "unknown";
  return { weekOf, passages: sanitizePassages(obj.passages, warn) };
}

/**
 * Deal a round of up to ROUND_SIZE passages, shuffled with the given Rng.
 * Draws without replacement; if the bank holds fewer than ROUND_SIZE valid
 * passages, the round is as long as the bank allows (never repeats).
 */
export function dealRound(
  bank: PassageBank,
  rng: Rng,
  size: number = ROUND_SIZE,
): Passage[] {
  const take = Math.max(0, Math.min(size, bank.passages.length));
  return shuffle(bank.passages, rng).slice(0, take);
}

type OriginKey = "h" | "a";
type Tier = 1 | 2 | 3;
type Pref = [OriginKey, Tier];

/** Preference chain per slot kind: first non-empty bucket wins. */
const CHAINS: Record<string, Pref[]> = {
  a1: [["a", 1], ["a", 2], ["h", 1], ["a", 3], ["h", 2], ["h", 3]],
  h1: [["h", 1], ["h", 2], ["a", 1], ["h", 3], ["a", 2], ["a", 3]],
  a2: [["a", 2], ["a", 1], ["a", 3], ["h", 2], ["h", 1], ["h", 3]],
  h2: [["h", 2], ["h", 1], ["h", 3], ["a", 2], ["a", 1], ["a", 3]],
  a3: [["a", 3], ["a", 2], ["h", 3], ["h", 2], ["a", 1], ["h", 1]],
  h3: [["h", 3], ["h", 2], ["a", 3], ["a", 2], ["h", 1], ["a", 1]],
  /** The closer: the machine's best work, whatever it takes. */
  finale: [["a", 3], ["a", 2], ["a", 1], ["h", 3], ["h", 2], ["h", 1]],
};

/**
 * Deal a staged round — the difficulty arc IS the game:
 *
 *   1–3  warm-up: mostly the obvious slop tier (plus one loud human voice)
 *   4–7  field work: the plausible middle, half and half
 *   8–9  expert tier: the hard fakes and the hard humans
 *   10   the finale: always the machine's most human-sounding work
 *
 * Every group is shuffled internally so positions don't leak answers within
 * a stage. Deterministic for a given bank + rng seed (the shared Daily Case).
 * Buckets degrade gracefully via preference chains when a tier runs short.
 */
export function dealStaged(
  bank: PassageBank,
  rng: Rng,
  size: number = ROUND_SIZE,
): Passage[] {
  const pools: Record<OriginKey, Record<Tier, Passage[]>> = {
    h: { 1: [], 2: [], 3: [] },
    a: { 1: [], 2: [], 3: [] },
  };
  for (const p of bank.passages) {
    const tier = (p.difficulty ?? 2) as Tier;
    pools[p.origin === "human" ? "h" : "a"][tier].push(p);
  }
  for (const o of ["h", "a"] as OriginKey[]) {
    for (const t of [1, 2, 3] as Tier[]) pools[o][t] = shuffle(pools[o][t], rng);
  }

  const pop = (chain: Pref[]): Passage | null => {
    for (const [o, t] of chain) {
      const bucket = pools[o][t];
      if (bucket.length > 0) return bucket.pop()!;
    }
    return null;
  };
  const group = (kinds: string[]): Passage[] =>
    shuffle(kinds.map((k) => pop(CHAINS[k])).filter((p): p is Passage => p !== null), rng);

  const openers = group(["a1", "a1", "h1"]);
  const mid = group(["a2", "a2", "h2", "h2"]);
  const expert = group(["h3", rng() < 0.5 ? "a3" : "h3"]);
  const finale = pop(CHAINS.finale);

  const round = [...openers, ...mid, ...expert];
  // Top up from whatever's left if the bank ran short of the plan.
  const want = Math.max(0, Math.min(size, bank.passages.length)) - (finale ? 1 : 0);
  if (round.length < want) {
    const leftovers = shuffle(
      ([1, 2, 3] as Tier[]).flatMap((t) => [...pools.h[t], ...pools.a[t]]),
      rng,
    );
    round.push(...leftovers.slice(0, want - round.length));
  }
  const trimmed = round.slice(0, want);
  return finale ? [...trimmed, finale] : trimmed;
}
