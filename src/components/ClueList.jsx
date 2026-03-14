import styles from './ClueList.module.css'

/**
 * Props:
 *   entries         — array of entry objects
 *   activeEntryId   — id of the currently active entry (for highlighting)
 *   onClueClick     — (entry) => void
 */
export default function ClueList({ entries, activeEntryId, onClueClick }) {
  const across = entries
    .filter((e) => e.direction === 'across')
    .sort((a, b) => a.clueNumber - b.clueNumber)

  const down = entries
    .filter((e) => e.direction === 'down')
    .sort((a, b) => a.clueNumber - b.clueNumber)

  function renderEntry(entry) {
    const isActive = entry.id === activeEntryId
    return (
      <li
        key={entry.id}
        className={isActive ? `${styles.item} ${styles.itemActive}` : styles.item}
        onClick={() => onClueClick?.(entry)}
        role="button"
        tabIndex={-1}
        aria-pressed={isActive}
      >
        <span className={styles.number}>{entry.clueNumber}</span>
        {entry.clue}
      </li>
    )
  }

  return (
    <div className={styles.clueList}>
      <section>
        <h2 className={styles.heading}>Across</h2>
        <ol className={styles.list}>{across.map(renderEntry)}</ol>
      </section>
      <section>
        <h2 className={styles.heading}>Down</h2>
        <ol className={styles.list}>{down.map(renderEntry)}</ol>
      </section>
    </div>
  )
}
