# Small Indy Crossword

A lightweight, shareable 5×5 mini crossword app for small private groups. Generate a puzzle, share a link, and race to solve it.

Built with React + Vite and deployed to GitHub Pages.

---

## Playing a Puzzle

Visit the play URL with a `?seed=` query parameter:

```
https://jack-sleath.github.io/small-indy-crossword/?seed=<code>
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

## Generating a Puzzle

Visit [`/generate`](https://jack-sleath.github.io/small-indy-crossword/generate):

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

## Deploying

```bash
npm run build   # build to dist/
npm run deploy  # publish dist/ to the gh-pages branch
```

GitHub Pages is configured to serve from the `gh-pages` branch. The `404.html` redirect handles client-side routing so deep links work correctly.

---

## Development

```bash
npm install
npm run dev    # start local dev server at http://localhost:5173
```

Tech stack: React 19, Vite 8, React Router 7, deployed via gh-pages.
