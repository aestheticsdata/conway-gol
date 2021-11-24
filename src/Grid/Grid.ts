import Cell from "../Cell/Cell"
import Data from "../data/Data"
import { CELL_STATE } from "../Cell/constants"
import { cloneDeep } from "lodash";
import type { Mode } from "../controls/ModeSelector";
import DrawingToolBox, {DrawingMode} from "../controls/DrawingToolBox";
import Helpers from "../helpers/Helpers";
import ZoomBox from "./zoom/ZoomBox";

export type CellGrid = Cell[][];

class Grid {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;
  private readonly _drawingCanvas: HTMLCanvasElement;
  private readonly _drawingContext: CanvasRenderingContext2D;
  private _cellsMatrix: CellGrid = [];
  private _mode: Mode;
  public static gridSize: number;
  private _previousCellPos;
  private _isDown: boolean = false;
  private _drawingMode: DrawingMode;
  public zoombox: ZoomBox;

  constructor(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mode: Mode,
    species?: string,
    drawingContext?:CanvasRenderingContext2D,
    drawingCanvas?: HTMLCanvasElement,
    drawingToolbox?: DrawingToolBox,
  ) {
    this._canvas = canvas;
    this._ctx = ctx;
    this._drawingCanvas = drawingCanvas;
    this._drawingContext = drawingContext;
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
      drawingToolbox.register(this._setDrawingMode);
      this._drawingMode = drawingToolbox.selectedMode;
      this._createCells(ctx, null, true);
      this._drawGrid(ctx);
    }
  }

  // https://stackoverflow.com/a/56775919/5671836 //////////////////////
  public initListener() {
    if (this._drawingCanvas) {
      this._drawingCanvas.addEventListener("mousemove", this._drawOnMouseMove);
      this._drawingCanvas.addEventListener("mousedown", this._mouseDown);
      this._drawingCanvas.addEventListener("mouseup", this._mouseUp);
    }
  }
  public destroyListener() {
    if (this._drawingCanvas) {
      this._drawingCanvas.removeEventListener("mousemove", this._drawOnMouseMove);
      this._drawingCanvas.removeEventListener("mousedown", this._mouseDown);
      this._drawingCanvas.removeEventListener("mouseup", this._mouseUp);
    }
  }
  // ////////////////////////////////////////////////////////////////////

  private _setDrawingMode = (drawingMode: DrawingMode) => {
    this._drawingMode = drawingMode;
  }

  private _drawOnMouseMove = (e) => {
    const res = this._getCell(e.offsetX, e.offsetY);
    const cell = new Cell(this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD);

    if (res) {
      this.zoombox.displayArea(this._getZoomArea(res.xPos, res.yPos), res.xPos, res.yPos);
      // first draw, previous cell is null and must be initialized after the first draw
      if (!this._previousCellPos) {
        this._drawCell(this._drawingContext, cell, res.yPos, res.xPos);
        this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
      } else {
        this._drawCell(this._drawingContext, cell, res.yPos, res.xPos);
        // e.offsetX and e.offsetY are changing at each mouse move but xPos and yPos are
        // computed with the Cell.size modulo
        // so we must check that the previous xPos or previous yPos are different than the
        // current xPos and yPos
        // if this check is not executed, the cell is written as DEAD event if we are still in this cell
        if (this._previousCellPos.xPos !== res.xPos || this._previousCellPos.yPos !== res.yPos) {
          if (this._isDown) {
            this._drawSingleCell(e);
            this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
          } else {
            this._drawingContext.clearRect(0, 0, this._drawingCanvas.width, this._drawingCanvas.height);
            this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
          }
        }
      }
    }
  }

  private _getCell(x: number, y:number) {
    if (x>0 && y>0) {
      const xPos = (Math.floor(x/Cell.size) - 1);
      const yPos = (Math.floor(y/Cell.size) - 1);
      return { xPos, yPos };
    }
  };

  private _getZoomArea(x: number, y: number) {
    // TODO do not hardcode values
    let tmpCell;
    if (x>=0 && y>=0 && x<=155 && y<=155) {
      const copyMatrix = [];
      for (let i=0; i<7; i++) {
        copyMatrix.push([]);
        for (let j=0; j<7; j++) {
          if ((i+y-3 < 0) || (i+y-3 > 155) || !this._cellsMatrix[i+y-3][j+x-3]) {
            tmpCell = new Cell(CELL_STATE.BORDER);
          } else {
            tmpCell = new Cell(this._cellsMatrix[i+y-3][j+x-3].state);
          }
          // each cell is copied from this._cellMatrix, it's not the ref to the cell
          copyMatrix[i].push(tmpCell);
        }
      }
      return copyMatrix;
    } else {
      return [[new Cell(CELL_STATE.OUTSIDE)]];
    }
  }

  private _mouseDown = (e) => {
    this._isDown = true;
    this._drawSingleCell(e);
    const res = this._getCell(e.offsetX, e.offsetY);
    if (res) {
      this.zoombox.displayArea(this._getZoomArea(res.xPos, res.yPos));
    }
  }

  private _mouseUp = () => {
    this._isDown = false;
  }

  private _drawSingleCell = (e) => {
    const {xPos, yPos} = this._getCell(e.offsetX, e.offsetY);
    const cell: Cell = this._cellsMatrix[yPos][xPos];
    cell.state = this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    this._drawCell(this._ctx, cell, yPos, xPos);
  }

  private _drawGrid(ctx: CanvasRenderingContext2D) {
    Helpers.drawGrid(ctx, this._canvas)
  };

  private _drawCell(ctx: CanvasRenderingContext2D, cell: Cell, row: number, column: number) {
    ctx.fillStyle = cell.color;
    ctx.fillRect(column*(Cell.size)+1, row*(Cell.size)+1, Cell.size-1, Cell.size-1);
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
