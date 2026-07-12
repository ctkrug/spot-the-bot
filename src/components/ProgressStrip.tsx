interface ProgressStripProps {
  total: number;
  /** Index of the current passage (0-based); equals answers submitted. */
  current: number;
  /** Correctness per answered passage, in order. */
  results: boolean[];
}

/**
 * A strip of dots, one per passage. Answered dots fill (correct/wrong tint),
 * the current dot pulses, upcoming dots stay hollow. Gives the player a sense
 * of pace through the ten-round run.
 */
export function ProgressStrip({ total, current, results }: ProgressStripProps) {
  return (
    <div
      className="progress-strip"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Passage ${Math.min(current + 1, total)} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        let state = "upcoming";
        if (i < results.length) state = results[i] ? "correct" : "wrong";
        else if (i === current) state = "current";
        return <span key={i} className={`progress-dot progress-dot--${state}`} />;
      })}
    </div>
  );
}
