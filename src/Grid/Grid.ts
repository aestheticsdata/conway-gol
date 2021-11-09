import Cell from "../Cell/Cell"
import { GRID } from "./constants"

class Grid {
  private _canvas: HTMLCanvasElement
  public _cellsMatrix: Cell[][] = []

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this._canvas = canvas
    this._drawGrid(ctx)
    this._createCells()
  }

  private _drawGrid(ctx) {
    ctx.fillStyle = 'rgb(177,231,95)'
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)
    ctx.beginPath()
    ctx.strokeStyle = GRID.COLOR

    // Vertical lines
    for (let i = 0; i <= this._canvas.width; i++) {
      ctx.moveTo(i * (Cell.size), 0)
      ctx.lineTo(i * (Cell.size), (Cell.size + 1) * this._canvas.height + 1)
    }

    // Horizontal lines
    for (let j = 0; j <= this._canvas.height; j++) {
      ctx.moveTo(0, j * (Cell.size))
      ctx.lineTo((Cell.size) * this._canvas.width, j * (Cell.size + 1) + 1)
    }

    ctx.stroke();
  };

  private _createCells() {
    let tmpCell;
    for (let i = 0; i < this._canvas.height / Cell.size; i++) {
      this._cellsMatrix.push([])
      for (let j = 0; j < this._canvas.width / Cell.size; j++) {
        tmpCell = new Cell();
        this._cellsMatrix[i].push(tmpCell)

      }
    }
    console.log('cell matrix: ', this._cellsMatrix)
  }
}

export default Grid
