/**
 * Shared helpers for the themed-pool builder scripts.
 *
 * Resolves paths relative to this file (like the other scripts in scripts/),
 * so the helpers work regardless of the caller's cwd.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const PUBLIC_DIR = join(__dirname, '..', '..', 'public')
export const MANIFEST_PATH = join(PUBLIC_DIR, 'pools.json')

/** Parse `--key value` / `--flag` argv into an object. */
export function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      args[key] = true
    } else {
      args[key] = next
      i++
    }
  }
  return args
}

/** "Star Wars: A New Hope" -> "star-wars-a-new-hope" */
export function slugify(theme) {
  return String(theme)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "greek mythology" -> "Greek Mythology" */
export function titleCase(theme) {
  return String(theme).trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Uppercase, strip to A–Z only. */
export function normalizeAnswer(answer) {
  return String(answer ?? '').toUpperCase().replace(/[^A-Z]/g, '')
}

/** Strip trailing length markers like "(5)" or "(3,4)" — mirrors fetch-guardian-pool.js. */
export function cleanClue(clue) {
  return String(clue ?? '').replace(/\s*\(\d[\d,]*\)\s*$/, '').trim()
}

export function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
}

export function poolPath(slug) {
  return join(PUBLIC_DIR, `pool-${slug}.json`)
}

/** Load a single pool by slug; returns { pool: [] } if the file does not exist. */
export function loadPool(slug) {
  const p = poolPath(slug)
  if (!existsSync(p)) return { pool: [] }
  const data = JSON.parse(readFileSync(p, 'utf8'))
  if (!Array.isArray(data.pool)) return { pool: [] }
  return data
}

/** Load every pool referenced by the manifest. Returns [{ entry, pool }]. */
export function loadAllPools() {
  const { pools } = loadManifest()
  const out = []
  for (const entry of pools) {
    const fp = join(PUBLIC_DIR, entry.file)
    if (!existsSync(fp)) continue
    const data = JSON.parse(readFileSync(fp, 'utf8'))
    out.push({ entry, pool: Array.isArray(data.pool) ? data.pool : [] })
  }
  return out
}

/** Set of every id across every pool — for global uniqueness checks. */
export function allIds() {
  const set = new Set()
  for (const { pool } of loadAllPools()) for (const e of pool) set.add(e.id)
  return set
}

/**
 * Set of 2-char prefixes already in use by themed-pool ids (e.g. "lo", "sw").
 *
 * Only themed pools use the `<prefix><digits>` id scheme; the default pool
 * (Guardian) uses random ids, so it is skipped — otherwise its thousands of
 * random ids would mark almost every prefix as taken. Global id uniqueness is
 * enforced separately by allIds(); this is purely about a readable namespace.
 */
export function usedPrefixes() {
  const set = new Set()
  for (const { entry, pool } of loadAllPools()) {
    if (entry.default) continue
    for (const e of pool) {
      const m = /^([a-z]{2})\d/i.exec(e.id || '')
      if (m) set.add(m[1].toLowerCase())
    }
  }
  return set
}

/** Pick a collision-free 2-char prefix derived from the slug. */
export function derivePrefix(slug, taken = usedPrefixes()) {
  const letters = String(slug).replace(/[^a-z]/g, '')
  const candidates = []
  if (letters.length >= 2) candidates.push(letters.slice(0, 2))
  for (let i = 0; i < letters.length; i++) {
    for (let j = i + 1; j < letters.length; j++) candidates.push(letters[i] + letters[j])
  }
  for (const c of 'abcdefghijklmnopqrstuvwxyz') candidates.push((letters[0] || 'x') + c)
  for (const c of candidates) if (c.length === 2 && !taken.has(c)) return c
  return letters.slice(0, 2) || 'xx'
}

export function readJsonl(path) {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      try {
        return JSON.parse(l)
      } catch {
        throw new Error(`Invalid JSON on line ${i + 1} of ${path}`)
      }
    })
}

export function writeJsonl(path, rows) {
  writeFileSync(path, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''))
}

/** Count answers by length, bucketing anything outside 3–5 into `other`. */
export function lengthDistribution(pool) {
  const dist = { 3: 0, 4: 0, 5: 0, other: 0 }
  for (const e of pool) {
    const len = (e.answer || '').length
    if (len >= 3 && len <= 5) dist[len]++
    else dist.other++
  }
  return dist
}
