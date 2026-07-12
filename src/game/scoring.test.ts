import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Passage } from "../types/passage";
import { scoreAnswer, scoreRound, type Guess } from "./scoring";

const human = (id: string): Passage => ({
  id,
  text: `human ${id}`,
  origin: "human",
  style: "diary entry",
});
const ai = (id: string, model: string): Passage => ({
  id,
  text: `ai ${id}`,
  origin: "ai",
  style: "news lede",
  model,
});

describe("scoreAnswer", () => {
  it("marks a matching guess correct", () => {
    expect(scoreAnswer(human("h"), "human").correct).toBe(true);
    expect(scoreAnswer(ai("a", "GPT-5"), "ai").correct).toBe(true);
  });

  it("marks a mismatching guess wrong", () => {
    expect(scoreAnswer(human("h"), "ai").correct).toBe(false);
    expect(scoreAnswer(ai("a", "GPT-5"), "human").correct).toBe(false);
  });
});

describe("scoreRound", () => {
  it("throws when passages and guesses differ in length", () => {
    expect(() => scoreRound([human("h")], [])).toThrow();
  });

  it("scores a perfect round", () => {
    const passages = [human("h1"), ai("a1", "GPT-5")];
    const guesses: Guess[] = ["human", "ai"];
    const r = scoreRound(passages, guesses);
    expect(r.score).toBe(2);
    expect(r.total).toBe(2);
    expect(r.fooledByAiCount).toBe(0);
    expect(r.wronglyAccusedCount).toBe(0);
    expect(r.nemesis).toBeNull();
  });

  it("separates 'fooled by AI' from 'wrongly accused human'", () => {
    const passages = [ai("a1", "GPT-5"), human("h1"), human("h2")];
    // said human on the AI (fooled), said ai on a human (wrong accusation)
    const guesses: Guess[] = ["human", "ai", "human"];
    const r = scoreRound(passages, guesses);
    expect(r.score).toBe(1);
    expect(r.fooledByAiCount).toBe(1);
    expect(r.wronglyAccusedCount).toBe(1);
  });

  it("names the model that fooled the player twice as the nemesis", () => {
    const passages = [ai("a1", "GPT-5"), ai("a2", "GPT-5"), ai("a3", "Claude 5 Sonnet")];
    const guesses: Guess[] = ["human", "human", "human"];
    const r = scoreRound(passages, guesses);
    expect(r.fooledByAiCount).toBe(3);
    expect(r.nemesis).toEqual({ model: "GPT-5", count: 2 });
  });

  it("has no nemesis when no single model fooled the player twice", () => {
    const passages = [ai("a1", "GPT-5"), ai("a2", "Claude 5 Sonnet")];
    const guesses: Guess[] = ["human", "human"];
    const r = scoreRound(passages, guesses);
    expect(r.fooledByModels).toHaveLength(2);
    expect(r.nemesis).toBeNull();
  });

  it("ranks fooledByModels most-fooling first, breaking ties by name", () => {
    const passages = [
      ai("a1", "Zeta"),
      ai("a2", "Alpha"),
      ai("a3", "Alpha"),
      ai("a4", "Beta"),
    ];
    const guesses: Guess[] = ["human", "human", "human", "human"];
    const r = scoreRound(passages, guesses);
    expect(r.fooledByModels.map((m) => m.model)).toEqual(["Alpha", "Beta", "Zeta"]);
  });

  it("handles an empty round", () => {
    const r = scoreRound([], []);
    expect(r.score).toBe(0);
    expect(r.total).toBe(0);
    expect(r.fooledByModels).toEqual([]);
    expect(r.nemesis).toBeNull();
  });

  it("does not count correct AI guesses toward fooled models", () => {
    const passages = [ai("a1", "GPT-5")];
    const r = scoreRound(passages, ["ai"]);
    expect(r.fooledByModels).toEqual([]);
    expect(r.fooledByAiCount).toBe(0);
  });
});

const passageArb = fc
  .record({
    id: fc.uuid(),
    text: fc.string({ minLength: 1 }),
    origin: fc.constantFrom<"human" | "ai">("human", "ai"),
    style: fc.constantFrom("diary entry", "news lede", "product review"),
    model: fc.constantFrom("GPT-5", "Claude 5 Sonnet", "Gemini 3"),
  })
  .map((p): Passage => (p.origin === "ai" ? p : { ...p, model: undefined }));

const roundArb = fc
  .array(passageArb, { minLength: 0, maxLength: 15 })
  .chain((passages) =>
    fc.tuple(
      fc.constant(passages),
      fc.array(fc.constantFrom<Guess>("human", "ai"), {
        minLength: passages.length,
        maxLength: passages.length,
      }),
    ),
  );

describe("scoreRound — property-based", () => {
  it("score, fooledByAiCount, and wronglyAccusedCount always partition the round", () => {
    fc.assert(
      fc.property(roundArb, ([passages, guesses]) => {
        const r = scoreRound(passages, guesses);
        expect(r.total).toBe(passages.length);
        expect(r.score + r.fooledByAiCount + r.wronglyAccusedCount).toBe(r.total);
      }),
    );
  });

  it("fooledByModels counts always sum to fooledByAiCount", () => {
    fc.assert(
      fc.property(roundArb, ([passages, guesses]) => {
        const r = scoreRound(passages, guesses);
        const modelTotal = r.fooledByModels.reduce((sum, m) => sum + m.count, 0);
        expect(modelTotal).toBe(r.fooledByAiCount);
      }),
    );
  });

  it("nemesis, when present, is the top-ranked model with count >= 2", () => {
    fc.assert(
      fc.property(roundArb, ([passages, guesses]) => {
        const r = scoreRound(passages, guesses);
        if (r.nemesis) {
          expect(r.nemesis).toEqual(r.fooledByModels[0]);
          expect(r.nemesis.count).toBeGreaterThanOrEqual(2);
        }
      }),
    );
  });
});
