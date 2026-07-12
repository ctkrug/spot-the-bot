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
  const pool = [
    { id: "a1", text: "x", style: "news lede" },
    { id: "a2", text: "y", style: "news lede" },
    { id: "a3", text: "z", style: "news lede" },
  ];

  it("stamps each passage with origin ai and a model", () => {
    const out = buildAiPassages(pool, ["Model A"]);
    expect(out.every((p) => p.origin === "ai" && p.model === "Model A")).toBe(true);
  });

  it("round-robins models when the pool outnumbers the model list", () => {
    const out = buildAiPassages(pool, ["Model A", "Model B"]);
    expect(out.map((p) => p.model)).toEqual(["Model A", "Model B", "Model A"]);
  });
});

describe("parseArgs", () => {
  it("parses --force and --week", () => {
    expect(parseArgs(["--force", "--week=2026-07-06"])).toEqual({
      force: true,
      week: "2026-07-06",
    });
  });

  it("defaults force to false and week to null", () => {
    expect(parseArgs([])).toEqual({ force: false, week: null });
  });

  it("throws on an unrecognized argument", () => {
    expect(() => parseArgs(["--bogus"])).toThrow(/unknown argument/);
  });
});
