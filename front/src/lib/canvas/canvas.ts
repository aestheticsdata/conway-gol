import { CELL_SIZE } from "@grid/constants";

interface DrawGridParams {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  zoom?: number;
  color?: string;
}

export function drawGrid({ ctx, canvas, zoom = 1, color = "transparent" }: DrawGridParams): void {
  const step = CELL_SIZE * zoom;
  const columns = Math.floor(canvas.width / step);
  const rows = Math.floor(canvas.height / step);

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  for (let i = 1; i < columns; i++) {
    const x = i * step + 0.5;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }

  for (let j = 1; j < rows; j++) {
    const y = j * step + 0.5;
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }

  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, 1);
  ctx.fillRect(0, 0, 1, canvas.height);
  ctx.fillRect(0, canvas.height - 1, canvas.width, 1);
  ctx.fillRect(canvas.width - 1, 0, 1, canvas.height);
  ctx.restore();
}
