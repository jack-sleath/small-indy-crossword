import styles from './CrosswordGrid.module.css'

/**
 * Derives which cells carry clue numbers.
 * A cell gets a number if it is the start of an across or down entry.
 * Returns a Map of "row,col" → clueNumber.
 */
function buildNumberMap(entries) {
  const map = new Map()
  for (const entry of entries) {
    const key = `${entry.row},${entry.col}`
    // Multiple entries can share the same start cell (e.g. 1-Across and 1-Down).
    // The clueNumber is the same for both, so just store it once.
    if (!map.has(key)) {
      map.set(key, entry.clueNumber)
    }
  }
  return map
}

export default function CrosswordGrid({ puzzle }) {
  const { grid, entries } = puzzle
  const numberMap = buildNumberMap(entries)

  return (
    <div className={styles.grid} role="grid" aria-label="Crossword grid">
      {grid.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const key = `${rowIdx},${colIdx}`
          const clueNum = numberMap.get(key)

          if (cell.black) {
            return <div key={key} className={styles.cellBlack} aria-hidden="true" />
          }

          return (
            <div key={key} className={styles.cell}>
              {clueNum != null && (
                <span className={styles.clueNumber}>{clueNum}</span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
