import { afterEach, describe, expect, it } from "vitest";
import {
  EMPTY_STATS,
  loadStats,
  recordRound,
  saveStats,
  STREAK_THRESHOLD,
} from "./stats";

afterEach(() => localStorage.clear());

describe("recordRound", () => {
  it("increments plays and tracks the best score", () => {
    let s = recordRound(EMPTY_STATS, 6);
    expect(s.plays).toBe(1);
    expect(s.bestScore).toBe(6);
    s = recordRound(s, 4);
    expect(s.plays).toBe(2);
    expect(s.bestScore).toBe(6);
  });

  it("extends the streak on a round at or above the threshold", () => {
    let s = recordRound(EMPTY_STATS, STREAK_THRESHOLD);
    expect(s.streak).toBe(1);
    s = recordRound(s, 10);
    expect(s.streak).toBe(2);
  });

  it("resets the streak when a round falls below the threshold", () => {
    let s = recordRound(EMPTY_STATS, 9);
    s = recordRound(s, 9);
    expect(s.streak).toBe(2);
    s = recordRound(s, STREAK_THRESHOLD - 1);
    expect(s.streak).toBe(0);
  });

  it("does not mutate the previous stats", () => {
    const prev = { ...EMPTY_STATS };
    recordRound(prev, 10);
    expect(prev).toEqual(EMPTY_STATS);
  });
});

describe("persistence", () => {
  it("round-trips through save/load", () => {
    saveStats({ bestScore: 9, streak: 3, plays: 12 });
    expect(loadStats()).toEqual({ bestScore: 9, streak: 3, plays: 12 });
  });

  it("loads zeros when nothing is stored", () => {
    expect(loadStats()).toEqual(EMPTY_STATS);
  });

  it("resets to zero after localStorage is cleared", () => {
    saveStats({ bestScore: 10, streak: 5, plays: 20 });
    localStorage.clear();
    expect(loadStats()).toEqual(EMPTY_STATS);
  });
});
