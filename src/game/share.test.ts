import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Passage } from "../types/passage";
import { scoreRound, type Guess } from "./scoring";
import { buildShareText } from "./share";

const human = (id: string): Passage => ({ id, text: "secret human text", origin: "human", style: "diary entry" });
const ai = (id: string, model: string): Passage => ({
  id,
  text: "secret ai text",
  origin: "ai",
  style: "news lede",
  model,
});

describe("buildShareText", () => {
  it("includes the score and week", () => {
    const r = scoreRound([human("h")], ["human"]);
    const text = buildShareText(r, "2026-07-06");
    expect(text).toContain("1/1");
    expect(text).toContain("Week of 2026-07-06");
  });

  it("names the nemesis model when one fooled the player twice", () => {
    const passages = [ai("a1", "GPT-5"), ai("a2", "GPT-5")];
    const guesses: Guess[] = ["human", "human"];
    const text = buildShareText(scoreRound(passages, guesses), "2026-07-06");
    expect(text).toContain("GPT-5");
    expect(text).toContain("2×");
  });

  it("celebrates a perfect round", () => {
    const r = scoreRound([human("h"), ai("a", "GPT-5")], ["human", "ai"]);
    const text = buildShareText(r, "2026-07-06");
    expect(text.toLowerCase()).toContain("didn't fool me");
  });

  it("never leaks passage text (no spoilers)", () => {
    const passages = [human("h1"), ai("a1", "GPT-5")];
    const text = buildShareText(scoreRound(passages, ["ai", "human"]), "2026-07-06");
    expect(text).not.toContain("secret human text");
    expect(text).not.toContain("secret ai text");
  });
});

describe("buildShareText — property-based", () => {
  // Every generated passage's text carries a unique marker so a leak is
  // always detectable — no coincidental short-string collisions.
  const markedPassageArb = fc
    .tuple(fc.uuid(), fc.constantFrom<"human" | "ai">("human", "ai"), fc.string({ minLength: 4 }))
    .map(([id, origin, body]): Passage => {
      const marker = `SPOILER-${id}-${body}`;
      return origin === "ai"
        ? { id, text: marker, origin, style: "news lede", model: "GPT-5" }
        : { id, text: marker, origin, style: "diary entry" };
    });

  const roundArb = fc
    .array(markedPassageArb, { minLength: 0, maxLength: 10 })
    .chain((passages) =>
      fc.tuple(
        fc.constant(passages),
        fc.array(fc.constantFrom<Guess>("human", "ai"), {
          minLength: passages.length,
          maxLength: passages.length,
        }),
      ),
    );

  it("never includes any passage's text, for any round or week label", () => {
    fc.assert(
      fc.property(roundArb, fc.string({ minLength: 4 }), ([passages, guesses], weekOf) => {
        const text = buildShareText(scoreRound(passages, guesses), weekOf);
        for (const p of passages) {
          expect(text).not.toContain(p.text);
        }
      }),
    );
  });
});
