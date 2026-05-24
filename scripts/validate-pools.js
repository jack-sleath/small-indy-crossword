/**
 * Validates all pool files listed in public/pools.json.
 *
 * Checks:
 *   - Each entry has id, answer, and clue fields
 *   - answer is 2–5 uppercase letters only
 *   - clue is a non-empty string
 *   - IDs are unique across all pools
 *
 * Usage:
 *   node scripts/validate-pools.js
 *
 * Exits with code 1 if any errors are found.
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', 'public')

const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, 'pools.json'), 'utf-8'))
const { pools } = manifest

let totalErrors = 0
const allIds = new Map() // id → pool slug, for cross-pool uniqueness check

for (const poolEntry of pools) {
  const filePath = join(PUBLIC_DIR, poolEntry.file)

  let data
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    console.error(`[${poolEntry.slug}] Cannot read ${poolEntry.file}: ${err.message}`)
    totalErrors++
    continue
  }

  if (!Array.isArray(data.pool)) {
    console.error(`[${poolEntry.slug}] Missing or invalid "pool" array in ${poolEntry.file}`)
    totalErrors++
    continue
  }

  let poolErrors = 0

  for (let i = 0; i < data.pool.length; i++) {
    const entry = data.pool[i]
    const loc = `[${poolEntry.slug}] entry[${i}]`

    if (!entry.id || typeof entry.id !== 'string') {
      console.error(`${loc}: missing or invalid "id"`)
      poolErrors++
      continue
    }

    if (allIds.has(entry.id)) {
      console.error(`${loc} id="${entry.id}": duplicate — already used in pool "${allIds.get(entry.id)}"`)
      poolErrors++
    } else {
      allIds.set(entry.id, poolEntry.slug)
    }

    if (!entry.answer || typeof entry.answer !== 'string') {
      console.error(`${loc} id="${entry.id}": missing or invalid "answer"`)
      poolErrors++
    } else if (!/^[A-Z]{2,5}$/.test(entry.answer)) {
      console.error(`${loc} id="${entry.id}": answer "${entry.answer}" must be 2–5 uppercase letters (A–Z only)`)
      poolErrors++
    }

    if (!entry.clue || typeof entry.clue !== 'string' || entry.clue.trim() === '') {
      console.error(`${loc} id="${entry.id}": missing or empty "clue"`)
      poolErrors++
    }
  }

  if (poolErrors === 0) {
    console.log(`[${poolEntry.slug}] OK — ${data.pool.length} entries`)
  } else {
    console.error(`[${poolEntry.slug}] FAILED — ${poolErrors} error(s) across ${data.pool.length} entries`)
    totalErrors += poolErrors
  }
}

if (totalErrors > 0) {
  console.error(`\nValidation failed: ${totalErrors} total error(s)`)
  process.exit(1)
} else {
  console.log(`\nAll pools valid — ${allIds.size} unique IDs across ${pools.length} pool(s)`)
}
