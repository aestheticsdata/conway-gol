import { CELL_STATE } from "@cell/constants";

import type { RandomPresetSeedContext } from "../randomPresetTypes";

export function seedRings(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
): void {
  const baseSpacing = context.randomizedLayout ? 3 + context.rng() * 3 : 4;
  const spacing = baseSpacing / Math.max(0.01, context.density);
  const phaseShift = context.randomizedLayout ? context.rng() * spacing : 0;

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = col - context.cx;
      const dy = row - context.cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const phase = ((radius + phaseShift) / spacing) % 1;
      buffer[idx++] = phase < context.density ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }
}

export function seedStripes(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
): void {
  const base = context.randomizedLayout ? 3 + Math.floor(context.rng() * 3) : 4;
  const period = Math.max(base, Math.round(base / Math.max(0.01, context.density)));
  const vertical = context.randomizedLayout ? context.rng() < 0.5 : false;

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const coordinate = vertical ? col : row;
      buffer[idx++] = coordinate % period < base ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }
}

export function seedChecker(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
): void {
  if (context.density <= 0) {
    buffer.fill(CELL_STATE.DEAD);
    return;
  }

  if (context.density >= 1) {
    buffer.fill(CELL_STATE.ALIVE);
    return;
  }

  const maxScale = context.randomizedLayout ? 4 + Math.floor(context.rng() * 6) : 6;
  const scale = Math.max(1, Math.round(maxScale * (1 - context.density) + 1));
  const shift = context.randomizedLayout ? Math.floor(context.rng() * 2) : 0;

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const blockRow = Math.floor(row / scale);
      const blockCol = Math.floor(col / scale);
      const isEven = (blockRow + blockCol + shift) % 2 === 0;
      let hash = (blockRow * 1597 + blockCol * 31337) >>> 0;
      hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
      hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
      hash = (hash ^ (hash >>> 16)) >>> 0;
      const blockValue = (hash / 4294967296) * 0.5;
      const cellValue = isEven ? blockValue : blockValue + 0.5;
      buffer[idx++] = cellValue < context.density ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }
}

export function seedDiagonal(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
): void {
  const base = context.randomizedLayout ? 2 + Math.floor(context.rng() * 3) : 4;
  const period = Math.max(base, Math.round(base / Math.max(0.01, context.density)));
  const offset = context.randomizedLayout ? Math.floor(context.rng() * period) : 0;

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const diagonal = (row + col + offset) % period;
      buffer[idx++] = diagonal < base ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }
}

export function seedCross(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  context: RandomPresetSeedContext,
): void {
  const halfSide = Math.min(rows, cols) / 2;
  const jitter = context.randomizedLayout ? 0.6 + context.rng() * 0.8 : 1;
  const thickness = Math.max(0, Math.round(halfSide * context.density * jitter));

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const onHorizontal = Math.abs(row - context.cy) < thickness;
      const onVertical = Math.abs(col - context.cx) < thickness;
      const onCross = onHorizontal || onVertical;
      const hole = context.randomizedLayout && onCross && context.rng() < 0.08;
      buffer[idx++] = onCross && !hole ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }
}
