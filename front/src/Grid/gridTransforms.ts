import { GRID_COLS, GRID_ROWS } from "./constants";

/**
 * Apply rotation and zoom to a cell grid in a single inverse-mapping pass.
 *
 * - `angleDeg`: clockwise rotation in degrees (screen coordinates).
 * - `zoomLevel`: linear slider value; scale = 2^(zoomLevel / 50).
 *     0  → ×1.00 (no zoom)
 *    50  → ×2.00 (zoom in)
 *   -50  → ×0.50 (zoom out)
 *
 * Returns a new grid — the original is never mutated.
 * Returns the original reference unchanged when both transforms are identity.
 */
export function transformGrid(baseGrid: number[][], angleDeg: number, zoomLevel: number): number[][] {
  if (angleDeg === 0 && zoomLevel === 0) return baseGrid;

  const rows = GRID_ROWS;
  const cols = GRID_COLS;
  const scale = 2 ** (zoomLevel / 50);
  const angleRad = (angleDeg * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const cy = (rows - 1) / 2;
  const cx = (cols - 1) / 2;

  const result: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Inverse zoom: shrink the offset toward the centre
      const dx = (col - cx) / scale;
      const dy = (row - cy) / scale;
      // Inverse rotation
      const srcCol = Math.round(cx + dx * cosA + dy * sinA);
      const srcRow = Math.round(cy - dx * sinA + dy * cosA);
      if (srcRow >= 0 && srcRow < rows && srcCol >= 0 && srcCol < cols) {
        result[row][col] = baseGrid[srcRow][srcCol];
      }
    }
  }

  return result;
}
