import { clamp01 } from "@grid/seeding/noiseMask/math/clamp01";

export function smoothstep01(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}
