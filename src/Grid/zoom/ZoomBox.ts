import Helpers from "../../helpers/Helpers";
import { GRID } from "../constants";
import Cell from "../../Cell/Cell";
import { CELL_STATE } from "../../Cell/constants";
import { CellGrid } from "../Grid";

class ZoomBox {
  private _html = `
    <div class="zoombox" style="display: none">
      <canvas id="zoombox"></canvas>
    </div>
  `;
  private _zoombox: HTMLElement;
  private _zoomCanvas: HTMLCanvasElement;
  private _zoomContext: CanvasRenderingContext2D;
  private _cellsMatrix: CellGrid = [];
  public static gridSize: number;
  private _zoomLevel: number = 4;

  constructor() {
    document.querySelector(".zoombox-container").insertAdjacentHTML("afterbegin", this._html);
    this._zoombox = document.querySelector(".zoombox");
    this._zoomCanvas = <HTMLCanvasElement>this._zoombox.children[0];
    this._zoomCanvas.width = 140;
    this._zoomCanvas.height = 140;
    this._zoomContext = this._zoomCanvas.getContext("2d");
    ZoomBox.gridSize = this._zoomCanvas.width / (Cell.size*this._zoomLevel);
    this._createCells(this._zoomContext, null, true);
    this._drawGrid(this._zoomContext);
  }

  public show() {
    this._zoombox.style.display = "block";
  }

  public hide() {
    this._zoombox.style.display = "none";
  }

  public displayArea(area) {
    if (area) {
      this._createCells(this._zoomContext, area);
    }
  }

  private _drawCell(ctx: CanvasRenderingContext2D, cell: Cell, row: number, column: number) {
    this._zoomContext.fillStyle = cell.color;
    this._zoomContext.fillRect(column*(Cell.size*this._zoomLevel)+1, row*(Cell.size*this._zoomLevel)+1, (Cell.size*this._zoomLevel)-1, (Cell.size*this._zoomLevel)-1);
    // blue cell at the center of the zoom grid
    // TODO do not hardcode the center of the grid
    this._zoomContext.fillStyle = 'rgb(0,105,159)';
    this._zoomContext.fillRect(3*(Cell.size*this._zoomLevel)+1, 3*(Cell.size*this._zoomLevel)+1, (Cell.size*this._zoomLevel)-1, (Cell.size*this._zoomLevel)-1);

  }

  private _createCells(ctx: CanvasRenderingContext2D, data?: CellGrid, isBlank: boolean = false) {
    let tmpCell: Cell;
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
        this._drawCell(ctx, tmpCell, i, j);
      }
    }
  }

  private _drawGrid(ctx: CanvasRenderingContext2D) {
    Helpers.drawGrid(ctx, this._zoomCanvas, this._zoomLevel, GRID.COLORZOOM);
  };
}

export default ZoomBox;

