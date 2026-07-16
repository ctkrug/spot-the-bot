import type { Answer } from "../game/scoring";
import type { Passage } from "../types/passage";

interface PassageCardProps {
  passage: Passage;
  /** Round position, 1-based, shown as the stamped exhibit number. */
  position: number;
  total: number;
  /** The just-scored answer while the verdict strip shows; null while guessing. */
  answer: Answer | null;
  /** Tap-to-continue while the verdict strip shows. */
  onDismiss: () => void;
}

/** Attribution line for the verdict strip: who really wrote it. */
function attribution(passage: Passage): string {
  if (passage.origin === "human") {
    return passage.source ?? "Written by a human";
  }
  return passage.model ? `Written by ${passage.model}` : "AI-generated";
}

/**
 * The passage under judgment — the hero of the stage. Keyed by passage id so
 * React remounts it each round, replaying the slide-in stamp animation. After
 * a verdict it flips to the evidence view: truth stamp, real attribution, and
 * the one-line tell — the teach-you-something beat between cards.
 */
export function PassageCard({ passage, position, total, answer, onDismiss }: PassageCardProps) {
  const verdict = answer !== null;
  const truthLabel = passage.origin === "ai" ? "AI" : "HUMAN";

  return (
    <article
      className={`passage-card${verdict ? ` passage-card--verdict passage-card--${answer.correct ? "correct" : "wrong"}` : ""}`}
      onClick={verdict ? onDismiss : undefined}
      aria-live="off"
    >
      <header className="passage-card__meta">
        <span className="passage-card__case">
          EXHIBIT {String(position).padStart(2, "0")}/{total}
        </span>
        <span className="passage-card__style">{passage.style}</span>
      </header>
      <p className="passage-card__text">{passage.text}</p>

      {verdict ? (
        <footer className="passage-card__evidence">
          <div className="passage-card__ruling">
            <span className={`truth-tag truth-tag--${passage.origin}`}>{truthLabel}</span>
            <span className="passage-card__attribution">{attribution(passage)}</span>
          </div>
          {passage.tell && <p className="passage-card__tell">{passage.tell}</p>}
          <p className="passage-card__continue" aria-hidden="true">
            tap to continue
          </p>
        </footer>
      ) : (
        <footer className="passage-card__prompt">Human or bot?</footer>
      )}

      {verdict && (
        <span
          className={`passage-card__stamp passage-card__stamp--${answer.correct ? "correct" : "wrong"}`}
          aria-hidden="true"
        >
          {answer.correct ? "CORRECT" : "WRONG"}
        </span>
      )}
    </article>
  );
}
