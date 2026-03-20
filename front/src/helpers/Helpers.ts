import { GRID } from "../Grid/constants";
import { CELL_SIZE } from "../Grid/constants";

class Helpers {
  public static getRequestURL = (url: string) =>
    window.location.pathname.search('conway-gol') !== -1
      ? `https://1991computer.com/conway-gol/api/${url}`
      : `http://localhost:5030/${url}`;

  public static drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, zoom = 1, color?: string) => {
    ctx.beginPath();
    ctx.strokeStyle = color ?? GRID.COLOR;

    // Vertical lines
    for (let i = 0; i <= canvas.width; i++) {
      ctx.moveTo(i * CELL_SIZE * zoom, 0);
      ctx.lineTo(i * CELL_SIZE * zoom, CELL_SIZE * zoom * canvas.height);
    }

    // Horizontal lines
    for (let j = 0; j <= canvas.height; j++) {
      ctx.moveTo(0, j * CELL_SIZE * zoom);
      ctx.lineTo(CELL_SIZE * zoom * canvas.width, j * zoom * CELL_SIZE);
    }

    ctx.stroke();
  }
}

export default Helpers;
