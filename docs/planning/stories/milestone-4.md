Title: Correctness, Timer, and Completion — game logic and win state

<details>
<summary>Original Spec</summary>

**Goal:** The game knows when the puzzle is solved and tracks how long it took.

**Tasks:**
- Implement a timer that starts on first cell interaction and displays in `MM:SS` format
- Implement win detection: check all cells match the answer on every input change
- Implement "Check" function: highlight incorrect cells in red temporarily
- Implement "Reveal cell" and "Reveal all" functions
- Build a completion modal/overlay showing solve time and whether the puzzle was assisted

**Done when:**
- [ ] Timer starts on first keystroke and displays correctly
- [ ] Completing the grid correctly triggers the win modal with elapsed time
- [ ] Incorrect fill does not trigger win state
- [ ] Check highlights only incorrect cells
- [ ] Reveal cell fills the selected cell; Reveal all fills the entire grid
- [ ] Completion modal appears and timer stops on win

</details>


Technical Notes:
Win detection runs on every input change — ensure it only compares filled white cells against answers (black cells are ignored). "Assisted" state in the completion modal is triggered if the user used Check or Reveal at any point during the solve — **CONFIRM ASSISTED FLAG LOGIC** (whether Check alone triggers it or only Reveal) and flag for **MANUAL REVIEW**. The "Check" highlight is described as temporary — **CONFIRM DURATION OR DISMISS MECHANISM** and flag for **MANUAL REVIEW**.


**GIVEN** a puzzle is loaded and no cells have been interacted with
**WHEN** the user views the timer
**THEN** the timer displays `00:00` and is not yet running

**GIVEN** the timer has not yet started
**WHEN** the user types a letter into any cell for the first time
**THEN** the timer starts and increments each second in `MM:SS` format

**GIVEN** the timer is running
**WHEN** the user fills in the final cell with the correct letter, completing the grid
**THEN** the timer stops and a completion modal appears showing the elapsed solve time

**GIVEN** the completion modal is displayed
**WHEN** the user reads the modal
**THEN** it shows the final solve time and indicates whether the puzzle was solved with or without assistance (Check/Reveal)

**GIVEN** all cells are filled but one or more answers are incorrect
**WHEN** the app evaluates the grid
**THEN** the win state is not triggered and the timer continues running

**GIVEN** the user has partially or fully filled the grid
**WHEN** the user activates the "Check" function
**THEN** only the cells whose current letter does not match the correct answer are highlighted (e.g. in red)

**GIVEN** incorrect cells are highlighted after a Check
**WHEN** the highlight duration expires or the user dismisses it
**THEN** the highlight is removed and the cells return to their normal appearance

**GIVEN** a cell is selected
**WHEN** the user activates "Reveal cell"
**THEN** the correct answer letter is filled into that cell

**GIVEN** the user activates "Reveal all"
**WHEN** the function runs
**THEN** every white cell in the grid is filled with its correct answer letter

**GIVEN** the user has used Reveal all
**WHEN** all cells are filled with correct answers
**THEN** the completion modal appears showing the solve time and marking the solve as assisted
