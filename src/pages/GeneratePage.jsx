import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueList from '../components/ClueList'
import { solvePattern, validatePool } from '../utils/solver'
import { PATTERNS } from '../utils/patterns'
import { buildPuzzle } from '../utils/buildPuzzle'
import { encodeSeed } from '../utils/seed'
import styles from './GeneratePage.module.css'

const BASE_URL = `${window.location.origin}/small-indy-crossword`

export default function GeneratePage() {
  const [pool, setPool] = useState(null)
  const [poolErrors, setPoolErrors] = useState([])
  const [puzzle, setPuzzle] = useState(null)
  const [seed, setSeed] = useState(null)
  const [noSolution, setNoSolution] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const attemptRef = useRef(0)

  useEffect(() => {
    fetch('/small-indy-crossword/pool.json')
      .then((r) => r.json())
      .then(({ pool: p }) => {
        console.log('pool.json (GeneratePage):', p)
        const { valid, errors } = validatePool(p)
        if (!valid) {
          setPoolErrors(errors)
          return
        }
        setPool(p)
      })
  }, [])

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
    const rawEntries = solvePattern(pool, pattern, attempt)
    if (!rawEntries) {
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

  function handleCopy() {
    if (!seed) return
    const shareUrl = `${BASE_URL}/?seed=${seed}`
    navigator.clipboard.writeText(`${shareUrl}\nCode: ${seed}`).then(() => {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    })
  }

  if (poolErrors.length > 0) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Generate Puzzle</h1>
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
        <h1 className={styles.title}>Generate Puzzle</h1>
        <p className={styles.loading}>Loading pool…</p>
      </main>
    )
  }

  if (noSolution) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Generate Puzzle</h1>
        <div className={styles.error}>
          <p>The pool is too small or has insufficient word variety to form a valid puzzle.</p>
          <p>Add more 5-letter words to <code>pool.json</code> and try again.</p>
        </div>
        <button className={styles.btn} onClick={generate}>Regenerate</button>
      </main>
    )
  }

  if (!puzzle) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Generate Puzzle</h1>
        <p className={styles.loading}>Generating…</p>
      </main>
    )
  }

  const playUrl = `/?seed=${seed}`

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Generate Puzzle</h1>

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
