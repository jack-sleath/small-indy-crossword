import styles from './ClueList.module.css'

export default function ClueList({ entries }) {
  const across = entries
    .filter((e) => e.direction === 'across')
    .sort((a, b) => a.clueNumber - b.clueNumber)

  const down = entries
    .filter((e) => e.direction === 'down')
    .sort((a, b) => a.clueNumber - b.clueNumber)

  return (
    <div className={styles.clueList}>
      <section>
        <h2 className={styles.heading}>Across</h2>
        <ol className={styles.list}>
          {across.map((entry) => (
            <li key={entry.id} className={styles.item}>
              <span className={styles.number}>{entry.clueNumber}</span>
              {entry.clue}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className={styles.heading}>Down</h2>
        <ol className={styles.list}>
          {down.map((entry) => (
            <li key={entry.id} className={styles.item}>
              <span className={styles.number}>{entry.clueNumber}</span>
              {entry.clue}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
