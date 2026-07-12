import type { Passage, PassageOrigin } from "../types/passage";

/** A player's verdict on a single passage. */
export type Guess = PassageOrigin;

/** Per-passage outcome after a guess is submitted. */
export interface Answer {
  passage: Passage;
  guess: Guess;
  correct: boolean;
}

/** A model that fooled the player, with how many times. */
export interface FooledByModel {
  model: string;
  count: number;
}

/** Aggregate result of a completed round. */
export interface RoundResult {
  total: number;
  score: number;
  answers: Answer[];
  /** Wrong guesses where the passage was AI but the player said human. */
  fooledByAiCount: number;
  /** Wrong guesses where the passage was human but the player said AI. */
  wronglyAccusedCount: number;
  /** AI models that fooled the player, most-fooling first. */
  fooledByModels: FooledByModel[];
  /** The single model that fooled the player ≥2 times, if any (the payoff). */
  nemesis: FooledByModel | null;
}

/** Score a single guess against a passage. */
export function scoreAnswer(passage: Passage, guess: Guess): Answer {
  return { passage, guess, correct: passage.origin === guess };
}

/**
 * Aggregate a round from its passages and the parallel list of guesses.
 * Throws if the lengths differ — that's a caller bug, not user input.
 */
export function scoreRound(passages: readonly Passage[], guesses: readonly Guess[]): RoundResult {
  if (passages.length !== guesses.length) {
    throw new Error(
      `scoreRound: ${passages.length} passages but ${guesses.length} guesses`,
    );
  }

  const answers = passages.map((p, i) => scoreAnswer(p, guesses[i]));
  const score = answers.filter((a) => a.correct).length;

  let fooledByAiCount = 0;
  let wronglyAccusedCount = 0;
  const modelCounts = new Map<string, number>();

  for (const a of answers) {
    if (a.correct) continue;
    if (a.passage.origin === "ai" && a.guess === "human") {
      fooledByAiCount++;
      if (a.passage.model) {
        modelCounts.set(a.passage.model, (modelCounts.get(a.passage.model) ?? 0) + 1);
      }
    } else if (a.passage.origin === "human" && a.guess === "ai") {
      wronglyAccusedCount++;
    }
  }

  const fooledByModels: FooledByModel[] = [...modelCounts.entries()]
    .map(([model, count]) => ({ model, count }))
    .sort((x, y) => y.count - x.count || x.model.localeCompare(y.model));

  const nemesis = fooledByModels.length > 0 && fooledByModels[0].count >= 2 ? fooledByModels[0] : null;

  return {
    total: passages.length,
    score,
    answers,
    fooledByAiCount,
    wronglyAccusedCount,
    fooledByModels,
    nemesis,
  };
}
