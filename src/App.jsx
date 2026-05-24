import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PlayPage from './pages/PlayPage'
import GeneratePage from './pages/GeneratePage'
import DailyPage from './pages/DailyPage'

export default function App() {
  return (
    <BrowserRouter basename="/small-indy-crossword">
      <Routes>
        <Route path="/" element={<PlayPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/generate" element={<GeneratePage />} />
      </Routes>
    </BrowserRouter>
  )
}
