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
3. At build time the app globs `src/data/banks/*.json`, plays the **most recent**
   by ISO date, and falls back to `src/data/seed-bank.json` if none are valid —
   so the game is never blank.

## The live-API seam

Today the generator draws AI passages from a curated offline pool so the
pipeline runs in CI with **no API key**. To go live:

1. Replace `buildAiPassages` in `scripts/generate-bank.mjs` with a call to the
   current frontier model (e.g. the Anthropic SDK), prompting for short passages
   in each style. Keep the same output schema: `{ id, text, origin: "ai",
   style, model }`, `model` set to the model you actually called.
2. Add the API key as a repository secret and reference it in
   `refresh-bank.yml`.
3. Update `TOPICAL_MODELS` when the topical model of the week changes (the human
   half of the pool can stay; it's length- and style-matched ballast).

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
