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
