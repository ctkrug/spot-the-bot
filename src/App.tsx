import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { play } from "./audio/sfx";
import { About } from "./components/About";
import { MuteToggle } from "./components/MuteToggle";
import { PassageCard } from "./components/PassageCard";
import { ProgressStrip } from "./components/ProgressStrip";
import { Reveal } from "./components/Reveal";
import { StatsPanel } from "./components/StatsPanel";
import { VerdictButtons } from "./components/VerdictButtons";
import { Wordmark } from "./components/Wordmark";
import { getCurrentBank } from "./data/currentBank";
import { actFor } from "./game/acts";
import { dealStaged } from "./game/bank";
import { caseNumber, dailySeed, localDateStr } from "./game/daily";
import { mulberry32 } from "./game/rng";
import { scoreAnswer, scoreRound, type Answer, type Guess } from "./game/scoring";
import {
  currentIndex,
  currentPassage,
  isComplete,
  startGame,
  submitGuess,
  type GameState,
} from "./game/state";
import {
  loadDailyRound,
  loadStats,
  recordRound,
  saveDailyRound,
  saveStats,
  type Stats,
} from "./game/stats";
import { useMute } from "./hooks/useMute";

const bank = getCurrentBank();

/** How long the per-card verdict strip stays before auto-advancing. */
export const VERDICT_MS = 2400;

type Mode = "daily" | "practice";

/** A fresh 32-bit seed per practice round; runtime (unlike the build) may use time/random. */
function newSeed(): number {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}

function dealDaily(dateStr: string) {
  return dealStaged(bank, mulberry32(dailySeed(dateStr)));
}

/** Correctness of each answered passage, for the progress strip. */
function answeredResults(state: GameState): boolean[] {
  return state.guesses.map((g, i) => state.round[i].origin === g);
}

/** Length of the trailing run of correct answers — the live combo. */
function currentCombo(state: GameState): number {
  const results = answeredResults(state);
  let run = 0;
  for (let i = results.length - 1; i >= 0 && results[i]; i--) run++;
  return run;
}

export default function App() {
  const today = useMemo(() => localDateStr(), []);
  const { muted, toggleMute } = useMute();

  // Resume a finished daily from storage so a reload shows the result instead
  // of allowing a replay. The stored guesses must match today's dealt passage
  // ids — a redeploy can reshuffle the day's case, and replaying old guesses
  // onto new passages would fabricate a result.
  const [mode, setMode] = useState<Mode>("daily");
  const [game, setGame] = useState<GameState>(() => {
    const round = dealDaily(today);
    const stored = loadDailyRound(today);
    if (
      stored &&
      round.length > 0 &&
      stored.guesses.length === round.length &&
      stored.ids !== undefined &&
      stored.ids.length === round.length &&
      stored.ids.every((id, i) => id === round[i].id)
    ) {
      return { round, guesses: stored.guesses };
    }
    return startGame(round);
  });
  const [lastAnswer, setLastAnswer] = useState<Answer | null>(null);
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [statsOpen, setStatsOpen] = useState(false);
  // First visit ever → frame the daily as the AIQ test.
  const firstRun = useRef(loadStats().plays === 0);
  // True while the round being shown was already recorded (resumed daily).
  const recordedRef = useRef(isComplete(game));
  const advanceTimer = useRef<number | null>(null);

  const complete = isComplete(game);
  const inVerdict = lastAnswer !== null;
  const passage = currentPassage(game);
  const index = currentIndex(game);
  const combo = currentCombo(game);

  const result = useMemo(
    () => (complete && !inVerdict ? scoreRound(game.round, game.guesses) : null),
    [complete, inVerdict, game.round, game.guesses],
  );

  // Record the finished round into stats exactly once, then celebrate.
  useEffect(() => {
    if (!result || recordedRef.current) return;
    recordedRef.current = true;
    setStats((prev) => {
      const next = recordRound(prev, result, mode === "daily" ? today : null);
      saveStats(next);
      return next;
    });
    if (mode === "daily") {
      saveDailyRound({ date: today, guesses: game.guesses, ids: game.round.map((p) => p.id) });
    }
    play("win");
  }, [result, mode, today, game.guesses, game.round]);

  /** Dismiss the verdict strip and move to the next card (or the reveal). */
  const advance = useCallback(() => {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setLastAnswer(null);
  }, []);

  const handleVerdict = useCallback(
    (guess: Guess) => {
      if (inVerdict || complete || !passage) return;
      const answer = scoreAnswer(passage, guess);
      play("tap");
      play(answer.correct ? "correct" : "wrong", answer.correct ? combo : 0);
      setLastAnswer(answer);
      setGame((g) => submitGuess(g, guess));
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null;
        setLastAnswer(null);
      }, VERDICT_MS);
    },
    [inVerdict, complete, passage, combo],
  );

  const playPractice = useCallback(() => {
    recordedRef.current = false;
    setLastAnswer(null);
    setMode("practice");
    setGame(startGame(dealStaged(bank, mulberry32(newSeed()))));
    // Thunk the fresh round's card into place (the AudioContext is already
    // running by now, unlike the autoplay-blocked first deal on page load).
    play("stamp");
  }, []);

  // Keyboard: H/A cast verdicts; space/enter/N skip the verdict strip.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (statsOpen) return;
      if (inVerdict) {
        if (e.key === " " || e.key === "Enter" || e.key === "n" || e.key === "N") {
          e.preventDefault();
          advance();
        }
        return;
      }
      if (complete) return;
      if (e.key === "h" || e.key === "H") handleVerdict("human");
      if (e.key === "a" || e.key === "A") handleVerdict("ai");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [statsOpen, inVerdict, complete, handleVerdict, advance]);

  useEffect(
    () => () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  const showReveal = complete && !inVerdict && result !== null;
  const caseNo = caseNumber(today);
  const cardPosition = inVerdict ? index : index + 1;

  return (
    <>
      <div className="app">
        <header className="topbar">
          <Wordmark />
          <div className="topbar__meta">
            <span className={`case-chip${mode === "practice" ? " case-chip--practice" : ""}`}>
              {mode === "daily" ? `CASE №${caseNo}` : "PRACTICE"}
            </span>
            <button
              type="button"
              className="icon-btn"
              aria-label="Statistics"
              onClick={() => setStatsOpen(true)}
            >
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <rect x="2" y="10" width="4" height="8" rx="1" fill="currentColor" />
                <rect x="8" y="5" width="4" height="13" rx="1" fill="currentColor" />
                <rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor" />
              </svg>
            </button>
            <MuteToggle muted={muted} onToggle={toggleMute} />
          </div>
        </header>

        {firstRun.current && !showReveal && (
          <p className="test-banner">
            <strong>THE AIQ TEST</strong> — ten exhibits, from obvious slop to expert fakes.
            Find out how sharp your AI radar really is.
          </p>
        )}

        {showReveal ? (
          <Reveal
            result={result}
            mode={mode}
            caseNo={caseNo}
            stats={stats}
            onPlayPractice={playPractice}
          />
        ) : passage || inVerdict ? (
          <main className="stage">
            <ProgressStrip
              total={game.round.length}
              current={index}
              results={answeredResults(game)}
              combo={combo}
            />
            <PassageCard
              key={inVerdict ? `v-${lastAnswer.passage.id}` : passage!.id}
              passage={inVerdict ? lastAnswer.passage : passage!}
              position={cardPosition}
              total={game.round.length}
              act={actFor(cardPosition - 1, game.round.length)}
              answer={lastAnswer}
              onDismiss={advance}
            />
            <VerdictButtons
              onVerdict={handleVerdict}
              disabled={inVerdict}
              pressed={inVerdict ? lastAnswer.guess : null}
            />
            <p className="sr-only" role="status" aria-live="polite">
              {inVerdict
                ? `${lastAnswer.correct ? "Correct" : "Wrong"}. It was ${lastAnswer.passage.origin === "ai" ? "AI" : "human"}.`
                : `Passage ${index + 1} of ${game.round.length}`}
            </p>
          </main>
        ) : (
          <main className="stage stage--empty">
            <p>No passages available this week. Please check back later.</p>
          </main>
        )}

        <footer className="site-footer">
          <span>
            Bank: week of <strong>{bank.weekOf}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>Real attributed human writing vs. real AI text. New case daily.</span>
        </footer>
      </div>

      {statsOpen && <StatsPanel stats={stats} onClose={() => setStatsOpen(false)} />}
      <About weekOf={bank.weekOf} />
    </>
  );
}
