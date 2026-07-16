/**
 * Detective ranks — the identity payoff for a finished round. Thresholds are
 * proportions of the round, so short rounds (small banks) still rank fairly.
 */

export interface Rank {
  title: string;
  /** One-line flavor shown under the title. */
  blurb: string;
}

const RANKS: { min: number; rank: Rank }[] = [
  { min: 1.0, rank: { title: "Chief Turing Examiner", blurb: "Not one slipped past you. The bots are filing a complaint." } },
  { min: 0.9, rank: { title: "Bot Whisperer", blurb: "You can smell a language model through the screen." } },
  { min: 0.8, rank: { title: "Senior Detector", blurb: "Sharp eye. One or two ghosts in the machine got by." } },
  { min: 0.6, rank: { title: "Field Examiner", blurb: "Solid casework, but the machines won a few rounds." } },
  { min: 0.45, rank: { title: "Coin Flipper", blurb: "Statistically speaking, a coin would like a word." } },
  { min: 0.25, rank: { title: "Easy Mark", blurb: "The bots saw you coming, and they were polite about it." } },
  { min: 0, rank: { title: "Botfished", blurb: "Hook, line, and large language model." } },
];

export function rankFor(score: number, total: number): Rank {
  const ratio = total > 0 ? score / total : 0;
  return (RANKS.find((r) => ratio >= r.min) ?? RANKS[RANKS.length - 1]).rank;
}
