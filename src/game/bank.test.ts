import fc from "fast-check";
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
    const noText = { id: "h1", origin: "human", style: "diary entry" };
    expect(isValidPassage(noText)).toBe(false);
  });

  it("rejects invalid origin values", () => {
    expect(isValidPassage({ ...goodHuman, origin: "robot" })).toBe(false);
    expect(isValidPassage({ ...goodHuman, origin: "" })).toBe(false);
  });

  it("requires a non-empty model on AI passages", () => {
    const noModel = { id: "a1", text: "A generated sentence.", origin: "ai", style: "news lede" };
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

  it("clamps a negative or zero size to an empty round", () => {
    expect(dealRound(makeBank(24), mulberry32(1), -5)).toEqual([]);
    expect(dealRound(makeBank(24), mulberry32(1), 0)).toEqual([]);
  });

  it("clamps a size larger than the bank to the bank's length", () => {
    expect(dealRound(makeBank(3), mulberry32(1), 1_000_000)).toHaveLength(3);
  });

  it("treats a NaN size as an empty round rather than throwing", () => {
    expect(() => dealRound(makeBank(24), mulberry32(1), NaN)).not.toThrow();
    expect(dealRound(makeBank(24), mulberry32(1), NaN)).toEqual([]);
  });
});

describe("input-boundary fuzzing (property-based)", () => {
  it("isValidPassage never throws, for any input shape", () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidPassage(value)).not.toThrow();
      }),
    );
  });

  it("sanitizePassages never throws and never grows past the input length", () => {
    fc.assert(
      fc.property(fc.array(fc.anything()), (raw) => {
        const warn = () => {};
        const result = sanitizePassages(raw, warn);
        expect(result.length).toBeLessThanOrEqual(raw.length);
        expect(result.every((p) => isValidPassage(p))).toBe(true);
      }),
    );
  });

  it("loadBank never throws on an arbitrary object with a passages array", () => {
    fc.assert(
      fc.property(fc.array(fc.anything()), fc.anything(), (passages, weekOf) => {
        expect(() => loadBank({ passages, weekOf }, () => {})).not.toThrow();
      }),
    );
  });
});
