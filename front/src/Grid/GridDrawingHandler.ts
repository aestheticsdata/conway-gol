import { CELL_STATE } from "@cell/constants";
import { getBrushOffsets } from "@ui/controls/drawing/brushOffsets";
import { MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from "@ui/controls/drawing/constants";
import { CELL_SIZE, GRID_COLS, GRID_ROWS, ZOOM_FOCUS, ZOOM_SIZE } from "./constants";

import type { BrushShape } from "@ui/controls/drawing/constants";
import type { DrawingMode } from "@ui/controls/drawing/DrawingToolBox";
import type ZoomBox from "./zoom/ZoomBox";

type GridPointerPosition = {
  xPos: number;
  yPos: number;
};

export type GridDrawingHandlerDeps = {
  cursor: HTMLElement;
  drawingCanvas: HTMLCanvasElement;
  drawingContext: CanvasRenderingContext2D;
  zoombox: ZoomBox;
  initialDrawingMode: DrawingMode;
  initialBrushSize: number;
  initialBrushShape: BrushShape;
  getCell: (row: number, col: number) => number;
  setCell: (row: number, col: number, state: number) => void;
  translateGrid: (rowDelta: number, colDelta: number) => void;
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
  private readonly _translateGrid: (rowDelta: number, colDelta: number) => void;
  private readonly _renderCell: (row: number, col: number) => void;
  private readonly _emitStateChange: () => void;
  private readonly _getPreviewCellColor: (state: number) => string;
  private readonly _pencilCursor: HTMLElement | null;
  private readonly _eraserCursor: HTMLElement | null;
  private readonly _handCursor: HTMLElement | null;

  private _drawingMode: DrawingMode;
  private _brushSize: number;
  private _brushShape: BrushShape;
  private _hoverPointer: GridPointerPosition | null = null;
  private _dragPointer: GridPointerPosition | null = null;
  private _lastPaintPointer: GridPointerPosition | null = null;
  private _isDown = false;
  private _isPlaybackActive = false;

  constructor(deps: GridDrawingHandlerDeps) {
    this._cursor = deps.cursor;
    this._drawingCanvas = deps.drawingCanvas;
    this._drawingContext = deps.drawingContext;
    this._zoombox = deps.zoombox;
    this._drawingMode = deps.initialDrawingMode;
    this._brushSize = this._clampBrushSize(deps.initialBrushSize);
    this._brushShape = deps.initialBrushShape;
    this._getCell = deps.getCell;
    this._setCell = deps.setCell;
    this._translateGrid = deps.translateGrid;
    this._renderCell = deps.renderCell;
    this._emitStateChange = deps.emitStateChange;
    this._getPreviewCellColor = deps.getPreviewCellColor;
    this._pencilCursor = this._cursor.querySelector<HTMLElement>(".cursor.pencil");
    this._eraserCursor = this._cursor.querySelector<HTMLElement>(".cursor.eraser");
    this._handCursor = this._cursor.querySelector<HTMLElement>(".cursor.hand");
  }

  public setDrawingMode(mode: DrawingMode): void {
    this._drawingMode = mode;
    this._syncCursorMode();
    this._renderHoverPreview();
  }

  public setBrushSize(size: number): void {
    this._brushSize = this._clampBrushSize(size);
    this._renderHoverPreview();
  }

  public setBrushShape(shape: BrushShape): void {
    this._brushShape = shape;
    this._renderHoverPreview();
  }

  public setPlaybackActive(isActive: boolean): void {
    this._isPlaybackActive = isActive;
    if (isActive) {
      this._dragPointer = null;
    }
    this._renderHoverPreview();
  }

  public initListeners(): void {
    this._drawingCanvas.addEventListener("mousemove", this._onMouseMove);
    this._drawingCanvas.addEventListener("mouseenter", this._onMouseEnter);
    this._drawingCanvas.addEventListener("mouseleave", this._onMouseLeave);
    this._drawingCanvas.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mouseup", this._onMouseUp);
  }

  public destroyListeners(): void {
    this._drawingCanvas.removeEventListener("mousemove", this._onMouseMove);
    this._drawingCanvas.removeEventListener("mouseenter", this._onMouseEnter);
    this._drawingCanvas.removeEventListener("mouseleave", this._onMouseLeave);
    this._drawingCanvas.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("mouseup", this._onMouseUp);
    this._hoverPointer = null;
    this._clearOverlay();
  }

  // ── Mouse handlers ─────────────────────────────────────────────────────────

  private _onMouseEnter = (_e: MouseEvent): void => {
    this._cursor.style.display = "block";
    this._syncCursorMode();
    this._renderHoverPreview();
  };

  private _onMouseLeave = (_e: MouseEvent): void => {
    this._cursor.style.display = "none";
    this._hoverPointer = null;
    this._dragPointer = null;
    this._lastPaintPointer = null;
    this._clearOverlay();
  };

  private _onMouseMove = (e: MouseEvent): void => {
    this._cursor.style.left = `${e.clientX}px`;
    this._cursor.style.top = `${e.clientY - 27}px`;

    const pointer = this._getPointerPosition(e.offsetX, e.offsetY);
    if (!pointer) {
      this._hoverPointer = null;
      this._clearOverlay();
      return;
    }

    this._hoverPointer = pointer;
    if (this._isDown) {
      if (this._drawingMode === "hand") {
        this._translateAtPointer(pointer);
      } else {
        if (this._lastPaintPointer) {
          this._paintStroke(this._lastPaintPointer, pointer);
        } else {
          this._paintAtPointer(pointer);
        }
        this._lastPaintPointer = pointer;
      }
    }

    this._zoombox.displayArea(
      this._getZoomArea(pointer.xPos, pointer.yPos),
      this._drawingMode,
      this._brushShape,
      this._brushSize,
      pointer.xPos,
      pointer.yPos,
    );
    this._renderHoverPreview();
  };

  private _onMouseDown = (e: MouseEvent): void => {
    this._isDown = true;
    const pointer = this._getPointerPosition(e.offsetX, e.offsetY);
    if (!pointer) {
      return;
    }

    this._hoverPointer = pointer;
    if (this._drawingMode === "hand") {
      this._dragPointer = pointer;
    } else {
      this._paintAtPointer(pointer);
      this._lastPaintPointer = pointer;
    }
    this._zoombox.displayArea(
      this._getZoomArea(pointer.xPos, pointer.yPos),
      this._drawingMode,
      this._brushShape,
      this._brushSize,
      pointer.xPos,
      pointer.yPos,
    );
    this._renderHoverPreview();
  };

  private _onMouseUp = (): void => {
    this._isDown = false;
    this._dragPointer = null;
    this._lastPaintPointer = null;
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

  private _getPointerPosition(offsetX: number, offsetY: number): GridPointerPosition | null {
    const coords = this._getCellCoords(offsetX, offsetY);
    if (!coords) {
      return null;
    }

    return {
      xPos: coords.xPos,
      yPos: coords.yPos,
    };
  }

  /**
   * Extract the square zoom neighbourhood around (x, y) from the simulation state.
   * Cells outside [0, GRID_COLS-1] / [0, GRID_ROWS-1] are marked as BORDER.
   * Returns [[OUTSIDE]] when the cursor is outside the valid cell range.
   */
  private _getZoomArea(x: number, y: number): number[][] {
    if (x >= 0 && y >= 0 && x <= GRID_COLS - 1 && y <= GRID_ROWS - 1) {
      const area: number[][] = [];
      for (let i = 0; i < ZOOM_SIZE; i++) {
        area.push([]);
        for (let j = 0; j < ZOOM_SIZE; j++) {
          const row = i + y - ZOOM_FOCUS.y;
          const col = j + x - ZOOM_FOCUS.x;
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

  private _paintAtPointer(pointer: GridPointerPosition): void {
    const newState = this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    let hasChanged = false;

    this._forEachShapeCell(pointer.yPos, pointer.xPos, (row, col) => {
      if (this._getCell(row, col) === newState) {
        return;
      }

      this._setCell(row, col, newState);
      this._renderCell(row, col);
      hasChanged = true;
    });

    if (hasChanged) {
      this._emitStateChange();
    }
  }

  private _paintStroke(from: GridPointerPosition, to: GridPointerPosition): void {
    const newState = this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    let hasChanged = false;
    for (const point of this._getLinePoints(from, to)) {
      this._forEachShapeCell(point.yPos, point.xPos, (row, col) => {
        if (this._getCell(row, col) === newState) {
          return;
        }

        this._setCell(row, col, newState);
        this._renderCell(row, col);
        hasChanged = true;
      });
    }

    if (hasChanged) {
      this._emitStateChange();
    }
  }

  private _getLinePoints(from: GridPointerPosition, to: GridPointerPosition): GridPointerPosition[] {
    const points: GridPointerPosition[] = [];
    let x = from.xPos;
    let y = from.yPos;
    const dx = Math.abs(to.xPos - from.xPos);
    const dy = Math.abs(to.yPos - from.yPos);
    const sx = from.xPos < to.xPos ? 1 : -1;
    const sy = from.yPos < to.yPos ? 1 : -1;
    let err = dx - dy;

    while (true) {
      points.push({ xPos: x, yPos: y });
      if (x === to.xPos && y === to.yPos) {
        break;
      }

      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return points;
  }

  private _translateAtPointer(pointer: GridPointerPosition): void {
    if (this._isPlaybackActive) {
      this._dragPointer = pointer;
      return;
    }

    if (!this._dragPointer) {
      this._dragPointer = pointer;
      return;
    }

    const rowDelta = pointer.yPos - this._dragPointer.yPos;
    const colDelta = pointer.xPos - this._dragPointer.xPos;
    if (rowDelta === 0 && colDelta === 0) {
      return;
    }

    this._translateGrid(rowDelta, colDelta);
    this._dragPointer = pointer;
  }

  private _forEachShapeCell(anchorRow: number, anchorCol: number, cb: (row: number, col: number) => void): void {
    for (const { rowOffset, colOffset } of getBrushOffsets(this._brushShape, this._brushSize)) {
      const row = Math.max(0, Math.min(GRID_ROWS - 1, anchorRow + rowOffset));
      const col = Math.max(0, Math.min(GRID_COLS - 1, anchorCol + colOffset));
      cb(row, col);
    }
  }

  private _renderHoverPreview(): void {
    this._clearOverlay();

    if (!this._hoverPointer || this._cursor.style.display === "none" || this._drawingMode === "hand") {
      return;
    }

    const hoverState = this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    this._forEachShapeCell(this._hoverPointer.yPos, this._hoverPointer.xPos, (row, col) => {
      this._renderCellOnOverlay(hoverState, row, col);
    });
  }

  private _clearOverlay(): void {
    this._drawingContext.clearRect(0, 0, this._drawingCanvas.width, this._drawingCanvas.height);
  }

  private _syncCursorMode(): void {
    if (!this._pencilCursor || !this._eraserCursor || !this._handCursor) {
      return;
    }

    this._pencilCursor.style.display = this._drawingMode === "pencil" ? "block" : "none";
    this._eraserCursor.style.display = this._drawingMode === "eraser" ? "block" : "none";
    this._handCursor.style.display = this._drawingMode === "hand" ? "block" : "none";
  }

  private _clampBrushSize(size: number): number {
    return Math.max(MIN_BRUSH_SIZE, Math.min(MAX_BRUSH_SIZE, Math.round(size)));
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
