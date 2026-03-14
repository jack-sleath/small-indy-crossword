Title: Project Scaffold — React + Vite app deployed to GitHub Pages

<details>
<summary>Original Spec</summary>

**Goal:** Get a working React app deployed to GitHub Pages with the basic file structure in place.

**Tasks:**
- Initialise a React + Vite project in the repo root
- Configure client-side routing (React Router) with two routes: `/` (play) and `/generate`
- Configure GitHub Pages deployment (e.g. `gh-pages` package or GitHub Actions workflow) with `404.html` redirect to support client-side routing
- Add a `pool.json` with a small sample of clue/answer pairs in the agreed shape:
  ```json
  { "pool": [{ "id": "a3f9c2", "answer": "CRANE", "clue": "Bird or construction machine" }] }
  ```
- Create stub `PlayPage` and `GeneratePage` components that each load `pool.json` and log it to the console
- Set up basic global CSS reset and mobile-friendly viewport meta tag

**Done when:**
- [ ] `npm run dev` starts the app locally without errors
- [ ] `/` and `/generate` routes both render without errors
- [ ] `npm run build && npm run deploy` publishes to GitHub Pages
- [ ] The deployed page is reachable and both routes work via the GitHub Pages URL
- [ ] `pool.json` contents are visible in the browser console on both routes

</details>


Technical Notes:
Infrastructure and developer-facing milestone. There is no end-user UI beyond stub pages. Acceptance criteria are written from a developer/operator perspective. Key scaffolding concerns: Vite base path must be set correctly for GitHub Pages sub-path hosting; `404.html` redirect is required to prevent hard-refresh 404s on client-side routes.


**GIVEN** a developer has cloned the repo and run `npm install`
**WHEN** they run `npm run dev`
**THEN** the local dev server starts without errors and is accessible in a browser

**GIVEN** the local dev server is running
**WHEN** a developer navigates to `/`
**THEN** the `PlayPage` stub renders without errors

**GIVEN** the local dev server is running
**WHEN** a developer navigates to `/generate`
**THEN** the `GeneratePage` stub renders without errors

**GIVEN** either stub page has loaded
**WHEN** the developer opens the browser console
**THEN** the contents of `pool.json` are logged (at minimum one entry with `id`, `answer`, and `clue` fields)

**GIVEN** a developer runs `npm run build && npm run deploy`
**WHEN** the command completes
**THEN** the built app is published to the GitHub Pages URL without errors

**GIVEN** the app is deployed to GitHub Pages
**WHEN** a user navigates to the root GitHub Pages URL
**THEN** the `PlayPage` stub is displayed without a 404 or blank screen

**GIVEN** the app is deployed to GitHub Pages
**WHEN** a user navigates directly to the `/generate` path (e.g. via hard refresh or direct link)
**THEN** the `GeneratePage` stub is displayed without a 404 — the `404.html` redirect handles the missing server-side route
