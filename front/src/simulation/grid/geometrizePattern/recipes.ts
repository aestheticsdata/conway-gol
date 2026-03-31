import { cloneGrid } from "@grid/geometrizePattern/cloneGrid";
import { coarsenBlock2x2Majority, coarsenBlock3x3Majority } from "@grid/geometrizePattern/coarsen";
import { applyBilateralOrder, dilateAlive, erodeAlive } from "@grid/geometrizePattern/morphology";
import { randomInt } from "@grid/geometrizePattern/randomInt";
import { geometrizePartitionedRandom } from "@grid/geometrizePattern/regions";
import { applyRandomRegularPass } from "@grid/geometrizePattern/regularPass";
import { maskCheckerboard, stripeHorizontalLoose, stripeVerticalLoose } from "@grid/geometrizePattern/stripes";
import {
  foldQuadrantUnion,
  mirrorAntiDiagonalUnion,
  mirrorHorizontalIntersect,
  mirrorHorizontalUnion,
  mirrorMainDiagonalUnion,
  mirrorVerticalIntersect,
  mirrorVerticalUnion,
  pointSymmetry180Union,
  rotateK90,
} from "@grid/geometrizePattern/symmetry";

import type { GeometrizeRng } from "@grid/geometrizePattern/types";

type Recipe = (g: number[][], rng: GeometrizeRng) => number[][];

export const RECIPES: readonly Recipe[] = [
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
