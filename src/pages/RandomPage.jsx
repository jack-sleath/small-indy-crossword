import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loadPoolBySlug } from '../utils/poolCache'
import { randomAttemptSeed, solveRandomPuzzle } from '../utils/randomPuzzle'
import { encodeSeed } from '../utils/seed'
import { useTheme } from '../utils/useTheme'
import styles from './PlayPage.module.css'

/**
 * `/random` — generate a puzzle immediately and drop straight into it,
 * skipping the generate page entirely.
 *
 * The seed comes from the exact current time, so every visit (and every
 * refresh) is a different puzzle. Once solved, we redirect to the normal
 * `/?seed=…` play URL with `replace: true`, which means:
 *   - the puzzle is shareable and resumable like any other
 *   - progress persistence keys off the seed as usual
 *   - Back returns to wherever the player came from, not to a re-roll
 *
 * `?pool=<slug>` picks a themed pool; without it the default pool is used.
 */
export default function RandomPage() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const poolParam = searchParams.get('pool')
  const [error, setError] = useState(null)
  // Bumped by "Try again" to re-run the effect after a failure.
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)

    loadPoolBySlug(poolParam)
      .then(({ entry, pool }) => {
        if (cancelled) return
        const entries = solveRandomPuzzle(pool, randomAttemptSeed())
        if (!entries) {
          setError('no-solution')
          return
        }
        const poolSuffix = entry.default ? '' : `&pool=${entry.slug}`
        navigate(`/?seed=${encodeSeed(entries)}${poolSuffix}`, { replace: true })
      })
      .catch(() => {
        if (!cancelled) setError('load')
      })

    return () => { cancelled = true }
  }, [poolParam, navigate, retry])

  const header = (
    <div className={styles.header}>
      <h1 className={styles.title}>Small Indy</h1>
      <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  )

  if (error) {
    return (
      <main className={styles.page}>
        {header}
        <div className={styles.noSeed}>
          <p>
            {error === 'no-solution'
              ? "Couldn't build a puzzle from this pool — it may be too small."
              : "Couldn't load the puzzle pool."}
          </p>
          <button className={styles.retryBtn} onClick={() => setRetry((n) => n + 1)}>
            Try again
          </button>
          <Link to="/generate" className={styles.randomLink}>Open the generator →</Link>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      {header}
      <p className={styles.loading}>Shuffling a random puzzle…</p>
    </main>
  )
}
