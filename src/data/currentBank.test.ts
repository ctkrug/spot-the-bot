import { describe, expect, it, vi } from "vitest";
import { resolveBank } from "./currentBank";

const goodPassage = (id: string) => ({
  id,
  text: `Passage ${id} has enough real words in it.`,
  origin: "human" as const,
  style: "diary entry",
});

const seedBank = {
  weekOf: "2026-01-01",
  passages: [goodPassage("seed-1"), goodPassage("seed-2")],
};

describe("resolveBank", () => {
  it("picks the newest dated module over older ones and the seed", () => {
    const modules = {
      "./banks/2026-06-29.json": {
        default: { weekOf: "2026-06-29", passages: [goodPassage("old-1"), goodPassage("old-2")] },
      },
      "./banks/2026-07-06.json": {
        default: { weekOf: "2026-07-06", passages: [goodPassage("new-1"), goodPassage("new-2")] },
      },
    };
    const bank = resolveBank(modules, seedBank);
    expect(bank.weekOf).toBe("2026-07-06");
  });

  it("falls back to the seed when no dated module exists", () => {
    const bank = resolveBank({}, seedBank);
    expect(bank.weekOf).toBe("2026-01-01");
  });

  it("falls back to the seed when the latest bank has too few valid passages", () => {
    const modules = {
      "./banks/2026-07-06.json": {
        default: { weekOf: "2026-07-06", passages: [goodPassage("only-1")] },
      },
    };
    const bank = resolveBank(modules, seedBank);
    expect(bank.weekOf).toBe("2026-01-01");
  });

  it("falls back to the seed and warns when the latest bank is the wrong shape", () => {
    const warn = vi.fn();
    const modules = {
      "./banks/2026-07-06.json": { default: ["not", "a", "bank"] },
    };
    const bank = resolveBank(modules, seedBank, warn);
    expect(bank.weekOf).toBe("2026-01-01");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("unreadable"));
  });

  it("falls back to the seed when the latest bank is null", () => {
    const modules = { "./banks/2026-07-06.json": { default: null } };
    const bank = resolveBank(modules, seedBank, () => {});
    expect(bank.weekOf).toBe("2026-01-01");
  });

  it("drops malformed passages from the latest bank instead of crashing", () => {
    const modules = {
      "./banks/2026-07-06.json": {
        default: {
          weekOf: "2026-07-06",
          passages: [goodPassage("ok-1"), { id: "bad" }, goodPassage("ok-2")],
        },
      },
    };
    const bank = resolveBank(modules, seedBank, () => {});
    expect(bank.passages).toHaveLength(2);
  });

  it("never serves a bank prepped for a week that hasn't arrived yet", () => {
    const modules = {
      "./banks/2026-07-06.json": {
        default: { weekOf: "2026-07-06", passages: [goodPassage("this-week-1"), goodPassage("this-week-2")] },
      },
      "./banks/2026-07-13.json": {
        default: { weekOf: "2026-07-13", passages: [goodPassage("next-week-1"), goodPassage("next-week-2")] },
      },
    };
    const bank = resolveBank(modules, seedBank, console.warn, "2026-07-12");
    expect(bank.weekOf).toBe("2026-07-06");
  });
});
