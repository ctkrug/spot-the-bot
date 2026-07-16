import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { scoreAnswer } from "../game/scoring";
import type { Passage } from "../types/passage";
import { PassageCard } from "./PassageCard";

const passage: Passage = {
  id: "p1",
  text: "The committee reconvened at dawn.",
  origin: "human",
  style: "news lede",
  source: "Example Gazette, 1904",
};

const aiPassage: Passage = {
  id: "p2",
  text: "A truly wonderful and inspiring committee meeting.",
  origin: "ai",
  style: "news lede",
  model: "Claude Fable 5",
  tell: "No committee has ever been described this warmly.",
};

describe("PassageCard", () => {
  it("renders no stamp or evidence before a verdict is submitted", () => {
    render(
      <PassageCard passage={passage} position={1} total={10} answer={null} onDismiss={() => {}} />,
    );
    expect(screen.queryByText("CORRECT")).not.toBeInTheDocument();
    expect(screen.queryByText("WRONG")).not.toBeInTheDocument();
    expect(screen.getByText("Human or bot?")).toBeInTheDocument();
    expect(screen.queryByText(/Example Gazette/)).not.toBeInTheDocument();
  });

  it("stamps CORRECT and shows the real attribution on a right guess", () => {
    render(
      <PassageCard
        passage={passage}
        position={1}
        total={10}
        answer={scoreAnswer(passage, "human")}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByText("CORRECT")).toBeInTheDocument();
    expect(screen.getByText("Example Gazette, 1904")).toBeInTheDocument();
    expect(screen.getByText("HUMAN")).toBeInTheDocument();
    expect(screen.getByText("CORRECT").closest("article")).not.toHaveClass("passage-card--wrong");
  });

  it("stamps WRONG, shakes, and teaches the tell on a missed AI passage", () => {
    render(
      <PassageCard
        passage={aiPassage}
        position={2}
        total={10}
        answer={scoreAnswer(aiPassage, "human")}
        onDismiss={() => {}}
      />,
    );
    const card = screen.getByText("WRONG").closest("article");
    expect(card).toHaveClass("passage-card--wrong");
    expect(screen.getByText(/Written by Claude Fable 5/)).toBeInTheDocument();
    expect(screen.getByText(aiPassage.tell!)).toBeInTheDocument();
  });

  it("dismisses on tap while showing the verdict", () => {
    const onDismiss = vi.fn();
    render(
      <PassageCard
        passage={aiPassage}
        position={2}
        total={10}
        answer={scoreAnswer(aiPassage, "ai")}
        onDismiss={onDismiss}
      />,
    );
    screen.getByText("CORRECT").closest("article")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
