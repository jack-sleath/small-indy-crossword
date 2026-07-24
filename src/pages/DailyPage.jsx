import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PlayPage from './PlayPage'
import { useTheme } from '../utils/useTheme'
import { resolveDailySeed } from '../utils/dailySeed'
import styles from './PlayPage.module.css'

export default function DailyPage() {
  const { theme, toggleTheme } = useTheme()
  const [seed, setSeed] = useState(null)
  const [error, setError] = useState(false)
  const [dayNumber, setDayNumber] = useState(null)

  useEffect(() => {
    const BASE = ''
    // Daily always uses the default (Guardian) pool. Resolve today's seed
    // on the fly from the UTC date — no pre-generated seed list needed.
    fetch(`${BASE}/pools.json`)
      .then((r) => r.json())
      .then(({ pools }) => {
        const entry = pools.find((p) => p.default) ?? pools[0]
        return fetch(`${BASE}/${entry.file}`)
      })
      .then((r) => r.json())
      .then(({ pool }) => {
        const result = resolveDailySeed(pool)
        if (!result) {
          setError(true)
          return
        }
        setDayNumber(result.dayNumber)
        setSeed(result.seed)
      })
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Small Indy</h1>
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <div className={styles.noSeed}>
          <p>Could not load today's daily puzzle.</p>
          <Link to="/generate" className={styles.generateLink}>Generate a puzzle instead →</Link>
        </div>
      </main>
    )
  }

  if (!seed) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Small Indy</h1>
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <p className={styles.loading}>Loading daily puzzle…</p>
      </main>
    )
  }

  return <PlayPage overrideSeed={seed} dailyNumber={dayNumber} />
}
