import { CELL_STATE } from "@cell/constants";

/**
 * Stochastic geometrization: each click picks a different recipe so results stay
 * varied (symmetries, stripes, diagonals, coarsening, regular punch/add patterns, etc.).
 */

export type GeometrizeRng = () => number;

function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

function randomInt(rng: GeometrizeRng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function mirrorVerticalUnion(grid: number[][]): number[][] {
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

function mirrorHorizontalUnion(grid: number[][]): number[][] {
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

function mirrorVerticalIntersect(grid: number[][]): number[][] {
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

function mirrorHorizontalIntersect(grid: number[][]): number[][] {
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
function mirrorMainDiagonalUnion(grid: number[][]): number[][] {
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
function mirrorAntiDiagonalUnion(grid: number[][]): number[][] {
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

function pointSymmetry180Union(grid: number[][]): number[][] {
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

function foldQuadrantUnion(grid: number[][]): number[][] {
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

function rotateK90(grid: number[][], k: number): number[][] {
  let g = grid;
  const turns = ((k % 4) + 4) % 4;
  for (let i = 0; i < turns; i++) {
    g = rotate90Clockwise(g);
  }
  return g;
}

function coarsenBlock2x2Majority(grid: number[][]): number[][] {
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

function coarsenBlock3x3Majority(grid: number[][]): number[][] {
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

/** Band-wise bias without turning each band into a solid rectangle (avoids boring vertical slabs). */
function stripeVerticalLoose(grid: number[][], band: number, rng: GeometrizeRng): number[][] {
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

function stripeHorizontalLoose(grid: number[][], band: number, rng: GeometrizeRng): number[][] {
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

function maskCheckerboard(grid: number[][], phase: 0 | 1): number[][] {
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

// ── Regular removal / addition (lines, lattice, diagonals, rings) ───────────

/** Clear whole rows on a fixed period (horizontal scan lines). */
function punchHorizontalLines(grid: number[][], period: number, phase: number): number[][] {
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
function punchVerticalLines(grid: number[][], period: number, phase: number): number[][] {
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
function punchDiagonalNWSE(grid: number[][], period: number, phase: number): number[][] {
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
function punchDiagonalNESW(grid: number[][], period: number, phase: number): number[][] {
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
function punchChebyshevRings(grid: number[][], period: number): number[][] {
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
function keepLatticeOnly(grid: number[][], stepR: number, stepC: number, offsetR: number, offsetC: number): number[][] {
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
function addLatticeSeeds(grid: number[][], stepR: number, stepC: number, offsetR: number, offsetC: number): number[][] {
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
function addDiagonalNWSE(grid: number[][], period: number, phase: number): number[][] {
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
function addChebyshevRings(grid: number[][], period: number): number[][] {
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
function maskBrickSubLattice(grid: number[][], mode: "even-rows" | "odd-cols" | "xor"): number[][] {
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
function applyRandomRegularPass(grid: number[][], rng: GeometrizeRng): number[][] {
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

function dilateAlive(grid: number[][]): number[][] {
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

function erodeAlive(grid: number[][]): number[][] {
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

function applyBilateralOrder(g: number[][], verticalFirst: boolean): number[][] {
  return verticalFirst ? mirrorHorizontalUnion(mirrorVerticalUnion(g)) : mirrorVerticalUnion(mirrorHorizontalUnion(g));
}

// ── Partitioned geometrize: split grid, process regions independently, optional cross-copy ─

type Region = { r0: number; c0: number; r1: number; c1: number };

function extractRegion(grid: number[][], reg: Region): number[][] {
  const rows = reg.r1 - reg.r0 + 1;
  const cols = reg.c1 - reg.c0 + 1;
  const out: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(grid[reg.r0 + r][reg.c0 + c]);
    }
    out.push(row);
  }
  return out;
}

function pasteRegion(grid: number[][], reg: Region, patch: number[][]): void {
  for (let r = 0; r < patch.length; r++) {
    for (let c = 0; c < patch[0].length; c++) {
      grid[reg.r0 + r][reg.c0 + c] = patch[r][c];
    }
  }
}

function splitRanges(n: number, parts: number): Array<{ start: number; end: number }> {
  const p = Math.max(1, parts);
  const base = Math.floor(n / p);
  const rem = n % p;
  const out: Array<{ start: number; end: number }> = [];
  let s = 0;
  for (let i = 0; i < p; i++) {
    const len = base + (i < rem ? 1 : 0);
    const e = s + len - 1;
    out.push({ start: s, end: e });
    s = e + 1;
  }
  return out;
}

function partitionGrid(rows: number, cols: number, pr: number, pc: number): Region[] {
  const rr = splitRanges(rows, pr);
  const cc = splitRanges(cols, pc);
  const regions: Region[] = [];
  for (const r of rr) {
    for (const c of cc) {
      regions.push({ r0: r.start, c0: c.start, r1: r.end, c1: c.end });
    }
  }
  return regions;
}

function partitionQuadrants(rows: number, cols: number): Region[] {
  return partitionGrid(rows, cols, 2, 2);
}

function partitionHalvesHorizontal(rows: number, cols: number): Region[] {
  return partitionGrid(rows, cols, 2, 1);
}

function partitionHalvesVertical(rows: number, cols: number): Region[] {
  return partitionGrid(rows, cols, 1, 2);
}

function pickPartitionRegions(rows: number, cols: number, rng: GeometrizeRng): Region[] {
  const scheme = randomInt(rng, 0, 9);
  switch (scheme) {
    case 0:
      return partitionQuadrants(rows, cols);
    case 1:
      return partitionHalvesHorizontal(rows, cols);
    case 2:
      return partitionHalvesVertical(rows, cols);
    case 3:
      return partitionGrid(rows, cols, 3, 3);
    case 4:
      return partitionGrid(rows, cols, 2, 3);
    case 5:
      return partitionGrid(rows, cols, 3, 2);
    case 6:
      return partitionGrid(rows, cols, 1, 4);
    case 7:
      return partitionGrid(rows, cols, 4, 1);
    case 8:
      return partitionGrid(rows, cols, 2, 4);
    default:
      return partitionGrid(rows, cols, 4, 2);
  }
}

function flipHorizontal(patch: number[][]): number[][] {
  return patch.map((row) => [...row].reverse());
}

function flipVertical(patch: number[][]): number[][] {
  return [...patch].reverse();
}

function symmetrizeLocalPatch(patch: number[][], rng: GeometrizeRng): number[][] {
  if (patch.length < 2 || patch[0].length < 2) {
    return cloneGrid(patch);
  }
  let x = cloneGrid(patch);
  if (rng() < 0.5) {
    x = mirrorVerticalUnion(x);
    x = mirrorHorizontalUnion(x);
  } else {
    x = mirrorHorizontalUnion(x);
    x = mirrorVerticalUnion(x);
  }
  if (patch.length === patch[0].length && rng() < 0.38) {
    x = mirrorMainDiagonalUnion(x);
  }
  return x;
}

type RegionOp = "sym" | "regular" | "sym_then_regular" | "regular_then_sym" | "none";

function pickRegionOp(rng: GeometrizeRng): RegionOp {
  const r = rng();
  if (r < 0.24) return "sym";
  if (r < 0.48) return "regular";
  if (r < 0.62) return "sym_then_regular";
  if (r < 0.76) return "regular_then_sym";
  if (r < 0.86) return "none";
  return rng() < 0.5 ? "sym" : "regular";
}

function applyRegionOp(patch: number[][], op: RegionOp, rng: GeometrizeRng): number[][] {
  switch (op) {
    case "none":
      return cloneGrid(patch);
    case "sym":
      return symmetrizeLocalPatch(patch, rng);
    case "regular":
      return applyRandomRegularPass(cloneGrid(patch), rng);
    case "sym_then_regular":
      return applyRandomRegularPass(symmetrizeLocalPatch(patch, rng), rng);
    case "regular_then_sym":
      return symmetrizeLocalPatch(applyRandomRegularPass(cloneGrid(patch), rng), rng);
    default:
      return cloneGrid(patch);
  }
}

function shuffleIndices(n: number, rng: GeometrizeRng): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = randomInt(rng, 0, i);
    const t = a[i];
    const u = a[j];
    if (t === undefined || u === undefined) {
      continue;
    }
    a[i] = u;
    a[j] = t;
  }
  return a;
}

function crossRegionCopyRandom(grid: number[][], regions: Region[], rng: GeometrizeRng): void {
  if (regions.length < 2) {
    return;
  }
  const attempts = randomInt(rng, 1, Math.min(3, regions.length));
  for (let k = 0; k < attempts; k++) {
    const i = randomInt(rng, 0, regions.length - 1);
    let j = randomInt(rng, 0, regions.length - 1);
    if (j === i) {
      j = (j + 1) % regions.length;
    }
    const srcReg = regions[i];
    const dstReg = regions[j];
    if (srcReg === undefined || dstReg === undefined) {
      continue;
    }
    const src = extractRegion(grid, srcReg);
    let p = cloneGrid(src);
    const flip = randomInt(rng, 0, 3);
    if (flip === 1 || flip === 3) {
      p = flipHorizontal(p);
    }
    if (flip === 2 || flip === 3) {
      p = flipVertical(p);
    }
    const dst = dstReg;
    const dstPatch = extractRegion(grid, dst);
    if (p.length === dstPatch.length && p[0].length === dstPatch[0].length) {
      pasteRegion(grid, dst, p);
    }
  }
}

/**
 * Split into rectangles, apply independent sym / regular / combined ops per region (random),
 * optionally copy one region into another with random flips, then light global symmetrize.
 */
function geometrizePartitionedRandom(grid: number[][], rng: GeometrizeRng): number[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows < 2 || cols < 2) {
    return cloneGrid(grid);
  }
  let out = cloneGrid(grid);
  const regions = pickPartitionRegions(rows, cols, rng);
  const unified = rng() < 0.2;
  const unifiedOp: RegionOp | null = unified ? pickRegionOp(rng) : null;
  const order = shuffleIndices(regions.length, rng);
  for (const idx of order) {
    const reg = regions[idx];
    if (reg === undefined) {
      continue;
    }
    const patch = extractRegion(out, reg);
    const op = unified && unifiedOp ? unifiedOp : pickRegionOp(rng);
    const processed = applyRegionOp(patch, op, rng);
    pasteRegion(out, reg, processed);
  }
  if (rng() < 0.55) {
    crossRegionCopyRandom(out, regions, rng);
  }
  if (rng() < 0.65) {
    out = mirrorVerticalUnion(mirrorHorizontalUnion(out));
  }
  if (rng() < 0.45) {
    out = coarsenBlock2x2Majority(out);
  }
  return out;
}

type Recipe = (g: number[][], rng: GeometrizeRng) => number[][];

const RECIPES: readonly Recipe[] = [
  // Classic block + bilateral
  (g, rng) => {
    let x = cloneGrid(g);
    const vf = rng() < 0.5;
    x = applyBilateralOrder(x, vf);
    x = coarsenBlock2x2Majority(x);
    x = applyBilateralOrder(x, rng() < 0.5);
    return x;
  },
  // Quadrant + optional coarsen
  (g, rng) => {
    let x = foldQuadrantUnion(g);
    if (rng() < 0.5) x = coarsenBlock2x2Majority(x);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return x;
  },
  // Main diagonal + bilateral
  (g) => {
    let x = mirrorMainDiagonalUnion(g);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return coarsenBlock2x2Majority(x);
  },
  // Anti-diagonal + bilateral
  (g) => {
    let x = mirrorAntiDiagonalUnion(g);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return coarsenBlock2x2Majority(x);
  },
  // 180° point symmetry + stripes feel
  (g, rng) => {
    let x = pointSymmetry180Union(g);
    x = coarsenBlock2x2Majority(x);
    if (rng() < 0.5) {
      x = stripeVerticalLoose(x, randomInt(rng, 3, 7), rng);
    } else {
      x = stripeHorizontalLoose(x, randomInt(rng, 3, 7), rng);
    }
    return mirrorVerticalUnion(mirrorHorizontalUnion(x));
  },
  // Rotate then bilateral (orientation variety)
  (g, rng) => {
    const k = randomInt(rng, 0, 3);
    let x = rotateK90(g, k);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    x = coarsenBlock2x2Majority(x);
    x = rotateK90(x, (4 - k) % 4);
    return x;
  },
  // Vertical band bias + horizontal mirror (loose stripes — not solid columns)
  (g, rng) => {
    let x = stripeVerticalLoose(g, randomInt(rng, 3, 8), rng);
    x = mirrorHorizontalUnion(x);
    x = coarsenBlock2x2Majority(x);
    return x;
  },
  // Horizontal band bias + vertical mirror
  (g, rng) => {
    let x = stripeHorizontalLoose(g, randomInt(rng, 3, 8), rng);
    x = mirrorVerticalUnion(x);
    x = coarsenBlock2x2Majority(x);
    return x;
  },
  // 3×3 coarsening (chunkier than 2×2)
  (g) => {
    let x = coarsenBlock3x3Majority(g);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return coarsenBlock2x2Majority(x);
  },
  // Thin lattice (intersect) then recover a bit with dilate
  (g) => {
    let x = mirrorVerticalIntersect(mirrorHorizontalIntersect(g));
    x = dilateAlive(x);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return x;
  },
  // One-axis mirror only + coarsen (asymmetric lanes)
  (g, rng) => {
    let x = rng() < 0.5 ? mirrorVerticalUnion(g) : mirrorHorizontalUnion(g);
    x = coarsenBlock2x2Majority(x);
    if (rng() < 0.6) {
      x = rng() < 0.5 ? mirrorHorizontalUnion(x) : mirrorVerticalUnion(x);
    }
    return x;
  },
  // Checkerboard slice of bilateral mass
  (g, rng) => {
    let x = mirrorVerticalUnion(mirrorHorizontalUnion(g));
    x = coarsenBlock2x2Majority(x);
    x = maskCheckerboard(x, rng() < 0.5 ? 0 : 1);
    return mirrorVerticalUnion(mirrorHorizontalUnion(x));
  },
  // Coarsen first (different texture) then symmetrize
  (g, rng) => {
    let x = rng() < 0.5 ? coarsenBlock2x2Majority(g) : coarsenBlock3x3Majority(g);
    x = applyBilateralOrder(x, rng() < 0.5);
    x = coarsenBlock2x2Majority(x);
    return x;
  },
  // Fold quadrant + diagonal mix
  (g) => {
    let x = foldQuadrantUnion(g);
    x = mirrorMainDiagonalUnion(x);
    return coarsenBlock2x2Majority(x);
  },
  // Erosion / dilation chains
  (g, rng) => {
    let x = mirrorVerticalUnion(mirrorHorizontalUnion(g));
    const steps = randomInt(rng, 1, 2);
    for (let i = 0; i < steps; i++) {
      x = rng() < 0.5 ? erodeAlive(x) : dilateAlive(x);
    }
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return coarsenBlock2x2Majority(x);
  },
  // Random two-step mini pipeline
  (g, rng) => {
    const ops: Array<(a: number[][]) => number[][]> = [
      (a) => mirrorVerticalUnion(a),
      (a) => mirrorHorizontalUnion(a),
      (a) => pointSymmetry180Union(a),
      (a) => foldQuadrantUnion(a),
      (a) => coarsenBlock2x2Majority(a),
      (a) => dilateAlive(a),
      (a) => applyRandomRegularPass(a, rng),
    ];
    let x = cloneGrid(g);
    const i1 = randomInt(rng, 0, ops.length - 1);
    let i2 = randomInt(rng, 0, ops.length - 1);
    if (i2 === i1) i2 = (i2 + 1) % ops.length;
    x = ops[i1](x);
    x = ops[i2](x);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return coarsenBlock2x2Majority(x);
  },
  // Regular punch / lattice / add — then symmetrize
  (g, rng) => {
    let x = applyRandomRegularPass(cloneGrid(g), rng);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return coarsenBlock2x2Majority(x);
  },
  (g, rng) => {
    let x = mirrorVerticalUnion(mirrorHorizontalUnion(g));
    x = applyRandomRegularPass(x, rng);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return coarsenBlock2x2Majority(x);
  },
  (g, rng) => {
    let x = applyRandomRegularPass(cloneGrid(g), rng);
    if (rng() < 0.55) {
      x = applyRandomRegularPass(x, rng);
    }
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return coarsenBlock2x2Majority(x);
  },
  (g, rng) => {
    let x = foldQuadrantUnion(g);
    x = applyRandomRegularPass(x, rng);
    return mirrorVerticalUnion(mirrorHorizontalUnion(x));
  },
  (g, rng) => {
    let x = rotateK90(g, randomInt(rng, 0, 3));
    x = applyRandomRegularPass(x, rng);
    x = mirrorVerticalUnion(mirrorHorizontalUnion(x));
    return coarsenBlock2x2Majority(x);
  },
  (g, rng) => {
    let x = pointSymmetry180Union(g);
    x = applyRandomRegularPass(x, rng);
    x = dilateAlive(x);
    return mirrorVerticalUnion(mirrorHorizontalUnion(x));
  },
  // Partitioned regions: random cuts, per-region sym / regular / both / none, optional mirrored copy between parts
  (g, rng) => geometrizePartitionedRandom(cloneGrid(g), rng),
  (g, rng) => {
    let x = geometrizePartitionedRandom(cloneGrid(g), rng);
    if (rng() < 0.5) {
      x = applyRandomRegularPass(x, rng);
    }
    return mirrorVerticalUnion(mirrorHorizontalUnion(x));
  },
  (g, rng) => {
    const x = mirrorVerticalUnion(mirrorHorizontalUnion(g));
    return geometrizePartitionedRandom(x, rng);
  },
];

// ── Result quality: avoid empty, near-full grids, and dominant vertical/horizontal slab patterns ─

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

/**
 * @param rng — inject for tests; defaults to `Math.random` so every click explores a new recipe.
 */
export function geometrizeGridPattern(grid: number[][], rng: GeometrizeRng = Math.random): number[][] {
  if (grid.length === 0 || !(grid[0]?.length ?? 0)) {
    return grid;
  }
  const recipe = RECIPES[Math.floor(rng() * RECIPES.length)] ?? RECIPES[0];
  return recipe(cloneGrid(grid), rng);
}
