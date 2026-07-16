# Content pipeline — Spot the Bot

The passage bank is what makes the game more than a static quiz. It's a
versioned JSON artifact, regenerated weekly, retained forever.

## Cadence

**Weekly**, on the Monday that starts each ISO week. Frontier-model releases and
the surrounding news cycle move on a weekly rhythm; a daily refresh would mostly
reshuffle the same underlying model with no new signal.

The schedule lives in `.github/workflows/refresh-bank.yml`
(`cron: "0 7 * * 1"` — Monday 07:00 UTC), plus manual `workflow_dispatch`.

## What a run does

1. `npm run generate-bank` assembles a bank for the current ISO week:
   - Human passages + AI passages across ≥ 4 styles (diary, review, news,
     recipe, social, email, travel).
   - Every AI passage is stamped with a **topical model** for the week
     (`TOPICAL_MODELS` in `scripts/lib/content-pool.mjs`).
   - Output is **validated before writing** — a malformed or short bank never
     lands on disk. Fails loudly (non-zero exit) on < 10 valid passages or
     < 4 distinct styles.
   - Writes `src/data/banks/<YYYY-MM-DD>.json`. **Refuses to overwrite** an
     existing week unless `--force`, so past banks are retained.
2. The workflow re-validates every bank file and commits any new week.
3. At build time the app globs `src/data/banks/*.json` and plays the most
   recent bank dated **on or before the build date** — a week prepped ahead
   of schedule (see `--week=` below) sits in the repo without going live
   until its Monday actually arrives — falling back to
   `src/data/seed-bank.json` if none are valid, so the game is never blank.

## Live generation (implemented, key-gated)

The generator has two sources, merged into one bank:

- **Offline pool** (`scripts/lib/content-pool.mjs`) — always included. Human
  passages are real public-domain writing with `source` attributions; AI
  passages carry the `model` that actually wrote them plus a `tell`.
- **Live passages** — with `--live` (the weekly workflow passes it) and an
  `ANTHROPIC_API_KEY`, `generate-bank.mjs` asks the current frontier model
  (env `BANK_MODEL`, default `claude-opus-4-8`) for ~12 fresh passages across
  the pool's styles, stamps them with that model's real display name, and
  validates each before merging. On a missing key or any API/parse failure it
  warns and ships the offline pool alone — the refresh can never break.

To turn live generation on, add `ANTHROPIC_API_KEY` as a repository secret;
`refresh-bank.yml` already passes it through. The honesty rule is enforced in
the schema: an AI passage must name its real producing model, and a human
passage must not claim one.

The schema validator (`scripts/lib/bank-schema.mjs`) is the contract between
generation and the app — as long as generated output passes it, nothing
downstream changes.

## Manual use

```bash
npm run generate-bank                 # current ISO week
npm run generate-bank -- --week=2026-08-03
npm run generate-bank -- --force      # overwrite the current week
npm run validate-bank src/data/banks/2026-07-13.json
```
