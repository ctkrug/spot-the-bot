import { describe, expect, it } from "vitest";
import type { Passage } from "../types/passage";
import {
  currentIndex,
  currentPassage,
  isComplete,
  startGame,
  submitGuess,
} from "./state";

const round: Passage[] = [
  { id: "p1", text: "one", origin: "human", style: "diary entry" },
  { id: "p2", text: "two", origin: "ai", style: "news lede", model: "GPT-5" },
];

describe("game state", () => {
  it("starts with no guesses on the first passage", () => {
    const s = startGame(round);
    expect(s.guesses).toEqual([]);
    expect(currentIndex(s)).toBe(0);
    expect(currentPassage(s)?.id).toBe("p1");
    expect(isComplete(s)).toBe(false);
  });

  it("advances to the next passage after a guess", () => {
    let s = startGame(round);
    s = submitGuess(s, "human");
    expect(currentIndex(s)).toBe(1);
    expect(currentPassage(s)?.id).toBe("p2");
    expect(isComplete(s)).toBe(false);
  });

  it("is complete after every passage is answered", () => {
    let s = startGame(round);
    s = submitGuess(s, "human");
    s = submitGuess(s, "ai");
    expect(isComplete(s)).toBe(true);
    expect(currentPassage(s)).toBeNull();
    expect(s.guesses).toEqual(["human", "ai"]);
  });

  it("ignores extra guesses once complete (no changing answers)", () => {
    let s = startGame(round);
    s = submitGuess(s, "human");
    s = submitGuess(s, "ai");
    const after = submitGuess(s, "human");
    expect(after).toBe(s);
    expect(after.guesses).toHaveLength(2);
  });

  it("does not mutate the previous state", () => {
    const s0 = startGame(round);
    const s1 = submitGuess(s0, "human");
    expect(s0.guesses).toEqual([]);
    expect(s1).not.toBe(s0);
  });

  it("treats an empty round as never complete and never fillable", () => {
    const s = startGame([]);
    expect(isComplete(s)).toBe(false);
    expect(currentPassage(s)).toBeNull();
    expect(submitGuess(s, "human")).toBe(s);
  });
});
