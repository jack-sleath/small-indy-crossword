# Full Overhaul — NYT Mini Crossword Fidelity


# Hypothesis

> 👥 Written by: Jack

## 🧑‍💼 As a:

Puzzle creator and player sharing daily mini crosswords with a small private group

## 🎯 I want:

A play experience with full NYT Mini Crossword fidelity — yellow/blue cell highlighting, pencil mode, complete keyboard navigation, check/reveal sub-menus with autocheck, timer pause, cursor movement settings, completion celebration, mobile custom keyboard, and a polished desktop layout

## 💡 So that:

The app feels as polished and intuitive as the real NYT Mini, making it genuinely enjoyable for friends and family to solve daily

## ✨ Context

A comprehensive upgrade of the play experience to match NYT Mini Crossword fidelity. This covers: active cell yellow highlight, pencil mode, full keyboard navigation (Tab/Shift+Tab, Spacebar direction toggle, Backspace edge cases, Escape for Rebus), check/reveal sub-menus with autocheck mode, timer pause and hide, cursor movement settings, completion celebration (jingle + animation), post-solve share, mobile custom on-screen keyboard with swipe clue navigation, and a polished desktop layout with a clue panel beside the grid.

---

# Requirements Specification

> 👥 Written by: Jack
>
> Approved by: Jack

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

## KPIs

1. **Completion detection accuracy** — win state triggers if and only if all cells are correctly filled
2. **Timer fidelity** — timer starts on first interaction, stops on completion, displays MM:SS, can be paused and hidden
3. **Check/Reveal correctness** — check marks correct cells blue and incorrect cells red; reveal fills correct letter(s) without triggering win state
4. **Keyboard coverage** — all specified keys (A–Z, Backspace, Arrow, Tab, Shift+Tab, Space, Escape) behave per spec on desktop
5. **Mobile usability** — grid and active clue visible simultaneously without scrolling; custom keyboard does not trigger system autocorrect
6. **Generation performance** — puzzle generation remains < 2 seconds after all changes
7. **Responsive layout** — UI is functional and unbroken at 320px–1280px viewport widths
8. **Seed stability** — all pre-existing seeds continue to decode to the same puzzle after the overhaul

## Existing Functionality

Builds on the existing app. Core grid renderer, solver, seed/URL sharing, and dark/light theme (visual-ux) are preserved. Input handling, toolbar buttons (Check, Reveal), and page layout will be substantially replaced or extended to meet the full spec.

---

# Functional Specification

> 👥 Specification
>
> Written by: Claude
>
> Approved by: Jack

**Milestone 15 — Active Cell Highlight & Direction Toggle**
Change the active cell colour from blue to yellow while keeping the rest of the active word blue. Implement direction toggle when the user re-clicks/re-taps the active cell or presses a perpendicular arrow key.

**Milestone 16 — Pencil Mode**
Add a pen/pencil toolbar toggle. Pencil-mode letters render grey; pen-mode letters render black. Switching mode does not affect already-entered letters. Check and win detection treat both modes identically.

**Milestone 17 — Full Keyboard Navigation Spec**
Implement Tab/Shift+Tab clue navigation (wrapping across directions), Spacebar direction toggle, Backspace edge-case on empty cell, and Escape to trigger Rebus mode.

**Milestone 18 — Clue Bar & Clue List Enhancements**
Add a clue bar component showing the active clue above the grid (desktop) and between the grid and keyboard (mobile). Grey out completed clues. Add swipe/arrow navigation on the mobile clue bar.

**Milestone 19 — Timer Pause & Visibility Setting**
Add a pause/resume control that stops the timer and overlays the grid. Add a "Hide timer" setting persisted in localStorage.

**Milestone 20 — Check Sub-Menu & Autocheck Mode**
Replace the Check button with a Square/Word/Puzzle sub-menu. Add an Autocheck settings toggle that highlights errors in real time and makes Backspace skip confirmed-correct cells.

**Milestone 21 — Reveal Sub-Menu & Reset Confirmation**
Replace the Reveal button with a Square/Word/Puzzle sub-menu. Add confirmation dialogs before Reveal and Reset. Reset clears all letters and resets the timer to 00:00.

**Milestone 22 — Cursor Movement Settings**
Add three settings toggles (skip filled squares, jump to next clue, spacebar behaviour) to a settings panel, all persisted in localStorage.

**Milestone 23 — Completion Celebration & Share**
Add a brief grid animation and short jingle on correct completion (with mute setting). Add a Share button to the completion modal that generates a spoiler-free text result.

**Milestone 24 — Mobile Custom Keyboard**
Build a custom A–Z + Backspace on-screen keyboard for touch devices. Suppress the system keyboard. Keep the active clue bar visible above the custom keyboard at all times.

**Milestone 25 — Desktop Layout & Settings Panel**
Restructure the desktop layout to show clue lists beside the grid. Add a settings gear icon that opens a consolidated settings panel. Confirm responsive fidelity at 320px and 1280px with a full QA pass.

## Definition of Done

- On desktop (≥768px), clue lists are displayed beside the grid rather than below it
- A settings gear icon is present and opens a panel with all available settings
- Layout is functional and unbroken at 320px and 1280px viewport widths
- No console errors in the production build
- Manual QA passes on Chrome/Safari mobile and Chrome/Firefox desktop
- All pre-existing seeds continue to decode to the same puzzle

---

# Risks

- **Regression to pool/solver/seed system**: The overhaul touches input handling and toolbar code that sits alongside seed encoding and pool loading. Changes must not alter the seed format or break existing URLs.
- **Mobile keyboard complexity**: Suppressing the system keyboard and building a custom one that works reliably across iOS Safari, Android Chrome, and responsive web is non-trivial. iOS in particular has restrictions around focus behaviour and `inputmode`.

---

# Test Requirements

> 👥 Written by: Claude
>
> Approved by: Jack
>
> Tested by: Jack

**Grid & Highlighting**
- [ ] Active cell renders with yellow background; active word cells render blue
- [ ] Switching direction updates blue highlight while yellow cell stays fixed
- [ ] Clicking already-active cell toggles direction (Across ↔ Down)

**Letter Display**
- [ ] Pen mode letters render black; pencil mode letters render grey
- [ ] Checked-correct letters render blue; checked-incorrect show red indicator
- [ ] All letters display uppercase regardless of input case

**Desktop Keyboard Navigation**
- [ ] Tab moves cursor to the first cell of the next clue (wrapping across directions)
- [ ] Shift+Tab moves cursor to the first cell of the previous clue
- [ ] Spacebar toggles direction between Across and Down
- [ ] Backspace on an empty cell moves backward and deletes the previous cell's letter
- [ ] Pressing a perpendicular arrow key toggles the active direction

**Mobile**
- [ ] Tapping already-active cell toggles direction
- [ ] Custom on-screen keyboard (A–Z + Backspace) appears; no system autocorrect
- [ ] Grid and active clue are visible simultaneously without scrolling
- [ ] Swiping left/right on the clue bar navigates to the next/previous clue

**Timer**
- [ ] Timer pauses on click; pausing obscures the grid
- [ ] Resuming removes the overlay and continues the timer
- [ ] Timer can be hidden via settings; preference persists across reloads

**Check**
- [ ] Check Square/Word/Puzzle sub-menu works per spec
- [ ] Autocheck mode highlights errors in real time as the user types
- [ ] With Autocheck on, Backspace skips confirmed-correct cells when moving backward

**Reveal & Reset**
- [ ] Reveal Square/Word/Puzzle fills correct letters in red
- [ ] Confirmation dialog shown before any Reveal action
- [ ] Confirmation dialog shown before Reset Puzzle
- [ ] Reset clears all letters and resets timer to 00:00

**Cursor Movement Settings**
- [ ] "Skip filled squares" setting skips filled cells during auto-advance when on
- [ ] "Jump to next clue" setting moves cursor to next incomplete clue on word completion when on
- [ ] Spacebar behaviour setting toggles between "direction only" and "clear + advance"
- [ ] All settings persist across page reloads

**Completion**
- [ ] Completion triggers only when all cells are correctly filled
- [ ] Brief grid animation plays on correct completion
- [ ] Completion jingle plays on correct completion (respects mute setting)
- [ ] Completion modal shows solve time and a Share button
- [ ] Share button copies or shares a spoiler-free result with the puzzle URL

**Clue Display**
- [ ] Clue bar shows full active clue text above grid (desktop) and below grid (mobile)
- [ ] Completed clues are greyed out in the clue list but remain clickable
- [ ] On desktop (≥768px), clue lists are displayed in a panel beside the grid

**Seed Stability**
- [ ] All pre-existing seeds decode to the same puzzle after the overhaul

## Test Results

> To be completed after testing phase. Include pass/fail status for each of the above requirements.
