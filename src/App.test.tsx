import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import * as sfx from "./audio/sfx";

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
    const reveal = document.getElementById("reveal-score");
    expect(reveal?.textContent).toMatch(/\/\s*10/);
    const again = screen.getByRole("button", { name: /Play again/ });
    expect(again).toBeInTheDocument();

    act(() => again.click());
    // Back to the stage, fresh round at position zero.
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("thunks the stamp sound when a new round deals on play again", () => {
    const playSpy = vi.spyOn(sfx, "play");
    render(<App />);
    for (let i = 0; i < 10; i++) verdict("HUMAN");
    playSpy.mockClear();
    act(() => screen.getByRole("button", { name: /Play again/ }).click());
    expect(playSpy).toHaveBeenCalledWith("stamp");
  });

  it("advances the progressbar after tapping the AI verdict button", () => {
    render(<App />);
    verdict("AI");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("accepts H and A keyboard shortcuts as verdicts", () => {
    render(<App />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });

  it("ignores keyboard shortcuts while a verdict is mid-flip", () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    });
    // Second keypress lands inside the 260ms flip window and must be ignored.
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("never accumulates keydown listeners across repeated rounds", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    render(<App />);
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 10; i++) verdict("HUMAN");
      const again = screen.queryByRole("button", { name: /Play again/ });
      if (again) act(() => again.click());
    }
    const adds = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    const removes = removeSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    // Each verdict re-attaches the listener (its deps change); every prior
    // attachment must be cleaned up first, so at most one stays net-active.
    expect(adds - removes).toBeLessThanOrEqual(1);
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
