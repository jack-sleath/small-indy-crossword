import styles from './ClueList.module.css'

/**
 * Props:
 *   entries            — array of entry objects
 *   activeEntryId      — id of the currently active entry (for highlighting)
 *   completedEntryIds  — Set of entry ids whose words are fully filled (greyed out)
 *   onClueClick        — (entry) => void
 *   filter             — 'across' | 'down' | undefined (default: show both)
 */
export default function ClueList({ entries, activeEntryId, completedEntryIds = new Set(), onClueClick, filter, blurred = false }) {
  const across = entries
    .filter((e) => e.direction === 'across')
    .sort((a, b) => a.clueNumber - b.clueNumber)

  const down = entries
    .filter((e) => e.direction === 'down')
    .sort((a, b) => a.clueNumber - b.clueNumber)

  function renderEntry(entry) {
    const isActive = entry.id === activeEntryId
    const isComplete = completedEntryIds.has(entry.id)
    let className = styles.item
    if (isActive) className += ` ${styles.itemActive}`
    else if (isComplete) className += ` ${styles.itemComplete}`
    return (
      <li
        key={entry.id}
        className={className}
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

  const showAcross = !filter || filter === 'across'
  const showDown = !filter || filter === 'down'

  return (
    <div className={`${styles.clueList}${blurred ? ` ${styles.blurred}` : ''}`}>
      {showAcross && (
        <section>
          <h2 className={styles.heading}>Across</h2>
          <ol className={styles.list}>{across.map(renderEntry)}</ol>
        </section>
      )}
      {showDown && (
        <section>
          <h2 className={styles.heading}>Down</h2>
          <ol className={styles.list}>{down.map(renderEntry)}</ol>
        </section>
      )}
    </div>
  )
}
