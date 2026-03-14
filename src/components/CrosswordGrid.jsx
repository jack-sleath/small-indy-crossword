import styles from './CrosswordGrid.module.css'

function buildNumberMap(entries) {
  const map = new Map()
  for (const entry of entries) {
    const key = `${entry.row},${entry.col}`
    if (!map.has(key)) map.set(key, entry.clueNumber)
  }
  return map
}

/**
 * Props:
 *   puzzle          — { grid, entries }
 *   cellValues      — object: "row,col" → letter (user input)
 *   selected        — { row, col } | null
 *   activeWordKeys  — Set of "row,col" strings for the active word
 *   incorrectCells  — Set of "row,col" strings to highlight as incorrect
 *   isActive        — boolean: whether the grid is "active" (a cell is selected)
 *   onCellClick     — (row, col) => void
 *   onKeyDown       — (e) => void (fallback for desktop when grid itself is focused)
 *   containerRef    — ref attached to the grid container
 */
export default function CrosswordGrid({
  puzzle,
  cellValues = {},
  selected = null,
  activeWordKeys = new Set(),
  incorrectCells = new Set(),
  isActive = false,
  onCellClick,
  onKeyDown,
  containerRef,
}) {
  const { grid, entries } = puzzle
  const numberMap = buildNumberMap(entries)

  return (
    <div
      ref={containerRef}
      className={isActive ? `${styles.grid} ${styles.gridActive}` : styles.grid}
      role="grid"
      aria-label="Crossword grid"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {grid.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const key = `${rowIdx},${colIdx}`
          const clueNum = numberMap.get(key)
          const letter = cellValues[key] ?? ''

          if (cell.black) {
            return <div key={key} className={styles.cellBlack} aria-hidden="true" />
          }

          const isSelected =
            selected && selected.row === rowIdx && selected.col === colIdx
          const isActiveWord = activeWordKeys.has(key)

          const isIncorrect = incorrectCells.has(key)

          let cellClass = styles.cell
          if (isIncorrect) cellClass = `${styles.cell} ${styles.cellIncorrect}`
          else if (isSelected) cellClass = `${styles.cell} ${styles.cellSelected}`
          else if (isActiveWord) cellClass = `${styles.cell} ${styles.cellActiveWord}`

          return (
            <div
              key={key}
              className={cellClass}
              onClick={() => onCellClick?.(rowIdx, colIdx)}
              role="gridcell"
              aria-label={`Row ${rowIdx + 1}, column ${colIdx + 1}${letter ? `, letter ${letter}` : ''}`}
            >
              {clueNum != null && (
                <span className={styles.clueNumber}>{clueNum}</span>
              )}
              {letter && <span className={styles.letter}>{letter}</span>}
            </div>
          )
        })
      )}
    </div>
  )
}
