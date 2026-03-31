import { CELL_STATE } from "@cell/constants";
import {
  CELL_SIZE,
  getCanvasTheme,
  getZoomCanvasCellColors,
  ZOOM_CANVAS_PX,
  ZOOM_FOCUS,
  ZOOM_LEVEL,
  ZOOM_SIZE,
} from "@grid/constants";
import { drawGrid } from "@lib/canvas/canvas";
import { getRequiredContext2D, queryRequired } from "@lib/dom/dom";
import { getBrushOffsets } from "@ui/controls/drawing/brushOffsets";

import type { CanvasTheme } from "@grid/constants";
import type { BrushShape } from "@ui/controls/drawing/constants";
import type { DrawingMode } from "@ui/controls/drawing/DrawingToolBox";

/**
 * ZoomBox — 4× magnified square neighbourhood view around the drawing cursor.
 *
 * Receives a plain number[][] area from Grid._getZoomArea() and renders it
 * directly — no Cell objects, no internal state matrix.
 *
 * State values: 0=DEAD, 1=ALIVE, 2=BORDER (out-of-bounds), 3=OUTSIDE (cursor
 * outside valid grid range — area is [[3]], ZoomBox skips the render).
 */
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
  private readonly _xPosDisplay: HTMLElement;
  private readonly _yPosDisplay: HTMLElement;
  private readonly _theme: CanvasTheme;
  private readonly _cellColors: readonly string[];

  constructor() {
    const zoomBoxContainer = queryRequired<HTMLElement>(".zoombox-container");
    zoomBoxContainer.insertAdjacentHTML("afterbegin", this._html);
    this._zoombox = queryRequired<HTMLElement>(".zoombox");
    const zoomBoxOuterPx = `${ZOOM_CANVAS_PX + 2}px`;
    zoomBoxContainer.style.height = zoomBoxOuterPx;
    this._zoombox.style.width = zoomBoxOuterPx;
    this._zoombox.style.height = zoomBoxOuterPx;
    this._zoomCanvas = queryRequired<HTMLCanvasElement>("#zoombox", this._zoombox);
    this._zoomCanvas.width = ZOOM_CANVAS_PX;
    this._zoomCanvas.height = ZOOM_CANVAS_PX;
    this._zoomContext = getRequiredContext2D(this._zoomCanvas);
    this._theme = getCanvasTheme();
    this._cellColors = getZoomCanvasCellColors(this._theme);
    this._renderBlank();
    this._xPosDisplay = queryRequired<HTMLElement>(".x-pos", this._zoombox);
    this._yPosDisplay = queryRequired<HTMLElement>(".y-pos", this._zoombox);
  }

  public show(): void {
    this._zoombox.style.display = "block";
  }

  public hide(): void {
    this._zoombox.style.display = "none";
  }

  /**
   * Render the zoom area around the cursor.
   * @param area  number[][] from Grid._getZoomArea(). [[OUTSIDE]] when out of range.
   * @param drawingMode  Current drawing mode, controls brush highlight rendering.
   * @param brushShape  Active brush shape — used to highlight all brush cells.
   * @param brushSize  Active brush size.
   * @param x  Column coordinate (displayed in the HUD).
   * @param y  Row coordinate (displayed in the HUD).
   */
  public displayArea(
    area: number[][],
    drawingMode: DrawingMode,
    brushShape: BrushShape,
    brushSize: number,
    x = 0,
    y = 0,
  ): void {
    if (!area) return;
    this._renderArea(drawingMode, brushShape, brushSize, area);
    this._xPosDisplay.textContent = String(x);
    this._yPosDisplay.textContent = String(y);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /** Render the full area, then overlay all brush-shape cells with the cursor highlight. */
  private _renderArea(drawingMode: DrawingMode, brushShape: BrushShape, brushSize: number, area: number[][]): void {
    // [[OUTSIDE]]: cursor is outside the valid cell range — skip render.
    if (area[0][0] === CELL_STATE.OUTSIDE) return;

    const cellPx = CELL_SIZE * ZOOM_LEVEL;
    this._zoomContext.clearRect(0, 0, this._zoomCanvas.width, this._zoomCanvas.height);

    for (let row = 0; row < ZOOM_SIZE; row++) {
      for (let col = 0; col < ZOOM_SIZE; col++) {
        const state = area[row][col];
        this._zoomContext.fillStyle = this._cellColors[state];
        if (state === CELL_STATE.BORDER || state === CELL_STATE.OUTSIDE) {
          this._zoomContext.fillRect(col * cellPx, row * cellPx, cellPx, cellPx);
          continue;
        }
        this._zoomContext.fillRect(col * cellPx + 1, row * cellPx + 1, cellPx - 1, cellPx - 1);
      }
    }

    if (drawingMode !== "hand") {
      const previewColor =
        drawingMode === "pencil" ? this._theme.previewAliveCellColor : this._theme.previewEraseCellColor;
      this._zoomContext.fillStyle = previewColor;

      this._forEachBrushCell(brushShape, brushSize, (row, col) => {
        if (area[row][col] === CELL_STATE.BORDER || area[row][col] === CELL_STATE.OUTSIDE) return;
        this._zoomContext.fillRect(col * cellPx + 1, row * cellPx + 1, cellPx - 1, cellPx - 1);
      });
    }

    // Draw the stroke border only around the center cell (cursor focus).
    const cx = ZOOM_FOCUS.x;
    const cy = ZOOM_FOCUS.y;
    this._zoomContext.strokeStyle = this._theme.zoomHighlightStrokeColor;
    this._zoomContext.strokeRect(cx * cellPx, cy * cellPx, cellPx + 1, cellPx + 1);

    this._drawVisibleGrid(area);
  }

  /**
   * Iterate over all zoom-grid cells that belong to the current brush shape,
   * centered at ZOOM_FOCUS. Mirrors the logic in GridDrawingHandler._forEachShapeCell.
   */
  private _forEachBrushCell(brushShape: BrushShape, brushSize: number, cb: (row: number, col: number) => void): void {
    for (const { rowOffset, colOffset } of getBrushOffsets(brushShape, brushSize)) {
      const row = Math.max(0, Math.min(ZOOM_SIZE - 1, ZOOM_FOCUS.y + rowOffset));
      const col = Math.max(0, Math.min(ZOOM_SIZE - 1, ZOOM_FOCUS.x + colOffset));
      cb(row, col);
    }
  }

  /** Fill the zoom canvas with DEAD color on first render. */
  private _renderBlank(): void {
    this._zoomContext.clearRect(0, 0, this._zoomCanvas.width, this._zoomCanvas.height);
    this._drawGrid(this._zoomContext);
  }

  private _drawGrid(ctx: CanvasRenderingContext2D): void {
    drawGrid({
      ctx,
      canvas: this._zoomCanvas,
      zoom: ZOOM_LEVEL,
      color: this._theme.zoomGridColor,
    });
  }

  private _drawVisibleGrid(area: number[][]): void {
    const bounds = this._getVisibleBounds(area);
    if (!bounds) return;

    const cellPx = CELL_SIZE * ZOOM_LEVEL;
    const left = bounds.minCol * cellPx;
    const top = bounds.minRow * cellPx;
    const width = (bounds.maxCol - bounds.minCol + 1) * cellPx;
    const height = (bounds.maxRow - bounds.minRow + 1) * cellPx;

    this._zoomContext.save();
    this._zoomContext.beginPath();
    this._zoomContext.strokeStyle = this._theme.zoomGridColor;
    this._zoomContext.lineWidth = 1;

    for (let col = 1; col < bounds.maxCol - bounds.minCol + 1; col++) {
      const x = left + col * cellPx + 0.5;
      this._zoomContext.moveTo(x, top);
      this._zoomContext.lineTo(x, top + height);
    }

    for (let row = 1; row < bounds.maxRow - bounds.minRow + 1; row++) {
      const y = top + row * cellPx + 0.5;
      this._zoomContext.moveTo(left, y);
      this._zoomContext.lineTo(left + width, y);
    }

    this._zoomContext.stroke();
    this._zoomContext.fillStyle = this._theme.zoomGridColor;
    this._zoomContext.fillRect(left, top, width, 1);
    this._zoomContext.fillRect(left, top, 1, height);
    this._zoomContext.fillRect(left, top + height - 1, width, 1);
    this._zoomContext.fillRect(left + width - 1, top, 1, height);
    this._zoomContext.restore();
  }

  private _getVisibleBounds(
    area: number[][],
  ): { minRow: number; maxRow: number; minCol: number; maxCol: number } | null {
    let minRow = Number.POSITIVE_INFINITY;
    let maxRow = Number.NEGATIVE_INFINITY;
    let minCol = Number.POSITIVE_INFINITY;
    let maxCol = Number.NEGATIVE_INFINITY;

    for (let row = 0; row < ZOOM_SIZE; row++) {
      for (let col = 0; col < ZOOM_SIZE; col++) {
        if (area[row][col] === CELL_STATE.BORDER || area[row][col] === CELL_STATE.OUTSIDE) {
          continue;
        }
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }

    if (!Number.isFinite(minRow) || !Number.isFinite(minCol) || !Number.isFinite(maxRow) || !Number.isFinite(maxCol)) {
      return null;
    }

    return { minRow, maxRow, minCol, maxCol };
  }
}

export default ZoomBox;
