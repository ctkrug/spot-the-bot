import { describe, expect, it } from "vitest";
import { dealStratified } from "./bank";
import { mulberry32 } from "./rng";
import type { Passage, PassageBank } from "../types/passage";

function makeBank(humans: number, ais: number): PassageBank {
  const passages: Passage[] = [];
  for (let i = 0; i < humans; i++) {
    passages.push({ id: `h${i}`, text: `h${i}`, origin: "human", style: "letter" });
  }
  for (let i = 0; i < ais; i++) {
    passages.push({ id: `a${i}`, text: `a${i}`, origin: "ai", style: "letter", model: "M" });
  }
  return { weekOf: "2026-07-13", passages };
}

describe("dealStratified", () => {
  it("deals an even human/AI split when the bank allows", () => {
    const round = dealStratified(makeBank(20, 20), mulberry32(42));
    expect(round).toHaveLength(10);
    expect(round.filter((p) => p.origin === "human")).toHaveLength(5);
    expect(round.filter((p) => p.origin === "ai")).toHaveLength(5);
  });

  it("is deterministic for the same seed and shuffled between seeds", () => {
    const bank = makeBank(20, 20);
    const a = dealStratified(bank, mulberry32(7)).map((p) => p.id);
    const b = dealStratified(bank, mulberry32(7)).map((p) => p.id);
    const c = dealStratified(bank, mulberry32(8)).map((p) => p.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("never repeats a passage within a round", () => {
    const round = dealStratified(makeBank(6, 30), mulberry32(1));
    expect(new Set(round.map((p) => p.id)).size).toBe(round.length);
  });

  it("backfills from the other side when one runs short", () => {
    const round = dealStratified(makeBank(2, 30), mulberry32(3));
    expect(round).toHaveLength(10);
    expect(round.filter((p) => p.origin === "human")).toHaveLength(2);
    expect(round.filter((p) => p.origin === "ai")).toHaveLength(8);
  });

  it("handles a bank smaller than the round size", () => {
    const round = dealStratified(makeBank(2, 3), mulberry32(3));
    expect(round).toHaveLength(5);
  });

  it("returns an empty round for an empty bank", () => {
    expect(dealStratified(makeBank(0, 0), mulberry32(3))).toEqual([]);
  });
});
