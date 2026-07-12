import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Passage } from "../types/passage";
import { scoreRound, type Guess } from "../game/scoring";
import { EMPTY_STATS } from "../game/stats";
import { Reveal } from "./Reveal";

const ai = (id: string, model: string): Passage => ({
  id,
  text: `secret ${id}`,
  origin: "ai",
  style: "news lede",
  model,
});

afterEach(() => vi.restoreAllMocks());

describe("Reveal", () => {
  it("names the nemesis model in the headline", () => {
    const result = scoreRound([ai("a1", "GPT-5"), ai("a2", "GPT-5")], ["human", "human"]);
    render(<Reveal result={result} weekOf="2026-07-06" stats={EMPTY_STATS} onPlayAgain={() => {}} />);
    // The nemesis headline (distinct from the sr-only live region) names the model.
    expect(screen.getByText(/this week/)).toHaveTextContent("GPT-5");
    // Both the headline and the live region should mention being fooled.
    expect(screen.getAllByText(/fooled you/).length).toBeGreaterThanOrEqual(1);
  });

  it("copies a spoiler-free summary on share", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const result = scoreRound([ai("a1", "GPT-5"), ai("a2", "GPT-5")], ["human", "human"]);
    render(<Reveal result={result} weekOf="2026-07-06" stats={EMPTY_STATS} onPlayAgain={() => {}} />);

    await act(async () => {
      screen.getByRole("button", { name: /Share score/ }).click();
    });

    expect(writeText).toHaveBeenCalledOnce();
    const shared = writeText.mock.calls[0][0] as string;
    expect(shared).toContain("GPT-5");
    expect(shared).not.toContain("secret");
    expect(screen.getByRole("button", { name: /Copied/ })).toBeInTheDocument();
  });

  it("invokes onPlayAgain when the CTA is clicked", () => {
    const onPlayAgain = vi.fn();
    const result = scoreRound([ai("a1", "GPT-5")], ["ai"]);
    render(<Reveal result={result} weekOf="2026-07-06" stats={EMPTY_STATS} onPlayAgain={onPlayAgain} />);
    act(() => screen.getByRole("button", { name: /Play again/ }).click());
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
