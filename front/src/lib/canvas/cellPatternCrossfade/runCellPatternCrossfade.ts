import { pickRandomCellPatternMask, precomputeMaskThresholds } from "@lib/canvas/cellPatternCrossfade/cellPatternMasks";
import { CELL_PATTERN_CROSSFADE_DEFAULTS } from "@lib/canvas/cellPatternCrossfade/constants";
import { applyCellPatternEasing } from "@lib/canvas/cellPatternCrossfade/easing";
import { paintCanvasGridWithPerCellAliveAlpha } from "@lib/canvas/cellPatternCrossfade/paint";

import type {
  CanvasCellPatternCrossfadeController,
  CanvasCellPatternCrossfadeOptions,
  CellPatternEasingId,
} from "@lib/canvas/cellPatternCrossfade/types";

function resolveDurationMs(explicit: number | undefined | null, fallbackMs: number): number {
  if (explicit !== undefined && explicit !== null) {
    const n = Number(explicit);
    if (Number.isFinite(n) && n >= 0) {
      return n;
    }
  }
  return fallbackMs;
}

/** Alive: full opacity until `p` reaches threshold, then **off** in one step. */
function hardAliveMaskFadeOut(p: number, threshold: number): number {
  return p < threshold ? 1 : 0;
}

/** Alive: **off** until `p` reaches threshold, then full opacity in one step. */
function hardAliveMaskFadeIn(p: number, threshold: number): number {
  return p < threshold ? 0 : 1;
}

/**
 * Erases live cells from `getBeforeCell` using a **mask** (random by default: plasma, spirale,
 * serpentin, rideaux, shuffle, etc.), applies `applyNewPattern`, then reveals with the same mask.
 * Pass `maskId` / `maskSeed` to fix the effect; a `pixelBlockSize` above 1 adds mosaic blocks.
 */
export function runCellPatternCrossfade(
  options: CanvasCellPatternCrossfadeOptions,
): CanvasCellPatternCrossfadeController {
  const fadeOutDurationMs = resolveDurationMs(options.fadeOutMs, CELL_PATTERN_CROSSFADE_DEFAULTS.fadeOutMs);
  const fadeInDurationMs = resolveDurationMs(options.fadeInMs, CELL_PATTERN_CROSSFADE_DEFAULTS.fadeInMs);
  const gapDurationMs = resolveDurationMs(options.gapMs, CELL_PATTERN_CROSSFADE_DEFAULTS.gapMs);
  const sweepWaveMix = options.sweepWaveMix ?? CELL_PATTERN_CROSSFADE_DEFAULTS.sweepWaveMix;
  const pixelBlockSize = options.pixelBlockSize ?? CELL_PATTERN_CROSSFADE_DEFAULTS.pixelBlockSize;
  const easing = options.easing ?? CELL_PATTERN_CROSSFADE_DEFAULTS.easing;
  const maskId = options.maskId ?? pickRandomCellPatternMask();
  const maskSeed =
    options.maskSeed !== undefined && Number.isFinite(options.maskSeed)
      ? options.maskSeed >>> 0
      : (Math.random() * 0x1_0000_0000) >>> 0;

  const {
    ctx,
    canvas,
    rows,
    cols,
    cellSize,
    cellColors,
    getBeforeCell,
    applyNewPattern,
    getAfterCell,
    drawGridLines,
    easingFadeOut,
    easingFadeIn,
    onComplete,
  } = options;

  const easingOut: CellPatternEasingId = easingFadeOut ?? easing;
  const easingIn: CellPatternEasingId = easingFadeIn ?? easing;

  const thresholds = precomputeMaskThresholds(maskId, maskSeed, rows, cols, sweepWaveMix, pixelBlockSize);

  let rafId = 0;
  let cancelled = false;
  let settled = false;

  const settle = (): void => {
    if (settled) {
      return;
    }
    settled = true;
    resolveFinished();
  };

  let resolveFinished!: () => void;
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  const cancel = (): void => {
    if (cancelled) {
      return;
    }
    cancelled = true;
    cancelAnimationFrame(rafId);
    settle();
  };

  const aliveAlphaFadeOut = (row: number, col: number, p: number): number => {
    const threshold = thresholds[row * cols + col];
    return hardAliveMaskFadeOut(p, threshold);
  };

  const aliveAlphaFadeIn = (row: number, col: number, p: number): number => {
    const threshold = thresholds[row * cols + col];
    return hardAliveMaskFadeIn(p, threshold);
  };

  const runFadeOut = (start: number): void => {
    const frame = (): void => {
      if (cancelled) {
        return;
      }
      // Use performance.now() for progress — the rAF callback argument is not always reliable across browsers.
      const linearT = fadeOutDurationMs <= 0 ? 1 : Math.min(1, (performance.now() - start) / fadeOutDurationMs);
      const p = applyCellPatternEasing(linearT, easingOut);
      paintCanvasGridWithPerCellAliveAlpha(ctx, canvas, rows, cols, cellSize, cellColors, getBeforeCell, (row, col) =>
        aliveAlphaFadeOut(row, col, p),
      );
      drawGridLines();

      if (linearT < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        runHoldThenApplyAndFadeIn(performance.now());
      }
    };
    rafId = requestAnimationFrame(frame);
  };

  /** Keeps the final erase frame (old grid, all alive cells snapped off) during the gap. */
  const paintFadeOutComplete = (): void => {
    paintCanvasGridWithPerCellAliveAlpha(ctx, canvas, rows, cols, cellSize, cellColors, getBeforeCell, (row, col) =>
      aliveAlphaFadeOut(row, col, 1),
    );
    drawGridLines();
  };

  const runHoldThenApplyAndFadeIn = (gapStart: number): void => {
    if (gapDurationMs <= 0) {
      applyNewPattern();
      runFadeIn(performance.now());
      return;
    }

    const frame = (): void => {
      if (cancelled) {
        return;
      }
      paintFadeOutComplete();
      const elapsed = performance.now() - gapStart;
      if (elapsed < gapDurationMs) {
        rafId = requestAnimationFrame(frame);
      } else {
        applyNewPattern();
        runFadeIn(performance.now());
      }
    };
    rafId = requestAnimationFrame(frame);
  };

  const runFadeIn = (start: number): void => {
    const frame = (): void => {
      if (cancelled) {
        return;
      }
      const linearT = fadeInDurationMs <= 0 ? 1 : Math.min(1, (performance.now() - start) / fadeInDurationMs);
      const p = applyCellPatternEasing(linearT, easingIn);
      paintCanvasGridWithPerCellAliveAlpha(ctx, canvas, rows, cols, cellSize, cellColors, getAfterCell, (row, col) =>
        aliveAlphaFadeIn(row, col, p),
      );
      drawGridLines();

      if (linearT < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        onComplete?.();
        settle();
      }
    };
    rafId = requestAnimationFrame(frame);
  };

  runFadeOut(performance.now());

  return { cancel, finished };
}
