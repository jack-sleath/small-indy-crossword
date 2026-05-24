import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PlayPage from './PlayPage'
import { useTheme } from '../utils/useTheme'
import styles from './PlayPage.module.css'

const DAILY_SEEDS_URL = '/small-indy-crossword/daily-seeds.json'

export default function DailyPage() {
  const { theme, toggleTheme } = useTheme()
  const [seed, setSeed] = useState(null)
  const [error, setError] = useState(false)
  const [dayNumber, setDayNumber] = useState(null)

  useEffect(() => {
    fetch(DAILY_SEEDS_URL)
      .then(r => r.json())
      .then(({ startDate, seeds }) => {
        // Parse startDate as UTC midnight (ISO date-only strings are always UTC).
        // Date.now() is UTC epoch ms, so this division gives the UTC day number.
        const startUTC = new Date(startDate).getTime()
        const dayIndex = Math.max(0, Math.floor((Date.now() - startUTC) / 86_400_000)) % seeds.length
        setDayNumber(dayIndex + 1)
        setSeed(seeds[dayIndex])
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
