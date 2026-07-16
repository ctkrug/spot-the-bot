#!/usr/bin/env node
// Generate a weekly passage bank, dated by ISO week, and write it under
// src/data/banks/. Validates before writing and fails loudly (non-zero exit,
// no partial file) if the result is short on passages or styles.
//
// Two modes:
//   offline (default) — assembles from the curated pool in lib/content-pool.mjs.
//     Runs in CI with no API key. Every pool passage carries its own honest
//     model/source attribution.
//   --live (or LIVE_BANK=1) — additionally generates fresh AI passages from the
//     current frontier model via the Anthropic SDK. Requires ANTHROPIC_API_KEY;
//     on any failure (missing key, API error, invalid output) it warns and
//     falls back to the offline pool, so the weekly refresh can never break.
//
// Usage:
//   node scripts/generate-bank.mjs [--week=YYYY-MM-DD] [--force] [--live]

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_PASSAGES, MIN_STYLES, validateBank, validatePassage } from "./lib/bank-schema.mjs";
import { CONTENT_POOL } from "./lib/content-pool.mjs";
import { buildAiPassages, buildHumanPassages, isoWeekMonday, parseArgs } from "./lib/generate-bank-helpers.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BANKS_DIR = join(ROOT, "src", "data", "banks");

/** Model used for live generation; the stamp shown in-game derives from it. */
const LIVE_MODEL = process.env.BANK_MODEL ?? "claude-opus-4-8";
const MODEL_DISPLAY_NAMES = {
  "claude-opus-4-8": "Claude Opus 4.8",
  "claude-opus-4-7": "Claude Opus 4.7",
  "claude-sonnet-5": "Claude Sonnet 5",
  "claude-haiku-4-5": "Claude Haiku 4.5",
  "claude-fable-5": "Claude Fable 5",
};

function fail(message) {
  process.stderr.write(`generate-bank: ${message}\n`);
  process.exit(1);
}

function warn(message) {
  process.stderr.write(`generate-bank: ${message}\n`);
}

/**
 * Live seam: ask the current frontier model for fresh AI passages in the
 * pool's styles, stamped with the model that actually wrote them. Returns []
 * (never throws) when the key is missing or anything fails, so offline
 * content always carries the bank.
 */
async function generateLiveAiPassages(week) {
  if (!process.env.ANTHROPIC_API_KEY) {
    warn("--live requested but ANTHROPIC_API_KEY is not set — using offline pool only");
    return [];
  }
  const styles = [...new Set(CONTENT_POOL.human.map((p) => p.style))];
  const schema = {
    type: "object",
    properties: {
      passages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            style: { type: "string", enum: styles },
            tell: { type: "string" },
            difficulty: { type: "integer", enum: [1, 2, 3] },
          },
          required: ["text", "style", "tell", "difficulty"],
          additionalProperties: false,
        },
      },
    },
    required: ["passages"],
    additionalProperties: false,
  };
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const response = await client.messages.create({
      model: LIVE_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema } },
      messages: [
        {
          role: "user",
          content:
            `Write 12 short passages (20-55 words each) for a "human or AI?" guessing game, spread across these styles: ${styles.join(", ")}. ` +
            "Make them HARD to identify as AI: specific, a little messy, never even-toned brochure copy. " +
            "Include a few in convincing period voice (a polar diary, a Victorian letter, an old wire dispatch) since the human passages are public-domain classics. " +
            "For each, `tell` is one honest sentence a sharp reader could use to spot it as machine-written — a real critique of your own passage, not a compliment. " +
            "difficulty: 1 = obvious AI register, 2 = plausible, 3 = would fool most readers.",
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      warn("live generation refused — using offline pool only");
      return [];
    }
    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = JSON.parse(text);
    const stamp = MODEL_DISPLAY_NAMES[LIVE_MODEL] ?? LIVE_MODEL;
    const passages = parsed.passages.map((p, i) => ({
      id: `live-${week}-${i + 1}`,
      ...p,
      origin: "ai",
      model: stamp,
    }));
    const valid = passages.filter((p, i) => {
      const errors = validatePassage(p, i);
      if (errors.length > 0) warn(`dropping invalid live passage: ${errors.join("; ")}`);
      return errors.length === 0;
    });
    warn(`live generation: ${valid.length} fresh passages from ${stamp}`);
    return valid;
  } catch (err) {
    warn(`live generation failed (${err.message}) — using offline pool only`);
    return [];
  }
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (err) {
  fail(err.message);
}
const week = args.week ?? isoWeekMonday(new Date());
if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) fail(`--week must be YYYY-MM-DD, got "${week}"`);

const outPath = join(BANKS_DIR, `${week}.json`);
if (existsSync(outPath) && !args.force) {
  fail(`bank for ${week} already exists at ${outPath} (use --force to overwrite)`);
}

const live = args.live || process.env.LIVE_BANK === "1" ? await generateLiveAiPassages(week) : [];

const bank = {
  weekOf: week,
  passages: [...buildHumanPassages(CONTENT_POOL.human), ...buildAiPassages(CONTENT_POOL.ai), ...live],
};

// Validate BEFORE writing so a malformed bank never lands on disk.
const { errors, validCount, styles } = validateBank(bank);
if (errors.length > 0) {
  fail(`generated bank is invalid:\n  - ${errors.join("\n  - ")}`);
}
if (validCount < MIN_PASSAGES) {
  fail(`generated only ${validCount} valid passages (need >= ${MIN_PASSAGES})`);
}
if (styles.length < MIN_STYLES) {
  fail(`generated only ${styles.length} styles (need >= ${MIN_STYLES})`);
}

mkdirSync(BANKS_DIR, { recursive: true });
writeFileSync(outPath, JSON.stringify(bank, null, 2) + "\n", "utf8");
process.stdout.write(
  `generate-bank: wrote ${outPath} — ${validCount} passages across ${styles.length} styles\n`,
);
