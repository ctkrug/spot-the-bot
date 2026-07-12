export type PassageOrigin = "human" | "ai";

export interface Passage {
  id: string;
  text: string;
  origin: PassageOrigin;
  /** Style bucket the passage was written in, e.g. "news lede", "diary entry". */
  style: string;
  /** Model name for ai-origin passages, e.g. "Claude 5 Sonnet". Absent for human passages. */
  model?: string;
}

export interface PassageBank {
  /** ISO date the bank was generated, e.g. "2026-07-06". */
  weekOf: string;
  passages: Passage[];
}
