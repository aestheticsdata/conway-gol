/**
 * Stochastic geometrization: each click picks a different recipe so results stay
 * varied (symmetries, stripes, diagonals, coarsening, regular punch/add patterns, etc.).
 */

export { geometrizeGridPattern } from "@grid/geometrizePattern/geometrizeGridPattern";
export { isGeometrizeResultAcceptable, softenGeometrizeResult } from "@grid/geometrizePattern/quality";

export type { GeometrizeRng } from "@grid/geometrizePattern/types";
