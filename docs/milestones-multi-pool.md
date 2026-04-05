# Multi-Pool Generation — Design & Milestones

## The Idea

Right now every puzzle draws from a single flat `pool.json` (4,384 Guardian-sourced clues). Multi-pool support lets the puzzle creator pick a themed pool before generating — Sports, Film & TV, etc. The daily puzzle always stays on the Guardian pool. For custom games, the chosen pool travels in the URL so players automatically load the right words.

---

## Core Design Decisions

### 1. Pool lives in the URL, not the seed

The seed format stays exactly as it is today. Instead of embedding pool information inside the seed string, the pool is a separate URL query parameter:

```
Guardian (default):  /?seed=NTkwcmlv...
Sports pool:         /?seed=NTkwcmlv...&pool=sports
Film & TV pool:      /?seed=NTkwcmlv...&pool=film-tv
```

- **No seed format changes** — `seed.js` is untouched
- **Backward compatible** — all existing links keep working (no `pool` param = Guardian)
- **Daily puzzle** — `DailyPage` hardcodes the Guardian pool; pool param is ignored there
- When the Generate page creates a share URL it appends `&pool=<slug>` if the chosen pool is not Guardian

### 2. Pool Manifest

A `public/pools.json` file lists available pools:

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

- Generate page fetches manifest, populates the pool dropdown
- Play page reads `?pool` param, finds matching entry in manifest, fetches that file
- Adding a new pool = add a file + one line in `pools.json`

### 3. Generate page flow

Before generating, a dropdown lets the creator pick which pool to use. On selection:

1. Fetch the chosen pool file
2. Run `solvePattern()` against that pool
3. Build and display the puzzle
4. Share URL = `/?seed=<seed>&pool=<slug>` (omit `&pool` if Guardian)

The dropdown shows pool name + entry count so the creator can see if a pool is large enough to be reliable.

### 4. Pool ID Uniqueness

Pool IDs are encoded in seeds and must not clash across pools. Rule: new pool files prefix all IDs with their slug (`sports-abc123`, `film-abc123`). Guardian's existing IDs are unprefixed and are already unique strings — no changes needed there.

A validation script enforces uniqueness across all pools in the manifest before any pool ships.

### 5. Pools

| Slug | Name | File |
|------|------|------|
| `guardian` | Guardian Quick | `pool.json` (existing) |
| `lol` | League of Legends | `pool-lol.json` |
| `nyt-mini` | NYT Mini | `pool-nyt-mini.json` |
| `star-wars` | Star Wars | `pool-star-wars.json` |

All three new pool files exist as empty scaffolding — ready to populate.

---

## Milestones

### Milestone 1 — Pool Manifest + Play Page Pool Loading

**Goal:** Infrastructure wired up, no UI changes on Generate yet. Daily puzzle unaffected.

**Changes:**

- `public/pools.json` — manifest with just the `guardian` entry pointing at existing `pool.json`
- `src/pages/PlayPage.jsx` — read `?pool` URL param, fetch manifest, load the named pool file (default to `pool.json` if no param), then decode seed as normal
- `src/pages/DailyPage.jsx` — no change needed; it already loads `pool.json` directly and ignores URL params

**Done when:** `/?seed=<existing-seed>` still plays. `/?seed=<seed>&pool=guardian` also plays (param is handled but resolves to the same pool). No user-visible change yet.

---

### Milestone 2 — Pool Dropdown on Generate Page

**Goal:** Puzzle creator selects a pool before generating; share URL carries the pool param.

**Changes:**

- `GeneratePage` fetches `pools.json`, renders a `<select>` dropdown above the Generate button
- Selecting a different pool re-fetches that pool file and re-triggers generation
- Share URL includes `&pool=<slug>` when pool is not Guardian; copy button copies full URL
- Pool name + entry count shown in the dropdown option label
- `PlayPage` displays the pool name as a subtitle (e.g. "League of Legends") sourced from the manifest

**Done when:** You pick a pool, hit Generate, get a puzzle from that pool, the copied share URL loads it for players, and the pool name is visible during play.

---

### Milestone 3 — Populate the Pools

**Goal:** All three themed pools reach 500 entries and pass validation.

**Changes:**

- `pool-lol.json`, `pool-nyt-mini.json`, `pool-star-wars.json` each populated to 500 entries (IDs prefixed with slug)
- `scripts/validate-pool.js` — checks format, word lengths (2–5 uppercase letters), ID uniqueness across all pools in manifest. Hooked into CI.

**Done when:** Each themed pool generates a valid puzzle standalone. CI validates pool integrity on every push.

---

## Sequencing

```
M1 (manifest + Play page loading)   ✅ done
  → M2 (Generate page dropdown)     ✅ done
  → M3 (populate pools + CI)        ✅ script done / pools pending content
```

Daily puzzle is never in scope for pool switching — it always uses Guardian.

See `docs/possible-expanded-features/` for parked ideas.

---

## Resolved Decisions

1. **Entry count floor**: Each pool will be populated to exactly 500 entries before being wired up.

2. **No blending**: One pool per puzzle, always. No multi-pool merging needed.

3. **Pool attribution in Play UI**: Yes — display the pool name to solvers (e.g. as a subtitle on the Play page). Needs to be fetched from the manifest using the `?pool` param.

4. **Pool update policy**: Entries can be added and clues edited freely. IDs will never be removed.
