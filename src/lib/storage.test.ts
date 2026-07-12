import { afterEach, describe, expect, it, vi } from "vitest";
import { readNumber, readString, writeNumber, writeString } from "./storage";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("string storage", () => {
  it("round-trips a value", () => {
    writeString("k", "hello");
    expect(readString("k", "fallback")).toBe("hello");
  });

  it("returns the fallback for a missing key", () => {
    expect(readString("absent", "fallback")).toBe("fallback");
  });

  it("returns the fallback and does not throw when getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readString("k", "safe")).toBe("safe");
  });

  it("swallows write errors so the app never crashes on a full quota", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writeString("k", "v")).not.toThrow();
  });
});

describe("number storage", () => {
  it("round-trips a number", () => {
    writeNumber("n", 7);
    expect(readNumber("n", 0)).toBe(7);
  });

  it("returns the fallback for a missing or non-numeric value", () => {
    expect(readNumber("absent", 3)).toBe(3);
    writeString("n", "not-a-number");
    expect(readNumber("n", 3)).toBe(3);
  });
});
