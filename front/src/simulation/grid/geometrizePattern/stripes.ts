import { CELL_STATE } from "@cell/constants";
import { cloneGrid } from "@grid/geometrizePattern/cloneGrid";

import type { GeometrizeRng } from "@grid/geometrizePattern/types";

/** Band-wise bias without turning each band into a solid rectangle (avoids boring vertical slabs). */
export function stripeVerticalLoose(grid: number[][], band: number, rng: GeometrizeRng): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const w = Math.max(2, band);
  const out = cloneGrid(grid);
  for (let bc = 0; bc < cols; bc += w) {
    let sum = 0;
    let count = 0;
    for (let c = bc; c < Math.min(bc + w, cols); c++) {
      for (let r = 0; r < rows; r++) {
        sum += grid[r][c] > 0 ? 1 : 0;
        count++;
      }
    }
    const bandAlive = count > 0 && sum * 2 >= count;
    for (let c = bc; c < Math.min(bc + w, cols); c++) {
      for (let r = 0; r < rows; r++) {
        const was = grid[r][c] > 0;
        if (bandAlive) {
          out[r][c] = was || rng() < 0.2 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
        } else {
          out[r][c] = was && rng() < 0.48 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
        }
      }
    }
  }
  return out;
}

export function stripeHorizontalLoose(grid: number[][], band: number, rng: GeometrizeRng): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const h = Math.max(2, band);
  const out = cloneGrid(grid);
  for (let br = 0; br < rows; br += h) {
    let sum = 0;
    let count = 0;
    for (let r = br; r < Math.min(br + h, rows); r++) {
      for (let c = 0; c < cols; c++) {
        sum += grid[r][c] > 0 ? 1 : 0;
        count++;
      }
    }
    const bandAlive = count > 0 && sum * 2 >= count;
    for (let r = br; r < Math.min(br + h, rows); r++) {
      for (let c = 0; c < cols; c++) {
        const was = grid[r][c] > 0;
        if (bandAlive) {
          out[r][c] = was || rng() < 0.2 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
        } else {
          out[r][c] = was && rng() < 0.48 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
        }
      }
    }
  }
  return out;
}

export function maskCheckerboard(grid: number[][], phase: 0 | 1): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 !== phase) {
        out[r][c] = CELL_STATE.DEAD;
      }
    }
  }
  return out;
}
