# Multi-Pool Generation — Design & Milestones

## The Idea

Right now every puzzle draws from a single flat `pool.json` (4,384 Guardian-sourced clues). Multi-pool support means a puzzle can be generated from a curated subset — Sports only, Film & TV only, a blend of two, or a private list your group maintains. The puzzle creator picks which pool(s) to draw from; the resulting seed carries that choice so players automatically load the right words.

---

## Core Design Decisions

### 1. Seed Format Versioning

Current seeds are implicitly "v1": plain base64 of `poolId:row:col:dir,...`. They carry no information about which pool file to load — the player always loads `pool.json`.

New seeds will be "v2": the first segment names the pool(s) used.

```
v1 (current):  <base64(poolId:row:col:dir,...)>
v2 (new):      v2:<pool-slugs>:<base64(poolId:row:col:dir,...)>
               e.g. v2:guardian:NTkwcmlv...
               e.g. v2:guardian+sports:NTkwcmlv...
```

- Detection: if seed starts with `v2:`, parse new format; otherwise treat as v1
- Fully backward-compatible: existing shared links continue to work
- Pool slugs are short, URL-safe strings (`guardian`, `sports`, `film-tv`)

### 2. Pool Manifest

A `public/pools.json` file acts as the registry of available pools:

```json
{
  "pools": [
    {
      "slug": "guardian",
      "name": "Guardian Quick",
      "file": "pool.json",
      "description": "General knowledge clues, British English style",
      "default": true
    },
    {
      "slug": "sports",
      "name": "Sports",
      "file": "pool-sports.json",
      "description": "Athletes, teams, sporting events"
    }
  ]
}
```

- Generate page fetches manifest, shows available pools
- Play page fetches manifest, then loads only the pools named in the seed
- Adding a new pool = add a file + one entry in `pools.json`

### 3. Pool ID Uniqueness

Pool IDs are encoded in seeds and must be globally unique across all pools. Two strategies:

- **Slug prefix on creation**: new pools prefix IDs with their slug (`sports-abc123`). Guardian pool keeps existing IDs unprefixed (they're already unique strings).
- **Validation at manifest load**: warn if any two pools share an ID.

Never change an ID after a seed using it has been shared.

### 4. Merging Pools for Generation

When multiple pools are selected, merge before passing to the solver:

- Concatenate entries from each pool
- Deduplicate by `id` (same word from two pools: first one wins)
- The solver sees one flat array — no changes needed to solver logic

### 5. What Pools Make Sense

| Slug | Content | Source idea |
|------|---------|-------------|
| `guardian` | General knowledge, ~4,384 entries | Already exists |
| `sports` | Athletes, teams, events, equipment | Manual curation + scripted fetch |
| `film-tv` | Films, directors, characters, shows | Manual curation |
| `music` | Artists, albums, instruments, genres | Manual curation |
| `geography` | Countries, cities, rivers, landmarks | Manual curation |
| `custom` | Private group lists | User-uploaded JSON |

Start with one additional pool to prove out the system before expanding.

---

## Milestones

### Milestone 1 — Seed Format v2 + Pool Manifest

**Goal:** The infrastructure for multi-pool seeds, with no visible UI change yet. Backward-compatible with all existing seeds.

**Changes:**

- `public/pools.json` — manifest listing `guardian` pool (pointing to existing `pool.json`)
- `src/utils/seed.js` — update `encodeSeed()` to accept an optional `poolSlugs` array and emit v2 format; update `decodeSeed()` to detect v2 and return the slug list alongside entries
- `src/pages/PlayPage.jsx` — fetch manifest, parse seed version, load required pool file(s), merge before decoding
- `src/pages/GeneratePage.jsx` — fetch manifest, load default pool, encode v2 seed (single pool for now)
- `src/pages/DailyPage.jsx` — same pool-loading update as PlayPage

**Done when:** Existing seeds still play. Newly generated seeds are v2 format and still play. No user-visible pool selection yet.

---

### Milestone 2 — Pool Selector on Generate Page

**Goal:** The puzzle creator can choose which pool(s) to generate from.

**Changes:**

- `GeneratePage` shows a pool-picker component: checkboxes for each pool in the manifest, with name + description + entry count
- At least one pool must remain selected (disable unchecking the last one)
- Selected pools are merged before `solvePattern()` is called
- Encoded seed includes all selected slugs (`v2:guardian+sports:...`)
- Pool credit shown below the puzzle preview ("Drawing from: Guardian Quick + Sports")

**Done when:** You can check "Sports", hit Generate, get a puzzle made entirely from sports clues, copy the seed, and play it on the Play page which loads the right pool automatically.

---

### Milestone 3 — First Additional Pool (Sports or Film & TV)

**Goal:** A real second pool file with enough entries to generate standalone puzzles.

**Changes:**

- `public/pool-sports.json` (or `pool-film-tv.json`) with ≥500 entries, IDs prefixed with pool slug
- `scripts/validate-pool.js` — standalone validator: checks format, ID uniqueness across manifest, word length constraints. Run in CI.
- Update `pools.json` to include new pool
- Verify blended generation works end-to-end (Guardian + Sports seed plays correctly)

**Done when:** A fresh Sports-only seed generates, shares, and plays with clues exclusively from sports content. CI validates the pool on every push.

---

### Milestone 4 — Custom / Private Pool

**Goal:** A small group can maintain their own word list (inside jokes, group-specific references) and generate puzzles from it.

**Scope to define:**

Two sub-options, pick one or both:

**4a — File upload on Generate page**
- "Add custom pool" button opens a file picker
- Accepts `.json` in the same format as pool files
- Validated client-side; entries merged with any selected public pools
- Custom pool is session-only (not persisted); seed still encodes by pool ID only, so plays need the same custom file to decode — not suitable for sharing outside the group

**4b — URL-hosted custom pool**
- Custom pool hosted at any URL (e.g., a GitHub Gist or group's own server)
- Generate page accepts a `customPool=<url>` query param
- Seed format extended to carry the URL: `v2:guardian+custom(<url>):...`
- Anyone with the link can play (pool fetched at play time)
- Security note: pool URL is fetched client-side; only trust pools you control

Recommend shipping 4a first (simpler, no CORS issues), then 4b if groups want sharing.

---

### Milestone 5 — Themed Daily Puzzles (Stretch)

**Goal:** Daily puzzles can have a pool theme, rotating by day or week.

**Changes:**

- `public/daily-seeds.json` extended: each entry can optionally include `pools` array alongside the seed string
- `DailyPage` reads the pool list from the daily entry and loads accordingly
- Pre-generation script updated to accept a pool slug per puzzle when generating the annual rotation
- Optional: "Sports Saturdays", "Film Fridays" pattern baked into the generation script

**Done when:** Saturday's daily puzzle exclusively uses sports clues; a solver loading it sees the sports pool fetched automatically.

---

## Sequencing Recommendation

```
M1 (seed format + manifest) → M2 (UI selector) → M3 (second pool) → M4a (custom upload) → M4b (URL pool) → M5 (themed daily)
```

M1 and M3 can be partially parallelised — pool content can be curated while the seed format work happens. Don't wire M2 UI until M1 plumbing is solid and at least one additional pool exists (M3), otherwise the selector has nothing meaningful to select.

---

## Open Questions

1. **Pool update policy**: If a pool file is updated (new entries added, clue text edited), old seeds referencing stable IDs should still decode correctly. This is safe as long as IDs are never removed. Do we want a "deprecated" flag in the manifest for pools being retired?

2. **Entry count floor**: What's the minimum pool size to reliably generate a puzzle? The solver needs enough 5-letter word variety. Empirically, the guardian pool at 4,384 entries is very reliable. A themed pool of 200–300 entries might struggle. Worth benchmarking — maybe 500 entries minimum before a pool ships.

3. **Clue style consistency**: Mixed pools may clash tonally (a Guardian-style cryptic clue next to a fan-wiki plot summary). Worth setting a clue style guide for any contributed pool.

4. **Pool attribution in the Play UI**: Should players see "Sports + Guardian" during play, or only the puzzle creator needs to know? Attribution feels friendly but adds UI complexity to PlayPage.
