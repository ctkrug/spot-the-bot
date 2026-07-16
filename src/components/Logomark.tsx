/**
 * The Spot the Bot mark: a magnifying glass over a fingerprint split down the
 * middle — human ridges on the left, a circuit trace on the right. The
 * question the whole game asks, as one glyph. Same geometry as
 * public/favicon.svg; here it rides CSS vars so it themes with dark mode.
 */
export function Logomark() {
  return (
    <svg viewBox="0 0 64 64" className="logomark" aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="14" fill="var(--color-text)" />
      <circle cx="26" cy="26" r="13" fill="var(--color-text)" stroke="var(--color-bg)" strokeWidth="5" />
      <path
        d="M19 19a10 10 0 0 0 0 14"
        fill="none"
        stroke="var(--color-accent-support)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M22.5 16.5a14 14 0 0 0 0 19"
        fill="none"
        stroke="var(--color-accent-support)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M31 19v5h4v5"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="24" r="2.2" fill="var(--color-gold)" />
      <line x1="36" y1="36" x2="50" y2="50" stroke="var(--color-bg)" strokeWidth="6.5" strokeLinecap="round" />
    </svg>
  );
}
