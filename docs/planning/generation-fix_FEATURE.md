# Generation Fix — Solver Correctness & Pool Optimisation


# Hypothesis

> 👥 Written by: Jack

## 🧑‍💼 As a:

Puzzle creator and developer maintaining a static crossword app

## 🎯 I want:

A constraint solver that always produces valid, conflict-free puzzles, backed by a pool file that loads quickly without crashing the browser

## 💡 So that:

Players never see broken puzzles, and the app doesn't freeze or run out of memory on page load or regenerate

## ✨ Context

A series of solver and pool bugs emerged after the variety milestone: intersection conflicts produced unplayable puzzles, the 40 MB pool file froze the browser on load, repeated regenerate clicks caused out-of-memory crashes, and the generic backtracker's slot ordering made non-trivial grid patterns practically unsolvable. This feature tracks the fixes and pool rebuilds that resolved all of these.

---

# Requirements Specification

> 👥 Written by: Jack
>
> Approved by: Jack

### Functional Requirements
1. The constraint solver must validate that every intersecting cell is covered by both an across and a down word that share the same letter at that position.
2. The solver must reject any candidate word placement that would create an intersection conflict.
3. The specific failing seed (`YThhOWYxOjA6MDphLGgxeDluNDoyOjA6YSxuN2I4cDU6NDowOmEseTBxNGMzOjA6MDpkLHk0aTdjNjowOjI6ZCxyN2c5dTI6MDo0OmQ`) must produce a correct, conflict-free puzzle after the fix.
4. All newly generated puzzles must be free of intersection conflicts.
5. The solver must use a most-constrained-first slot ordering that interleaves across and down entries, enabling diamond and checker patterns to be solved reliably.
6. The pool must be trimmed to a size that does not block the browser main thread on load or exhaust memory on regenerate.
7. The pool must contain globally friendly clues, filtering out US-centric content (abbreviations, state names, US sports leagues, American geography).

### Non-Functional Requirements
- Puzzle generation must complete in under 2 seconds across all supported patterns.
- `pool.json` must be small enough to parse without blocking the main thread on page load.
- Repeated "Regenerate" clicks must not cause browser OOM crashes.
- Existing valid seeds must continue to decode and render correctly after all fixes.

### Out of Scope
- Changes to the seed encoding format.
- Validation of pool.json entries beyond letter-only uppercase answers and unique IDs.
- User-facing controls for pool size or solver parameters.

## KPIs

1. **Intersection correctness** — all newly generated puzzles pass intersection validation
2. **Failing seed fix** — the known bad seed produces a correct, conflict-free puzzle
3. **Generation performance** — all patterns generate within the 2-second limit after fixes
4. **Pool load time** — `pool.json` parses without blocking the main thread
5. **OOM stability** — repeated regenerate clicks do not crash or freeze the browser
6. **Seed stability** — all pre-existing valid seeds continue to decode correctly

## Existing Functionality

Builds on the existing solver, seed encoding, and pool loading. The play and generate routes, grid renderer, and clue list are unaffected. Only `solver.js` and `pool.json` are changed.

---

# Functional Specification

> 👥 Specification
>
> Written by: Claude
>
> Approved by: Jack

**Milestone 11 — Intersection Constraint Fix**
Audit and fix the intersection validation logic in the constraint solver. Any candidate placement that creates a letter conflict at a shared cell must be rejected. Verify against the known failing seed.

**Milestone 12 — Solver Pool Cap**
Cap the solver's working set to 500 words per length bucket after shuffling. This bounds memory usage on regenerate while preserving per-attempt variety.

**Milestone 13 — Pool Trim**
Trim `pool.json` from 584k entries (40 MB) to ~1k per length (177 KB) using spread-sampling to preserve alphabetic variety. Eliminates main-thread blocking on page load.

**Milestone 14 — Solver Slot Ordering & Pool Rebuild**
Replace the all-across-then-all-down slot ordering with a greedy most-constrained-first ordering that interleaves across and down. Rebuild the pool from source with 5,000 globally friendly entries per word length (15k total, ~878 KB).

## Definition of Done

- The failing seed produces a correct, conflict-free puzzle
- All newly generated puzzles pass intersection validation
- Diamond and checker patterns generate valid puzzles reliably
- `pool.json` parses without blocking the main thread
- Repeated regenerate clicks do not cause OOM crashes
- Generation completes in under 2 seconds across all supported patterns
- All pre-existing valid seeds continue to decode correctly

---

# Risks

- **Pool sampling quality**: Spread-sampling preserves alphabetic variety but may under-represent certain word lengths if the source data is unevenly distributed. The 5k-per-length rebuild mitigates this.
- **Solver performance regression**: The most-constrained-first ordering adds a sort step; this must not push generation beyond the 2-second limit.

---

# Test Requirements

> 👥 Written by: Claude
>
> Approved by: Jack
>
> Tested by: Jack

**Intersection Correctness**
- [ ] The failing seed (`YThhOWYxOjA6MDphLGgxeDluNDoyOjA6YSxuN2I4cDU6NDowOmEseTBxNGMzOjA6MDpkLHk0aTdjNjowOjI6ZCxyN2c5dTI6MDo0OmQ`) loads and displays a correct, conflict-free puzzle
- [ ] All newly generated puzzles pass intersection validation (no crossing cell letter conflicts)

**Solver Slot Ordering**
- [ ] Diamond and checker grid patterns generate valid puzzles reliably
- [ ] Generation completes in under 2 seconds for all supported patterns

**Pool & Memory**
- [ ] `pool.json` is ≤ 1 MB and parses without blocking the main thread
- [ ] Repeated "Regenerate" clicks do not crash or freeze the browser tab
- [ ] Pool has alphabetic variety (not front-loaded with A-words)
- [ ] Pool clues do not contain US-centric abbreviations or geography

**Seed Stability**
- [ ] All pre-existing valid seeds continue to decode and render correctly after all fixes

## Test Results

> To be completed after testing phase. Include pass/fail status for each of the above requirements.
