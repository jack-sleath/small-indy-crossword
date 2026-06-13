/**
 * Mechanical format + style filter for a batch of candidate entries.
 *
 * Enforces the objectively-checkable subset of docs/clue-style.md (the
 * subjective rules — substitutability, register, surface reading — stay with
 * the model). Reads a JSONL of { answer, clue } candidates and writes the
 * survivors to --out, plus a JSON drop report to stdout.
 *
 * Drops a candidate when:
 *   - the answer is not 3–5 letters after uppercasing/stripping to A–Z
 *   - the clue is empty
 *   - the answer (or a shared 4+ char leading root) appears in the clue
 *   - the clue contains an unflagged anagram of the answer (a clue token is a
 *     letter-for-letter permutation of the answer but the clue never says "anagram")
 *   - the exact answer+clue pair already exists in the pool (--slug) or earlier in
 *     this batch (the same answer with a *different* clue is allowed — clue variety)
 *
 * Usage:
 *   node scripts/pool-builder/style-precheck.mjs --slug <slug> --in candidates.jsonl --out cleaned.jsonl
 */

import { parseArgs, normalizeAnswer, cleanClue, pairKey, loadPool, readJsonl, writeJsonl } from './lib.mjs'

const args = parseArgs(process.argv.slice(2))
if (!args.in || !args.out) {
  console.error('Error: --in <candidates.jsonl> and --out <cleaned.jsonl> are required')
  process.exit(1)
}

const candidates = readJsonl(args.in)

// Seed the dedupe set from the existing pool (resumable top-up). The unit of
// uniqueness is the answer+clue pair, so the same word may recur with new clues.
const existingPairs = new Set()
if (args.slug) {
  for (const e of loadPool(args.slug).pool) existingPairs.add(pairKey(e.answer, e.clue))
}

const sorted = (s) => s.split('').sort().join('')

function dropReason(answer, clue) {
  if (!(answer.length >= 3 && answer.length <= 5)) return 'length' // 3–5 A–Z only
  if (!clue) return 'empty-clue'

  const clueUpper = clue.toUpperCase()
  if (clueUpper.includes(answer)) return 'answer-in-clue'

  const tokens = clueUpper.match(/[A-Z]+/g) ?? []
  const answerStem = answer.slice(0, 4)
  for (const t of tokens) {
    if (t.length >= 4 && answer.length >= 4 && t.slice(0, 4) === answerStem) return 'root-in-clue'
  }

  if (!/anagram/i.test(clue)) {
    const target = sorted(answer)
    for (const t of tokens) {
      if (t.length === answer.length && sorted(t) === target) return 'unflagged-anagram'
    }
  }
  return null
}

const survivors = []
const drops = []
const reasonCounts = {}
const seenThisBatch = new Set()

for (const raw of candidates) {
  const answer = normalizeAnswer(raw.answer)
  const clue = cleanClue(raw.clue)

  const key = pairKey(answer, clue)
  let reason = dropReason(answer, clue)
  if (!reason) {
    if (existingPairs.has(key)) reason = 'duplicate-existing'
    else if (seenThisBatch.has(key)) reason = 'duplicate-batch'
  }

  if (reason) {
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    drops.push({ answer: raw.answer, clue: raw.clue, reason })
    continue
  }

  seenThisBatch.add(key)
  survivors.push({ answer, clue })
}

writeJsonl(args.out, survivors)

console.log(JSON.stringify({
  in: candidates.length,
  out: survivors.length,
  dropped: candidates.length - survivors.length,
  reasonCounts,
  drops,
}, null, 2))
