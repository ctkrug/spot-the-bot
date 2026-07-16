import { useEffect, useState, type CSSProperties } from "react";
import { formatCountdown, msUntilNextCase } from "../game/daily";
import { rankFor } from "../game/rank";
import type { RoundResult } from "../game/scoring";
import { buildShareText, emojiGrid } from "../game/share";
import type { Stats } from "../game/stats";
import type { Passage } from "../types/passage";

interface RevealProps {
  result: RoundResult;
  mode: "daily" | "practice";
  caseNo: number;
  stats: Stats;
  onPlayPractice: () => void;
}

/** Count of decorative confetti scraps on the reveal overlay. */
const CONFETTI_PIECES = 16;

function attribution(passage: Passage): string {
  if (passage.origin === "human") return passage.source ?? "Written by a human";
  return passage.model ? `Written by ${passage.model}` : "AI-generated";
}

/** Live H:MM:SS countdown to the next daily case. */
function NextCaseCountdown() {
  const [ms, setMs] = useState(() => msUntilNextCase());
  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilNextCase()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <strong className="reveal__countdown-time">{formatCountdown(ms)}</strong>;
}

/** Full-bleed reveal that replaces the stage — the score moment gets the screen. */
export function Reveal({ result, mode, caseNo, stats, onPlayPractice }: RevealProps) {
  const [copied, setCopied] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const rank = rankFor(result.score, result.total);
  const celebrate = result.total > 0 && result.score / result.total >= 0.8;

  const shareText = buildShareText(result, {
    caseNumber: mode === "daily" ? caseNo : null,
    dailyStreak: stats.daily.streak,
  });

  async function handleShare() {
    // Native share sheet on mobile; clipboard everywhere else.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // Cancelled or unsupported — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="reveal" aria-labelledby="reveal-score">
      {celebrate && (
        <div className="reveal__confetti" aria-hidden="true">
          {Array.from({ length: CONFETTI_PIECES }, (_, i) => (
            <span
              key={i}
              className="reveal__confetti-piece"
              style={{ "--i": i } as CSSProperties}
            />
          ))}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="assertive">
        Final score {result.score} out of {result.total}. Rank: {rank.title}.
        {result.nemesis
          ? ` ${result.nemesis.model} fooled you ${result.nemesis.count} times.`
          : ""}
      </p>

      <p className="reveal__verdict">
        {mode === "daily" ? `CASE №${caseNo} — CLOSED` : "PRACTICE ROUND — CLOSED"}
      </p>
      <h2 id="reveal-score" className="reveal__score">
        <span className="reveal__score-num">{result.score}</span>
        <span className="reveal__score-den">/ {result.total}</span>
      </h2>
      <p className="reveal__rank">{rank.title.toUpperCase()}</p>
      <p className="reveal__rank-blurb">{rank.blurb}</p>

      <p className="reveal__grid" aria-hidden="true">
        {emojiGrid(result)}
      </p>

      {result.nemesis ? (
        <p className="reveal__nemesis">
          <strong>{result.nemesis.model}</strong> fooled you {result.nemesis.count}× today.
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
          <dt>Best combo</dt>
          <dd>×{result.maxCombo}</dd>
        </div>
        <div className="reveal__tally-item">
          <dt>Day streak</dt>
          <dd>{stats.daily.streak}🔥</dd>
        </div>
      </dl>

      <div className="reveal__actions">
        <button type="button" className="btn btn--primary" onClick={handleShare}>
          {copied ? "Copied!" : "Share result"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onPlayPractice}>
          {mode === "daily" ? "Play a practice round" : "Play again"}
        </button>
      </div>

      {mode === "daily" && (
        <p className="reveal__countdown">
          Next case in <NextCaseCountdown />
        </p>
      )}

      <div className="reveal__dossier">
        <button
          type="button"
          className="reveal__dossier-toggle"
          aria-expanded={dossierOpen}
          onClick={() => setDossierOpen((o) => !o)}
        >
          {dossierOpen ? "Hide the case file" : "Open the case file"}
          <span aria-hidden="true">{dossierOpen ? " ▲" : " ▼"}</span>
        </button>
        {dossierOpen && (
          <ul className="dossier">
            {result.answers.map((a, i) => (
              <li key={a.passage.id} className={`dossier__item dossier__item--${a.correct ? "correct" : "wrong"}`}>
                <div className="dossier__head">
                  <span className="dossier__num">№{String(i + 1).padStart(2, "0")}</span>
                  <span className={`truth-tag truth-tag--${a.passage.origin}`}>
                    {a.passage.origin === "ai" ? "AI" : "HUMAN"}
                  </span>
                  <span className="dossier__call">
                    you said {a.guess === "ai" ? "AI" : "human"} {a.correct ? "✓" : "✗"}
                  </span>
                </div>
                <p className="dossier__text">{a.passage.text}</p>
                <p className="dossier__attribution">{attribution(a.passage)}</p>
                {a.passage.tell && <p className="dossier__tell">{a.passage.tell}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
