# Backlog — Spot the Bot

Stories are marked `[ ]` until done. Every story lists concrete, checkable acceptance
criteria — no vibes.

## Epic 1 — Core game loop (the wow moment)

- [x] **Play a full 10-round quiz with tap-to-guess and a scored reveal** *(wow moment)*
  - Loading the app deals exactly 10 passages, one at a time, from the current bank.
  - Tapping HUMAN or AI immediately advances to the next passage; there is no back button
    and no way to change a submitted answer.
  - After the 10th answer, a reveal screen shows the score (e.g. "7/10"), lists which of
    the 10 passages were answered wrong, and — when the wrong passages include an
    AI-origin passage with `model` metadata — names that model by name.
  - Refreshing the page after the reveal starts a brand-new round rather than resuming.

- [x] **Passage bank data model + static seed set**
  - `Passage`/`PassageBank` types (already scaffolded) are used end-to-end by the game
    loop with no `any`-typed access to passage fields.
  - The seed bank has at least 20 passages so a 10-round game can sample without
    obvious repeats within a single session.
  - Malformed entries (missing `text` or invalid `origin`) are filtered out at load time
    with a console warning, not a crash.

- [x] **Score reveal screen shows fooled-by callouts**
  - The reveal distinguishes "fooled by AI" (guessed human, was AI) from "wrongly accused
    human" (guessed AI, was human) with separate counts.
  - If the player was fooled twice or more by the same model, the reveal calls that model
    out by name in a headline stat (the wow-moment payoff).
  - The reveal is reachable and legible at both 390px and 1440px widths.

- [x] **Design polish for the core loop**
  - The passage card, verdict buttons, and progress strip match the tokens and layout
    intent in `docs/DESIGN.md` (colors, type pairing, hard-shadow depth, spacing scale).
  - Tap feedback (card tilt, button press, correct/wrong pop) and at minimum the `tap`,
    `correct`, and `wrong` synth SFX from the juice plan are implemented with a working,
    localStorage-persisted mute toggle.
  - `prefers-reduced-motion` is honored (shake/confetti/tilt drop, function is kept).

## Epic 2 — Weekly content pipeline

- [ ] **Script generates a new passage bank against a topical model**
  - A documented script (`npm run generate-bank` or equivalent) produces a `PassageBank`
    JSON file containing both AI-origin and human-origin passages across at least 4
    distinct styles (news lede, product review, diary entry, recipe intro, or similar).
  - Every AI-origin passage in the script's output has a non-empty `model` field.
  - Running the script twice against the same inputs does not silently overwrite the
    previous week's bank file — old banks are retained (see next story).

- [ ] **Passage bank versioning by week**
  - Bank files are stored dated by ISO week (e.g. `banks/2026-07-06.json`) and the app
    loads the most recent one by filename/date, not a hardcoded path.
  - A manifest or directory listing lets the build determine "current" vs. "past" banks
    without hardcoding a filename in app code.

- [ ] **CI job refreshes the bank on a schedule**
  - A separate GitHub Actions workflow (or a documented cron-triggered job, since bank
    generation needs an API key CI won't have by default) is specified with the exact
    trigger cadence (weekly) and the exact command it runs — this can be a scheduled
    workflow stub that documents the manual/future trigger if live API access isn't
    wired up yet, but the mechanism and cadence must be explicit, not hand-waved.
  - The workflow (or documented process) fails loudly (non-zero exit, no partial file
    write) if generation produces fewer than 10 valid passages.

- [ ] **Validate and gracefully degrade on malformed generated content**
  - A schema check rejects a generated bank missing required fields before it's written
    to disk, with a non-zero exit code and a clear stderr message.
  - If no valid bank exists at build time, the app falls back to the committed seed bank
    rather than shipping a blank game.

## Epic 3 — Share & replay

- [ ] **Share-your-score card**
  - After the reveal, a "Share" action produces a copyable text summary (score + the
    model that fooled the player, if any) with one click/tap, confirmed by a visible
    "copied" state.
  - The shared text never includes the full passage content (respects source brevity /
    avoids spoiling the bank for others).

- [ ] **Play-again flow with local streak tracking**
  - A "Play again" CTA on the reveal starts a new round without a full page reload.
  - The player's best score and current streak (consecutive rounds ≥ 8/10, or a
    documented threshold) persist in `localStorage` and are visible somewhere in the UI.
  - Clearing `localStorage` resets the streak to zero without breaking the app.

- [ ] **Design polish for share/results**
  - The share card and streak display use the same tokens/type pairing as the core loop
    (no visual seam between "the game" and "the results").
  - Touch targets for share/play-again meet the ≥44px minimum and have themed hover/focus/
    active states.

## Epic 4 — Deploy & polish

- [ ] **Static build deployable under a subpath**
  - `npm run build` produces a single self-contained output directory with only relative
    asset paths (verified by grepping the built HTML/JS for a leading `/` in an asset
    URL and finding none).
  - The built site, when served from an arbitrary subpath via a local static server,
    loads with no broken asset requests in the network tab.

- [ ] **Accessibility pass**
  - Every interactive control (verdict buttons, mute toggle, share, play again) is
    reachable by keyboard with a visible focus ring and has an accessible name.
  - The round progress and reveal score are announced via an ARIA live region for
    screen-reader users.
  - Touch controls exist for every interaction — no mouse-only or hover-only affordance.

- [ ] **Landing copy explaining the weekly-refresh mechanic**
  - The landing/about copy states, in plain language, that the passage bank changes on a
    weekly cadence and names the current bank's "week of" date somewhere on the page.
  - No lorem-ipsum or bracketed placeholder text remains anywhere in shipped copy.
