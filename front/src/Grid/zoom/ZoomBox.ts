import Helpers from "../../helpers/Helpers";
import { GRID } from "../constants";
import Cell from "../../Cell/Cell";
import { CELL_STATE } from "../../Cell/constants";
import { CellGrid } from "../Grid";
import {DrawingMode} from "../../controls/DrawingToolBox";

class ZoomBox {
  private _html = `
    <div class="zoombox" style="display: none">
      <canvas id="zoombox"></canvas>
      <div class="coordinates">
        <span class="x-pos-label">X: </span><span class="x-pos">0</span>
        <span class="y-pos-label">Y: </span><span class="y-pos">0</span>
      </div>
    </div>
  `;
  private _zoombox: HTMLElement;
  private readonly _zoomCanvas: HTMLCanvasElement;
  private readonly _zoomContext: CanvasRenderingContext2D;
  private _cellsMatrix: CellGrid = [];
  public static gridSize: number;
  private _zoomLevel: number = 4;
  private _xPosDisplay;
  private _yPosDisplay;
  // TODO remove hardcoded _gridCenterCell
  private _gridCenterCell = {x: 3, y: 3};

  constructor() {
    document.querySelector(".zoombox-container").insertAdjacentHTML("afterbegin", this._html);
    this._zoombox = document.querySelector(".zoombox");
    this._zoomCanvas = <HTMLCanvasElement>this._zoombox.children[0];
    this._zoomCanvas.width = 140;
    this._zoomCanvas.height = 140;
    this._zoomContext = this._zoomCanvas.getContext("2d");
    ZoomBox.gridSize = this._zoomCanvas.width / (Cell.size*this._zoomLevel);
    this._createCells("pencil", this._zoomContext, null, true);
    this._drawGrid(this._zoomContext);
    this._xPosDisplay = document.querySelector('.x-pos');
    this._yPosDisplay = document.querySelector('.y-pos');
  }

  public show() {
    this._zoombox.style.display = "block";
  }

  public hide() {
    this._zoombox.style.display = "none";
  }

  public displayArea(area, drawingMode: DrawingMode, x=0, y=0) {
    if (area) {
      this._createCells(drawingMode, this._zoomContext, area);
      this._xPosDisplay.textContent = x;
      this._yPosDisplay.textContent = y;
    }
  }

  private _drawCell(drawingMode: DrawingMode, ctx: CanvasRenderingContext2D, cell: Cell, row: number, column: number) {
    if (cell.state === CELL_STATE.OUTSIDE) {
      // this._cellsMAtric[3][3] is the center cell in the zoom grid
      if (this._cellsMatrix[this._gridCenterCell.y][this._gridCenterCell.x].state === CELL_STATE.ALIVE) {
        this._zoomContext.fillStyle = CELL_STATE.ALIVE_COLOR;
      } else {
        this._zoomContext.fillStyle = CELL_STATE.DEAD_COLOR;
      }
      this._zoomContext.fillRect(this._gridCenterCell.x*(Cell.size*this._zoomLevel)+1, this._gridCenterCell.y*(Cell.size*this._zoomLevel)+1, (Cell.size*this._zoomLevel)-1, (Cell.size*this._zoomLevel)-1);
    } else {
      this._zoomContext.fillStyle = cell.color;
      this._zoomContext.fillRect(
        column*(Cell.size*this._zoomLevel)+1,
        row*(Cell.size*this._zoomLevel)+1,
        (Cell.size*this._zoomLevel)-1,
        (Cell.size*this._zoomLevel)-1
      );
      // blue cell at the center of the zoom grid
      // TODO do not hardcode the center of the grid
      this._zoomContext.fillStyle = drawingMode === "pencil" ? CELL_STATE.ALIVE_COLOR : CELL_STATE.DEAD_COLOR;
      this._zoomContext.fillRect(this._gridCenterCell.x*(Cell.size*this._zoomLevel)+1, this._gridCenterCell.y*(Cell.size*this._zoomLevel)+1, (Cell.size*this._zoomLevel)-1, (Cell.size*this._zoomLevel)-1);
      this._zoomContext.strokeStyle = 'rgba(255,204,0,1)';
      this._zoomContext.strokeRect(this._gridCenterCell.x*(Cell.size*this._zoomLevel), this._gridCenterCell.y*(Cell.size*this._zoomLevel), (Cell.size*this._zoomLevel)+1, (Cell.size*this._zoomLevel)+1)
    }
  }

  private _createCells(drawingMode: DrawingMode, ctx: CanvasRenderingContext2D, data?: CellGrid, isBlank: boolean = false) {
    if (data && data[0][0].state === CELL_STATE.OUTSIDE) {
      this._drawCell(drawingMode, ctx, data[0][0], -1, -1);
    } else {
      let tmpCell: Cell;
      // flush this._cellMatrix at each mousemove to prevent to grow undefinitey in size
      if (this._cellsMatrix.length > 0) this._cellsMatrix = [];
      for (let i = 0; i < ZoomBox.gridSize; i++) {
        this._cellsMatrix.push([]);
        for (let j = 0; j < ZoomBox.gridSize; j++) {
          if (data) {
            tmpCell = data[i][j];
          } else if (isBlank) {
            tmpCell = new Cell(CELL_STATE.DEAD);
          } else {
            tmpCell = new Cell();
          }
          this._cellsMatrix[i].push(tmpCell);
          this._drawCell(drawingMode, ctx, tmpCell, i, j);
        }
      }
    }
  }

  private _drawGrid(ctx: CanvasRenderingContext2D) {
    Helpers.drawGrid(ctx, this._zoomCanvas, this._zoomLevel, GRID.COLORZOOM);
  };
}

export default ZoomBox;

