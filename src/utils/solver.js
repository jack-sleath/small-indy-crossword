/**
 * Crossword constraint solver for the standard 5×5 mini layout:
 *
 *   Row 0: [W][W][W][W][W]  ← Across (length 5)
 *   Row 1: [W][#][W][#][W]
 *   Row 2: [W][W][W][W][W]  ← Across (length 5)
 *   Row 3: [W][#][W][#][W]
 *   Row 4: [W][W][W][W][W]  ← Across (length 5)
 *
 *   Down entries at cols 0, 2, 4 (length 5 each).
 *
 * Intersections validated at positions:
 *   1A[0]=1D[0], 1A[2]=2D[0], 1A[4]=3D[0]
 *   4A[0]=1D[2], 4A[2]=2D[2], 4A[4]=3D[2]
 *   5A[0]=1D[4], 5A[2]=2D[4], 5A[4]=3D[4]
 */

/** Validate a single pool entry: uppercase letters only, length 2–5. */
export function isValidPoolEntry(entry) {
  return (
    typeof entry.id === 'string' &&
    typeof entry.answer === 'string' &&
    /^[A-Z]{2,5}$/.test(entry.answer) &&
    typeof entry.clue === 'string'
  )
}

/** Validate pool: all entries valid + unique IDs. Returns { valid, errors }. */
export function validatePool(pool) {
  const errors = []
  const ids = new Set()
  for (const entry of pool) {
    if (!isValidPoolEntry(entry)) {
      errors.push(`Entry "${entry.id}" has an invalid answer: "${entry.answer}" (must be 2–5 uppercase letters)`)
    }
    if (ids.has(entry.id)) {
      errors.push(`Duplicate pool id: "${entry.id}"`)
    }
    ids.add(entry.id)
  }
  return { valid: errors.length === 0, errors }
}

/**
 * Shuffle an array using a seeded Fisher-Yates variant.
 * Uses a simple LCG so the same attempt number always gives the same shuffle.
 */
function seededShuffle(arr, seed) {
  const out = [...arr]
  let s = (seed + 1) * 1664525 + 1013904223
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0
    const j = Math.abs(s) % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Attempt to solve the crossword using backtracking.
 *
 * Slot order: A0 (row 0 across), D0 (col 0 down), A2 (row 2 across),
 *             D2 (col 2 down), A4 (row 4 across), D4 (col 4 down)
 *
 * @param {Array<{id, answer, clue}>} pool - filtered to length-5 words
 * @param {number} attempt - controls shuffle for variety on regenerate
 * @returns {{ slotA0, slotA2, slotA4, slotD0, slotD2, slotD4 } | null}
 */
export function solve(pool, attempt = 0) {
  const words5 = pool.filter((p) => p.answer.length === 5)
  if (words5.length < 6) return null

  const shuffled = seededShuffle(words5, attempt)

  const assignment = {}
  const usedIds = new Set()

  function canPlace(slotKey, word) {
    const a = assignment
    switch (slotKey) {
      case 'A0': return true // first slot, no constraints yet
      case 'D0':
        return word.answer[0] === a.A0?.answer[0]
      case 'A2':
        return word.answer[0] === a.D0?.answer[2]
      case 'D2':
        return (
          word.answer[0] === a.A0?.answer[2] &&
          word.answer[2] === a.A2?.answer[2]
        )
      case 'A4':
        return word.answer[0] === a.D0?.answer[4]
      case 'D4':
        return (
          word.answer[0] === a.A0?.answer[4] &&
          word.answer[2] === a.A2?.answer[4] &&
          word.answer[4] === a.A4?.answer[4]
        )
      default:
        return false
    }
  }

  const slotOrder = ['A0', 'D0', 'A2', 'D2', 'A4', 'D4']

  function backtrack(idx) {
    if (idx === slotOrder.length) return true
    const slotKey = slotOrder[idx]
    for (const word of shuffled) {
      if (usedIds.has(word.id)) continue
      if (!canPlace(slotKey, word)) continue
      assignment[slotKey] = word
      usedIds.add(word.id)
      if (backtrack(idx + 1)) return true
      delete assignment[slotKey]
      usedIds.delete(word.id)
    }
    return false
  }

  return backtrack(0) ? assignment : null
}

/**
 * Convert a solver assignment into the raw entries format expected by buildPuzzle/encodeSeed.
 * @param {{ slotA0, slotA2, slotA4, slotD0, slotD2, slotD4 }} assignment
 * @returns {Array<{poolId, row, col, direction, answer, clue}>}
 */
export function assignmentToEntries(assignment) {
  return [
    { poolId: assignment.A0.id, row: 0, col: 0, direction: 'across', answer: assignment.A0.answer, clue: assignment.A0.clue },
    { poolId: assignment.A2.id, row: 2, col: 0, direction: 'across', answer: assignment.A2.answer, clue: assignment.A2.clue },
    { poolId: assignment.A4.id, row: 4, col: 0, direction: 'across', answer: assignment.A4.answer, clue: assignment.A4.clue },
    { poolId: assignment.D0.id, row: 0, col: 0, direction: 'down',   answer: assignment.D0.answer, clue: assignment.D0.clue },
    { poolId: assignment.D2.id, row: 0, col: 2, direction: 'down',   answer: assignment.D2.answer, clue: assignment.D2.clue },
    { poolId: assignment.D4.id, row: 0, col: 4, direction: 'down',   answer: assignment.D4.answer, clue: assignment.D4.clue },
  ]
}
