import styles from './CompletionModal.module.css'

/**
 * Props:
 *   elapsed   — number of seconds taken to solve
 *   assisted  — boolean: whether the user used Reveal
 *   onClose   — () => void
 */
export default function CompletionModal({ elapsed, assisted, onClose }) {
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Puzzle complete">
      <div className={styles.modal}>
        <h2 className={styles.heading}>Puzzle solved!</h2>
        <p className={styles.time}>{minutes}:{seconds}</p>
        {assisted && <p className={styles.assisted}>Solved with assistance</p>}
        <button className={styles.button} onClick={onClose}>
          Play again
        </button>
      </div>
    </div>
  )
}
