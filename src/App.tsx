import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { play } from "./audio/sfx";
import { About } from "./components/About";
import { MuteToggle } from "./components/MuteToggle";
import { PassageCard } from "./components/PassageCard";
import { ProgressStrip } from "./components/ProgressStrip";
import { Reveal } from "./components/Reveal";
import { VerdictButtons } from "./components/VerdictButtons";
import { Wordmark } from "./components/Wordmark";
import { getCurrentBank } from "./data/currentBank";
import { dealRound } from "./game/bank";
import { mulberry32 } from "./game/rng";
import { scoreRound, type Guess } from "./game/scoring";
import {
  currentIndex,
  currentPassage,
  isComplete,
  startGame,
  submitGuess,
  type GameState,
} from "./game/state";
import { loadStats, recordRound, saveStats, type Stats } from "./game/stats";
import { useMute } from "./hooks/useMute";

const bank = getCurrentBank();

/** A fresh 32-bit seed per round; app runtime (unlike the build) may use time/random. */
function newSeed(): number {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}

/** Correctness of each answered passage, for the progress strip. */
function answeredResults(state: GameState): boolean[] {
  return state.guesses.map((g, i) => state.round[i].origin === g);
}

export default function App() {
  const { muted, toggleMute } = useMute();
  const [game, setGame] = useState<GameState>(() =>
    startGame(dealRound(bank, mulberry32(newSeed()))),
  );
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [pending, setPending] = useState<Guess | null>(null);
  const recordedRef = useRef(false);

  const complete = isComplete(game);
  const passage = currentPassage(game);
  const index = currentIndex(game);
  const outcome =
    pending && passage ? (passage.origin === pending ? "correct" : "wrong") : null;

  const result = useMemo(
    () => (complete ? scoreRound(game.round, game.guesses) : null),
    [complete, game.round, game.guesses],
  );

  // Record the finished round into stats exactly once, then celebrate.
  useEffect(() => {
    if (!result || recordedRef.current) return;
    recordedRef.current = true;
    setStats((prev) => {
      const next = recordRound(prev, result.score);
      saveStats(next);
      return next;
    });
    play("win");
  }, [result]);

  const handleVerdict = useCallback(
    (guess: Guess) => {
      if (pending || complete || !passage) return;
      const correct = passage.origin === guess;
      play("tap");
      play(correct ? "correct" : "wrong");
      setPending(guess);
      // Brief flip window so the card tilt + button press read before advancing.
      window.setTimeout(() => {
        setGame((g) => submitGuess(g, guess));
        setPending(null);
      }, 260);
    },
    [pending, complete, passage],
  );

  const playAgain = useCallback(() => {
    recordedRef.current = false;
    setPending(null);
    setGame(startGame(dealRound(bank, mulberry32(newSeed()))));
    // Thunk the fresh round's card into place (the AudioContext is already
    // running by now, unlike the autoplay-blocked first deal on page load).
    play("stamp");
  }, []);

  // Keyboard verdicts: H = human, A = ai.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (complete || pending) return;
      if (e.key === "h" || e.key === "H") handleVerdict("human");
      if (e.key === "a" || e.key === "A") handleVerdict("ai");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [complete, pending, handleVerdict]);

  return (
    <>
      <div className="app">
        <header className="topbar">
          <Wordmark />
          <MuteToggle muted={muted} onToggle={toggleMute} />
        </header>

        {complete && result ? (
          <Reveal
            result={result}
            weekOf={bank.weekOf}
            stats={stats}
            onPlayAgain={playAgain}
          />
        ) : passage ? (
          <main className="stage">
            <ProgressStrip
              total={game.round.length}
              current={index}
              results={answeredResults(game)}
            />
            <PassageCard
              key={passage.id}
              passage={passage}
              position={index + 1}
              total={game.round.length}
              tilt={pending}
              outcome={outcome}
            />
            <VerdictButtons
              onVerdict={handleVerdict}
              disabled={pending !== null}
              pressed={pending}
            />
            <p className="sr-only" role="status" aria-live="polite">
              Passage {index + 1} of {game.round.length}
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
          <span>
            New passages every Monday. This week&rsquo;s suspects, this week&rsquo;s
            models.
          </span>
        </footer>
      </div>

      <About weekOf={bank.weekOf} />
    </>
  );
}
