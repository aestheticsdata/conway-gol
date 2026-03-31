import { CELL_STATE } from "@cell/constants";
import Data from "@data/Data";
import {
  CELL_SIZE,
  GRID_CENTER_COL,
  GRID_CENTER_ROW,
  GRID_COLS,
  GRID_ROWS,
  getCanvasCellColors,
  getCanvasPreviewCellColors,
  getCanvasTheme,
} from "@grid/constants";
import GridDrawingHandler from "@grid/GridDrawingHandler";
import { geometrizeGridPattern, isGeometrizeResultAcceptable, softenGeometrizeResult } from "@grid/geometrizePattern";
import { transformGrid } from "@grid/gridTransforms";
import { DEFAULT_RANDOM_PRESET } from "@grid/randomPresets";
import Simulation from "@grid/Simulation";
import { DEFAULT_RANDOM_PARAMS } from "@grid/seeding/RandomPresetSeeder";
import { drawGrid } from "@helpers/canvas";
import { runCellPatternCrossfade } from "@helpers/canvasCellPatternCrossfade";

import type { CanvasTheme } from "@grid/constants";
import type { RandomPresetId } from "@grid/randomPresets";
import type { SimulationStateStats } from "@grid/Simulation";
import type { RandomSeedParams } from "@grid/seeding/RandomPresetSeeder";
import type ZoomBox from "@grid/zoom/ZoomBox";
import type { CellPatternEasingId, CellPatternMaskId } from "@helpers/canvasCellPatternCrossfade";
import type DrawingToolBox from "@ui/controls/drawing/DrawingToolBox";
import type UserCustomSelector from "@ui/controls/drawing/UserCustomSelector";

export type GridStateChangeStats = SimulationStateStats & {
  changedCells: number | null;
};

export type DrawingCursorPosition = {
  x: number;
  y: number;
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
  /** When true, matches “Generate” / spatial variation for the preset family. */
  randomPresetVariation?: boolean;
  initialRotationDeg?: number;
  initialZoomLevel?: number;
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
  onPointerCellChange?: (position: DrawingCursorPosition | null) => void;
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
  private _cellPatternCrossfadeCancel: (() => void) | null = null;

  constructor(options: GridOptions) {
    this._canvas = options.canvas;
    this._ctx = options.ctx;
    this._simulation = new Simulation(GRID_ROWS, GRID_COLS);
    this._onStateChange = options.onStateChange;
    this._theme = getCanvasTheme();
    this._cellColors = getCanvasCellColors(this._theme);
    this._previewCellColors = getCanvasPreviewCellColors(this._theme);

    switch (options.mode) {
      case "random": {
        const randomOpts = options;
        this._rotationDeg = randomOpts.initialRotationDeg ?? 0;
        this._zoomLevel = randomOpts.initialZoomLevel ?? 0;
        this._initializeRandom(
          randomOpts.randomPreset ?? DEFAULT_RANDOM_PRESET,
          randomOpts.randomParams ?? DEFAULT_RANDOM_PARAMS,
          randomOpts.randomPresetVariation ?? false,
        );
        break;
      }
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
          centerGuideColor: this._theme.centerGuideColor,
          centerRow: GRID_CENTER_ROW,
          centerCol: GRID_CENTER_COL,
          onPointerCellChange: options.onPointerCellChange,
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

  /** Load a pre-built full-grid state (e.g. from an imported image) and repaint. */
  public seedFromGrid(grid: number[][]): void {
    this._simulation.seedFromGrid(grid);
    this._render();
    this._drawGrid();
    this._emitStateChange();
  }

  /**
   * Random mode: base pattern (before rotation/zoom) and transform values for
   * restoring the first-play frame after simulation runs.
   */
  public captureRandomPlaybackLayout(): { baseGrid: number[][]; rotationDeg: number; zoomLevel: number } | null {
    if (!this._baseGrid) {
      return null;
    }
    return {
      baseGrid: this._baseGrid.map((row) => [...row]),
      rotationDeg: this._rotationDeg,
      zoomLevel: this._zoomLevel,
    };
  }

  public restoreRandomPlaybackLayout(baseGrid: number[][], rotationDeg: number, zoomLevel: number): void {
    this._baseGrid = baseGrid.map((row) => [...row]);
    this._rotationDeg = rotationDeg;
    this._zoomLevel = zoomLevel;
    this._applyTransforms();
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

  public getAliveCount(): number {
    return this._simulation.getStateStats().alive;
  }

  /**
   * Replace the current random pattern with a symmetric, block-aligned version of what
   * is shown (uses live cells). Resets rotation/zoom to identity so the new shape is
   * stored as the base pattern.
   */
  public geometrizeRandomPattern(options?: { skipRender?: boolean }): void {
    if (!this._baseGrid) {
      return;
    }
    let source = this.toGrid();
    if (Grid._countAliveInGrid(source) === 0) {
      source = Grid._ensureNonEmptyGeometrizeResult(source);
    }
    const maxAttempts = 48;
    let g = geometrizeGridPattern(source, Math.random);
    for (
      let attempt = 1;
      attempt < maxAttempts && (Grid._countAliveInGrid(g) === 0 || !isGeometrizeResultAcceptable(g));
      attempt++
    ) {
      g = geometrizeGridPattern(source, Math.random);
    }
    if (!isGeometrizeResultAcceptable(g)) {
      g = softenGeometrizeResult(g, Math.random);
    }
    if (!isGeometrizeResultAcceptable(g)) {
      g = softenGeometrizeResult(g, Math.random);
    }
    g = Grid._ensureNonEmptyGeometrizeResult(g);
    this._baseGrid = g;
    this._rotationDeg = 0;
    this._zoomLevel = 0;
    this._simulation.seedFromGrid(g);
    if (!options?.skipRender) {
      this._render();
      this._drawGrid();
      this._emitStateChange();
    }
  }

  private static _countAliveInGrid(grid: number[][]): number {
    let n = 0;
    for (const row of grid) {
      for (const v of row) {
        if (v > 0) n++;
      }
    }
    return n;
  }

  /** Guarantees at least one live cell (center) when the pattern is empty. */
  private static _ensureNonEmptyGeometrizeResult(grid: number[][]): number[][] {
    if (Grid._countAliveInGrid(grid) > 0) {
      return grid;
    }
    const out = grid.map((row) => [...row]);
    if (out.length > 0 && out[0].length > 0) {
      out[GRID_CENTER_ROW][GRID_CENTER_COL] = CELL_STATE.ALIVE;
    }
    return out;
  }

  /**
   * Re-seed random mode from a preset and repaint (iteration counter reset by caller).
   * @param randomVariation — same as Simulation.seedByPreset (false = default, true = Generate).
   */
  public reseedRandomPreset(
    preset: RandomPresetId,
    randomVariation = false,
    params: RandomSeedParams = DEFAULT_RANDOM_PARAMS,
    options?: { skipRender?: boolean },
  ): void {
    this._simulation.seedByPreset(preset, randomVariation, params);
    this._baseGrid = this._simulation.toGrid();
    this._applyTransforms();
    if (!options?.skipRender) {
      this._render();
      this._drawGrid();
      this._emitStateChange();
    }
  }

  /**
   * Cloud-wipes live cells, runs `applyNewPattern` (should mutate this grid with `skipRender` on
   * seed helpers), then reveals the new pattern. Cancels any in-flight crossfade from a previous call.
   * Optional timings default to `CELL_PATTERN_CROSSFADE_DEFAULTS` (`@helpers/canvasCellPatternCrossfade/constants`).
   */
  public runCellPatternCrossfade(
    applyNewPattern: () => void,
    timing?: {
      fadeOutMs?: number;
      fadeInMs?: number;
      gapMs?: number;
      sweepWaveMix?: number;
      pixelBlockSize?: number;
      easing?: CellPatternEasingId;
      easingFadeOut?: CellPatternEasingId;
      easingFadeIn?: CellPatternEasingId;
      maskId?: CellPatternMaskId;
      maskSeed?: number;
    },
  ): void {
    this._cancelCellPatternCrossfade();
    const before = this.toGrid().map((row) => [...row]);
    const getBeforeCell = (row: number, col: number): number => before[row]?.[col] ?? CELL_STATE.DEAD;
    const controller = runCellPatternCrossfade({
      ctx: this._ctx,
      canvas: this._canvas,
      rows: GRID_ROWS,
      cols: GRID_COLS,
      cellSize: CELL_SIZE,
      cellColors: this._cellColors,
      getBeforeCell,
      applyNewPattern,
      getAfterCell: (row, col) => this._simulation.getCell(row, col),
      drawGridLines: () => this._drawGrid(),
      ...(timing?.fadeOutMs !== undefined ? { fadeOutMs: timing.fadeOutMs } : {}),
      ...(timing?.fadeInMs !== undefined ? { fadeInMs: timing.fadeInMs } : {}),
      ...(timing?.gapMs !== undefined ? { gapMs: timing.gapMs } : {}),
      ...(timing?.sweepWaveMix !== undefined ? { sweepWaveMix: timing.sweepWaveMix } : {}),
      ...(timing?.pixelBlockSize !== undefined ? { pixelBlockSize: timing.pixelBlockSize } : {}),
      ...(timing?.easing !== undefined ? { easing: timing.easing } : {}),
      ...(timing?.easingFadeOut !== undefined ? { easingFadeOut: timing.easingFadeOut } : {}),
      ...(timing?.easingFadeIn !== undefined ? { easingFadeIn: timing.easingFadeIn } : {}),
      ...(timing?.maskId !== undefined ? { maskId: timing.maskId } : {}),
      ...(timing?.maskSeed !== undefined ? { maskSeed: timing.maskSeed } : {}),
      onComplete: () => {
        this._cellPatternCrossfadeCancel = null;
        this._emitStateChange();
      },
    });
    this._cellPatternCrossfadeCancel = () => {
      controller.cancel();
      this._cellPatternCrossfadeCancel = null;
      this._render();
      this._drawGrid();
      this._emitStateChange();
    };
  }

  private _cancelCellPatternCrossfade(): void {
    if (!this._cellPatternCrossfadeCancel) {
      return;
    }
    this._cellPatternCrossfadeCancel();
  }

  // ── Initialization ────────────────────────────────────────────────────────

  private _initializeRandom(randomPreset: RandomPresetId, params: RandomSeedParams, randomVariation = false): void {
    this._simulation.seedByPreset(randomPreset, randomVariation, params);
    this._baseGrid = this._simulation.toGrid();
    this._applyTransforms();
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
