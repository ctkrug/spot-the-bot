import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_STATS,
  loadDailyRound,
  loadStats,
  recordRound,
  saveDailyRound,
  saveStats,
  STREAK_THRESHOLD,
} from "./stats";

const roundOf = (score: number, extra: Partial<Parameters<typeof recordRound>[1]> = {}) => ({
  score,
  fooledByAiCount: 0,
  wronglyAccusedCount: 0,
  maxCombo: score,
  ...extra,
});

beforeEach(() => {
  localStorage.clear();
});

describe("recordRound", () => {
  it("increments plays, tracks best score, and fills the distribution", () => {
    let s = recordRound(EMPTY_STATS, roundOf(7));
    s = recordRound(s, roundOf(9));
    s = recordRound(s, roundOf(4));
    expect(s.plays).toBe(3);
    expect(s.bestScore).toBe(9);
    expect(s.dist[7]).toBe(1);
    expect(s.dist[9]).toBe(1);
    expect(s.dist[4]).toBe(1);
  });

  it("does not mutate the previous stats object", () => {
    const before = JSON.parse(JSON.stringify(EMPTY_STATS));
    recordRound(EMPTY_STATS, roundOf(10), "2026-07-16");
    expect(EMPTY_STATS).toEqual(before);
  });

  it("extends the round streak at the threshold and resets below it", () => {
    let s = recordRound(EMPTY_STATS, roundOf(STREAK_THRESHOLD));
    expect(s.roundStreak).toBe(1);
    s = recordRound(s, roundOf(10));
    expect(s.roundStreak).toBe(2);
    s = recordRound(s, roundOf(STREAK_THRESHOLD - 1));
    expect(s.roundStreak).toBe(0);
  });

  it("accumulates fooled/accused totals and the best combo", () => {
    let s = recordRound(EMPTY_STATS, roundOf(6, { fooledByAiCount: 3, wronglyAccusedCount: 1, maxCombo: 4 }));
    s = recordRound(s, roundOf(6, { fooledByAiCount: 2, wronglyAccusedCount: 2, maxCombo: 6 }));
    expect(s.fooledByAi).toBe(5);
    expect(s.wronglyAccused).toBe(3);
    expect(s.bestCombo).toBe(6);
  });

  describe("daily streak", () => {
    it("starts a streak on the first daily", () => {
      const s = recordRound(EMPTY_STATS, roundOf(5), "2026-07-16");
      expect(s.daily).toEqual({ lastDate: "2026-07-16", streak: 1, best: 1 });
    });

    it("extends the streak on consecutive days and tracks the best", () => {
      let s = recordRound(EMPTY_STATS, roundOf(5), "2026-07-15");
      s = recordRound(s, roundOf(5), "2026-07-16");
      expect(s.daily.streak).toBe(2);
      expect(s.daily.best).toBe(2);
    });

    it("resets the streak after a missed day", () => {
      let s = recordRound(EMPTY_STATS, roundOf(5), "2026-07-13");
      s = recordRound(s, roundOf(5), "2026-07-16");
      expect(s.daily.streak).toBe(1);
      expect(s.daily.best).toBe(1);
    });

    it("does not double-count the same day", () => {
      let s = recordRound(EMPTY_STATS, roundOf(5), "2026-07-16");
      s = recordRound(s, roundOf(5), "2026-07-16");
      expect(s.daily.streak).toBe(1);
    });

    it("leaves the daily streak untouched for practice rounds", () => {
      const s = recordRound(EMPTY_STATS, roundOf(5), null);
      expect(s.daily).toEqual(EMPTY_STATS.daily);
    });

    it("crosses month boundaries correctly", () => {
      let s = recordRound(EMPTY_STATS, roundOf(5), "2026-07-31");
      s = recordRound(s, roundOf(5), "2026-08-01");
      expect(s.daily.streak).toBe(2);
    });
  });
});

describe("persistence", () => {
  it("round-trips through save/load", () => {
    const s = recordRound(EMPTY_STATS, roundOf(8, { fooledByAiCount: 1, maxCombo: 5 }), "2026-07-16");
    saveStats(s);
    expect(loadStats()).toEqual(s);
  });

  it("migrates legacy v1 numeric keys when no v2 blob exists", () => {
    localStorage.setItem("stb.bestScore", "9");
    localStorage.setItem("stb.streak", "3");
    localStorage.setItem("stb.plays", "12");
    const s = loadStats();
    expect(s.bestScore).toBe(9);
    expect(s.roundStreak).toBe(3);
    expect(s.plays).toBe(12);
    expect(s.daily.streak).toBe(0);
  });

  it("falls back to zeros on a corrupt v2 blob", () => {
    localStorage.setItem("stb.stats.v2", "{not json");
    expect(loadStats()).toEqual(EMPTY_STATS);
  });
});

describe("daily round persistence", () => {
  it("stores and restores today's guesses", () => {
    saveDailyRound({ date: "2026-07-16", guesses: ["human", "ai", "ai"] });
    expect(loadDailyRound("2026-07-16")).toEqual({
      date: "2026-07-16",
      guesses: ["human", "ai", "ai"],
    });
  });

  it("returns null for another date or malformed data", () => {
    saveDailyRound({ date: "2026-07-15", guesses: ["human"] });
    expect(loadDailyRound("2026-07-16")).toBeNull();
    localStorage.setItem("stb.dailyRound.v1", '{"date":"2026-07-16","guesses":["maybe"]}');
    expect(loadDailyRound("2026-07-16")).toBeNull();
  });
});
