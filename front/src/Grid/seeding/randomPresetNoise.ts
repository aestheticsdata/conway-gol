import { CELL_STATE } from "@cell/constants";

import type { NoiseType, RandomPresetSeedContext } from "./randomPresetTypes";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep01(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function fillValueNoise(mask: Float32Array, rows: number, cols: number, rng: () => number, scale = 10): void {
  const gRows = Math.ceil(rows / scale) + 2;
  const gCols = Math.ceil(cols / scale) + 2;
  const grid = new Float32Array(gRows * gCols);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = rng();
  }

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const gx = col / scale;
      const gy = row / scale;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = gx - x0;
      const fy = gy - y0;
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      const x1 = Math.min(x0 + 1, gCols - 1);
      const y1 = Math.min(y0 + 1, gRows - 1);
      const v00 = grid[y0 * gCols + x0];
      const v10 = grid[y0 * gCols + x1];
      const v01 = grid[y1 * gCols + x0];
      const v11 = grid[y1 * gCols + x1];
      mask[idx++] = v00 * (1 - ux) * (1 - uy) + v10 * ux * (1 - uy) + v01 * (1 - ux) * uy + v11 * ux * uy;
    }
  }
}

function fillClusterNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const numClusters = 6 + Math.floor(rng() * 10);
  const baseRadius = Math.min(rows, cols) * 0.12;
  const centers: { r: number; c: number; r2: number }[] = [];

  for (let k = 0; k < numClusters; k++) {
    const radius = baseRadius * (0.5 + rng());
    centers.push({ r: rng() * rows, c: rng() * cols, r2: radius * radius });
  }

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let minMask = 1.0;
      for (const { r, c, r2 } of centers) {
        const d2 = (row - r) ** 2 + (col - c) ** 2;
        if (d2 < r2) {
          minMask = Math.min(minMask, d2 / r2);
        }
      }
      mask[idx++] = minMask;
    }
  }
}

function fillGradientNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const angle = rng() * Math.PI * 2;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const corners = [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: -0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
  ];
  let minProjection = Number.POSITIVE_INFINITY;
  let maxProjection = Number.NEGATIVE_INFINITY;

  for (const corner of corners) {
    const projection = corner.x * ux + corner.y * uy;
    minProjection = Math.min(minProjection, projection);
    maxProjection = Math.max(maxProjection, projection);
  }

  const range = Math.max(1e-6, maxProjection - minProjection);
  let idx = 0;

  for (let row = 0; row < rows; row++) {
    const y = rows <= 1 ? 0 : row / (rows - 1) - 0.5;
    for (let col = 0; col < cols; col++) {
      const x = cols <= 1 ? 0 : col / (cols - 1) - 0.5;
      const projection = x * ux + y * uy;
      const gradient = smoothstep01((projection - minProjection) / range);
      mask[idx++] = clamp01(gradient * 0.45 + rng() * 0.55);
    }
  }
}

function fillCenterBurstNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const centerX = (cols - 1) / 2;
  const centerY = (rows - 1) / 2;
  const maxDistance = Math.max(Math.hypot(centerX, centerY), 1);
  let idx = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const distance = Math.hypot(col - centerX, row - centerY) / maxDistance;
      const bias = smoothstep01(distance);
      mask[idx++] = clamp01(bias * 0.45 + rng() * 0.55);
    }
  }
}

function fillEdgeBiasNoise(mask: Float32Array, rows: number, cols: number, rng: () => number): void {
  const maxEdgeDistance = Math.max(Math.min((rows - 1) / 2, (cols - 1) / 2), 1);
  let idx = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nearestEdge = Math.min(row, rows - 1 - row, col, cols - 1 - col) / maxEdgeDistance;
      const bias = smoothstep01(nearestEdge);
      mask[idx++] = clamp01(bias * 0.45 + rng() * 0.55);
    }
  }
}

function fillNoiseMask(mask: Float32Array, rows: number, cols: number, rng: () => number, noiseType: NoiseType): void {
  switch (noiseType) {
    case "uniform":
      for (let i = 0; i < mask.length; i++) {
        mask[i] = rng();
      }
      return;
    case "perlin-like":
      fillValueNoise(mask, rows, cols, rng);
      return;
    case "clusters":
      fillClusterNoise(mask, rows, cols, rng);
      return;
    case "gradient":
      fillGradientNoise(mask, rows, cols, rng);
      return;
    case "edge-bias":
      fillEdgeBiasNoise(mask, rows, cols, rng);
      return;
    case "center-burst":
      fillCenterBurstNoise(mask, rows, cols, rng);
      return;
  }
}

function applyLowMaskPreference(buffer: Uint8Array, mask: Float32Array, threshold: number): void {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === CELL_STATE.ALIVE && mask[i] >= threshold) {
      buffer[i] = CELL_STATE.DEAD;
    }
  }
}

export function seedNoisePreset(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
): void {
  const { density, rng, noiseType } = context;

  if (density <= 0) {
    buffer.fill(CELL_STATE.DEAD);
    return;
  }

  if (density >= 1) {
    buffer.fill(CELL_STATE.ALIVE);
    return;
  }

  const mask = new Float32Array(buffer.length);
  fillNoiseMask(mask, rows, cols, rng, noiseType);

  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = mask[i] < density ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
  }
}

export function applySpatialNoiseMask(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
): void {
  if (context.noiseType === "uniform") {
    return;
  }

  const mask = new Float32Array(rows * cols);

  if (context.noiseType === "perlin-like") {
    fillValueNoise(mask, rows, cols, context.rng, 30);
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === CELL_STATE.ALIVE && mask[i] < 0.5) {
        buffer[i] = CELL_STATE.DEAD;
      }
    }
    return;
  }

  switch (context.noiseType) {
    case "clusters":
      fillClusterNoise(mask, rows, cols, context.rng);
      applyLowMaskPreference(buffer, mask, 0.5);
      return;
    case "gradient":
      fillGradientNoise(mask, rows, cols, context.rng);
      applyLowMaskPreference(buffer, mask, 0.48);
      return;
    case "edge-bias":
      fillEdgeBiasNoise(mask, rows, cols, context.rng);
      applyLowMaskPreference(buffer, mask, 0.5);
      return;
    case "center-burst":
      fillCenterBurstNoise(mask, rows, cols, context.rng);
      applyLowMaskPreference(buffer, mask, 0.5);
      return;
  }
}
