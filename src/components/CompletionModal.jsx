import { Link } from 'react-router-dom'
import styles from './CompletionModal.module.css'

/**
 * Props:
 *   elapsed        — number of seconds taken to solve
 *   assisted       — boolean: whether the user used Reveal
 *   revealedCount  — number of squares revealed during the solve
 *   onDismiss      — () => void — close modal, keep grid visible
 *   onClose        — () => void — play again (resets puzzle)
 *   onShareResult  — () => void — share spoiler-free solve result
 *   shareFeedback  — boolean — show 'Copied!' feedback
 */
export default function CompletionModal({ elapsed, assisted, revealedCount = 0, onDismiss, onClose, onShareResult, shareFeedback }) {
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')
  // Older saves recorded only the assisted flag, with no count to report.
  const assistText = revealedCount > 0
    ? `${revealedCount} square${revealedCount === 1 ? '' : 's'} revealed`
    : assisted ? 'Solved with assistance' : null

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Puzzle complete">
      <div className={styles.modal}>
        {onDismiss && (
          <button className={styles.closeBtn} onClick={onDismiss} aria-label="Close">✕</button>
        )}
        <h2 className={styles.heading}>🎉 Puzzle solved!</h2>
        <p className={styles.time}>{minutes}:{seconds}</p>
        {assistText && <p className={styles.assisted}>{assistText}</p>}
        <div className={styles.actions}>
          {onShareResult && (
            <button className={styles.shareButton} onClick={onShareResult}>
              {shareFeedback ? 'Copied!' : '📤 Share result'}
            </button>
          )}
          <Link to="/random" className={styles.nextLink}>
            🎲 Random puzzle
          </Link>
          <button className={styles.button} onClick={onClose}>
            Play again
          </button>
        </div>
      </div>
    </div>
  )
}
