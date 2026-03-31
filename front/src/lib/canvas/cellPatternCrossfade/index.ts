/**
 * Canvas cell-pattern wipe: mask-driven snap erase / reveal between Conway grids.
 *
 * Layout: `types.ts` (interfaces), `constants.ts` (defaults), `easing.ts`, `paint.ts`,
 * `cellPatternMasks.ts`, `runCellPatternCrossfade.ts`.
 */

export {
  CELL_PATTERN_MASK_IDS,
  cloudMaskPhase,
  pickRandomCellPatternMask,
  precomputeMaskThresholds,
  waveSweepPerturbation,
} from "@lib/canvas/cellPatternCrossfade/cellPatternMasks";
export {
  CELL_PATTERN_CROSSFADE_DEFAULTS,
  DEFAULT_CELL_PATTERN_CROSSFADE_GAP_MS,
  DEFAULT_CELL_PATTERN_EASING,
  DEFAULT_CELL_PATTERN_FADE_IN_MS,
  DEFAULT_CELL_PATTERN_FADE_OUT_MS,
  DEFAULT_CELL_PATTERN_PIXEL_BLOCK_SIZE,
  DEFAULT_CELL_PATTERN_SWEEP_WAVE_MIX,
} from "@lib/canvas/cellPatternCrossfade/constants";
export { applyCellPatternEasing } from "@lib/canvas/cellPatternCrossfade/easing";
export { runCellPatternCrossfade } from "@lib/canvas/cellPatternCrossfade/runCellPatternCrossfade";
export { paintCanvasGridWithAliveAlpha, paintCanvasGridWithPerCellAliveAlpha } from "./paint";

export type {
  CanvasCellPatternCrossfadeController,
  CanvasCellPatternCrossfadeOptions,
  CellPatternEasingId,
  CellPatternMaskId,
} from "@lib/canvas/cellPatternCrossfade/types";
