import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Passage } from "../types/passage";
import { PassageCard } from "./PassageCard";

const passage: Passage = {
  id: "p1",
  text: "The committee reconvened at dawn.",
  origin: "human",
  style: "news lede",
};

describe("PassageCard", () => {
  it("renders no stamp before a verdict is submitted", () => {
    render(<PassageCard passage={passage} number={1} total={10} tilt={null} outcome={null} />);
    expect(screen.queryByText("CORRECT")).not.toBeInTheDocument();
    expect(screen.queryByText("WRONG")).not.toBeInTheDocument();
  });

  it("stamps CORRECT without shaking on a right guess", () => {
    render(<PassageCard passage={passage} number={1} total={10} tilt="human" outcome="correct" />);
    expect(screen.getByText("CORRECT")).toBeInTheDocument();
    expect(screen.getByText("CORRECT").closest("article")).not.toHaveClass("passage-card--shake");
  });

  it("stamps WRONG and shakes the card on a missed guess", () => {
    render(<PassageCard passage={passage} number={1} total={10} tilt="ai" outcome="wrong" />);
    const card = screen.getByText("WRONG").closest("article");
    expect(card).toHaveClass("passage-card--shake");
    expect(card).toHaveClass("passage-card--tilt-ai");
  });
});
