# Acceptance Criteria

## Overview
A responsive, static React web app that recreates the NYT Mini crossword experience. A `/generate` route runs a constraint solver to build a 5×5 crossword from a pool of clues, producing a shareable seed. The main `/` play route decodes that seed and lets users solve the puzzle with a timer and completion state.

## Target User
A small private group of friends/family who want to play the same daily-style mini crossword puzzle together.

## Tech Stack
- Language: JavaScript (JSX)
- Framework: React
- Database: None — clue/answer data loaded from a static JSON file
- Hosting/Infrastructure: GitHub Pages (static site)

## Functional Requirements

### Play Route (`/`)
1. The app must load clues and answers from a static JSON file (`pool.json`) at startup.
2. If a `?seed=` query parameter is present, the app decodes it into a full puzzle layout using the pool and renders it.
3. If no seed is present, the app prompts the user to visit `/generate` to create a puzzle.
4. The user can click or tap a cell to select it and type a letter to fill it in.
5. The user can navigate between cells using arrow keys and the Tab key.
6. The user can click a clue in the clue list to jump to its starting cell.
7. The active clue (Across or Down) must be highlighted visually as the user navigates the grid.
8. The app must display a timer that starts when the user first interacts with the grid.
9. The app must detect when all cells are correctly filled and show a completion/win state.
10. The completion state must display the user's solve time.
11. The user can check their current answers (highlighting incorrect cells).
12. The user can reveal the solution for a selected cell or the entire grid.
13. The play route must display the short seed code and a share button at all times.
14. The share button copies the seeded URL and short code to the clipboard.

### Generator Route (`/generate`)
15. The `/generate` page runs a constraint solver to select entries from the pool and arrange them into a valid solvable 5×5 crossword grid.
16. The generator displays a read-only preview of the generated puzzle.
17. The generator displays the short seed code and a copy-to-clipboard share button.
18. The generator provides a "Regenerate" button to produce a different puzzle from the pool.
19. The generator provides a direct link to the play route pre-loaded with the generated seed.

### Shared
20. The user can share a puzzle via a URL containing the seed (e.g. `/?seed=abc123`).
21. The user can share via a short alphanumeric code that can be entered manually.
22. Anyone who opens the seeded URL or enters the short code receives the exact same puzzle.
23. The app must be fully usable on both mobile (touch) and desktop (keyboard + mouse).

## Non-Functional Requirements
- The app must work offline after initial load (fully static, no network calls during gameplay).
- The UI must be responsive and functional at viewport widths from 320px upward.
- Puzzle generation on `/generate` must complete in < 2 seconds on a modern device.
- The seed encoding must be stable — a given seed must always produce the same puzzle regardless of app version changes to unrelated code.
- The constraint solver must fail gracefully with a clear error if the pool is too small to form a valid 5×5 grid.

## Out of Scope
- User accounts, authentication, or solve history tracking.
- Leaderboards or competitive features.
- Manual puzzle authoring UI — the pool JSON is maintained externally.
- Grids larger or smaller than 5×5.
- Hints or penalty systems.
- The generator is not intended as a public-facing tool — it is a utility for the puzzle creator.
