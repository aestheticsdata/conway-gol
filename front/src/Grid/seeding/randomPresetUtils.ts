import { CELL_STATE } from "@cell/constants";

import type { RandomPresetId } from "@grid/randomPresets";

function presetSeed(preset: RandomPresetId): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < preset.length; i++) {
    h ^= preset.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createPresetRng(preset: RandomPresetId, randomVariation: boolean, seed: number | null): () => number {
  if (seed !== null) {
    return mulberry32(seed >>> 0);
  }

  return randomVariation ? () => Math.random() : mulberry32(presetSeed(preset));
}

export function fillRect(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  topRow: number,
  leftCol: number,
  height: number,
  width: number,
): void {
  if (height <= 0 || width <= 0) {
    return;
  }

  const rowStart = Math.max(0, Math.floor(topRow));
  const colStart = Math.max(0, Math.floor(leftCol));
  const rowEnd = Math.min(rows - 1, Math.ceil(topRow + height - 1));
  const colEnd = Math.min(cols - 1, Math.ceil(leftCol + width - 1));

  if (rowStart > rowEnd || colStart > colEnd) {
    return;
  }

  for (let row = rowStart; row <= rowEnd; row++) {
    buffer.fill(CELL_STATE.ALIVE, row * cols + colStart, row * cols + colEnd + 1);
  }
}

export function drawOrthogonalSegment(
  buffer: Uint8Array,
  rows: number,
  cols: number,
  row0: number,
  col0: number,
  row1: number,
  col1: number,
  thickness: number,
): void {
  const band = Math.max(0, Math.floor(thickness / 2));

  if (row0 === row1) {
    fillRect(buffer, rows, cols, row0 - band, Math.min(col0, col1), band * 2 + 1, Math.abs(col1 - col0) + 1);
    return;
  }

  if (col0 === col1) {
    fillRect(buffer, rows, cols, Math.min(row0, row1), col0 - band, Math.abs(row1 - row0) + 1, band * 2 + 1);
    return;
  }

  const steps = Math.max(Math.abs(row1 - row0), Math.abs(col1 - col0));
  if (steps === 0) {
    fillRect(buffer, rows, cols, row0 - band, col0 - band, band * 2 + 1, band * 2 + 1);
    return;
  }

  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const row = Math.round(row0 + (row1 - row0) * t);
    const col = Math.round(col0 + (col1 - col0) * t);
    fillRect(buffer, rows, cols, row - band, col - band, band * 2 + 1, band * 2 + 1);
  }
}
