/**
 * Grid pattern definitions for the 5×5 crossword.
 *
 * Each pattern is { name, blackCells: [[row, col], ...] }.
 * Black cells are listed by [row, col]. All other cells are white.
 *
 * The solver derives word slots (across + down) and their intersections
 * automatically from the black cell positions.
 */

export const PATTERNS = [
  {
    /**
     * Classic: three full 5-letter across rows and three 5-letter down columns.
     *
     *   W W W W W
     *   W # W # W
     *   W W W W W
     *   W # W # W
     *   W W W W W
     */
    name: 'classic',
    blackCells: [[1, 1], [1, 3], [3, 1], [3, 3]],
  },
  {
    /**
     * Diamond: corners blocked, producing 3-letter words along the top/bottom
     * and left/right edges and 5-letter words through the centre.
     *
     *   # W W W #
     *   W W W W W
     *   W W W W W
     *   W W W W W
     *   # W W W #
     */
    name: 'diamond',
    blackCells: [[0, 0], [0, 4], [4, 0], [4, 4]],
  },
  {
    /**
     * Checker: outer column mid-cells blocked, producing 3-letter words in
     * the middle rows and keeping full 5-letter words elsewhere.
     *
     *   W W W W W
     *   # W W W #
     *   W W W W W
     *   # W W W #
     *   W W W W W
     */
    name: 'checker',
    blackCells: [[1, 0], [1, 4], [3, 0], [3, 4]],
  },
]
