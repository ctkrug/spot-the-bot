import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { mulberry32, shuffle } from "./rng";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("returns values in [0, 1)", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("produces different streams for different seeds", () => {
    const a = mulberry32(1)();
    const b = mulberry32(2)();
    expect(a).not.toEqual(b);
  });
});

describe("shuffle", () => {
  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = input.slice();
    shuffle(input, mulberry32(7));
    expect(input).toEqual(copy);
  });

  it("preserves every element (is a permutation)", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    // Property: across many seeds, a shuffle is always a permutation.
    for (let seed = 0; seed < 200; seed++) {
      const out = shuffle(input, mulberry32(seed));
      expect(out.slice().sort((x, y) => x - y)).toEqual(input);
    }
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([], mulberry32(1))).toEqual([]);
    expect(shuffle([9], mulberry32(1))).toEqual([9]);
  });

  it("is deterministic under a fixed seed", () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffle(input, mulberry32(99))).toEqual(shuffle(input, mulberry32(99)));
  });
});

describe("property-based", () => {
  it("shuffle is always a length-preserving permutation, for any array and seed", () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), fc.integer({ min: 0, max: 2 ** 32 - 1 }), (arr, seed) => {
        const out = shuffle(arr, mulberry32(seed));
        expect(out).toHaveLength(arr.length);
        expect(out.slice().sort((a, b) => a - b)).toEqual(arr.slice().sort((a, b) => a - b));
      }),
    );
  });

  it("shuffle never mutates its input, for any array and seed", () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), fc.integer({ min: 0, max: 2 ** 32 - 1 }), (arr, seed) => {
        const before = arr.slice();
        shuffle(arr, mulberry32(seed));
        expect(arr).toEqual(before);
      }),
    );
  });

  it("mulberry32 always yields values in [0, 1) for any 32-bit seed", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), (seed) => {
        const rng = mulberry32(seed);
        const v = rng();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }),
    );
  });

  it("mulberry32 is deterministic for any seed, including negative and out-of-range ints", () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const a = mulberry32(seed);
        const b = mulberry32(seed);
        expect([a(), a(), a()]).toEqual([b(), b(), b()]);
      }),
    );
  });
});
