import { cloneGrid } from "@grid/geometrizePattern/cloneGrid";
import { coarsenBlock2x2Majority } from "@grid/geometrizePattern/coarsen";
import { randomInt } from "@grid/geometrizePattern/randomInt";
import { applyRandomRegularPass } from "@grid/geometrizePattern/regularPass";
import { mirrorHorizontalUnion, mirrorMainDiagonalUnion, mirrorVerticalUnion } from "@grid/geometrizePattern/symmetry";

import type { GeometrizeRng, Region, RegionOp } from "@grid/geometrizePattern/types";

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

export { geometrizePartitionedRandom };
