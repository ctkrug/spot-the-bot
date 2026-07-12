# Architecture — Spot the Bot

A static React + TypeScript single-page game. No backend: the passage bank is a
versioned JSON artifact bundled at build time. Vite builds one self-contained,
base-path-relative `dist/` deployable under a subpath.

## Run / test / build

```bash
npm install
npm run dev             # local dev server
npm test                # vitest (jsdom) — all pure logic + App integration
npm run test:coverage   # vitest --coverage (v8) — line coverage per module
npm run lint            # eslint
npm run build           # tsc -b && vite build -> dist/
npm run generate-bank   # write a new weekly bank (see Content pipeline)
npm run validate-bank <file>   # schema-check a bank, non-zero exit on failure
```

## Data flow

```
src/data/banks/<ISO-date>.json   weekly banks (retained; newest is "current")
src/data/seed-bank.json          committed fallback bank
        │
        ▼
currentBank.getCurrentBank()     import.meta.glob → pickLatestBankKey → loadBank
        │                        (falls back to seed if no valid weekly bank)
        ▼
App (state machine)  ── dealRound(rng) → 10 passages
        │
        ├─ game/state: submitGuess (append-only, no backtracking)
        ├─ audio/sfx: tap / correct / wrong / win  (WebAudio, lazy, mutable)
        │
        ▼ on completion
   scoring.scoreRound → RoundResult (score, fooled/accused, nemesis)
        │
        ├─ stats.recordRound → persist streak/best (localStorage)
        └─ Reveal: nemesis headline, tally, misses, share, play-again
```

## Modules

### Pure logic (`src/game/`, `src/data/`, `src/lib/`) — no React, fully unit-tested
- `game/rng.ts` — seedable mulberry32 PRNG + non-mutating Fisher-Yates shuffle.
- `game/bank.ts` — `isValidPassage` input guard, `sanitizePassages` (warn, don't
  crash), `loadBank`, `dealRound` (draw ≤ `ROUND_SIZE` without replacement).
- `game/scoring.ts` — `scoreRound`: score, fooled-by-AI vs wrongly-accused split,
  ranked fooling models, and the `nemesis` (a model that fooled you ≥2×).
- `game/state.ts` — immutable `GameState`; `submitGuess` only appends and no-ops
  once complete (enforces the no-back-button rule).
- `game/stats.ts` — `recordRound` streak/best rules + localStorage persistence.
- `game/share.ts` — spoiler-free share text (no passage content leaks).
- `data/selectBank.ts` — `bankDate` / `pickLatestBankKey` (ISO-week selection).
- `data/currentBank.ts` — glob banks, pick latest, fall back to seed.
- `lib/storage.ts` — fault-tolerant localStorage wrapper (degrades, never throws).

### Audio (`src/audio/sfx.ts`)
WebAudio-synthesized SFX (no binary assets). Lazy `AudioContext` on first play;
no-ops when unsupported (tests) or muted.

### UI (`src/components/`, `src/hooks/`, `src/App.tsx`)
- `App.tsx` — orchestrates the round: deal → play (tap transition, SFX, keyboard
  H/A) → reveal → play again.
- `components/` — `Wordmark` (stamp-in), `ProgressStrip`, `PassageCard` (hero),
  `VerdictButtons`, `MuteToggle`, `Reveal`.
- `hooks/useMute.ts` — mute preference bound to the SFX engine + localStorage.
- Styles: `index.css` (tokens/reset), `app.css` (component styles, neo-brutalist).

## Content pipeline (`scripts/`)
- `scripts/lib/bank-schema.mjs` — shared validation (mirrors `bank.ts`).
- `scripts/lib/content-pool.mjs` — curated human/AI passage pool + topical models.
- `scripts/lib/generate-bank-helpers.mjs` — pure helpers used by the generator
  (`isoWeekMonday`, `buildAiPassages`/`buildHumanPassages`, `parseArgs`), split
  out so they're unit-testable without touching argv/fs.
- `scripts/generate-bank.mjs` — assemble → validate → write `banks/<week>.json`
  (refuses overwrite; fails loudly on < 10 passages / < 4 styles).
- `scripts/validate-bank.mjs` — standalone validator CLI.
- `.github/workflows/refresh-bank.yml` — weekly (Mon 07:00 UTC) regeneration.
- `.github/workflows/ci.yml` — lint + test + build on every push/PR to `main`.

See `docs/PIPELINE.md` for the weekly cadence and the live-API seam.

## Testing notes

Core logic (`src/game/`, `src/data/`, `src/lib/`, `scripts/lib/*.mjs` minus the
static `content-pool.mjs`) sits at 100% line coverage. Property-based tests
(`fast-check`) cover the pure-math/parser modules — `rng.ts` (shuffle is a
permutation, mulberry32 stays in range), `scoring.ts` (score/fooled/accused
invariants), and the untrusted-input boundary in `bank.ts`/`bank-schema.mjs`
(arbitrary garbage never throws) — alongside the example-based suite.
