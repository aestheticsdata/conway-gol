import { GRID } from "../Grid/constants";
import Cell from "../Cell/Cell";

class Helpers {
  public static getRequestURL = (url: string) => window.location.pathname.search('conway-gol') !== -1 ? `https://1991computer.com/conway-gol/api/${url}` : `http://localhost:5030/${url}`;
  public static drawGrid = (ctx, canvas, zoom=1, color?) => {
    ctx.beginPath();
    ctx.strokeStyle = color ?? GRID.COLOR;

    // Vertical lines
    for (let i = 0; i <= canvas.width; i++) {
      ctx.moveTo(i*Cell.size*zoom, 0);
      ctx.lineTo(i*Cell.size*zoom, Cell.size*zoom*canvas.height);
    }

    // Horizontal lines
    for (let j = 0; j <= canvas.height; j++) {
      ctx.moveTo(0, j*Cell.size*zoom);
      ctx.lineTo(Cell.size*zoom*canvas.width, j*zoom*Cell.size);
    }

    ctx.stroke();
  }
}

export default Helpers;
