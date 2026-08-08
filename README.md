# Small Indy Crossword

A lightweight, shareable 5×5 mini crossword app for small private groups. Generate a puzzle, share a link, and race to solve it.

**🔗 Live at [small-indy.jack-sleath.dev](https://small-indy.jack-sleath.dev)**

Built with React + Vite and deployed to GitHub Pages.

---

## Playing a Puzzle

Visit the play URL with a `?seed=` query parameter:

```
https://small-indy.jack-sleath.dev/?seed=<code>
```

- **Click or tap a cell** to select it
- **Type a letter** to fill it in and advance to the next cell
- **Backspace** to clear and move back
- **Arrow keys** to navigate between cells
- **Tab** to jump to the next clue
- **Click a clue** in the list to jump to its starting cell

Controls below the grid:
- **Check** — highlights incorrect letters in red for 3 seconds
- **Reveal cell** — fills the selected cell with the correct answer
- **Reveal all** — fills the entire grid (marks the solve as assisted)
- **Share** — copies the puzzle URL and short code to your clipboard

The timer starts on your first keystroke and stops when you complete the puzzle.

---

## Random Puzzle

Visit [`/random`](https://small-indy.jack-sleath.dev/random) to skip the generate
page entirely: it seeds the solver from the exact current time, builds a puzzle,
and redirects straight to its `/?seed=…` play URL. Every visit (and every
refresh) gives a different puzzle, and the resulting URL is shareable and
resumable like any other.

Add `?pool=<slug>` for a themed pool, e.g. `/random?pool=star-wars`. Slugs come
from [`public/pools.json`](./public/pools.json).

`/random` is linked from the home screen, the in-game settings panel, and the
completion modal.

---

## Generating a Puzzle

Visit [`/generate`](https://small-indy.jack-sleath.dev/generate):

1. The solver picks words from `pool.json` and arranges them into a valid 5×5 grid
2. A read-only preview renders with the solution filled in
3. Copy the seed code or click **Play this puzzle →** to open the play route
4. Hit **Regenerate** for a different arrangement

Share the URL or just the short code — either works to load the same puzzle.

---

## Updating the Puzzle Pool

The word pool lives in [`public/pool.json`](./public/pool.json):

```json
{
  "pool": [
    { "id": "a3f9c2", "answer": "CRANE", "clue": "Bird or construction machine" },
    ...
  ]
}
```

### Rules for pool entries

| Field    | Requirement                                            |
|----------|--------------------------------------------------------|
| `id`     | Unique alphanumeric string (used in seed encoding)     |
| `answer` | Uppercase letters only, **exactly 5 characters**       |
| `clue`   | Non-empty string                                       |

> **Important:** Never change a word's `id` after it has been used in a shared seed — the seed encodes pool IDs and changing them will break existing links. To update a clue text you can edit the `clue` field safely.

The solver requires **at least 6 five-letter words** that can form valid intersecting triples. More variety = more distinct generated puzzles. Aim for 20+ entries for comfortable variation.

---

## Offline Support

The app is a PWA: the shell (JS/CSS/HTML/icons) plus `pools.json` are precached
on install, and shortly after the first load
[`src/utils/poolCache.js`](./src/utils/poolCache.js) downloads **every** pool in
the manifest in the background and writes it into the service worker's
`crossword-pools` cache. Once that has run, all themes are playable offline —
not just the one that happened to be opened first — and switching pools on the
generate page is instant.

The warm-up runs at idle, fetches sequentially so it never competes with the
visible page, skips pools already in the cache (so a returning visitor doesn't
re-download ~600 kB), and is skipped entirely when Data Saver is enabled. Pools
themselves are network-first, so an online visit always gets the latest file and
falls back to the cached copy only when offline.

---

## Deploying

Deploys happen automatically: pushing to `main` triggers the
[`Deploy to GitHub Pages`](.github/workflows/deploy.yml) workflow, which builds
the site and publishes `dist/` via GitHub's official Pages actions. Pages must
be set to build from **GitHub Actions** (Settings → Pages → Source).

To build locally: `npm run build` (output in `dist/`). The `404.html` redirect
handles client-side routing so deep links work correctly.

---

## Development

```bash
npm install
npm run dev    # start local dev server at http://localhost:5173
```

Tech stack: React 19, Vite 8, React Router 7, deployed to GitHub Pages via GitHub Actions.
