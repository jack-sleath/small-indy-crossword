# STATUS — Daily puzzle → date-seeded generation

_Updated 2026-06-14. **Implemented & verified in the working tree, but NOT committed/pushed** —
one product decision needs your sign-off first (see "DECISION NEEDED")._

## What this does

Replaces the pre-baked `daily-seeds.json` (365 fixed seeds that eventually run out) with
**on-the-fly generation from the UTC date**, so the daily never runs out and needs no seed list.
Mirrors Traindle's `getDailyStation` approach: seed = UTC date string, retries salt the string
(`${date}-1`…) so a retry can't collide with the next day, and "avoid yesterday" replays
yesterday's own puzzle (2-day lookback).

## What I implemented (all in the working tree)

- **`src/utils/dailySeed.js`** (new) — pure resolver: `hashToInt` (cyrb53-ish date→uint32),
  `getUtcDayNumber`/`dateStrForDay`, `resolveDay` (salt cap 50, avoids prev-day pool ids),
  `resolveDailySeed` (2-day-lookback chain → `{ seed, dayNumber }`). Epoch kept at 2026-01-01.
- **`src/pages/DailyPage.jsx`** (rewritten) — fetches the default (Guardian) pool via the
  `pools.json` manifest, calls `resolveDailySeed`, renders `<PlayPage overrideSeed dailyNumber/>`.
  Error/loading UI unchanged. PlayPage untouched.
- **Retired**: `git rm` of `public/daily-seeds.json` + `scripts/generate-daily-seeds.mjs`
  (staged deletions); removed the `generate-seeds` npm script; updated the now-stale refs in
  `.claude/skills/build-themed-pool/SKILL.md` and `docs/planning/ACCEPTANCE_CRITERIA.md`.
  (Left `docs/planning/MILESTONES.md` as a historical record of the original milestone.)

## ⚠️ The finding that changed things

We picked **option (A) — keep all 9 patterns, cap 50** — believing the worst case was ~40
re-seeds (from the old 10-day sim). **That premise is wrong.** Measured on the Guardian pool:

- The two dense grids `slash` and `backslash` cost **~1 second PER solve attempt** and routinely
  need dozens of attempts.
  - `slash` day 5 (2026-01-06): salt 31 → **32.5 seconds** to resolve.
  - `backslash` day 169 (**2026-06-19**): **failed within cap 50** (>50s, no puzzle → the daily
    would show the error screen that day).
- So option (A) as decided is **non-viable client-side**: a ~30–50s frozen tab on slash/backslash
  days, plus outright broken days. "Hang a bit" turned out to be "hang for ~half a minute / break."

(Why: opposite-corner blackouts make a dense 4-and-5-letter grid that the backtracker struggles
with on this pool. The other 7 patterns are unaffected — they solve in ms at salt 0.)

## What I did about it (provisional — your call)

Applied **option (B)** — your own listed alternative: **drop `slash` + `backslash` from the daily
rotation only** (the generator/GeneratePage still offers all 9). One filter in `dailySeed.js`:
`DAILY_PATTERNS = PATTERNS.filter(p => p.name !== 'slash' && p.name !== 'backslash')`.

Verified (scratch scripts in gitignored `.pool-build/`, `daily-verify.mjs`):
- Today 2026-06-14 → Day #165, `donut`, salt 0, **137ms** for the full 3-resolve chain. Deterministic.
- **All 400 days resolve**, all seeds distinct, **zero** consecutive-day pool-id overlap.
- **Max salt = 2** across 400 days (cap 50 is now huge headroom); avg ~21ms/day. Worst single-day
  solve ~1.17s (a one-off; typical is ms).
- `npm run build` passes (compiles the new util + DailyPage under Vite).

## DECISION NEEDED — ratify (B), or pick another fix?

I went with (B) because it's the only option that yields a working daily *and* it's one you'd
already proposed — but it does mean those 2 grid shapes never appear in the daily. Options:

- **(B) Drop slash+backslash from the daily** — DONE & verified. Fast, robust, reversible
  (one line). Cost: 7 daily shapes instead of 9. ← my recommendation, ready to ship.
- **(A′) Keep all 9, accept the cost** — NOT recommended: ~30–50s UI freeze on dense days and
  broken days like 2026-06-19. (Revert: change `DAILY_PATTERNS` back to `PATTERNS` + raise cap.)
- **(C) Web Worker** — keep all 9 but run the solver off-thread so dense days show a spinner
  instead of freezing. Still 30–50s on those days; more work; doesn't fix the occasional failure.
- **(D) Fix the pool** — add more 4-letter Guardian words so slash/backslash solve fast, then
  re-add them. Best long-term; needs pool work + re-measurement.
- **(E) Deterministic pattern-fallback** — keep all 9, but if a day's dense pattern fails within a
  small cap, deterministically fall back to the next sparse pattern *that day*. Guarantees a puzzle
  and keeps dense shapes on the days they happen to solve; adds a little complexity.

## To ship (B) if you agree

Working tree is ready and building. Just commit + push (nothing else needed):
`git add -A && git commit && git push` (branch `feat/build-themed-pool-skill`).
To instead go a different route, see the revert notes per-option above.

## Repo state at this pause

- Branch `feat/build-themed-pool-skill`. **Uncommitted, not pushed.**
- `git status`: modified `src/pages/DailyPage.jsx`, `package.json`,
  `.claude/skills/build-themed-pool/SKILL.md`, `docs/planning/ACCEPTANCE_CRITERIA.md`;
  new `src/utils/dailySeed.js`; staged deletions of `public/daily-seeds.json` +
  `scripts/generate-daily-seeds.mjs`; this STATUS file (untracked).
- Scratch verification scripts in `.pool-build/` (gitignored): `daily-verify.mjs` (option-B
  full check), `daily-survey.mjs`, `daily-probe.mjs` (the dense-pattern timing probe).
