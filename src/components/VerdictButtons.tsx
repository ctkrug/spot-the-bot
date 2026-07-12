import type { Guess } from "../game/scoring";

interface VerdictButtonsProps {
  onVerdict: (guess: Guess) => void;
  /** Disabled briefly during the flip animation between passages. */
  disabled: boolean;
  /** The verdict just chosen, so it can render its pressed/stamped state. */
  pressed: Guess | null;
}

/**
 * The two verdict buttons — the primary interaction. HUMAN (blue) and AI
 * (coral) anchor the bottom of the stage as full-width halves. Each is a large
 * touch target with themed hover/active/disabled states from docs/DESIGN.md.
 */
export function VerdictButtons({ onVerdict, disabled, pressed }: VerdictButtonsProps) {
  return (
    <div className="verdicts" role="group" aria-label="Cast your verdict">
      <button
        type="button"
        className={`verdict verdict--human${pressed === "human" ? " verdict--pressed" : ""}`}
        onClick={() => onVerdict("human")}
        disabled={disabled}
      >
        <span className="verdict__key" aria-hidden="true">
          H
        </span>
        HUMAN
      </button>
      <button
        type="button"
        className={`verdict verdict--ai${pressed === "ai" ? " verdict--pressed" : ""}`}
        onClick={() => onVerdict("ai")}
        disabled={disabled}
      >
        <span className="verdict__key" aria-hidden="true">
          A
        </span>
        AI
      </button>
    </div>
  );
}
