import Cell from "../Cell/Cell"
import { GRID } from "./constants"
import Data from "../data/Data"
import { CELL_STATE } from "../Cell/constants"
import { cloneDeep } from "lodash";
import type { Mode } from "../controls/ModeSelector";

export type CellGrid = Cell[][];

class Grid {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;
  private _cellsMatrix: CellGrid = [];
  private _mode: Mode;
  public static gridSize: number;
  private _previousCellPos;

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, mode: Mode, species?: string) {
    this._canvas = canvas;
    this._ctx = ctx;
    Grid.gridSize = canvas.width / Cell.size;
    this._mode = mode;
    const data = new Data();

    if (mode === 'random') {
      this._createCells(ctx);
      this._drawGrid(ctx);
    }
    if (mode === 'zoo') {
      data.factory(species ?? "canadagoose", [10, 10]).then(() => {
        this._createCells(ctx, data.grid);
        this._drawGrid(ctx);
      })
    }
    if (mode === 'drawing') {
      this._createCells(ctx, null, true);
      this._drawGrid(ctx);
    }
  }

  // https://stackoverflow.com/a/56775919/5671836 //////////////////////
  public initListener() {
    this._canvas.addEventListener("mousemove", this._drawOnMouseMove);
  }
  public destroyListener() {
    this._canvas.removeEventListener("mousemove", this._drawOnMouseMove);
  }
  // ////////////////////////////////////////////////////////////////////

  private _drawOnMouseMove = (e) => {
    const res = this._getCell(e.offsetX, e.offsetY);

    if (res?.cell) {
      // first draw, previous cell is null and must be initialized after the first draw
      if (!this._previousCellPos) {
        this._drawCell(this._ctx, res.cell, res.yPos, res.xPos);
        this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
      } else {
        this._drawCell(this._ctx, res.cell, res.yPos, res.xPos);
        // e.offsetX and e.offsetY are changing at each mouse move but xPos and yPos are
        // computed with the Cell.size modulo
        // so we must check that the previous xPos or previous yPos are different than the
        // current xPos and yPos
        // if this check is not executed, the cell is written as DEAD event if we are still in this cell
        if (this._previousCellPos.xPos !== res.xPos || this._previousCellPos.yPos !== res.yPos) {
          const previousCell = this._cellsMatrix[this._previousCellPos.yPos][this._previousCellPos.xPos];
          previousCell.state = CELL_STATE.DEAD;
          this._drawCell(this._ctx, previousCell, this._previousCellPos.yPos, this._previousCellPos.xPos);
          this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
          // this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
          this._drawGrid(this._ctx);
        }
      }
    }
  }

  private _getCell(x: number, y:number) {
    if (x>0 && y>0) {
      const xPos = (Math.ceil(x/Cell.size) - 1);
      const yPos = (Math.ceil(y/Cell.size) - 1);
      let cell: Cell = this._cellsMatrix[yPos][xPos];
      cell.state = CELL_STATE.ALIVE;

      return { cell, xPos, yPos };
    }
  }

  private _drawGrid(ctx: CanvasRenderingContext2D, clear?: boolean) {
    ctx.beginPath();
    ctx.strokeStyle = GRID.COLOR;

    // Vertical lines
    for (let i = 0; i <= this._canvas.width; i++) {
      ctx.moveTo(i*Cell.size, 0);
      ctx.lineTo(i*Cell.size, Cell.size*this._canvas.height);
    }

    // Horizontal lines
    for (let j = 0; j <= this._canvas.height; j++) {
      ctx.moveTo(0, j*Cell.size);
      ctx.lineTo(Cell.size*this._canvas.width, j*Cell.size);
    }

    ctx.stroke();
  };

  private _drawCell(ctx: CanvasRenderingContext2D, cell: Cell, row: number, column: number) {
    ctx.fillStyle = cell.color;
    ctx.fillRect(column*(Cell.size), row*(Cell.size), Cell.size, Cell.size);
  }

  private _createCells(ctx: CanvasRenderingContext2D, data?: CellGrid, isBlank: boolean = false) {
    let tmpCell: Cell;
    for (let i = 0; i < Grid.gridSize; i++) {
      this._cellsMatrix.push([]);
      for (let j = 0; j < Grid.gridSize; j++) {
        if (data) {
          tmpCell = data[i][j];
        } else if (isBlank) {
          tmpCell = new Cell(CELL_STATE.DEAD);
        } else {
          tmpCell = new Cell();
        }
        this._cellsMatrix[i].push(tmpCell);
        this._drawCell(ctx, tmpCell, i, j);
      }
    }
  }

  private _getLivingNeighbourCount(row: number, column: number) {
    let count: number = 0;
    const previousRowIndex = row === 0 ? (Grid.gridSize - 1) : row - 1;
    const nextRowIndex = row === (Grid.gridSize - 1) ? 0 : row + 1;
    const prevColumnIndex = column === 0 ? (Grid.gridSize - 1) : column - 1;
    const nextColumnIndex = column === (Grid.gridSize - 1) ? 0 : column + 1;

    if (this._cellsMatrix[previousRowIndex][prevColumnIndex].state === CELL_STATE.ALIVE) {
      count++;
    }
    if (this._cellsMatrix[previousRowIndex][column].state === CELL_STATE.ALIVE) {
      count++;
    }
    if (this._cellsMatrix[previousRowIndex][nextColumnIndex].state === CELL_STATE.ALIVE) {
      count++;
    }
    if (this._cellsMatrix[row][prevColumnIndex].state === CELL_STATE.ALIVE) {
      count++;
    }
    if (this._cellsMatrix[row][nextColumnIndex].state === CELL_STATE.ALIVE) {
      count++;
    }
    if (this._cellsMatrix[nextRowIndex][prevColumnIndex].state === CELL_STATE.ALIVE) {
      count++;
    }
    if (this._cellsMatrix[nextRowIndex][column].state === CELL_STATE.ALIVE) {
      count++;
    }
    if (this._cellsMatrix[nextRowIndex][nextColumnIndex].state === CELL_STATE.ALIVE) {
      count++;
    }
    return count;
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
