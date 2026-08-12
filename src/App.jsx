import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PlayPage from './pages/PlayPage'
import GeneratePage from './pages/GeneratePage'
import DailyPage from './pages/DailyPage'
import RandomPage from './pages/RandomPage'
import { warmPoolCache } from './utils/poolCache'

export default function App() {
  // Pull every pool into the cache in the background once the app has settled,
  // so all themes are playable offline and pool switching is instant.
  useEffect(() => { warmPoolCache() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/random" element={<RandomPage />} />
      </Routes>
    </BrowserRouter>
  )
}
