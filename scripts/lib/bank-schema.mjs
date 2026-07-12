// Shared bank/passage schema validation for the content pipeline. Plain ESM so
// it runs under Node with no build step. Mirrors the rules enforced in
// src/game/bank.ts (isValidPassage) — kept in sync deliberately.

const ORIGINS = ["human", "ai"];

/** Validate one passage. Returns an array of human-readable error strings. */
export function validatePassage(p, index) {
  const at = `passage[${index}]`;
  const errors = [];
  if (typeof p !== "object" || p === null) {
    return [`${at} is not an object`];
  }
  if (typeof p.id !== "string" || p.id.length === 0) errors.push(`${at}.id missing`);
  if (typeof p.text !== "string" || p.text.trim().length === 0) errors.push(`${at}.text missing`);
  if (typeof p.style !== "string" || p.style.length === 0) errors.push(`${at}.style missing`);
  if (!ORIGINS.includes(p.origin)) errors.push(`${at}.origin must be human|ai`);
  if (p.origin === "ai" && (typeof p.model !== "string" || p.model.length === 0)) {
    errors.push(`${at}.model required for ai passages`);
  }
  return errors;
}

/**
 * Validate a whole bank. Returns { errors, validCount, styles }.
 * errors is empty when the bank is fully valid.
 */
export function validateBank(bank) {
  const errors = [];
  if (typeof bank !== "object" || bank === null) {
    return { errors: ["bank is not an object"], validCount: 0, styles: [] };
  }
  if (typeof bank.weekOf !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(bank.weekOf)) {
    errors.push("bank.weekOf must be an ISO date (YYYY-MM-DD)");
  }
  if (!Array.isArray(bank.passages)) {
    errors.push("bank.passages must be an array");
    return { errors, validCount: 0, styles: [] };
  }
  let validCount = 0;
  const styles = new Set();
  bank.passages.forEach((p, i) => {
    const perr = validatePassage(p, i);
    if (perr.length === 0) {
      validCount++;
      styles.add(p.style);
    } else {
      errors.push(...perr);
    }
  });
  return { errors, validCount, styles: [...styles] };
}

/** Minimum valid passages a bank must contain to be publishable. */
export const MIN_PASSAGES = 10;

/** Minimum distinct styles a generated bank must span. */
export const MIN_STYLES = 4;
