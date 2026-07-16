interface ProgressStripProps {
  total: number;
  /** Index of the current passage (0-based); equals answers submitted. */
  current: number;
  /** Correctness per answered passage, in order. */
  results: boolean[];
  /** Live run of consecutive correct answers; shows a flame at >= 3. */
  combo: number;
}

/**
 * A strip of dots, one per passage. Answered dots fill (correct/wrong tint),
 * the current dot pulses, upcoming dots stay hollow. A combo badge ignites
 * once a run of three or more correct answers is going.
 */
export function ProgressStrip({ total, current, results, combo }: ProgressStripProps) {
  return (
    <div className="progress-row">
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
      {combo >= 3 && (
        <span className="combo-badge" role="status" aria-label={`${combo} correct in a row`}>
          🔥×{combo}
        </span>
      )}
    </div>
  );
}
