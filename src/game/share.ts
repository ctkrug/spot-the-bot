import { aiqFor, classify, topPercent } from "./aiq";
import type { RoundResult } from "./scoring";

export const SHARE_URL = "https://apps.charliekrug.com/spot-the-bot/";

export interface ShareContext {
  /** Daily case number, or null for a practice round. */
  caseNumber: number | null;
  /** Current daily streak (shown when >= 2 on a daily). */
  dailyStreak: number;
}

/** 🟩/🟥 per answer in order, chunked in fives for readability. */
export function emojiGrid(result: RoundResult): string {
  const cells = result.answers.map((a) => (a.correct ? "🟩" : "🟥"));
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 5) {
    rows.push(cells.slice(i, i + 5).join(""));
  }
  return rows.join(" ");
}

/**
 * Build the shareable score card. Spoiler-free by design: the grid shows
 * which positions were right or wrong, never what any passage was. The AIQ
 * number is the flex; the URL is the loop.
 */
export function buildShareText(result: RoundResult, ctx: ShareContext): string {
  const aiq = aiqFor(result.score, result.total);
  const lines: string[] = [];
  lines.push(ctx.caseNumber !== null ? `Spot the Bot — Case #${ctx.caseNumber}` : "Spot the Bot — practice round");
  lines.push(`AIQ ${aiq} 🧠 (${topPercent(aiq)}) — ${classify(aiq).title.toUpperCase()}`);
  lines.push(`${emojiGrid(result)} ${result.score}/${result.total}`);

  if (result.nemesis) {
    lines.push(`Fooled ${result.nemesis.count}× by ${result.nemesis.model} 🤖`);
  } else if (result.score === result.total && result.total > 0) {
    lines.push("Didn't fool me once 🕵️");
  }
  if (ctx.caseNumber !== null && ctx.dailyStreak >= 2) {
    lines.push(`🔥 ${ctx.dailyStreak}-day streak`);
  }
  lines.push(SHARE_URL);
  return lines.join("\n");
}
