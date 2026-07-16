import { describe, expect, it } from "vitest";
import {
  caseNumber,
  DAILY_EPOCH,
  dailySeed,
  formatCountdown,
  localDateStr,
  msUntilNextCase,
  previousDateStr,
} from "./daily";

describe("caseNumber", () => {
  it("is 1 on launch day and counts up daily", () => {
    expect(caseNumber(DAILY_EPOCH)).toBe(1);
    expect(caseNumber("2026-07-13")).toBe(2);
    expect(caseNumber("2026-07-16")).toBe(5);
  });

  it("never drops below 1, even for pre-launch dates", () => {
    expect(caseNumber("2026-01-01")).toBe(1);
  });
});

describe("dailySeed", () => {
  it("is deterministic for a date", () => {
    expect(dailySeed("2026-07-16")).toBe(dailySeed("2026-07-16"));
  });

  it("differs between dates", () => {
    expect(dailySeed("2026-07-16")).not.toBe(dailySeed("2026-07-17"));
  });

  it("returns an unsigned 32-bit integer", () => {
    const seed = dailySeed("2026-07-16");
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("previousDateStr", () => {
  it("steps back one day, across month and year boundaries", () => {
    expect(previousDateStr("2026-07-16")).toBe("2026-07-15");
    expect(previousDateStr("2026-08-01")).toBe("2026-07-31");
    expect(previousDateStr("2026-01-01")).toBe("2025-12-31");
  });
});

describe("localDateStr", () => {
  it("formats a date in local time as YYYY-MM-DD", () => {
    expect(localDateStr(new Date(2026, 6, 16, 23, 59))).toBe("2026-07-16");
    expect(localDateStr(new Date(2026, 0, 2, 0, 0))).toBe("2026-01-02");
  });
});

describe("msUntilNextCase", () => {
  it("counts down to the next local midnight", () => {
    const at = new Date(2026, 6, 16, 23, 0, 0);
    expect(msUntilNextCase(at)).toBe(60 * 60 * 1000);
  });
});

describe("formatCountdown", () => {
  it("formats H:MM:SS and clamps negatives to zero", () => {
    expect(formatCountdown(3_723_000)).toBe("1:02:03");
    expect(formatCountdown(0)).toBe("0:00:00");
    expect(formatCountdown(-500)).toBe("0:00:00");
  });
});
