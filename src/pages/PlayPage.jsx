import { useEffect } from 'react'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueList from '../components/ClueList'
import SAMPLE_PUZZLE from '../data/samplePuzzle'
import styles from './PlayPage.module.css'

export default function PlayPage() {
  useEffect(() => {
    fetch('/small-indy-crossword/pool.json')
      .then((r) => r.json())
      .then((data) => console.log('pool.json (PlayPage):', data))
  }, [])

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Mini Crossword</h1>
      <CrosswordGrid puzzle={SAMPLE_PUZZLE} />
      <ClueList entries={SAMPLE_PUZZLE.entries} />
    </main>
  )
}
