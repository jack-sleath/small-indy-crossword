/**
 * Pure helper functions for crossword puzzle navigation.
 * No React dependencies — all functions take plain data and return plain data.
 */

/** Returns all { row, col } positions in an entry, in order. */
export function getCellsInEntry(entry) {
  const cells = []
  for (let i = 0; i < entry.answer.length; i++) {
    if (entry.direction === 'across') {
      cells.push({ row: entry.row, col: entry.col + i })
    } else {
      cells.push({ row: entry.row + i, col: entry.col })
    }
  }
  return cells
}

/**
 * Returns the entry covering cell (row, col) in the given direction, or null.
 */
export function getEntryAt(entries, row, col, direction) {
  return (
    entries.find((e) => {
      if (e.direction !== direction) return false
      const len = e.answer.length
      if (direction === 'across') {
        return e.row === row && col >= e.col && col < e.col + len
      } else {
        return e.col === col && row >= e.row && row < e.row + len
      }
    }) ?? null
  )
}

/** Returns the next cell in the entry after (row, col), or null if at end. */
export function getNextCellInEntry(entry, row, col) {
  const cells = getCellsInEntry(entry)
  const idx = cells.findIndex((c) => c.row === row && c.col === col)
  return idx !== -1 && idx < cells.length - 1 ? cells[idx + 1] : null
}

/** Returns the previous cell in the entry before (row, col), or null if at start. */
export function getPrevCellInEntry(entry, row, col) {
  const cells = getCellsInEntry(entry)
  const idx = cells.findIndex((c) => c.row === row && c.col === col)
  return idx > 0 ? cells[idx - 1] : null
}

/**
 * Returns the next empty cell after (row, col) within an entry, or null if none.
 * "Empty" means the key is absent from cellValues.
 */
export function getNextEmptyCellInEntry(entry, row, col, cellValues) {
  const cells = getCellsInEntry(entry)
  const idx = cells.findIndex((c) => c.row === row && c.col === col)
  for (let i = idx + 1; i < cells.length; i++) {
    if (!cellValues[`${cells[i].row},${cells[i].col}`]) return cells[i]
  }
  return null
}

/** Returns true if every cell in the entry has a value in cellValues. */
export function isEntryComplete(entry, cellValues) {
  return getCellsInEntry(entry).every((c) => !!cellValues[`${c.row},${c.col}`])
}

/**
 * Returns the next entry in reading order (clueNumber asc, across before down)
 * that has at least one empty cell, skipping complete entries.
 * Returns null if all entries are complete.
 */
export function getNextIncompleteEntry(entries, currentEntry, cellValues) {
  const sorted = [...entries].sort((a, b) => {
    if (a.clueNumber !== b.clueNumber) return a.clueNumber - b.clueNumber
    return a.direction === 'across' ? -1 : 1
  })
  const idx = sorted.findIndex((e) => e.id === currentEntry.id)
  for (let i = 1; i <= sorted.length; i++) {
    const entry = sorted[(idx + i) % sorted.length]
    if (!isEntryComplete(entry, cellValues)) return entry
  }
  return null
}

/** Returns the first empty cell in an entry, or null if the entry is complete. */
export function getFirstEmptyCellInEntry(entry, cellValues) {
  return getCellsInEntry(entry).find((c) => !cellValues[`${c.row},${c.col}`]) ?? null
}

/**
 * Returns the next entry in reading order (clueNumber asc, across before down).
 * Wraps around to the first entry.
 */
export function getNextEntry(entries, currentEntry) {
  const sorted = [...entries].sort((a, b) => {
    if (a.clueNumber !== b.clueNumber) return a.clueNumber - b.clueNumber
    return a.direction === 'across' ? -1 : 1
  })
  const idx = sorted.findIndex((e) => e.id === currentEntry.id)
  return sorted[(idx + 1) % sorted.length]
}

/**
 * Returns the adjacent white cell offset by (dRow, dCol), or null if out of
 * bounds or black.
 */
export function getAdjacentCell(grid, row, col, dRow, dCol) {
  const r = row + dRow
  const c = col + dCol
  if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return null
  if (grid[r][c].black) return null
  return { row: r, col: c }
}

/**
 * Returns a Set of "row,col" keys for all cells in the active entry.
 * Returns an empty Set if no active entry.
 */
export function getActiveWordKeys(entries, row, col, direction) {
  const entry = getEntryAt(entries, row, col, direction)
  if (!entry) return new Set()
  return new Set(getCellsInEntry(entry).map((c) => `${c.row},${c.col}`))
}
