import { Logomark } from "./Logomark";

/**
 * The "SPOT THE BOT" wordmark. On mount it stamps into place — starts rotated
 * and oversized, then thunks flush (see .wordmark animation in index.css).
 * The signature detail from docs/DESIGN.md.
 */
export function Wordmark() {
  return (
    <span className="wordmark-lockup" aria-label="Spot the Bot">
      <Logomark />
      <span className="wordmark">
        <span className="wordmark__line">SPOT</span>
        <span className="wordmark__line wordmark__line--accent">THE BOT</span>
      </span>
    </span>
  );
}
