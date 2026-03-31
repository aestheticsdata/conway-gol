import { CELL_STATE } from "@cell/constants";
import { cloneGrid } from "@grid/geometrizePattern/cloneGrid";

export function mirrorVerticalUnion(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  const half = Math.floor(cols / 2);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < half; c++) {
      const cc = cols - 1 - c;
      const alive = grid[r][c] > 0 || grid[r][cc] > 0 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      out[r][c] = alive;
      out[r][cc] = alive;
    }
  }
  return out;
}

export function mirrorHorizontalUnion(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  const half = Math.floor(rows / 2);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < half; r++) {
      const rr = rows - 1 - r;
      const alive = grid[r][c] > 0 || grid[rr][c] > 0 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      out[r][c] = alive;
      out[rr][c] = alive;
    }
  }
  return out;
}

export function mirrorVerticalIntersect(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  const half = Math.floor(cols / 2);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < half; c++) {
      const cc = cols - 1 - c;
      const alive = grid[r][c] > 0 && grid[r][cc] > 0 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      out[r][c] = alive;
      out[r][cc] = alive;
    }
  }
  return out;
}

export function mirrorHorizontalIntersect(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  const half = Math.floor(rows / 2);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < half; r++) {
      const rr = rows - 1 - r;
      const alive = grid[r][c] > 0 && grid[rr][c] > 0 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      out[r][c] = alive;
      out[rr][c] = alive;
    }
  }
  return out;
}

/** Main diagonal: (r,c) ↔ (c,r). */
export function mirrorMainDiagonalUnion(grid: number[][]): number[][] {
  const n = grid.length;
  if (grid[0]?.length !== n) return cloneGrid(grid);
  const out = cloneGrid(grid);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const alive = grid[r][c] > 0 || grid[c][r] > 0 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      out[r][c] = alive;
      out[c][r] = alive;
    }
  }
  return out;
}

/** Anti-diagonal: (r,c) ↔ (n−1−c, n−1−r). */
export function mirrorAntiDiagonalUnion(grid: number[][]): number[][] {
  const n = grid.length;
  if (grid[0]?.length !== n) return cloneGrid(grid);
  const out = cloneGrid(grid);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const r2 = n - 1 - c;
      const c2 = n - 1 - r;
      const alive = grid[r][c] > 0 || grid[r2][c2] > 0 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      out[r][c] = alive;
      out[r2][c2] = alive;
    }
  }
  return out;
}

export function pointSymmetry180Union(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rr = rows - 1 - r;
      const cc = cols - 1 - c;
      const alive = grid[r][c] > 0 || grid[rr][cc] > 0 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      out[r][c] = alive;
      out[rr][cc] = alive;
    }
  }
  return out;
}

export function foldQuadrantUnion(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const hr = Math.floor(rows / 2);
  const hc = Math.floor(cols / 2);
  const out = cloneGrid(grid);
  for (let r = 0; r < hr; r++) {
    for (let c = 0; c < hc; c++) {
      const alive =
        grid[r][c] > 0 || grid[r][cols - 1 - c] > 0 || grid[rows - 1 - r][c] > 0 || grid[rows - 1 - r][cols - 1 - c] > 0
          ? CELL_STATE.ALIVE
          : CELL_STATE.DEAD;
      out[r][c] = alive;
      out[r][cols - 1 - c] = alive;
      out[rows - 1 - r][c] = alive;
      out[rows - 1 - r][cols - 1 - c] = alive;
    }
  }
  return out;
}

function rotate90Clockwise(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out: number[][] = Array.from({ length: cols }, () => Array.from({ length: rows }, () => CELL_STATE.DEAD));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[c][rows - 1 - r] = grid[r][c];
    }
  }
  return out;
}

export function rotateK90(grid: number[][], k: number): number[][] {
  let g = grid;
  const turns = ((k % 4) + 4) % 4;
  for (let i = 0; i < turns; i++) {
    g = rotate90Clockwise(g);
  }
  return g;
}
