# Mini Crossword Web App


# Hypothesis

> 👥 Written by: Jack

## 🧑‍💼 As a:

A small private group of friends/family

## 🎯 I want:

To play the same daily-style mini crossword puzzle together

## 💡 So that:

We can share a fun, interactive puzzle experience with each other

## ✨ Context

A responsive, static React web app that recreates the NYT Mini crossword experience. A `/generate` route runs a constraint solver to build a 5×5 crossword from a pool of clues, producing a shareable seed. The main `/` play route decodes that seed and lets users solve the puzzle with a timer and completion state.

---

# Requirements Specification

> 👥 Written by: Claude
>
> Approved by: Jack

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

## KPIs

- Puzzle generation completes in < 2 seconds on a modern device
- App is fully usable offline after initial load (no network calls during gameplay)
- UI is responsive and functional at viewport widths from 320px upward
- Seed encoding is stable — a given seed always produces the same puzzle regardless of unrelated app version changes
- Constraint solver fails gracefully (clear error message) if the pool is too small to form a valid 5×5 grid

## Existing Functionality

This is a brand new project with no existing functionality to replace or build on.

---

# Functional Specification

> 👥 Specification
>
> Written by: Jack and Claude
>
> Approved by: Jack

## Milestone 1 — Project Scaffold
Get a working React + Vite app deployed to GitHub Pages with client-side routing configured for `/` and `/generate`, a sample `pool.json`, stub page components, and a deployment pipeline via GitHub Actions or `gh-pages`.

## Milestone 2 — Crossword Grid Renderer
Build the core visual components: a `CrosswordGrid` that renders a 5×5 black/white cell grid and a `ClueList` showing numbered Across and Down clues. A hardcoded sample puzzle validates the renderer before generation is wired up.

## Milestone 3 — Grid Interactivity
Add full keyboard and touch input: cell selection with direction state, letter entry with auto-advance, backspace to retreat, arrow key navigation, Tab to jump clues, and active word/clue highlighting.

## Milestone 4 — Correctness, Timer, and Completion
Implement game logic: a `MM:SS` timer that starts on first interaction, win detection on every input change, a Check function that highlights incorrect cells, Reveal cell/all functions, and a completion modal showing solve time.

## Milestone 5 — Seed Encoding & Play Route Integration
Define and implement the seed format (`poolId:row:col:direction`, base64-encoded). Wire `encodeSeed` / `decodeSeed` utilities into the play route so `?seed=` in the URL loads the correct puzzle. Add persistent seed display and a Share button that copies the URL and code to clipboard.

## Milestone 6 — Generator Route (`/generate`)
Build the constraint solver (backtracking algorithm ensuring full cell coverage and correct intersections), wire it through `encodeSeed`, render a read-only puzzle preview, and provide Regenerate and "Play this puzzle →" controls. Validate the pool on load and surface clear errors for invalid or too-small pools.

## Milestone 7 — Polish and Production Readiness
Refine visual design (typography, colours, animations), ensure keyboard accessibility and logical tab order, fix mobile keyboard edge cases, run final cross-browser/device QA, and update the README with content management and deployment instructions.

## Definition of Done

- All Acceptance Criteria are met
- App passes manual QA on Chrome/Safari mobile and Chrome/Firefox desktop
- README documents how to update puzzle content and deploy
- No console errors in production build

---

# Out of Scope

- User accounts, authentication, or solve history tracking
- Leaderboards or competitive features
- Manual puzzle authoring UI — the pool JSON is maintained externally
- Grids larger or smaller than 5×5
- Hints or penalty systems
- The generator is not intended as a public-facing tool — it is a utility for the puzzle creator

---

# Risks

- None identified

---

# Test Requirements

> 👥 Written by: Claude
>
> Approved by: Jack
>
> Tested by: Jack

**Milestone 1 — Project Scaffold**
- [ ] `npm run dev` starts the app locally without errors
- [ ] `/` and `/generate` routes both render without errors
- [ ] `npm run build && npm run deploy` publishes to GitHub Pages
- [ ] The deployed page is reachable and both routes work via the GitHub Pages URL
- [ ] `pool.json` contents are visible in the browser console on both routes

**Milestone 2 — Crossword Grid Renderer**
- [ ] A 5×5 grid renders with correct black/white cell layout matching the hardcoded puzzle
- [ ] Across and Down clue lists render with correct numbering
- [ ] Layout is usable at 375px (mobile) and 1280px (desktop) widths

**Milestone 3 — Grid Interactivity**
- [ ] Clicking/tapping a cell selects it and highlights the active word
- [ ] Typing letters fills cells and moves focus forward
- [ ] Backspace clears and moves focus back
- [ ] Arrow keys navigate between cells
- [ ] Clicking a clue focuses its start cell
- [ ] Direction toggles on repeated tap of same cell

**Milestone 4 — Correctness, Timer, and Completion**
- [ ] Timer starts on first keystroke and displays correctly
- [ ] Completing the grid correctly triggers the win modal with elapsed time
- [ ] Incorrect fill does not trigger win state
- [ ] Check highlights only incorrect cells
- [ ] Reveal cell fills the selected cell; Reveal all fills the entire grid
- [ ] Completion modal appears and timer stops on win

**Milestone 5 — Seed Encoding & Play Route Integration**
- [ ] `encodeSeed` and `decodeSeed` are unit-testable pure functions
- [ ] A hardcoded valid seed loads the correct puzzle on `/`
- [ ] The short code is visible on the play screen
- [ ] Share button copies URL and code to clipboard
- [ ] Visiting `/` with no seed shows a prompt linking to `/generate`
- [ ] The same seed produces the same puzzle on reload and on a different device

**Milestone 6 — Generator Route**
- [ ] `/generate` produces a valid, solvable 5×5 crossword from `pool.json`
- [ ] The generated puzzle preview renders correctly
- [ ] The seed code is displayed and copies to clipboard
- [ ] "Play this puzzle →" opens the play route with the correct puzzle
- [ ] "Regenerate" produces a different layout
- [ ] A pool that is too small shows a clear error instead of crashing
- [ ] Generation completes in under 2 seconds on a modern device

**Milestone 7 — Polish and Production Readiness**
- [ ] All Acceptance Criteria are met
- [ ] App passes manual QA on Chrome/Safari mobile and Chrome/Firefox desktop
- [ ] README documents how to update puzzle content and deploy
- [ ] No console errors in production build

## Test Results

> To be completed after testing phase. Include pass/fail status for each of the above requirements.
