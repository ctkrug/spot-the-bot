/**
 * Tiny localStorage wrapper that degrades gracefully. Reads/writes are wrapped
 * so a disabled or full storage (private mode, quota) never throws into the
 * app — a failed read returns the fallback, a failed write is swallowed.
 */

export function readString(key: string, fallback: string): string {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const value = localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeString(key: string, value: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable/full — preference simply won't persist this session.
  }
}

export function readNumber(key: string, fallback: number): number {
  const raw = readString(key, "");
  if (raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function writeNumber(key: string, value: number): void {
  writeString(key, String(value));
}
