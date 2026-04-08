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
  const usedAnswers = new Set()

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
        return (
          word.answer[0] === a.D0?.answer[4] &&
          word.answer[2] === a.D2?.answer[4]
        )
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
      if (usedAnswers.has(word.answer)) continue
      if (!canPlace(slotKey, word)) continue
      assignment[slotKey] = word
      usedIds.add(word.id)
      usedAnswers.add(word.answer)
      if (backtrack(idx + 1)) return true
      delete assignment[slotKey]
      usedIds.delete(word.id)
      usedAnswers.delete(word.answer)
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

// ── Generic pattern-based solver ────────────────────────────────────────────

/** Derive word slots (length ≥ 2) from a list of black cell positions. */
function deriveSlots(blackCells) {
  const isBlack = (r, c) => blackCells.some(([br, bc]) => br === r && bc === c)
  const slots = []

  // Across
  for (let r = 0; r < 5; r++) {
    let c = 0
    while (c < 5) {
      if (!isBlack(r, c)) {
        const startC = c
        while (c < 5 && !isBlack(r, c)) c++
        const len = c - startC
        if (len >= 2) slots.push({ direction: 'across', row: r, col: startC, length: len })
      } else {
        c++
      }
    }
  }

  // Down
  for (let c = 0; c < 5; c++) {
    let r = 0
    while (r < 5) {
      if (!isBlack(r, c)) {
        const startR = r
        while (r < 5 && !isBlack(r, c)) r++
        const len = r - startR
        if (len >= 2) slots.push({ direction: 'down', row: startR, col: c, length: len })
      } else {
        r++
      }
    }
  }

  return slots
}

/** Derive all intersection constraints between across and down slots. */
function deriveIntersections(slots) {
  const intersections = []
  const indexed = slots.map((s, idx) => ({ ...s, idx }))
  const acrossSlots = indexed.filter((s) => s.direction === 'across')
  const downSlots = indexed.filter((s) => s.direction === 'down')

  for (const a of acrossSlots) {
    for (const d of downSlots) {
      const dCol = d.col
      const dRowEnd = d.row + d.length - 1
      const aColEnd = a.col + a.length - 1
      if (dCol >= a.col && dCol <= aColEnd && a.row >= d.row && a.row <= dRowEnd) {
        intersections.push({
          aIdx: a.idx,
          dIdx: d.idx,
          aOffset: dCol - a.col,
          dOffset: a.row - d.row,
        })
      }
    }
  }

  return intersections
}

/**
 * Generic pattern-based solver. Returns raw entries (same shape as decodeSeed output)
 * or null if no valid assignment is found.
 *
 * @param {Array<{id, answer, clue}>} pool
 * @param {{ name: string, blackCells: [number, number][] }} pattern
 * @param {number} attempt - controls shuffle seed for variety on regenerate
 * @returns {Array<{poolId, row, col, direction, answer, clue}> | null}
 */
export function solvePattern(pool, pattern, attempt = 0) {
  const slots = deriveSlots(pattern.blackCells)
  if (slots.length === 0) return null

  // Pre-filter and shuffle pool entries by length.
  // Cap each bucket to 500 words — the backtracker only needs a small
  // working set and the seeded shuffle ensures variety across attempts.
  const POOL_CAP = 500
  const byLength = {}
  for (const slot of slots) {
    if (!byLength[slot.length]) {
      byLength[slot.length] = seededShuffle(
        pool.filter((p) => p.answer.length === slot.length),
        attempt
      ).slice(0, POOL_CAP)
    }
  }

  // Check we have enough distinct words for each required slot length
  const lengthCounts = {}
  for (const slot of slots) {
    lengthCounts[slot.length] = (lengthCounts[slot.length] || 0) + 1
  }
  for (const [len, count] of Object.entries(lengthCounts)) {
    if ((byLength[len]?.length ?? 0) < count) return null
  }

  const intersections = deriveIntersections(slots)

  // Build a position-letter index for O(1) constrained candidate lookup.
  // letterIndex[len][pos][letter] = array of words of that length with that letter at pos.
  const letterIndex = {}
  for (const [len, words] of Object.entries(byLength)) {
    letterIndex[len] = {}
    for (const word of words) {
      for (let i = 0; i < word.answer.length; i++) {
        const letter = word.answer[i]
        if (!letterIndex[len][i]) letterIndex[len][i] = {}
        if (!letterIndex[len][i][letter]) letterIndex[len][i][letter] = []
        letterIndex[len][i][letter].push(word)
      }
    }
  }

  // Order slots greedily for efficient backtracking:
  //   1. Fully-constrained slots (active constraints == slot length) become
  //      immediate checks — highest priority so we fail fast.
  //   2. Otherwise prefer slots with more active constraints (most constrained
  //      variable), breaking ties by longer length (more candidates = wider search).
  //   3. First slot (none placed yet): pick the one with most total intersections,
  //      tiebreak by length.
  const slotOrder = (() => {
    const placed = new Set()
    const order = []
    const totalIx = slots.map((_, i) =>
      intersections.filter(ix => ix.aIdx === i || ix.dIdx === i).length
    )
    while (order.length < slots.length) {
      let best = -1, bestScore = -Infinity
      for (let i = 0; i < slots.length; i++) {
        if (placed.has(i)) continue
        const active = intersections.filter(
          ix => (ix.aIdx === i && placed.has(ix.dIdx)) ||
                (ix.dIdx === i && placed.has(ix.aIdx))
        ).length
        let score
        if (placed.size === 0) {
          score = totalIx[i] * 100 + slots[i].length
        } else if (active === slots[i].length) {
          // All positions determined — check it immediately, shorter first
          score = 1_000_000 - slots[i].length
        } else {
          score = active * 10_000 + slots[i].length * 100 + totalIx[i]
        }
        if (score > bestScore) { bestScore = score; best = i }
      }
      placed.add(best)
      order.push(best)
    }
    return order
  })()

  // Precompute which slots share an intersection with each slot (for forward checking).
  const intersectsWithSlot = Array.from({ length: slots.length }, (_, i) =>
    new Set(
      intersections
        .filter(ix => ix.aIdx === i || ix.dIdx === i)
        .map(ix => ix.aIdx === i ? ix.dIdx : ix.aIdx)
    )
  )

  const assignment = new Array(slots.length).fill(null)
  const usedIds = new Set()
  const usedAnswers = new Set()

  // Shared logic: gather active constraints for a slot from already-placed neighbours.
  function getConstraints(slotIdx) {
    const constraints = []
    for (const ix of intersections) {
      if (ix.aIdx === slotIdx && assignment[ix.dIdx] !== null) {
        constraints.push({ pos: ix.aOffset, letter: assignment[ix.dIdx].answer[ix.dOffset] })
      }
      if (ix.dIdx === slotIdx && assignment[ix.aIdx] !== null) {
        constraints.push({ pos: ix.dOffset, letter: assignment[ix.aIdx].answer[ix.aOffset] })
      }
    }
    return constraints
  }

  // Returns true if at least one valid (unused) candidate exists for slotIdx.
  // Used by forward checking — returns early without allocating an array.
  function hasCandidates(slotIdx) {
    const len = slots[slotIdx].length
    const idx = letterIndex[len]
    const constraints = getConstraints(slotIdx)

    if (constraints.length === 0) {
      return byLength[len].some(w => !usedIds.has(w.id) && !usedAnswers.has(w.answer))
    }

    let smallest = null
    for (const { pos, letter } of constraints) {
      const list = idx?.[pos]?.[letter] ?? []
      if (!smallest || list.length < smallest.length) smallest = list
    }
    if (!smallest || smallest.length === 0) return false

    for (const word of smallest) {
      if (usedIds.has(word.id)) continue
      if (usedAnswers.has(word.answer)) continue
      let ok = true
      for (const { pos, letter } of constraints) {
        if (word.answer[pos] !== letter) { ok = false; break }
      }
      if (ok) return true
    }
    return false
  }

  // Return candidates for slotIdx that satisfy all active intersection constraints.
  // Uses the letter index to intersect small per-position sets rather than
  // scanning the full word list — O(smallest_set) instead of O(all_words).
  function getCandidates(slotIdx) {
    const len = slots[slotIdx].length
    const idx = letterIndex[len]
    const constraints = getConstraints(slotIdx)

    if (constraints.length === 0) return byLength[len]

    // Find the smallest per-position list to iterate over
    let smallest = null
    for (const { pos, letter } of constraints) {
      const list = idx?.[pos]?.[letter] ?? []
      if (!smallest || list.length < smallest.length) smallest = list
    }
    if (!smallest || smallest.length === 0) return []

    // Filter by remaining constraints using direct character comparison —
    // avoids allocating Sets on every call (critical for backtracking performance)
    return smallest.filter(word => {
      for (const { pos, letter } of constraints) {
        if (word.answer[pos] !== letter) return false
      }
      return true
    })
  }

  function backtrack(step) {
    if (step === slots.length) return true
    const slotIdx = slotOrder[step]
    const candidates = getCandidates(slotIdx)
    for (const word of candidates) {
      if (usedIds.has(word.id)) continue
      if (usedAnswers.has(word.answer)) continue
      assignment[slotIdx] = word
      usedIds.add(word.id)
      usedAnswers.add(word.answer)

      // Forward check: after placing this word, verify that all not-yet-placed
      // slots which intersect it still have at least one valid candidate.
      // This prunes branches where a 3-letter corner word becomes impossible
      // before we've wasted time exploring deeper levels.
      let forwardOk = true
      for (let futureStep = step + 1; futureStep < slotOrder.length; futureStep++) {
        const futureSlotIdx = slotOrder[futureStep]
        if (intersectsWithSlot[slotIdx].has(futureSlotIdx) &&
            !hasCandidates(futureSlotIdx)) {
          forwardOk = false
          break
        }
      }

      if (forwardOk && backtrack(step + 1)) return true
      assignment[slotIdx] = null
      usedIds.delete(word.id)
      usedAnswers.delete(word.answer)
    }
    return false
  }

  if (!backtrack(0)) return null

  return slots.map((slot, i) => ({
    poolId: assignment[i].id,
    row: slot.row,
    col: slot.col,
    direction: slot.direction,
    answer: assignment[i].answer,
    clue: assignment[i].clue,
  }))
}
