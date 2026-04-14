import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueBar from '../components/ClueBar'
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
  getNextEntry,
  getPrevEntry,
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

export default function PlayPage({ overrideSeed, dailyNumber } = {}) {
  const { theme, toggleTheme } = useTheme()
  const [searchParams] = useSearchParams()
  const seedParam = overrideSeed ?? searchParams.get('seed')

  const [pool, setPool] = useState(null)
  const [poolName, setPoolName] = useState(null)
  const [puzzle, setPuzzle] = useState(null)
  const [answerMap, setAnswerMap] = useState({})
  const [seedError, setSeedError] = useState(false)

  // Daily puzzles always use the Guardian pool; URL ?pool param is for generated puzzles only
  const poolParam = overrideSeed ? null : searchParams.get('pool')

  // Game state
  const [cellValues, setCellValues] = useState({})
  const [selected, setSelected] = useState(null)
  const [direction, setDirection] = useState('across')
  const [elapsed, setElapsed] = useState(0)
  const [isWon, setIsWon] = useState(false)
  const [incorrectCells, setIncorrectCells] = useState(new Set())
  const [revealedCells, setRevealedCells] = useState(new Set())
  const [correctCells, setCorrectCells] = useState(new Set())
  const [rebusMode, setRebusMode] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [hideTimer, setHideTimer] = useState(() => localStorage.getItem('hideTimer') === 'true')
  const [autocheck, setAutocheck] = useState(() => localStorage.getItem('autocheck') === 'true')
  const [showCheckMenu, setShowCheckMenu] = useState(false)
  const [showRevealMenu, setShowRevealMenu] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState(null) // { message, onConfirm }
  // ── Cursor movement settings (persisted in localStorage) ─────────────────
  const [skipFilled, setSkipFilled] = useState(() => localStorage.getItem('skipFilled') !== 'false')
  const [jumpToNextClue, setJumpToNextClue] = useState(() => localStorage.getItem('jumpToNextClue') !== 'false')
  const [spacebarClearAdvance, setSpacebarClearAdvance] = useState(() => localStorage.getItem('spacebarClearAdvance') === 'true')
  const [showSettings, setShowSettings] = useState(false)
  const [muteJingle, setMuteJingle] = useState(() => localStorage.getItem('muteJingle') === 'true')
  const [shareFeedback, setShareFeedback] = useState(false)
  const [isAssisted, setIsAssisted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [nextPuzzleIn, setNextPuzzleIn] = useState('')

  // Detect touch device (pointer: coarse) for custom keyboard
  const [isTouchDevice] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  )

  // Hidden input for mobile virtual keyboard; also used on desktop
  const hiddenInputRef = useRef(null)
  const startTimeRef = useRef(null)
  const intervalRef = useRef(null)

  // Load the correct pool via manifest, then decode seed
  useEffect(() => {
    const BASE = '/small-indy-crossword'
    fetch(`${BASE}/pools.json`)
      .then((r) => r.json())
      .then(({ pools }) => {
        const entry =
          pools.find((p) => p.slug === poolParam) ??
          pools.find((p) => p.default) ??
          pools[0]
        setPoolName(entry.default ? null : entry.name)
        return fetch(`${BASE}/${entry.file}`)
      })
      .then((r) => r.json())
      .then(({ pool: p }) => setPool(p))
  }, [poolParam])

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

    if (typeof window.goatcounter?.count === 'function') {
      const poolSlug = poolParam ?? 'guardian'
      if (dailyNumber) {
        window.goatcounter.count({
          path: 'daily-puzzle',
          title: `Daily Puzzle #${dailyNumber} | pool: ${poolSlug} | seed: ${seedParam}`,
          event: true,
        })
      } else {
        window.goatcounter.count({
          path: `puzzle-${poolSlug}`,
          title: `Puzzle | pool: ${poolSlug} | seed: ${seedParam}`,
          event: true,
        })
      }
    }
  }, [pool, seedParam])

  // Countdown to next daily puzzle (midnight UTC)
  useEffect(() => {
    if (!dailyNumber) return
    function tick() {
      const MS_PER_DAY = 86_400_000
      const now = Date.now()
      const nextMidnightUTC = Math.ceil(now / MS_PER_DAY) * MS_PER_DAY
      const rem = nextMidnightUTC - now
      const h = Math.floor(rem / 3_600_000)
      const m = Math.floor((rem % 3_600_000) / 60_000)
      const s = Math.floor((rem % 60_000) / 1_000)
      setNextPuzzleIn(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [dailyNumber])

  // Focus the hidden input whenever a cell is selected (triggers mobile keyboard)
  useEffect(() => {
    if (selected !== null) {
      hiddenInputRef.current?.focus({ preventScroll: true })
    }
  }, [selected])

  // Clean up timer on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  // Defensive invariant: a locked cell must always have a letter.
  // If cellValues loses a letter (e.g. via state inconsistency), remove it from
  // revealedCells / correctCells so it doesn't stay locked-and-empty.
  useEffect(() => {
    const emptyLocked = [...revealedCells, ...correctCells].filter(k => !cellValues[k])
    if (emptyLocked.length === 0) return
    setRevealedCells(prev => { const s = new Set(prev); emptyLocked.forEach(k => s.delete(k)); return s })
    setCorrectCells(prev => { const s = new Set(prev); emptyLocked.forEach(k => s.delete(k)); return s })
  }, [cellValues]) // eslint-disable-line react-hooks/exhaustive-deps

  function startTimerIfNeeded() {
    if (startTimeRef.current !== null || isWon) return
    startTimeRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 500)
  }

  function handleTogglePause() {
    if (isWon || startTimeRef.current === null) return
    if (isPaused) {
      // Resume: restart interval from current elapsed
      startTimeRef.current = Date.now() - elapsed * 1000
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 500)
      setIsPaused(false)
    } else {
      // Pause: freeze elapsed, stop interval
      clearInterval(intervalRef.current)
      intervalRef.current = null
      setIsPaused(true)
    }
  }

  function handleToggleHideTimer() {
    setHideTimer(h => {
      const next = !h
      localStorage.setItem('hideTimer', String(next))
      return next
    })
  }

  function playJingle() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const start = ctx.currentTime + i * 0.12
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.25, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
        osc.start(start); osc.stop(start + 0.35)
      })
    } catch { /* AudioContext not available — silently ignore */ }
  }

  const checkForWin = useCallback((values, aMap) => {
    if (!isWon && checkWin(values, aMap)) {
      setIsWon(true)
      setShowModal(true)
      clearInterval(intervalRef.current)
      intervalRef.current = null
      if (!muteJingle) playJingle()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWon, muteJingle])

  if (!puzzle) {
    if (!seedParam) {
      return (
        <main className={styles.page}>
          <div className={styles.header}>
            <h1 className={styles.title}>Small Indy</h1>
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
            <h1 className={styles.title}>Small Indy</h1>
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
          <h1 className={styles.title}>Small Indy</h1>
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

  const completedEntryIds = new Set(
    entries.filter(e => isEntryComplete(e, cellValues)).map(e => e.id)
  )

  // ── Shared letter input logic (called from both keyboard handler and onChange) ──
  function processLetter(letter) {
    if (!selected || isWon) return
    // On mobile: snap back to main content when a letter is typed
    if (isTouchDevice) window.scrollTo({ top: 0, behavior: 'instant' })
    const { row, col } = selected
    const key = `${row},${col}`
    if (revealedCells.has(key) || correctCells.has(key)) return
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
    if (autocheck) {
      // Real-time check: mark the just-typed cell immediately
      const isCorrect = newValues[key] === answerMap[key]
      setIncorrectCells(isCorrect ? new Set() : new Set([key]))
      setCorrectCells(prev => {
        const s = new Set(prev)
        if (isCorrect && !revealedCells.has(key)) s.add(key)
        else s.delete(key)
        return s
      })
    } else {
      setIncorrectCells(new Set())
      if (correctCells.has(key)) {
        const next = new Set(correctCells); next.delete(key); setCorrectCells(next)
      }
    }

    checkForWin(newValues, answerMap)
    if (!activeEntry || rebusMode) return

    // If the current word is now complete, optionally jump to the next clue.
    if (isEntryComplete(activeEntry, newValues)) {
      if (jumpToNextClue) {
        const nextEntry = getNextIncompleteEntry(entries, activeEntry, newValues)
        if (nextEntry) {
          const firstEmpty = getFirstEmptyCellInEntry(nextEntry, newValues)
          setSelected(firstEmpty ?? { row: nextEntry.row, col: nextEntry.col })
          setDirection(nextEntry.direction)
        }
      }
      // else: stay at end of word
    } else {
      // Advance to next empty cell (skipFilled=true) or just next cell (skipFilled=false)
      if (skipFilled) {
        const nextEmpty = getNextEmptyCellInEntry(activeEntry, row, col, newValues)
        if (nextEmpty) setSelected(nextEmpty)
        // else: all empty cells are before cursor — stay put
      } else {
        const nextCell = getNextCellInEntry(activeEntry, row, col)
        if (nextCell) setSelected(nextCell)
      }
    }
  }

  // ── Clue bar navigation ──────────────────────────────────────────────────
  function handleNextClue() {
    if (!activeEntry) return
    const next = getNextEntry(entries, activeEntry)
    setSelected({ row: next.row, col: next.col })
    setDirection(next.direction)
  }

  function handlePrevClue() {
    if (!activeEntry) return
    const prev = getPrevEntry(entries, activeEntry)
    setSelected({ row: prev.row, col: prev.col })
    setDirection(prev.direction)
  }

  // ── Mobile keyboard backspace ────────────────────────────────────────────
  function handleMobileBackspace() {
    if (!selected || isWon) return
    const { row, col } = selected
    startTimerIfNeeded()
    const key = `${row},${col}`
    setIncorrectCells(new Set())
    const isLocked = revealedCells.has(key) || correctCells.has(key)
    if (cellValues[key] && !isLocked) {
      // Clear current unlocked cell
      const n = { ...cellValues }; delete n[key]; setCellValues(n)
    } else if (activeEntry) {
      // Find previous unlocked cell in the entry
      const cells = getCellsInEntry(activeEntry)
      const idx = cells.findIndex(c => c.row === row && c.col === col)
      let target = null
      for (let i = idx - 1; i >= 0; i--) {
        const c = cells[i]
        const ck = `${c.row},${c.col}`
        if (!revealedCells.has(ck) && !correctCells.has(ck)) { target = c; break }
      }
      if (target) {
        setSelected(target)
        const targetKey = `${target.row},${target.col}`
        const n = { ...cellValues }; delete n[targetKey]; setCellValues(n)
      } else {
        // Can't go back in this clue — jump to next unsolved clue
        const nextEntry = getNextIncompleteEntry(entries, activeEntry, cellValues)
        if (nextEntry) {
          const dest = getFirstEmptyCellInEntry(nextEntry, cellValues)
          setSelected(dest ?? { row: nextEntry.row, col: nextEntry.col })
          setDirection(nextEntry.direction)
        }
      }
    }
  }

  // ── Cell click ───────────────────────────────────────────────────────────
  function handleCellClick(row, col) {
    if (isWon) return
    startTimerIfNeeded()
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
      if (!autocheck) setIncorrectCells(new Set())
      const isLocked = revealedCells.has(key) || correctCells.has(key)
      if (cellValues[key] && !isLocked) {
        const n = { ...cellValues }; delete n[key]; setCellValues(n)
        if (autocheck) { setIncorrectCells(new Set()); setCorrectCells(prev => { const s = new Set(prev); s.delete(key); return s }) }
      } else if (activeEntry) {
        // Find the previous unlocked cell (skip revealed and confirmed-correct cells)
        const cells = getCellsInEntry(activeEntry)
        const idx = cells.findIndex(c => c.row === row && c.col === col)
        let target = null
        for (let i = idx - 1; i >= 0; i--) {
          const c = cells[i]
          const ck = `${c.row},${c.col}`
          if (!revealedCells.has(ck) && !correctCells.has(ck)) { target = c; break }
        }
        if (target) {
          setSelected(target)
          const targetKey = `${target.row},${target.col}`
          const n = { ...cellValues }; delete n[targetKey]; setCellValues(n)
          if (autocheck) setCorrectCells(prev => { const s = new Set(prev); s.delete(targetKey); return s })
        } else {
          // Can't go back in this clue — jump to next unsolved clue
          const nextEntry = getNextIncompleteEntry(entries, activeEntry, cellValues)
          if (nextEntry) {
            const dest = getFirstEmptyCellInEntry(nextEntry, cellValues)
            setSelected(dest ?? { row: nextEntry.row, col: nextEntry.col })
            setDirection(nextEntry.direction)
          }
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (direction !== 'across') { setDirection('across') }
      else { const next = getAdjacentCell(grid, row, col, 0, 1); if (next) setSelected(next) }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (direction !== 'across') { setDirection('across') }
      else { const next = getAdjacentCell(grid, row, col, 0, -1); if (next) setSelected(next) }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (direction !== 'down') { setDirection('down') }
      else { const next = getAdjacentCell(grid, row, col, 1, 0); if (next) setSelected(next) }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (direction !== 'down') { setDirection('down') }
      else { const next = getAdjacentCell(grid, row, col, -1, 0); if (next) setSelected(next) }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const entry = activeEntry ?? getEntryAt(entries, row, col, direction)
      if (entry) {
        const next = e.shiftKey ? getPrevEntry(entries, entry) : getNextEntry(entries, entry)
        setSelected({ row: next.row, col: next.col })
        setDirection(next.direction)
      }
    } else if (e.key === ' ') {
      e.preventDefault()
      if (spacebarClearAdvance) {
        // Clear cell + advance to next (only if not revealed/locked)
        const key = `${row},${col}`
        if (!revealedCells.has(key) && !correctCells.has(key)) {
          const n = { ...cellValues }; delete n[key]; setCellValues(n)
        }
        setIncorrectCells(new Set())
        const next = activeEntry ? getNextCellInEntry(activeEntry, row, col) : null
        if (next) setSelected(next)
      } else {
        // Toggle direction only
        const other = direction === 'across' ? 'down' : 'across'
        if (getEntryAt(entries, row, col, other)) setDirection(other)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setRebusMode(r => !r)
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

  // ── Check helpers ─────────────────────────────────────────────────────────
  function checkKeys(keysToCheck) {
    if (isWon) return
    const wrong = new Set()
    const correct = new Set(correctCells)
    for (const key of keysToCheck) {
      const letter = cellValues[key]
      if (!letter || !answerMap[key]) continue
      if (letter === answerMap[key]) {
        if (!revealedCells.has(key)) correct.add(key)
      } else {
        wrong.add(key)
      }
    }
    setIncorrectCells(wrong)
    setCorrectCells(correct)
    if (wrong.size > 0) setTimeout(() => setIncorrectCells(new Set()), 3000)
  }

  function handleCheckSquare() {
    if (!selected) return
    checkKeys([`${selected.row},${selected.col}`])
    setShowCheckMenu(false)
  }

  function handleCheckWord() {
    if (!activeEntry) return
    checkKeys(getCellsInEntry(activeEntry).map(c => `${c.row},${c.col}`))
    setShowCheckMenu(false)
  }

  function handleCheckPuzzle() {
    checkKeys(Object.keys(answerMap))
    setShowCheckMenu(false)
  }

  function handleToggleAutocheck() {
    setAutocheck(a => {
      const next = !a
      localStorage.setItem('autocheck', String(next))
      return next
    })
  }

  // ── Reveal helpers ────────────────────────────────────────────────────────
  function revealKeys(keys) {
    setIsAssisted(true)
    setIncorrectCells(new Set())
    const revealed = new Set(revealedCells)
    const newValues = { ...cellValues }
    for (const key of keys) {
      if (answerMap[key]) {
        revealed.add(key)
        newValues[key] = answerMap[key]
      }
    }
    setRevealedCells(revealed)
    setCellValues(newValues)
    checkForWin(newValues, answerMap)
    setShowRevealMenu(false)
  }

  function handleRevealSquare() {
    if (!selected || isWon) return
    const key = `${selected.row},${selected.col}`
    setPendingConfirm({
      message: 'Reveal this square? This will mark it as assisted.',
      onConfirm: () => revealKeys([key]),
    })
  }

  function handleRevealWord() {
    if (!activeEntry || isWon) return
    const keys = getCellsInEntry(activeEntry).map(c => `${c.row},${c.col}`)
    setPendingConfirm({
      message: 'Reveal this word? This will mark it as assisted.',
      onConfirm: () => revealKeys(keys),
    })
  }

  function handleRevealPuzzle() {
    if (isWon) return
    setPendingConfirm({
      message: 'Reveal the entire puzzle? This will mark it as assisted.',
      onConfirm: () => {
        revealKeys(Object.keys(answerMap))
        setIsWon(true)
        setShowModal(true)
        clearInterval(intervalRef.current)
        intervalRef.current = null
      },
    })
  }

  // ── Settings toggles ──────────────────────────────────────────────────────
  function toggleSetting(key, setter) {
    setter(prev => {
      const next = !prev
      localStorage.setItem(key, String(next))
      return next
    })
  }

  // ── Share ─────────────────────────────────────────────────────────────────
  function handleShare() {
    if (!seedParam) return
    const poolSuffix = poolParam ? `&pool=${poolParam}` : ''
    const shareUrl = dailyNumber ? `${BASE_URL}/daily` : `${BASE_URL}/?seed=${seedParam}${poolSuffix}`
    navigator.clipboard.writeText(`${shareUrl}\nCode: ${seedParam}`).then(() => {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    })
  }

  function handleShareResult() {
    if (!seedParam) return
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0')
    const s = String(elapsed % 60).padStart(2, '0')
    const poolSuffix = poolParam ? `&pool=${poolParam}` : ''
    const shareUrl = dailyNumber ? `${BASE_URL}/daily` : `${BASE_URL}/?seed=${seedParam}${poolSuffix}`
    const text = `I solved the Small Indy in ${m}:${s}!${isAssisted ? ' (with help)' : ''}\n${shareUrl}`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShareFeedback(true)
        setTimeout(() => setShareFeedback(false), 2000)
      })
    }
  }

  function handleToggleMute() {
    setMuteJingle(m => {
      const next = !m
      localStorage.setItem('muteJingle', String(next))
      return next
    })
  }

  // ── Reset (play again) ────────────────────────────────────────────────────
  function handleResetConfirm() {
    setPendingConfirm({
      message: 'Reset puzzle? All entries will be cleared and the timer will restart.',
      onConfirm: handleReset,
    })
  }

  function handleReset() {
    setCellValues({})
    setSelected(null)
    setDirection('across')
    setElapsed(0)
    setIsWon(false)
    setIsPaused(false)
    setShowModal(false)
    setIncorrectCells(new Set())
    setRevealedCells(new Set())
    setCorrectCells(new Set())
    setRebusMode(false)
    setPendingConfirm(null)
    setIsAssisted(false)
    startTimeRef.current = null
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  return (
    <main className={styles.page}>
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

      {isTouchDevice ? (
        /* ── MOBILE LAYOUT ───────────────────────────────────────────── */
        <div className={[
          styles.mobileAboveFold,
          selected && styles.mobileAboveFoldFocused,
          showSettings && styles.mobileSettingsOpen,
        ].filter(Boolean).join(' ')}>
          {/* Title — hidden when puzzle has focus */}
          {!selected && (
            <div className={styles.header}>
              <h1 className={styles.title}>Small Indy{dailyNumber ? ` — Day ${dailyNumber}` : ''}</h1>
            </div>
          )}
          {!selected && poolName && <p className={styles.poolSubtitle}>{poolName}</p>}

          {/* Compact control bar: timer on left, icon buttons on right */}
          <div className={styles.mobileControlBar}>
            <div className={styles.mobileTimerGroup}>
              {hideTimer ? (
                <span className={styles.timer} aria-label="Timer hidden">⏱ —:——</span>
              ) : (
                <button
                  className={`${styles.timer} ${styles.timerBtn}${isPaused ? ` ${styles.timerPaused}` : ''}`}
                  onClick={handleTogglePause}
                  aria-label={isPaused ? 'Resume timer' : `Time elapsed: ${formatTime(elapsed)} — click to pause`}
                  title={isPaused ? 'Click to resume' : 'Click to pause'}
                >
                  {isPaused ? '⏸ Paused' : formatTime(elapsed)}
                </button>
              )}
              <button
                className={styles.timerToggle}
                onClick={handleToggleHideTimer}
                aria-label={hideTimer ? 'Show timer' : 'Hide timer'}
                title={hideTimer ? 'Show timer' : 'Hide timer'}
              >
                {hideTimer ? '👁' : '🙈'}
              </button>
            </div>
            <div className={styles.mobileIconGroup}>
              <button className={styles.muteBtn} onClick={handleToggleMute} aria-label={muteJingle ? 'Unmute completion sound' : 'Mute completion sound'} title={muteJingle ? 'Completion sound off' : 'Completion sound on'}>
                {muteJingle ? '🔇' : '🔔'}
              </button>
              <button className={styles.themeToggle} onClick={() => setShowSettings(s => !s)} aria-label="Settings" title="Settings">⚙</button>
              <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {showSettings && (
            <div className={styles.settingsPanel} role="dialog" aria-label="Settings">
              <h2 className={styles.settingsHeading}>Settings</h2>
              <label className={styles.settingRow}>
                <input type="checkbox" checked={skipFilled} onChange={() => toggleSetting('skipFilled', setSkipFilled)} />
                Skip filled squares
              </label>
              <label className={styles.settingRow}>
                <input type="checkbox" checked={jumpToNextClue} onChange={() => toggleSetting('jumpToNextClue', setJumpToNextClue)} />
                Jump to next clue on word complete
              </label>
              <label className={styles.settingRow}>
                <input type="checkbox" checked={spacebarClearAdvance} onChange={() => toggleSetting('spacebarClearAdvance', setSpacebarClearAdvance)} />
                Spacebar clears cell &amp; advances (instead of toggle direction)
              </label>
              <Link to="/generate" className={styles.settingsGenerateLink} onClick={() => setShowSettings(false)}>Generate a new puzzle →</Link>
              <button className={styles.settingsClose} onClick={() => setShowSettings(false)}>Close ✕</button>
            </div>
          )}

          <ClueBar
            activeEntry={activeEntry}
            onPrevClue={handlePrevClue}
            onNextClue={handleNextClue}
            blurred={selected === null}
          />

          <div className={styles.mobileGridArea}>
            <div className={styles.gridWrapper}>
              <CrosswordGrid
                puzzle={puzzle}
                cellValues={cellValues}
                selected={selected}
                activeWordKeys={activeWordKeys}
                incorrectCells={incorrectCells}
                revealedCells={revealedCells}
                correctCells={correctCells}
                rebusMode={rebusMode}
                isWon={isWon}
                onCellClick={isPaused ? undefined : handleCellClick}
                onKeyDown={isPaused ? undefined : handleKeyDown}
                isActive={!isPaused && selected !== null}
              />
              {isPaused && (
                <div className={styles.pauseOverlay} onClick={handleTogglePause} role="button" aria-label="Resume">
                  <span>⏸ Paused</span>
                  <span className={styles.pauseHint}>Tap to resume</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.controls} role="group" aria-label="Puzzle controls">
            <div className={styles.menuWrapper} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setShowCheckMenu(false) }}>
              <button
                className={`${styles.btn}${autocheck ? ` ${styles.btnActive}` : ''}`}
                onClick={() => setShowCheckMenu(m => !m)}
                disabled={isWon}
                aria-haspopup="true"
                aria-expanded={showCheckMenu}
              >
                Check ▾
              </button>
              {showCheckMenu && (
                <div className={styles.menuDropdown} role="menu">
                  <button className={styles.menuItem} onClick={handleCheckSquare} disabled={!selected} role="menuitem">Check Square</button>
                  <button className={styles.menuItem} onClick={handleCheckWord} disabled={!activeEntry} role="menuitem">Check Word</button>
                  <button className={styles.menuItem} onClick={handleCheckPuzzle} role="menuitem">Check Puzzle</button>
                  <hr className={styles.menuDivider} />
                  <button
                    className={`${styles.menuItem}${autocheck ? ` ${styles.menuItemActive}` : ''}`}
                    onClick={handleToggleAutocheck}
                    role="menuitemcheckbox"
                    aria-checked={autocheck}
                  >
                    {autocheck ? '✓ ' : ''}Autocheck
                  </button>
                </div>
              )}
            </div>
            <div className={styles.menuWrapper} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setShowRevealMenu(false) }}>
              <button
                className={styles.btnDanger}
                onClick={() => setShowRevealMenu(m => !m)}
                disabled={isWon}
                aria-haspopup="true"
                aria-expanded={showRevealMenu}
              >
                Reveal ▾
              </button>
              {showRevealMenu && (
                <div className={styles.menuDropdown} role="menu">
                  <button className={styles.menuItem} onClick={handleRevealSquare} disabled={!selected} role="menuitem">Reveal Square</button>
                  <button className={styles.menuItem} onClick={handleRevealWord} disabled={!activeEntry} role="menuitem">Reveal Word</button>
                  <button className={styles.menuItem} onClick={handleRevealPuzzle} role="menuitem">Reveal Puzzle</button>
                  <hr className={styles.menuDivider} />
                  <button className={styles.menuItem} onClick={handleResetConfirm} role="menuitem">Reset Puzzle</button>
                </div>
              )}
            </div>
          </div>

          {!selected && (
            <>
              <div className={styles.seedBar}>
                <span className={styles.seedCode} title="Puzzle code">{seedParam}</span>
                <button className={styles.shareBtn} onClick={handleShare} aria-label="Copy share link">
                  {copyFeedback ? 'Copied!' : 'Share'}
                </button>
              </div>
              {dailyNumber && nextPuzzleIn && (
                <p className={styles.nextPuzzle}>Next puzzle in <span className={styles.nextPuzzleCountdown}>{nextPuzzleIn}</span></p>
              )}
            </>
          )}

          {selected && (
            <MobileKeyboard
              onLetter={processLetter}
              onBackspace={handleMobileBackspace}
              onRebus={() => setRebusMode(r => !r)}
              rebusActive={rebusMode}
              clueLabel={activeEntry ? `${activeEntry.clueNumber}-${activeEntry.direction === 'across' ? 'A' : 'D'}` : ''}
              clueText={activeEntry?.clue ?? ''}
            />
          )}
        </div>
      ) : (
        /* ── DESKTOP LAYOUT ──────────────────────────────────────────── */
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>
              Small Indy{dailyNumber ? ` — Day ${dailyNumber}` : ''}
            </h1>
            <button className={styles.themeToggle} onClick={() => setShowSettings(s => !s)} aria-label="Settings" title="Settings">
              ⚙
            </button>
            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          {poolName && <p className={styles.poolSubtitle}>{poolName}</p>}

          {showSettings && (
            <div className={styles.settingsPanel} role="dialog" aria-label="Settings">
              <h2 className={styles.settingsHeading}>Settings</h2>
              <label className={styles.settingRow}>
                <input type="checkbox" checked={skipFilled} onChange={() => toggleSetting('skipFilled', setSkipFilled)} />
                Skip filled squares
              </label>
              <label className={styles.settingRow}>
                <input type="checkbox" checked={jumpToNextClue} onChange={() => toggleSetting('jumpToNextClue', setJumpToNextClue)} />
                Jump to next clue on word complete
              </label>
              <label className={styles.settingRow}>
                <input type="checkbox" checked={spacebarClearAdvance} onChange={() => toggleSetting('spacebarClearAdvance', setSpacebarClearAdvance)} />
                Spacebar clears cell &amp; advances (instead of toggle direction)
              </label>
              <Link to="/generate" className={styles.settingsGenerateLink} onClick={() => setShowSettings(false)}>Generate a new puzzle →</Link>
              <button className={styles.settingsClose} onClick={() => setShowSettings(false)}>Close ✕</button>
            </div>
          )}

          <button className={styles.muteBtn} onClick={handleToggleMute} aria-label={muteJingle ? 'Unmute completion sound' : 'Mute completion sound'} title={muteJingle ? 'Completion sound off' : 'Completion sound on'}>
            {muteJingle ? '🔇' : '🔔'}
          </button>

          <div className={styles.timerRow}>
            {hideTimer ? (
              <span className={styles.timer} aria-label="Timer hidden">⏱ —:——</span>
            ) : (
              <button
                className={`${styles.timer} ${styles.timerBtn}${isPaused ? ` ${styles.timerPaused}` : ''}`}
                onClick={handleTogglePause}
                aria-label={isPaused ? 'Resume timer' : `Time elapsed: ${formatTime(elapsed)} — click to pause`}
                title={isPaused ? 'Click to resume' : 'Click to pause'}
              >
                {isPaused ? '⏸ Paused' : formatTime(elapsed)}
              </button>
            )}
            <button
              className={styles.timerToggle}
              onClick={handleToggleHideTimer}
              aria-label={hideTimer ? 'Show timer' : 'Hide timer'}
              title={hideTimer ? 'Show timer' : 'Hide timer'}
            >
              {hideTimer ? '👁' : '🙈'}
            </button>
          </div>

          {/* Desktop 3-column layout: Across | Grid+Controls | Down */}
          <div className={styles.playLayout}>
            <div className={styles.clueAside}>
              <ClueList
                entries={entries}
                activeEntryId={activeEntry?.id ?? null}
                completedEntryIds={completedEntryIds}
                onClueClick={handleClueClick}
                filter="across"
                blurred={selected === null}
              />
            </div>

            <div className={styles.centerCol}>
              <ClueBar
                activeEntry={activeEntry}
                onPrevClue={handlePrevClue}
                onNextClue={handleNextClue}
                blurred={selected === null}
              />

              <div className={styles.gridWrapper}>
                <CrosswordGrid
                  puzzle={puzzle}
                  cellValues={cellValues}
                  selected={selected}
                  activeWordKeys={activeWordKeys}
                  incorrectCells={incorrectCells}
                  revealedCells={revealedCells}
                  correctCells={correctCells}
                  rebusMode={rebusMode}
                  isWon={isWon}
                  onCellClick={isPaused ? undefined : handleCellClick}
                  onKeyDown={isPaused ? undefined : handleKeyDown}
                  isActive={!isPaused && selected !== null}
                />
                {isPaused && (
                  <div className={styles.pauseOverlay} onClick={handleTogglePause} role="button" aria-label="Resume">
                    <span>⏸ Paused</span>
                    <span className={styles.pauseHint}>Tap to resume</span>
                  </div>
                )}
              </div>

              <div className={styles.controls} role="group" aria-label="Puzzle controls">
                <div className={styles.menuWrapper} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setShowCheckMenu(false) }}>
                  <button
                    className={`${styles.btn}${autocheck ? ` ${styles.btnActive}` : ''}`}
                    onClick={() => setShowCheckMenu(m => !m)}
                    disabled={isWon}
                    aria-haspopup="true"
                    aria-expanded={showCheckMenu}
                  >
                    Check ▾
                  </button>
                  {showCheckMenu && (
                    <div className={styles.menuDropdown} role="menu">
                      <button className={styles.menuItem} onClick={handleCheckSquare} disabled={!selected} role="menuitem">Check Square</button>
                      <button className={styles.menuItem} onClick={handleCheckWord} disabled={!activeEntry} role="menuitem">Check Word</button>
                      <button className={styles.menuItem} onClick={handleCheckPuzzle} role="menuitem">Check Puzzle</button>
                      <hr className={styles.menuDivider} />
                      <button
                        className={`${styles.menuItem}${autocheck ? ` ${styles.menuItemActive}` : ''}`}
                        onClick={handleToggleAutocheck}
                        role="menuitemcheckbox"
                        aria-checked={autocheck}
                      >
                        {autocheck ? '✓ ' : ''}Autocheck
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.menuWrapper} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setShowRevealMenu(false) }}>
                  <button
                    className={styles.btnDanger}
                    onClick={() => setShowRevealMenu(m => !m)}
                    disabled={isWon}
                    aria-haspopup="true"
                    aria-expanded={showRevealMenu}
                  >
                    Reveal ▾
                  </button>
                  {showRevealMenu && (
                    <div className={styles.menuDropdown} role="menu">
                      <button className={styles.menuItem} onClick={handleRevealSquare} disabled={!selected} role="menuitem">Reveal Square</button>
                      <button className={styles.menuItem} onClick={handleRevealWord} disabled={!activeEntry} role="menuitem">Reveal Word</button>
                      <button className={styles.menuItem} onClick={handleRevealPuzzle} role="menuitem">Reveal Puzzle</button>
                      <hr className={styles.menuDivider} />
                      <button className={styles.menuItem} onClick={handleResetConfirm} role="menuitem">Reset Puzzle</button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.seedBar}>
                <span className={styles.seedCode} title="Puzzle code">{seedParam}</span>
                <button className={styles.shareBtn} onClick={handleShare} aria-label="Copy share link">
                  {copyFeedback ? 'Copied!' : 'Share'}
                </button>
              </div>

              {dailyNumber && nextPuzzleIn && (
                <p className={styles.nextPuzzle}>Next puzzle in <span className={styles.nextPuzzleCountdown}>{nextPuzzleIn}</span></p>
              )}
            </div>

            <div className={styles.clueAside}>
              <ClueList
                entries={entries}
                activeEntryId={activeEntry?.id ?? null}
                completedEntryIds={completedEntryIds}
                onClueClick={handleClueClick}
                filter="down"
                blurred={selected === null}
              />
            </div>
          </div>
        </>
      )}

      {/* Mobile clue list — scrollable below the fold */}
      {isTouchDevice && (
        <div className={styles.cluesMobile}>
          <ClueList
            entries={entries}
            activeEntryId={activeEntry?.id ?? null}
            completedEntryIds={completedEntryIds}
            onClueClick={handleClueClick}
            blurred={selected === null}
          />
        </div>
      )}

      {pendingConfirm && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
          <div className={styles.confirmBox}>
            <p className={styles.confirmMessage}>{pendingConfirm.message}</p>
            <div className={styles.confirmButtons}>
              <button className={styles.btn} onClick={() => setPendingConfirm(null)}>Cancel</button>
              <button className={styles.btnDanger} onClick={() => { pendingConfirm.onConfirm(); setPendingConfirm(null) }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <CompletionModal
          elapsed={elapsed}
          assisted={isAssisted}
          onDismiss={() => setShowModal(false)}
          onClose={handleReset}
          onShareResult={handleShareResult}
          shareFeedback={shareFeedback}
        />
      )}
    </main>
  )
}
