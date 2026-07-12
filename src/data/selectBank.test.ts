import { describe, expect, it } from "vitest";
import { bankDate, pickLatestBankKey } from "./selectBank";

describe("bankDate", () => {
  it("extracts the ISO date from a path or name", () => {
    expect(bankDate("./banks/2026-07-06.json")).toBe("2026-07-06");
    expect(bankDate("2026-12-28.json")).toBe("2026-12-28");
  });

  it("returns null when no date is present", () => {
    expect(bankDate("./banks/seed.json")).toBeNull();
    expect(bankDate("not-a-bank")).toBeNull();
  });
});

describe("pickLatestBankKey", () => {
  it("picks the newest ISO-dated key", () => {
    const keys = ["./banks/2026-07-06.json", "./banks/2026-07-13.json", "./banks/2026-06-29.json"];
    expect(pickLatestBankKey(keys)).toBe("./banks/2026-07-13.json");
  });

  it("ignores keys without a parseable date", () => {
    const keys = ["./banks/readme.json", "./banks/2026-07-06.json"];
    expect(pickLatestBankKey(keys)).toBe("./banks/2026-07-06.json");
  });

  it("returns null for an empty list or all-unparseable keys", () => {
    expect(pickLatestBankKey([])).toBeNull();
    expect(pickLatestBankKey(["a.json", "b.json"])).toBeNull();
  });

  it("compares across month and year boundaries correctly", () => {
    const keys = ["./banks/2025-12-29.json", "./banks/2026-01-05.json"];
    expect(pickLatestBankKey(keys)).toBe("./banks/2026-01-05.json");
  });

  it("excludes a bank prepped for a future week when given a cutoff date", () => {
    // A Sunday build with next Monday's week already committed ahead of time
    // must still serve this week's bank, not jump the gun a day early.
    const keys = ["./banks/2026-07-06.json", "./banks/2026-07-13.json"];
    expect(pickLatestBankKey(keys, "2026-07-12")).toBe("./banks/2026-07-06.json");
  });

  it("includes a bank dated exactly on the cutoff date", () => {
    const keys = ["./banks/2026-07-06.json", "./banks/2026-07-13.json"];
    expect(pickLatestBankKey(keys, "2026-07-13")).toBe("./banks/2026-07-13.json");
  });

  it("falls back to null when every dated key is in the future", () => {
    const keys = ["./banks/2026-07-13.json"];
    expect(pickLatestBankKey(keys, "2026-07-06")).toBeNull();
  });
});
