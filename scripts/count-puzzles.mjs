/**
 * Counts all unique valid crossword puzzles that can be generated
 * from the current pool.json, for each grid pattern.
 *
 * Runs an exhaustive backtracking search (no shuffle, no attempt cap)
 * to enumerate every valid assignment.
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const poolPath = join(__dirname, '..', 'public', 'pool.json')
const { pool } = JSON.parse(readFileSync(poolPath, 'utf8'))

// ── Patterns ─────────────────────────────────────────────────────────────────

const PATTERNS = [
  { name: 'classic',  blackCells: [[1,1],[1,3],[3,1],[3,3]] },
  { name: 'diamond',  blackCells: [[0,0],[0,4],[4,0],[4,4]] },
  { name: 'checker',  blackCells: [[1,0],[1,4],[3,0],[3,4]] },
  { name: 'donut',    blackCells: [[1,1],[1,2],[1,3],[2,1],[2,2],[2,3],[3,1],[3,2],[3,3]] },
  { name: 'steps',    blackCells: [[0,0],[2,2],[4,4]] },
  { name: 'h-shape',  blackCells: [[0,1],[0,3],[4,1],[4,3]] },
  { name: 'pillar',   blackCells: [[0,2],[1,2],[3,2],[4,2]] },
  { name: 'stripe',   blackCells: [[2,0],[2,4]] },
  { name: 'slash',    blackCells: [[0,4],[4,0]] },
  { name: 'bridge',   blackCells: [[0,4],[1,1],[1,3],[3,1],[3,3],[4,0]] },
]

// ── Slot derivation ───────────────────────────────────────────────────────────

function deriveSlots(blackCells) {
  const isBlack = (r, c) => blackCells.some(([br, bc]) => br === r && bc === c)
  const slots = []
  for (let r = 0; r < 5; r++) {
    let c = 0
    while (c < 5) {
      if (!isBlack(r, c)) {
        const startC = c
        while (c < 5 && !isBlack(r, c)) c++
        const len = c - startC
        if (len >= 2) slots.push({ direction: 'across', row: r, col: startC, length: len })
      } else { c++ }
    }
  }
  for (let c = 0; c < 5; c++) {
    let r = 0
    while (r < 5) {
      if (!isBlack(r, c)) {
        const startR = r
        while (r < 5 && !isBlack(r, c)) r++
        const len = r - startR
        if (len >= 2) slots.push({ direction: 'down', row: startR, col: c, length: len })
      } else { r++ }
    }
  }
  return slots
}

function deriveIntersections(slots) {
  const intersections = []
  const indexed = slots.map((s, idx) => ({ ...s, idx }))
  const acrossSlots = indexed.filter(s => s.direction === 'across')
  const downSlots   = indexed.filter(s => s.direction === 'down')
  for (const a of acrossSlots) {
    for (const d of downSlots) {
      if (d.col >= a.col && d.col <= a.col + a.length - 1 &&
          a.row >= d.row && a.row <= d.row + d.length - 1) {
        intersections.push({
          aIdx: a.idx, dIdx: d.idx,
          aOffset: d.col - a.col,
          dOffset: a.row - d.row,
        })
      }
    }
  }
  return intersections
}

// ── Counter ───────────────────────────────────────────────────────────────────

function countSolutions(pattern) {
  const slots = deriveSlots(pattern.blackCells)
  const intersections = deriveIntersections(slots)

  // Build word lists by length (no cap — exhaustive)
  const byLength = {}
  for (const slot of slots) {
    if (!byLength[slot.length]) {
      byLength[slot.length] = pool.filter(p => p.answer.length === slot.length)
    }
  }

  // Build letter index for fast candidate lookup
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

  // Most-constrained-first slot ordering (same as solver)
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

  const assignment = new Array(slots.length).fill(null)
  const usedIds = new Set()

  function getConstraints(slotIdx) {
    const constraints = []
    for (const ix of intersections) {
      if (ix.aIdx === slotIdx && assignment[ix.dIdx] !== null)
        constraints.push({ pos: ix.aOffset, letter: assignment[ix.dIdx].answer[ix.dOffset] })
      if (ix.dIdx === slotIdx && assignment[ix.aIdx] !== null)
        constraints.push({ pos: ix.dOffset, letter: assignment[ix.aIdx].answer[ix.aOffset] })
    }
    return constraints
  }

  function getCandidates(slotIdx) {
    const len = slots[slotIdx].length
    const idx = letterIndex[len]
    const constraints = getConstraints(slotIdx)
    if (constraints.length === 0) return byLength[len]
    let smallest = null
    for (const { pos, letter } of constraints) {
      const list = idx?.[pos]?.[letter] ?? []
      if (!smallest || list.length < smallest.length) smallest = list
    }
    if (!smallest || smallest.length === 0) return []
    return smallest.filter(word => {
      for (const { pos, letter } of constraints) {
        if (word.answer[pos] !== letter) return false
      }
      return true
    })
  }

  let count = 0

  function backtrack(step) {
    if (step === slots.length) { count++; return }
    const slotIdx = slotOrder[step]
    const candidates = getCandidates(slotIdx)
    for (const word of candidates) {
      if (usedIds.has(word.id)) continue
      assignment[slotIdx] = word
      usedIds.add(word.id)
      backtrack(step + 1)
      assignment[slotIdx] = null
      usedIds.delete(word.id)
    }
  }

  const start = Date.now()
  backtrack(0)
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  const slotSummary = Object.entries(
    slots.reduce((acc, s) => { acc[s.length] = (acc[s.length] || 0) + 1; return acc }, {})
  ).map(([len, n]) => `${n}×${len}-letter`).join(', ')

  return { count, elapsed, slotSummary }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`Pool: ${pool.length} total entries\n`)

let grandTotal = 0
for (const pattern of PATTERNS) {
  process.stdout.write(`${pattern.name.padEnd(10)} counting...`)
  const { count, elapsed, slotSummary } = countSolutions(pattern)
  grandTotal += count
  console.log(`\r${pattern.name.padEnd(10)} ${count.toLocaleString().padStart(12)} puzzles  (${slotSummary})  [${elapsed}s]`)
}

console.log(`\n${'TOTAL'.padEnd(10)} ${grandTotal.toLocaleString().padStart(12)} puzzles across all patterns`)
