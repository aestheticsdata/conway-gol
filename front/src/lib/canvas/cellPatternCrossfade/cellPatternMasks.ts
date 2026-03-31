/**
 * Threshold masks for `runCellPatternCrossfade`: each cell gets a value in [0, 1];
 * global progress `p` snaps cells when it crosses their threshold.
 */

import { CELL_PATTERN_CROSSFADE_DEFAULTS } from "@lib/canvas/cellPatternCrossfade/constants";

import type { CellPatternMaskId } from "@lib/canvas/cellPatternCrossfade/types";

/** Amplitude of jitter in the legacy column sweep (same as canvas helper). */
const LEGACY_COLUMN_JITTER = 0.12;

export const CELL_PATTERN_MASK_IDS: readonly CellPatternMaskId[] = [
  "plasma",
  "plasma_tight",
  "spiral",
  "snake_rows",
  "snake_cols",
  "radial_burst",
  "diamond",
  "curtain_horizontal",
  "curtain_vertical",
  "diagonal_wipe",
  "random_shuffle",
  "hash_dissolve",
];

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return (): number => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Irregular multi-sine in roughly [-1, 1] (legacy column jitter). */
export function waveSweepPerturbation(row: number, col: number, rows: number, cols: number): number {
  if (rows <= 1 && cols <= 1) {
    return 0;
  }
  const ny = rows > 1 ? row / (rows - 1) : 0;
  const nx = cols > 1 ? col / (cols - 1) : 0;
  const s =
    0.44 * Math.sin(ny * Math.PI * 4.3 + nx * 1.7 + 0.4) +
    0.35 * Math.sin((nx * 0.71 + ny * 0.53) * Math.PI * 7.2 + 1.1) +
    0.35 * Math.sin(nx * Math.PI * 10.1 - ny * Math.PI * 4.6 + 0.35 * Math.sin(ny * 8.5));
  const maxAmp = 0.44 + 0.35 + 0.35;
  return s / maxAmp;
}

/** Classic plasma-style multi-sine field in [0, 1]. */
export function cloudMaskPhase(row: number, col: number, rows: number, cols: number): number {
  if (rows <= 1 && cols <= 1) {
    return 0.5;
  }
  const nx = cols > 1 ? col / (cols - 1) : 0.5;
  const ny = rows > 1 ? row / (rows - 1) : 0.5;
  const twoPi = Math.PI * 2;
  const s =
    0.26 * Math.sin(nx * twoPi * 2.1 + ny * twoPi * 1.4 + 0.3) +
    0.24 * Math.sin(nx * twoPi * 4.1 - ny * twoPi * 2.1 + 1.1) +
    0.22 * Math.sin((nx + ny) * twoPi * 3.7 + 0.8) +
    0.17 * Math.sin(nx * twoPi * 6.2 + ny * twoPi * 1.0 + 2.0) +
    0.11 * Math.sin(nx * twoPi * 2.8 + ny * twoPi * 3.7 + 1.5);
  return 0.5 + 0.5 * Math.max(-1, Math.min(1, s));
}

/** Higher-frequency sines — blobs plus localisés, moins “partout”. */
function plasmaTightPhase(row: number, col: number, rows: number, cols: number, phase: number): number {
  if (rows <= 1 && cols <= 1) {
    return 0.5;
  }
  const nx = cols > 1 ? col / (cols - 1) : 0.5;
  const ny = rows > 1 ? row / (rows - 1) : 0.5;
  const twoPi = Math.PI * 2;
  const s =
    0.24 * Math.sin(nx * twoPi * 5.2 + ny * twoPi * 3.1 + phase) +
    0.22 * Math.sin(nx * twoPi * 7.3 - ny * twoPi * 4.4 + phase * 1.3) +
    0.2 * Math.sin((nx * 1.7 + ny) * twoPi * 4.8 + 0.5) +
    0.18 * Math.sin(nx * twoPi * 9.1 + ny * twoPi * 2.2) +
    0.16 * Math.sin((nx + ny * 0.9) * twoPi * 6.7 + phase * 0.7);
  return 0.5 + 0.5 * Math.max(-1, Math.min(1, s));
}

function sweepThresholdWithBlend(
  basePhase: number,
  row: number,
  col: number,
  rows: number,
  cols: number,
  columnSweepBlend: number,
): number {
  const denom = Math.max(cols - 1, 1);
  const blend = Math.max(0, Math.min(1, columnSweepBlend));
  const colBase = cols > 1 ? (cols - 1 - col) / denom : 0;
  const w = waveSweepPerturbation(row, col, rows, cols);
  const legacySweep = Math.max(0, Math.min(1, colBase + LEGACY_COLUMN_JITTER * w));
  const t = (1 - blend) * basePhase + blend * legacySweep;
  return Math.max(0, Math.min(1, t));
}

function hash01(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 0x9e37_79b1) ^ Math.imul(y, 0x85eb_ca6b) ^ seed) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb_352d);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * Picks a mask uniformly at random (pass `Math.random` or a seeded RNG).
 */
export function pickRandomCellPatternMask(rng: () => number = Math.random): CellPatternMaskId {
  const i = Math.floor(rng() * CELL_PATTERN_MASK_IDS.length);
  return CELL_PATTERN_MASK_IDS[Math.min(i, CELL_PATTERN_MASK_IDS.length - 1)];
}

/**
 * Precomputes per-cell thresholds for the given mask, column blend, and pixel block size.
 */
export function precomputeMaskThresholds(
  maskId: CellPatternMaskId,
  seed: number,
  rows: number,
  cols: number,
  columnSweepBlend: number = CELL_PATTERN_CROSSFADE_DEFAULTS.sweepWaveMix,
  pixelBlockSize: number = CELL_PATTERN_CROSSFADE_DEFAULTS.pixelBlockSize,
): Float32Array {
  const rng = mulberry32(seed);
  const out = new Float32Array(rows * cols);
  const n = rows * cols;
  const block = Math.max(1, Math.floor(Number(pixelBlockSize)) || 1);

  const fillRaw = (getRaw: (row: number, col: number) => number): void => {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const raw = getRaw(row, col);
        out[row * cols + col] = sweepThresholdWithBlend(raw, row, col, rows, cols, columnSweepBlend);
      }
    }
  };

  switch (maskId) {
    case "plasma":
      fillRaw((row, col) => cloudMaskPhase(row, col, rows, cols));
      break;
    case "plasma_tight": {
      const phase = rng() * Math.PI * 2;
      fillRaw((row, col) => plasmaTightPhase(row, col, rows, cols, phase));
      break;
    }
    case "spiral": {
      const cx = (0.15 + rng() * 0.7) * Math.max(0, cols - 1);
      const cy = (0.15 + rng() * 0.7) * Math.max(0, rows - 1);
      const wind = 0.4 + rng() * 1.6;
      fillRaw((row, col) => {
        const dx = col - cx;
        const dy = row - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(dy, dx);
        const raw = (ang + Math.PI) / (2 * Math.PI) + wind * Math.log(r + 1.15);
        return raw - Math.floor(raw);
      });
      break;
    }
    case "snake_rows": {
      let order = 0;
      for (let row = 0; row < rows; row++) {
        if (row % 2 === 0) {
          for (let col = 0; col < cols; col++) {
            const raw = n <= 1 ? 0 : order++ / (n - 1);
            out[row * cols + col] = sweepThresholdWithBlend(raw, row, col, rows, cols, columnSweepBlend);
          }
        } else {
          for (let col = cols - 1; col >= 0; col--) {
            const raw = n <= 1 ? 0 : order++ / (n - 1);
            out[row * cols + col] = sweepThresholdWithBlend(raw, row, col, rows, cols, columnSweepBlend);
          }
        }
      }
      break;
    }
    case "snake_cols": {
      let order = 0;
      for (let col = 0; col < cols; col++) {
        if (col % 2 === 0) {
          for (let row = 0; row < rows; row++) {
            const raw = n <= 1 ? 0 : order++ / (n - 1);
            out[row * cols + col] = sweepThresholdWithBlend(raw, row, col, rows, cols, columnSweepBlend);
          }
        } else {
          for (let row = rows - 1; row >= 0; row--) {
            const raw = n <= 1 ? 0 : order++ / (n - 1);
            out[row * cols + col] = sweepThresholdWithBlend(raw, row, col, rows, cols, columnSweepBlend);
          }
        }
      }
      break;
    }
    case "radial_burst": {
      const cx = (0.1 + rng() * 0.8) * Math.max(0, cols - 1);
      const cy = (0.1 + rng() * 0.8) * Math.max(0, rows - 1);
      const maxR = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(cols - 1 - cx, cy),
        Math.hypot(cx, rows - 1 - cy),
        Math.hypot(cols - 1 - cx, rows - 1 - cy),
      );
      fillRaw((row, col) => {
        const d = Math.hypot(col - cx, row - cy);
        return maxR < 1e-6 ? 0 : d / maxR;
      });
      break;
    }
    case "diamond": {
      const cx = (0.1 + rng() * 0.8) * Math.max(0, cols - 1);
      const cy = (0.1 + rng() * 0.8) * Math.max(0, rows - 1);
      let maxM = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const m = Math.abs(c - cx) + Math.abs(r - cy);
          if (m > maxM) {
            maxM = m;
          }
        }
      }
      fillRaw((row, col) => {
        const m = Math.abs(col - cx) + Math.abs(row - cy);
        return maxM < 1e-6 ? 0 : m / maxM;
      });
      break;
    }
    case "curtain_horizontal": {
      const cy = (0.2 + rng() * 0.6) * Math.max(0, rows - 1);
      const half = Math.max(rows / 2, 1e-6);
      fillRaw((row, _col) => Math.min(1, Math.abs(row - cy) / half));
      break;
    }
    case "curtain_vertical": {
      const cx = (0.2 + rng() * 0.6) * Math.max(0, cols - 1);
      const half = Math.max(cols / 2, 1e-6);
      fillRaw((_row, col) => Math.min(1, Math.abs(col - cx) / half));
      break;
    }
    case "diagonal_wipe": {
      const flip = rng() < 0.5;
      const sumMax = cols + rows - 2;
      fillRaw((row, col) => {
        const s = flip ? col + (rows - 1 - row) : col + row;
        return sumMax <= 0 ? 0 : s / sumMax;
      });
      break;
    }
    case "random_shuffle": {
      const idx = new Uint32Array(n);
      for (let i = 0; i < n; i++) {
        idx[i] = i;
      }
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = idx[i];
        idx[i] = idx[j];
        idx[j] = t;
      }
      const rank = new Uint32Array(n);
      for (let i = 0; i < n; i++) {
        rank[idx[i]] = i;
      }
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          const raw = n <= 1 ? 0 : rank[i] / (n - 1);
          out[i] = sweepThresholdWithBlend(raw, row, col, rows, cols, columnSweepBlend);
        }
      }
      break;
    }
    case "hash_dissolve":
      fillRaw((row, col) => hash01(col, row, seed));
      break;
    default: {
      const _exhaustive: never = maskId;
      throw new Error(`Unknown cell pattern mask: ${_exhaustive}`);
    }
  }

  if (block <= 1) {
    return out;
  }

  const blocksR = Math.ceil(rows / block);
  const blocksC = Math.ceil(cols / block);
  const blockThresholds = new Float32Array(blocksR * blocksC);

  for (let br = 0; br < blocksR; br++) {
    for (let bc = 0; bc < blocksC; bc++) {
      const row = Math.min(rows - 1, br * block + Math.floor((block - 1) / 2));
      const col = Math.min(cols - 1, bc * block + Math.floor((block - 1) / 2));
      blockThresholds[br * blocksC + bc] = out[row * cols + col];
    }
  }

  for (let row = 0; row < rows; row++) {
    const br = Math.floor(row / block);
    for (let col = 0; col < cols; col++) {
      const bc = Math.floor(col / block);
      out[row * cols + col] = blockThresholds[br * blocksC + bc];
    }
  }

  return out;
}
