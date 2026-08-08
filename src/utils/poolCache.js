/**
 * Central manifest / pool loading, with an in-session memo and a background
 * "download everything" warm-up.
 *
 * Every page needs `pools.json` plus (usually) exactly one pool file, and the
 * pool files are the largest things the app ships — `pool.json` alone is
 * ~380 kB. Previously each page fetched the manifest and its pool
 * independently, so switching pools on the generate page, or navigating
 * between pages, re-fetched and re-parsed the same JSON.
 *
 * This module:
 *   - fetches `pools.json` once per session and memoises the promise
 *   - memoises each parsed pool by slug, so a pool is only ever parsed once
 *   - warms the HTTP / service-worker cache for *every* pool shortly after
 *     load (see `warmPoolCache`), so offline play and pool switching work for
 *     all themes rather than only the one that happened to be opened first
 *
 * The warm-up is deliberately conservative: it runs at idle, fetches
 * sequentially so it never competes with the current page, skips pools the
 * service worker already has, and bails out entirely when the user has Data
 * Saver enabled.
 */

const BASE = ''

/**
 * Cache the service worker serves pools from — must stay in step with the
 * `cacheName` of the pools runtimeCaching rule in vite.config.js.
 */
const POOL_CACHE_NAME = 'crossword-pools'

let manifestPromise = null
const poolPromises = new Map()

/** Public URL for a manifest entry. */
export function poolUrl(entry) {
  return `${BASE}/${entry.file}`
}

/**
 * Store a downloaded pool in the offline cache, so the service worker's
 * network-first fallback can serve it when there's no connection.
 *
 * We write it ourselves rather than relying on the worker intercepting the
 * fetch: on a first visit the page is still uncontrolled while the worker
 * installs and activates, so anything fetched in that window would reach only
 * the HTTP cache and offline play wouldn't work until the *second* visit.
 * Writing the entry the worker would have written is idempotent — the next
 * network-first fetch simply overwrites it.
 *
 * Consumes `response` either way, so the connection is never left dangling.
 */
async function putInPoolCache(url, response) {
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(POOL_CACHE_NAME)
      await cache.put(url, response)
      return
    } catch {
      // Storage full or unavailable — fall through and just discard the body.
    }
  }
  await response.arrayBuffer().catch(() => {})
}

/** True if any cache (service worker or otherwise) already holds this URL. */
async function isCached(url) {
  if (typeof caches === 'undefined') return false
  try {
    return (await caches.match(url)) !== undefined
  } catch {
    return false
  }
}

/**
 * Fetch (once) the pool manifest.
 * @returns {Promise<Array<{slug, name, file, description, default?}>>}
 */
export function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(`${BASE}/pools.json`)
      .then((r) => r.json())
      .then(({ pools }) => pools)
      .catch((err) => {
        // Don't cache a failure — a later page load should be able to retry.
        manifestPromise = null
        throw err
      })
  }
  return manifestPromise
}

/**
 * Pick the manifest entry for a slug, falling back to the default pool (and
 * then the first entry) when the slug is missing or unknown.
 */
export function resolvePoolEntry(pools, slug) {
  return (
    pools.find((p) => p.slug === slug) ??
    pools.find((p) => p.default) ??
    pools[0]
  )
}

/**
 * Fetch (once) and memoise the word list for a manifest entry.
 * @returns {Promise<Array<{id, answer, clue}>>}
 */
export function loadPool(entry) {
  const cached = poolPromises.get(entry.slug)
  if (cached) return cached

  const url = poolUrl(entry)
  const promise = fetch(url)
    .then(async (res) => {
      // Clone before parsing so the offline cache can be topped up with what
      // we just loaded (see putInPoolCache); .json() consumes the original.
      const forCache = res.ok ? res.clone() : null
      const { pool } = await res.json()
      if (forCache) putInPoolCache(url, forCache)
      return pool
    })
    .catch((err) => {
      poolPromises.delete(entry.slug)
      throw err
    })

  poolPromises.set(entry.slug, promise)
  return promise
}

/** Convenience: resolve the manifest entry for a slug and load its pool. */
export function loadPoolBySlug(slug) {
  return loadManifest().then((pools) => {
    const entry = resolvePoolEntry(pools, slug)
    return loadPool(entry).then((pool) => ({ entry, pool }))
  })
}

// ── Background warm-up ──────────────────────────────────────────────────────

let warmStarted = false

/** Run `fn` when the browser is idle, or after `delayMs` where that's unsupported. */
function whenIdle(fn, delayMs) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(fn, { timeout: delayMs * 2 })
  } else {
    window.setTimeout(fn, delayMs)
  }
}

/**
 * Download every pool in the manifest in the background so that all themes are
 * available offline and switching pools is instant.
 *
 * Safe to call more than once (React StrictMode mounts effects twice in dev) —
 * only the first call does any work.
 *
 * @param {{ delayMs?: number }} [options]
 */
export function warmPoolCache({ delayMs = 1500 } = {}) {
  if (warmStarted || typeof window === 'undefined') return
  warmStarted = true

  // Respect Data Saver: ~600 kB of speculative download is exactly what the
  // user is asking us not to do.
  if (navigator.connection?.saveData) return

  whenIdle(async () => {
    let pools
    try {
      pools = await loadManifest()
    } catch {
      return
    }

    // Sequential rather than parallel: the warm-up is speculative, so it
    // should never contend with whatever the visible page is doing.
    for (const entry of pools) {
      // Already loaded (or loading) for the current page — loadPool caches it.
      if (poolPromises.has(entry.slug)) continue
      const url = poolUrl(entry)
      if (await isCached(url)) continue
      try {
        const res = await fetch(url)
        if (res.ok) await putInPoolCache(url, res)
        else await res.arrayBuffer()
      } catch {
        // Offline or a transient failure — the pool will be fetched on demand.
      }
    }
  }, delayMs)
}
