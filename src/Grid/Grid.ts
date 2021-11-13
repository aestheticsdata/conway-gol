import Cell from "../Cell/Cell"
import { GRID } from "./constants"
import Data from "../data/Data"
import { CELL_STATE } from "../Cell/constants"
import { cloneDeep } from "lodash";
import type { Mode } from "../controls/ModeSelector";

export type CellGrid = Cell[][];

class Grid {
  private _canvas: HTMLCanvasElement
  private _cellsMatrix: CellGrid = []
  public static gridSize: number

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, mode: Mode, species?: string) {
    this._canvas = canvas
    Grid.gridSize = canvas.width / Cell.size
    const data = new Data()
    if (mode === 'zoo') {
      data.factory(species ?? "glider", [10, 10])
      this._createCells(ctx, data.grid)
    }
    if (mode === 'random') {
      this._createCells(ctx)
    }
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

  private _drawCell(ctx: CanvasRenderingContext2D, cell: Cell, row: number, column: number) {
    ctx.fillStyle = cell.color
    ctx.fillRect(column*(Cell.size), row*(Cell.size), Cell.size, Cell.size)
  }

  private _createCells(ctx: CanvasRenderingContext2D, data?: CellGrid) {
    let tmpCell: Cell
    for (let i = 0; i < Grid.gridSize; i++) {
      this._cellsMatrix.push([])
      for (let j = 0; j < Grid.gridSize; j++) {
        if (data) {
          tmpCell = data[i][j]
        } else {
          tmpCell = new Cell()
        }
        this._cellsMatrix[i].push(tmpCell)
        this._drawCell(ctx, tmpCell, i, j)
      }
    }
  }

  private _getLivingNeighbourCount(row: number, column: number) {
    let count: number = 0
    const previousRowIndex = row === 0 ? (Grid.gridSize - 1) : row - 1
    const nextRowIndex = row === (Grid.gridSize - 1) ? 0 : row + 1
    const prevColumnIndex = column === 0 ? (Grid.gridSize - 1) : column - 1
    const nextColumnIndex = column === (Grid.gridSize - 1) ? 0 : column + 1

    if (this._cellsMatrix[previousRowIndex][prevColumnIndex].state === CELL_STATE.ALIVE) {
      count++
    }
    if (this._cellsMatrix[previousRowIndex][column].state === CELL_STATE.ALIVE) {
      count++
    }
    if (this._cellsMatrix[previousRowIndex][nextColumnIndex].state === CELL_STATE.ALIVE) {
      count++
    }
    if (this._cellsMatrix[row][prevColumnIndex].state === CELL_STATE.ALIVE) {
      count++
    }
    if (this._cellsMatrix[row][nextColumnIndex].state === CELL_STATE.ALIVE) {
      count++
    }
    if (this._cellsMatrix[nextRowIndex][prevColumnIndex].state === CELL_STATE.ALIVE) {
      count++
    }
    if (this._cellsMatrix[nextRowIndex][column].state === CELL_STATE.ALIVE) {
      count++
    }
    if (this._cellsMatrix[nextRowIndex][nextColumnIndex].state === CELL_STATE.ALIVE) {
      count++
    }
    return count
  }

  public processNextGeneration(ctx: CanvasRenderingContext2D) {
    let livingNeighbours = 0;
    const nextCellMatrix: Cell[][] = cloneDeep(this._cellsMatrix)

    for (let i = 0; i < Grid.gridSize; i++) {
      for (let j = 0; j < Grid.gridSize; j++) {
        livingNeighbours = this._getLivingNeighbourCount(i, j)

        if (this._cellsMatrix[i][j].state === CELL_STATE.ALIVE) {
          if (livingNeighbours < 2) {
            nextCellMatrix[i][j].state = CELL_STATE.DEAD
          }
          if (livingNeighbours === 2 || livingNeighbours === 3) {
            nextCellMatrix[i][j].state = CELL_STATE.ALIVE
          }
          if (livingNeighbours > 3) {
            nextCellMatrix[i][j].state = CELL_STATE.DEAD
          }
        } else {
          if (livingNeighbours === 3) {
            nextCellMatrix[i][j].state = CELL_STATE.ALIVE
          } else {
            nextCellMatrix[i][j].state = CELL_STATE.DEAD
          }
        }
        this._drawCell(ctx, nextCellMatrix[i][j], i, j)
      }
    }
    this._drawGrid(ctx)
    this._cellsMatrix = nextCellMatrix
  }
}

export default Grid
