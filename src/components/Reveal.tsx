import { useState } from "react";
import type { RoundResult } from "../game/scoring";
import { buildShareText } from "../game/share";
import type { Stats } from "../game/stats";

interface RevealProps {
  result: RoundResult;
  weekOf: string;
  stats: Stats;
  onPlayAgain: () => void;
}

/** Full-bleed reveal that replaces the stage — the score moment gets the screen. */
export function Reveal({ result, weekOf, stats, onPlayAgain }: RevealProps) {
  const [copied, setCopied] = useState(false);
  const wrong = result.answers.filter((a) => !a.correct);

  async function handleShare() {
    const text = buildShareText(result, weekOf);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="reveal" aria-labelledby="reveal-score">
      <p className="reveal__verdict">VERDICT</p>
      <h2 id="reveal-score" className="reveal__score">
        <span className="reveal__score-num">{result.score}</span>
        <span className="reveal__score-den">/ {result.total}</span>
      </h2>

      {result.nemesis ? (
        <p className="reveal__nemesis">
          <strong>{result.nemesis.model}</strong> fooled you {result.nemesis.count}× this week.
        </p>
      ) : result.fooledByAiCount > 0 ? (
        <p className="reveal__nemesis reveal__nemesis--mild">
          AI slipped {result.fooledByAiCount} passage
          {result.fooledByAiCount === 1 ? "" : "s"} past you.
        </p>
      ) : (
        <p className="reveal__nemesis reveal__nemesis--clean">Not fooled once. Sharp eye.</p>
      )}

      <dl className="reveal__tally">
        <div className="reveal__tally-item">
          <dt>Fooled by AI</dt>
          <dd>{result.fooledByAiCount}</dd>
        </div>
        <div className="reveal__tally-item">
          <dt>Wrongly accused</dt>
          <dd>{result.wronglyAccusedCount}</dd>
        </div>
        <div className="reveal__tally-item">
          <dt>Streak</dt>
          <dd>{stats.streak}</dd>
        </div>
        <div className="reveal__tally-item">
          <dt>Best</dt>
          <dd>
            {stats.bestScore}/{result.total}
          </dd>
        </div>
      </dl>

      {wrong.length > 0 && (
        <ul className="reveal__misses">
          {wrong.map((a) => (
            <li key={a.passage.id} className="reveal__miss">
              <span className={`reveal__miss-tag reveal__miss-tag--${a.passage.origin}`}>
                {a.passage.origin === "ai" ? a.passage.model ?? "AI" : "Human"}
              </span>
              <span className="reveal__miss-text">{a.passage.text}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="reveal__actions">
        <button type="button" className="btn btn--primary" onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className="btn btn--ghost" onClick={handleShare}>
          {copied ? "Copied!" : "Share score"}
        </button>
      </div>
    </section>
  );
}
