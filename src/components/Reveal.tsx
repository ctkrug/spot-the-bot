import { useEffect, useState, type CSSProperties } from "react";
import { aiqFor, classify, topPercent } from "../game/aiq";
import { formatCountdown, msUntilNextCase } from "../game/daily";
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

/** IQ-style scale from 40 to 160 with the player's needle. */
function AiqGauge({ aiq }: { aiq: number }) {
  const min = 40;
  const max = 160;
  const clamped = Math.max(min, Math.min(max, aiq));
  const x = (v: number) => 24 + ((v - min) / (max - min)) * 272;
  const ticks = [40, 70, 100, 130, 160];
  return (
    <svg viewBox="0 0 320 64" className="aiq-gauge" aria-hidden="true">
      <line x1={x(min)} y1="26" x2={x(max)} y2="26" className="aiq-gauge__track" />
      <line x1={x(min)} y1="26" x2={x(clamped)} y2="26" className="aiq-gauge__fill" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} y1="20" x2={x(t)} y2="32" className="aiq-gauge__tick" />
          <text x={x(t)} y="50" textAnchor="middle" className="aiq-gauge__label">
            {t}
          </text>
        </g>
      ))}
      <circle cx={x(clamped)} cy="26" r="8" className="aiq-gauge__needle" />
    </svg>
  );
}

/** Full-bleed reveal that replaces the stage — the score moment gets the screen. */
export function Reveal({ result, mode, caseNo, stats, onPlayPractice }: RevealProps) {
  const [copied, setCopied] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const aiq = aiqFor(result.score, result.total);
  const cls = classify(aiq);
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
    <section className="reveal" aria-labelledby="reveal-aiq">
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
        Your AIQ is {aiq} — {cls.title}, {topPercent(aiq)}. Score {result.score} out of{" "}
        {result.total}.
        {result.nemesis
          ? ` ${result.nemesis.model} fooled you ${result.nemesis.count} times.`
          : ""}
      </p>

      <p className="reveal__verdict">
        {mode === "daily" ? `CASE №${caseNo} — CLOSED` : "PRACTICE ROUND — CLOSED"}
      </p>

      <p className="reveal__aiq-label">YOUR AIQ</p>
      <h2 id="reveal-aiq" className="reveal__aiq">
        {aiq}
      </h2>
      <p className="reveal__percentile">{topPercent(aiq)} of humans tested*</p>
      <AiqGauge aiq={aiq} />
      <p className="reveal__rank">{cls.title.toUpperCase()}</p>
      <p className="reveal__rank-blurb">{cls.blurb}</p>

      <p className="reveal__grid" aria-hidden="true">
        {emojiGrid(result)} <span className="reveal__grid-score">{result.score}/{result.total}</span>
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
          {copied ? "Copied!" : "Share your AIQ"}
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

      <p className="reveal__footnote">*n = {result.total} exhibits. Not peer reviewed.</p>
    </section>
  );
}
