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
  {
    /**
     * Donut: hollow 3×3 centre, leaving only the outer frame playable.
     *
     *   W W W W W
     *   W # # # W
     *   W # # # W
     *   W # # # W
     *   W W W W W
     */
    name: 'donut',
    blackCells: [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3]],
  },
  {
    /**
     * Steps: diagonal black cells creating a staircase feel.
     *
     *   # W W W W
     *   W W W W W
     *   W W # W W
     *   W W W W W
     *   W W W W #
     */
    name: 'steps',
    blackCells: [[0, 0], [2, 2], [4, 4]],
  },
  {
    /**
     * H-Shape: black cells inset from corners, creating an H-like silhouette.
     *
     *   W # W # W
     *   W W W W W
     *   W W W W W
     *   W W W W W
     *   W # W # W
     */
    name: 'h-shape',
    blackCells: [[0, 1], [0, 3], [4, 1], [4, 3]],
  },
  {
    /**
     * Pillar: vertical divider with a gap in the centre row.
     *
     *   W W # W W
     *   W W # W W
     *   W W W W W
     *   W W # W W
     *   W W # W W
     */
    name: 'pillar',
    blackCells: [[0, 2], [1, 2], [3, 2], [4, 2]],
  },
  {
    /**
     * Stripe: two black cells on the middle row edges, very open grid.
     *
     *   W W W W W
     *   W W W W W
     *   # W W W #
     *   W W W W W
     *   W W W W W
     */
    name: 'stripe',
    blackCells: [[2, 0], [2, 4]],
  },
  {
    /**
     * Slash: opposite corners blocked, producing 4-letter words on the top/bottom
     * rows and left/right columns with 5-letter words elsewhere.
     *
     *   W W W W #
     *   W W W W W
     *   W W W W W
     *   W W W W W
     *   # W W W W
     */
    name: 'slash',
    blackCells: [[0, 4], [4, 0]],
  },
]
