# Design — Spot the Bot

## 1. Aesthetic direction

**Neo-brutalist poster.** Spot the Bot reads like a wanted-poster / interrogation
zine: bold flat color blocks, thick black outlines, stark hard-offset shadows (no blur),
and stamped, all-caps condensed display type. The tone is playful accusation — every
passage is a suspect on trial, every tap is a verdict stamped onto the card.

This is a first ship for this portfolio slot, so there's no prior-run palette to avoid;
the direction is chosen on its own merits as a deliberate departure from the generic
"dark gray cards + one accent" default.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F5F1E8` (warm paper) | page background |
| `--color-surface` | `#FFFFFF` | primary card surface |
| `--color-surface-alt` | `#E8E2D4` | secondary surface / recessed panels |
| `--color-text` | `#191510` (near-black) | body + headings |
| `--color-text-muted` | `#6B6355` | captions, metadata |
| `--color-accent` | `#FF4B3E` (hot coral) | the "AI" verdict, danger, primary CTA |
| `--color-accent-support` | `#2D5BFF` (electric blue) | the "human" verdict, links |
| `--color-success` | `#2BAA6E` | correct-guess feedback |
| `--color-danger` | `#FF4B3E` (= accent) | wrong-guess feedback |

Dark mode: bg `#1C1812`, surface `#262019`, surface-alt `#302921`, text `#F5F1E8`, muted
`#B8AE9C` — same accents, hard shadow darkens to `#0C0A07` (see `src/index.css`).

- **Type pairing:** display = **Space Grotesk** (700 for headings/wordmark, 500 for
  subheads), UI/body = **IBM Plex Mono** (400/600) — the mono ties visually to "reading
  code-like text and judging its author," system-ui/monospace fallbacks for both.
- **Spacing unit:** 8px scale — 4/8/16/24/32/48 (`--space-1` … `--space-6`).
- **Corner radius:** sharp — `4px` everywhere, never pill-shaped or fully rounded.
- **Depth:** hard offset shadow, no blur — `4px 4px 0 var(--color-text)`. Depth comes from
  the offset + thick `3px` borders, not soft blur, consistent with the poster/stamp feel.
- **Motion:** UI transitions 180ms ease-out; game feedback (tap response, card stamp) 100ms
  ease-out — punchy, not floaty.

## 3. Layout intent

The hero is **the passage card + the two verdict buttons** — this is what the player is
looking at for 90% of a round, so it owns the composition.

- **Desktop (1440×900):** a centered stage ~680px wide, ~65vh tall, holding: a 10-dot
  progress strip at the top, the passage card filling the middle (generous padding, large
  type, room to breathe), and the HUMAN / AI buttons anchored at the bottom of the stage
  as full-width halves. The paper background carries a subtle grain/dot-pattern texture
  outside the stage so the edges of the viewport are never a dead flat color.
- **Phone (390×844):** the stage becomes the full viewport minus a slim header (wordmark
  + progress dots); the passage card takes the majority of vertical space; the two
  verdict buttons become large fixed-bottom touch targets (≥56px tall) so they're
  reachable one-thumb.
- The reveal screen is a full-bleed overlay (not a modal box) — it replaces the stage
  entirely so the score moment gets the whole screen, not a shared split with the game.

## 4. Signature detail

The wordmark "SPOT THE BOT" **stamps down** on load — starts rotated a few degrees and
slightly oversized, then thunks into place with a short overshoot (like a rubber stamp
hitting paper), accompanied by the stamp SFX. It's the first thing a visitor sees and it
sets the tone (accusation, verdict, judgment) before any copy is read.

## 5. Juice plan

- **Movement tween:** the passage card slides/stamps in from the right (120ms ease-out)
  at the start of each round; tapping a verdict button gives the card a quick tilt in the
  direction of the chosen button (100ms) before it flips away.
- **Impact feedback:** on tap, the chosen button briefly "presses" (scale + shadow
  collapses from hard-offset to flush, mimicking a physical stamp press).
- **Goal/success pop:** a correct guess pops a small coral/blue "CORRECT" stamp graphic
  over the card with a quick scale-bounce; a wrong guess triggers a short shake + the
  card's border flashes red.
- **Win celebration:** the reveal overlay drops in torn "paper scrap" confetti (CSS
  shapes, not images) in the accent colors, shows the score large, and names the model
  that fooled the player most (when metadata allows), with one clear "Play again" CTA.
- **Synth SFX (WebAudio, generated in code — no audio files):**
  - `tap` — short square-wave blip (~60ms) on every verdict tap
  - `correct` — quick two-tone rising chime (sine, ~150ms)
  - `wrong` — short low sawtooth buzz (~150ms)
  - `stamp` — a thump (filtered noise burst, ~80ms) on the wordmark intro and round-start
    card entrance
  - `win` — a short three-note ascending arpeggio on the reveal screen
  - All SFX gain-staged low and rate-throttled (no more than one `tap` sound per 80ms).
  - A mute toggle (top corner, icon button) persists its state in `localStorage`; the
    `AudioContext` is created lazily on first tap (autoplay policy) and every sound call
    is guarded for environments where `AudioContext` is unavailable (tests, some browsers).
  - `prefers-reduced-motion` drops the shake/confetti/tilt but keeps the stamp state
    changes and sound (sound is not motion).
