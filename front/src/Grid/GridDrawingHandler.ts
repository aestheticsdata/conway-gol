import { CELL_STATE } from "@cell/constants";
import { CELL_SIZE, GRID_COLS, GRID_ROWS, ZOOM_RADIUS, ZOOM_SIZE } from "./constants";

import type { DrawingMode } from "@ui/controls/drawing/DrawingToolBox";
import type ZoomBox from "./zoom/ZoomBox";

export type GridDrawingHandlerDeps = {
  cursor: HTMLElement;
  drawingCanvas: HTMLCanvasElement;
  drawingContext: CanvasRenderingContext2D;
  zoombox: ZoomBox;
  initialDrawingMode: DrawingMode;
  getCell: (row: number, col: number) => number;
  setCell: (row: number, col: number, state: number) => void;
  renderCell: (row: number, col: number) => void;
  emitStateChange: () => void;
  getPreviewCellColor: (state: number) => string;
};

/**
 * Handles all drawing-mode interactions: mouse events, cursor visibility,
 * zoom area computation, cell painting, and overlay rendering.
 * Communicates with Grid exclusively through callbacks — no direct reference
 * to Grid or Simulation.
 */
class GridDrawingHandler {
  private readonly _cursor: HTMLElement;
  private readonly _drawingCanvas: HTMLCanvasElement;
  private readonly _drawingContext: CanvasRenderingContext2D;
  private readonly _zoombox: ZoomBox;
  private readonly _getCell: (row: number, col: number) => number;
  private readonly _setCell: (row: number, col: number, state: number) => void;
  private readonly _renderCell: (row: number, col: number) => void;
  private readonly _emitStateChange: () => void;
  private readonly _getPreviewCellColor: (state: number) => string;

  private _drawingMode: DrawingMode;
  private _previousCellPos: { xPos: number; yPos: number } | null = null;
  private _isDown = false;

  constructor(deps: GridDrawingHandlerDeps) {
    this._cursor = deps.cursor;
    this._drawingCanvas = deps.drawingCanvas;
    this._drawingContext = deps.drawingContext;
    this._zoombox = deps.zoombox;
    this._drawingMode = deps.initialDrawingMode;
    this._getCell = deps.getCell;
    this._setCell = deps.setCell;
    this._renderCell = deps.renderCell;
    this._emitStateChange = deps.emitStateChange;
    this._getPreviewCellColor = deps.getPreviewCellColor;
  }

  public setDrawingMode(mode: DrawingMode): void {
    this._drawingMode = mode;
  }

  public initListeners(): void {
    this._drawingCanvas.addEventListener("mousemove", this._onMouseMove);
    this._drawingCanvas.addEventListener("mouseenter", this._onMouseEnter);
    this._drawingCanvas.addEventListener("mouseleave", this._onMouseLeave);
    this._drawingCanvas.addEventListener("mousedown", this._onMouseDown);
    this._drawingCanvas.addEventListener("mouseup", this._onMouseUp);
  }

  public destroyListeners(): void {
    this._drawingCanvas.removeEventListener("mousemove", this._onMouseMove);
    this._drawingCanvas.removeEventListener("mouseenter", this._onMouseEnter);
    this._drawingCanvas.removeEventListener("mouseleave", this._onMouseLeave);
    this._drawingCanvas.removeEventListener("mousedown", this._onMouseDown);
    this._drawingCanvas.removeEventListener("mouseup", this._onMouseUp);
  }

  // ── Mouse handlers ─────────────────────────────────────────────────────────

  private _onMouseEnter = (_e: MouseEvent): void => {
    this._cursor.style.display = "block";

    const pencilCursor = this._cursor.querySelector<HTMLElement>(".cursor.pencil");
    const eraserCursor = this._cursor.querySelector<HTMLElement>(".cursor.eraser");
    if (!pencilCursor || !eraserCursor) {
      return;
    }

    if (this._drawingMode === "pencil") {
      pencilCursor.style.display = "block";
      eraserCursor.style.display = "none";
    } else {
      pencilCursor.style.display = "none";
      eraserCursor.style.display = "block";
    }
  };

  private _onMouseLeave = (_e: MouseEvent): void => {
    this._cursor.style.display = "none";
  };

  private _onMouseMove = (e: MouseEvent): void => {
    this._cursor.style.left = `${e.clientX}px`;
    this._cursor.style.top = `${e.clientY - 27}px`;

    const res = this._getCellCoords(e.offsetX, e.offsetY);
    const hoverState = this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;

    if (!res) {
      return;
    }

    this._zoombox.displayArea(this._getZoomArea(res.xPos, res.yPos), this._drawingMode, res.xPos, res.yPos);

    if (!this._previousCellPos) {
      this._renderCellOnOverlay(hoverState, res.yPos, res.xPos);
      this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
      return;
    }

    this._renderCellOnOverlay(hoverState, res.yPos, res.xPos);

    if (this._previousCellPos.xPos !== res.xPos || this._previousCellPos.yPos !== res.yPos) {
      if (this._isDown) {
        this._paintCell(e);
      } else {
        this._drawingContext.clearRect(0, 0, this._drawingCanvas.width, this._drawingCanvas.height);
      }
      this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
    }
  };

  private _onMouseDown = (e: MouseEvent): void => {
    this._isDown = true;
    this._paintCell(e);

    const res = this._getCellCoords(e.offsetX, e.offsetY);
    if (res) {
      this._zoombox.displayArea(this._getZoomArea(res.xPos, res.yPos), this._drawingMode);
    }
  };

  private _onMouseUp = (): void => {
    this._isDown = false;
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Convert a pixel position on the canvas to a cell coordinate.
   * Returns null if the position falls on the 1-cell border (x or y <= 0).
   */
  private _getCellCoords(x: number, y: number): { xPos: number; yPos: number } | null {
    if (x > 0 && y > 0) {
      return {
        xPos: Math.floor(x / CELL_SIZE) - 1,
        yPos: Math.floor(y / CELL_SIZE) - 1,
      };
    }
    return null;
  }

  /**
   * Extract the 7×7 neighbourhood around (x, y) from the simulation state.
   * Cells outside [0, GRID_COLS-1] / [0, GRID_ROWS-1] are marked as BORDER.
   * Returns [[OUTSIDE]] when the cursor is outside the valid cell range.
   */
  private _getZoomArea(x: number, y: number): number[][] {
    if (x >= 0 && y >= 0 && x <= GRID_COLS - 1 && y <= GRID_ROWS - 1) {
      const area: number[][] = [];
      for (let i = 0; i < ZOOM_SIZE; i++) {
        area.push([]);
        for (let j = 0; j < ZOOM_SIZE; j++) {
          const row = i + y - ZOOM_RADIUS;
          const col = j + x - ZOOM_RADIUS;
          if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
            area[i].push(CELL_STATE.BORDER);
          } else {
            area[i].push(this._getCell(row, col));
          }
        }
      }
      return area;
    }
    return [[CELL_STATE.OUTSIDE]];
  }

  private _paintCell(e: MouseEvent): void {
    const coords = this._getCellCoords(e.offsetX, e.offsetY);
    if (!coords) {
      return;
    }

    const { xPos, yPos } = coords;
    const newState = this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    this._setCell(yPos, xPos, newState);
    this._renderCell(yPos, xPos);
    this._emitStateChange();
  }

  private _renderCellOnOverlay(state: number, row: number, col: number): void {
    const x = col * CELL_SIZE + 1;
    const y = row * CELL_SIZE + 1;
    const size = CELL_SIZE - 1;
    this._drawingContext.clearRect(x, y, size, size);
    this._drawingContext.fillStyle = this._getPreviewCellColor(state);
    this._drawingContext.fillRect(x, y, size, size);
  }
}

export default GridDrawingHandler;
