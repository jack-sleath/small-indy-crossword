# Visual UX — Theme Support & Letter State Colouring


# Hypothesis

> 👥 Written by: Jack

## 🧑‍💼 As a:

Puzzle creator and player sharing daily mini crosswords with a small private group

## 🎯 I want:

Light and dark mode support with visual colouring for revealed (red) and correctly checked (blue) letters

## 💡 So that:

The app is comfortable to use in any lighting environment, and players can clearly see at a glance which letters were entered unaided versus revealed or confirmed correct

## ✨ Context

Add light/dark theme support and visual letter-state colouring (red for revealed letters, blue for correctly checked letters) to improve the play experience and accessibility across different environments.

---

# Requirements Specification

> 👥 Written by: Jack
>
> Approved by: Jack

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

## KPIs

1. **Theme fidelity** — app renders correctly in both light and dark modes with no flash on load
2. **Theme persistence** — manual theme choice survives a full page reload
3. **Revealed cell colouring** — revealed letters display red immediately and persist after re-entry
4. **Check colouring** — correctly checked letters display blue; revealed cells remain red regardless
5. **Contrast compliance** — all text/background combinations pass minimum contrast in both themes

## Existing Functionality

Builds on the existing app. The grid, clue list, timer, check/reveal actions, and seed/share flow are all preserved. Only colour definitions and cell state tracking are extended.

---

# Functional Specification

> 👥 Specification
>
> Written by: Claude
>
> Approved by: Jack

**Milestone 8 — Theme Support**
Introduce CSS custom properties for all colours. Detect `prefers-color-scheme` on load and apply the matching theme. Add a theme toggle button persisted in localStorage.

**Milestone 9 — Letter State Colouring**
Extend the cell state model with `revealed` and `checked-correct` flags. Apply red styling to revealed cells (persists on re-entry). Apply blue to checked-correct cells. Red takes precedence over blue.

## Definition of Done

- App renders correctly in both light and dark modes
- On first load, theme matches OS preference with no flash of wrong theme
- Toggling the theme control switches the UI immediately (< 100ms)
- Theme preference is preserved across a full page reload
- Revealed cells display in red immediately and remain red after re-entry
- Correctly checked cells display in blue; revealed cells are never styled blue

---

# Risks

- **Flash of wrong theme on load**: CSS-in-JS or late-applying class toggles can produce a brief flash. Theme class must be applied before first paint, ideally via a blocking inline script.
- **Colour contrast in both themes**: New colours for revealed (red) and checked (blue) must maintain legibility against both light and dark cell backgrounds.

---

# Test Requirements

> 👥 Written by: Claude
>
> Approved by: Jack
>
> Tested by: Jack

**Theme**
- [ ] On first load with no saved preference, theme matches OS/system preference
- [ ] Theme toggle switches between light and dark immediately (< 100ms)
- [ ] No flash of the wrong theme on page load
- [ ] Theme preference persists across a full page reload

**Letter State Colouring**
- [ ] Using "Reveal cell" marks the affected cell red immediately
- [ ] Using "Reveal all" marks all cells red immediately
- [ ] Red colouring persists if the user types a new letter into a revealed cell
- [ ] Using "Check" marks correctly filled (non-revealed) cells blue
- [ ] Cells that are both revealed and correct remain red, not blue

**Visual Regression**
- [ ] No visual regressions at 320px and 1280px viewport widths in either theme

## Test Results

> To be completed after testing phase. Include pass/fail status for each of the above requirements.
