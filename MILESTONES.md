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

---

## Milestone 15 — Active Cell Highlight & Direction Toggle [full-overhaul]
**Branch:** milestone-15-full-overhaul
**Goal:** Distinguish the cursor cell (yellow) from the rest of the active word (blue), and allow direction toggle via re-click or perpendicular arrow key.

**Tasks:**
- Change active cell styling from blue to yellow, keeping the rest of the active word blue
- Implement direction toggle on re-click/re-tap of the already-active cell
- Implement direction toggle when an arrow key is pressed on the perpendicular axis

**Done when:**
- [x] Active cell renders with a yellow background; remaining word cells render blue
- [x] Clicking/tapping the already-active cell toggles direction and updates the blue highlight
- [x] Pressing a perpendicular arrow key toggles the active direction
- [x] No visual regression on existing grid layouts

---

## Milestone 16 — Pencil Mode [full-overhaul]
**Branch:** milestone-16-full-overhaul
**Goal:** Let the user toggle between Pen mode (black letters) and Pencil mode (grey letters).

**Tasks:**
- Add a pencil/pen toggle button to the toolbar
- Store a `mode` value (`pen` | `pencil`) in component state
- Apply distinct styling to pencil-mode cells so their text renders grey
- Ensure pencil letters are treated identically to pen letters in Check and win detection

**Done when:**
- [ ] A pen/pencil toggle button is present and switches between modes
- [ ] Letters typed in pencil mode render grey; letters typed in pen mode render black
- [ ] Switching mode does not affect already-entered letters
- [ ] Check and win detection treat pencil letters identically to pen letters

---

## Milestone 17 — Full Keyboard Navigation Spec [full-overhaul]
**Branch:** milestone-17-full-overhaul
**Goal:** Implement remaining keyboard behaviours: Tab/Shift+Tab between clues, Spacebar direction toggle, Backspace on empty cell, and Escape for Rebus.

**Tasks:**
- Implement Tab: advance cursor to first cell of next clue, wrapping across directions
- Implement Shift+Tab: retreat to first cell of previous clue
- Implement Spacebar: toggle active direction
- Fix Backspace edge case: if active cell is empty, move backward and delete that cell's letter
- Wire Escape key to trigger Rebus mode (allow multi-character cell input)

**Done when:**
- [ ] Tab moves cursor to the first cell of the next clue (wrapping across directions)
- [ ] Shift+Tab moves cursor to the first cell of the previous clue
- [ ] Spacebar toggles direction between Across and Down
- [ ] Backspace on an empty cell moves backward and deletes the previous cell's letter
- [ ] Pressing Escape enables Rebus mode for the active cell

---

## Milestone 18 — Clue Bar & Clue List Enhancements [full-overhaul]
**Branch:** milestone-18-full-overhaul
**Goal:** Add a persistent clue bar showing the active clue above (desktop) or below (mobile) the grid, grey out completed clues, and add swipe clue navigation on mobile.

**Tasks:**
- Add a clue bar component displaying the full text of the currently active clue
- Position the clue bar above the grid on desktop and between the grid and keyboard on mobile
- Grey out clues in the list when their word is fully and correctly filled
- Add left/right swipe gesture and arrow buttons on the mobile clue bar to navigate clues
- Selecting a clue from the expanded list still moves cursor to its first empty cell

**Done when:**
- [ ] Clue bar shows the full active clue text at all times
- [ ] On desktop the bar appears above the grid; on mobile between grid and keyboard
- [ ] Completed clues are greyed out in the clue list but remain clickable
- [ ] Swiping left/right on the mobile clue bar navigates to the next/previous clue
- [ ] Clicking a clue in the list moves the cursor to its first empty cell

---

## Milestone 19 — Timer Pause & Visibility Setting [full-overhaul]
**Branch:** milestone-19-full-overhaul
**Goal:** Allow the user to pause the timer (obscuring the grid) and optionally hide the timer entirely.

**Tasks:**
- Add a pause/resume control to the timer display
- When paused, show an overlay that obscures the grid
- Add a "Hide timer" toggle to settings that replaces the timer with a static label
- Persist the hide-timer preference in localStorage

**Done when:**
- [ ] Clicking the timer or pause button pauses the timer and shows a grid overlay
- [ ] Resuming removes the overlay and continues counting from where it stopped
- [ ] A "Hide timer" setting replaces the timer with a static label
- [ ] The hide-timer preference persists across page reloads

---

## Milestone 20 — Check Sub-Menu & Autocheck Mode [full-overhaul]
**Branch:** milestone-20-full-overhaul
**Goal:** Replace the single Check button with a Square/Word/Puzzle sub-menu and add an Autocheck toggle.

**Tasks:**
- Convert the Check button to a menu with three options: Check Square, Check Word, Check Puzzle
- Check Square: verify only the active cell (correct → blue, incorrect → red)
- Check Word: verify all cells in the active word
- Check Puzzle: verify all filled cells in the grid
- Add an Autocheck toggle in settings; when on, incorrect cells are highlighted immediately on each keystroke
- When Autocheck is on, ensure Backspace skips confirmed-correct cells

**Done when:**
- [ ] Check menu offers Square, Word, and Puzzle options
- [ ] Each scope correctly marks cells blue (correct) or red (incorrect)
- [ ] Autocheck mode highlights errors in real time as the user types
- [ ] With Autocheck on, Backspace skips confirmed-correct cells when moving backward

---

## Milestone 21 — Reveal Sub-Menu & Reset Confirmation [full-overhaul]
**Branch:** milestone-21-full-overhaul
**Goal:** Replace the single Reveal button with a Square/Word/Puzzle sub-menu and add confirmation dialogs before Reveal and Reset.

**Tasks:**
- Convert the Reveal button to a menu: Reveal Square, Reveal Word, Reveal Puzzle
- Show a confirmation dialog before any Reveal action
- Show a confirmation dialog before Reset Puzzle
- Ensure Reveal fills correct letter(s) in red (reusing revealed-cell styling from visual-ux)
- Ensure Reset clears all letters and resets the timer to 00:00

**Done when:**
- [ ] Reveal menu offers Square, Word, and Puzzle options
- [ ] A confirmation dialog is shown before each Reveal action
- [ ] A confirmation dialog is shown before Reset Puzzle
- [ ] Revealed cells display in red and are not overwritten by subsequent Check actions
- [ ] Reset clears all entered letters and resets the timer to 00:00

---

## Milestone 22 — Cursor Movement Settings [full-overhaul]
**Branch:** milestone-22-full-overhaul
**Goal:** Add three configurable cursor movement behaviours accessible from a settings panel.

**Tasks:**
- Add a settings panel (via gear icon) with three toggles:
  1. **Skip filled squares** — auto-advance skips already-filled cells
  2. **Jump to next clue** — completing a word moves cursor to the next incomplete clue
  3. **Spacebar behaviour** — "Toggle direction only" vs "Clear cell + advance"
- Persist all three settings in localStorage
- Wire each setting into the relevant input-handling code paths

**Done when:**
- [ ] Settings panel shows all three cursor movement toggles
- [ ] "Skip filled squares" on: auto-advance skips filled cells; off: advances to next cell regardless
- [ ] "Jump to next clue" on: cursor jumps to first empty cell of next incomplete clue when word is completed
- [ ] Spacebar behaviour setting changes spacebar action accordingly
- [ ] All three settings persist across page reloads

---

## Milestone 23 — Completion Celebration & Share [full-overhaul]
**Branch:** milestone-23-full-overhaul
**Goal:** Add a congratulatory grid animation and sound on completion, and a Share button to the completion modal.

**Tasks:**
- Implement a brief cell animation (e.g. ripple or flash) on correct completion
- Add a short completion jingle (audio clip) that plays on win, with a mute/settings toggle
- Add a Share button to the completion modal
- Share button generates a spoiler-free text result (e.g. "I solved the Small Indy in 0:42!") and copies to clipboard or triggers system share sheet on mobile

**Done when:**
- [ ] A brief grid animation plays on correct completion
- [ ] A short jingle plays on correct completion (respecting a mute setting)
- [ ] The completion modal includes a Share button
- [ ] The Share button copies or shares a spoiler-free result with the puzzle URL
- [ ] Completion still only triggers when all cells are correctly filled

---

## Milestone 24 — Mobile Custom Keyboard [full-overhaul]
**Branch:** milestone-24-full-overhaul
**Goal:** Replace the system keyboard on mobile with a custom A–Z game keyboard that avoids autocorrect and keeps the clue bar visible.

**Tasks:**
- Build a custom on-screen keyboard component (A–Z grid + Backspace key)
- Add a secondary layout button for Rebus/special character input
- Show the custom keyboard when a cell is active on touch devices; hide it otherwise
- Ensure the active clue bar remains visible above the custom keyboard
- Suppress the system keyboard (e.g. `inputmode="none"` or focus-trap approach)

**Done when:**
- [ ] Custom A–Z + Backspace keyboard appears when a cell is active on mobile
- [ ] System keyboard does not appear; no autocorrect or autocapitalise
- [ ] The active clue bar is visible above the custom keyboard at all times
- [ ] A secondary layout button is present for Rebus input
- [ ] Keyboard hides when no cell is active

---

## Milestone 25 — Desktop Layout & Settings Panel [full-overhaul]
**Branch:** milestone-25-full-overhaul
**Goal:** Move clue lists to a panel beside the grid on desktop, add a settings gear icon, and confirm full responsive fidelity from 320px to 1280px.

**Tasks:**
- Restructure the desktop layout so Across and Down clue lists sit in a panel beside (or flanking) the grid
- Add a settings gear icon (⚙) to the toolbar that opens the settings panel (consolidating toggles from M19, M20, M22)
- Confirm layout is functional and unbroken at 320px and 1280px viewports
- Final cross-device QA: Chrome/Safari mobile, Chrome/Firefox desktop

**Done when:**
- [ ] On desktop (≥768px), clue lists are displayed beside the grid rather than below it
- [ ] A settings gear icon is present and opens a panel with all available settings
- [ ] Layout is functional and unbroken at 320px and 1280px viewport widths
- [ ] No console errors in the production build
- [ ] Manual QA passes on Chrome/Safari mobile and Chrome/Firefox desktop
