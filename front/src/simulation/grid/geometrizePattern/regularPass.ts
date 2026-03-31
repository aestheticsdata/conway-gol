import { CELL_STATE } from "@cell/constants";
import { cloneGrid } from "@grid/geometrizePattern/cloneGrid";
import { randomInt } from "@grid/geometrizePattern/randomInt";
import { maskCheckerboard } from "@grid/geometrizePattern/stripes";

import type { GeometrizeRng } from "@grid/geometrizePattern/types";

// ── Regular removal / addition (lines, lattice, diagonals, rings) ───────────

/** Clear whole rows on a fixed period (horizontal scan lines). */
export function punchHorizontalLines(grid: number[][], period: number, phase: number): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const p = Math.max(2, period);
  const ph = ((phase % p) + p) % p;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    if ((r + ph) % p === 0) {
      for (let c = 0; c < cols; c++) {
        out[r][c] = CELL_STATE.DEAD;
      }
    }
  }
  return out;
}

/** Clear whole columns on a fixed period. */
export function punchVerticalLines(grid: number[][], period: number, phase: number): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const p = Math.max(2, period);
  const ph = ((phase % p) + p) % p;
  const out = cloneGrid(grid);
  for (let c = 0; c < cols; c++) {
    if ((c + ph) % p === 0) {
      for (let r = 0; r < rows; r++) {
        out[r][c] = CELL_STATE.DEAD;
      }
    }
  }
  return out;
}

/** Clear NW–SE diagonals: (r + c) ≡ phase (mod period). */
export function punchDiagonalNWSE(grid: number[][], period: number, phase: number): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const p = Math.max(2, period);
  const ph = ((phase % p) + p) % p;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c + ph) % p === 0) {
        out[r][c] = CELL_STATE.DEAD;
      }
    }
  }
  return out;
}

/** Clear NE–SW diagonals: (r − c) ≡ phase (mod period). */
export function punchDiagonalNESW(grid: number[][], period: number, phase: number): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const p = Math.max(2, period);
  const ph = ((phase % p) + p) % p;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r - c + ph + p * 1024) % p === 0) {
        out[r][c] = CELL_STATE.DEAD;
      }
    }
  }
  return out;
}

/** Chebyshev distance from center: clear ring lines every `period`. */
export function punchChebyshevRings(grid: number[][], period: number): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const p = Math.max(2, period);
  const cy = (rows - 1) / 2;
  const cx = (cols - 1) / 2;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = Math.max(Math.abs(r - cy), Math.abs(c - cx));
      if (Math.floor(d) % p === 0) {
        out[r][c] = CELL_STATE.DEAD;
      }
    }
  }
  return out;
}

/** Keep only cells on a rectangular lattice (remove everything else). */
export function keepLatticeOnly(
  grid: number[][],
  stepR: number,
  stepC: number,
  offsetR: number,
  offsetC: number,
): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const sr = Math.max(2, stepR);
  const sc = Math.max(2, stepC);
  const or = ((offsetR % sr) + sr) % sr;
  const oc = ((offsetC % sc) + sc) % sc;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = r % sr === or && c % sc === oc;
      if (!on) {
        out[r][c] = CELL_STATE.DEAD;
      }
    }
  }
  return out;
}

/** OR: turn on every lattice node (adds cells on a regular grid). */
export function addLatticeSeeds(
  grid: number[][],
  stepR: number,
  stepC: number,
  offsetR: number,
  offsetC: number,
): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const sr = Math.max(2, stepR);
  const sc = Math.max(2, stepC);
  const or = ((offsetR % sr) + sr) % sr;
  const oc = ((offsetC % sc) + sc) % sc;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r % sr === or && c % sc === oc) {
        out[r][c] = CELL_STATE.ALIVE;
      }
    }
  }
  return out;
}

/** Add alive along NW–SE diagonals on a period. */
export function addDiagonalNWSE(grid: number[][], period: number, phase: number): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const p = Math.max(2, period);
  const ph = ((phase % p) + p) % p;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c + ph) % p === 0) {
        out[r][c] = CELL_STATE.ALIVE;
      }
    }
  }
  return out;
}

/** Add alive on Chebyshev rings from center. */
export function addChebyshevRings(grid: number[][], period: number): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const p = Math.max(2, period);
  const cy = (rows - 1) / 2;
  const cx = (cols - 1) / 2;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = Math.max(Math.abs(r - cy), Math.abs(c - cx));
      if (Math.floor(d) % p === 0) {
        out[r][c] = CELL_STATE.ALIVE;
      }
    }
  }
  return out;
}

/** Brick / honeycomb mask: remove one of the two interleaved sub-lattices. */
export function maskBrickSubLattice(grid: number[][], mode: "even-rows" | "odd-cols" | "xor"): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = cloneGrid(grid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let kill = false;
      if (mode === "even-rows") {
        kill = r % 2 === 0;
      } else if (mode === "odd-cols") {
        kill = c % 2 === 1;
      } else {
        kill = (r % 2 === 0) === (c % 2 === 0);
      }
      if (kill) {
        out[r][c] = CELL_STATE.DEAD;
      }
    }
  }
  return out;
}

/** One random regular pass: punch, lattice keep/add, diagonals, rings, brick. */
export function applyRandomRegularPass(grid: number[][], rng: GeometrizeRng): number[][] {
  const kind = randomInt(rng, 0, 15);
  switch (kind) {
    case 0:
      return punchHorizontalLines(grid, randomInt(rng, 2, 7), randomInt(rng, 0, 4));
    case 1:
      return punchVerticalLines(grid, randomInt(rng, 2, 7), randomInt(rng, 0, 4));
    case 2:
      return punchDiagonalNWSE(grid, randomInt(rng, 3, 7), randomInt(rng, 0, 3));
    case 3:
      return punchDiagonalNESW(grid, randomInt(rng, 3, 7), randomInt(rng, 0, 3));
    case 4:
      return punchChebyshevRings(grid, randomInt(rng, 3, 8));
    case 5:
      return keepLatticeOnly(
        grid,
        randomInt(rng, 3, 8),
        randomInt(rng, 3, 8),
        randomInt(rng, 0, 3),
        randomInt(rng, 0, 3),
      );
    case 6:
      return addLatticeSeeds(
        grid,
        randomInt(rng, 4, 10),
        randomInt(rng, 4, 10),
        randomInt(rng, 0, 3),
        randomInt(rng, 0, 3),
      );
    case 7:
      return addDiagonalNWSE(grid, randomInt(rng, 3, 8), randomInt(rng, 0, 3));
    case 8:
      return addChebyshevRings(grid, randomInt(rng, 4, 9));
    case 9: {
      const modes: Array<"even-rows" | "odd-cols" | "xor"> = ["even-rows", "odd-cols", "xor"];
      return maskBrickSubLattice(grid, modes[randomInt(rng, 0, 2)] ?? "xor");
    }
    case 10:
      return punchHorizontalLines(
        punchVerticalLines(grid, randomInt(rng, 3, 6), randomInt(rng, 0, 2)),
        randomInt(rng, 3, 6),
        randomInt(rng, 0, 2),
      );
    case 11:
      return maskCheckerboard(grid, rng() < 0.5 ? 0 : 1);
    case 12:
      return addLatticeSeeds(
        punchDiagonalNWSE(grid, randomInt(rng, 4, 7), 0),
        randomInt(rng, 5, 11),
        randomInt(rng, 5, 11),
        0,
        0,
      );
    case 13:
      return addChebyshevRings(punchChebyshevRings(grid, randomInt(rng, 4, 7)), randomInt(rng, 3, 6));
    case 14:
      return punchDiagonalNESW(
        punchDiagonalNWSE(grid, randomInt(rng, 4, 6), randomInt(rng, 0, 2)),
        randomInt(rng, 4, 6),
        randomInt(rng, 0, 2),
      );
    default:
      return punchHorizontalLines(grid, randomInt(rng, 2, 5), randomInt(rng, 0, 3));
  }
}
