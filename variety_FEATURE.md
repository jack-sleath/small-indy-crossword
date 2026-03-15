# Variety — Multiple Grid Patterns


# Hypothesis

> 👥 Written by: Jack

## 🧑‍💼 As a:

Puzzle creator sharing daily mini crosswords with a small private group

## 🎯 I want:

Support for multiple distinct 5×5 grid patterns with varying word lengths

## 💡 So that:

Puzzles feel fresh and varied rather than always being three 5-letter across words and three 5-letter down words

## ✨ Context

Support multiple distinct 5×5 crossword grid patterns (varying which cells are black or white) so that puzzles are not always three full 5-letter across words and three full 5-letter down words, naturally producing words of different lengths.

---

# Requirements Specification

> 👥 Written by: Jack
>
> Approved by: Jack

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

## KPIs

1. **Pattern coverage** — at least 3 distinct patterns available and selectable by the generator
2. **Solver correctness** — each pattern produces valid, fully solvable crosswords
3. **Clue numbering accuracy** — numbering is correct for every supported pattern
4. **Generation performance** — all patterns generate within the 2-second limit
5. **Seed stability** — all pre-existing seeds (original pattern) continue to decode correctly

## Existing Functionality

Builds on the existing app. The seed encoding, play route, and clue/grid rendering components are extended to handle variable word lengths. The constraint solver is generalised to accept an arbitrary pattern rather than the hardcoded original layout.

---

# Functional Specification

> 👥 Specification
>
> Written by: Claude
>
> Approved by: Jack

**Milestone 10 — Grid Pattern Variety**
Define a data structure for 5×5 grid patterns. Implement at least 3 predefined patterns. Generalise the constraint solver, `encodeSeed`/`decodeSeed`, `CrosswordGrid`, `ClueList`, and clue numbering to handle variable-length word slots. Add the new patterns to `/generate` so the generator picks from them.

## Definition of Done

- At least 3 distinct 5×5 patterns are available and selectable by the generator
- Each pattern renders with the correct black/white cell layout
- Words of lengths 2–5 display correctly in both the grid and clue list
- Clue numbering is accurate for each pattern
- All patterns produce valid, fully solvable crosswords within the 2-second generation limit
- Existing seeds (original pattern) still decode and render correctly

---

# Risks

- **Seed encoding compatibility**: Adding variable-length slots must not break the existing seed format for the original pattern.
- **Solver performance on constrained patterns**: Patterns with more intersections may increase backtracking depth; generation time must remain under 2 seconds.

---

# Test Requirements

> 👥 Written by: Claude
>
> Approved by: Jack
>
> Tested by: Jack

**Pattern Rendering**
- [ ] At least 3 distinct patterns are selectable from `/generate`
- [ ] Each pattern renders with the correct black/white cell layout in the grid
- [ ] Words of lengths 2–5 display correctly in both the grid and clue list
- [ ] Clue numbering is accurate for each pattern

**Solver & Generation**
- [ ] All supported patterns produce valid, fully solvable crosswords
- [ ] Generation completes in under 2 seconds for all patterns
- [ ] Existing seeds (original pattern) still decode and render correctly

## Test Results

> To be completed after testing phase. Include pass/fail status for each of the above requirements.
