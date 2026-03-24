// ── Grid rendering ─────────────────────────────────────────────────────────────
export const GRID = {
  SIZE: {
    X: 780,
    Y: 780,
  },
} as const;

export type CanvasTheme = {
  gridColor: string;
  zoomGridColor: string;
  aliveCellColor: string;
  deadCellColor: string;
  borderCellColor: string;
  outsideCellColor: string;
  previewAliveCellColor: string;
  previewEraseCellColor: string;
  zoomHighlightStrokeColor: string;
};

export const DEFAULT_CANVAS_THEME: CanvasTheme = {
  gridColor: "rgb(204, 204, 204)",
  zoomGridColor: "rgb(175, 175, 175)",
  aliveCellColor: "rgb(112, 186, 223)",
  deadCellColor: "transparent",
  borderCellColor: "rgb(204, 204, 204)",
  outsideCellColor: "transparent",
  previewAliveCellColor: "rgba(112, 186, 223, 0.75)",
  previewEraseCellColor: "rgba(204, 204, 204, 0.35)",
  zoomHighlightStrokeColor: "rgba(255,204,0,1)",
};

function readCssColorVariable(styles: CSSStyleDeclaration, variableName: string, fallback: string): string {
  return styles.getPropertyValue(variableName).trim() || fallback;
}

export function getCanvasTheme(): CanvasTheme {
  if (typeof window === "undefined") {
    return DEFAULT_CANVAS_THEME;
  }

  const styles = window.getComputedStyle(document.documentElement);

  return {
    gridColor: readCssColorVariable(styles, "--canvas-grid-color", DEFAULT_CANVAS_THEME.gridColor),
    zoomGridColor: readCssColorVariable(styles, "--canvas-zoom-grid-color", DEFAULT_CANVAS_THEME.zoomGridColor),
    aliveCellColor: readCssColorVariable(styles, "--canvas-cell-alive-color", DEFAULT_CANVAS_THEME.aliveCellColor),
    deadCellColor: readCssColorVariable(styles, "--canvas-cell-dead-color", DEFAULT_CANVAS_THEME.deadCellColor),
    borderCellColor: readCssColorVariable(styles, "--canvas-cell-border-color", DEFAULT_CANVAS_THEME.borderCellColor),
    outsideCellColor: readCssColorVariable(
      styles,
      "--canvas-cell-outside-color",
      DEFAULT_CANVAS_THEME.outsideCellColor,
    ),
    previewAliveCellColor: readCssColorVariable(
      styles,
      "--canvas-preview-alive-color",
      DEFAULT_CANVAS_THEME.previewAliveCellColor,
    ),
    previewEraseCellColor: readCssColorVariable(
      styles,
      "--canvas-preview-erase-color",
      DEFAULT_CANVAS_THEME.previewEraseCellColor,
    ),
    zoomHighlightStrokeColor: readCssColorVariable(
      styles,
      "--canvas-zoom-highlight-stroke-color",
      DEFAULT_CANVAS_THEME.zoomHighlightStrokeColor,
    ),
  };
}

export function getCanvasCellColors(theme: CanvasTheme): readonly string[] {
  return [theme.deadCellColor, theme.aliveCellColor, theme.borderCellColor, theme.outsideCellColor] as const;
}

export function getCanvasPreviewCellColors(theme: CanvasTheme): readonly string[] {
  return [
    theme.previewEraseCellColor,
    theme.previewAliveCellColor,
    theme.borderCellColor,
    theme.outsideCellColor,
  ] as const;
}

// ── Cell geometry ──────────────────────────────────────────────────────────────
/** Side length of one cell in pixels. */
export const CELL_SIZE = 5;

/** Number of columns (and rows) in the main grid. */
export const GRID_COLS = GRID.SIZE.X / CELL_SIZE; // 156
export const GRID_ROWS = GRID.SIZE.Y / CELL_SIZE; // 156

/** Physical canvas size in pixels, including the extra outer border line. */
export const CANVAS_PX_WIDTH = GRID_COLS * CELL_SIZE + 1;
export const CANVAS_PX_HEIGHT = GRID_ROWS * CELL_SIZE + 1;

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
