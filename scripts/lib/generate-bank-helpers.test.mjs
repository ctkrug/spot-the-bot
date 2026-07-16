import { describe, expect, it } from "vitest";
import { buildAiPassages, buildHumanPassages, isoWeekMonday, parseArgs } from "./generate-bank-helpers.mjs";

describe("isoWeekMonday", () => {
  it("returns the same date when given a Monday", () => {
    expect(isoWeekMonday(new Date("2026-07-06T15:00:00Z"))).toBe("2026-07-06");
  });

  it("rolls a Sunday back to the preceding Monday", () => {
    expect(isoWeekMonday(new Date("2026-07-12T00:00:00Z"))).toBe("2026-07-06");
  });

  it("rolls a Saturday back to the same week's Monday", () => {
    expect(isoWeekMonday(new Date("2026-07-11T23:00:00Z"))).toBe("2026-07-06");
  });

  it("handles a year boundary correctly", () => {
    // 2026-01-01 is a Thursday; that ISO week's Monday is in the prior year.
    expect(isoWeekMonday(new Date("2026-01-01T00:00:00Z"))).toBe("2025-12-29");
  });
});

describe("buildHumanPassages", () => {
  it("stamps every pooled passage with origin human", () => {
    const pool = [{ id: "h1", text: "x", style: "diary entry" }];
    const out = buildHumanPassages(pool);
    expect(out).toEqual([{ id: "h1", text: "x", style: "diary entry", origin: "human" }]);
  });

  it("returns an empty array for an empty pool", () => {
    expect(buildHumanPassages([])).toEqual([]);
  });
});

describe("buildAiPassages", () => {
  it("stamps origin ai and keeps each passage's own honest model attribution", () => {
    const pool = [
      { id: "a1", text: "x", style: "news lede", model: "Model A" },
      { id: "a2", text: "y", style: "news lede", model: "Model B" },
    ];
    const out = buildAiPassages(pool);
    expect(out.map((p) => [p.origin, p.model])).toEqual([
      ["ai", "Model A"],
      ["ai", "Model B"],
    ]);
  });

  it("throws when a pool entry is missing its model attribution", () => {
    expect(() => buildAiPassages([{ id: "a1", text: "x", style: "news lede" }])).toThrow(
      /missing its model attribution/,
    );
  });
});

describe("parseArgs", () => {
  it("parses --force, --week, and --live", () => {
    expect(parseArgs(["--force", "--week=2026-07-06", "--live"])).toEqual({
      force: true,
      week: "2026-07-06",
      live: true,
    });
  });

  it("defaults force and live to false and week to null", () => {
    expect(parseArgs([])).toEqual({ force: false, week: null, live: false });
  });

  it("throws on an unrecognized argument", () => {
    expect(() => parseArgs(["--bogus"])).toThrow(/unknown argument/);
  });
});
