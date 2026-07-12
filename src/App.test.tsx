import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

/** Click a verdict and let the flip transition resolve. */
function verdict(name: "HUMAN" | "AI") {
  act(() => {
    screen.getByRole("button", { name: new RegExp(name) }).click();
  });
  act(() => {
    vi.advanceTimersByTime(300);
  });
}

describe("App", () => {
  it("renders the wordmark and both verdict buttons on load", () => {
    render(<App />);
    expect(screen.getByLabelText("Spot the Bot")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /HUMAN/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^AI/ })).toBeInTheDocument();
  });

  it("shows a passage and advances the progressbar after a verdict", () => {
    render(<App />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    verdict("HUMAN");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("reaches the reveal after ten verdicts and can play again", () => {
    render(<App />);
    for (let i = 0; i < 10; i++) verdict("HUMAN");
    // Reveal replaces the stage: score heading + play-again CTA appear.
    const reveal = screen.getByRole("heading", { level: 2 });
    expect(reveal.textContent).toMatch(/\/\s*10/);
    const again = screen.getByRole("button", { name: /Play again/ });
    expect(again).toBeInTheDocument();

    act(() => again.click());
    // Back to the stage, fresh round at position zero.
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("exposes an accessible mute toggle", () => {
    render(<App />);
    const mute = screen.getByRole("button", { name: /Mute sound effects/ });
    expect(mute).toHaveAttribute("aria-pressed", "false");
    act(() => mute.click());
    expect(
      screen.getByRole("button", { name: /Unmute sound effects/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
