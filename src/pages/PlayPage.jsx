import { useEffect } from 'react'

export default function PlayPage() {
  useEffect(() => {
    fetch('/small-indy-crossword/pool.json')
      .then((r) => r.json())
      .then((data) => console.log('pool.json (PlayPage):', data))
  }, [])

  return <h1>Play Page</h1>
}
