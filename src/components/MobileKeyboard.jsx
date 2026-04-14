import { useState } from 'react'
import styles from './MobileKeyboard.module.css'

const PRIMARY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['REBUS', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
]

const SECONDARY_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '.', '/', ':', ';', '(', ')', '&', '@'],
  ['ABC', '!', '?', ',', "'", '"', '+', '#', '⌫'],
]

/**
 * Props:
 *   onLetter    — (char: string) => void
 *   onBackspace — () => void
 *   onRebus     — () => void  (toggle rebus mode)
 *   rebusActive — boolean
 *   clueLabel   — string (e.g. "1-A") for the clue label
 *   clueText    — string (full clue text)
 */
export default function MobileKeyboard({
  onLetter,
  onBackspace,
  onRebus,
  rebusActive = false,
  clueLabel = '',
  clueText = '',
}) {
  const [secondary, setSecondary] = useState(false)
  const rows = secondary ? SECONDARY_ROWS : PRIMARY_ROWS

  function handleKey(key) {
    if (key === '⌫') {
      onBackspace?.()
    } else if (key === 'REBUS') {
      onRebus?.()
    } else if (key === 'ABC') {
      setSecondary(false)
    } else if (/^[0-9!?,.'"+()\-.:;/&#@]$/.test(key)) {
      onLetter?.(key)
    } else {
      onLetter?.(key)
    }
  }

  return (
    <div className={styles.wrapper}>
      {clueText && (
        <div className={styles.clueBar}>
          {clueLabel && <span className={styles.clueLabel}>{clueLabel}</span>}
          <span className={styles.clueText}>{clueText}</span>
        </div>
      )}
      <div className={styles.keyboard}>
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className={`${styles.row}${rowIdx === 1 ? ` ${styles.rowMiddle}` : ''}`}>
            {row.map((key) => {
              const isSpecial = key === '⌫' || key === 'REBUS' || key === 'ABC'
              const isActive = (key === 'REBUS' && rebusActive) || (key === 'ABC' && secondary)
              return (
                <button
                  key={key}
                  className={`${styles.key} ${isSpecial ? styles.keySpecial : ''} ${isActive ? styles.keyActive : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault() // prevent focus leaving the grid / blurring hidden input
                    handleKey(key)
                  }}
                  aria-label={key === '⌫' ? 'Backspace' : key}
                >
                  {key}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
