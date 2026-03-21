import Data from "@data/Data";
import { CELL_STATE } from "@cell/constants";
import DrawingToolBox, { type DrawingMode } from "@controls/DrawingToolBox";
import { drawGrid } from "@helpers/canvas";
import type UserCustomSelector from "@controls/UserCustomSelector";
import Simulation from "./Simulation";
import {
  CELL_COLORS,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  ZOOM_RADIUS,
  ZOOM_SIZE,
} from "./constants";
import {
  DEFAULT_RANDOM_PRESET,
  type RandomPresetId,
} from "./randomPresets";
import {
  DEFAULT_RANDOM_PARAMS,
  type RandomSeedParams,
} from "./seeding/RandomPresetSeeder";
import type ZoomBox from "./zoom/ZoomBox";

type GridBaseOptions = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  species?: string;
  onLoad?: (comments: string[]) => void;
};

type RandomGridOptions = GridBaseOptions & {
  mode: "random";
  randomPreset?: RandomPresetId;
  randomParams?: RandomSeedParams;
};

type ZooGridOptions = GridBaseOptions & {
  mode: "zoo";
};

type DrawingGridOptions = GridBaseOptions & {
  mode: "drawing";
  cursor: HTMLElement;
  drawingCanvas: HTMLCanvasElement;
  drawingContext: CanvasRenderingContext2D;
  drawingToolbox: DrawingToolBox;
  userCustomSelector: UserCustomSelector;
  zoombox: ZoomBox;
};

type GridOptions = RandomGridOptions | ZooGridOptions | DrawingGridOptions;

type DrawingDependencies = {
  cursor: HTMLElement;
  drawingCanvas: HTMLCanvasElement;
  drawingContext: CanvasRenderingContext2D;
  drawingToolbox: DrawingToolBox;
  userCustomSelector: UserCustomSelector;
  zoombox: ZoomBox;
};

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
  private readonly _simulation: Simulation;
  private readonly _drawing?: DrawingDependencies;
  private _previousCellPos: { xPos: number; yPos: number } | null = null;
  private _isDown = false;
  private _drawingMode: DrawingMode = "pencil";

  constructor(options: GridOptions) {
    this._canvas = options.canvas;
    this._ctx = options.ctx;
    this._simulation = new Simulation(GRID_ROWS, GRID_COLS);

    switch (options.mode) {
      case "random":
        this._initializeRandom(
          options.randomPreset ?? DEFAULT_RANDOM_PRESET,
          options.randomParams ?? DEFAULT_RANDOM_PARAMS,
        );
        break;
      case "zoo":
        this._initializeZoo(options.species, options.onLoad);
        break;
      case "drawing":
        this._drawing = {
          cursor: options.cursor,
          drawingCanvas: options.drawingCanvas,
          drawingContext: options.drawingContext,
          drawingToolbox: options.drawingToolbox,
          userCustomSelector: options.userCustomSelector,
          zoombox: options.zoombox,
        };
        this._initializeDrawing(options.species, options.onLoad);
        break;
    }
  }

  // ── Mouse listener management ──────────────────────────────────────────────
  // https://stackoverflow.com/a/56775919/5671836

  public initListener(): void {
    if (!this._drawing) {
      return;
    }
    this._drawing.drawingCanvas.addEventListener("mousemove", this._drawOnMouseMove);
    this._drawing.drawingCanvas.addEventListener("mouseenter", this._mouseenter);
    this._drawing.drawingCanvas.addEventListener("mouseleave", this._mouseLeave);
    this._drawing.drawingCanvas.addEventListener("mousedown", this._mouseDown);
    this._drawing.drawingCanvas.addEventListener("mouseup", this._mouseUp);
  }

  public destroyListener(): void {
    if (!this._drawing) {
      return;
    }
    this._drawing.drawingCanvas.removeEventListener("mousemove", this._drawOnMouseMove);
    this._drawing.drawingCanvas.removeEventListener("mouseenter", this._mouseenter);
    this._drawing.drawingCanvas.removeEventListener("mouseleave", this._mouseLeave);
    this._drawing.drawingCanvas.removeEventListener("mousedown", this._mouseDown);
    this._drawing.drawingCanvas.removeEventListener("mouseup", this._mouseUp);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Advance the simulation by one generation and repaint the canvas.
   * Called by Main on every animation frame that passes the FPS gate.
   */
  public processNextGeneration(): void {
    this._simulation.tick();
    this._render();
    this._drawGrid();
  }

  /**
   * Re-seed random mode from a preset and repaint (iteration counter reset by caller).
   * @param randomVariation — same as Simulation.seedByPreset (false = default, true = Generate).
   */
  public reseedRandomPreset(
    preset: RandomPresetId,
    randomVariation = false,
    params: RandomSeedParams = DEFAULT_RANDOM_PARAMS,
  ): void {
    this._simulation.seedByPreset(preset, randomVariation, params);
    this._render();
    this._drawGrid();
  }

  // ── Initialization ────────────────────────────────────────────────────────

  private _initializeRandom(randomPreset: RandomPresetId, params: RandomSeedParams): void {
    this._simulation.seedByPreset(randomPreset, false, params);
    this._render();
    this._drawGrid();
  }

  private _initializeZoo(
    species?: string,
    onLoad?: (comments: string[]) => void,
  ): void {
    const data = new Data();
    void data.load(species ?? "canadagoose", [10, 10]).then(() => {
      this._simulation.seedFromGrid(data.grid);
      this._render();
      this._drawGrid();
      onLoad?.(data.comments);
    });
  }

  private _initializeDrawing(
    species?: string,
    onLoad?: (comments: string[]) => void,
  ): void {
    if (!this._drawing) {
      return;
    }

    this._drawing.userCustomSelector.getGridData = () => this._simulation.toGrid();
    this._drawing.drawingToolbox.register(this._setDrawingMode);
    this._drawingMode = this._drawing.drawingToolbox.selectedMode;

    if (species) {
      const data = new Data();
      void data.load(species, [0, 0], "custom").then(() => {
        this._simulation.seedFromGrid(data.grid);
        this._render();
        onLoad?.(data.comments);
      });
    } else {
      this._simulation.seedDead();
      this._render();
    }

    this._drawGrid();
  }

  // ── Drawing mode handlers ──────────────────────────────────────────────────

  private _setDrawingMode = (drawingMode: DrawingMode): void => {
    this._drawingMode = drawingMode;
  };

  private _mouseenter = (_e: MouseEvent): void => {
    if (!this._drawing) {
      return;
    }

    const { cursor } = this._drawing;
    cursor.style.display = "block";

    const pencilCursor = cursor.querySelector<HTMLElement>('.cursor.pencil');
    const eraserCursor = cursor.querySelector<HTMLElement>('.cursor.eraser');
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

  private _mouseLeave = (_e: MouseEvent): void => {
    if (!this._drawing) {
      return;
    }
    this._drawing.cursor.style.display = "none";
  };

  private _drawOnMouseMove = (e: MouseEvent): void => {
    if (!this._drawing) {
      return;
    }

    const { cursor, drawingCanvas, drawingContext, zoombox } = this._drawing;
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY - 27}px`;

    const res = this._getCellCoords(e.offsetX, e.offsetY);
    const hoverState =
      this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;

    if (!res) {
      return;
    }

    zoombox.displayArea(
      this._getZoomArea(res.xPos, res.yPos),
      this._drawingMode,
      res.xPos,
      res.yPos,
    );

    if (!this._previousCellPos) {
      this._renderCellOnOverlay(hoverState, res.yPos, res.xPos);
      this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
      return;
    }

    this._renderCellOnOverlay(hoverState, res.yPos, res.xPos);

    if (
      this._previousCellPos.xPos !== res.xPos
      || this._previousCellPos.yPos !== res.yPos
    ) {
      if (this._isDown) {
        this._paintCell(e);
      } else {
        drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      }
      this._previousCellPos = { xPos: res.xPos, yPos: res.yPos };
    }
  };

  private _mouseDown = (e: MouseEvent): void => {
    if (!this._drawing) {
      return;
    }

    this._isDown = true;
    this._paintCell(e);

    const res = this._getCellCoords(e.offsetX, e.offsetY);
    if (res) {
      this._drawing.zoombox.displayArea(
        this._getZoomArea(res.xPos, res.yPos),
        this._drawingMode,
      );
    }
  };

  private _mouseUp = (): void => {
    this._isDown = false;
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Convert a pixel position on the canvas to a cell coordinate.
   * Returns null if the position falls on the 1-cell border (x or y <= 0).
   */
  private _getCellCoords(
    x: number,
    y: number,
  ): { xPos: number; yPos: number } | null {
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
    }
    return [[CELL_STATE.OUTSIDE]];
  }

  /** Commit a pencil/eraser stroke to the simulation and repaint that cell. */
  private _paintCell = (e: MouseEvent): void => {
    const coords = this._getCellCoords(e.offsetX, e.offsetY);
    if (!coords) {
      return;
    }

    const { xPos, yPos } = coords;
    const newState =
      this._drawingMode === "pencil" ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    this._simulation.setCell(yPos, xPos, newState);
    this._renderCell(yPos, xPos);
  };

  /** Draw a single cell on the overlay (hover preview) canvas. */
  private _renderCellOnOverlay(state: number, row: number, col: number): void {
    if (!this._drawing) {
      return;
    }

    this._drawing.drawingContext.fillStyle = CELL_COLORS[state];
    this._drawing.drawingContext.fillRect(
      col * CELL_SIZE + 1,
      row * CELL_SIZE + 1,
      CELL_SIZE - 1,
      CELL_SIZE - 1,
    );
  }

  /** Draw a single cell on the main canvas from current simulation state. */
  private _renderCell(row: number, col: number): void {
    this._ctx.fillStyle = CELL_COLORS[this._simulation.getCell(row, col)];
    this._ctx.fillRect(
      col * CELL_SIZE + 1,
      row * CELL_SIZE + 1,
      CELL_SIZE - 1,
      CELL_SIZE - 1,
    );
  }

  /** Repaint every cell on the canvas from current simulation state. */
  private _render(): void {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        this._ctx.fillStyle = CELL_COLORS[this._simulation.getCell(row, col)];
        this._ctx.fillRect(
          col * CELL_SIZE + 1,
          row * CELL_SIZE + 1,
          CELL_SIZE - 1,
          CELL_SIZE - 1,
        );
      }
    }
  }

  private _drawGrid(): void {
    drawGrid(this._ctx, this._canvas);
  }
}

export default Grid;
