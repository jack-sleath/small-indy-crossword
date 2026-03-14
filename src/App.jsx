import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PlayPage from './pages/PlayPage'
import GeneratePage from './pages/GeneratePage'

export default function App() {
  return (
    <BrowserRouter basename="/small-indy-crossword">
      <Routes>
        <Route path="/" element={<PlayPage />} />
        <Route path="/generate" element={<GeneratePage />} />
      </Routes>
    </BrowserRouter>
  )
}
