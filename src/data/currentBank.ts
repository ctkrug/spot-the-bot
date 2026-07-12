import type { PassageBank } from "../types/passage";
import { loadBank } from "../game/bank";
import { pickLatestBankKey } from "./selectBank";
import seedBankRaw from "./seed-bank.json";

/**
 * Resolve the bank the app should play: the most recent dated file among the
 * given modules, falling back to the seed bank when no dated module exists or
 * the resolved bank loads with too few valid passages (the game must never
 * ship blank). Kept pure and exported so it's testable without needing to
 * mock Vite's import.meta.glob.
 */
export function resolveBank(
  bankModules: Record<string, { default: unknown } | undefined>,
  seedBank: unknown,
  warn: (message: string) => void = console.warn,
): PassageBank {
  const latestKey = pickLatestBankKey(Object.keys(bankModules));
  const raw = latestKey && bankModules[latestKey] ? bankModules[latestKey].default : seedBank;
  const bank = loadBank(raw, warn);
  if (bank.passages.length < 2) {
    return loadBank(seedBank, warn);
  }
  return bank;
}

/**
 * Every dated weekly bank, inlined at build time via import.meta.glob so
 * resolution is static and needs no network.
 */
const bankModules = import.meta.glob<{ default: unknown }>("./banks/*.json", { eager: true });

/** The active bank, validated. */
export function getCurrentBank(): PassageBank {
  return resolveBank(bankModules, seedBankRaw);
}
