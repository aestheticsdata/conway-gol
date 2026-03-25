import { CELL_STATE } from "@cell/constants";
import {
  CELL_SIZE,
  getCanvasCellColors,
  getCanvasTheme,
  ZOOM_CANVAS_PX,
  ZOOM_CENTER,
  ZOOM_LEVEL,
  ZOOM_SIZE,
} from "@grid/constants";
import { drawGrid } from "@helpers/canvas";
import { getRequiredContext2D, queryRequired } from "@helpers/dom";

import type { CanvasTheme } from "@grid/constants";
import type { DrawingMode } from "@ui/controls/drawing/DrawingToolBox";

/**
 * ZoomBox — 4× magnified 7×7 neighbourhood view around the drawing cursor.
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
    queryRequired<HTMLElement>(".zoombox-container").insertAdjacentHTML("afterbegin", this._html);
    this._zoombox = queryRequired<HTMLElement>(".zoombox");
    this._zoomCanvas = queryRequired<HTMLCanvasElement>("#zoombox", this._zoombox);
    this._zoomCanvas.width = ZOOM_CANVAS_PX;
    this._zoomCanvas.height = ZOOM_CANVAS_PX;
    this._zoomContext = getRequiredContext2D(this._zoomCanvas);
    this._theme = getCanvasTheme();
    this._cellColors = getCanvasCellColors(this._theme);
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
   * Render the 7×7 area around the cursor.
   * @param area  number[][] from Grid._getZoomArea(). [[OUTSIDE]] when out of range.
   * @param drawingMode  Current pencil/eraser mode, controls center cell highlight color.
   * @param x  Column coordinate (displayed in the HUD).
   * @param y  Row coordinate (displayed in the HUD).
   */
  public displayArea(area: number[][], drawingMode: DrawingMode, x = 0, y = 0): void {
    if (!area) return;
    this._renderArea(drawingMode, area);
    this._xPosDisplay.textContent = String(x);
    this._yPosDisplay.textContent = String(y);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /** Render the full area, then overlay the center-cell highlight. */
  private _renderArea(drawingMode: DrawingMode, area: number[][]): void {
    // [[OUTSIDE]]: cursor is outside the valid cell range — skip render.
    if (area[0][0] === CELL_STATE.OUTSIDE) return;

    const cellPx = CELL_SIZE * ZOOM_LEVEL;
    this._zoomContext.clearRect(0, 0, this._zoomCanvas.width, this._zoomCanvas.height);

    for (let row = 0; row < ZOOM_SIZE; row++) {
      for (let col = 0; col < ZOOM_SIZE; col++) {
        this._zoomContext.fillStyle = this._cellColors[area[row][col]];
        this._zoomContext.fillRect(col * cellPx + 1, row * cellPx + 1, cellPx - 1, cellPx - 1);
      }
    }

    // Overlay center cell with the active cursor blue + blue border.
    const cx = ZOOM_CENTER.x;
    const cy = ZOOM_CENTER.y;
    this._zoomContext.fillStyle =
      drawingMode === "pencil" ? this._theme.previewAliveCellColor : this._theme.previewEraseCellColor;
    this._zoomContext.fillRect(cx * cellPx + 1, cy * cellPx + 1, cellPx - 1, cellPx - 1);
    this._zoomContext.strokeStyle = this._theme.zoomHighlightStrokeColor;
    this._zoomContext.strokeRect(cx * cellPx, cy * cellPx, cellPx + 1, cellPx + 1);

    this._drawGrid(this._zoomContext);
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
}

export default ZoomBox;
