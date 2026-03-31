import { CELL_STATE } from "@cell/constants";
import { cloneGrid } from "@grid/geometrizePattern/cloneGrid";

export function coarsenBlock2x2Majority(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  for (let br = 0; br + 1 < rows; br += 2) {
    for (let bc = 0; bc + 1 < cols; bc += 2) {
      let sum = 0;
      for (let dr = 0; dr < 2; dr++) {
        for (let dc = 0; dc < 2; dc++) {
          sum += grid[br + dr][bc + dc] > 0 ? 1 : 0;
        }
      }
      const alive = sum >= 2 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      for (let dr = 0; dr < 2; dr++) {
        for (let dc = 0; dc < 2; dc++) {
          out[br + dr][bc + dc] = alive;
        }
      }
    }
  }
  return out;
}

export function coarsenBlock3x3Majority(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  for (let br = 0; br + 2 < rows; br += 3) {
    for (let bc = 0; bc + 2 < cols; bc += 3) {
      let sum = 0;
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          sum += grid[br + dr][bc + dc] > 0 ? 1 : 0;
        }
      }
      const alive = sum >= 5 ? CELL_STATE.ALIVE : CELL_STATE.DEAD;
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          out[br + dr][bc + dc] = alive;
        }
      }
    }
  }
  return out;
}
