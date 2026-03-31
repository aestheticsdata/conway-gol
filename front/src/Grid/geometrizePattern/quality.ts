import { cloneGrid } from "@grid/geometrizePattern/cloneGrid";
import { coarsenBlock2x2Majority } from "@grid/geometrizePattern/coarsen";
import { erodeAlive } from "@grid/geometrizePattern/morphology";
import { randomInt } from "@grid/geometrizePattern/randomInt";
import { punchDiagonalNWSE, punchHorizontalLines } from "@grid/geometrizePattern/regularPass";
import { maskCheckerboard } from "@grid/geometrizePattern/stripes";
import { mirrorHorizontalUnion, mirrorVerticalUnion } from "@grid/geometrizePattern/symmetry";

import type { GeometrizeRng } from "@grid/geometrizePattern/types";

function aliveDensity(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return 0;
  let alive = 0;
  const total = rows * cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] > 0) alive++;
    }
  }
  return alive / total;
}

function fractionUniformColumns(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (cols === 0) return 1;
  let uniform = 0;
  for (let c = 0; c < cols; c++) {
    const v0 = grid[0][c];
    let u = true;
    for (let r = 1; r < rows; r++) {
      if (grid[r][c] !== v0) {
        u = false;
        break;
      }
    }
    if (u) uniform++;
  }
  return uniform / cols;
}

function fractionUniformRows(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows === 0) return 1;
  let uniform = 0;
  for (let r = 0; r < rows; r++) {
    const v0 = grid[r][0];
    let u = true;
    for (let c = 1; c < cols; c++) {
      if (grid[r][c] !== v0) {
        u = false;
        break;
      }
    }
    if (u) uniform++;
  }
  return uniform / rows;
}

function horizontalBoundaryCount(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (grid[r][c] !== grid[r][c + 1]) n++;
    }
  }
  return n;
}

function verticalBoundaryCount(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  let n = 0;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== grid[r + 1][c]) n++;
    }
  }
  return n;
}

/**
 * Rejects empty, almost-full boards, and patterns that are mostly uniform columns/rows
 * (vertical/horizontal slabs) or boundary graphs dominated by vertical edges (fence-like).
 */
export function isGeometrizeResultAcceptable(grid: number[][]): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return false;
  const d = aliveDensity(grid);
  if (d <= 0) return false;
  if (d > 0.82) return false;

  const minDim = Math.min(rows, cols);
  if (minDim >= 14) {
    if (fractionUniformColumns(grid) > 0.6) return false;
    if (fractionUniformRows(grid) > 0.6) return false;
    const hb = horizontalBoundaryCount(grid);
    const vb = verticalBoundaryCount(grid);
    const b = hb + vb;
    if (b > 80 && hb / b < 0.29) {
      return false;
    }
  }
  return true;
}

/** Break up near-solid fills and slab-like layouts while keeping at least some live cells when possible. */
export function softenGeometrizeResult(grid: number[][], rng: GeometrizeRng): number[][] {
  let g = cloneGrid(grid);
  for (let pass = 0; pass < 14; pass++) {
    if (isGeometrizeResultAcceptable(g)) {
      return g;
    }
    const d = aliveDensity(g);
    if (d > 0.82) {
      g = erodeAlive(g);
      if (rng() < 0.55) {
        g = erodeAlive(g);
      }
      continue;
    }
    if (minDimAtLeast(g, 14) && (fractionUniformColumns(g) > 0.52 || fractionUniformRows(g) > 0.52)) {
      g = punchDiagonalNWSE(g, randomInt(rng, 4, 9), randomInt(rng, 0, 3));
      g = mirrorVerticalUnion(mirrorHorizontalUnion(g));
      continue;
    }
    const hb = horizontalBoundaryCount(g);
    const vb = verticalBoundaryCount(g);
    const b = hb + vb;
    if (b > 60 && hb / (b + 1e-9) < 0.32) {
      g = punchHorizontalLines(g, randomInt(rng, 2, 6), randomInt(rng, 0, 3));
      continue;
    }
    g = coarsenBlock2x2Majority(g);
  }
  if (!isGeometrizeResultAcceptable(g)) {
    g = maskCheckerboard(g, rng() < 0.5 ? 0 : 1);
    if (aliveDensity(g) > 0.85) {
      g = erodeAlive(g);
    }
  }
  return g;
}

function minDimAtLeast(grid: number[][], n: number): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return Math.min(rows, cols) >= n;
}
