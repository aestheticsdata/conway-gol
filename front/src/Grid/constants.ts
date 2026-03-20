// ── Grid rendering ─────────────────────────────────────────────────────────────
export const GRID = {
  // Grid line color. Alpha=0 keeps lines invisible on the main canvas.
  // See: https://stackoverflow.com/questions/33723384/how-to-reset-transparency-when-drawing-overlapping-content-on-html-canvas
  COLOR: 'rgba(5,36,103,0)',
  COLORZOOM: 'rgb(175,175,175)',
  SIZE: {
    X: 780,
    Y: 780,
  },
}

// ── Cell geometry ──────────────────────────────────────────────────────────────
/** Side length of one cell in pixels. */
export const CELL_SIZE = 5;

/** Number of columns (and rows) in the main grid. */
export const GRID_COLS = GRID.SIZE.X / CELL_SIZE; // 156
export const GRID_ROWS = GRID.SIZE.Y / CELL_SIZE; // 156

/** Fraction of cells seeded as ALIVE on random initialisation (~18%). */
export const INITIAL_DENSITY = 0.18;

// ── Zoom box ───────────────────────────────────────────────────────────────────
/** Pixel magnification factor applied inside the zoom canvas. */
export const ZOOM_LEVEL = 4;

/** Radius (in cells) of the neighbourhood shown around the cursor. */
export const ZOOM_RADIUS = 3;

/** Side length of the zoom area in cells (2*radius + 1 = 7). */
export const ZOOM_SIZE = ZOOM_RADIUS * 2 + 1;

/** Pixel dimension of the zoom canvas. */
export const ZOOM_CANVAS_PX = 140;

/** Grid coordinates of the center cell inside the zoom area. */
export const ZOOM_CENTER = { x: ZOOM_RADIUS, y: ZOOM_RADIUS };

// ── Color lookup ───────────────────────────────────────────────────────────────
/**
 * Maps a cell state integer to its CSS color string.
 * Index matches CELL_STATE values: 0=DEAD, 1=ALIVE, 2=BORDER, 3=OUTSIDE.
 *
 * Centralised here so colors are defined once and the renderer never
 * needs to instantiate Cell objects or run a switch statement.
 */
export const CELL_COLORS: readonly string[] = [
  'rgb(255, 255, 255)', // 0 — DEAD
  'rgb(0,105,159)',     // 1 — ALIVE
  'rgb(204, 204, 204)', // 2 — BORDER (ZoomBox only)
  'rgb(255, 255, 255)', // 3 — OUTSIDE (same as DEAD, ZoomBox only)
];
