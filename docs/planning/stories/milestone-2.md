Title: Crossword Grid Renderer — static 5×5 grid and clue list

<details>
<summary>Original Spec</summary>

**Goal:** Render a static 5×5 crossword grid from a hardcoded puzzle layout.

**Tasks:**
- Define the data structure for a puzzle (grid cells, across/down entries, clue text, answer, start position)
- Create a `CrosswordGrid` component that renders a 5×5 grid of cells (black/white)
- Create a `ClueList` component that renders Across and Down clues
- Hardcode a single sample puzzle (bypassing generation for now) to validate the renderer
- Style the grid to look clean on both mobile and desktop viewports

**Done when:**
- [ ] A 5×5 grid renders with correct black/white cell layout matching the hardcoded puzzle
- [ ] Across and Down clue lists render with correct numbering
- [ ] Layout is usable at 375px (mobile) and 1280px (desktop) widths

</details>


Technical Notes:
This milestone is purely rendering/display — no interactivity. The puzzle data is hardcoded. The data structure defined here (grid cells, entries, clue text, answer, start position) will be the contract used by all future milestones. **DEFINE DATA STRUCTURE SHAPE** before implementation and flag for **MANUAL REVIEW** if it deviates from the seed format assumed in Milestone 5.


**GIVEN** a user opens the play page (`/`)
**WHEN** the page loads
**THEN** a 5×5 grid is displayed with the correct pattern of black and white cells matching the hardcoded sample puzzle

**GIVEN** the grid is displayed
**WHEN** the user inspects the cell layout
**THEN** each white cell that begins an across or down entry shows the correct clue number in its corner

**GIVEN** the grid is displayed
**WHEN** the user views the clue lists
**THEN** an "Across" section lists all across clues with their correct numbers, and a "Down" section lists all down clues with their correct numbers

**GIVEN** the clue lists are displayed
**WHEN** the user counts the clue numbers
**THEN** the numbering matches the standard crossword convention (left-to-right, top-to-bottom) for the hardcoded puzzle

**GIVEN** the page is viewed at 375px viewport width
**WHEN** the grid and clue lists render
**THEN** the grid cells and clue text are legible and no content overflows or is clipped

**GIVEN** the page is viewed at 1280px viewport width
**WHEN** the grid and clue lists render
**THEN** the layout is well-proportioned and usable without excessive whitespace or cramped content
