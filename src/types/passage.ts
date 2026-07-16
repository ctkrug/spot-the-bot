export type PassageOrigin = "human" | "ai";

export interface Passage {
  id: string;
  text: string;
  origin: PassageOrigin;
  /** Style bucket the passage was written in, e.g. "news lede", "diary entry". */
  style: string;
  /** Model that actually wrote an ai-origin passage. Absent for human passages. */
  model?: string;
  /** Real attribution for a human passage, e.g. "Mark Twain, The Innocents Abroad, 1869". */
  source?: string;
  /** One-line lesson shown after the guess — the tell that gives the passage away. */
  tell?: string;
  /** Editorial difficulty, 1 (easy) – 3 (hard). */
  difficulty?: 1 | 2 | 3;
}

export interface PassageBank {
  /** ISO date the bank was generated, e.g. "2026-07-06". */
  weekOf: string;
  passages: Passage[];
}
