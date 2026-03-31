import { CELL_STATE } from "@cell/constants";

import type { RandomPresetSeedContext } from "../randomPresetTypes";

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------

const STAR_MOTIFS = [
  [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ],
  [
    [0, 0],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ],
  [
    [0, 0],
    [-1, 0],
    [-2, 0],
    [1, 0],
    [2, 0],
    [0, -1],
    [0, -2],
    [0, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ],
  [
    [0, 0],
    [0, -2],
    [-1, -1],
    [-2, 0],
    [-1, 1],
    [0, 2],
    [1, 1],
    [2, 0],
    [1, -1],
  ],
  [
    [0, 0],
    [-2, 0],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
    [2, 0],
  ],
  [
    [0, 0],
    [-1, -1],
    [-2, -2],
    [1, 1],
    [2, 2],
    [-1, 1],
    [-2, 2],
    [1, -1],
    [2, -2],
  ],
] as const;

function stampStarMotif(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  centerRow: number,
  centerCol: number,
  motif: readonly (readonly [number, number])[],
  quarterTurns: number,
): void {
  const rotation = ((quarterTurns % 4) + 4) % 4;

  for (const [baseDr, baseDc] of motif) {
    let dr = baseDr;
    let dc = baseDc;

    for (let turn = 0; turn < rotation; turn++) {
      const nextDr = -dc;
      const nextDc = dr;
      dr = nextDr;
      dc = nextDc;
    }

    const row = centerRow + dr;
    const col = centerCol + dc;
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      buffer[row * cols + col] = CELL_STATE.ALIVE;
    }
  }
}

export function seedStars(buffer: Uint8Array, rows: number, cols: number, context: RandomPresetSeedContext): void {
  buffer.fill(CELL_STATE.DEAD);

  const baseCount = Math.round((rows * cols) / 4);
  const numStars = Math.round(baseCount * context.density);

  for (let index = 0; index < numStars; index++) {
    const row = Math.floor(context.rng() * rows);
    const col = Math.floor(context.rng() * cols);
    const motif = Math.floor(context.rng() * STAR_MOTIFS.length);
    const rotation = Math.floor(context.rng() * 4);
    stampStarMotif(buffer, rows, cols, row, col, STAR_MOTIFS[motif], rotation);
  }
}

// ---------------------------------------------------------------------------
// Circles
// ---------------------------------------------------------------------------

export function seedCircles(buffer: Uint8Array, rows: number, cols: number, context: RandomPresetSeedContext): void {
  buffer.fill(CELL_STATE.DEAD);

  const baseCount = Math.round((rows * cols) / 250);
  const numCircles = Math.max(0, Math.round(baseCount * context.density));
  if (numCircles === 0) {
    return;
  }

  const maxRadius = Math.min(rows, cols) * 0.13;

  for (let index = 0; index < numCircles; index++) {
    const centerRow = context.rng() * rows;
    const centerCol = context.rng() * cols;
    const radius = 3 + context.rng() * maxRadius;
    const filled = context.rng() < 0.5;

    const rowStart = Math.max(0, Math.floor(centerRow - radius - 2));
    const rowEnd = Math.min(rows - 1, Math.ceil(centerRow + radius + 2));
    const colStart = Math.max(0, Math.floor(centerCol - radius - 2));
    const colEnd = Math.min(cols - 1, Math.ceil(centerCol + radius + 2));

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        const distance = Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2);
        if (filled ? distance <= radius : Math.abs(distance - radius) <= 1.5) {
          buffer[row * cols + col] = CELL_STATE.ALIVE;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Sine waves
// ---------------------------------------------------------------------------

export function seedSinus(buffer: Uint8Array, rows: number, cols: number, context: RandomPresetSeedContext): void {
  const margin = rows * 0.06;
  const usableHeight = rows - 2 * margin;
  const baseWaves = context.randomizedLayout ? 15 + Math.floor(context.rng() * 25) : 40;
  const numWaves = Math.max(0, Math.round(baseWaves * context.density));
  const frequency = context.randomizedLayout ? 0.05 + context.rng() * 0.28 : (3 * 2 * Math.PI) / Math.max(cols, 1);
  const amplitude = context.randomizedLayout ? 5 + context.rng() * 20 : 12;
  const band = context.randomizedLayout ? 1 + Math.floor(context.rng() * 2) : 2;
  const baseRows: number[] = [];
  const phases: number[] = [];

  for (let wave = 0; wave < numWaves; wave++) {
    if (context.randomizedLayout) {
      baseRows.push(margin + context.rng() * usableHeight);
      phases.push(context.rng() * Math.PI * 2);
    } else {
      baseRows.push(margin + (usableHeight * (wave + 1)) / (numWaves + 1));
      phases.push((wave * 2 * Math.PI) / Math.max(1, numWaves));
    }
  }

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let alive = false;
      for (let wave = 0; wave < numWaves; wave++) {
        const curve = baseRows[wave] + amplitude * Math.sin(frequency * col + phases[wave]);
        if (Math.abs(row - curve) <= band) {
          alive = true;
          break;
        }
      }
      buffer[idx++] = alive ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }
}

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

export function seedClusters(buffer: Uint8Array, rows: number, cols: number, context: RandomPresetSeedContext): void {
  if (context.density <= 0) {
    buffer.fill(CELL_STATE.DEAD);
    return;
  }

  if (!context.randomizedLayout) {
    const steps = Math.max(1, Math.round(14 * context.density));
    const radius = Math.max(rows, cols) / (steps * 0.9);
    const centers: { r: number; c: number; radius: number }[] = [];

    for (let row = 0; row < steps; row++) {
      for (let col = 0; col < steps; col++) {
        centers.push({
          r: ((row + 0.5) * rows) / steps,
          c: ((col + 0.5) * cols) / steps,
          radius,
        });
      }
    }

    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let falloff = 0;
        for (const center of centers) {
          const distance2 = (row - center.r) ** 2 + (col - center.c) ** 2;
          const radius2 = center.radius * center.radius;
          if (distance2 < radius2) {
            falloff = Math.max(falloff, 1 - distance2 / radius2);
          }
        }
        buffer[idx++] = falloff > 0.2 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      }
    }
    return;
  }

  const baseCount = 40 + Math.floor(context.rng() * 30);
  const count = Math.round(baseCount * context.density);
  const centers: { r: number; c: number; radius: number }[] = [];

  for (let index = 0; index < count; index++) {
    centers.push({
      r: context.rng() * rows,
      c: context.rng() * cols,
      radius: 6 + context.rng() * 14,
    });
  }

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let falloff = 0;
      for (const center of centers) {
        const distance2 = (row - center.r) ** 2 + (col - center.c) ** 2;
        const radius2 = center.radius * center.radius;
        if (distance2 < radius2) {
          falloff = Math.max(falloff, 1 - distance2 / radius2);
        }
      }
      buffer[idx++] = falloff > 0 && context.rng() < 0.22 + 0.72 * falloff ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }
}
