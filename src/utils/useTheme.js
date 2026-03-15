import { useCallback, useState } from 'react'

const STORAGE_KEY = 'crossword-theme'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch (_) {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const t = getInitialTheme()
    applyTheme(t)
    return t
  })

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      applyTheme(next)
      try { localStorage.setItem(STORAGE_KEY, next) } catch (_) {}
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
