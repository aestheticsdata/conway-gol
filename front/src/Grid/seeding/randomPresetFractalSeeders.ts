import { CELL_STATE } from "@cell/constants";
import { drawOrthogonalSegment, fillRect } from "@grid/seeding/randomPresetUtils";

import type { RandomPresetId } from "@grid/randomPresets";
import type { RandomPresetSeedContext, RandomPresetSeedFn } from "@grid/seeding/randomPresetTypes";

type FractalPresetId = Extract<RandomPresetId, "sierpinski" | "cantor" | "hilbert">;

function stampSierpinskiTriangle(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  centerCol: number,
  topRow: number,
  height: number,
  randomizedLayout: boolean,
  rng: () => number,
): void {
  for (let y = 0; y < height; y++) {
    const row = topRow + y;
    if (row < 0 || row >= rows) {
      continue;
    }

    for (let dx = -y; dx <= y; dx++) {
      if (((y + dx) & 1) !== 0) {
        continue;
      }

      const leftBranch = (y + dx) / 2;
      const rightBranch = (y - dx) / 2;
      if ((leftBranch & rightBranch) !== 0) {
        continue;
      }

      const col = centerCol + dx;
      if (col < 0 || col >= cols) {
        continue;
      }

      if (randomizedLayout && rng() < 0.015) {
        continue;
      }

      buffer[row * cols + col] = CELL_STATE.ALIVE;
    }
  }
}

function stampCantorDustPatch(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  topRow: number,
  leftCol: number,
  size: number,
  depth: number,
): void {
  if (size <= 0) {
    return;
  }

  if (depth <= 0 || size < 3) {
    fillRect(buffer, rows, cols, topRow, leftCol, size, size);
    return;
  }

  const third = Math.floor(size / 3);
  if (third < 1) {
    fillRect(buffer, rows, cols, topRow, leftCol, size, size);
    return;
  }

  stampCantorDustPatch(buffer, rows, cols, topRow, leftCol, third, depth - 1);
  stampCantorDustPatch(buffer, rows, cols, topRow, leftCol + third * 2, third, depth - 1);
  stampCantorDustPatch(buffer, rows, cols, topRow + third * 2, leftCol, third, depth - 1);
  stampCantorDustPatch(buffer, rows, cols, topRow + third * 2, leftCol + third * 2, third, depth - 1);
}

function hilbertRotate(scale: number, x: number, y: number, rx: number, ry: number): { x: number; y: number } {
  if (ry !== 0) {
    return { x, y };
  }

  let nextX = x;
  let nextY = y;

  if (rx === 1) {
    nextX = scale - 1 - nextX;
    nextY = scale - 1 - nextY;
  }

  return { x: nextY, y: nextX };
}

function hilbertIndexToPoint(order: number, index: number): { x: number; y: number } {
  const side = 1 << order;
  let x = 0;
  let y = 0;
  let t = index;

  for (let scale = 1; scale < side; scale *= 2) {
    const rx = 1 & (t >> 1);
    const ry = 1 & (t ^ rx);
    const rotated = hilbertRotate(scale, x, y, rx, ry);
    x = rotated.x + scale * rx;
    y = rotated.y + scale * ry;
    t >>= 2;
  }

  return { x, y };
}

function seedSierpinski(buffer: Uint8Array, rows: number, cols: number, context: RandomPresetSeedContext): void {
  buffer.fill(CELL_STATE.DEAD);

  if (context.density <= 0) {
    return;
  }

  const areaFactor = Math.max(1, Math.round((rows * cols) / 14000));
  const count = Math.max(1, Math.round(areaFactor * context.density * (context.randomizedLayout ? 4 : 3.2)));
  const maxHeight = Math.max(8, Math.floor(Math.min(rows * 0.72, (cols + 1) / 2)));
  const minHeight = Math.max(6, Math.floor(maxHeight * 0.16));
  const preferredHeight = Math.max(minHeight, Math.floor(maxHeight * (0.3 + context.density * 0.7)));

  for (let index = 0; index < count; index++) {
    const height = Math.max(minHeight, Math.floor(minHeight + context.rng() * (preferredHeight - minHeight + 1)));
    const reach = Math.max(0, height - 1);
    const centerMin = reach;
    const centerMax = Math.max(centerMin, cols - 1 - reach);
    const centerCol =
      centerMin >= centerMax
        ? Math.floor((cols - 1) / 2)
        : centerMin + Math.floor(context.rng() * (centerMax - centerMin + 1));
    const topLimit = Math.max(0, rows - height);
    const topRow = Math.floor(context.rng() * (topLimit + 1));

    stampSierpinskiTriangle(buffer, rows, cols, centerCol, topRow, height, context.randomizedLayout, context.rng);
  }
}

function seedCantor(buffer: Uint8Array, rows: number, cols: number, context: RandomPresetSeedContext): void {
  buffer.fill(CELL_STATE.DEAD);

  if (context.density <= 0) {
    return;
  }

  const minSide = Math.max(9, Math.floor(Math.min(rows, cols) * 0.14));
  const maxSide = Math.max(minSide, Math.floor(Math.min(rows, cols) * (0.28 + context.density * 0.44)));
  const areaFactor = Math.max(1, Math.round((rows * cols) / 18000));
  const count = Math.max(1, Math.round(areaFactor * context.density * (context.randomizedLayout ? 5 : 4)));

  for (let index = 0; index < count; index++) {
    const size = Math.max(minSide, Math.floor(minSide + context.rng() * (maxSide - minSide + 1)));
    const maxDepth = Math.max(1, Math.min(4, Math.floor(Math.log(size) / Math.log(3))));
    const depth = Math.max(1, Math.round(maxDepth * (0.55 + context.density * 0.45)));
    const topRow = Math.floor(context.rng() * Math.max(1, rows - size + 1));
    const leftCol = Math.floor(context.rng() * Math.max(1, cols - size + 1));
    stampCantorDustPatch(buffer, rows, cols, topRow, leftCol, size, depth);
  }
}

function seedHilbert(buffer: Uint8Array, rows: number, cols: number, context: RandomPresetSeedContext): void {
  buffer.fill(CELL_STATE.DEAD);

  if (context.density <= 0) {
    return;
  }

  const areaFactor = Math.max(1, Math.round((rows * cols) / 18000));
  const count = Math.max(1, Math.round(areaFactor * context.density * (context.randomizedLayout ? 3.5 : 2.8)));
  const maxSide = Math.max(16, Math.floor(Math.min(rows, cols) * (0.34 + context.density * 0.46)));
  const minSide = Math.max(12, Math.floor(maxSide * 0.4));

  for (let curve = 0; curve < count; curve++) {
    const side = Math.max(minSide, Math.floor(minSide + context.rng() * (maxSide - minSide + 1)));
    const maxOrder = Math.max(1, Math.min(6, Math.floor(Math.log2(side))));
    const order = Math.max(
      1,
      Math.min(
        maxOrder,
        Math.round(1 + context.density * (maxOrder - 1) + (context.randomizedLayout ? context.rng() * 0.75 : 0)),
      ),
    );
    const curveSide = 1 << order;
    const span = Math.max(1, side - 1);
    const thickness = Math.max(1, Math.round(span / Math.max(4, curveSide * (context.density < 0.45 ? 3 : 2))));
    const topRow = Math.floor(context.rng() * Math.max(1, rows - side + 1));
    const leftCol = Math.floor(context.rng() * Math.max(1, cols - side + 1));
    const swapAxes = context.randomizedLayout && context.rng() < 0.5;
    const flipX = context.randomizedLayout && context.rng() < 0.5;
    const flipY = context.randomizedLayout && context.rng() < 0.5;

    let previous: { row: number; col: number } | null = null;

    for (let index = 0; index < curveSide * curveSide; index++) {
      let { x, y } = hilbertIndexToPoint(order, index);

      if (swapAxes) {
        [x, y] = [y, x];
      }
      if (flipX) {
        x = curveSide - 1 - x;
      }
      if (flipY) {
        y = curveSide - 1 - y;
      }

      const row = topRow + Math.round((y * span) / Math.max(1, curveSide - 1));
      const col = leftCol + Math.round((x * span) / Math.max(1, curveSide - 1));

      if (previous !== null) {
        drawOrthogonalSegment(buffer, rows, cols, previous.row, previous.col, row, col, thickness);
      } else {
        fillRect(buffer, rows, cols, row, col, 1, 1);
      }

      previous = { row, col };
    }
  }
}

export const FRACTAL_RANDOM_PRESET_SEEDERS = {
  sierpinski: seedSierpinski,
  cantor: seedCantor,
  hilbert: seedHilbert,
} satisfies Record<FractalPresetId, RandomPresetSeedFn>;
