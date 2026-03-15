# Milestones

## Tech Stack
- Language: JavaScript (JSX)
- Framework: React (Vite)
- Database: None — static JSON file
- Hosting/Infrastructure: GitHub Pages

---

## Milestone 1 — Project Scaffold
**Goal:** Get a working React app deployed to GitHub Pages with the basic file structure in place.

**Tasks:**
- Initialise a React + Vite project in the repo root
- Configure client-side routing (React Router) with two routes: `/` (play) and `/generate`
- Configure GitHub Pages deployment (e.g. `gh-pages` package or GitHub Actions workflow) with `404.html` redirect to support client-side routing
- Add a `pool.json` with a small sample of clue/answer pairs in the agreed shape:
  ```json
  { "pool": [{ "id": "a3f9c2", "answer": "CRANE", "clue": "Bird or construction machine" }] }
  ```
- Create stub `PlayPage` and `GeneratePage` components that each load `pool.json` and log it to the console
- Set up basic global CSS reset and mobile-friendly viewport meta tag

**Done when:**
- [x] `npm run dev` starts the app locally without errors
- [x] `/` and `/generate` routes both render without errors
- [x] `npm run build && npm run deploy` publishes to GitHub Pages
- [x] The deployed page is reachable and both routes work via the GitHub Pages URL
- [x] `pool.json` contents are visible in the browser console on both routes

---

## Milestone 2 — Crossword Grid Renderer
**Goal:** Render a static 5×5 crossword grid from a hardcoded puzzle layout.

**Tasks:**
- Define the data structure for a puzzle (grid cells, across/down entries, clue text, answer, start position)
- Create a `CrosswordGrid` component that renders a 5×5 grid of cells (black/white)
- Create a `ClueList` component that renders Across and Down clues
- Hardcode a single sample puzzle (bypassing generation for now) to validate the renderer
- Style the grid to look clean on both mobile and desktop viewports

**Done when:**
- [x] A 5×5 grid renders with correct black/white cell layout matching the hardcoded puzzle
- [x] Across and Down clue lists render with correct numbering
- [x] Layout is usable at 375px (mobile) and 1280px (desktop) widths

---

## Milestone 3 — Grid Interactivity
**Goal:** Users can navigate and fill in the crossword grid with keyboard and touch input.

**Tasks:**
- Implement cell selection state (selected cell, active direction)
- Handle keyboard input: letter keys fill cell and advance focus, Backspace clears and retreats, Arrow keys navigate, Tab advances to next clue start
- Implement touch/click: tap to select, tap again to toggle direction
- Highlight the active word in the grid and the corresponding clue in the clue list
- Clicking a clue highlights it and jumps to its start cell
- Store cell values in React state

**Done when:**
- [x] Clicking/tapping a cell selects it and highlights the active word
- [x] Typing letters fills cells and moves focus forward
- [x] Backspace clears and moves focus back
- [x] Arrow keys navigate between cells
- [x] Clicking a clue focuses its start cell
- [x] Direction toggles on repeated tap of same cell

---

## Milestone 4 — Correctness, Timer, and Completion
**Goal:** The game knows when the puzzle is solved and tracks how long it took.

**Tasks:**
- Implement a timer that starts on first cell interaction and displays in `MM:SS` format
- Implement win detection: check all cells match the answer on every input change
- Implement "Check" function: highlight incorrect cells in red temporarily
- Implement "Reveal cell" and "Reveal all" functions
- Build a completion modal/overlay showing solve time and whether the puzzle was assisted

**Done when:**
- [x] Timer starts on first keystroke and displays correctly
- [x] Completing the grid correctly triggers the win modal with elapsed time
- [x] Incorrect fill does not trigger win state
- [x] Check highlights only incorrect cells
- [x] Reveal cell fills the selected cell; Reveal all fills the entire grid
- [x] Completion modal appears and timer stops on win

---

## Milestone 5 — Seed Encoding & Play Route Integration
**Goal:** The play route can decode a seed from the URL into a full puzzle and display the seed/share UI.

**Tasks:**
- Define the seed format: each entry encoded as `poolId:row:col:direction`, comma-joined, then base64'd into a short alphanumeric string
- Implement `encodeSeed(entries) → string` and `decodeSeed(string, pool) → entries[]` utility functions
- On `/`, read `?seed=` from the URL query string; decode it using the pool and hand the resulting puzzle layout to the existing game components
- If no seed is present, show a prompt with a link to `/generate`
- Display the short seed code persistently on the play screen
- Implement the Share button: copies `<baseUrl>/?seed=<code>` and the short code to clipboard

**Done when:**
- [x] `encodeSeed` and `decodeSeed` are unit-testable pure functions
- [x] A hardcoded valid seed loads the correct puzzle on `/`
- [x] The short code is visible on the play screen
- [x] Share button copies URL and code to clipboard
- [x] Visiting `/` with no seed shows a prompt linking to `/generate`
- [x] The same seed produces the same puzzle on reload and on a different device

---

## Milestone 6 — Generator Route (`/generate`)
**Goal:** The `/generate` page runs a constraint solver, previews the result, and produces a shareable seed.

**Tasks:**
- Implement the crossword constraint solver: select entries from the pool and place them in a valid 5×5 grid using a backtracking algorithm
  - Every white cell must be covered by both an across and a down entry
  - Validate that intersecting cells share the correct letter
- Wire the solver output through `encodeSeed` to produce a seed string
- Render a read-only puzzle preview using the existing `CrosswordGrid` component
- Display the short seed code and a copy-to-clipboard share button
- Add a "Regenerate" button that runs the solver again for a different result
- Add a "Play this puzzle →" link that navigates to `/?seed=<code>`
- Show a clear error message if the pool is too small to form a valid grid
- Validate pool at load: entries must have unique IDs, uppercase letter-only answers, 2–5 characters

**Done when:**
- [x] `/generate` produces a valid, solvable 5×5 crossword from `pool.json`
- [x] The generated puzzle preview renders correctly
- [x] The seed code is displayed and copies to clipboard
- [x] "Play this puzzle →" opens the play route with the correct puzzle
- [x] "Regenerate" produces a different layout
- [x] A pool that is too small shows a clear error instead of crashing
- [x] Generation completes in under 2 seconds on a modern device

---

## Milestone 7 — Polish and Production Readiness
**Goal:** The app is visually polished, accessible, and ready for the private group to use.

**Tasks:**
- Refine visual design: typography, colours, animations (cell fill, win state)
- Ensure keyboard accessibility (focus indicators, logical tab order)
- Test and fix mobile keyboard edge cases (hidden input field approach if needed)
- Final cross-browser and cross-device QA (Chrome/Safari mobile, Chrome/Firefox desktop)
- Update README with usage instructions and how to update `pool.json`

**Done when:**
- [x] All Acceptance Criteria are met
- [x] App passes manual QA on Chrome/Safari mobile and Chrome/Firefox desktop
- [x] README documents how to update puzzle content and deploy
- [x] No console errors in production build

---

## Milestone 8 — Theme Support [visual-ux]
**Branch:** milestone-8-visual-ux
**Goal:** Add light and dark mode to the app, defaulting to system preference with a manual override that persists.

**Tasks:**
- Introduce CSS custom properties (variables) for all colours used in the app
- Detect `prefers-color-scheme` on load and apply the matching theme class/attribute
- Add a theme toggle button to the play and generate pages
- Persist the user's manual theme choice in `localStorage`
- Restore persisted preference on page load, falling back to system preference

**Done when:**
- [ ] App renders correctly in both light and dark modes
- [ ] On first load, theme matches the OS/system preference with no flash of the wrong theme
- [ ] Toggling the theme control switches the UI immediately (< 100ms)
- [ ] Theme preference is preserved across a full page reload
- [ ] No visual regressions at 320px and 1280px viewport widths

---

## Milestone 9 — Letter State Colouring [visual-ux]
**Branch:** milestone-9-visual-ux
**Goal:** Revealed letters are permanently marked red; correctly checked letters are marked blue.

**Tasks:**
- Extend cell state model to track `revealed` and `checked-correct` flags alongside the letter value
- Apply red styling to any cell marked `revealed`
- Ensure red styling is not overwritten when the user types into a revealed cell
- Apply blue styling to cells marked `checked-correct` when the Check action is used
- Ensure blue does not override red (revealed cells are never styled blue)

**Done when:**
- [ ] Using "Reveal cell" or "Reveal all" marks the affected cell(s) red immediately
- [ ] Red colouring persists if the user subsequently types a new letter into a revealed cell
- [ ] Using "Check" marks correctly filled (non-revealed) cells blue
- [ ] Cells that are both revealed and correct remain red, not blue
- [ ] Colouring is visible and correct in both light and dark themes

---

## Milestone 10 — Grid Pattern Variety [variety]
**Branch:** milestone-10-variety
**Goal:** Support at least 3 distinct 5×5 black/white cell patterns so puzzles can contain words of varying lengths.

**Tasks:**
- Define a data structure for describing a 5×5 grid pattern (which cells are black)
- Implement at least 3 predefined patterns that differ from the original full 3-across/3-down layout
- Update the constraint solver to accept an arbitrary pattern and correctly derive word slots (across and down) of varying lengths
- Update `encodeSeed` / `decodeSeed` to remain compatible with variable-length word entries
- Update the `CrosswordGrid` and `ClueList` components to render words of length 2–5 correctly
- Update clue numbering logic to handle arbitrary patterns
- Add the new patterns to `/generate` so the generator picks from them

**Done when:**
- [ ] At least 3 distinct 5×5 patterns are available and selectable by the generator
- [ ] Each pattern renders with the correct black/white cell layout
- [ ] Words of lengths 2–5 display correctly in both the grid and clue list
- [ ] Clue numbering is accurate for each pattern
- [ ] All patterns produce valid, fully solvable crosswords within the 2-second generation limit
- [ ] Existing seeds (original pattern) still decode and render correctly

---

## Milestone 11 — Intersection Constraint Fix [generation-fix]
**Branch:** milestone-11-generation-fix
**Goal:** Fix the constraint solver so that intersecting across and down words always share the same letter at their crossing cell.

**Tasks:**
- Audit the intersection validation logic in the constraint solver
- Identify why the solver can place words that conflict at a shared cell (e.g. the failing seed `YThhOW...`)
- Fix the validation so any candidate placement is rejected if it creates a letter conflict at any intersection
- Verify the fix against the known failing seed
- Confirm generation still completes within 2 seconds after the fix

**Done when:**
- [ ] The failing seed (`YThhOWYxOjA6MDphLGgxeDluNDoyOjA6YSxuN2I4cDU6NDowOmEseTBxNGMzOjA6MDpkLHk0aTdjNjowOjI6ZCxyN2c5dTI6MDo0OmQ`) loads and displays a correct, conflict-free puzzle
- [ ] All newly generated puzzles pass intersection validation (no crossing cell letter conflicts)
- [ ] Generation still completes in under 2 seconds
- [ ] Existing valid seeds continue to decode and render correctly
