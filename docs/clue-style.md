# Crossword Clue Style Guide

Conventions for writing and editing clues in the puzzle pools (`public/pool*.json`).
Each pool entry is `{ id, answer, clue }`, where `answer` is 2–5 uppercase letters
(enforced by `scripts/validate-pools.js`) and `clue` is a non-empty string.

This project ships two clue styles — **Guardian Quick** (`pool.json`) and **NYT Mini**
(`pool-nyt-mini.json`) — so the universal rules below apply everywhere, with
style-specific notes after.

---

## The cardinal rule: substitutability

A clue must be able to stand in for the answer. This single principle drives almost
every other rule:

- **Part of speech must match.** `RAN` → "Sprinted" (verb), not "Sprint" (noun).
- **Tense must match.** `BAKED` → "Cooked in the oven", not "Bake".
- **Number must match.** Plural answer → plural clue. `CATS` → "Feline pets". A trailing
  "s" is a giveaway, so strong setters hide it: `OXEN` → "Plow team".
- **Register must match.** A slang answer takes a slangy clue; a formal answer, a formal one.

---

## Universal conventions

| Rule | Why / Example |
|------|---------------|
| **Never put the answer (or its root) in the clue** | No "crane" or "craning" anywhere in a clue for `CRANE`. Avoid obvious derivatives too. |
| **`?` signals wordplay, a pun, or a stretch** | `BANK` → "Place to make a deposit?" The mark warns the solver not to read it literally. |
| **Abbreviated answer → signalled in the clue** | `MON` → "Day of the wk. (abbr.)" or "Wkday." The clue's own abbreviation or "for short" / "briefly" flags it. |
| **`___` blanks for set phrases** | `IOTA` → "Not one ___". Fast and friendly; very common in minis. |
| **Flag foreign-language answers** | `EAU` → "Water, in France" or "Cannes water". Name the language or use a locale. |
| **Proper nouns are fair when clued as such** | But capitalization is *not* a reliable hint — every clue starts capitalized, a classic misdirection. |
| **Read as natural English (surface reading)** | The clue should make sense on its own, even when it misleads. |
| **One clear, defensible answer** | Especially important here: in a 5×5 with crossing constraints, an ambiguous clue plus a crossing letter can make the puzzle unsolvable or unfair. |
| **Mark unusual forms** | `Var.` for a variant spelling, `Abbr.` / "for short" for shortenings — so the solver trusts an odd-looking answer. |

---

## Guardian Quick style — `pool.json`

- A terse **synonym or short definition**, often one or two words: `CRANE` → "Lifting machine".
- **British** spelling and idiom (`COLOUR`, `LIFT` for elevator, `PETROL`).
- Generally **no puns and no `?`** — these are "quick" clues, meant to be read straight.
  Multiple valid synonyms are accepted as fair.

---

## NYT Mini style — `pool-nyt-mini.json`

- **Conversational, often punny**, leaning on pop culture, food, and everyday life:
  `OREO` → "Cookie often twisted apart".
- Heavy use of `___` fill-in-the-blanks and `?` wordplay clues.
- **American** spelling and references.
- Short and breezy — a mini prizes a clever, accessible angle over a dry definition.

---

## Cryptic clues (reference only)

Full cryptic conventions are **out of scope** for this quick/mini app, but for completeness
(the "standard rules" of Ximenean fair play):

- Every cryptic clue = **definition + wordplay**, with the definition at the **start or end**
  of the clue — never the middle.
- Common wordplay devices: anagrams (signalled by "mixed", "broken", "wild"…), hidden words,
  charades, containers, reversals, homophones ("we hear"), and deletions.
- **Fairness:** the answer must be reachable two independent ways (definition *and* wordplay),
  and every word in the clue must do a job.

---

## When populating a pool

- Keep answers to **2–5 uppercase letters** (A–Z only) — anything else fails validation.
- Aim for clues that are unambiguous on their own, since the solver relies on crossings.
- Match the pool's house style (Guardian Quick vs NYT Mini) so a generated puzzle reads
  consistently.
- Run `npm run validate-pools` after editing to catch format and uniqueness errors.
