/**
 * Generates 365 daily crossword seeds, cycling through the three grid patterns.
 *
 * Constraint: no pool IDs (and therefore no clues/answers) are shared between
 * any two consecutive days.
 *
 * Output: public/daily-seeds.json  — a JSON array of 365 base64-encoded seed strings,
 * where index 0 = 2026-01-01, index 1 = 2026-01-02, and so on.
 *
 * Usage:
 *   node scripts/generate-daily-seeds.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const poolPath   = join(__dirname, '..', 'public', 'pool.json')
const outputPath = join(__dirname, '..', 'public', 'daily-seeds.json')

const { pool } = JSON.parse(readFileSync(poolPath, 'utf8'))

// ── Patterns ──────────────────────────────────────────────────────────────────

const PATTERNS = [
  { name: 'classic', blackCells: [[1,1],[1,3],[3,1],[3,3]] },
  { name: 'diamond', blackCells: [[0,0],[0,4],[4,0],[4,4]] },
  { name: 'checker', blackCells: [[1,0],[1,4],[3,0],[3,4]] },
]

// ── Seed encoding (Node equivalent of src/utils/seed.js) ─────────────────────

function encodeSeed(entries) {
  const raw = entries
    .map(e => `${e.poolId}:${e.row}:${e.col}:${e.direction === 'across' ? 'a' : 'd'}`)
    .join(',')
  return Buffer.from(raw).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── Solver (adapted from src/utils/solver.js) ─────────────────────────────────

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

function solvePattern(pool, pattern, attempt = 0) {
  const slots = deriveSlots(pattern.blackCells)
  if (slots.length === 0) return null

  const POOL_CAP = 500
  const byLength = {}
  for (const slot of slots) {
    if (!byLength[slot.length]) {
      byLength[slot.length] = seededShuffle(
        pool.filter(p => p.answer.length === slot.length),
        attempt
      ).slice(0, POOL_CAP)
    }
  }

  const lengthCounts = {}
  for (const slot of slots) {
    lengthCounts[slot.length] = (lengthCounts[slot.length] || 0) + 1
  }
  for (const [len, count] of Object.entries(lengthCounts)) {
    if ((byLength[len]?.length ?? 0) < count) return null
  }

  const intersections = deriveIntersections(slots)

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

  const intersectsWithSlot = Array.from({ length: slots.length }, (_, i) =>
    new Set(
      intersections
        .filter(ix => ix.aIdx === i || ix.dIdx === i)
        .map(ix => ix.aIdx === i ? ix.dIdx : ix.aIdx)
    )
  )

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

  function hasCandidates(slotIdx) {
    const len = slots[slotIdx].length
    const idx = letterIndex[len]
    const constraints = getConstraints(slotIdx)
    if (constraints.length === 0) return byLength[len].some(w => !usedIds.has(w.id))
    let smallest = null
    for (const { pos, letter } of constraints) {
      const list = idx?.[pos]?.[letter] ?? []
      if (!smallest || list.length < smallest.length) smallest = list
    }
    if (!smallest || smallest.length === 0) return false
    for (const word of smallest) {
      if (usedIds.has(word.id)) continue
      let ok = true
      for (const { pos, letter } of constraints) {
        if (word.answer[pos] !== letter) { ok = false; break }
      }
      if (ok) return true
    }
    return false
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

  function backtrack(step) {
    if (step === slots.length) return true
    const slotIdx = slotOrder[step]
    const candidates = getCandidates(slotIdx)
    for (const word of candidates) {
      if (usedIds.has(word.id)) continue
      assignment[slotIdx] = word
      usedIds.add(word.id)
      let forwardOk = true
      for (let futureStep = step + 1; futureStep < slotOrder.length; futureStep++) {
        const futureSlotIdx = slotOrder[futureStep]
        if (intersectsWithSlot[slotIdx].has(futureSlotIdx) && !hasCandidates(futureSlotIdx)) {
          forwardOk = false
          break
        }
      }
      if (forwardOk && backtrack(step + 1)) return true
      assignment[slotIdx] = null
      usedIds.delete(word.id)
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

// ── Main generation loop ──────────────────────────────────────────────────────

const NUM_DAYS = 365
// Day 0 = 2026-01-01. Index is (today - START) / msPerDay, mod 365.
const START_DATE = '2026-01-01'

const seeds = []
const usedPoolIdsByDay = []

const start = Date.now()

for (let day = 0; day < NUM_DAYS; day++) {
  const pattern = PATTERNS[day % PATTERNS.length]
  const prevIds = day > 0 ? usedPoolIdsByDay[day - 1] : new Set()

  // Spread starting attempts across days so we get variety and reduce retries.
  // Each day starts searching from a different offset in attempt-space.
  const BASE_ATTEMPT = day * 13
  const MAX_RETRIES = 100_000

  let found = false
  for (let offset = 0; offset < MAX_RETRIES; offset++) {
    const entries = solvePattern(pool, pattern, BASE_ATTEMPT + offset)
    if (!entries) continue
    const poolIds = new Set(entries.map(e => e.poolId))
    if ([...poolIds].some(id => prevIds.has(id))) continue
    seeds.push(encodeSeed(entries))
    usedPoolIdsByDay.push(poolIds)
    found = true
    break
  }

  if (!found) {
    throw new Error(`Could not find a unique puzzle for day ${day} after ${MAX_RETRIES} attempts`)
  }

  process.stdout.write(`\rGenerating seeds: ${day + 1}/${NUM_DAYS}`)
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
console.log(`\nGenerated ${NUM_DAYS} seeds in ${elapsed}s`)

const output = { startDate: START_DATE, seeds }
writeFileSync(outputPath, JSON.stringify(output, null, 2))
console.log(`Written to ${outputPath}`)
