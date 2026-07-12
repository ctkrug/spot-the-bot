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
  now?: string,
): PassageBank {
  const latestKey = pickLatestBankKey(Object.keys(bankModules), now);
  const raw = latestKey && bankModules[latestKey] ? bankModules[latestKey].default : seedBank;
  let bank: PassageBank;
  try {
    bank = loadBank(raw, warn);
  } catch (err) {
    warn(`Spot the Bot: latest bank is unreadable (${(err as Error).message}), using seed`);
    return loadBank(seedBank, warn);
  }
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

/** The active bank, validated. Never a bank dated later than today's build. */
export function getCurrentBank(): PassageBank {
  const today = new Date().toISOString().slice(0, 10);
  return resolveBank(bankModules, seedBankRaw, console.warn, today);
}
