import Data from "../data/Data";
import { CELL_STATE } from "../Cell/constants";
import type { Mode } from "../controls/ModeSelector";
import DrawingToolBox, { DrawingMode } from "../controls/DrawingToolBox";
import Helpers from "../helpers/Helpers";
import ZoomBox from "./zoom/ZoomBox";
import UserCustomSelector from "../controls/UserCustomSelector";
import Simulation from "./Simulation";
import {
  CELL_COLORS,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  ZOOM_RADIUS,
  ZOOM_SIZE,
} from "./constants";

/**
 * Grid — canvas renderer + drawing-mode interaction layer.
 *
 * Owns a Simulation instance and is responsible for two things only:
 *   1. Rendering: read state from Simulation, paint pixels on the canvas.
 *   2. Drawing mode: translate mouse events into Simulation.setCell() calls.
 *
 * No Conway logic lives here. No cell objects are created here.
 */
class Grid {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;
  private readonly _drawingCanvas: HTMLCanvasElement;
  private readonly _drawingContext: CanvasRenderingContext2D;
  private readonly _simulation: Simulation;
  private _mode: Mode;
  private _previousCellPos: { xPos: number; yPos: number } | null = null;
  private _isDown: boolean = false;
  private _drawingMode: DrawingMode;
  public zoombox: ZoomBox;
  private _userCustomSelector?: UserCustomSelector;
  private _cursor: HTMLElement = document.querySelector('.custom-cursor');

  constructor(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mode: Mode,
    species?: string,
    drawingContext?: CanvasRenderingContext2D,
    drawingCanvas?: HTMLCanvasElement,
    drawingToolbox?: DrawingToolBox,
    userCustomSelector?: UserCustomSelector,
  ) {
    this._canvas = canvas;
    this._ctx = ctx;
    this._drawingCanvas = drawingCanvas;
    this._drawingContext = drawingContext;
    this._mode = mode;
    this._simulation = new Simulation(GRID_ROWS, GRID_COLS);
    const data = new Data();

    if (mode === 'random') {
      this._simulation.seedRandom();
      this._render(ctx);
      this._drawGrid(ctx);
    }

    if (mode === 'zoo') {
      data.factory(species ?? "canadagoose", [10, 10]).then(() => {
        this._simulation.seedFromGrid(data.grid);
        this._render(ctx);
        this._drawGrid(ctx);
      });
    }

    if (mode === 'drawing') {
      // Non-null: drawing mode always receives these optional params from Main.
      this._userCustomSelector = userCustomSelector!;
      // Expose a live snapshot of the simulation state to the save handler.
      this._userCustomSelector.getGridData = () => this._simulation.toGrid();
      drawingToolbox!.register(this._setDrawingMode);
      this._drawingMode = drawingToolbox!.selectedMode;

      if (species) {
        data.factory(species, [0, 0], "custom").then(() => {
          this._simulation.seedFromGrid(data.grid);
          this._render(ctx);
        });
      } else {
        this._simulation.seedDead();
        this._render(ctx);
      }

      this._drawGrid(ctx);
    }
  }

  // ── Mouse listener management ──────────────────────────────────────────────
  // https://stackoverflow.com/a/56775919/5671836

  public initListener() {
    if (this._drawingCanvas) {
      this._drawingCanvas.addEventListener("mousemove", this._drawOnMouseMove);
      this._drawingCanvas.addEventListener("mouseenter", this._mouseenter);
      this._drawingCanvas.addEventListener("mouseleave", this._mouseLeave);
      this._drawingCanvas.addEventListener("mousedown", this._mouseDown);
      this._drawingCanvas.addEventListener("mouseup", this._mouseUp);
    }
  }

  public destroyListener() {
    if (this._drawingCanvas) {
      this._drawingCanvas.removeEventListener("mousemove", this._drawOnMouseMove);
      this._drawingCanvas.removeEventListener("mouseenter", this._mouseenter);
      this._drawingCanvas.removeEventListener("mouseleave", this._mouseLeave);
      this._drawingCanvas.removeEventListener("mousedown", this._mouseDown);
      this._drawingCanvas.removeEventListener("mouseup", this._mouseUp);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Advance the simulation by one generation and repaint the canvas.
   * Called by Main on every animation frame that passes the FPS gate.
   */
  public processNextGeneration(ctx: CanvasRenderingContext2D): void {
    this._simulation.tick();
    this._render(ctx);
    this._drawGrid(ctx);
  }

  // ── Drawing mode handlers ──────────────────────────────────────────────────

  private _setDrawingMode = (drawingMode: DrawingMode) => {
    this._drawingMode = drawingMode;
  }

  private _mouseenter = (_e: MouseEvent) => {
    this._cursor.style.display = "block";
    if (this._drawingMode === "pencil") {
      (<HTMLElement>this._cursor.querySelector('.cursor.pencil')).style.display = "block";
      (<HTMLElement>this._cursor.querySelector('.cursor.eraser')).style.display = "none";
    } else {
      (<HTMLElement>this._cursor.querySelector('.cursor.pencil')).style.display = "none";
      (<HTMLElement>this._cursor.querySelector('.cursor.eraser')).style.display = "block";
    }
  }

  private _mouseLeave = (_e: MouseEvent) => {
    this._cursor.style.display = "none";
  }

  private _drawOnMouseMove = (e: MouseEvent) => {
    this._cursor.style.left = e.clientX + "px";
    this._cursor.style.top = e.clientY - 27 + "px";
    const res = this._getCellCoords(e.offsetX, e.offsetY);
    const hoverState = this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;

    if (res) {
      this.zoombox.displayArea(this._getZoomArea(res.xPos, res.yPos), this._drawingMode, res.xPos, res.yPos);

      // Render hover preview on the overlay canvas.
      // First draw: initialise previousCellPos.
      if (!this._previousCellPos) {
        this._renderCellOnOverlay(hoverState, res.yPos, res.xPos);
        this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
      } else {
        this._renderCellOnOverlay(hoverState, res.yPos, res.xPos);

        // e.offsetX/Y change continuously but xPos/yPos are cell-snapped.
        // Only act when the cursor moves to a new cell.
        if (this._previousCellPos.xPos !== res.xPos || this._previousCellPos.yPos !== res.yPos) {
          if (this._isDown) {
            this._paintCell(e);
            this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
          } else {
            this._drawingContext.clearRect(0, 0, this._drawingCanvas.width, this._drawingCanvas.height);
            this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
          }
        }
      }
    }
  }

  private _mouseDown = (e: MouseEvent) => {
    this._isDown = true;
    this._paintCell(e);
    const res = this._getCellCoords(e.offsetX, e.offsetY);
    if (res) {
      this.zoombox.displayArea(this._getZoomArea(res.xPos, res.yPos), this._drawingMode);
    }
  }

  private _mouseUp = () => {
    this._isDown = false;
  }

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
            area[i].push(this._simulation.getCell(row, col));
          }
        }
      }
      return area;
    } else {
      return [[CELL_STATE.OUTSIDE]];
    }
  }

  /** Commit a pencil/eraser stroke to the simulation and repaint that cell. */
  private _paintCell = (e: MouseEvent) => {
    const coords = this._getCellCoords(e.offsetX, e.offsetY);
    if (!coords) return;
    const { xPos, yPos } = coords;
    const newState = this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    this._simulation.setCell(yPos, xPos, newState);
    this._renderCell(this._ctx, yPos, xPos);
  }

  /** Draw a single cell on the overlay (hover preview) canvas. */
  private _renderCellOnOverlay(state: number, row: number, col: number): void {
    this._drawingContext.fillStyle = CELL_COLORS[state];
    this._drawingContext.fillRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
  }

  /** Draw a single cell on the main canvas from current simulation state. */
  private _renderCell(ctx: CanvasRenderingContext2D, row: number, col: number): void {
    ctx.fillStyle = CELL_COLORS[this._simulation.getCell(row, col)];
    ctx.fillRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
  }

  /** Repaint every cell on the canvas from current simulation state. */
  private _render(ctx: CanvasRenderingContext2D): void {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        ctx.fillStyle = CELL_COLORS[this._simulation.getCell(row, col)];
        ctx.fillRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }
  }

  private _drawGrid(ctx: CanvasRenderingContext2D): void {
    Helpers.drawGrid(ctx, this._canvas);
  }
}

export default Grid;
