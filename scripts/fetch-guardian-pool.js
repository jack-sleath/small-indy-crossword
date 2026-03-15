/**
 * Fetches Guardian quick crossword puzzles and builds a new pool.json.
 *
 * Usage:
 *   node scripts/fetch-guardian-pool.js
 *
 * Fetches puzzles from START_ID to END_ID (inclusive), extracts clue/answer
 * pairs for word lengths 3–5, deduplicates by answer (keeping the shortest,
 * most common clue), then writes public/pool.json with up to MAX_PER_LENGTH
 * entries per word length.
 *
 * The Guardian quick crossword JSON endpoint is publicly accessible:
 *   https://www.theguardian.com/crosswords/quick/NNNNN.json
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const START_ID = 13000;
const END_ID = 16500;
const MAX_PER_LENGTH = 1000;
const TARGET_LENGTHS = new Set([3, 4, 5]);
const DELAY_MS = 150; // be polite to the Guardian's servers

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function cleanClue(clue) {
  // Remove length indicators like "(5)" or "(3,4)" at the end
  return clue.replace(/\s*\(\d[\d,]*\)\s*$/, '').trim();
}

async function fetchPuzzle(id) {
  const url = `https://www.theguardian.com/crosswords/quick/${id}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'crossword-pool-builder/1.0 (personal project)' },
  });
  if (!res.ok) return null;
  return res.json();
}

async function main() {
  // Map: answer -> { clue, count }
  const byAnswer = new Map();

  let fetched = 0;
  let failed = 0;

  for (let id = START_ID; id <= END_ID; id++) {
    process.stdout.write(`\rFetching ${id}/${END_ID} (ok:${fetched} fail:${failed})   `);

    try {
      const data = await fetchPuzzle(id);
      const puzzle = data?.crossword;
      if (!puzzle || !puzzle.entries) {
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      for (const entry of puzzle.entries) {
        const answer = (entry.solution || '').toUpperCase().replace(/[^A-Z]/g, '');
        const clue = cleanClue(entry.clue || '');

        if (!answer || !clue) continue;
        if (!TARGET_LENGTHS.has(answer.length)) continue;
        // Skip cross-reference clues ("See 12", "See 5 across", etc.)
        if (/^see\s/i.test(clue)) continue;

        const existing = byAnswer.get(answer);
        if (!existing) {
          byAnswer.set(answer, { clue, count: 1 });
        } else {
          existing.count++;
          // Prefer shorter clues as they tend to be cleaner
          if (clue.length < existing.clue.length) existing.clue = clue;
        }
      }

      fetched++;
    } catch (err) {
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. ${fetched} puzzles fetched, ${failed} failed.`);
  console.log(`Unique answers found: ${byAnswer.size}`);

  // Group by length, sort by frequency descending, take top MAX_PER_LENGTH
  const byLength = {};
  for (const [answer, { clue, count }] of byAnswer) {
    const len = answer.length;
    if (!byLength[len]) byLength[len] = [];
    byLength[len].push({ answer, clue, count });
  }

  const pool = [];
  for (const len of [3, 4, 5]) {
    const entries = (byLength[len] || [])
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_PER_LENGTH);

    console.log(`Length ${len}: ${entries.length} entries (from ${(byLength[len] || []).length} unique answers)`);

    for (const { answer, clue } of entries) {
      pool.push({ id: generateId(), answer, clue });
    }
  }

  const outPath = join(__dirname, '..', 'public', 'pool.json');
  writeFileSync(outPath, JSON.stringify({ pool }, null, 2));
  console.log(`\nWrote ${pool.length} entries to ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
