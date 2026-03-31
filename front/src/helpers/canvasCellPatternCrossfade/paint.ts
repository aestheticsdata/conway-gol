import { CELL_STATE } from "@cell/constants";

/**
 * Paints the grid like `Grid._render`, with an independent alive alpha per cell (0–1).
 */
export function paintCanvasGridWithPerCellAliveAlpha(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  rows: number,
  cols: number,
  cellSize: number,
  cellColors: readonly string[],
  getCell: (row: number, col: number) => number,
  getAliveAlpha: (row: number, col: number) => number,
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const aliveIdx = CELL_STATE.ALIVE;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const state = getCell(row, col);
      const x = col * cellSize + 1;
      const y = row * cellSize + 1;
      const size = cellSize - 1;
      const a = Math.max(0, Math.min(1, getAliveAlpha(row, col)));

      if (state === aliveIdx) {
        ctx.fillStyle = cellColors[CELL_STATE.DEAD];
        ctx.fillRect(x, y, size, size);
        if (a > 0) {
          ctx.globalAlpha = a;
          ctx.fillStyle = cellColors[aliveIdx];
          ctx.fillRect(x, y, size, size);
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.fillStyle = cellColors[state];
        ctx.fillRect(x, y, size, size);
      }
    }
  }
}

/**
 * Paints the grid like `Grid._render`, but multiplies opacity for **alive** cells only (uniform).
 */
export function paintCanvasGridWithAliveAlpha(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  rows: number,
  cols: number,
  cellSize: number,
  cellColors: readonly string[],
  getCell: (row: number, col: number) => number,
  aliveAlpha: number,
): void {
  const a = Math.max(0, Math.min(1, aliveAlpha));
  paintCanvasGridWithPerCellAliveAlpha(ctx, canvas, rows, cols, cellSize, cellColors, getCell, () => a);
}
