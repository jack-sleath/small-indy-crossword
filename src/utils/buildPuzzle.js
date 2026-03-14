/**
 * Build a full puzzle structure ({ grid, entries }) from decoded seed entries.
 *
 * @param {Array<{poolId: string, row: number, col: number, direction: 'across'|'down', answer: string, clue: string}>} rawEntries
 * @returns {{ grid: Array<Array<{black: boolean, letter: string}>>, entries: Array }}
 */
export function buildPuzzle(rawEntries) {
  // 1. Build a 5×5 grid — all black initially
  const grid = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => ({ black: true, letter: '' }))
  )

  // 2. Mark cells white and set their correct letters from entry answers
  for (const entry of rawEntries) {
    for (let i = 0; i < entry.answer.length; i++) {
      const row = entry.direction === 'across' ? entry.row : entry.row + i
      const col = entry.direction === 'across' ? entry.col + i : entry.col
      if (row >= 0 && row < 5 && col >= 0 && col < 5) {
        grid[row][col] = { black: false, letter: entry.answer[i] }
      }
    }
  }

  // 3. Find which cells start an across or down entry (for clue numbering)
  const startsAcross = new Set(
    rawEntries.filter((e) => e.direction === 'across').map((e) => `${e.row},${e.col}`)
  )
  const startsDown = new Set(
    rawEntries.filter((e) => e.direction === 'down').map((e) => `${e.row},${e.col}`)
  )

  // 4. Assign clue numbers left-to-right, top-to-bottom
  const numberMap = new Map()
  let num = 1
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const key = `${r},${c}`
      if (startsAcross.has(key) || startsDown.has(key)) {
        numberMap.set(key, num++)
      }
    }
  }

  // 5. Build enriched entries with IDs and clue numbers
  const entries = rawEntries.map((entry) => ({
    id: `${entry.poolId}-${entry.direction === 'across' ? 'a' : 'd'}`,
    clueNumber: numberMap.get(`${entry.row},${entry.col}`),
    direction: entry.direction,
    row: entry.row,
    col: entry.col,
    answer: entry.answer,
    clue: entry.clue,
    poolId: entry.poolId,
  }))

  return { grid, entries }
}
