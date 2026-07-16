import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { VERDICT_MS } from "./App";
import * as sfx from "./audio/sfx";

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

/** Click a verdict, then let the evidence strip auto-advance. */
function verdict(name: "HUMAN" | "AI") {
  act(() => {
    screen.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  });
  act(() => {
    vi.advanceTimersByTime(VERDICT_MS + 100);
  });
}

describe("App", () => {
  it("renders the wordmark, case chip, and both verdict buttons on load", () => {
    render(<App />);
    expect(screen.getByLabelText("Spot the Bot")).toBeInTheDocument();
    expect(screen.getByText(/CASE №\d+/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /HUMAN/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^AI/ })).toBeInTheDocument();
  });

  it("advances the progressbar and shows the evidence strip after a verdict", () => {
    render(<App />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    act(() => {
      screen.getByRole("button", { name: /HUMAN/ }).click();
    });
    // Progress advances immediately; the truth strip shows until dismissed.
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText(/tap to continue/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(VERDICT_MS + 100);
    });
    expect(screen.queryByText(/tap to continue/)).not.toBeInTheDocument();
  });

  it("reaches the AIQ reveal after ten verdicts and can start a practice round", () => {
    render(<App />);
    for (let i = 0; i < 10; i++) verdict("HUMAN");
    const aiq = document.getElementById("reveal-aiq");
    expect(aiq?.textContent).toMatch(/^\d{2,3}$/);
    expect(screen.getByText(/\/10/)).toBeInTheDocument();
    const practice = screen.getByRole("button", { name: /Play a practice round/ });

    act(() => practice.click());
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("PRACTICE")).toBeInTheDocument();
  });

  it("persists the finished daily so a remount shows the reveal, not a replay", () => {
    const first = render(<App />);
    for (let i = 0; i < 10; i++) verdict("AI");
    expect(document.getElementById("reveal-aiq")).toBeInTheDocument();
    first.unmount();

    render(<App />);
    // Straight to the closed case — no fresh round.
    expect(document.getElementById("reveal-aiq")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^HUMAN/ })).not.toBeInTheDocument();
  });

  it("frames the first-ever visit as the AIQ test and stages the difficulty arc", () => {
    render(<App />);
    expect(screen.getByText(/THE AIQ TEST/)).toBeInTheDocument();
    // The opening act is labeled.
    expect(screen.getByText("WARM-UP")).toBeInTheDocument();
  });

  it("thunks the stamp sound when a practice round deals", () => {
    const playSpy = vi.spyOn(sfx, "play");
    render(<App />);
    for (let i = 0; i < 10; i++) verdict("HUMAN");
    playSpy.mockClear();
    act(() => screen.getByRole("button", { name: /Play a practice round/ }).click());
    expect(playSpy).toHaveBeenCalledWith("stamp");
  });

  it("accepts H and A keyboard shortcuts as verdicts", () => {
    render(<App />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    });
    act(() => {
      vi.advanceTimersByTime(VERDICT_MS + 100);
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
    });
    act(() => {
      vi.advanceTimersByTime(VERDICT_MS + 100);
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });

  it("ignores verdict keys while the evidence strip is showing", () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    });
    // Second keypress lands inside the verdict window and must be ignored.
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    });
    act(() => {
      vi.advanceTimersByTime(VERDICT_MS + 100);
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("skips the evidence strip early with the space key", () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    });
    expect(screen.getByText(/tap to continue/)).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    });
    expect(screen.queryByText(/tap to continue/)).not.toBeInTheDocument();
  });

  it("never accumulates keydown listeners across repeated rounds", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    render(<App />);
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 10; i++) verdict("HUMAN");
      const again = screen.queryByRole("button", {
        name: /Play a practice round|Play again/,
      });
      if (again) act(() => again.click());
    }
    const adds = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    const removes = removeSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    expect(adds - removes).toBeLessThanOrEqual(1);
  });

  it("opens and closes the stats panel", () => {
    render(<App />);
    act(() => screen.getByRole("button", { name: /Statistics/ }).click());
    expect(screen.getByRole("dialog", { name: /CASE RECORD/i })).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: /Close statistics/ }).click());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
