# Spot the Bot

**Can you still tell human writing from AI?**

**▶ Live demo: [apps.charliekrug.com/spot-the-bot](https://apps.charliekrug.com/spot-the-bot/)**

[![CI](https://github.com/ctkrug/spot-the-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/spot-the-bot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Spot the Bot is a two-minute browser game. You read ten short passages, one at a time, and
guess for each whether a human or an AI wrote it. Then the reveal: your score, the passages
that fooled you, and the name of the model that fooled you twice.

The point is the content. Most guess-the-AI quizzes hardcode ten examples once and go stale
in a month. Spot the Bot regenerates its passage bank every Monday against whatever model is
topical that week, and keeps every past bank, so the round you play is never older than the
current week.

## Play

No install and no account. Open the [live demo](https://apps.charliekrug.com/spot-the-bot/),
read the passage, and tap **HUMAN** or **AI** (or press `H` / `A`). Ten rounds, no back
button. Your streak and best score save locally; the share card is spoiler-free so posting a
score never leaks the week's answers.

## A sample passage

> **EXHIBIT 03/10** · diary entry
>
> Today was a meaningful reminder that life's small moments matter most. I paused to
> appreciate the morning light and felt grateful for the quiet beauty that surrounds us
> every single day.

Human or bot? That one is AI. The tells are the tidy summary sentence and the even, grateful
tone; a real diary tends to be messier and more specific. Guess right or wrong and the
reveal names the model. The share card looks like this:

```
Spot the Bot 8/10
Fooled 2× by Claude 5 Sonnet 🤖
Week of 2026-07-06
```

## How the weekly bank works

1. A scheduled script prompts the week's topical model for short passages across a mix of
   styles (news lede, product review, diary entry, recipe intro, and more) and pairs each
   with a length- and subject-matched human passage.
2. The set is shuffled, de-identified, validated, and written to a dated bank file
   (`src/data/banks/YYYY-MM-DD.json`). A malformed or short bank never lands on disk.
3. At build time the app loads the most recent bank dated on or before today, falling back
   to a committed seed bank so the game is never blank.
4. Old banks are kept, so any week's round draws from writing no older than that week.

The generator currently draws AI passages from a curated offline pool so CI needs no API
key. Swapping in a live model call is a single documented seam. See
[`docs/PIPELINE.md`](docs/PIPELINE.md).

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
npm run generate-bank -- --week=2026-08-03
npm run validate-bank src/data/banks/2026-07-13.json
```

Core game logic (`src/game`, `src/data`, `src/lib`) is pure and sits at 100% line coverage,
with `fast-check` property tests on the RNG, scoring, and the untrusted-input boundary.
See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the module map.

## Stack

- **TypeScript + React**, built with **Vite** into a static, self-contained bundle
- **Vitest** for unit and property-based tests
- WebAudio-synthesized sound effects, zero binary assets
- A Node content-pipeline script generates the weekly passage bank

## License

MIT. See [`LICENSE`](LICENSE).

More of Charlie's projects → [apps.charliekrug.com](https://apps.charliekrug.com)
