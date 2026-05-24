import { useRef } from 'react'
import styles from './ClueBar.module.css'

/**
 * Props:
 *   activeEntry  — the currently active entry object, or null
 *   onPrevClue   — () => void — navigate to previous clue
 *   onNextClue   — () => void — navigate to next clue
 */
export default function ClueBar({ activeEntry, onPrevClue, onNextClue, blurred = false }) {
  const touchStartX = useRef(null)

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) {
      if (delta < 0) onNextClue?.()   // swipe left → next clue
      else onPrevClue?.()              // swipe right → prev clue
    }
    touchStartX.current = null
  }

  const label = activeEntry
    ? `${activeEntry.clueNumber} ${activeEntry.direction.charAt(0).toUpperCase() + activeEntry.direction.slice(1)}`
    : null

  return (
    <div
      className={styles.clueBar}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-live="polite"
      aria-label={activeEntry ? `Active clue: ${label} — ${activeEntry.clue}` : 'No active clue'}
    >
      <button
        className={styles.navBtn}
        onClick={onPrevClue}
        aria-label="Previous clue"
        tabIndex={-1}
      >
        ‹
      </button>
      <span className={`${styles.clueText}${blurred ? ` ${styles.blurred}` : ''}`}>
        {activeEntry ? (
          <>
            <span className={styles.clueLabel}>{label} </span>
            {activeEntry.clue}
          </>
        ) : (
          <span className={styles.placeholder}>Select a cell to begin</span>
        )}
      </span>
      <button
        className={styles.navBtn}
        onClick={onNextClue}
        aria-label="Next clue"
        tabIndex={-1}
      >
        ›
      </button>
    </div>
  )
}
