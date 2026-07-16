/** Stage label for a 0-based position — the difficulty arc, named. */
export function actFor(index: number, total: number): string {
  if (total <= 1 || index >= total - 1) return "THE FINAL EXHIBIT";
  const ratio = index / total;
  if (ratio < 0.3) return "WARM-UP";
  if (ratio < 0.7) return "FIELD WORK";
  return "EXPERT TIER";
}
