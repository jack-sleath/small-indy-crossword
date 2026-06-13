Title: Grid Interactivity — keyboard, touch input, and active word highlighting

<details>
<summary>Original Spec</summary>

**Goal:** Users can navigate and fill in the crossword grid with keyboard and touch input.

**Tasks:**
- Implement cell selection state (selected cell, active direction)
- Handle keyboard input: letter keys fill cell and advance focus, Backspace clears and retreats, Arrow keys navigate, Tab advances to next clue start
- Implement touch/click: tap to select, tap again to toggle direction
- Highlight the active word in the grid and the corresponding clue in the clue list
- Clicking a clue highlights it and jumps to its start cell
- Store cell values in React state

**Done when:**
- [ ] Clicking/tapping a cell selects it and highlights the active word
- [ ] Typing letters fills cells and moves focus forward
- [ ] Backspace clears and moves focus back
- [ ] Arrow keys navigate between cells
- [ ] Clicking a clue focuses its start cell
- [ ] Direction toggles on repeated tap of same cell

</details>


Technical Notes:
All state (selected cell, active direction, cell values) lives in React state. No persistence to localStorage at this milestone. The "advance focus" behaviour on letter entry and "retreat focus" on Backspace should wrap within the active word, not the whole grid — **CONFIRM ADVANCE/RETREAT BOUNDARY BEHAVIOUR** and flag for **MANUAL REVIEW**.


**GIVEN** the crossword grid is displayed
**WHEN** a user clicks or taps a white cell
**THEN** that cell becomes selected and all cells in its active word are highlighted

**GIVEN** a cell is selected and an across word is active
**WHEN** the user taps the same cell again
**THEN** the active direction toggles to down and the down word through that cell is highlighted instead

**GIVEN** a cell is selected
**WHEN** the user presses a letter key
**THEN** that letter appears in the cell and focus advances to the next empty cell in the active word

**GIVEN** a cell is selected and contains a letter
**WHEN** the user presses Backspace
**THEN** the letter is cleared from the current cell and focus retreats to the previous cell in the active word

**GIVEN** a cell is selected
**WHEN** the user presses an arrow key
**THEN** focus moves to the adjacent cell in the direction of the arrow key (if a white cell exists there)

**GIVEN** a cell is selected
**WHEN** the user presses Tab
**THEN** focus jumps to the start cell of the next clue in reading order

**GIVEN** the clue list is visible
**WHEN** the user clicks a clue
**THEN** the corresponding start cell becomes selected, the active direction is set to match that clue's direction, and the active word is highlighted

**GIVEN** a word is active
**WHEN** the user navigates or types
**THEN** the corresponding clue in the clue list is visually highlighted to match the active word

**GIVEN** a cell is selected
**WHEN** the user attempts to navigate into a black cell using arrow keys
**THEN** focus does not move to the black cell
