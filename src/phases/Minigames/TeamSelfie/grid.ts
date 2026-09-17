// Pure layout maths for the closing selfie gallery (HLN-018).
//
// No React, no DOM — the geometry is the part worth testing, so it lives here
// and is exercised by checks/phases/minigames/team_selfie.selfcheck.ts.
//
// The 5-photo arrangement is lifted verbatim from the "Gallery - Central
// Screen" Figma frame (node 944:2441): a 4×2 unit grid where one unit is
// 426×326 with 20px gutters, tiled as
//
//   ┌────┬────┬────────┐
//   │    │ B  │   C    │
//   │ A  ├────┼────┬───┤
//   │    │   D    │ E │
//   └────┴────────┴───┘
//
// Anything other than 5 photos falls back to a uniform grid — the bento is a
// designed composition for exactly five faces, and stretching it to 3 or 7
// reads as broken rather than intentional. (Product answer Q3: bento for 5,
// uniform otherwise, rotate when there are more teams than slots.)

export interface Tile {
  /** Zero-based column of the tile's left edge. */
  col: number
  /** Zero-based row of the tile's top edge. */
  row: number
  colSpan: number
  rowSpan: number
}

export interface Layout {
  cols: number
  rows: number
  tiles: Tile[]
}

/** How many photos the bento composition holds. */
export const BENTO_CAPACITY = 5

export const BENTO_5: Layout = {
  cols: 4,
  rows: 2,
  tiles: [
    { col: 0, row: 0, colSpan: 1, rowSpan: 2 }, // A — tall left column
    { col: 1, row: 0, colSpan: 1, rowSpan: 1 }, // B — top of column 2
    { col: 2, row: 0, colSpan: 2, rowSpan: 1 }, // C — wide top right
    { col: 1, row: 1, colSpan: 2, rowSpan: 1 }, // D — wide bottom middle
    { col: 3, row: 1, colSpan: 1, rowSpan: 1 }, // E — bottom right
  ],
}

/** Uniform `cols` × `rows` grid, filled row-major, ignoring surplus cells. */
export function uniformLayout(count: number, cols: number, rows: number): Layout {
  const safeCols = Math.max(1, Math.floor(cols))
  const safeRows = Math.max(1, Math.floor(rows))
  const tiles: Tile[] = []
  for (let i = 0; i < count; i++) {
    tiles.push({ col: i % safeCols, row: Math.floor(i / safeCols), colSpan: 1, rowSpan: 1 })
  }
  return { cols: safeCols, rows: safeRows, tiles }
}

/**
 * Best-looking arrangement for `count` photos.
 *
 * Every branch returns exactly `count` tiles (never fewer), so a caller that
 * forgets to paginate still renders every photo rather than silently dropping
 * the overflow.
 */
export function layoutForCount(count: number): Layout {
  if (count <= 0) return { cols: 1, rows: 1, tiles: [] }
  if (count === 5) return BENTO_5
  if (count === 1) return uniformLayout(count, 1, 1)
  if (count === 2) return uniformLayout(count, 2, 1)
  if (count === 3) return uniformLayout(count, 3, 1)
  if (count === 4) return uniformLayout(count, 2, 2)
  // > 5: the caller should have paginated. Degrade to the squarish grid that
  // wastes the least space rather than reusing the 5-photo bento for 6+.
  const cols = Math.max(3, Math.ceil(Math.sqrt(count)))
  return uniformLayout(count, cols, Math.ceil(count / cols))
}

/**
 * Split into pages of at most `capacity`, preserving order.
 *
 * Always returns at least one page (possibly empty) so the caller can render
 * the first-run placeholder without special-casing it.
 */
export function paginate<T>(items: T[], capacity: number): T[][] {
  const size = Math.max(1, Math.floor(capacity))
  if (items.length === 0) return [[]]
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size))
  return pages
}

/**
 * Which page to show at `tick`, wrapping around. Central rotates through the
 * pages so every team is on screen for a while even when there are more teams
 * than slots.
 */
export function pageForTick(tick: number, pageCount: number): number {
  if (pageCount <= 1) return 0
  const safeTick = Number.isFinite(tick) ? Math.floor(tick) : 0
  // Guard the modulo for negative ticks (%-1 keeps the sign in JS).
  return ((safeTick % pageCount) + pageCount) % pageCount
}
