/**
 * Random puzzle generation, shared by the generate page and the `/random`
 * route.
 *
 * The solver is deterministic given (pool, pattern, attempt), so "random"
 * here means picking a random `attempt` number; the pattern is derived from
 * the attempt so consecutive retries also cycle through grid shapes.
 */

import { PATTERNS } from './patterns'
import { solvePattern } from './solver'
import { hasIntersectionConflict } from './buildPuzzle'

/** Attempts made before giving up on a pool. */
export const DEFAULT_MAX_TRIES = 5

/**
 * A fresh attempt seed derived from the exact current time.
 *
 * The low 32 bits of the epoch millisecond change on every tick; the top half
 * is mixed with a random value so two puzzles generated inside the same
 * millisecond (a double-click, or two tabs opened together) still differ.
 */
export function randomAttemptSeed() {
  return (Date.now() ^ (Math.floor(Math.random() * 0x10000) * 0x10000)) >>> 0
}

/**
 * Solve a puzzle starting from `startAttempt`, retrying with the next attempt
 * (and therefore the next pattern) until one yields a conflict-free grid.
 *
 * @param {Array<{id, answer, clue}>} pool
 * @param {number} startAttempt
 * @param {number} [maxTries]
 * @returns {Array<{poolId, row, col, direction, answer, clue}> | null}
 */
export function solveRandomPuzzle(pool, startAttempt, maxTries = DEFAULT_MAX_TRIES) {
  for (let i = 0; i < maxTries; i++) {
    const attempt = (startAttempt + i) >>> 0
    const pattern = PATTERNS[attempt % PATTERNS.length]
    const label = `solvePattern (attempt ${attempt}, pattern ${pattern.name})`
    console.time(label)
    const entries = solvePattern(pool, pattern, attempt)
    console.timeEnd(label)
    if (entries && !hasIntersectionConflict(entries)) return entries
  }
  return null
}
