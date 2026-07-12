#!/usr/bin/env node
// Validate a passage-bank JSON file against the schema. Exits non-zero with a
// clear stderr message on any failure, so CI/build can gate on it.
//
// Usage: node scripts/validate-bank.mjs <path-to-bank.json>

import { readFileSync } from "node:fs";
import { MIN_PASSAGES, MIN_STYLES, validateBank } from "./lib/bank-schema.mjs";

function fail(message) {
  process.stderr.write(`validate-bank: ${message}\n`);
  process.exit(1);
}

const path = process.argv[2];
if (!path) fail("usage: validate-bank.mjs <path-to-bank.json>");

let raw;
try {
  raw = JSON.parse(readFileSync(path, "utf8"));
} catch (err) {
  fail(`cannot read/parse ${path}: ${err.message}`);
}

const { errors, validCount, styles } = validateBank(raw);
if (errors.length > 0) {
  fail(`${path} has ${errors.length} error(s):\n  - ${errors.join("\n  - ")}`);
}
if (validCount < MIN_PASSAGES) {
  fail(`${path} has only ${validCount} valid passages (need >= ${MIN_PASSAGES})`);
}
if (styles.length < MIN_STYLES) {
  fail(`${path} spans only ${styles.length} styles (need >= ${MIN_STYLES})`);
}

process.stdout.write(
  `validate-bank: OK — ${validCount} passages across ${styles.length} styles (${styles.join(", ")})\n`,
);
