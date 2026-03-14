/**
 * Hardcoded sample 5×5 puzzle for milestone 2 renderer validation.
 *
 * Grid layout (# = black cell):
 *
 *     0   1   2   3   4
 * 0 [ C ] [ R ] [ A ] [ N ] [ E ]   1-Across: CRANE
 * 1 [ R ] [#] [ G ] [#] [ V ]
 * 2 [ O ] [ L ] [ I ] [ V ] [ E ]   4-Across: OLIVE
 * 3 [ O ] [#] [ N ] [#] [ N ]
 * 4 [ N ] [ I ] [ G ] [ H ] [ T ]   5-Across: NIGHT
 *
 * 1-Down (col 0): CROON
 * 2-Down (col 2): AGING
 * 3-Down (col 4): EVENT
 *
 * Data structure contract (used by all future milestones):
 *
 * grid       — 5×5 array of { black: bool, letter: string }
 * entries    — array of { id, clueNumber, direction, row, col, answer, clue }
 *              direction: 'across' | 'down'
 *              row/col:   position of the first cell of the entry
 *              answer:    uppercase string
 */
const SAMPLE_PUZZLE = {
  grid: [
    [
      { black: false, letter: 'C' },
      { black: false, letter: 'R' },
      { black: false, letter: 'A' },
      { black: false, letter: 'N' },
      { black: false, letter: 'E' },
    ],
    [
      { black: false, letter: 'R' },
      { black: true,  letter: ''  },
      { black: false, letter: 'G' },
      { black: true,  letter: ''  },
      { black: false, letter: 'V' },
    ],
    [
      { black: false, letter: 'O' },
      { black: false, letter: 'L' },
      { black: false, letter: 'I' },
      { black: false, letter: 'V' },
      { black: false, letter: 'E' },
    ],
    [
      { black: false, letter: 'O' },
      { black: true,  letter: ''  },
      { black: false, letter: 'N' },
      { black: true,  letter: ''  },
      { black: false, letter: 'N' },
    ],
    [
      { black: false, letter: 'N' },
      { black: false, letter: 'I' },
      { black: false, letter: 'G' },
      { black: false, letter: 'H' },
      { black: false, letter: 'T' },
    ],
  ],
  entries: [
    {
      id: '1A',
      clueNumber: 1,
      direction: 'across',
      row: 0,
      col: 0,
      answer: 'CRANE',
      clue: 'Bird or heavy-lifting machine',
    },
    {
      id: '4A',
      clueNumber: 4,
      direction: 'across',
      row: 2,
      col: 0,
      answer: 'OLIVE',
      clue: 'Mediterranean fruit, or a shade of green',
    },
    {
      id: '5A',
      clueNumber: 5,
      direction: 'across',
      row: 4,
      col: 0,
      answer: 'NIGHT',
      clue: 'Time after sunset',
    },
    {
      id: '1D',
      clueNumber: 1,
      direction: 'down',
      row: 0,
      col: 0,
      answer: 'CROON',
      clue: 'Sing softly and sentimentally',
    },
    {
      id: '2D',
      clueNumber: 2,
      direction: 'down',
      row: 0,
      col: 2,
      answer: 'AGING',
      clue: 'Growing older',
    },
    {
      id: '3D',
      clueNumber: 3,
      direction: 'down',
      row: 0,
      col: 4,
      answer: 'EVENT',
      clue: 'Noteworthy occurrence',
    },
  ],
}

export default SAMPLE_PUZZLE
