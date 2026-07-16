# Spot the Bot

**Can you still tell human writing from AI?**

**▶ Live: [apps.charliekrug.com/spot-the-bot](https://apps.charliekrug.com/spot-the-bot/)**

[![CI](https://github.com/ctkrug/spot-the-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/spot-the-bot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Spot the Bot is a daily browser game. Every day deals the same ten short passages to
everyone — the **Daily Case**. Read each one, stamp a verdict (HUMAN or AI), and the card
flips to the receipt: who really wrote it, and the one-line tell that gives it away. At
the end: your score, a detective rank, an emoji grid to share (spoiler-free), and a streak
to defend at midnight.

## The honesty contract

Most guess-the-AI quizzes have a dirty secret: the "human" examples were written by
whoever made the quiz, and the model attributions are set dressing. Spot the Bot's whole
premise is that the labels are true:

- **Human passages are real, attributed, public-domain writing** — Scott's Antarctic
  diary, Pepys on the Great Fire, Keats's letters, Twain's travel notes, Grantland Rice's
  1924 Four Horsemen lede. The reveal names the author, work, and year. Where spelling was
  modernized or an excerpt condensed, the attribution says *(adapted)*.
- **AI passages were actually written by the model they name** — including a hard tier
  deliberately styled to pass as human. No model is ever credited with text it didn't
  produce.
- **Every passage carries a tell**: one honest sentence on what gives it away, shown after
  you guess. Play ten rounds and you've had a micro-lesson in reading machine text.

## Play

No install and no account. Open the [live game](https://apps.charliekrug.com/spot-the-bot/),
read the passage, and tap **HUMAN** or **AI** (or press `H` / `A`; space skips the reveal
strip). Ten exhibits, no back button. The Daily Case is the same for everyone — compare
grids without spoiling answers:

```
Spot the Bot — Case #5
🟩🟩🟥🟩🟩 🟩🟩🟥🟩🟩 8/10
SENIOR DETECTOR
Fooled 2× by Claude Fable 5 🤖
🔥 4-day streak
https://apps.charliekrug.com/spot-the-bot/
```

Daily streaks, best scores, and a score distribution live in a stats panel — all in
localStorage, no tracking. Finished the daily? Practice mode deals unlimited random
rounds from the same bank.

## How the bank works

1. `npm run generate-bank` assembles a dated bank (`src/data/banks/YYYY-MM-DD.json`) from
   `scripts/lib/content-pool.mjs` — the curated pool where every entry carries its honest
   attribution (`source` for humans, `model` + `tell` for AI). Validated before writing;
   a malformed or short bank never lands on disk.
2. With `--live` and an `ANTHROPIC_API_KEY`, the generator additionally asks the current
   frontier model for a dozen fresh passages (stamped with that model's real name) and
   merges them in. Without the key it warns and ships the offline pool — CI never breaks.
   See [`docs/PIPELINE.md`](docs/PIPELINE.md).
3. A GitHub Action regenerates the bank every Monday; old banks are kept. At build time
   the app plays the most recent bank dated on or before today, falling back to a
   committed seed bank so the game is never blank.
4. The Daily Case is dealt deterministically from the bank — seeded by the calendar date,
   stratified half human / half AI — so everyone gets the same case.

## Develop

```bash
npm install
npm run dev              # local dev server
npm test                 # vitest (jsdom)
npm run test:coverage    # coverage report (v8)
npm run lint
npm run build            # -> dist/ (static, subpath-relative)

npm run generate-bank                       # write this ISO week's bank
                                            # (refuses to overwrite an existing week;
                                            #  pass --force, or --week=YYYY-MM-DD)
npm run generate-bank -- --live             # + fresh passages from the frontier model
npm run validate-bank src/data/banks/2026-07-13.json
```

Core game logic (`src/game`, `src/data`, `src/lib`) is pure and heavily tested, with
`fast-check` property tests on the RNG, scoring, share text, and the untrusted-input
boundary. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the module map.

## Stack

- **TypeScript + React**, built with **Vite** into a static, self-contained bundle
- **Vitest** for unit and property-based tests
- WebAudio-synthesized sound effects, zero binary assets
- A Node content pipeline generates the weekly passage bank (offline pool + optional
  live frontier-model generation via the Anthropic SDK)

## License

MIT. See [`LICENSE`](LICENSE).

More of Charlie's projects → [apps.charliekrug.com](https://apps.charliekrug.com)
