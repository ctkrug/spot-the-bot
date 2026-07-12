---
title: "Building Spot the Bot: a human-or-AI game whose content refreshes itself"
published: false
tags: typescript, react, webdev, sideproject
---

Every "guess the AI" quiz I have played has the same flaw: it ships ten hardcoded examples
once and never touches them again. It is fun for a week, then it is a museum piece, because
model writing moves faster than any hand-picked list. So I built [Spot the
Bot](https://apps.charliekrug.com/spot-the-bot/), a two-minute browser game where you read
ten short passages and guess human or AI on each. The twist is that the passages regenerate
every week. Two build decisions made that work, and both were more interesting than the UI.

## 1. The passage bank is a versioned artifact, not a database

There is no backend. The content lives as dated JSON files, one per ISO week:
`src/data/banks/2026-07-06.json`. At build time Vite inlines every one of them:

```ts
const bankModules = import.meta.glob("./banks/*.json", { eager: true });
```

Then a pure function picks which one to play. The rule sounds trivial but has a sharp edge:
play the most recent bank, but never one dated in the future. I generate some weeks ahead of
time, and a bank prepped for next Monday must not go live early just because it sorts last.

```ts
export function pickLatestBankKey(keys, now) {
  let best = null, bestDate = "";
  for (const key of keys) {
    const date = bankDate(key);
    if (date === null) continue;
    if (now !== undefined && date > now) continue; // not live until its week arrives
    if (best === null || date > bestDate) { best = key; bestDate = date; }
  }
  return best;
}
```

Because ISO dates sort lexicographically, "newest" is just a string compare. No date parsing,
no timezones. Keeping this logic pure and separate from the Vite glob meant I could unit-test
the whole selection story without mocking the filesystem, and it caught a real bug: an
early-shipping future bank, found by a test, not by a user.

## 2. Treat generated content as hostile input

The passages are machine-generated, so I do not trust them at the boundary. Every bank runs
through a type guard on load, and a single bad record warns instead of crashing the round:

```ts
export function sanitizePassages(raw, warn = console.warn) {
  const valid = [];
  raw.forEach((entry, i) => {
    if (isValidPassage(entry)) valid.push(entry);
    else warn(`dropping malformed passage at index ${i}`);
  });
  return valid;
}
```

If the whole bank is unreadable, the app falls back to a committed seed bank, so the game is
never blank. I fuzzed this path with `fast-check`: arbitrary garbage objects should always
produce either a valid passage or a dropped one, never a throw. That property found more edge
cases than any example test I would have written by hand.

## 3. Sound with zero binary assets

Every sound effect is synthesized in code with WebAudio: a square-wave blip on a tap, a rising
triangle chime when you are right, a low sawtooth buzz when you are wrong. No `.mp3` files in
the bundle. The two gotchas were the autoplay policy (create the `AudioContext` lazily on the
first user gesture, not on load) and tests (jsdom has no `AudioContext`, so every call guards
for its absence and no-ops). Rounds also deal from a seeded `mulberry32` PRNG, which keeps the
shuffle reproducible under test while still feeling random in play.

## What I would do differently

The SEO copy under the game is client-rendered React, so the first-paint HTML is thin. For a
content page that wants to rank, I would prerender that section to static HTML next. And the
generator currently draws from a curated offline pool so CI needs no API key; wiring a live
model call is a single documented seam I left open on purpose.

Code and the full pipeline writeup are on
[GitHub](https://github.com/ctkrug/spot-the-bot). Play a round and tell me your score.
