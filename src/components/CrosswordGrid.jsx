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
 *   revealedCells   — Set of "row,col" strings with revealed letters (shown red)
 *   correctCells    — Set of "row,col" strings confirmed correct by Check (shown blue)
 *   rebusMode       — boolean: rebus mode is active (multi-char input)
 *   pencilCells     — Set of "row,col" strings entered in pencil mode (shown grey)
 *   isWon           — boolean: puzzle is solved (triggers celebration animation)
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
  revealedCells = new Set(),
  correctCells = new Set(),
  rebusMode = false,
  pencilCells = new Set(),
  isWon = false,
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
          const isRevealed = revealedCells.has(key)
          const isCorrect = !isRevealed && correctCells.has(key)

          // Stagger celebration animation across cells (row*5+col gives 0..24)
          const cellIdx = rowIdx * 5 + colIdx
          let cellClass = styles.cell
          if (isWon) cellClass += ` ${styles.cellWon}`
          else if (isIncorrect) cellClass = `${styles.cell} ${styles.cellIncorrect}`
          else if (isSelected && rebusMode) cellClass = `${styles.cell} ${styles.cellSelected} ${styles.cellRebus}`
          else if (isSelected) cellClass = `${styles.cell} ${styles.cellSelected}`
          else if (isActiveWord) cellClass = `${styles.cell} ${styles.cellActiveWord}`

          const isMultiChar = letter.length > 1
          const isPencil = pencilCells.has(key)
          let letterClass = isMultiChar ? `${styles.letter} ${styles.letterRebus}` : styles.letter
          if (isRevealed) letterClass += ` ${styles.letterRevealed}`
          else if (isCorrect) letterClass += ` ${styles.letterCorrect}`
          else if (isPencil) letterClass += ` ${styles.letterPencil}`

          return (
            <div
              key={key}
              className={cellClass}
              style={isWon ? { animationDelay: `${cellIdx * 30}ms` } : undefined}
              onClick={() => onCellClick?.(rowIdx, colIdx)}
              role="gridcell"
              aria-label={`Row ${rowIdx + 1}, column ${colIdx + 1}${letter ? `, letter ${letter}` : ''}`}
            >
              {clueNum != null && (
                <span className={styles.clueNumber}>{clueNum}</span>
              )}
              {letter && <span className={letterClass}>{letter}</span>}
            </div>
          )
        })
      )}
    </div>
  )
}
