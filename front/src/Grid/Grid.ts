import Data from "@data/Data";
import { drawGrid } from "@helpers/canvas";
import {
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  getCanvasCellColors,
  getCanvasPreviewCellColors,
  getCanvasTheme,
} from "./constants";
import GridDrawingHandler from "./GridDrawingHandler";
import { transformGrid } from "./gridTransforms";
import { DEFAULT_RANDOM_PRESET } from "./randomPresets";
import Simulation from "./Simulation";
import { DEFAULT_RANDOM_PARAMS } from "./seeding/RandomPresetSeeder";

import type DrawingToolBox from "@ui/controls/drawing/DrawingToolBox";
import type UserCustomSelector from "@ui/controls/drawing/UserCustomSelector";
import type { CanvasTheme } from "./constants";
import type { RandomPresetId } from "./randomPresets";
import type { SimulationStateStats } from "./Simulation";
import type { RandomSeedParams } from "./seeding/RandomPresetSeeder";
import type ZoomBox from "./zoom/ZoomBox";

export type GridStateChangeStats = SimulationStateStats & {
  changedCells: number | null;
};

type GridBaseOptions = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  species?: string;
  onLoad?: (comments: string[]) => void;
  onStateChange?: (stats: GridStateChangeStats) => void;
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

/**
 * Grid — canvas renderer + drawing-mode interaction layer.
 *
 * Owns a Simulation instance and is responsible for two things only:
 *   1. Rendering: read state from Simulation, paint pixels on the canvas.
 *   2. Drawing mode: delegate mouse interactions to GridDrawingHandler.
 *
 * No Conway logic lives here. No cell objects are created here.
 */
class Grid {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;
  private readonly _simulation: Simulation;
  private readonly _onStateChange?: (stats: GridStateChangeStats) => void;
  private readonly _theme: CanvasTheme;
  private readonly _cellColors: readonly string[];
  private readonly _previewCellColors: readonly string[];
  private readonly _drawingHandler?: GridDrawingHandler;
  private _rotationDeg = 0;
  private _zoomLevel = 0;
  private _baseGrid: number[][] | null = null;

  constructor(options: GridOptions) {
    this._canvas = options.canvas;
    this._ctx = options.ctx;
    this._simulation = new Simulation(GRID_ROWS, GRID_COLS);
    this._onStateChange = options.onStateChange;
    this._theme = getCanvasTheme();
    this._cellColors = getCanvasCellColors(this._theme);
    this._previewCellColors = getCanvasPreviewCellColors(this._theme);

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
      case "drawing": {
        const handler = new GridDrawingHandler({
          cursor: options.cursor,
          drawingCanvas: options.drawingCanvas,
          drawingContext: options.drawingContext,
          zoombox: options.zoombox,
          initialDrawingMode: options.drawingToolbox.selectedMode,
          initialBrushSize: options.drawingToolbox.selectedBrushSize,
          initialBrushShape: options.drawingToolbox.selectedBrushShape,
          getCell: (row, col) => this._simulation.getCell(row, col),
          setCell: (row, col, state) => this._simulation.setCell(row, col, state),
          translateGrid: (rowDelta, colDelta) => this._translateGrid(rowDelta, colDelta),
          renderCell: (row, col) => this._renderCell(row, col),
          emitStateChange: () => this._emitStateChange(),
          getPreviewCellColor: (state) => this._previewCellColors[state],
        });
        this._drawingHandler = handler;
        options.drawingToolbox.register((mode) => handler.setDrawingMode(mode));
        options.drawingToolbox.registerBrushSize((size) => handler.setBrushSize(size));
        options.drawingToolbox.registerBrushShape((shape) => handler.setBrushShape(shape));
        this._initializeDrawing(options.species, options.onLoad, options.userCustomSelector);
        break;
      }
    }
  }

  // ── Mouse listener management ──────────────────────────────────────────────
  // https://stackoverflow.com/a/56775919/5671836

  public initListener(): void {
    this._drawingHandler?.initListeners();
  }

  public destroyListener(): void {
    this._drawingHandler?.destroyListeners();
  }

  public setDrawingPlaybackActive(isActive: boolean): void {
    this._drawingHandler?.setPlaybackActive(isActive);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Advance the simulation by one generation and repaint the canvas.
   * Called by Main on every animation frame that passes the FPS gate.
   */
  public processNextGeneration(): void {
    const tickResult = this._simulation.tick();
    this._render();
    this._drawGrid();
    this._emitStateChange(tickResult.changedCells);
  }

  public setRotation(deg: number): void {
    this._rotationDeg = deg;
    if (this._baseGrid) {
      this._applyTransforms();
      this._render();
      this._drawGrid();
      this._emitStateChange();
    }
  }

  /**
   * Update stored transform values without rendering immediately.
   * Useful when multiple controls are changed before a full reseed.
   */
  public syncTransforms(rotationDeg: number, zoomLevel: number): void {
    this._rotationDeg = rotationDeg;
    this._zoomLevel = zoomLevel;
  }

  public resetTransforms(): void {
    this._rotationDeg = 0;
    this._zoomLevel = 0;
  }

  public setZoom(level: number): void {
    this._zoomLevel = level;
    if (this._baseGrid) {
      this._applyTransforms();
      this._render();
      this._drawGrid();
      this._emitStateChange();
    }
  }

  /** Load a pre-built 156×156 grid (e.g. from an imported image) and repaint. */
  public seedFromGrid(grid: number[][]): void {
    this._simulation.seedFromGrid(grid);
    this._render();
    this._drawGrid();
    this._emitStateChange();
  }

  public clearCanvas(): void {
    this._baseGrid = null;
    this._simulation.seedDead();
    this._render();
    this._drawGrid();
    this._emitStateChange();
  }

  /** Snapshot current simulation state as a full grid. */
  public toGrid(): number[][] {
    return this._simulation.toGrid();
  }

  /** Snapshot current simulation state as a flat 0/1 buffer. */
  public copyState(): Uint8Array {
    return this._simulation.copyState();
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
    this._baseGrid = this._simulation.toGrid();
    this._applyTransforms();
    this._render();
    this._drawGrid();
    this._emitStateChange();
  }

  // ── Initialization ────────────────────────────────────────────────────────

  private _initializeRandom(randomPreset: RandomPresetId, params: RandomSeedParams): void {
    this._simulation.seedByPreset(randomPreset, false, params);
    this._baseGrid = this._simulation.toGrid();
    this._render();
    this._drawGrid();
    this._emitStateChange();
  }

  private _initializeZoo(species?: string, onLoad?: (comments: string[]) => void): void {
    const data = new Data();
    void data.load(species ?? "canadagoose", [10, 10]).then(() => {
      this._simulation.seedFromGrid(data.grid);
      this._render();
      this._drawGrid();
      this._emitStateChange();
      onLoad?.(data.comments);
    });
  }

  private _initializeDrawing(
    species: string | undefined,
    onLoad: ((comments: string[]) => void) | undefined,
    userCustomSelector: UserCustomSelector,
  ): void {
    userCustomSelector.getGridData = () => this._simulation.toGrid();

    if (species) {
      const data = new Data();
      void data.load(species, [0, 0], true).then(() => {
        this._simulation.seedFromGrid(data.grid);
        this._render();
        this._drawGrid();
        this._emitStateChange();
        onLoad?.(data.comments);
      });
    } else {
      this._simulation.seedDead();
      this._render();
      this._emitStateChange();
    }

    this._drawGrid();
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  /** Repaint every cell on the canvas from current simulation state. */
  private _render(): void {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        this._ctx.fillStyle = this._cellColors[this._simulation.getCell(row, col)];
        this._ctx.fillRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }
  }

  /** Draw a single cell on the main canvas from current simulation state. */
  private _renderCell(row: number, col: number): void {
    const x = col * CELL_SIZE + 1;
    const y = row * CELL_SIZE + 1;
    const size = CELL_SIZE - 1;
    this._ctx.clearRect(x, y, size, size);
    this._ctx.fillStyle = this._cellColors[this._simulation.getCell(row, col)];
    this._ctx.fillRect(x, y, size, size);
  }

  private _drawGrid(): void {
    drawGrid({
      ctx: this._ctx,
      canvas: this._canvas,
      color: this._theme.gridColor,
    });
  }

  private _translateGrid(rowDelta: number, colDelta: number): void {
    this._simulation.translate(rowDelta, colDelta);
    this._render();
    this._drawGrid();
    this._emitStateChange();
  }

  // ── Rotation ──────────────────────────────────────────────────────────────

  private _applyTransforms(): void {
    if (!this._baseGrid) return;
    this._simulation.seedFromGrid(transformGrid(this._baseGrid, this._rotationDeg, this._zoomLevel));
  }

  // ── State ─────────────────────────────────────────────────────────────────

  private _emitStateChange(changedCells: number | null = null): void {
    this._onStateChange?.({
      ...this._simulation.getStateStats(),
      changedCells,
    });
  }
}

export default Grid;
