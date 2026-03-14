import { useEffect, useRef, useState } from 'react'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueList from '../components/ClueList'
import SAMPLE_PUZZLE from '../data/samplePuzzle'
import {
  getEntryAt,
  getNextCellInEntry,
  getPrevCellInEntry,
  getNextEntry,
  getAdjacentCell,
  getActiveWordKeys,
} from '../utils/puzzleHelpers'
import styles from './PlayPage.module.css'

const { grid, entries } = SAMPLE_PUZZLE

export default function PlayPage() {
  const [cellValues, setCellValues] = useState({})
  const [selected, setSelected] = useState(null)   // { row, col } | null
  const [direction, setDirection] = useState('across')

  const gridRef = useRef(null)

  // Load pool.json (stub behaviour from milestone 1)
  useEffect(() => {
    fetch('/small-indy-crossword/pool.json')
      .then((r) => r.json())
      .then((data) => console.log('pool.json (PlayPage):', data))
  }, [])

  // Keep grid focused whenever a cell is selected
  useEffect(() => {
    if (selected !== null) {
      gridRef.current?.focus({ preventScroll: true })
    }
  }, [selected])

  // Derive active entry and active word highlight keys
  const activeEntry = selected
    ? getEntryAt(entries, selected.row, selected.col, direction) ??
      getEntryAt(entries, selected.row, selected.col, direction === 'across' ? 'down' : 'across')
    : null

  const activeWordKeys = selected
    ? getActiveWordKeys(entries, selected.row, selected.col, activeEntry?.direction ?? direction)
    : new Set()

  // ── Cell click ──────────────────────────────────────────────────────────────
  function handleCellClick(row, col) {
    if (selected && selected.row === row && selected.col === col) {
      // Same cell tapped again: toggle direction if the other direction has an entry
      const other = direction === 'across' ? 'down' : 'across'
      if (getEntryAt(entries, row, col, other)) {
        setDirection(other)
      }
    } else {
      setSelected({ row, col })
      // Keep current direction if there's an entry here; otherwise switch
      if (!getEntryAt(entries, row, col, direction)) {
        const other = direction === 'across' ? 'down' : 'across'
        if (getEntryAt(entries, row, col, other)) setDirection(other)
      }
    }
  }

  // ── Clue click ──────────────────────────────────────────────────────────────
  function handleClueClick(entry) {
    setSelected({ row: entry.row, col: entry.col })
    setDirection(entry.direction)
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (!selected) return
    const { row, col } = selected

    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault()
      const letter = e.key.toUpperCase()
      setCellValues((prev) => ({ ...prev, [`${row},${col}`]: letter }))
      // Advance to next cell in the active word
      if (activeEntry) {
        const next = getNextCellInEntry(activeEntry, row, col)
        if (next) setSelected(next)
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      const key = `${row},${col}`
      if (cellValues[key]) {
        // Clear current cell
        setCellValues((prev) => { const n = { ...prev }; delete n[key]; return n })
      } else if (activeEntry) {
        // Retreat to previous cell and clear it
        const prev = getPrevCellInEntry(activeEntry, row, col)
        if (prev) {
          setSelected(prev)
          setCellValues((v) => { const n = { ...v }; delete n[`${prev.row},${prev.col}`]; return n })
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setDirection('across')
      const next = getAdjacentCell(grid, row, col, 0, 1)
      if (next) setSelected(next)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setDirection('across')
      const next = getAdjacentCell(grid, row, col, 0, -1)
      if (next) setSelected(next)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setDirection('down')
      const next = getAdjacentCell(grid, row, col, 1, 0)
      if (next) setSelected(next)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDirection('down')
      const next = getAdjacentCell(grid, row, col, -1, 0)
      if (next) setSelected(next)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const entry = activeEntry ?? getEntryAt(entries, row, col, direction)
      if (entry) {
        const next = getNextEntry(entries, entry)
        setSelected({ row: next.row, col: next.col })
        setDirection(next.direction)
      }
    }
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Mini Crossword</h1>
      <CrosswordGrid
        puzzle={SAMPLE_PUZZLE}
        cellValues={cellValues}
        selected={selected}
        activeWordKeys={activeWordKeys}
        onCellClick={handleCellClick}
        onKeyDown={handleKeyDown}
        containerRef={gridRef}
      />
      <ClueList
        entries={entries}
        activeEntryId={activeEntry?.id ?? null}
        onClueClick={handleClueClick}
      />
    </main>
  )
}
