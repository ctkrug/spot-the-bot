import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MIN_PASSAGES, MIN_STYLES, validateBank, validatePassage } from "./bank-schema.mjs";

const okHuman = { id: "h1", text: "A real line.", origin: "human", style: "diary entry" };
const okAi = { id: "a1", text: "Generated line.", origin: "ai", style: "news lede", model: "GPT-5" };

describe("validatePassage", () => {
  it("returns no errors for valid passages", () => {
    expect(validatePassage(okHuman, 0)).toEqual([]);
    expect(validatePassage(okAi, 1)).toEqual([]);
  });

  it("flags each missing field", () => {
    const errs = validatePassage({ id: "", text: " ", origin: "x", style: "" }, 3);
    expect(errs.join(" ")).toContain("passage[3].id");
    expect(errs.join(" ")).toContain("passage[3].text");
    expect(errs.join(" ")).toContain("passage[3].style");
    expect(errs.join(" ")).toContain("origin must be human|ai");
  });

  it("requires a model on AI passages", () => {
    const errs = validatePassage({ id: "a", text: "x", origin: "ai", style: "news lede" }, 0);
    expect(errs.join(" ")).toContain("model required");
  });

  it("rejects a non-object passage without touching its fields", () => {
    expect(validatePassage(null, 0)).toEqual(["passage[0] is not an object"]);
    expect(validatePassage("nope", 1)).toEqual(["passage[1] is not an object"]);
  });
});

describe("validateBank", () => {
  it("accepts a well-formed bank and reports styles", () => {
    const { errors, validCount, styles } = validateBank({
      weekOf: "2026-07-06",
      passages: [okHuman, okAi],
    });
    expect(errors).toEqual([]);
    expect(validCount).toBe(2);
    expect(styles.sort()).toEqual(["diary entry", "news lede"]);
  });

  it("rejects a non-ISO weekOf", () => {
    const { errors } = validateBank({ weekOf: "July 6", passages: [okHuman] });
    expect(errors.join(" ")).toContain("weekOf");
  });

  it("rejects a non-object bank", () => {
    expect(validateBank(null)).toEqual({ errors: ["bank is not an object"], validCount: 0, styles: [] });
    expect(validateBank("nope")).toEqual({ errors: ["bank is not an object"], validCount: 0, styles: [] });
  });

  it("rejects a non-array passages field", () => {
    const { errors, validCount } = validateBank({ weekOf: "2026-07-06", passages: "nope" });
    expect(errors.join(" ")).toContain("passages must be an array");
    expect(validCount).toBe(0);
  });

  it("counts only valid passages and collects their errors", () => {
    const { errors, validCount } = validateBank({
      weekOf: "2026-07-06",
      passages: [okHuman, { id: "bad" }],
    });
    expect(validCount).toBe(1);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("exposes sane threshold constants", () => {
    expect(MIN_PASSAGES).toBe(10);
    expect(MIN_STYLES).toBe(4);
  });
});

describe("input-boundary fuzzing (property-based)", () => {
  it("validatePassage never throws, for any input shape", () => {
    fc.assert(
      fc.property(fc.anything(), fc.nat(), (value, index) => {
        expect(() => validatePassage(value, index)).not.toThrow();
      }),
    );
  });

  it("validateBank never throws and validCount never exceeds the passages array length", () => {
    fc.assert(
      fc.property(fc.array(fc.anything()), fc.anything(), (passages, weekOf) => {
        const { validCount } = validateBank({ weekOf, passages });
        expect(validCount).toBeLessThanOrEqual(passages.length);
      }),
    );
  });
});
