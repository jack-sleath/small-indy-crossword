/**
 * Deterministic, date-seeded daily puzzle resolution.
 *
 * Mirrors Traindle's getDailyStation approach:
 *  - The seed is the UTC date string (`YYYY-MM-DD`), hashed to a number.
 *  - Retries SALT the string (`${date}-1`, `${date}-2`, …) rather than
 *    incrementing a counter, so re-hashing lands each retry in an unrelated
 *    part of the seed space — a retry can never collide with an adjacent
 *    day's base seed.
 *  - "Avoid yesterday" is resolved by replaying yesterday's own puzzle
 *    (which itself avoids the day before), a fixed 2-day lookback.
 *
 * Pure module: no React / DOM. Determinism holds for every user given the same
 * UTC date, the same deployed pool, and the same solver code — so no seed list
 * needs to be pre-generated or shipped.
 */

import { PATTERNS } from './patterns'
import { solvePattern } from './solver'
import { hasIntersectionConflict } from './buildPuzzle'
import { encodeSeed } from './seed'

const MS_PER_DAY = 86_400_000

/** Day 0 of the "Day N" counter: 2026-01-01 UTC (kept for continuity). */
export const DAILY_EPOCH_MS = Date.UTC(2026, 0, 1)

/**
 * Patterns used by the daily rotation. `slash` and `backslash` are excluded:
 * on the Guardian pool those two dense grids take ~1s PER solve attempt and
 * routinely need dozens of attempts (tens of seconds) or fail outright — which
 * would freeze the tab or break the day client-side. The remaining 7 patterns
 * resolve in milliseconds at salt 0. The generator (GeneratePage) is unaffected
 * and still offers all 9 patterns.
 */
export const DAILY_PATTERNS = PATTERNS.filter(
  (p) => p.name !== 'slash' && p.name !== 'backslash'
)

/**
 * Maximum salted re-seeds attempted before giving up on a day. The daily
 * patterns almost always solve at salt 0; this is cheap insurance for the rare
 * date that needs a re-seed.
 */
export const SALT_CAP = 50

/** UTC day number relative to DAILY_EPOCH_MS (0 = 2026-01-01). May be negative. */
export function getUtcDayNumber(nowMs = Date.now()) {
  return Math.floor((nowMs - DAILY_EPOCH_MS) / MS_PER_DAY)
}

/** UTC `YYYY-MM-DD` string for a given day number (handles negatives). */
export function dateStrForDay(dayNumber) {
  return new Date(DAILY_EPOCH_MS + dayNumber * MS_PER_DAY).toISOString().slice(0, 10)
}

/** Pattern for a day, cycling through DAILY_PATTERNS. Safe for negative day numbers. */
function patternForDay(dayNumber) {
  const n = DAILY_PATTERNS.length
  return DAILY_PATTERNS[((dayNumber % n) + n) % n]
}

/**
 * cyrb53-ish string hash → uint32. Used to turn a (salted) date string into the
 * numeric `attempt` the solver expects.
 */
export function hashToInt(str) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  return h1 >>> 0
}

const idSet = (entries) => new Set(entries.map((e) => e.poolId))

/**
 * Resolve one day's puzzle entries, avoiding any pool ids in `avoidIds`.
 * Retries by salting the date string up to SALT_CAP times.
 *
 * @param {Array<{id, answer, clue}>} pool
 * @param {number} dayNumber - UTC day number (see getUtcDayNumber)
 * @param {Set<string>} [avoidIds] - pool ids to keep out of this day's grid
 * @returns {Array<{poolId, row, col, direction, answer, clue}> | null}
 */
export function resolveDay(pool, dayNumber, avoidIds = new Set()) {
  const base = dateStrForDay(dayNumber)
  const pattern = patternForDay(dayNumber)
  for (let salt = 0; salt < SALT_CAP; salt++) {
    const seedStr = salt === 0 ? base : `${base}-${salt}`
    const entries = solvePattern(pool, pattern, hashToInt(seedStr))
    if (!entries) continue
    if (hasIntersectionConflict(entries)) continue
    if (entries.some((e) => avoidIds.has(e.poolId))) continue
    return entries
  }
  return null
}

/**
 * Resolve today's daily seed deterministically from the UTC date.
 *
 * Uses a 2-day lookback so "avoid yesterday" compares against what yesterday
 * actually showed:
 *   twoDaysAgo = resolve(day-2)            (no further lookback)
 *   yesterday  = resolve(day-1, avoid twoDaysAgo)
 *   today      = resolve(day,   avoid yesterday)
 * Avoidance failures degrade to no avoidance, so they can never hard-fail the
 * daily — only a genuine solve failure across SALT_CAP salts returns null.
 *
 * @param {Array<{id, answer, clue}>} pool
 * @param {number} [nowMs] - current epoch ms (injectable for testing)
 * @returns {{ seed: string, dayNumber: number } | null}
 */
export function resolveDailySeed(pool, nowMs = Date.now()) {
  const day = getUtcDayNumber(nowMs)

  const twoDaysAgo = resolveDay(pool, day - 2)
  const yesterday = resolveDay(pool, day - 1, twoDaysAgo ? idSet(twoDaysAgo) : undefined)
  const avoidIds = yesterday ? idSet(yesterday) : undefined

  const today = resolveDay(pool, day, avoidIds) ?? resolveDay(pool, day)
  if (!today) return null

  // "Day N" label is 1-based from the epoch (2026-01-01 = Day 1).
  return { seed: encodeSeed(today), dayNumber: day + 1 }
}
