import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./data/currentBank", () => ({
  getCurrentBank: () => ({ weekOf: "2026-07-06", passages: [] }),
}));

// Import after the mock so App picks up the empty bank at module load.
const { default: App } = await import("./App");

describe("App with an empty bank", () => {
  it("shows a designed empty state instead of a blank or crashed stage", () => {
    render(<App />);
    expect(
      screen.getByText(/No passages available this week/),
    ).toBeInTheDocument();
    // The rest of the shell still renders — this isn't a white screen.
    expect(screen.getByLabelText("Spot the Bot")).toBeInTheDocument();
  });
});
