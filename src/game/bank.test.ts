import { describe, expect, it, vi } from "vitest";
import type { PassageBank } from "../types/passage";
import { dealRound, isValidPassage, loadBank, ROUND_SIZE, sanitizePassages } from "./bank";
import { mulberry32 } from "./rng";

const goodHuman = { id: "h1", text: "A real sentence.", origin: "human", style: "diary entry" };
const goodAi = {
  id: "a1",
  text: "A generated sentence.",
  origin: "ai",
  style: "news lede",
  model: "GPT-5",
};

describe("isValidPassage", () => {
  it("accepts well-formed human and AI passages", () => {
    expect(isValidPassage(goodHuman)).toBe(true);
    expect(isValidPassage(goodAi)).toBe(true);
  });

  it("rejects non-objects and null", () => {
    expect(isValidPassage(null)).toBe(false);
    expect(isValidPassage("nope")).toBe(false);
    expect(isValidPassage(42)).toBe(false);
    expect(isValidPassage(undefined)).toBe(false);
  });

  it("rejects missing or empty text", () => {
    expect(isValidPassage({ ...goodHuman, text: "" })).toBe(false);
    expect(isValidPassage({ ...goodHuman, text: "   " })).toBe(false);
    const { text: _text, ...noText } = goodHuman;
    expect(isValidPassage(noText)).toBe(false);
  });

  it("rejects invalid origin values", () => {
    expect(isValidPassage({ ...goodHuman, origin: "robot" })).toBe(false);
    expect(isValidPassage({ ...goodHuman, origin: "" })).toBe(false);
  });

  it("requires a non-empty model on AI passages", () => {
    const { model: _model, ...noModel } = goodAi;
    expect(isValidPassage(noModel)).toBe(false);
    expect(isValidPassage({ ...goodAi, model: "" })).toBe(false);
  });

  it("rejects missing id or style", () => {
    expect(isValidPassage({ ...goodHuman, id: "" })).toBe(false);
    expect(isValidPassage({ ...goodHuman, style: "" })).toBe(false);
  });
});

describe("sanitizePassages", () => {
  it("drops malformed entries and warns for each", () => {
    const warn = vi.fn();
    const result = sanitizePassages([goodHuman, { junk: true }, goodAi, null], warn);
    expect(result).toHaveLength(2);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("returns an empty array without throwing when all entries are bad", () => {
    const warn = vi.fn();
    expect(sanitizePassages([null, 3, "x"], warn)).toEqual([]);
  });
});

describe("loadBank", () => {
  it("keeps only valid passages and preserves weekOf", () => {
    const warn = vi.fn();
    const bank = loadBank({ weekOf: "2026-07-06", passages: [goodHuman, {}, goodAi] }, warn);
    expect(bank.weekOf).toBe("2026-07-06");
    expect(bank.passages).toHaveLength(2);
  });

  it("defaults weekOf to 'unknown' when absent", () => {
    const bank = loadBank({ passages: [goodHuman] }, vi.fn());
    expect(bank.weekOf).toBe("unknown");
  });

  it("throws on unusable top-level shape", () => {
    expect(() => loadBank(null)).toThrow();
    expect(() => loadBank({ weekOf: "x" })).toThrow();
    expect(() => loadBank({ passages: "not-array" })).toThrow();
  });
});

function makeBank(n: number): PassageBank {
  const passages = Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    text: `Passage number ${i}.`,
    origin: i % 2 === 0 ? ("human" as const) : ("ai" as const),
    style: "diary entry",
    ...(i % 2 === 0 ? {} : { model: "GPT-5" }),
  }));
  return { weekOf: "2026-07-06", passages };
}

describe("dealRound", () => {
  it("deals exactly ROUND_SIZE passages from a large bank", () => {
    const round = dealRound(makeBank(24), mulberry32(1));
    expect(round).toHaveLength(ROUND_SIZE);
  });

  it("never repeats a passage within a round", () => {
    for (let seed = 0; seed < 100; seed++) {
      const round = dealRound(makeBank(24), mulberry32(seed));
      const ids = round.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("caps the round at the bank size when the bank is small", () => {
    expect(dealRound(makeBank(3), mulberry32(1))).toHaveLength(3);
  });

  it("returns an empty round for an empty bank", () => {
    expect(dealRound(makeBank(0), mulberry32(1))).toEqual([]);
  });

  it("is deterministic under a fixed seed", () => {
    const a = dealRound(makeBank(24), mulberry32(5)).map((p) => p.id);
    const b = dealRound(makeBank(24), mulberry32(5)).map((p) => p.id);
    expect(a).toEqual(b);
  });
});
