import type { Passage } from "../types/passage";

interface PassageCardProps {
  passage: Passage;
  /** Round position, 1-based, shown as a stamped case number. */
  number: number;
  total: number;
  /** Direction the card tilts as it flips away after a verdict, if any. */
  tilt: "human" | "ai" | null;
  /** Whether the just-submitted guess was correct, for the stamp + shake feedback. */
  outcome: "correct" | "wrong" | null;
}

/**
 * The passage under judgment — the hero of the stage. Keyed by passage id so
 * React remounts it each round, replaying the slide-in stamp animation.
 */
export function PassageCard({ passage, number, total, tilt, outcome }: PassageCardProps) {
  const tiltClass = tilt ? ` passage-card--tilt-${tilt}` : "";
  const shakeClass = outcome === "wrong" ? " passage-card--shake" : "";
  return (
    <article className={`passage-card${tiltClass}${shakeClass}`}>
      <header className="passage-card__meta">
        <span className="passage-card__case">
          EXHIBIT {String(number).padStart(2, "0")}/{total}
        </span>
        <span className="passage-card__style">{passage.style}</span>
      </header>
      <p className="passage-card__text">{passage.text}</p>
      <footer className="passage-card__prompt">Human or bot?</footer>
      {outcome && (
        <span className={`passage-card__stamp passage-card__stamp--${outcome}`} aria-hidden="true">
          {outcome === "correct" ? "CORRECT" : "WRONG"}
        </span>
      )}
    </article>
  );
}
