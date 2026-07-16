import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Passage } from "../types/passage";
import { scoreRound } from "../game/scoring";
import { EMPTY_STATS } from "../game/stats";
import { Reveal } from "./Reveal";

const ai = (id: string, model: string): Passage => ({
  id,
  text: `secret ${id}`,
  origin: "ai",
  style: "news lede",
  model,
  tell: `tell for ${id}`,
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderReveal(overrides: Partial<Parameters<typeof Reveal>[0]> = {}) {
  const result = scoreRound(
    [ai("a1", "Claude Fable 5"), ai("a2", "Claude Fable 5")],
    ["human", "human"],
  );
  const props = {
    result,
    mode: "daily" as const,
    caseNo: 5,
    stats: EMPTY_STATS,
    onPlayPractice: () => {},
    ...overrides,
  };
  render(<Reveal {...props} />);
  return props;
}

describe("Reveal", () => {
  it("leads with the AIQ, names the nemesis model, and shows the classification", () => {
    renderReveal();
    // 0/2 → AIQ 40, the bottom of the scale.
    expect(document.getElementById("reveal-aiq")).toHaveTextContent("40");
    expect(screen.getByText("CERTIFIED MARK")).toBeInTheDocument();
    expect(screen.getByText(/today\./)).toHaveTextContent("Claude Fable 5");
    expect(screen.getByText(/CASE №5 — CLOSED/)).toBeInTheDocument();
  });

  it("copies a spoiler-free summary on share", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderReveal();

    await act(async () => {
      screen.getByRole("button", { name: /Share your AIQ/ }).click();
    });

    expect(writeText).toHaveBeenCalledOnce();
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain("Case #5");
    expect(text).not.toContain("secret");
    expect(screen.getByRole("button", { name: /Copied!/ })).toBeInTheDocument();
  });

  it("stays on the share label without crashing when the clipboard write rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("nope"));
    Object.assign(navigator, { clipboard: { writeText } });
    renderReveal();

    await act(async () => {
      screen.getByRole("button", { name: /Share your AIQ/ }).click();
    });

    expect(screen.getByRole("button", { name: /Share your AIQ/ })).toBeInTheDocument();
  });

  it("offers practice after a daily and invokes the callback", () => {
    const onPlayPractice = vi.fn();
    renderReveal({ onPlayPractice });
    const cta = screen.getByRole("button", { name: /Play a practice round/ });
    act(() => cta.click());
    expect(onPlayPractice).toHaveBeenCalledOnce();
  });

  it("shows a next-case countdown on dailies only", () => {
    renderReveal();
    expect(screen.getByText(/Next case in/)).toBeInTheDocument();
  });

  it("opens the case file with attributions and tells for every passage", () => {
    renderReveal();
    act(() => {
      screen.getByRole("button", { name: /Open the case file/ }).click();
    });
    expect(screen.getByText("secret a1")).toBeInTheDocument();
    expect(screen.getByText("tell for a2")).toBeInTheDocument();
    expect(screen.getAllByText(/Written by Claude Fable 5/)).toHaveLength(2);
  });

  it("labels practice rounds and offers play again", () => {
    renderReveal({ mode: "practice" });
    expect(screen.getByText(/PRACTICE ROUND — CLOSED/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Play again/ })).toBeInTheDocument();
    expect(screen.queryByText(/Next case in/)).not.toBeInTheDocument();
  });
});
