/**
 * AIQ — how sharp is your AI radar, on an IQ-style scale.
 *
 * Anchors (per the spec): a coin-flip 5/10 sits at exactly 100 (dead average),
 * a perfect round is 160, a perfect miss is 40. Linear in between, mean 100,
 * SD 15 — so the percentile line ("top 0.4%") is real normal-curve math,
 * which is most of the joke.
 */

export interface AiqClass {
  title: string;
  blurb: string;
}

/** Map a round score to AIQ. 5/10 → 100, 10/10 → 160, 0/10 → 40. */
export function aiqFor(score: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round(100 + (score / total - 0.5) * 120);
}

/** Standard normal CDF (Abramowitz–Stegun approximation). */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

/**
 * Share of the population you out-detect, as a "top X%" string. AIQ 100 is
 * "top 50%" — accurate and a little bit rude, which is the intended tone at
 * the bottom of the scale ("top 97%" means what it means).
 */
export function topPercent(aiq: number): string {
  const above = (1 - normalCdf((aiq - 100) / 15)) * 100;
  if (above < 0.01) return "top 0.01%";
  if (above < 1) return `top ${above.toFixed(1).replace(/\.0$/, "")}%`;
  return `top ${Math.round(above)}%`;
}

const CLASSES: { min: number; cls: AiqClass }[] = [
  { min: 156, cls: { title: "Chief Turing Examiner", blurb: "Perfect detection. The bots are filing a formal complaint." } },
  { min: 142, cls: { title: "Bot Whisperer", blurb: "You can smell a language model through the screen." } },
  { min: 130, cls: { title: "Senior Detector", blurb: "One or two ghosts in the machine got past you. Barely." } },
  { min: 118, cls: { title: "Trained Eye", blurb: "You've read enough slop to know slop. It shows." } },
  { min: 106, cls: { title: "Promising Recruit", blurb: "Better than average. The academy sees potential." } },
  { min: 94, cls: { title: "Average Human", blurb: "Perfectly calibrated. Statistically, a coin flip with feelings." } },
  { min: 82, cls: { title: "Easily Delved", blurb: "The tapestry was rich, and you bought every thread." } },
  { min: 64, cls: { title: "Botfished", blurb: "Hook, line, and large language model." } },
  { min: 0, cls: { title: "Certified Mark", blurb: "The bots have a group chat about you." } },
];

/** Classification band for an AIQ. */
export function classify(aiq: number): AiqClass {
  return (CLASSES.find((c) => aiq >= c.min) ?? CLASSES[CLASSES.length - 1]).cls;
}
