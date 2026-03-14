import { useCallback, useEffect, useRef, useState } from 'react'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueList from '../components/ClueList'
import CompletionModal from '../components/CompletionModal'
import SAMPLE_PUZZLE from '../data/samplePuzzle'
import {
  getCellsInEntry,
  getEntryAt,
  getNextCellInEntry,
  getPrevCellInEntry,
  getNextEntry,
  getAdjacentCell,
  getActiveWordKeys,
} from '../utils/puzzleHelpers'
import styles from './PlayPage.module.css'

const { grid, entries } = SAMPLE_PUZZLE

/** Build a map of "row,col" → correct letter from all entries. */
function buildAnswerMap(puzzle) {
  const map = {}
  for (const entry of puzzle.entries) {
    getCellsInEntry(entry).forEach((cell, i) => {
      map[`${cell.row},${cell.col}`] = entry.answer[i]
    })
  }
  return map
}

const ANSWER_MAP = buildAnswerMap(SAMPLE_PUZZLE)

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function checkWin(cellValues) {
  return Object.entries(ANSWER_MAP).every(([key, letter]) => cellValues[key] === letter)
}

export default function PlayPage() {
  const [cellValues, setCellValues] = useState({})
  const [selected, setSelected] = useState(null)   // { row, col } | null
  const [direction, setDirection] = useState('across')

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef(null)
  const intervalRef = useRef(null)

  // Game state
  const [isWon, setIsWon] = useState(false)
  const [incorrectCells, setIncorrectCells] = useState(new Set())
  const [isAssisted, setIsAssisted] = useState(false)
  const [showModal, setShowModal] = useState(false)

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

  // Start timer on first interaction
  function startTimerIfNeeded() {
    if (startTimeRef.current !== null || isWon) return
    startTimeRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 500)
  }

  // Stop timer when won
  useEffect(() => {
    if (isWon && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [isWon])

  // Clean up interval on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  // Check win after every cell value change
  const checkForWin = useCallback((values) => {
    if (!isWon && checkWin(values)) {
      setIsWon(true)
      setShowModal(true)
    }
  }, [isWon])

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
    if (isWon) return
    if (selected && selected.row === row && selected.col === col) {
      const other = direction === 'across' ? 'down' : 'across'
      if (getEntryAt(entries, row, col, other)) {
        setDirection(other)
      }
    } else {
      setSelected({ row, col })
      if (!getEntryAt(entries, row, col, direction)) {
        const other = direction === 'across' ? 'down' : 'across'
        if (getEntryAt(entries, row, col, other)) setDirection(other)
      }
    }
  }

  // ── Clue click ──────────────────────────────────────────────────────────────
  function handleClueClick(entry) {
    if (isWon) return
    setSelected({ row: entry.row, col: entry.col })
    setDirection(entry.direction)
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (!selected || isWon) return
    const { row, col } = selected

    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault()
      startTimerIfNeeded()
      const letter = e.key.toUpperCase()
      const newValues = { ...cellValues, [`${row},${col}`]: letter }
      setCellValues(newValues)
      setIncorrectCells(new Set()) // clear check highlights on input
      checkForWin(newValues)
      if (activeEntry) {
        const next = getNextCellInEntry(activeEntry, row, col)
        if (next) setSelected(next)
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      startTimerIfNeeded()
      const key = `${row},${col}`
      setIncorrectCells(new Set())
      if (cellValues[key]) {
        const newValues = { ...cellValues }
        delete newValues[key]
        setCellValues(newValues)
      } else if (activeEntry) {
        const prev = getPrevCellInEntry(activeEntry, row, col)
        if (prev) {
          setSelected(prev)
          const newValues = { ...cellValues }
          delete newValues[`${prev.row},${prev.col}`]
          setCellValues(newValues)
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

  // ── Check ─────────────────────────────────────────────────────────────────
  function handleCheck() {
    if (isWon) return
    const wrong = new Set(
      Object.entries(cellValues)
        .filter(([key, letter]) => ANSWER_MAP[key] && letter !== ANSWER_MAP[key])
        .map(([key]) => key)
    )
    setIncorrectCells(wrong)
    // Clear highlights after 3 seconds
    setTimeout(() => setIncorrectCells(new Set()), 3000)
  }

  // ── Reveal cell ───────────────────────────────────────────────────────────
  function handleRevealCell() {
    if (!selected || isWon) return
    const key = `${selected.row},${selected.col}`
    const correct = ANSWER_MAP[key]
    if (!correct) return
    setIsAssisted(true)
    setIncorrectCells(new Set())
    const newValues = { ...cellValues, [key]: correct }
    setCellValues(newValues)
    checkForWin(newValues)
  }

  // ── Reveal all ────────────────────────────────────────────────────────────
  function handleRevealAll() {
    if (isWon) return
    setIsAssisted(true)
    setIncorrectCells(new Set())
    const newValues = { ...ANSWER_MAP }
    setCellValues(newValues)
    setIsWon(true)
    setShowModal(true)
  }

  // ── Reset (play again) ────────────────────────────────────────────────────
  function handleReset() {
    setCellValues({})
    setSelected(null)
    setDirection('across')
    setElapsed(0)
    setIsWon(false)
    setShowModal(false)
    setIncorrectCells(new Set())
    setIsAssisted(false)
    startTimeRef.current = null
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Mini Crossword</h1>

      <div className={styles.timer} aria-live="off">{formatTime(elapsed)}</div>

      <CrosswordGrid
        puzzle={SAMPLE_PUZZLE}
        cellValues={cellValues}
        selected={selected}
        activeWordKeys={activeWordKeys}
        incorrectCells={incorrectCells}
        onCellClick={handleCellClick}
        onKeyDown={handleKeyDown}
        containerRef={gridRef}
      />

      <div className={styles.controls}>
        <button className={styles.btn} onClick={handleCheck} disabled={isWon}>Check</button>
        <button className={styles.btn} onClick={handleRevealCell} disabled={!selected || isWon}>Reveal cell</button>
        <button className={styles.btnDanger} onClick={handleRevealAll} disabled={isWon}>Reveal all</button>
      </div>

      <ClueList
        entries={entries}
        activeEntryId={activeEntry?.id ?? null}
        onClueClick={handleClueClick}
      />

      {showModal && (
        <CompletionModal
          elapsed={elapsed}
          assisted={isAssisted}
          onClose={handleReset}
        />
      )}
    </main>
  )
}
