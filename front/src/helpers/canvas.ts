import { GRID, CELL_SIZE } from "@grid/constants";

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  zoom = 1,
  color?: string,
): void {
  ctx.beginPath();
  ctx.strokeStyle = color ?? GRID.COLOR;

  for (let i = 0; i <= canvas.width; i++) {
    ctx.moveTo(i * CELL_SIZE * zoom, 0);
    ctx.lineTo(i * CELL_SIZE * zoom, CELL_SIZE * zoom * canvas.height);
  }

  for (let j = 0; j <= canvas.height; j++) {
    ctx.moveTo(0, j * CELL_SIZE * zoom);
    ctx.lineTo(CELL_SIZE * zoom * canvas.width, j * zoom * CELL_SIZE);
  }

  ctx.stroke();
}
