Title: Generator Route — constraint solver, puzzle preview, and seed output

<details>
<summary>Original Spec</summary>

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
- [ ] `/generate` produces a valid, solvable 5×5 crossword from `pool.json`
- [ ] The generated puzzle preview renders correctly
- [ ] The seed code is displayed and copies to clipboard
- [ ] "Play this puzzle →" opens the play route with the correct puzzle
- [ ] "Regenerate" produces a different layout
- [ ] A pool that is too small shows a clear error instead of crashing
- [ ] Generation completes in under 2 seconds on a modern device

</details>


Technical Notes:
The constraint solver uses backtracking. Validity rules: every white cell covered by both an across and a down entry; intersecting cells must share the correct letter. Pool validation runs at load time: unique IDs, uppercase letters only, answer length 2–5 characters. Generation must complete in under 2 seconds on a modern device. **CONFIRM WHAT "TOO SMALL" MEANS** (minimum pool size for a valid 5×5) and flag for **MANUAL REVIEW**. The `/generate` route is a creator utility, not a public-facing feature.


**GIVEN** a developer navigates to `/generate`
**WHEN** the page loads with a valid `pool.json`
**THEN** the constraint solver runs and a valid 5×5 crossword puzzle is generated within 2 seconds

**GIVEN** a puzzle has been generated
**WHEN** the developer inspects the grid layout
**THEN** every white cell is covered by both an across entry and a down entry, and all intersecting cells share the correct letter

**GIVEN** a puzzle has been generated
**WHEN** the developer views the page
**THEN** a read-only preview of the puzzle is displayed using the `CrosswordGrid` component

**GIVEN** a puzzle preview is displayed
**WHEN** the developer views the page
**THEN** the short seed code for the generated puzzle is visible on screen

**GIVEN** the seed code is displayed
**WHEN** the developer activates the copy-to-clipboard share button
**THEN** the seed code is copied to the clipboard

**GIVEN** a puzzle has been generated
**WHEN** the developer clicks "Play this puzzle →"
**THEN** they are navigated to `/?seed=<code>` and the correct puzzle loads on the play route

**GIVEN** a puzzle is displayed
**WHEN** the developer clicks "Regenerate"
**THEN** the solver runs again and a different puzzle layout is produced and displayed

**GIVEN** `pool.json` is too small to form a valid 5×5 crossword
**WHEN** the page loads and the solver runs
**THEN** a clear, descriptive error message is shown and the app does not crash

**GIVEN** `pool.json` contains entries with duplicate IDs, non-uppercase letters, or answers outside 2–5 characters
**WHEN** the page loads
**THEN** a validation error is shown identifying the invalid entries before the solver attempts to run
