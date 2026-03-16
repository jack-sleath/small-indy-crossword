# Acceptance Criteria

## Overview
A responsive, static React web app that recreates the NYT Mini crossword experience. A `/generate` route runs a constraint solver to build a 5×5 crossword from a pool of clues, producing a shareable seed. The `/` play route decodes that seed and lets users solve the puzzle with a timer and completion state. The `/daily` route serves a different pre-generated puzzle each UTC day, shared by all users.

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
8. The app must display a timer that starts when the user first clicks a cell (not on first keystroke); clues are blurred until this first click occurs.
9. The app must detect when all cells are correctly filled and show a completion/win state.
10. The completion state must display the user's solve time.
11. The user can check their current answers (highlighting incorrect cells).
12. The user can reveal the solution for a selected cell or the entire grid.
13. The play route must display the short seed code and a share button at all times.
14. The share button copies the puzzle URL and short code to the clipboard. On seed-based puzzles the URL is `/?seed=<code>`; on the daily page the URL is `/daily`.

### Generator Route (`/generate`)
15. The `/generate` page runs a constraint solver to select entries from the pool and arrange them into a valid solvable 5×5 crossword grid.
16. The generator displays a read-only preview of the generated puzzle.
17. The generator displays the short seed code and a copy-to-clipboard share button.
18. The generator provides a "Regenerate" button to produce a different puzzle from the pool.
19. The generator provides a direct link to the play route pre-loaded with the generated seed.

### Shared
20. The user can share a seed-based puzzle via a URL containing the seed (e.g. `/?seed=abc123`). The user can share the daily puzzle via the `/daily` URL.
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

---

## Change Request — visual-ux

### Overview
Add light/dark theme support and visual letter-state colouring (red for revealed letters, blue for correctly checked letters) to improve the play experience and accessibility across different environments.

### Raised By
Jack (end user / puzzle creator)

### Functional Requirements
1. The app must default to the user's OS/system colour scheme preference (light or dark) on first load.
2. The user can manually toggle between light and dark mode via a control in the UI.
3. The user's theme preference must persist across page reloads (e.g. via localStorage).
4. When a cell is revealed using the "Reveal" action, its letter must be displayed in red.
5. The red colouring on a revealed cell must persist even if the user subsequently types a different letter into that cell.
6. When the "Check" action is used, letters that are correct must be highlighted in blue.
7. Blue colouring from a "Check" action must not override red colouring on a revealed cell.

### Non-Functional Requirements
- Theme switching must respond within 100ms with no perceptible flash of the wrong theme on load.
- All colour choices must maintain sufficient contrast in both light and dark modes.
- No visual regressions at viewport widths from 320px to 1280px.

### Out of Scope
- Per-cell animation on theme switch.
- High-contrast or other accessibility themes beyond light and dark.

---

## Change Request — variety

### Overview
Support multiple distinct 5×5 crossword grid patterns (varying which cells are black or white) so that puzzles are not always three full 5-letter across words and three full 5-letter down words, naturally producing words of different lengths.

### Raised By
Jack (end user / puzzle creator)

### Functional Requirements
1. The app must support at least 3 distinct 5×5 black/white cell patterns.
2. Each pattern may produce words of varying lengths (2–5 letters) depending on where black cells fall.
3. The constraint solver must work correctly with any supported pattern, not just the original fixed layout.
4. The clue list must render correctly for any pattern, with accurate numbering.
5. The grid renderer must display variable-length words correctly.
6. All supported patterns must produce valid, fully solvable crosswords.

### Non-Functional Requirements
- Puzzle generation must still complete in under 2 seconds for all supported patterns.
- The seed encoding must remain stable — existing seeds must continue to decode correctly.

### Out of Scope
- Grids larger or smaller than 5×5.
- User-defined or custom grid patterns.
- Dynamically generated patterns (patterns are predefined).

---

## Change Request — generation-fix

### Overview
Fix a bug in the constraint solver where intersecting across and down words are placed with conflicting letters at their shared cell, producing an unsolvable or incorrect puzzle (e.g. seed `YThhOWYxOjA6MDphLGgxeDluNDoyOjA6YSxuN2I4cDU6NDowOmEseTBxNGMzOjA6MDpkLHk0aTdjNjowOjI6ZCxyN2c5dTI6MDo0OmQ`).

### Raised By
Jack (developer / puzzle creator)

### Functional Requirements
1. The constraint solver must validate that every intersecting cell is covered by both an across and a down word that share the same letter at that position.
2. The solver must reject any candidate word placement that would create an intersection conflict.
3. The specific failing seed must produce a correct, conflict-free puzzle after the fix.
4. All newly generated puzzles must be free of intersection conflicts.

### Non-Functional Requirements
- The fix must not increase generation time beyond the 2-second limit.
- Existing valid seeds must continue to decode and render correctly after the fix.

### Out of Scope
- Changes to the seed encoding format.
- Validation of pool.json entries beyond what is already specified.

---

## Change Request — rename-and-generator-link

### Overview
Rebrand the app from "Mini Crossword" to "Small Indy" and add a navigation link to the generator from within the settings panel.

### Raised By
Jack (end user / puzzle creator)

### Functional Requirements
1. All visible text in the app must use "Small Indy" — no remaining "Mini Crossword" references.
2. The settings panel must include a link to the `/generate` route.

### Out of Scope
- Changes to URL paths or seed encoding.

---

## Change Request — daily-puzzle

### Overview
Add a `/daily` route that serves a new pre-generated puzzle each UTC day. All users on the same UTC day see the same puzzle, and a countdown shows how long until the next one.

### Raised By
Jack (end user / puzzle creator)

### Functional Requirements
1. The app must have a `/daily` route that is distinct from the seed-based `/` route.
2. Each UTC day must map deterministically to a single pre-generated puzzle seed.
3. All users accessing `/daily` on the same UTC day must receive the same puzzle, regardless of their local timezone.
4. The daily page must display a live countdown (HH:MM:SS) to the next UTC midnight.
5. The day number must be shown so users can identify and discuss which puzzle they are on.

### Non-Functional Requirements
- The seed selection logic must be purely client-side and require no network calls beyond loading `daily-seeds.json` at startup.
- The countdown timer must update every second.

### Out of Scope
- A back-catalogue or archive of past daily puzzles.
- Server-side puzzle scheduling.

---

## Change Request — clue-blur-and-timer-start

### Overview
Blur the clues on page load so users can choose when to start, and tie the timer to that first cell click rather than the first keystroke.

### Raised By
Jack (end user / puzzle creator)

### Functional Requirements
1. Clue text must be blurred/hidden when the page first loads, before any cell is selected.
2. Clicking (or tapping) the first cell must simultaneously unblur the clues and start the timer.
3. The timer must not start from typing alone — a cell must be clicked first.

### Out of Scope
- A manual "Start" button to unblur without selecting a cell.

---

## Change Request — daily-share-link

### Overview
When sharing from the daily puzzle page, the shared URL should point to `/daily` so that recipients land on the same daily puzzle rather than a seed-specific URL.

### Raised By
Jack (end user / puzzle creator)

### Functional Requirements
1. The share button on the daily puzzle page must produce a URL of the form `<baseUrl>/daily`.
2. The share button on a seed-based puzzle page must continue to produce a `<baseUrl>/?seed=<code>` URL.
3. Both the toolbar share button and the completion modal share button must follow this rule.

### Out of Scope
- Changes to the share text content beyond the URL.

---

## Change Request — full-overhaul

### Overview
A comprehensive upgrade of the play experience to match NYT Mini Crossword fidelity. This covers: active cell yellow highlight, pencil mode, full keyboard navigation (Tab/Shift+Tab, Spacebar direction toggle, Backspace edge cases, Escape for Rebus), check/reveal sub-menus with autocheck mode, timer pause and hide, cursor movement settings, completion celebration (jingle + animation), post-solve share, mobile custom on-screen keyboard with swipe clue navigation, and a polished desktop layout with a clue panel beside the grid.

### Raised By
Jack (developer / puzzle creator)

### Functional Requirements
1. The active cell must be highlighted yellow; all other cells in the active word must be highlighted blue.
2. The user can toggle direction (Across ↔ Down) by clicking/tapping the already-active cell.
3. Pressing an arrow key on the perpendicular axis toggles the active direction.
4. The user can toggle between Pen mode (black letters) and Pencil mode (grey letters).
5. Tab advances the cursor to the first cell of the next clue; Shift+Tab retreats to the previous clue.
6. Spacebar toggles the active direction; a settings option controls whether it also clears the cell and advances.
7. Backspace on an empty cell moves the cursor back and deletes that cell's letter.
8. A clue bar above (desktop) or below (mobile) the grid displays the full text of the active clue.
9. Completed clues are greyed out in the clue list but remain selectable.
10. The timer can be paused; pausing obscures the grid to prevent solving while paused.
11. The timer can be hidden entirely via a settings control.
12. The Check action provides a sub-menu: Check Square, Check Word, Check Puzzle.
13. An Autocheck mode toggle highlights incorrect letters in real time as the user types.
14. When Autocheck is on, Backspace skips over correctly confirmed cells when moving backward.
15. The Reveal action provides a sub-menu: Reveal Square, Reveal Word, Reveal Puzzle.
16. A confirmation dialog is shown before any Reveal action.
17. A confirmation dialog is shown before Reset Puzzle.
18. Reset Puzzle clears all entered letters and resets the timer to 00:00.
19. A "Skip filled squares" setting controls whether auto-advance skips filled cells.
20. A "Jump to next clue" setting controls whether completing a word jumps to the next incomplete clue.
21. On correct completion, a brief congratulatory animation plays on the grid.
22. The completion modal shows the solve time and includes a Share button.
23. The Share button generates a spoiler-free shareable result with copy and share-sheet options.
24. On mobile, a custom on-screen keyboard (A–Z + Backspace) replaces the system keyboard to avoid autocorrect.
25. On mobile, swiping left/right on the clue bar navigates to the next/previous clue.
26. On desktop, Across and Down clue lists are displayed in a panel beside the grid.
27. A settings gear icon provides access to preferences (timer visibility, autocheck, cursor behaviour).
28. The grid and active clue must be visible simultaneously on mobile without scrolling.

### Non-Functional Requirements
- Puzzle generation must remain under 2 seconds after all UI changes.
- The seed encoding must remain stable — all pre-existing seeds must continue to decode to the same puzzle.
- The UI must be functional and unbroken at viewport widths from 320px to 1280px.
- All UI interactions must respond within 100ms.

### Out of Scope
- User accounts, solve history, or cross-session streak tracking.
- Leaderboards or competitive features.
- Puzzle archive calendar with star icons.
- Saturday 7×7 grid variant.
- Full Rebus mode implementation beyond Escape key triggering it.
- Pinch-to-zoom on the grid.
