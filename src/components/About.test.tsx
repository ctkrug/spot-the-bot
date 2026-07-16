import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { About } from "./About";

describe("About", () => {
  it("answers the primary query in the heading and names the current week", () => {
    render(<About weekOf="2026-07-13" />);
    expect(
      screen.getByRole("heading", { level: 1, name: /AI-or-human text game/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-07-13")).toBeInTheDocument();
  });

  it("links to the GitHub repo and the portfolio", () => {
    render(<About weekOf="2026-07-13" />);
    expect(screen.getByRole("link", { name: /View on GitHub/i })).toHaveAttribute(
      "href",
      "https://github.com/ctkrug/spot-the-bot",
    );
    expect(screen.getByRole("link", { name: /apps\.charliekrug\.com/i })).toHaveAttribute(
      "href",
      "https://apps.charliekrug.com",
    );
  });

  it("renders the FAQ questions, including the provenance promise", () => {
    render(<About weekOf="2026-07-13" />);
    expect(screen.getByText("Is this an AI or human text game?")).toBeInTheDocument();
    expect(
      screen.getByText("Are the quotes really from Scott, Twain, and Keats?"),
    ).toBeInTheDocument();
  });
});
