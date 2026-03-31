import type { GeometrizeRng } from "@grid/geometrizePattern/types";

export function randomInt(rng: GeometrizeRng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
