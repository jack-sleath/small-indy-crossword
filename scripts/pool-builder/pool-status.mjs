/**
 * Read-only status / gap report for the themed-pool builder.
 *
 * Given a theme (and/or slug) and a target count, reports:
 *   - the derived slug, display name, and a collision-free 2-char id prefix
 *   - whether the pool file and manifest entry already exist
 *   - current entry count and 3/4/5 length distribution
 *   - the per-length deficit vs a balanced target (round(target/3) each)
 *
 * Emits a single JSON object to stdout so the skill can parse the gap.
 *
 * Usage:
 *   node scripts/pool-builder/pool-status.mjs --theme "Greek mythology" --target 1000
 *   node scripts/pool-builder/pool-status.mjs --slug greek-mythology
 */

import { existsSync } from 'fs'
import {
  parseArgs, slugify, titleCase, derivePrefix, usedPrefixes, existingPrefix,
  loadManifest, loadPool, poolPath, lengthDistribution, distinctDistribution,
} from './lib.mjs'

const args = parseArgs(process.argv.slice(2))

if (!args.theme && !args.slug) {
  console.error('Error: provide --theme "<theme>" and/or --slug <slug>')
  process.exit(1)
}

const slug = args.slug ? slugify(args.slug) : slugify(args.theme)
const name = args.name ?? (args.theme ? titleCase(args.theme) : titleCase(slug.replace(/-/g, ' ')))
const target = Number(args.target ?? 1000)

const { pool } = loadPool(slug)
const count = pool.length
const distribution = lengthDistribution(pool)
const distinct = distinctDistribution(pool)

// Reuse the pool's own prefix on a top-up; only derive a fresh one for a new pool.
const taken = usedPrefixes()
const reusedPrefix = existingPrefix(slug)
const prefix = args.prefix ?? reusedPrefix ?? derivePrefix(slug, taken)

const { pools } = loadManifest()
const manifestEntry = pools.find((p) => p.slug === slug) ?? null
const fileExists = existsSync(poolPath(slug))

// Balanced target: aim for an even split across lengths 3/4/5.
const perLength = Math.round(target / 3)
const deficit = {
  3: Math.max(0, perLength - distribution[3]),
  4: Math.max(0, perLength - distribution[4]),
  5: Math.max(0, perLength - distribution[5]),
}
const remaining = Math.max(0, target - count)

const report = {
  slug,
  name,
  prefix,
  file: `pool-${slug}.json`,
  fileExists,
  inManifest: Boolean(manifestEntry),
  manifestEntry,
  target,
  count,
  remaining,
  distribution,
  distinct,
  perLengthTarget: perLength,
  deficit,
  reusedPrefix: Boolean(reusedPrefix),
  prefixCollision: !reusedPrefix && taken.has(prefix) && !(manifestEntry || fileExists),
}

console.log(JSON.stringify(report, null, 2))
