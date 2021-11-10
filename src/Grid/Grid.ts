import Cell from "../Cell/Cell"
import { GRID } from "./constants"

class Grid {
  private _canvas: HTMLCanvasElement
  public _cellsMatrix: Cell[][] = []

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this._canvas = canvas
    this._createCells(ctx)
    this._drawGrid(ctx)
  }

  private _drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.strokeStyle = GRID.COLOR

    // Vertical lines
    for (let i = 0; i <= this._canvas.width; i++) {
      ctx.moveTo(i*Cell.size, 0)
      ctx.lineTo(i*Cell.size, Cell.size*this._canvas.height)
    }

    // Horizontal lines
    for (let j = 0; j <= this._canvas.height; j++) {
      ctx.moveTo(0, j*Cell.size)
      ctx.lineTo(Cell.size*this._canvas.width, j*Cell.size)
    }

    ctx.stroke()
  };

  private _createCells(ctx: CanvasRenderingContext2D) {
    let tmpCell: Cell;
    for (let i = 0; i < this._canvas.height / Cell.size; i++) {
      this._cellsMatrix.push([])
      for (let j = 0; j < this._canvas.width / Cell.size; j++) {
        tmpCell = new Cell();
        this._cellsMatrix[i].push(tmpCell)
        ctx.fillStyle = tmpCell.color
        ctx.fillRect(j*(Cell.size), i*(Cell.size), Cell.size, Cell.size)
      }
    }
    console.log('cell matrix: ', this._cellsMatrix)
  }
}

export default Grid
