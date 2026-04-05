import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueList from '../components/ClueList'
import { solvePattern, validatePool } from '../utils/solver'
import { PATTERNS } from '../utils/patterns'
import { buildPuzzle, hasIntersectionConflict } from '../utils/buildPuzzle'
import { encodeSeed } from '../utils/seed'
import { useTheme } from '../utils/useTheme'
import styles from './GeneratePage.module.css'

const BASE = '/small-indy-crossword'
const BASE_URL = `${window.location.origin}${BASE}`

export default function GeneratePage() {
  const { theme, toggleTheme } = useTheme()
  const [pools, setPools] = useState([])
  const [selectedSlug, setSelectedSlug] = useState(null)
  const [pool, setPool] = useState(null)
  const [poolErrors, setPoolErrors] = useState([])
  const [puzzle, setPuzzle] = useState(null)
  const [seed, setSeed] = useState(null)
  const [noSolution, setNoSolution] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const attemptRef = useRef(Math.floor(Math.random() * 65536))

  // Load manifest on mount, select the default pool
  useEffect(() => {
    fetch(`${BASE}/pools.json`)
      .then((r) => r.json())
      .then(({ pools: p }) => {
        setPools(p)
        const defaultEntry = p.find((e) => e.default) ?? p[0]
        setSelectedSlug(defaultEntry.slug)
      })
  }, [])

  // When selected pool changes, fetch and validate the pool file
  useEffect(() => {
    if (!selectedSlug || pools.length === 0) return
    const entry = pools.find((p) => p.slug === selectedSlug) ?? pools.find((p) => p.default) ?? pools[0]
    setPool(null)
    setPoolErrors([])
    setPuzzle(null)
    setSeed(null)
    fetch(`${BASE}/${entry.file}`)
      .then((r) => r.json())
      .then(({ pool: p }) => {
        const { valid, errors } = validatePool(p)
        if (!valid) {
          setPoolErrors(errors)
          return
        }
        setPool(p)
      })
  }, [selectedSlug, pools])

  // Auto-generate when pool loads
  useEffect(() => {
    if (pool) generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool])

  function generate() {
    if (!pool) return
    setNoSolution(false)
    const attempt = attemptRef.current
    attemptRef.current += 1
    const pattern = PATTERNS[attempt % PATTERNS.length]
    console.time(`solvePattern (attempt ${attempt}, pattern ${pattern.name})`)
    const rawEntries = solvePattern(pool, pattern, attempt)
    console.timeEnd(`solvePattern (attempt ${attempt}, pattern ${pattern.name})`)
    if (!rawEntries) {
      setNoSolution(true)
      setPuzzle(null)
      setSeed(null)
      return
    }
    if (hasIntersectionConflict(rawEntries)) {
      setNoSolution(true)
      setPuzzle(null)
      setSeed(null)
      return
    }
    const built = buildPuzzle(rawEntries)
    const s = encodeSeed(rawEntries)
    setPuzzle(built)
    setSeed(s)
    setPreviewVisible(false)
  }

  const isDefaultPool = pools.find((p) => p.slug === selectedSlug)?.default ?? false
  const poolSuffix = selectedSlug && !isDefaultPool ? `&pool=${selectedSlug}` : ''

  function handleCopy() {
    if (!seed) return
    const shareUrl = `${BASE_URL}/?seed=${seed}${poolSuffix}`
    navigator.clipboard.writeText(`${shareUrl}\nCode: ${seed}`).then(() => {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    })
  }

  const pageHeader = (
    <div className={styles.header}>
      <h1 className={styles.title}>Generate Puzzle</h1>
      <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  )

  const poolSelector = pools.length > 0 && (
    <div className={styles.poolSelector}>
      <label htmlFor="pool-select" className={styles.poolLabel}>Pool</label>
      <select
        id="pool-select"
        className={styles.poolSelect}
        value={selectedSlug ?? ''}
        onChange={(e) => setSelectedSlug(e.target.value)}
      >
        {pools.map((p) => (
          <option key={p.slug} value={p.slug}>{p.name}</option>
        ))}
      </select>
    </div>
  )

  if (poolErrors.length > 0) {
    return (
      <main className={styles.page}>
        {pageHeader}
        {poolSelector}
        <div className={styles.error}>
          <p><strong>Pool validation failed:</strong></p>
          <ul>{poolErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      </main>
    )
  }

  if (!pool) {
    return (
      <main className={styles.page}>
        {pageHeader}
        {poolSelector}
        <p className={styles.loading}>Loading pool…</p>
      </main>
    )
  }

  if (noSolution) {
    return (
      <main className={styles.page}>
        {pageHeader}
        {poolSelector}
        <div className={styles.error}>
          <p>The pool is too small or has insufficient word variety to form a valid puzzle.</p>
          <p>Add more 5-letter words to the pool and try again.</p>
        </div>
        <button className={styles.btn} onClick={generate}>Regenerate</button>
      </main>
    )
  }

  if (!puzzle) {
    return (
      <main className={styles.page}>
        {pageHeader}
        {poolSelector}
        <p className={styles.loading}>Generating…</p>
      </main>
    )
  }

  const playUrl = `/?seed=${seed}${poolSuffix}`

  return (
    <main className={styles.page}>
      {pageHeader}
      {poolSelector}

      {/* Read-only preview — hidden by default so the puzzle creator isn't spoiled */}
      <div className={styles.previewWrapper}>
        {previewVisible ? (
          <>
            <CrosswordGrid
              puzzle={puzzle}
              cellValues={Object.fromEntries(
                puzzle.entries.flatMap((e) => {
                  const cells = []
                  for (let i = 0; i < e.answer.length; i++) {
                    const row = e.direction === 'across' ? e.row : e.row + i
                    const col = e.direction === 'across' ? e.col + i : e.col
                    cells.push([`${row},${col}`, e.answer[i]])
                  }
                  return cells
                })
              )}
              selected={null}
              activeWordKeys={new Set()}
              incorrectCells={new Set()}
            />
            <ClueList entries={puzzle.entries} activeEntryId={null} />
            <button className={styles.revealBtn} onClick={() => setPreviewVisible(false)}>
              Hide preview
            </button>
          </>
        ) : (
          <button className={styles.revealBtn} onClick={() => setPreviewVisible(true)}>
            Reveal preview
          </button>
        )}
      </div>

      <div className={styles.seedBar}>
        <span className={styles.seedCode} title="Puzzle code">{seed}</span>
        <button className={styles.shareBtn} onClick={handleCopy}>
          {copyFeedback ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className={styles.actions}>
        <Link to={playUrl} className={styles.playLink}>Play this puzzle →</Link>
        <button className={styles.btn} onClick={generate}>Regenerate</button>
      </div>
    </main>
  )
}
