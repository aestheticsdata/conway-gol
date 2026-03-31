import { clamp01 } from "@grid/seeding/noiseMask/math/clamp01";
import { mix } from "@grid/seeding/noiseMask/math/mix";

/** Blends mask samples toward 0.5 — lower `noiseLevel` = flatter / less spatial contrast. */
export function applyNoiseLevelMix(mask: Float32Array, noiseLevel: number): void {
  const t = clamp01(noiseLevel);
  const mid = 0.5;
  for (let i = 0; i < mask.length; i++) {
    mask[i] = mix(mid, mask[i], t);
  }
}
