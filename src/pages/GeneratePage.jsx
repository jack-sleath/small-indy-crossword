import { useEffect } from 'react'

export default function GeneratePage() {
  useEffect(() => {
    fetch('/small-indy-crossword/pool.json')
      .then((r) => r.json())
      .then((data) => console.log('pool.json (GeneratePage):', data))
  }, [])

  return <h1>Generate Page</h1>
}
