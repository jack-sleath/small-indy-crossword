# Custom / Private Pool (URL-hosted)

**Goal:** A group can maintain a private word list and generate puzzles from it.

**Approach:** Custom pool hosted at any stable URL (GitHub Gist, group server, etc.).

- Generate page gains a "Custom pool URL" input field
- On submit, fetch and validate the JSON from that URL client-side
- Share URL carries the pool as a URL param: `&pool=custom&poolUrl=<encoded-url>`
- Play page reads `poolUrl` param and fetches it directly
- Security note: pool is fetched client-side; only use URLs you trust. The URL must serve JSON with permissive CORS headers — GitHub Gists and most CDNs do, arbitrary servers may not.

**Done when:** A group can paste a Gist URL, generate a puzzle, share the full link, and anyone with the link can play with that custom word list loaded automatically.
