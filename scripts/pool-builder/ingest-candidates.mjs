/**
 * Merge gate-survivor entries into a themed pool and wire it into the manifest.
 *
 * Deterministic, idempotent, resumable: seeds a by-answer map from the existing
 * pool (pattern borrowed from fetch-guardian-pool.js), assigns prefixed
 * sequential ids continuing from the current maximum, guarantees global id
 * uniqueness across every pool, dedupes by answer, and upserts the
 * public/pools.json manifest entry. Re-running tops the same pool up.
 *
 * Usage:
 *   node scripts/pool-builder/ingest-candidates.mjs \
 *     --slug greek-mythology --prefix gm --name "Greek Mythology" \
 *     --description "Gods, heroes, monsters, and myths" --in survivors.jsonl
 *
 *   add --dry-run to compute without writing.
 */

import { writeFileSync } from 'fs'
import {
  parseArgs, slugify, titleCase, normalizeAnswer, cleanClue, derivePrefix, usedPrefixes,
  loadManifest, loadPool, poolPath, allIds, readJsonl, lengthDistribution, MANIFEST_PATH,
} from './lib.mjs'

const args = parseArgs(process.argv.slice(2))
if (!args.slug || !args.in) {
  console.error('Error: --slug <slug> and --in <survivors.jsonl> are required')
  process.exit(1)
}

const slug = slugify(args.slug)
const prefix = (args.prefix && String(args.prefix).toLowerCase()) || derivePrefix(slug, usedPrefixes())
const name = args.name ?? titleCase(slug.replace(/-/g, ' '))
const description = args.description ?? ''
const dryRun = Boolean(args['dry-run'])

const survivors = readJsonl(args.in)

// Existing pool state (resumable top-up).
const data = loadPool(slug)
const pool = data.pool
const byAnswer = new Set(pool.map((e) => normalizeAnswer(e.answer)))

// Global id set + next sequential suffix for this prefix.
const globalIds = allIds()
let nextN = -1
const suffixRe = new RegExp(`^${prefix}(\\d+)$`)
for (const e of pool) {
  const m = suffixRe.exec(e.id || '')
  if (m) nextN = Math.max(nextN, Number(m[1]))
}
nextN += 1

function mintId() {
  let id
  do {
    id = `${prefix}${String(nextN).padStart(4, '0')}`
    nextN += 1
  } while (globalIds.has(id))
  globalIds.add(id)
  return id
}

let added = 0
let skippedDuplicate = 0
let skippedInvalid = 0

for (const raw of survivors) {
  const answer = normalizeAnswer(raw.answer)
  const clue = cleanClue(raw.clue)
  if (!(answer.length >= 3 && answer.length <= 5) || !clue) {
    skippedInvalid++
    continue
  }
  if (byAnswer.has(answer)) {
    skippedDuplicate++
    continue
  }
  byAnswer.add(answer)
  pool.push({ id: mintId(), answer, clue })
  added++
}

// Upsert the manifest entry (never sets `default`).
const manifest = loadManifest()
let entry = manifest.pools.find((p) => p.slug === slug)
let manifestAction = 'unchanged'
if (!entry) {
  entry = { slug, name, file: `pool-${slug}.json`, description }
  manifest.pools.push(entry)
  manifestAction = 'added'
} else {
  entry.file = `pool-${slug}.json`
  if (args.name) entry.name = name
  if (args.description !== undefined && args.description !== '') entry.description = description
  manifestAction = 'updated'
}

const summary = {
  slug, prefix, name,
  added, skippedDuplicate, skippedInvalid,
  newTotal: pool.length,
  distribution: lengthDistribution(pool),
  manifestAction,
  dryRun,
}

if (!dryRun) {
  writeFileSync(poolPath(slug), JSON.stringify({ pool }, null, 2) + '\n')
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
}

console.log(JSON.stringify(summary, null, 2))
