---
name: build-themed-pool
description: >-
  Research and build a themed crossword word pool. Generates clue + 3–5 letter answer
  pairs for a theme, validates them against docs/clue-style.md, quality-gates each clue
  by answer-back testing (a fresh subagent must guess the answer from the clue alone),
  then writes public/pool-<slug>.json and updates public/pools.json. Use when the user
  wants to create or expand a themed pool of crossword clues.
argument-hint: "<theme> [target-count]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task, Agent
---

# Build a themed crossword pool

You build a themed word pool for the crossword app: clue + answer pairs where every
answer is **3–5 uppercase letters**, validated against the rules and quality-gated so
only solvable clues survive. The build is **batched, incremental, and resumable** — the
committed pool file is the only state, so you can stop after any batch and a later run
tops the same pool up toward the target.

## Inputs

Parse `$ARGUMENTS`:
- **Theme** = the argument text (e.g. `Greek mythology`). Required.
- **Target** = a trailing integer if present, else **1000**.

All commands run from the repo root. Helper scripts live in `scripts/pool-builder/`.

> **Cost note:** 1000 verified entries is a large, token-heavy job (thousands of
> generated candidates, tens of guesser subagents). If the user has not run this before,
> recommend a small first run (e.g. `30`) to validate the pipeline, then resume for more.

## One-time setup per run

1. Get the status / gap:
   ```bash
   node scripts/pool-builder/pool-status.mjs --theme "<theme>" --target <target>
   ```
   This prints JSON with `slug`, `name`, `prefix`, `fileExists`, `inManifest`, `count`,
   `distribution` (3/4/5), `perLengthTarget`, `deficit`, and `prefixCollision`.
   - If `prefixCollision` is true, ask the user to confirm or supply a different 2-char `--prefix`.
   - Note `slug`, `name`, `prefix` — reuse them for the whole run.
2. Read **`docs/clue-style.md`** and hold the rules in mind. House style for themed pools
   is the NYT-Mini register: conversational, occasionally punny, pop-culture friendly.
3. Create the scratch dir: `mkdir -p .pool-build/<slug>`.

## The batch loop

Repeat until `count >= target`, or a stop condition (below) is hit. Each batch:

### 1. Generate candidates (your reasoning)
Write ~50 candidates as JSONL to `.pool-build/<slug>/candidates.jsonl`, one object per line:
```json
{"answer": "HERA", "clue": "Queen of the Greek gods"}
```
- Answers **3–5 letters**, real, on-theme, well-known enough to be guessable.
- **Bias toward the deficient length(s)** from the latest `deficit` so the pool stays
  balanced across 3/4/5 (the solver needs a spread — all-5-letter pools can't fill many grids).
- Follow `docs/clue-style.md`: never put the answer or its root in the clue; match part of
  speech / tense / number; flag anagrams with the word "anagram"; flag foreign words/abbreviations.
- Vary the angle each batch so you don't keep regenerating the same well-known answers.

### 2. Mechanical precheck (helper)
```bash
node scripts/pool-builder/style-precheck.mjs --slug <slug> \
  --in .pool-build/<slug>/candidates.jsonl --out .pool-build/<slug>/cleaned.jsonl
```
Reads the JSON report: it drops bad lengths, empty clues, answer/root-in-clue,
unflagged anagrams, and answers already in the pool or repeated in the batch. If many
drop for one reason, adjust your generation next batch.

### 3. Answer-back quality gate (fresh subagents — the core check)
Read `.pool-build/<slug>/cleaned.jsonl`. It **contains the answers — keep it only in your
own context.** Build a guesser payload of **`{index, clue, length}` ONLY** and dispatch it
to fresh subagents (the Task/Agent tool), ~25 items per subagent (run batches in parallel).

The guesser must never see the answer. Use this prompt shape (substitute the items):
```
You are guessing crossword answers. For each item, output up to 5 distinct UPPERCASE
candidate answers of EXACTLY `length` letters that the clue could mean.
Return ONLY JSON: {"guesses":[{"index":0,"answers":["..."]}, ...]}. No prose.

items: [{"index":0,"length":4,"clue":"Queen of the Greek gods"}, ...]
```
Then, **in your own context** (you hold the answers, the guesser does not):
- Normalize each guess to uppercase; keep only those of the correct length.
- **KEEP** an entry when its true answer is among that item's ≤5 guesses; **DROP** otherwise.
- If a subagent returns malformed JSON or omits an index, treat that item as "no guess"
  (drop it) and re-issue that one batch once.

Write the keepers for this batch (just `{answer, clue}`) to `.pool-build/<slug>/survivors.jsonl`.

> **Anti-leak rules (do not break):** the guesser receives only `{index, clue, length}`;
> never the answer, never the cleaned/survivors files, never whether it guessed right.
> Each guesser is a fresh subagent. The keep/drop decision happens only in your context.

### 4. Ingest survivors (helper)
```bash
node scripts/pool-builder/ingest-candidates.mjs --slug <slug> --prefix <prefix> \
  --name "<name>" --description "<one-line theme description>" \
  --in .pool-build/<slug>/survivors.jsonl
```
Assigns prefixed sequential ids (globally unique), dedupes by answer, merges into
`public/pool-<slug>.json`, and upserts the `public/pools.json` entry. Read its JSON summary
(`added`, `skippedDuplicate`, `newTotal`, `distribution`).

### 5. Validate
```bash
npm run validate-pools
```
Must pass. If it fails, surface the errors and fix before continuing — ingest is idempotent,
so re-running after a fix is safe.

### 6. Re-check and loop
Re-run `pool-status.mjs` to refresh `count` and `deficit`. If `count < target` and yield is
healthy, go to step 1 with the new deficit.

## Stop conditions

- **Target reached** (`count >= target`): stop.
- **Low yield**: if the gate pass-rate (`survivors / cleaned`) stays below ~25% for 2–3
  consecutive batches, stop and report the realistic ceiling — don't spin. Ask whether to
  lower the target or broaden the theme.
- **Length starvation**: if a length bucket can't be filled after several targeted batches,
  accept a functional-but-imbalanced pool and **warn** that some grid patterns may be
  unsolvable (`solvePattern` returns null when a length bucket is too small).

## Final report

Report: total entries, 3/4/5 distribution vs target, overall gate pass-rate, the file and
manifest entry written, and a reminder: **run `npm run generate-seeds` only if this pool
should also feed daily puzzles** (daily generation currently uses the Guardian pool).
Leave `.pool-build/<slug>/` in place for resumes; it is gitignored.
