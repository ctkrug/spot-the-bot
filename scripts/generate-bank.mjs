#!/usr/bin/env node
// Generate a weekly passage bank, dated by ISO week, and write it under
// src/data/banks/. Validates before writing and fails loudly (non-zero exit,
// no partial file) if the result is short on passages or styles.
//
// This offline generator assembles from a curated content pool so the pipeline
// runs with no API key in CI. The `buildAiPassages` step is the seam where a
// live frontier-model call would slot in (see docs/PIPELINE.md): swap the pool
// for prompted output tagged with the topical model, keep the same schema.
//
// Usage:
//   node scripts/generate-bank.mjs [--week=YYYY-MM-DD] [--force]

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_PASSAGES, MIN_STYLES, validateBank } from "./lib/bank-schema.mjs";
import { CONTENT_POOL, TOPICAL_MODELS } from "./lib/content-pool.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BANKS_DIR = join(ROOT, "src", "data", "banks");

function fail(message) {
  process.stderr.write(`generate-bank: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { force: false, week: null };
  for (const a of argv) {
    if (a === "--force") args.force = true;
    else if (a.startsWith("--week=")) args.week = a.slice("--week=".length);
    else fail(`unknown argument: ${a}`);
  }
  return args;
}

/** Monday of the ISO week containing `date`, as YYYY-MM-DD. */
function isoWeekMonday(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // Sunday(0) -> 7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Assemble AI-origin passages, stamping each with a topical model. In a live
 * pipeline these strings would come from prompting that model; here they come
 * from the pool. Round-robins the topical models so the week's bank features
 * whichever models are current.
 */
function buildAiPassages(models) {
  return CONTENT_POOL.ai.map((p, i) => ({
    ...p,
    origin: "ai",
    model: models[i % models.length],
  }));
}

function buildHumanPassages() {
  return CONTENT_POOL.human.map((p) => ({ ...p, origin: "human" }));
}

const args = parseArgs(process.argv.slice(2));
const week = args.week ?? isoWeekMonday(new Date());
if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) fail(`--week must be YYYY-MM-DD, got "${week}"`);

const outPath = join(BANKS_DIR, `${week}.json`);
if (existsSync(outPath) && !args.force) {
  fail(`bank for ${week} already exists at ${outPath} (use --force to overwrite)`);
}

const bank = {
  weekOf: week,
  passages: [...buildHumanPassages(), ...buildAiPassages(TOPICAL_MODELS)],
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
