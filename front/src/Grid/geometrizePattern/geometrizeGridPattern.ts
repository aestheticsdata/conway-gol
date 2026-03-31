import { cloneGrid } from "@grid/geometrizePattern/cloneGrid";
import { RECIPES } from "@grid/geometrizePattern/recipes";

import type { GeometrizeRng } from "@grid/geometrizePattern/types";

/**
 * Stochastic geometrization: each click picks a different recipe so results stay
 * varied (symmetries, stripes, diagonals, coarsening, regular punch/add patterns, etc.).
 *
 * @param rng — inject for tests; defaults to `Math.random` so every click explores a new recipe.
 */
export function geometrizeGridPattern(grid: number[][], rng: GeometrizeRng = Math.random): number[][] {
  if (grid.length === 0 || !(grid[0]?.length ?? 0)) {
    return grid;
  }
  const recipe = RECIPES[Math.floor(rng() * RECIPES.length)] ?? RECIPES[0];
  return recipe(cloneGrid(grid), rng);
}
