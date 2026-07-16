import { describe, expect, it } from "vitest";
import { dealStaged } from "./bank";
import { mulberry32 } from "./rng";
import type { Passage, PassageBank } from "../types/passage";

function makeBank(spec: { h: [number, number, number]; a: [number, number, number] }): PassageBank {
  const passages: Passage[] = [];
  (["h", "a"] as const).forEach((o) => {
    spec[o].forEach((count, tierIdx) => {
      for (let i = 0; i < count; i++) {
        const d = (tierIdx + 1) as 1 | 2 | 3;
        passages.push({
          id: `${o}${d}-${i}`,
          text: `${o}${d}-${i}`,
          origin: o === "h" ? "human" : "ai",
          style: "letter",
          difficulty: d,
          ...(o === "a" ? { model: "M" } : {}),
        });
      }
    });
  });
  return { weekOf: "2026-07-13", passages };
}

const fullBank = makeBank({ h: [5, 10, 7], a: [13, 6, 25] });

describe("dealStaged", () => {
  it("deals ten with the difficulty arc: easy openers, hard closers", () => {
    const round = dealStaged(fullBank, mulberry32(42));
    expect(round).toHaveLength(10);
    const tiers = round.map((p) => p.difficulty);
    // Warm-up: all tier 1. Finale ramp: all tier 3.
    expect(tiers.slice(0, 3)).toEqual([1, 1, 1]);
    expect(tiers.slice(3, 7)).toEqual([2, 2, 2, 2]);
    expect(tiers.slice(7)).toEqual([3, 3, 3]);
  });

  it("always closes on an AI passage — the machine's best work", () => {
    for (let seed = 0; seed < 25; seed++) {
      const round = dealStaged(fullBank, mulberry32(seed));
      const finale = round[round.length - 1];
      expect(finale.origin).toBe("ai");
      expect(finale.difficulty).toBe(3);
    }
  });

  it("mixes origins inside the warm-up so positions don't leak answers", () => {
    const round = dealStaged(fullBank, mulberry32(7));
    const openers = round.slice(0, 3);
    expect(openers.filter((p) => p.origin === "ai")).toHaveLength(2);
    expect(openers.filter((p) => p.origin === "human")).toHaveLength(1);
    const mid = round.slice(3, 7);
    expect(mid.filter((p) => p.origin === "ai")).toHaveLength(2);
    expect(mid.filter((p) => p.origin === "human")).toHaveLength(2);
  });

  it("is deterministic for the same seed and shuffled between seeds", () => {
    const a = dealStaged(fullBank, mulberry32(7)).map((p) => p.id);
    const b = dealStaged(fullBank, mulberry32(7)).map((p) => p.id);
    const c = dealStaged(fullBank, mulberry32(8)).map((p) => p.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("never repeats a passage within a round", () => {
    const round = dealStaged(fullBank, mulberry32(1));
    expect(new Set(round.map((p) => p.id)).size).toBe(round.length);
  });

  it("degrades gracefully when a tier runs short", () => {
    // No easy passages at all — the plan falls back to nearby tiers.
    const round = dealStaged(makeBank({ h: [0, 6, 3], a: [0, 6, 5] }), mulberry32(3));
    expect(round).toHaveLength(10);
    expect(new Set(round.map((p) => p.id)).size).toBe(10);
    expect(round[round.length - 1].origin).toBe("ai");
  });

  it("handles a bank smaller than the round size", () => {
    const round = dealStaged(makeBank({ h: [1, 1, 1], a: [1, 1, 1] }), mulberry32(3));
    expect(round).toHaveLength(6);
    expect(new Set(round.map((p) => p.id)).size).toBe(6);
  });

  it("treats missing difficulty as mid-tier", () => {
    const bank = makeBank({ h: [2, 0, 2], a: [2, 0, 3] });
    bank.passages.push({ id: "x", text: "x", origin: "human", style: "letter" });
    const round = dealStaged(bank, mulberry32(9));
    expect(round.some((p) => p.id === "x")).toBe(true);
  });

  it("returns an empty round for an empty bank", () => {
    expect(dealStaged(makeBank({ h: [0, 0, 0], a: [0, 0, 0] }), mulberry32(3))).toEqual([]);
  });
});
