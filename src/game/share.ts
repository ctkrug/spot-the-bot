import type { RoundResult } from "./scoring";

/**
 * Build a shareable score summary. Deliberately omits all passage text so
 * sharing never spoils the week's bank for other players. Names the nemesis
 * model when one fooled the player twice or more (the shareable hook).
 */
export function buildShareText(result: RoundResult, weekOf: string): string {
  const lines: string[] = [];
  lines.push(`Spot the Bot — ${result.score}/${result.total}`);

  if (result.nemesis) {
    lines.push(`Fooled ${result.nemesis.count}× by ${result.nemesis.model} 🤖`);
  } else if (result.fooledByAiCount > 0) {
    lines.push(`AI slipped ${result.fooledByAiCount} past me`);
  } else if (result.score === result.total) {
    lines.push(`Didn't fool me once 🕵️`);
  }

  lines.push(`Week of ${weekOf}`);
  return lines.join("\n");
}
