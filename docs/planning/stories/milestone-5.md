Title: Seed Encoding & Play Route Integration — URL-based puzzle loading and sharing

<details>
<summary>Original Spec</summary>

**Goal:** The play route can decode a seed from the URL into a full puzzle and display the seed/share UI.

**Tasks:**
- Define the seed format: each entry encoded as `poolId:row:col:direction`, comma-joined, then base64'd into a short alphanumeric string
- Implement `encodeSeed(entries) → string` and `decodeSeed(string, pool) → entries[]` utility functions
- On `/`, read `?seed=` from the URL query string; decode it using the pool and hand the resulting puzzle layout to the existing game components
- If no seed is present, show a prompt with a link to `/generate`
- Display the short seed code persistently on the play screen
- Implement the Share button: copies `<baseUrl>/?seed=<code>` and the short code to clipboard

**Done when:**
- [ ] `encodeSeed` and `decodeSeed` are unit-testable pure functions
- [ ] A hardcoded valid seed loads the correct puzzle on `/`
- [ ] The short code is visible on the play screen
- [ ] Share button copies URL and code to clipboard
- [ ] Visiting `/` with no seed shows a prompt linking to `/generate`
- [ ] The same seed produces the same puzzle on reload and on a different device

</details>


Technical Notes:
`encodeSeed` and `decodeSeed` are pure utility functions with no side effects — they must be independently unit-testable. The seed format is: entries serialised as `poolId:row:col:direction`, comma-joined, then base64-encoded. Stability is critical: the encoding must not change across app versions. The Share button uses the Clipboard API — **CONFIRM FALLBACK BEHAVIOUR** on browsers/contexts where clipboard access is denied and flag for **MANUAL REVIEW**.


**GIVEN** a developer calls `encodeSeed` with a valid array of puzzle entries
**WHEN** the function runs
**THEN** it returns a base64-encoded string representing those entries

**GIVEN** a developer calls `decodeSeed` with a valid seed string and the pool
**WHEN** the function runs
**THEN** it returns the same array of puzzle entries that was originally encoded

**GIVEN** the same seed string is passed to `decodeSeed` at two different times (or on two different devices)
**WHEN** both calls complete
**THEN** both return identical puzzle layouts

**GIVEN** a user navigates to `/?seed=<validCode>`
**WHEN** the play page loads
**THEN** the puzzle encoded in the seed is decoded and rendered in the crossword grid

**GIVEN** a valid seed is loaded on the play page
**WHEN** the user views the page
**THEN** the short seed code is visible on screen at all times (not hidden behind a menu or interaction)

**GIVEN** the play page is showing a puzzle
**WHEN** the user activates the Share button
**THEN** both the full seeded URL and the short code are copied to the clipboard

**GIVEN** a user navigates to `/` with no `?seed=` query parameter
**WHEN** the page loads
**THEN** no puzzle is rendered and a prompt is displayed directing the user to `/generate` to create a puzzle

**GIVEN** a user navigates to `/?seed=<invalidOrMalformedCode>`
**WHEN** the page attempts to decode the seed
**THEN** a clear error is shown rather than a blank screen or silent failure — **CONFIRM ERROR HANDLING BEHAVIOUR** and flag for **MANUAL REVIEW**
