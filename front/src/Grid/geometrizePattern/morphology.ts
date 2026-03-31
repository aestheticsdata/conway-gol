import { CELL_STATE } from "@cell/constants";
import { cloneGrid } from "@grid/geometrizePattern/cloneGrid";
import { mirrorHorizontalUnion, mirrorVerticalUnion } from "@grid/geometrizePattern/symmetry";

export function dilateAlive(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] > 0) {
        out[r][c] = CELL_STATE.ALIVE;
        continue;
      }
      let nbr = false;
      for (let dr = -1; dr <= 1 && !nbr; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr][cc] > 0) {
            nbr = true;
          }
        }
      }
      out[r][c] = nbr ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }
  return out;
}

export function erodeAlive(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] <= 0) {
        out[r][c] = CELL_STATE.DEAD;
        continue;
      }
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr][cc] > 0) n++;
        }
      }
      out[r][c] = n >= 2 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
    }
  }
  return out;
}

export function applyBilateralOrder(g: number[][], verticalFirst: boolean): number[][] {
  return verticalFirst ? mirrorHorizontalUnion(mirrorVerticalUnion(g)) : mirrorVerticalUnion(mirrorHorizontalUnion(g));
}
