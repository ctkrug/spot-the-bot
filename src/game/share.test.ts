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
