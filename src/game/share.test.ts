import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Passage } from "../types/passage";
import { scoreRound, type Guess } from "./scoring";
import { buildShareText, emojiGrid, SHARE_URL } from "./share";

const human = (id: string): Passage => ({ id, text: `secret ${id}`, origin: "human", style: "letter" });
const ai = (id: string, model = "Claude Fable 5"): Passage => ({
  id,
  text: `secret ${id}`,
  origin: "ai",
  style: "news lede",
  model,
});

describe("emojiGrid", () => {
  it("renders one square per answer in order, chunked in fives", () => {
    const result = scoreRound(
      [human("h1"), ai("a1"), human("h2"), ai("a2"), human("h3"), ai("a3")],
      ["human", "human", "human", "ai", "human", "ai"],
    );
    expect(emojiGrid(result)).toBe("🟩🟥🟩🟩🟩 🟩");
  });
});

describe("buildShareText", () => {
  const result = scoreRound([ai("a1"), ai("a2"), human("h1")], ["human", "human", "human"]);

  it("labels a daily with its case number and includes grid, rank, and URL", () => {
    const text = buildShareText(result, { caseNumber: 5, dailyStreak: 1 });
    expect(text).toContain("Case #5");
    expect(text).toContain("🟥🟥🟩 1/3");
    expect(text).toContain(SHARE_URL);
  });

  it("names the nemesis model when one fooled the player twice", () => {
    const text = buildShareText(result, { caseNumber: 5, dailyStreak: 0 });
    expect(text).toContain("Fooled 2× by Claude Fable 5 🤖");
  });

  it("celebrates a perfect practice round", () => {
    const perfect = scoreRound([ai("a1"), human("h1")], ["ai", "human"]);
    const text = buildShareText(perfect, { caseNumber: null, dailyStreak: 0 });
    expect(text).toContain("practice round");
    expect(text).toContain("Didn't fool me once 🕵️");
  });

  it("shows the day streak on dailies with a streak of 2+, never on practice", () => {
    const text = buildShareText(result, { caseNumber: 7, dailyStreak: 4 });
    expect(text).toContain("🔥 4-day streak");
    const practice = buildShareText(result, { caseNumber: null, dailyStreak: 4 });
    expect(practice).not.toContain("streak");
  });

  it("never leaks passage text for any guess pattern (spoiler-free)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom<Guess>("human", "ai"), { minLength: 4, maxLength: 4 }),
        (guesses) => {
          const passages = [human("h1"), ai("a1"), ai("a2"), human("h2")];
          const text = buildShareText(scoreRound(passages, guesses), {
            caseNumber: 3,
            dailyStreak: 2,
          });
          return !text.includes("secret");
        },
      ),
    );
  });
});
