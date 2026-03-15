import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueList from '../components/ClueList'
import CompletionModal from '../components/CompletionModal'
import MobileKeyboard from '../components/MobileKeyboard'
import { decodeSeed } from '../utils/seed'
import { buildPuzzle, hasIntersectionConflict } from '../utils/buildPuzzle'
import {
  getCellsInEntry,
  getEntryAt,
  getNextCellInEntry,
  getNextEmptyCellInEntry,
  getNextIncompleteEntry,
  getFirstEmptyCellInEntry,
  isEntryComplete,
  getPrevCellInEntry,
  getNextEntry,
  getAdjacentCell,
  getActiveWordKeys,
} from '../utils/puzzleHelpers'
import { useTheme } from '../utils/useTheme'
import styles from './PlayPage.module.css'

const BASE_URL = `${window.location.origin}/small-indy-crossword`

function buildAnswerMap(puzzle) {
  const map = {}
  for (const entry of puzzle.entries) {
    getCellsInEntry(entry).forEach((cell, i) => {
      map[`${cell.row},${cell.col}`] = entry.answer[i]
    })
  }
  return map
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function checkWin(cellValues, answerMap) {
  return Object.entries(answerMap).every(([key, letter]) => cellValues[key] === letter)
}

export default function PlayPage() {
  const { theme, toggleTheme } = useTheme()
  const [searchParams] = useSearchParams()
  const seedParam = searchParams.get('seed')

  const [pool, setPool] = useState(null)
  const [puzzle, setPuzzle] = useState(null)
  const [answerMap, setAnswerMap] = useState({})
  const [seedError, setSeedError] = useState(false)

  // Game state
  const [cellValues, setCellValues] = useState({})
  const [selected, setSelected] = useState(null)
  const [direction, setDirection] = useState('across')
  const [elapsed, setElapsed] = useState(0)
  const [isWon, setIsWon] = useState(false)
  const [incorrectCells, setIncorrectCells] = useState(new Set())
  const [revealedCells, setRevealedCells] = useState(new Set())
  const [correctCells, setCorrectCells] = useState(new Set())
  const [isAssisted, setIsAssisted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)

  // Detect touch device (pointer: coarse) for custom keyboard
  const [isTouchDevice] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  )
  // Rebus mode — accumulates multiple characters in a single cell
  const [rebusMode, setRebusMode] = useState(false)

  // Hidden input for mobile virtual keyboard; also used on desktop
  const hiddenInputRef = useRef(null)
  const startTimeRef = useRef(null)
  const intervalRef = useRef(null)

  // Load pool.json, then decode seed
  useEffect(() => {
    fetch('/small-indy-crossword/pool.json')
      .then((r) => r.json())
      .then(({ pool: p }) => {
        console.log('pool.json (PlayPage):', p)
        setPool(p)
      })
  }, [])

  useEffect(() => {
    if (!pool || !seedParam) return
    const rawEntries = decodeSeed(seedParam, pool)
    if (!rawEntries || hasIntersectionConflict(rawEntries)) {
      setSeedError(true)
      return
    }
    const built = buildPuzzle(rawEntries)
    setPuzzle(built)
    setAnswerMap(buildAnswerMap(built))
  }, [pool, seedParam])

  // Focus the hidden input whenever a cell is selected (triggers mobile keyboard)
  useEffect(() => {
    if (selected !== null) {
      hiddenInputRef.current?.focus({ preventScroll: true })
    }
  }, [selected])

  // Clean up timer on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  function startTimerIfNeeded() {
    if (startTimeRef.current !== null || isWon) return
    startTimeRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 500)
  }

  const checkForWin = useCallback((values, aMap) => {
    if (!isWon && checkWin(values, aMap)) {
      setIsWon(true)
      setShowModal(true)
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [isWon])

  if (!puzzle) {
    if (!seedParam) {
      return (
        <main className={styles.page}>
          <div className={styles.header}>
            <h1 className={styles.title}>Mini Crossword</h1>
            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <div className={styles.noSeed}>
            <p>No puzzle loaded.</p>
            <Link to="/generate" className={styles.generateLink}>Generate a puzzle →</Link>
          </div>
        </main>
      )
    }
    if (seedError) {
      return (
        <main className={styles.page}>
          <div className={styles.header}>
            <h1 className={styles.title}>Mini Crossword</h1>
            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <div className={styles.noSeed}>
            <p>Invalid or unrecognised seed.</p>
            <Link to="/generate" className={styles.generateLink}>Generate a new puzzle →</Link>
          </div>
        </main>
      )
    }
    return (
      <main className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Mini Crossword</h1>
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <p className={styles.loading}>Loading…</p>
      </main>
    )
  }

  const { grid, entries } = puzzle

  const activeEntry = selected
    ? getEntryAt(entries, selected.row, selected.col, direction) ??
      getEntryAt(entries, selected.row, selected.col, direction === 'across' ? 'down' : 'across')
    : null

  const activeWordKeys = selected
    ? getActiveWordKeys(entries, selected.row, selected.col, activeEntry?.direction ?? direction)
    : new Set()

  // ── Shared letter input logic (called from both keyboard handler and onChange) ──
  function processLetter(letter) {
    if (!selected || isWon) return
    const { row, col } = selected
    const key = `${row},${col}`
    startTimerIfNeeded()

    // Rebus mode: accumulate up to 5 characters in the cell without advancing
    if (rebusMode) {
      const current = cellValues[key] ?? ''
      if (current.length < 5) {
        setCellValues(prev => ({ ...prev, [key]: current + letter }))
      }
      return
    }

    const newValues = { ...cellValues, [key]: letter }
    setCellValues(newValues)
    setIncorrectCells(new Set())
    if (correctCells.has(key)) {
      const next = new Set(correctCells); next.delete(key); setCorrectCells(next)
    }
    checkForWin(newValues, answerMap)
    if (!activeEntry) return

    // If the current word is now complete, jump to the first empty cell of the
    // next incomplete entry. Otherwise skip to the next empty cell in this word.
    if (isEntryComplete(activeEntry, newValues)) {
      const nextEntry = getNextIncompleteEntry(entries, activeEntry, newValues)
      if (nextEntry) {
        const firstEmpty = getFirstEmptyCellInEntry(nextEntry, newValues)
        setSelected(firstEmpty ?? { row: nextEntry.row, col: nextEntry.col })
        setDirection(nextEntry.direction)
      }
    } else {
      const nextEmpty = getNextEmptyCellInEntry(activeEntry, row, col, newValues)
      if (nextEmpty) {
        setSelected(nextEmpty)
      } else {
        // All empty cells in this entry are before the cursor — word will be
        // complete on a future keystroke; just stay put.
      }
    }
  }

  // ── Mobile keyboard backspace ────────────────────────────────────────────
  function handleMobileBackspace() {
    if (!selected || isWon) return
    const { row, col } = selected
    startTimerIfNeeded()
    const key = `${row},${col}`
    setIncorrectCells(new Set())
    if (cellValues[key]) {
      const n = { ...cellValues }; delete n[key]; setCellValues(n)
    } else if (activeEntry) {
      const prev = getPrevCellInEntry(activeEntry, row, col)
      if (prev) {
        setSelected(prev)
        const n = { ...cellValues }; delete n[`${prev.row},${prev.col}`]; setCellValues(n)
      }
    }
  }

  // ── Cell click ───────────────────────────────────────────────────────────
  function handleCellClick(row, col) {
    if (isWon) return
    if (selected && selected.row === row && selected.col === col) {
      const other = direction === 'across' ? 'down' : 'across'
      if (getEntryAt(entries, row, col, other)) setDirection(other)
    } else {
      setSelected({ row, col })
      if (!getEntryAt(entries, row, col, direction)) {
        const other = direction === 'across' ? 'down' : 'across'
        if (getEntryAt(entries, row, col, other)) setDirection(other)
      }
    }
  }

  // ── Clue click ───────────────────────────────────────────────────────────
  function handleClueClick(entry) {
    if (isWon) return
    setSelected({ row: entry.row, col: entry.col })
    setDirection(entry.direction)
  }

  // ── Keyboard: handles special keys + desktop letter keys ─────────────────
  function handleKeyDown(e) {
    if (!selected || isWon) return
    const { row, col } = selected

    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
      // On desktop e.key is the letter; on mobile e.key is often 'Unidentified'
      // (mobile letters are handled via onChange instead)
      e.preventDefault()
      processLetter(e.key.toUpperCase())
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      startTimerIfNeeded()
      const key = `${row},${col}`
      setIncorrectCells(new Set())
      if (cellValues[key]) {
        const n = { ...cellValues }; delete n[key]; setCellValues(n)
      } else if (activeEntry) {
        const prev = getPrevCellInEntry(activeEntry, row, col)
        if (prev) {
          setSelected(prev)
          const n = { ...cellValues }; delete n[`${prev.row},${prev.col}`]; setCellValues(n)
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); setDirection('across')
      const next = getAdjacentCell(grid, row, col, 0, 1); if (next) setSelected(next)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); setDirection('across')
      const next = getAdjacentCell(grid, row, col, 0, -1); if (next) setSelected(next)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); setDirection('down')
      const next = getAdjacentCell(grid, row, col, 1, 0); if (next) setSelected(next)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setDirection('down')
      const next = getAdjacentCell(grid, row, col, -1, 0); if (next) setSelected(next)
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

  // ── onChange: handles mobile virtual keyboard letter input ────────────────
  function handleHiddenInputChange(e) {
    // e.nativeEvent.data is the typed character on mobile (null on desktop
    // when e.preventDefault() was called in onKeyDown)
    const char = e.nativeEvent?.data
    if (char && /^[a-zA-Z]$/.test(char)) {
      processLetter(char.toUpperCase())
    }
    // Always clear to prevent accumulating characters in the input
    e.target.value = ''
  }

  // ── Check ─────────────────────────────────────────────────────────────────
  function handleCheck() {
    if (isWon) return
    const wrong = new Set()
    const correct = new Set(correctCells)
    for (const [key, letter] of Object.entries(cellValues)) {
      if (!answerMap[key]) continue
      if (letter === answerMap[key]) {
        if (!revealedCells.has(key)) correct.add(key)
      } else {
        wrong.add(key)
      }
    }
    setIncorrectCells(wrong)
    setCorrectCells(correct)
    setTimeout(() => setIncorrectCells(new Set()), 3000)
  }

  // ── Reveal cell ───────────────────────────────────────────────────────────
  function handleRevealCell() {
    if (!selected || isWon) return
    const key = `${selected.row},${selected.col}`
    const answer = answerMap[key]
    if (!answer) return
    setIsAssisted(true)
    setIncorrectCells(new Set())
    setRevealedCells(prev => new Set([...prev, key]))
    const newValues = { ...cellValues, [key]: answer }
    setCellValues(newValues)
    checkForWin(newValues, answerMap)
  }

  // ── Reveal all ────────────────────────────────────────────────────────────
  function handleRevealAll() {
    if (isWon) return
    setIsAssisted(true)
    setIncorrectCells(new Set())
    setRevealedCells(new Set(Object.keys(answerMap)))
    setCellValues({ ...answerMap })
    setIsWon(true)
    setShowModal(true)
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  // ── Share ─────────────────────────────────────────────────────────────────
  function handleShare() {
    if (!seedParam) return
    const shareUrl = `${BASE_URL}/?seed=${seedParam}`
    navigator.clipboard.writeText(`${shareUrl}\nCode: ${seedParam}`).then(() => {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    })
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
    setRevealedCells(new Set())
    setCorrectCells(new Set())
    setIsAssisted(false)
    startTimeRef.current = null
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mini Crossword</h1>
        <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className={styles.timer} aria-live="polite" aria-label={`Time elapsed: ${formatTime(elapsed)}`}>
        {formatTime(elapsed)}
      </div>

      {/*
        Hidden input: receives focus when a cell is selected.
        On touch devices: inputMode="none" suppresses the system keyboard so
        our custom MobileKeyboard handles all input.
        On desktop: onChange handles letter input; onKeyDown handles special keys.
      */}
      <input
        ref={hiddenInputRef}
        className={styles.hiddenInput}
        type="text"
        aria-hidden="true"
        tabIndex={-1}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        inputMode={isTouchDevice ? 'none' : undefined}
        onKeyDown={handleKeyDown}
        onChange={handleHiddenInputChange}
      />

      <CrosswordGrid
        puzzle={puzzle}
        cellValues={cellValues}
        selected={selected}
        activeWordKeys={activeWordKeys}
        incorrectCells={incorrectCells}
        revealedCells={revealedCells}
        correctCells={correctCells}
        onCellClick={handleCellClick}
        onKeyDown={handleKeyDown}
        isActive={selected !== null}
      />

      <div className={styles.controls} role="group" aria-label="Puzzle controls">
        <button className={styles.btn} onClick={handleCheck} disabled={isWon}>Check</button>
        <button className={styles.btn} onClick={handleRevealCell} disabled={!selected || isWon}>Reveal cell</button>
        <button className={styles.btnDanger} onClick={handleRevealAll} disabled={isWon}>Reveal all</button>
      </div>

      <div className={styles.seedBar}>
        <span className={styles.seedCode} title="Puzzle code">{seedParam}</span>
        <button className={styles.shareBtn} onClick={handleShare} aria-label="Copy share link">
          {copyFeedback ? 'Copied!' : 'Share'}
        </button>
      </div>

      {isTouchDevice && selected && (
        <MobileKeyboard
          onLetter={processLetter}
          onBackspace={handleMobileBackspace}
          onRebus={() => setRebusMode(r => !r)}
          rebusActive={rebusMode}
          clueLabel={activeEntry ? `${activeEntry.clueNumber}-${activeEntry.direction === 'across' ? 'A' : 'D'}` : ''}
          clueText={activeEntry?.clue ?? ''}
        />
      )}

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
