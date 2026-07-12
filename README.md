# Spot the Bot

Ten short passages. You tap **human** or **AI** on each. Then the reveal: how many you
got right, and which model — the one everyone's talking about this week — fooled you twice.

## Why

Most "guess the AI" quizzes ship once with a hardcoded set of examples that go stale
within a month. Spot the Bot doesn't: its passage bank regenerates on a schedule against
whatever frontier model is actually topical, so the quiz you play in March is testing you
against different writing than the one you played in January. The interesting part isn't
the UI — it's the content pipeline that keeps the game honest.

## How it works

1. A scheduled job prompts the current topical model for short passages across a mix of
   styles (news lede, product review, diary entry, recipe intro, etc.) and pairs each one
   with a human-written passage matched for length and subject.
2. The pair set is shuffled, de-identified, and written into a dated passage bank.
3. The web app deals you ten passages from the freshest bank, one at a time. Tap **human**
   or **AI**. No going back.
4. After round ten: your score, a breakdown of which passages fooled you, and — the
   moment — which model (if any) is responsible for the passages you flagged human twice
   in a row.
5. Share your score. Come back next week and the bank has moved on.

## Planned features

- [ ] Ten-round core game loop with instant tap feedback and a scored reveal
- [ ] Weekly-refreshing passage bank generated against the current topical model
- [ ] Share-your-score card (image/text) for socials
- [ ] Streak tracking and play-again flow, stored locally
- [ ] Fully static build, deployable under a subpath with no backend

## Stack

- **TypeScript + React** for the app, built with **Vite**
- **Vitest** for unit tests
- Static, self-contained output — no server required at runtime
- A small Node/TypeScript content-pipeline script generates the weekly passage bank

## Status

Early scaffold — see [`docs/VISION.md`](docs/VISION.md) for the full plan and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for what's being built next.

## License

MIT — see [`LICENSE`](LICENSE).
