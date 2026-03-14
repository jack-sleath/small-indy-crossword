/**
 * Seed encoding/decoding utilities.
 *
 * Seed format: each entry is `poolId:row:col:direction` where direction is
 * 'a' (across) or 'd' (down). Entries are comma-joined, then URL-safe base64
 * encoded ('+' → '-', '/' → '_', '=' stripped).
 *
 * These are pure functions with no React or browser dependencies.
 */

/**
 * Encode an array of entry descriptors into a URL-safe seed string.
 * @param {Array<{poolId: string, row: number, col: number, direction: 'across'|'down'}>} entries
 * @returns {string}
 */
export function encodeSeed(entries) {
  const raw = entries
    .map((e) => `${e.poolId}:${e.row}:${e.col}:${e.direction === 'across' ? 'a' : 'd'}`)
    .join(',')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decode a seed string into entry descriptors, looking up answer/clue from pool.
 * Returns null if the seed is malformed or references an unknown pool id.
 *
 * @param {string} seed
 * @param {Array<{id: string, answer: string, clue: string}>} pool
 * @returns {Array<{poolId: string, row: number, col: number, direction: 'across'|'down', answer: string, clue: string}> | null}
 */
export function decodeSeed(seed, pool) {
  try {
    // Restore standard base64 padding (stripped during encoding)
    const padded = seed.replace(/-/g, '+').replace(/_/g, '/') +
      '=='.slice(0, (4 - (seed.length % 4)) % 4)
    const raw = atob(padded)
    const poolMap = new Map(pool.map((p) => [p.id, p]))

    return raw.split(',').map((part) => {
      const [poolId, rowStr, colStr, dir] = part.split(':')
      if (!poolId || rowStr === undefined || colStr === undefined || !dir) {
        throw new Error(`Malformed entry: ${part}`)
      }
      const poolItem = poolMap.get(poolId)
      if (!poolItem) throw new Error(`Unknown pool id: ${poolId}`)
      return {
        poolId,
        row: Number(rowStr),
        col: Number(colStr),
        direction: dir === 'a' ? 'across' : 'down',
        answer: poolItem.answer,
        clue: poolItem.clue,
      }
    })
  } catch {
    return null
  }
}
