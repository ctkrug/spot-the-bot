import type { Passage } from "../types/passage";
import type { Guess } from "./scoring";

/** Immutable game state for one round: the dealt passages and guesses so far. */
export interface GameState {
  round: Passage[];
  guesses: Guess[];
}

/** Start a new game from a freshly dealt round. */
export function startGame(round: Passage[]): GameState {
  return { round, guesses: [] };
}

/** Index of the passage awaiting a guess (equals guesses submitted). */
export function currentIndex(state: GameState): number {
  return state.guesses.length;
}

/** The passage currently on screen, or null once the round is complete. */
export function currentPassage(state: GameState): Passage | null {
  return state.round[currentIndex(state)] ?? null;
}

/** True once every passage in the round has a guess. */
export function isComplete(state: GameState): boolean {
  return state.round.length > 0 && state.guesses.length >= state.round.length;
}

/**
 * Record a guess for the current passage. No-ops (returns the same state) if
 * the round is already complete — there is no way to change a submitted
 * answer and no way to over-fill the round.
 */
export function submitGuess(state: GameState, guess: Guess): GameState {
  if (isComplete(state) || state.round.length === 0) return state;
  return { ...state, guesses: [...state.guesses, guess] };
}
