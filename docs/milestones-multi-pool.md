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

### 5. What Pools Make Sense

| Slug | Content | Source idea |
|------|---------|-------------|
| `guardian` | General knowledge, ~4,384 entries | Already exists |
| `sports` | Athletes, teams, events, equipment | Manual curation |
| `film-tv` | Films, directors, characters, shows | Manual curation |
| `music` | Artists, albums, instruments, genres | Manual curation |

Start with one additional pool to prove out the system before expanding.

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

**Done when:** You pick a pool from the dropdown, hit Generate, get a puzzle from that pool, and the copied share URL correctly loads it for players.

---

### Milestone 3 — First Additional Pool

**Goal:** A real second pool file with enough entries for reliable standalone generation.

**Changes:**

- `public/pool-sports.json` (or `pool-film-tv.json`) with ≥500 entries; IDs prefixed with slug
- `scripts/validate-pool.js` — checks format, word lengths, ID uniqueness across all pools in manifest. Hooked into CI.
- `pools.json` updated to include the new pool

**Done when:** Selecting "Sports" in the Generate dropdown produces a puzzle with sports-only clues. CI validates pool integrity on every push.

---

### Milestone 4 — Custom / Private Pool (URL-hosted)

**Goal:** A group can maintain a private word list and generate puzzles from it.

**Approach:** Custom pool hosted at any stable URL (GitHub Gist, group server, etc.).

- Generate page gains a "Custom pool URL" input field
- On submit, fetch and validate the JSON from that URL client-side
- Share URL carries the pool as a URL param: `&pool=custom&poolUrl=<encoded-url>`
- Play page reads `poolUrl` param and fetches it directly
- Security note: pool is fetched client-side; only use URLs you trust

**Done when:** A group can paste a Gist URL, generate a puzzle, share the full link, and anyone with the link can play with that custom word list loaded automatically.

---

## Sequencing

```
M1 (manifest + Play page loading)
  → M2 (Generate page dropdown)     ← needs at least one more pool to be useful
  → M3 (first additional pool)      ← can be done in parallel with M2 UI work
  → M4 (custom URL pool)
```

Daily puzzle is never in scope for pool switching — it always uses Guardian.

---

## Open Questions

1. **Entry count floor**: What's the minimum pool size to reliably generate a puzzle? The solver needs enough 5-letter word variety. Empirically, 4,384 entries is very reliable. A themed pool of 200–300 may struggle. Worth benchmarking before committing a minimum — 500 entries is a reasonable starting target.

2. **Clue style consistency**: Mixed pools aren't supported in this design (one pool per puzzle), which sidesteps tonal clashing. If blending is ever wanted, revisit.

3. **Pool attribution in Play UI**: Should solvers see "Sports pool" during play? Low priority but friendly — could be a subtitle on the puzzle page.

4. **Pool update policy**: Entries can be added or clues edited freely. IDs must never be removed (breaks existing seeds). No tombstone/deprecation mechanism needed for now.
