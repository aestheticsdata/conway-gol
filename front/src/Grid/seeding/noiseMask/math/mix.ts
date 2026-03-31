import { clamp01 } from "@grid/seeding/noiseMask/math/clamp01";

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}
