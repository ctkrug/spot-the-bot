import { describe, expect, it } from "vitest";
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
});
