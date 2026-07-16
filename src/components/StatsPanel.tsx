import { useEffect } from "react";
import { aiqFor } from "../game/aiq";
import type { Stats } from "../game/stats";

interface StatsPanelProps {
  stats: Stats;
  onClose: () => void;
}

/** Modal case-record: lifetime numbers and the score distribution. */
export function StatsPanel({ stats, onClose }: StatsPanelProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const maxBucket = Math.max(1, ...stats.dist);
  const totalScored = stats.dist.reduce((sum, n, score) => sum + n * score, 0);
  const bestAiq = stats.plays > 0 ? aiqFor(stats.bestScore, 10) : null;
  const avgAiq =
    stats.plays > 0 ? Math.round(100 + (totalScored / stats.plays / 10 - 0.5) * 120) : null;

  return (
    <div className="stats-overlay" role="presentation" onClick={onClose}>
      <section
        className="stats-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="stats-panel__head">
          <h2 id="stats-title">CASE RECORD</h2>
          <button type="button" className="icon-btn" aria-label="Close statistics" onClick={onClose}>
            ✕
          </button>
        </header>

        <dl className="stats-grid">
          <div>
            <dd>{stats.plays}</dd>
            <dt>rounds</dt>
          </div>
          <div>
            <dd>{avgAiq ?? "—"}</dd>
            <dt>avg AIQ</dt>
          </div>
          <div>
            <dd>{bestAiq ?? "—"}</dd>
            <dt>best AIQ</dt>
          </div>
          <div>
            <dd>×{stats.bestCombo}</dd>
            <dt>best combo</dt>
          </div>
          <div>
            <dd>{stats.daily.streak}🔥</dd>
            <dt>day streak</dt>
          </div>
          <div>
            <dd>{stats.daily.best}</dd>
            <dt>best streak</dt>
          </div>
        </dl>

        <h3 className="stats-panel__subhead">SCORE DISTRIBUTION</h3>
        <ul className="dist">
          {stats.dist.map((count, score) => (
            <li key={score} className="dist__row">
              <span className="dist__label">{score}</span>
              <span className="dist__bar-track">
                <span
                  className="dist__bar"
                  style={{ width: `${(count / maxBucket) * 100}%` }}
                  data-empty={count === 0 || undefined}
                />
              </span>
              <span className="dist__count">{count}</span>
            </li>
          ))}
        </ul>

        <p className="stats-panel__foot">
          Fooled by AI {stats.fooledByAi}× · wrongly accused humans {stats.wronglyAccused}× —
          all saved in your browser only.
        </p>
      </section>
    </div>
  );
}
