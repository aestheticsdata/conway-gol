export type CellPatternMaskId =
  | "plasma"
  | "plasma_tight"
  | "spiral"
  | "snake_rows"
  | "snake_cols"
  | "radial_burst"
  | "diamond"
  | "curtain_horizontal"
  | "curtain_vertical"
  | "diagonal_wipe"
  | "random_shuffle"
  | "hash_dissolve";

export type CellPatternEasingId =
  | "linear"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutCubic"
  | "easeInOutQuart"
  | "easeInOutQuint";

export interface CanvasCellPatternCrossfadeOptions {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  rows: number;
  cols: number;
  cellSize: number;
  /** Same ordering as `Grid` / `Simulation` cell state indices. */
  cellColors: readonly string[];
  getBeforeCell: (row: number, col: number) => number;
  /** Runs once between fade-out and fade-in; should update backing state (e.g. simulation). */
  applyNewPattern: () => void;
  getAfterCell: (row: number, col: number) => number;
  /** Draw grid lines / overlay on top of cells (e.g. `drawGrid` helper). */
  drawGridLines: () => void;
  fadeOutMs?: number;
  fadeInMs?: number;
  /**
   * 0 = sinus cloud mask only; 1 = blend in the legacy column sweep (see
   * {@link DEFAULT_CELL_PATTERN_SWEEP_WAVE_MIX}).
   */
  sweepWaveMix?: number;
  /**
   * Side length in **cells** of each “pixel” block (same mask threshold for the whole block).
   * {@link DEFAULT_CELL_PATTERN_PIXEL_BLOCK_SIZE}
   */
  pixelBlockSize?: number;
  /**
   * Delay after fade-out completes before `applyNewPattern` and fade-in (see
   * {@link DEFAULT_CELL_PATTERN_CROSSFADE_GAP_MS}).
   */
  gapMs?: number;
  /** Fallback easing for both phases when fade-specific easings are omitted (see {@link DEFAULT_CELL_PATTERN_EASING}). */
  easing?: CellPatternEasingId;
  /** Overrides `easing` for fade-out only. */
  easingFadeOut?: CellPatternEasingId;
  /** Overrides `easing` for fade-in only. */
  easingFadeIn?: CellPatternEasingId;
  /**
   * Wipe mask (sinus plasma, spirale, serpentin, rideaux, etc.). Omit for a **random** mask each run.
   */
  maskId?: CellPatternMaskId;
  /** RNG seed for mask randomness (spiral centre, shuffles, etc.); random if omitted. */
  maskSeed?: number;
  /** Called only after a full erase → apply → reveal sequence (not on cancel). */
  onComplete?: () => void;
}

export interface CanvasCellPatternCrossfadeController {
  /** Stops the animation; canvas is left to the caller to repaint if needed. */
  cancel: () => void;
  /** Resolves when the sequence finishes or is cancelled. */
  finished: Promise<void>;
}
