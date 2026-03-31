import type { CellPatternEasingId } from "@helpers/canvasCellPatternCrossfade/types";

/**
 * **Single place to tune** wall-clock wipe duration / gap and related defaults.
 * `runCellPatternCrossfade` reads `fadeOutMs` / `fadeInMs` / `gapMs` from here at **runtime**
 * (`CELL_PATTERN_CROSSFADE_DEFAULTS.fadeOutMs`, …) so changing these numbers always changes how
 * long the animation runs — not a stale inlined constant from the bundler.
 * `sweepWaveMix` controls how much the old column sweep is mixed into the default sinus cloud.
 *
 * Each alive cell is **on or off** (no per-cell opacity ramp): the mask only sets **when**
 * it flips; a `pixelBlockSize` above 1 groups cells into mosaic blocks.
 */
export const CELL_PATTERN_CROSSFADE_DEFAULTS = {
  /** Wall time for global progress `p` from 0 → 1 while erasing (cells snap off by threshold). */
  fadeOutMs: 280,
  /** Wall time for `p` from 0 → 1 while revealing (cells snap on by threshold). */
  fadeInMs: 280,
  gapMs: 10,
  /** 0 = pure sinus “cloud” mask; 1 = legacy right→left column sweep + jitter. */
  sweepWaveMix: 0,
  /**
   * N×N Conway cells share one cloud threshold → **mosaic / pixelisation** during the wipe.
   * Use 1 for per-cell mask; 3–4 for chunkier “pixels”.
   */
  pixelBlockSize: 2,
  easing: "linear" as CellPatternEasingId,
};

/** Alias of {@link CELL_PATTERN_CROSSFADE_DEFAULTS} fields (same values at module load). */
export const DEFAULT_CELL_PATTERN_FADE_OUT_MS = CELL_PATTERN_CROSSFADE_DEFAULTS.fadeOutMs;
/** Alias of {@link CELL_PATTERN_CROSSFADE_DEFAULTS} fields (same values at module load). */
export const DEFAULT_CELL_PATTERN_FADE_IN_MS = CELL_PATTERN_CROSSFADE_DEFAULTS.fadeInMs;
/** Alias of {@link CELL_PATTERN_CROSSFADE_DEFAULTS} fields (same values at module load). */
export const DEFAULT_CELL_PATTERN_SWEEP_WAVE_MIX = CELL_PATTERN_CROSSFADE_DEFAULTS.sweepWaveMix;
/** Alias of {@link CELL_PATTERN_CROSSFADE_DEFAULTS} fields (same values at module load). */
export const DEFAULT_CELL_PATTERN_PIXEL_BLOCK_SIZE = CELL_PATTERN_CROSSFADE_DEFAULTS.pixelBlockSize;
/** Alias of {@link CELL_PATTERN_CROSSFADE_DEFAULTS} fields (same values at module load). */
export const DEFAULT_CELL_PATTERN_CROSSFADE_GAP_MS = CELL_PATTERN_CROSSFADE_DEFAULTS.gapMs;
/** Alias of {@link CELL_PATTERN_CROSSFADE_DEFAULTS} fields (same values at module load). */
export const DEFAULT_CELL_PATTERN_EASING = CELL_PATTERN_CROSSFADE_DEFAULTS.easing;
