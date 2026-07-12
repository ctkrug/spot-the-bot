import type { PassageBank } from "../types/passage";
import { loadBank } from "../game/bank";
import { pickLatestBankKey } from "./selectBank";
import seedBankRaw from "./seed-bank.json";

/**
 * Resolve the bank the app should play: the most recent dated file in
 * ./banks/, falling back to the committed seed bank when no valid weekly bank
 * exists. Vite inlines every matched JSON at build time via import.meta.glob,
 * so the resolution is static and needs no network.
 */
const bankModules = import.meta.glob<{ default: unknown }>("./banks/*.json", { eager: true });

function resolveRawBank(): unknown {
  const latestKey = pickLatestBankKey(Object.keys(bankModules));
  if (latestKey && bankModules[latestKey]) {
    return bankModules[latestKey].default;
  }
  return seedBankRaw;
}

/**
 * The active bank, validated. If the newest weekly bank somehow loads with too
 * few valid passages, fall back to the seed so the game is never blank.
 */
export function getCurrentBank(): PassageBank {
  const bank = loadBank(resolveRawBank());
  if (bank.passages.length < 2) {
    return loadBank(seedBankRaw);
  }
  return bank;
}
